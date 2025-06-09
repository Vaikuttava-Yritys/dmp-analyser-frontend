/**
 * Application Configuration
 * 
 * This file contains environment-specific configuration for the application.
 * In production, these values are automatically set based on the deployment environment.
 * 
 * IMPORTANT: When deploying to production, ensure this file is included in the build.
 */

// Toggle this flag to use production API in development mode
const useProductionApi = true;

// Default configuration (development)
const config = {
  // Environment
  env: 'development',
  version: '1.0.0',
  buildTime: new Date().toISOString(),
  
  // API Configuration
  api: {
    baseUrl: useProductionApi ? 'https://reproai-app.lemondune-e106e75a.westeurope.azurecontainerapps.io' : 'http://localhost:8002',
    endpoints: {
      health: '/health',
      analyze: '/api/dmp/enriched-checklists/analyze',
      status: '/api/dmp/enriched-checklists/run/',
      results: '/api/dmp/enriched-checklists/access/',
      checklists: '/api/dmp/checklists/',
    },
    timeout: 30000, // 30 seconds
    retries: 3
  },
  
  // UI Configuration
  ui: {
    debug: true,
    showApiStatus: true,
    defaultChecklistId: 'finnish_dmp_evaluation'
  }
};

// Production environment detection
const isProduction = () => {
  return window.location.hostname !== 'localhost' && 
         window.location.hostname !== '127.0.0.1' &&
         !window.location.hostname.includes('ngrok.io');
};

// Production overrides
if (isProduction()) {
  config.env = 'production';
  config.api.baseUrl = 'https://reproai-app.lemondune-e106e75a.westeurope.azurecontainerapps.io';
  config.ui.debug = false;
  config.ui.showApiStatus = false;
}

// Log configuration in development
if (config.env === 'development') {
  console.log('Application Configuration:', config);
}

// Make config available globally
window.AppConfig = config;
