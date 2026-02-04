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
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useShopping } from '../store/ShoppingContext';
import { analyzeScannedVideo, isAIConfigured } from '../services/aiService';
import { ScanResult } from '../types';

interface ScannerScreenProps {
  onClose: () => void;
  onScanComplete: (result: ScanResult) => void;
}

export function ScannerScreen({ onClose, onScanComplete }: ScannerScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const { findMatchingListItem } = useShopping();

  useEffect(() => {
    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, []);

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start duration timer
      recordingTimer.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      const video = await cameraRef.current.recordAsync({
        maxDuration: 10, // Max 10 seconds
      });

      // Stop timer
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }

      if (video?.uri) {
        await processVideo(video.uri);
      }
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Error', 'Failed to record video. Please try again.');
    } finally {
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;
    
    try {
      await cameraRef.current.stopRecording();
    } catch (error) {
      console.error('Stop recording error:', error);
    }
    
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
  };

  const processVideo = async (videoUri: string) => {
    setIsProcessing(true);
    
    try {
      const result = await analyzeScannedVideo(videoUri);
      
      if (result.success && result.itemName) {
        // Check if item is on shopping list
        const matchingItem = findMatchingListItem(result.itemName, result.barcode);
        
        if (matchingItem) {
          Alert.alert(
            'Item Found!',
            `"${result.itemName}" matches "${matchingItem.name}" on your list. Mark as purchased?`,
            [
              { text: 'Cancel', style: 'cancel' },
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
              { text: 'Scan Another', style: 'cancel' },
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
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Processing error:', error);
      Alert.alert('Error', 'Failed to process the scan. Please try again.');
    } finally {
      setIsProcessing(false);
    }
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
        mode="video"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          {!isAIConfigured() && (
            <View style={styles.mockBadge}>
              <Text style={styles.mockBadgeText}>Demo Mode</Text>
            </View>
          )}
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
            {isRecording
              ? 'Recording... Rotate the item slowly'
              : 'Position the item in the frame'}
          </Text>
        </View>

        {/* Recording indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>
              Recording: {recordingDuration}s
            </Text>
          </View>
        )}

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
              isRecording && styles.scanButtonRecording,
              isProcessing && styles.scanButtonDisabled,
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
          >
            <View style={[styles.scanButtonInner, isRecording && styles.scanButtonInnerRecording]} />
          </TouchableOpacity>
          <Text style={styles.controlText}>
            {isRecording ? 'Tap to stop' : 'Tap to scan'}
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
  mockBadge: {
    backgroundColor: 'rgba(255, 165, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mockBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  recordingIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 70,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff0000',
    marginRight: 8,
  },
  recordingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
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
  scanButtonRecording: {
    borderColor: '#ff0000',
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
  scanButtonInnerRecording: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: '#ff0000',
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
