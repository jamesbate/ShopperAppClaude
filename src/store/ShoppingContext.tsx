import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { ShoppingItem, ScannedItemMetadata, ScanResult } from '../types';
import { storage } from '../utils/storage';

// State
interface ShoppingState {
  items: ShoppingItem[];
  scannedItems: ScannedItemMetadata[];
  itemHistory: string[];
  isLoading: boolean;
}

// Actions
type ShoppingAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_DATA'; payload: { items: ShoppingItem[]; scannedItems: ScannedItemMetadata[]; itemHistory: string[] } }
  | { type: 'ADD_ITEM'; payload: ShoppingItem }
  | { type: 'UPDATE_ITEM'; payload: ShoppingItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'TOGGLE_ITEM'; payload: string }
  | { type: 'CLEAR_CHECKED' }
  | { type: 'ADD_SCANNED_ITEM'; payload: ScannedItemMetadata }
  | { type: 'ADD_TO_HISTORY'; payload: string };

// Reducer
function shoppingReducer(state: ShoppingState, action: ShoppingAction): ShoppingState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'LOAD_DATA':
      return {
        ...state,
        items: action.payload.items,
        scannedItems: action.payload.scannedItems,
        itemHistory: action.payload.itemHistory,
        isLoading: false,
      };
    
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };
    
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id ? action.payload : item
        ),
      };
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      };
    
    case 'TOGGLE_ITEM':
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload ? { ...item, checked: !item.checked, updatedAt: Date.now() } : item
        ),
      };
    
    case 'CLEAR_CHECKED':
      return {
        ...state,
        items: state.items.filter((item) => !item.checked),
      };
    
    case 'ADD_SCANNED_ITEM': {
      const existingIndex = state.scannedItems.findIndex(
        (i) => (action.payload.barcode && i.barcode === action.payload.barcode) ||
               i.name.toLowerCase() === action.payload.name.toLowerCase()
      );
      
      let newScannedItems: ScannedItemMetadata[];
      if (existingIndex >= 0) {
        newScannedItems = [...state.scannedItems];
        newScannedItems[existingIndex] = { ...newScannedItems[existingIndex], ...action.payload };
      } else {
        newScannedItems = [...state.scannedItems, action.payload];
      }
      
      return { ...state, scannedItems: newScannedItems };
    }
    
    case 'ADD_TO_HISTORY': {
      const lowerName = action.payload.toLowerCase().trim();
      const filtered = state.itemHistory.filter((h) => h.toLowerCase() !== lowerName);
      return {
        ...state,
        itemHistory: [action.payload.trim(), ...filtered].slice(0, 100),
      };
    }
    
    default:
      return state;
  }
}

// Context
interface ShoppingContextType {
  state: ShoppingState;
  addItem: (name: string, quantity?: number, unit?: string) => void;
  updateItem: (item: ShoppingItem) => void;
  removeItem: (id: string) => void;
  toggleItem: (id: string) => void;
  clearChecked: () => void;
  handleScanResult: (result: ScanResult) => void;
  getSuggestions: (query: string) => string[];
  findMatchingListItem: (name: string, barcode?: string) => ShoppingItem | undefined;
}

const ShoppingContext = createContext<ShoppingContextType | undefined>(undefined);

// Provider
interface ShoppingProviderProps {
  children: ReactNode;
}

export function ShoppingProvider({ children }: ShoppingProviderProps) {
  const [state, dispatch] = useReducer(shoppingReducer, {
    items: [],
    scannedItems: [],
    itemHistory: [],
    isLoading: true,
  });

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      dispatch({ type: 'SET_LOADING', payload: true });
      const [items, scannedItems, itemHistory] = await Promise.all([
        storage.getShoppingList(),
        storage.getScannedItems(),
        storage.getItemHistory(),
      ]);
      dispatch({ type: 'LOAD_DATA', payload: { items, scannedItems, itemHistory } });
    }
    loadData();
  }, []);

  // Persist shopping list changes
  useEffect(() => {
    if (!state.isLoading) {
      storage.saveShoppingList(state.items);
    }
  }, [state.items, state.isLoading]);

  // Persist scanned items changes
  useEffect(() => {
    if (!state.isLoading) {
      storage.saveScannedItems(state.scannedItems);
    }
  }, [state.scannedItems, state.isLoading]);

  const addItem = useCallback((name: string, quantity = 1, unit?: string) => {
    const newItem: ShoppingItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      quantity,
      unit,
      checked: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    dispatch({ type: 'ADD_ITEM', payload: newItem });
    dispatch({ type: 'ADD_TO_HISTORY', payload: name });
    storage.addToItemHistory(name);
  }, []);

  const updateItem = useCallback((item: ShoppingItem) => {
    dispatch({ type: 'UPDATE_ITEM', payload: { ...item, updatedAt: Date.now() } });
  }, []);

  const removeItem = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  }, []);

  const toggleItem = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_ITEM', payload: id });
  }, []);

  const clearChecked = useCallback(() => {
    dispatch({ type: 'CLEAR_CHECKED' });
  }, []);

  const handleScanResult = useCallback((result: ScanResult) => {
    if (!result.success || !result.itemName) return;

    // Store the scanned item metadata
    const scannedItem: ScannedItemMetadata = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: result.itemName,
      barcode: result.barcode,
      category: result.category,
      expiryDate: result.expiryDate,
      lastScannedAt: Date.now(),
    };
    dispatch({ type: 'ADD_SCANNED_ITEM', payload: scannedItem });

    // Find and check off matching item from shopping list
    const matchingItem = state.items.find(
      (item) =>
        !item.checked &&
        (item.name.toLowerCase().includes(result.itemName!.toLowerCase()) ||
         result.itemName!.toLowerCase().includes(item.name.toLowerCase()) ||
         (result.barcode && item.barcode === result.barcode))
    );

    if (matchingItem) {
      dispatch({ type: 'TOGGLE_ITEM', payload: matchingItem.id });
    }
  }, [state.items]);

  const getSuggestions = useCallback((query: string): string[] => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return state.itemHistory.filter((item) =>
      item.toLowerCase().includes(lowerQuery)
    ).slice(0, 10);
  }, [state.itemHistory]);

  const findMatchingListItem = useCallback((name: string, barcode?: string): ShoppingItem | undefined => {
    return state.items.find(
      (item) =>
        !item.checked &&
        (item.name.toLowerCase().includes(name.toLowerCase()) ||
         name.toLowerCase().includes(item.name.toLowerCase()) ||
         (barcode && item.barcode === barcode))
    );
  }, [state.items]);

  const value: ShoppingContextType = {
    state,
    addItem,
    updateItem,
    removeItem,
    toggleItem,
    clearChecked,
    handleScanResult,
    getSuggestions,
    findMatchingListItem,
  };

  return (
    <ShoppingContext.Provider value={value}>
      {children}
    </ShoppingContext.Provider>
  );
}

// Hook
export function useShopping() {
  const context = useContext(ShoppingContext);
  if (!context) {
    throw new Error('useShopping must be used within a ShoppingProvider');
  }
  return context;
}
