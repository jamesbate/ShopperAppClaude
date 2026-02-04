import { File } from 'expo-file-system';
import { ScanResult, ItemCategory } from '../types';
import { API_CONFIG, isConfigured } from '../config/api';

// Configuration for AI service using Google AI
interface AIConfig {
  apiKey: string;
  endpoint: string;
  model: string;
}

let aiConfig: AIConfig | null = null;

// Initialize AI configuration from API config
export function initializeAI() {
  if (isConfigured()) {
    aiConfig = {
      apiKey: API_CONFIG.GOOGLE_AI_API_KEY,
      endpoint: API_CONFIG.GOOGLE_AI_ENDPOINT,
      model: API_CONFIG.GOOGLE_AI_VISION_MODEL,
    };
  }
}

export function isAIConfigured(): boolean {
  return aiConfig !== null && aiConfig.apiKey.length > 0;
}

// Extract frames from video for analysis
async function extractFrameFromVideo(videoUri: string): Promise<string | null> {
  // In a production app, you would:
  // 1. Use FFmpeg or a native module to extract frames
  // 2. For this MVP, we'll use the video directly or first frame
  
  try {
    // Create a File instance for the video
    const file = new File(videoUri);
    
    // Check if the file exists
    if (!file.exists) {
      console.error('Video file does not exist:', videoUri);
      return null;
    }
    
    // Read video as base64 (for sending to API)
    // Note: For production, you'd want to compress/extract frames
    const base64 = await file.base64();
    return base64;
  } catch (error) {
    console.error('Error reading video file:', error);
    return null;
  }
}

// Parse AI response to extract structured data
function parseAIResponse(response: string): Partial<ScanResult> {
  const result: Partial<ScanResult> = {};
  
  try {
    // Try to parse as JSON first
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      result.itemName = parsed.itemName || parsed.name || parsed.product;
      result.barcode = parsed.barcode || parsed.upc || parsed.ean;
      result.expiryDate = parsed.expiryDate || parsed.expiry || parsed.bestBefore;
      result.category = parsed.category as ItemCategory;
      result.confidence = parsed.confidence || 0.8;
      return result;
    }
  } catch {
    // JSON parsing failed, try text parsing
  }
  
  // Text-based parsing fallback
  const lines = response.toLowerCase();
  
  // Extract item name
  const nameMatch = response.match(/(?:item|product|name)[\s:]+([^\n,]+)/i);
  if (nameMatch) {
    result.itemName = nameMatch[1].trim();
  }
  
  // Extract barcode
  const barcodeMatch = response.match(/(?:barcode|upc|ean)[\s:]+(\d{8,14})/i);
  if (barcodeMatch) {
    result.barcode = barcodeMatch[1];
  }
  
  // Extract expiry date
  const expiryMatch = response.match(/(?:expiry|expires?|best before|use by)[\s:]+([^\n,]+)/i);
  if (expiryMatch) {
    result.expiryDate = expiryMatch[1].trim();
  }
  
  // Extract category
  const categories: ItemCategory[] = ['dairy', 'meat', 'produce', 'bakery', 'frozen', 'beverages', 'snacks', 'household', 'personal_care'];
  for (const cat of categories) {
    if (lines.includes(cat.replace('_', ' '))) {
      result.category = cat;
      break;
    }
  }
  
  result.confidence = 0.6; // Lower confidence for text parsing
  
  return result;
}

// Main function to analyze a scanned video
export async function analyzeScannedVideo(videoUri: string): Promise<ScanResult> {
  // Check if AI is configured
  if (!isAIConfigured() || !aiConfig) {
    // Return mock result for testing without API
    return createMockResult();
  }
  
  try {
    // Get video/frame data
    const videoData = await extractFrameFromVideo(videoUri);
    if (!videoData) {
      return {
        success: false,
        confidence: 0,
        error: 'Failed to read video file',
      };
    }
    
    // Call Google AI API with their format
    const response = await fetch(`${aiConfig.endpoint}?key=${aiConfig.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this grocery item video/image. Extract and return as JSON:
            {
              "itemName": "product name",
              "barcode": "barcode number if visible", 
              "expiryDate": "expiry date if visible",
              "category": "one of: dairy, meat, produce, bakery, frozen, beverages, snacks, household, personal_care, other",
              "confidence": 0.0-1.0
            }
            If you cannot identify something, omit that field.`
          }, {
            inline_data: {
              mime_type: "video/mp4",
              data: videoData
            }
          }]
        }],
        generationConfig: {
          maxOutputTokens: 300,
          temperature: 0.1,
        }
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    const parsed = parseAIResponse(aiText);
    
    return {
      success: !!parsed.itemName,
      itemName: parsed.itemName,
      barcode: parsed.barcode,
      expiryDate: parsed.expiryDate,
      category: parsed.category,
      confidence: parsed.confidence || 0.5,
      rawResponse: aiText,
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      success: false,
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Mock result for testing without AI API
function createMockResult(): ScanResult {
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

// For manual barcode entry or lookup
export async function lookupBarcode(barcode: string): Promise<ScanResult> {
  // In production, you'd call a barcode database API like:
  // - Open Food Facts (free)
  // - UPC Database
  // - Barcode Lookup API
  
  // For now, return a mock result
  return {
    success: true,
    itemName: `Item (${barcode})`,
    barcode: barcode,
    confidence: 0.7,
  };
}
