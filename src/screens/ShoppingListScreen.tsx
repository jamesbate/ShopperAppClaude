import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShopping } from '../store/ShoppingContext';
import { ShoppingListItem } from '../components/ShoppingListItem';
import { AddItemInput } from '../components/AddItemInput';
import { ScannerScreen } from './ScannerScreen';
import { DebugScreen } from './DebugScreen';
import { ShoppingItem, ScanResult } from '../types';

export function ShoppingListScreen() {
  const { state, addItem, updateItem, removeItem, toggleItem, clearChecked, handleScanResult, getSuggestions } = useShopping();
  const [showScanner, setShowScanner] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('1');

  const uncheckedItems = state.items.filter((item) => !item.checked);
  const checkedItems = state.items.filter((item) => item.checked);

  const handleAddItem = useCallback((name: string, quantity?: number) => {
    addItem(name, quantity);
  }, [addItem]);

  const handleEditPress = useCallback((item: ShoppingItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditQuantity(item.quantity.toString());
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingItem && editName.trim()) {
      updateItem({
        ...editingItem,
        name: editName.trim(),
        quantity: parseInt(editQuantity, 10) || 1,
      });
      setEditingItem(null);
    }
  }, [editingItem, editName, editQuantity, updateItem]);

  const handleRemoveItem = useCallback((item: ShoppingItem) => {
    Alert.alert(
      'Remove Item',
      `Remove "${item.name}" from the list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeItem(item.id) },
      ]
    );
  }, [removeItem]);

  const handleClearChecked = useCallback(() => {
    if (checkedItems.length === 0) return;
    
    Alert.alert(
      'Clear Purchased Items',
      `Remove ${checkedItems.length} purchased item${checkedItems.length > 1 ? 's' : ''} from the list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearChecked },
      ]
    );
  }, [checkedItems.length, clearChecked]);

  const handleScanComplete = useCallback((result: ScanResult) => {
    handleScanResult(result);
  }, [handleScanResult]);

  const renderItem = useCallback(({ item }: { item: ShoppingItem }) => (
    <ShoppingListItem
      item={item}
      onToggle={() => toggleItem(item.id)}
      onRemove={() => handleRemoveItem(item)}
      onEdit={() => handleEditPress(item)}
    />
  ), [toggleItem, handleRemoveItem, handleEditPress]);

  if (state.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Shopping List</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.debugButton}
            onPress={() => setShowDebug(true)}
          >
            <Text style={styles.debugButtonText}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => setShowScanner(true)}
          >
            <Text style={styles.scanButtonText}>Scan</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={uncheckedItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={state.items.length === 0 && styles.emptyListContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyText}>Your shopping list is empty</Text>
            <Text style={styles.emptySubtext}>Add items below or scan products</Text>
          </View>
        }
        ListFooterComponent={
          checkedItems.length > 0 ? (
            <View style={styles.checkedSection}>
              <View style={styles.checkedHeader}>
                <Text style={styles.checkedTitle}>
                  Purchased ({checkedItems.length})
                </Text>
                <TouchableOpacity onPress={handleClearChecked}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              </View>
              {checkedItems.map((item) => (
                <ShoppingListItem
                  key={item.id}
                  item={item}
                  onToggle={() => toggleItem(item.id)}
                  onRemove={() => handleRemoveItem(item)}
                  onEdit={() => handleEditPress(item)}
                />
              ))}
            </View>
          ) : null
        }
      />

      {/* Add Item Input */}
      <AddItemInput onAddItem={handleAddItem} getSuggestions={getSuggestions} />

      {/* Scanner Modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <ScannerScreen
          onClose={() => setShowScanner(false)}
          onScanComplete={handleScanComplete}
        />
      </Modal>

      {/* Debug Modal */}
      <Modal
        visible={showDebug}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setShowDebug(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Debug Database</Text>
            <View style={{ width: 30 }} />
          </View>
          <DebugScreen />
        </SafeAreaView>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={editingItem !== null}
        animationType="fade"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Item</Text>
            
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Item name"
              autoFocus
            />
            
            <Text style={styles.inputLabel}>Quantity</Text>
            <TextInput
              style={styles.modalInput}
              value={editQuantity}
              onChangeText={setEditQuantity}
              placeholder="1"
              keyboardType="number-pad"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditingItem(null)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  emptyListContent: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  checkedSection: {
    marginTop: 16,
    backgroundColor: '#f9f9f9',
  },
  checkedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f0f0f0',
  },
  checkedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  clearText: {
    fontSize: 14,
    color: '#ff5252',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debugButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
});
