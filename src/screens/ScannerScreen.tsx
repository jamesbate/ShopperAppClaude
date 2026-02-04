import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useShopping } from '../store/ShoppingContext';
import { analyzeScannedVideoLocally, createMockScanResult } from '../services/localAiService';
import { ScanResult } from '../types';

interface ScannerScreenProps {
  onClose: () => void;
  onScanComplete: (result: ScanResult) => void;
}

export function ScannerScreen({ onClose, onScanComplete }: ScannerScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedBarcode, setDetectedBarcode] = useState<string | undefined>();
  const [detectedTexts, setDetectedTexts] = useState<string[]>([]);
  const [scanCount, setScanCount] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const lastBarcodeRef = useRef<string>('');
  const { findMatchingListItem } = useShopping();

  useEffect(() => {
    // Auto-process after collecting enough data
    if (scanCount >= 3 && (detectedBarcode || detectedTexts.length > 0)) {
      processCollectedData();
    }
  }, [scanCount, detectedBarcode, detectedTexts]);

  const handleBarcodeScanned = (scanningResult: BarcodeScanningResult) => {
    if (!isScanning || isProcessing) return;
    
    const barcode = scanningResult.data;
    
    // Avoid processing the same barcode multiple times
    if (barcode && barcode !== lastBarcodeRef.current) {
      lastBarcodeRef.current = barcode;
      setDetectedBarcode(barcode);
      setScanCount(prev => prev + 1);
      
      // Provide haptic feedback if available
      console.log('Barcode detected:', barcode);
    }
  };

  const handleManualCapture = () => {
    // User manually triggers capture
    setIsScanning(false);
    processCollectedData();
  };

  const processCollectedData = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setIsScanning(false);
    
    try {
      // Use local AI processing with collected data
      const result = await analyzeScannedVideoLocally(
        '', // No video file needed for local processing
        detectedBarcode,
        detectedTexts
      );
      
      if (result.success && result.itemName) {
        // Check if item is on shopping list
        const matchingItem = findMatchingListItem(result.itemName, result.barcode);
        
        if (matchingItem) {
          Alert.alert(
            'Item Found!',
            `"${result.itemName}" matches "${matchingItem.name}" on your list. Mark as purchased?`,
            [
              { 
                text: 'Scan Another', 
                style: 'cancel',
                onPress: resetScan
              },
              {
                text: 'Yes',
                onPress: () => {
                  onScanComplete(result);
                  onClose();
                },
              },
            ]
          );
        } else {
          Alert.alert(
            'Item Scanned',
            `Identified: ${result.itemName}${result.expiryDate ? `\nExpiry: ${result.expiryDate}` : ''}${result.barcode ? `\nBarcode: ${result.barcode}` : ''}`,
            [
              { 
                text: 'Scan Another', 
                style: 'cancel',
                onPress: resetScan
              },
              {
                text: 'Done',
                onPress: () => {
                  onScanComplete(result);
                  onClose();
                },
              },
            ]
          );
        }
      } else {
        Alert.alert(
          'Scan Failed',
          result.error || 'Could not identify the item. Please try again with better lighting or angle.',
          [{ 
            text: 'Try Again',
            onPress: resetScan
          }]
        );
      }
    } catch (error) {
      console.error('Processing error:', error);
      Alert.alert('Error', 'Failed to process the scan. Please try again.', [
        { text: 'Try Again', onPress: resetScan }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScan = () => {
    setDetectedBarcode(undefined);
    setDetectedTexts([]);
    setScanCount(0);
    lastBarcodeRef.current = '';
    setIsScanning(true);
    setIsProcessing(false);
  };

  // Permission handling
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to scan items and read barcodes.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: [
            'qr',
            'ean13',
            'ean8',
            'upc_a',
            'upc_e',
            'code39',
            'code93',
            'code128',
            'itf14',
          ],
        }}
        onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.localBadge}>
            <Text style={styles.localBadgeText}>Local AI</Text>
          </View>
        </View>

        {/* Guide overlay */}
        <View style={styles.guideContainer}>
          <View style={styles.guideBox}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.guideText}>
            {isProcessing
              ? 'Processing...'
              : isScanning
              ? 'Point camera at barcode or product label'
              : 'Scan complete'}
          </Text>
          
          {/* Status indicator */}
          {isScanning && !isProcessing && (
            <View style={styles.statusContainer}>
              {detectedBarcode && (
                <Text style={styles.statusText}>✓ Barcode detected</Text>
              )}
              <Text style={styles.statusSubtext}>
                Collecting data... ({scanCount}/3)
              </Text>
            </View>
          )}
        </View>

        {/* Processing overlay */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.processingText}>Analyzing item...</Text>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[
              styles.scanButton,
              isProcessing && styles.scanButtonDisabled,
              detectedBarcode && styles.scanButtonSuccess,
            ]}
            onPress={handleManualCapture}
            disabled={isProcessing || (!detectedBarcode && detectedTexts.length === 0)}
          >
            <View style={[
              styles.scanButtonInner,
              detectedBarcode && styles.scanButtonInnerSuccess
            ]} />
          </TouchableOpacity>
          <Text style={styles.controlText}>
            {isProcessing 
              ? 'Processing...' 
              : detectedBarcode 
              ? 'Tap to finish' 
              : 'Scanning...'}
          </Text>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  localBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  localBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statusContainer: {
    marginTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  statusSubtext: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  guideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideBox: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#4CAF50',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  guideText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
  },
  controls: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  scanButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  scanButtonSuccess: {
    borderColor: '#4CAF50',
  },
  scanButtonDisabled: {
    opacity: 0.5,
  },
  scanButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  scanButtonInnerSuccess: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
  },
  controlText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 12,
  },
  closeButtonText: {
    color: '#999',
    fontSize: 16,
  },
});
