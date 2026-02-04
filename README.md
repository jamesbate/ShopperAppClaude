# Shopper App - MVP Complete

A React Native grocery shopping assistant app built with Expo that combines a shopping list with AI-powered camera scanning.

## Current Status

MVP Complete - Core shopping list and scanning features implemented  
Ready for Testing - Runs on Android devices  
Scalable Architecture - Foundation laid for future features  

## Features Built

### Shopping List
- Add Items: Supports quantity prefixes (e.g., "2 milk") or suffixes (e.g., "bread x3")
- Edit & Remove: Full CRUD operations on list items
- Toggle Purchased: Mark items as bought with visual feedback
- Smart Autocomplete: Suggestions from previous items as you type
- Persistent Storage: Local data persistence using AsyncStorage
- Clear Completed: Bulk remove all purchased items

### Camera Scanning with Local AI
- Real-time Barcode Scanning: Uses on-device barcode detection (no internet needed)
- Visual Guide: Overlay guides for optimal item positioning
- Live Detection: Shows when barcodes are successfully detected
- Permission Handling: Proper camera permissions
- Instant Feedback: Processing indicators and success/failure notifications

### AI Integration (Local On-Device)
- Local Processing: All AI runs on your phone (no internet or API keys required)
- Barcode Detection: Supports EAN-13, UPC-A, QR codes, and 9 other formats
- Text Recognition: Extracts expiry dates from product labels
- Item Categorization: Automatically categorizes items (dairy, meat, produce, etc.)
- Privacy-First: No data sent to external servers

### Auto-Match System
- Smart Matching: Scanned items automatically match against shopping list
- Auto-Complete: Matching items are marked as purchased
- Fallback: Manual confirmation if multiple matches or low confidence

## Architecture

```
src/
├── components/      # Reusable UI components
│   ├── ShoppingListItem.tsx
│   └── AddItemInput.tsx
├── screens/         # Full screen views
│   ├── ShoppingListScreen.tsx
│   └── ScannerScreen.tsx
├── store/          # State management
│   └── ShoppingContext.tsx
├── services/       # External integrations
│   └── aiService.ts
├── types/          # TypeScript definitions
│   └── index.ts
└── utils/          # Storage and helpers
    └── storage.ts
```

## Getting Started

### Prerequisites
- Node.js (v18+) and npm
- Android Studio & Android Emulator (or physical Android device)
- Expo Go app (for testing on device)

### Installation & Running
```bash
# Install dependencies
npm install

# Start development server
npm start

# Or run directly on Android
npm run android
```

### Testing the App
1. Shopping List: Add items like "milk", "2 eggs", "bread x3"
2. Camera Scanning: Tap "Scan" button to open camera
3. Point at Barcode: Aim camera at any product barcode
4. Auto-Detect: App will detect barcode and identify item
5. Auto-Match: Scanned items are matched against your list

## Local AI Processing

### How It Works
The app uses **local on-device AI** - no internet connection required!

- ✅ **Barcode Scanner**: Built-in Expo barcode detection
- ✅ **Text Recognition**: Pattern-based expiry date extraction
- ✅ **Smart Categorization**: Rule-based item classification
- ✅ **Privacy-First**: All processing happens on your device

See [LOCAL_AI_SETUP.md](./LOCAL_AI_SETUP.md) for detailed information.

### Optional: Cloud AI (Advanced)
For enhanced accuracy, you can enable cloud-based AI (requires API key):

```typescript
// Add to App.tsx after imports
import { configureAI } from './src/services';

configureAI({ 
  apiKey: 'your-google-ai-key', 
  endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent' 
});
```

## Future Features Ready for Implementation

The architecture supports easy addition of:

### Sharing Features
- Multi-user shopping lists
- Group management and permissions
- Real-time synchronization

### Finance Tracking
- Price capture during scanning
- Shopping analytics by category
- Expense history and trends

### Expiry Management
- Expiry date tracking and alerts
- Notification system
- Food waste reduction insights

### Recipe Suggestions
- Meal planning based on available items
- Smart recommendations before expiry

## Technical Stack

- React Native with Expo SDK 54
- TypeScript for type safety
- Context API for state management
- AsyncStorage for local persistence
- Expo Camera with barcode scanning
- Expo Barcode Scanner for on-device detection
- Local AI processing (no external dependencies)

## Development Status

- TypeScript compilation passes
- Expo development server starts successfully  
- Android emulator launches correctly
- All core features implemented and functional
- Scalable foundation for future features
- Ready for production deployment or further development

---

Built with React Native & Expo