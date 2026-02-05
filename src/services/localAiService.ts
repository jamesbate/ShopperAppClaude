import { ScanResult, ItemCategory } from '../types';
import * as FileSystem from 'expo-file-system';

// Local AI service using on-device barcode scanning and OCR
// No internet connection required

interface BarcodeData {
  type: string;
  data: string;
}

interface TextBlock {
  text: string;
  bounds?: { x: number; y: number; width: number; height: number };
}

// Extract frames from video for local processing
async function extractFramesFromVideo(videoUri: string): Promise<string[]> {
  try {
    // For now, we'll use the video file directly
    // In a more advanced implementation, you would extract multiple frames
    const base64 = await FileSystem.readAsStringAsync(videoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    return [base64];
  } catch (error) {
    console.error('Error reading video file:', error);
    return [];
  }
}

// Detect barcodes in image using Expo Barcode Scanner
// Note: This will be called from the camera screen in real-time
export async function detectBarcodesInFrame(frame: string): Promise<BarcodeData[]> {
  // This function will be replaced with actual barcode detection
  // For now, it returns empty array - actual detection happens in camera view
  return [];
}

// Extract text from image using local OCR
async function extractTextFromFrame(frame: string): Promise<TextBlock[]> {
  // This would use a local OCR library
  // For React Native, options include:
  // 1. react-native-text-recognition (ML Kit)
  // 2. react-native-tesseract-ocr
  
  // Placeholder for now - will be implemented with actual OCR
  return [];
}

// Parse expiry date from OCR text
function parseExpiryDate(textBlocks: TextBlock[]): string | undefined {
  const allText = textBlocks.map(b => b.text).join(' ');
  
  // Common expiry date patterns
  const patterns = [
    // DD/MM/YYYY or DD-MM-YYYY
    /(?:exp|expiry|best before|use by)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    // MM/YYYY
    /(?:exp|expiry|best before|use by)[\s:]*(\d{1,2}[\/\-]\d{2,4})/i,
    // YYYY-MM-DD (ISO format)
    /(\d{4}-\d{2}-\d{2})/,
    // DD MMM YYYY (e.g., 15 Jan 2024)
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i,
  ];
  
  for (const pattern of patterns) {
    const match = allText.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  
  return undefined;
}

// Categorize item based on product name or barcode
function categorizeItem(itemName?: string, barcode?: string): ItemCategory {
  if (!itemName) return 'other';
  
  const name = itemName.toLowerCase();
  
  // Dairy products
  if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') || 
      name.includes('butter') || name.includes('cream')) {
    return 'dairy';
  }
  
  // Meat products
  if (name.includes('chicken') || name.includes('beef') || name.includes('pork') || 
      name.includes('meat') || name.includes('fish') || name.includes('salmon')) {
    return 'meat';
  }
  
  // Produce
  if (name.includes('apple') || name.includes('banana') || name.includes('orange') || 
      name.includes('vegetable') || name.includes('fruit') || name.includes('lettuce') ||
      name.includes('tomato') || name.includes('potato')) {
    return 'produce';
  }
  
  // Bakery
  if (name.includes('bread') || name.includes('bun') || name.includes('cake') || 
      name.includes('pastry') || name.includes('bagel')) {
    return 'bakery';
  }
  
  // Frozen
  if (name.includes('frozen') || name.includes('ice cream')) {
    return 'frozen';
  }
  
  // Beverages
  if (name.includes('juice') || name.includes('soda') || name.includes('water') || 
      name.includes('drink') || name.includes('tea') || name.includes('coffee')) {
    return 'beverages';
  }
  
  // Snacks
  if (name.includes('chips') || name.includes('cookie') || name.includes('snack') || 
      name.includes('candy') || name.includes('chocolate')) {
    return 'snacks';
  }
  
  // Household
  if (name.includes('detergent') || name.includes('soap') || name.includes('cleaner') || 
      name.includes('paper') || name.includes('tissue')) {
    return 'household';
  }
  
  // Personal care
  if (name.includes('shampoo') || name.includes('toothpaste') || name.includes('deodorant')) {
    return 'personal_care';
  }
  
  return 'other';
}

// Main function to analyze a scanned video using local AI
export async function analyzeScannedVideoLocally(
  videoUri: string,
  detectedBarcode?: string,
  detectedTexts?: string[]
): Promise<ScanResult> {
  try {
    // Process the collected data
    let itemName: string | undefined;
    let expiryDate: string | undefined;
    let barcode = detectedBarcode;
    
    // Try to determine item name from detected texts
    if (detectedTexts && detectedTexts.length > 0) {
      // Filter out short texts and numbers-only strings
      const meaningfulTexts = detectedTexts.filter(
        text => text.length > 3 && !/^\d+$/.test(text)
      );
      
      if (meaningfulTexts.length > 0) {
        // Use the longest text as potential item name
        itemName = meaningfulTexts.reduce((a, b) => a.length > b.length ? a : b);
      }
      
      // Try to find expiry date in texts
      const textBlocks: TextBlock[] = detectedTexts.map(text => ({ text }));
      expiryDate = parseExpiryDate(textBlocks);
    }
    
    // If we have a barcode but no item name, try to look it up
    if (barcode && !itemName) {
      // In a real app, you would query a local database or offline barcode database
      // For now, we'll use a placeholder
      itemName = `Product (${barcode})`;
    }
    
    // Categorize the item
    const category = categorizeItem(itemName, barcode);
    
    // Calculate confidence based on what we detected
    let confidence = 0.5;
    if (barcode) confidence += 0.3;
    if (itemName && itemName.length > 5) confidence += 0.2;
    if (expiryDate) confidence += 0.1;
    
    if (!itemName && !barcode) {
      return {
        success: false,
        confidence: 0,
        error: 'Could not identify the item. Please try again with better lighting or angle.',
      };
    }
    
    return {
      success: true,
      itemName,
      barcode,
      expiryDate,
      category,
      confidence: Math.min(confidence, 1.0),
    };
  } catch (error) {
    console.error('Local AI analysis error:', error);
    return {
      success: false,
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Mock result for initial testing
export function createMockScanResult(): ScanResult {
  const mockItems = [
    { name: 'Whole Milk', category: 'dairy' as ItemCategory, barcode: '0123456789012' },
    { name: 'Bread Loaf', category: 'bakery' as ItemCategory, barcode: '0123456789013' },
    { name: 'Organic Apples', category: 'produce' as ItemCategory },
    { name: 'Chicken Breast', category: 'meat' as ItemCategory, barcode: '0123456789014' },
    { name: 'Orange Juice', category: 'beverages' as ItemCategory, barcode: '0123456789015' },
  ];
  
  const randomItem = mockItems[Math.floor(Math.random() * mockItems.length)];
  
  // Generate a fake expiry date 7-30 days from now
  const expiryDays = 7 + Math.floor(Math.random() * 23);
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryDays);
  
  return {
    success: true,
    itemName: randomItem.name,
    barcode: randomItem.barcode,
    category: randomItem.category,
    expiryDate: expiryDate.toISOString().split('T')[0],
    confidence: 0.85,
  };
}

// For manual barcode entry or lookup (offline)
export async function lookupBarcodeLocally(barcode: string): Promise<ScanResult> {
  // In production, you would:
  // 1. Query a local SQLite database of barcodes
  // 2. Use an offline barcode database
  // 3. Return cached data from previous scans
  
  return {
    success: true,
    itemName: `Product (${barcode})`,
    barcode: barcode,
    confidence: 0.6,
    category: 'other',
  };
}
