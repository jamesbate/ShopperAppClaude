import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ShoppingItem } from '../types';

interface ShoppingListItemProps {
  item: ShoppingItem;
  onToggle: () => void;
  onRemove: () => void;
  onEdit: () => void;
}

export function ShoppingListItem({ item, onToggle, onRemove, onEdit }: ShoppingListItemProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.checkboxArea} onPress={onToggle}>
        <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
          {item.checked && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.content} onPress={onEdit}>
        <Text style={[styles.name, item.checked && styles.nameChecked]}>
          {item.name}
        </Text>
        {item.quantity > 1 && (
          <Text style={styles.quantity}>
            x{item.quantity} {item.unit || ''}
          </Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
        <Text style={styles.removeText}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  checkboxArea: {
    padding: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    color: '#333',
  },
  nameChecked: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  quantity: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  removeText: {
    fontSize: 24,
    color: '#ff5252',
    fontWeight: '300',
  },
});
