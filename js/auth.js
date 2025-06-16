/**
 * Authentication Module for Client Credentials Flow
 * 
 * This module handles Azure AD authentication for the application to access APIs
 * without user interaction (client credentials flow) via a secure backend proxy.
 * 
 * In development mode, it can bypass token authentication for easier local testing.
 */

// Token handling - using closure for better security
const tokenManager = (function() {
  // Private variables not accessible from outside this closure
  let cachedToken = null;
  let tokenExpiration = null;
  let fetchingToken = null;
  
  return {
    getToken: function() {
      return cachedToken && tokenExpiration > Date.now() ? cachedToken : null;
    },
    setToken: function(token, expiresIn) {
      cachedToken = token;
      // Set expiration 5 minutes earlier than actual to be safe
      tokenExpiration = Date.now() + ((expiresIn - 300) * 1000);
    },
    clearToken: function() {
      cachedToken = null;
      tokenExpiration = null;
    },
    isTokenFetching: function() {
      return fetchingToken !== null;
    },
    setTokenFetching: function(promise) {
      fetchingToken = promise;
    },
    getTokenFetching: function() {
      return fetchingToken;
    },
    clearTokenFetching: function() {
      fetchingToken = null;
    }
  };
})();

/**
 * Validates the auth configuration
 * @returns {boolean} - True if configuration is valid
 * @private
 */
function validateAuthConfig() {
  // Use window.AppConfig which is the single source of truth for configuration
  if (!window.AppConfig || !window.AppConfig.auth) {
    console.error('Auth configuration is missing. Make sure AppConfig.auth is defined.');
    return false;
  }
  
  const { proxyUrl, tokenEndpoint } = window.AppConfig.auth;
  
  if (!proxyUrl) {
    console.error('Auth proxy URL is missing. Check your configuration.');
    return false;
  }
  
  if (!tokenEndpoint) {
    console.error('Token endpoint is missing. Check your configuration.');
    return false;
  }
  
  // Ensure proxyUrl has protocol
  if (!proxyUrl.startsWith('http://') && !proxyUrl.startsWith('https://')) {
    console.error('Auth proxy URL must include protocol (http:// or https://)');
    return false;
  }
  
  // Ensure tokenEndpoint starts with /
  if (!tokenEndpoint.startsWith('/')) {
    console.error('Token endpoint should start with /');
    return false;
  }
  
  return true;
}

/**
 * Fetches a fresh token from the auth proxy with retry logic
 * @returns {Promise<string>} - Promise resolving to the access token
 * @private
 */
async function fetchToken() {
  // If there's already a request in flight, return that promise
  if (tokenManager.isTokenFetching()) {
    // Don't log sensitive token operations in production
    if (window.AppConfig && window.AppConfig.debug) {
      console.log('Token request already in progress, reusing promise');
    }
    return tokenManager.getTokenFetching();
  }
  
  // Create a new request promise and store it
  const tokenPromise = (async () => {
    try {
      // Validate configuration before proceeding
      if (!validateAuthConfig()) {
        throw new Error('Invalid auth configuration');
      }
      
      const { proxyUrl, tokenEndpoint } = window.AppConfig.auth;
      const url = `${proxyUrl}${tokenEndpoint}`;
      
      // Retry logic
      let retries = 2;
      let lastError = null;
      
      while (retries >= 0) {
        try {
          // Add timeout support using AbortController
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          // Only log in debug mode
          if (window.AppConfig && window.AppConfig.debug) {
            console.log('Requesting new token from auth proxy');
          }
          
          const response = await fetch(url, { 
            signal: controller.signal,
            credentials: 'omit' // Avoid CORS issues with credentials
          });
          
          // Clear the timeout
          clearTimeout(timeout);
          
          if (!response.ok) {
            const errorText = await response.text();
            const errorMsg = `Token request failed: ${response.status} ${response.statusText}`;
            
            // For 5xx errors, retry if we have attempts left
            if (response.status >= 500 && retries > 0) {
              console.warn(`${errorMsg} - Retrying... (${retries} attempts left)`);
              retries--;
              // Exponential backoff: 1s, 2s
              await new Promise(resolve => setTimeout(resolve, 1000 * (3 - retries)));
              continue;
            }
            
            throw new Error(errorMsg);
          }
          
          // Check content type before parsing JSON
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Unexpected response format: ${contentType}`);
          }
          
          // Parse JSON with specific error handling
          let data;
          try {
            data = await response.json();
          } catch (jsonError) {
            throw new Error(`Invalid JSON response: ${jsonError.message}`);
          }
          
          if (!data.access_token || !data.expires_in) {
            throw new Error('Invalid token response format from auth proxy');
          }
          
          // Store token in the secure token manager
          tokenManager.setToken(data.access_token, data.expires_in);
          
          // Only log in debug mode, never log the actual token
          if (window.AppConfig && window.AppConfig.debug) {
            console.log('New token acquired');
          }
          
          return data.access_token;
        } catch (error) {
          // Handle abort errors specifically
          if (error.name === 'AbortError') {
            lastError = new Error('Token request timed out after 5 seconds');
            console.warn(lastError.message);
          } else {
            lastError = error;
          }
          
          // Only retry if we have attempts left and it's not already the last attempt
          if (retries <= 0) break;
          
          // Decrement retries only once per loop iteration
          retries--;
          await new Promise(resolve => setTimeout(resolve, 1000 * (3 - retries)));
        }
      }
      
      throw lastError || new Error('Failed to fetch token after retries');
    } finally {
      // Clear the in-flight promise when done (success or error)
      tokenManager.clearTokenFetching();
    }
  })();
  
  // Store the promise
  tokenManager.setTokenFetching(tokenPromise);
  
  return tokenPromise;
}

/**
 * Get access token for API calls from the backend auth proxy
 * @returns {Promise<string>} - Promise resolving to the access token
 */
async function getAccessToken() {
  // In development mode, we can bypass token authentication for easier local testing
  if (window.AppConfig && window.AppConfig.env === 'development' && window.AppConfig.auth.bypassAuthInDev) {
    console.log('Development mode: Bypassing token authentication');
    return 'dev-mode-token';
  }

  // Check if we have a valid cached token
  const cachedToken = tokenManager.getToken();
  if (cachedToken) {
    // Only log in debug mode
    if (window.AppConfig && window.AppConfig.debug) {
      console.log('Using cached token');
    }
    return cachedToken;
  }
  
  try {
    return await fetchToken();
  } catch (error) {
    console.error('Error acquiring token');
    throw error;
  }
}

/**
 * Clear the token cache
 */
function clearTokenCache() {
  tokenManager.clearToken();
  // Only log in debug mode
  if (window.AppConfig && window.AppConfig.debug) {
    console.log('Token cache cleared');
  }
}

// Export the auth module functions
window.AuthModule = {
  getAccessToken,
  clearTokenCache
};
