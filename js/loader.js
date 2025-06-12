/**
 * DMP Analyser Script Loader
 * 
 * This file handles loading all required scripts in the correct order
 * and ensures no duplicate script loading occurs.
 * 
 * @version 1.1.0
 * @updated 2025-06-12
 */

// Prevent double-loading of scripts
window.DMP_SCRIPTS_LOADED = window.DMP_SCRIPTS_LOADED || {};

// Clear any existing global variables that might cause conflicts
if (typeof window.ApiClient !== 'undefined') delete window.ApiClient;
if (typeof window.apiClient !== 'undefined') delete window.apiClient;
if (typeof window.config !== 'undefined') delete window.config;

// Default environment configuration - minimal defaults that will be overridden
// Sensitive values should be loaded from server-side or injected in HTML
window.ENV = window.ENV || {
  AUTH_PROXY_URL: '/auth',
  AUTH_PROXY_TOKEN_ENDPOINT: '/token'
};

// App version for cache busting
window.DMP_LOADER = window.DMP_LOADER || {};
window.DMP_LOADER.APP_VERSION = '1.1.0';

/**
 * Promise-based script loader
 * @param {string} url - The URL of the script to load
 * @param {boolean} [addVersion=true] - Whether to add version for cache busting
 * @returns {Promise} - Resolves when script is loaded, rejects on error
 */
function loadScript(url, addVersion = true) {
  // Add cache-busting version parameter if needed
  const scriptUrl = addVersion ? `${url}?v=${window.DMP_LOADER.APP_VERSION}` : url;
  
  // Return immediately if already loaded
  if (window.DMP_SCRIPTS_LOADED[scriptUrl]) {
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = scriptUrl;
    
    // Handle script loading events
    script.onload = () => {
      window.DMP_SCRIPTS_LOADED[scriptUrl] = true;
      resolve();
    };
    
    script.onerror = () => {
      const error = new Error(`Failed to load script: ${url}`);
      console.error(error);
      reject(error);
    };
    
    document.head.appendChild(script);
  });
}

/**
 * Load core scripts in the correct order using async/await pattern
 * @returns {Promise} - Resolves when all core scripts are loaded
 */
async function loadCoreScripts() {
  try {
    await loadScript('js/config.js');
    await loadScript('js/auth.js');
    await loadScript('js/api.js');
    return true;
  } catch (error) {
    console.error('Error loading core scripts:', error);
    return false;
  }
}

/**
 * Initialize the application with required scripts
 * @param {Object} options - Configuration options
 * @param {boolean} [options.loadAppJs=true] - Whether to load app.js
 * @param {boolean} [options.loadInitJs=true] - Whether to load init.js
 * @param {Function} [options.callback] - Callback to run after initialization
 * @returns {Promise} - Resolves when initialization is complete
 */
async function initApp(options = {}) {
  const {
    loadAppJs = true,
    loadInitJs = true,
    callback = null
  } = options;
  
  try {
    console.log('Initializing application...');
    
    // Load core scripts first
    await loadCoreScripts();
    console.log('Core scripts loaded');
    
    // Load app.js if needed
    if (loadAppJs) {
      await loadScript('app.js');
      console.log('App script loaded');
    }
    
    // Load init.js if needed
    if (loadInitJs) {
      await loadScript('js/init.js');
      console.log('Init script loaded');
    }
    
    // Execute callback if provided (highest priority)
    if (typeof callback === 'function') {
      console.log('Running provided callback function');
      await callback();
    }
    // Otherwise, execute page-specific initialization if available
    else if (typeof window.initializePageContent === 'function') {
      console.log('Running page-specific initialization');
      await window.initializePageContent();
    }
    
    console.log('Application initialization complete');
    return true;
  } catch (error) {
    console.error('Error initializing application:', error);
    throw error; // Rethrow to allow proper error handling in the caller
  }
}

// Make functions globally available
window.DMP_LOADER = {
  loadScript,
  loadCoreScripts,
  initApp
};
