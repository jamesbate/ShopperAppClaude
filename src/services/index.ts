// Cloud-based AI service (requires internet & API key)
export { configureAI, isAIConfigured, analyzeScannedVideo, lookupBarcode } from './aiService';

// Local on-device AI service (no internet required)
export { 
  analyzeScannedVideoLocally, 
  createMockScanResult, 
  lookupBarcodeLocally,
  detectBarcodesInFrame
} from './localAiService';
