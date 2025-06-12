/**
 * Application Configuration
 * 
 * This file is the SINGLE SOURCE OF TRUTH for all application configuration.
 * All other files should reference this configuration object.
 * 
 * In development, values are read from window.ENV which is populated in HTML files.
 * In production, these values should be injected during the build process.
 */

/**
 * Initialize and validate the application configuration
 */
function initializeConfig() {
  // Ensure window.ENV exists
  if (!window.ENV) {
    console.error('ERROR: window.ENV is not defined. Configuration will use defaults.');
    window.ENV = {};
  }
  
  // Create the AppConfig object
  window.AppConfig = {
    // Environment
    env: window.ENV.NODE_ENV || 'development',
    version: '1.0.0',
    buildTime: new Date().toISOString(),
    debug: window.ENV.DEBUG === 'true' || false,
    
    // API Configuration
    api: {
      baseUrl: window.ENV.API_BASE_URL || 'https://dmp-apim.azure-api.net',
      endpoints: {
        health: '/health',
        analyze: '/api/dmp/enriched-checklists/analyze',
        status: '/api/dmp/enriched-checklists/run/',
        results: '/api/dmp/enriched-checklists/results/',
        checklists: '/api/dmp/checklists',
        feedback: '/api/dmp/feedback',
        resultsFeedback: '/api/dmp/results-feedback'
      },
      timeout: parseInt(window.ENV.API_TIMEOUT || '30000', 10),
      retries: parseInt(window.ENV.API_RETRIES || '3', 10)
    },
    
    // Auth Configuration
    auth: {
      proxyUrl: window.ENV.AUTH_PROXY_URL || 'https://dmp-token-proxy.azurewebsites.net',
      tokenEndpoint: window.ENV.AUTH_PROXY_TOKEN_ENDPOINT || '/token',
      clientId: window.ENV.AZURE_CLIENT_ID || '2e93d7f3-7e47-4767-ac3b-9f19e9e57784',
      tenantId: window.ENV.AZURE_TENANT_ID || 'f592cb5f-b8bc-41b9-901f-9a99ab84afa6',
      apiScope: window.ENV.AZURE_API_SCOPE || 'api://2fb1d88c-02fe-4a8e-9f8d-dadbc9380dc3/.default'
    },
    
    // UI Configuration
    ui: {
      debug: window.ENV.UI_DEBUG === 'true',
      showApiStatus: window.ENV.SHOW_API_STATUS === 'true',
      defaultChecklistId: window.ENV.DEFAULT_CHECKLIST_ID || 'finnish_dmp_evaluation'
    }
  };
  
  // Apply environment-specific overrides
  if (isProduction()) {
    // Production settings
    window.AppConfig.env = 'production';
    window.AppConfig.debug = false;
    
    // Explicitly set UI flags for production
    window.AppConfig.ui.debug = false;
    window.AppConfig.ui.showApiStatus = false;
  } else {
    // Development defaults if not explicitly set
    if (window.AppConfig.ui.debug === undefined) window.AppConfig.ui.debug = true;
    if (window.AppConfig.ui.showApiStatus === undefined) window.AppConfig.ui.showApiStatus = true;
  }
  
  // Log configuration in development
  if (window.AppConfig.env === 'development' || window.AppConfig.debug) {
    console.log('Application Configuration:', window.AppConfig);
  }
  
  return window.AppConfig;
}

/**
 * Detect if we're running in a production environment
 * @returns {boolean} True if in production
 */
function isProduction() {
  return window.location.hostname !== 'localhost' && 
         window.location.hostname !== '127.0.0.1' &&
         !window.location.hostname.includes('ngrok.io');
}

// Initialize configuration immediately when this script loads
initializeConfig();
