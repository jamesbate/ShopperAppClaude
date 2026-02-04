import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShoppingItem, ScannedItemMetadata } from '../types';

const STORAGE_KEYS = {
  SHOPPING_LIST: '@shopper/shopping_list',
  SCANNED_ITEMS: '@shopper/scanned_items',
  ITEM_HISTORY: '@shopper/item_history',
} as const;

export const storage = {
  // Shopping List operations
  async getShoppingList(): Promise<ShoppingItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SHOPPING_LIST);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading shopping list:', error);
      return [];
    }
  },

  async saveShoppingList(items: ShoppingItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving shopping list:', error);
    }
  },

  // Scanned Items Metadata operations
  async getScannedItems(): Promise<ScannedItemMetadata[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SCANNED_ITEMS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading scanned items:', error);
      return [];
    }
  },

  async saveScannedItems(items: ScannedItemMetadata[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SCANNED_ITEMS, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving scanned items:', error);
    }
  },

  async addOrUpdateScannedItem(item: ScannedItemMetadata): Promise<void> {
    const items = await this.getScannedItems();
    const existingIndex = items.findIndex(
      (i) => (item.barcode && i.barcode === item.barcode) || i.name.toLowerCase() === item.name.toLowerCase()
    );
    
    if (existingIndex >= 0) {
      items[existingIndex] = { ...items[existingIndex], ...item, lastScannedAt: Date.now() };
    } else {
      items.push(item);
    }
    
    await this.saveScannedItems(items);
  },

  async findItemByBarcode(barcode: string): Promise<ScannedItemMetadata | null> {
    const items = await this.getScannedItems();
    return items.find((i) => i.barcode === barcode) || null;
  },

  // Item History for autocomplete
  async getItemHistory(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ITEM_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading item history:', error);
      return [];
    }
  },

  async addToItemHistory(itemName: string): Promise<void> {
    try {
      const history = await this.getItemHistory();
      const lowerName = itemName.toLowerCase().trim();
      
      // Remove if exists and add to front (most recent)
      const filtered = history.filter((h) => h.toLowerCase() !== lowerName);
      const updated = [itemName.trim(), ...filtered].slice(0, 100); // Keep last 100 items
      
      await AsyncStorage.setItem(STORAGE_KEYS.ITEM_HISTORY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating item history:', error);
    }
  },

  // Clear all data (for testing/reset)
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};
