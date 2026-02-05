import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useShopping } from '../store/ShoppingContext';

export function DebugScreen() {
  const { state } = useShopping();

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🔍 Debug Database</Text>
      
      {/* Shopping List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shopping List ({state.items.length})</Text>
        {state.items.map((item) => (
          <View key={item.id} style={styles.item}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDetails}>
              Qty: {item.quantity} {item.unit || ''} | ✅ {item.checked ? 'Yes' : 'No'}
            </Text>
            <Text style={styles.timestamp}>
              Created: {formatTimestamp(item.createdAt)}
            </Text>
          </View>
        ))}
      </View>

      {/* Scanned Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scanned Items ({state.scannedItems.length})</Text>
        {state.scannedItems.map((item) => (
          <View key={item.id} style={styles.item}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDetails}>
              📊 {item.category || 'No category'} | 📅 {item.expiryDate || 'No expiry'}
            </Text>
            {item.barcode && (
              <Text style={styles.barcode}>🔹 {item.barcode}</Text>
            )}
            <Text style={styles.timestamp}>
              Last scanned: {formatTimestamp(item.lastScannedAt)}
            </Text>
          </View>
        ))}
      </View>

      {/* Item History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Item History ({state.itemHistory.length})</Text>
        {state.itemHistory.slice(0, 20).map((item, index) => (
          <Text key={index} style={styles.historyItem}>
            {index + 1}. {item}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#4CAF50',
  },
  item: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  barcode: {
    fontSize: 12,
    color: '#007AFF',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  historyItem: {
    fontSize: 14,
    color: '#555',
    paddingVertical: 2,
  },
});