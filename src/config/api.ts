// API Configuration for ShopperApp
// Replace YOUR_GOOGLE_AI_API_KEY with your actual API key from Google AI Studio

export const API_CONFIG = {
  // Get your API key from: https://makersuite.google.com/app/apikey
  GOOGLE_AI_API_KEY: 'YOUR_GOOGLE_AI_API_KEY',
  
  // Google AI Vision model endpoint
  GOOGLE_AI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  
  // Alternative model with vision capabilities
  GOOGLE_AI_VISION_MODEL: 'gemini-1.5-flash',
  GOOGLE_AI_PRO_MODEL: 'gemini-1.5-pro',
};

export const isConfigured = (): boolean => {
  return API_CONFIG.GOOGLE_AI_API_KEY !== 'YOUR_GOOGLE_AI_API_KEY' && 
         API_CONFIG.GOOGLE_AI_API_KEY.length > 0;
};