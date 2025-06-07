/**
 * Application Configuration
 * 
 * This file contains environment-specific configuration for the application.
 * In production, these values can be overridden by setting environment variables
 * or by replacing this file during the build process.
 */

// Default configuration (development)
const config = {
  // Environment
  env: 'development',
  
  // API Configuration
  api: {
    baseUrl: 'http://localhost:8002',
    endpoints: {
      health: '/health',
      // Add other API endpoints here
    }
  },
  
  // UI Configuration
  ui: {
    debug: true,
    // Add other UI-specific settings here
  }
};

// Production overrides
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  config.env = 'production';
  config.api.baseUrl = 'https://reproai-app.lemondune-e106e75a.westeurope.azurecontainerapps.io';
  config.ui.debug = false;
}

// Log configuration in development
if (config.env === 'development') {
  console.log('Application Configuration:', config);
}

// Make config available globally
window.AppConfig = config;
