// Core data types for the Shopper app

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  checked: boolean;
  barcode?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ScannedItemMetadata {
  id: string;
  barcode?: string;
  name: string;
  category?: ItemCategory;
  expiryDate?: string;
  imageUri?: string;
  lastScannedAt: number;
  price?: number;
  // Future: additional metadata fields
}

export type ItemCategory = 
  | 'dairy'
  | 'meat'
  | 'produce'
  | 'bakery'
  | 'frozen'
  | 'beverages'
  | 'snacks'
  | 'household'
  | 'personal_care'
  | 'other';

export interface ScanResult {
  success: boolean;
  itemName?: string;
  barcode?: string;
  expiryDate?: string;
  category?: ItemCategory;
  confidence: number;
  rawResponse?: string;
  error?: string;
}

export interface AppState {
  shoppingList: ShoppingItem[];
  scannedItems: ScannedItemMetadata[];
  itemHistory: string[]; // For autocomplete suggestions
}

// Future: Types for sharing, finance, and expiry management
export interface User {
  id: string;
  name: string;
  email?: string;
}

export interface Group {
  id: string;
  name: string;
  members: User[];
}
