/**
 * API Client
 * 
 * A simple wrapper around the Fetch API to make HTTP requests.
 * Supports authentication with Azure AD using client credentials flow.
 */
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || window.AppConfig?.api?.baseUrl || '';
    // Completely disable authentication
    this.useAuth = false;
  }

  /**
   * Configure the API client to use authentication
   * @param {boolean} useAuth - Whether to use authentication
   */
  useAuthentication(useAuth) {
    this.useAuth = useAuth;
    return this; // Allow method chaining
  }

  /**
   * Configure the API client to use authentication (legacy method)
   * @param {boolean} useAuth - Whether to use authentication
   * @returns {ApiClient} - Returns this for method chaining
   */
  setUseAuth(useAuth) {
    // Legacy method for backward compatibility
    return this.useAuthentication(useAuth);
  }

  /**
   * Get authentication token if authentication is enabled
   * @returns {Promise<string|null>} - Authentication token or null
   */
  async getAuthToken() {
    // If auth is disabled at any level, return null
    if (!this.useAuth || !window.AuthModule || window.ENV?.DISABLE_AUTH === 'true' || window.AppConfig?.auth?.disabled === true) {
      return null;
    }

    try {      
      // Get access token from the auth module
      return await window.AuthModule.getAccessToken();
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Make an API request with retry logic and timeout
   * @param {string} endpoint - API endpoint (e.g., '/health')
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} - Parsed JSON response
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get configuration from AppConfig
    const timeout = window.AppConfig?.api?.timeout_ms || window.AppConfig?.api?.API_TIMEOUT_MS || 30000; // Default 30s timeout
    const maxRetries = window.AppConfig?.api?.maxRetries || window.AppConfig?.api?.API_MAX_RETRIES || 3; // Default 3 retries
    
    // Set default headers - no authentication headers added
    const headers = {
      ...(options.headers?.['Content-Type'] === undefined && !(options.body instanceof FormData) ? {'Content-Type': 'application/json'} : {}),
      ...options.headers,
    };
    
    // Implement retry logic
    let retries = 0;
    let lastError = null;
    
    while (retries <= maxRetries) {
      try {
        // Setup abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        // Add signal to options
        const fetchOptions = {
          ...options,
          headers,
          credentials: 'omit', // Always use 'omit' to avoid CORS issues with credentials
          signal: controller.signal
        };
        
        try {
          const response = await fetch(url, fetchOptions);
          // Clear timeout since request completed
          clearTimeout(timeoutId);
          
          // Check if response is successful
          if (!response.ok) {
            const error = new Error(`HTTP error! status: ${response.status}`);
            error.status = response.status;
            error.response = response;
            
            // Only retry on server errors (5xx)
            if (response.status >= 500 && response.status < 600 && retries < maxRetries) {
              lastError = error;
              retries++;
              
              // Exponential backoff
              const backoffTime = Math.min(1000 * Math.pow(2, retries), 10000);
              if (window.AppConfig?.debug) {
                console.warn(`Retrying request (${retries}/${maxRetries}) after ${backoffTime}ms`);
              }
              
              await new Promise(resolve => setTimeout(resolve, backoffTime));
              continue;
            }
            
            throw error;
          }
          
          // Handle empty responses
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            return await response.json();
          }
          return {};
          
        } catch (fetchError) {
          // Clear timeout to prevent memory leaks
          clearTimeout(timeoutId);
          
          // Handle abort errors (timeouts)
          if (fetchError.name === 'AbortError') {
            throw new Error(`Request timed out after ${timeout}ms`);
          }
          
          // For network errors, retry if we haven't exceeded max retries
          if (retries < maxRetries && (fetchError.message.includes('network') || fetchError.message.includes('failed'))) {
            lastError = fetchError;
            retries++;
            
            // Exponential backoff
            const backoffTime = Math.min(1000 * Math.pow(2, retries), 10000);
            if (window.AppConfig?.debug) {
              console.warn(`Retrying request (${retries}/${maxRetries}) after ${backoffTime}ms due to: ${fetchError.message}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            continue;
          }
          
          throw fetchError;
        }
        
      } catch (error) {
        // If this is our last retry, throw the error
        if (retries >= maxRetries) {
          console.error('API request failed after retries:', error);
          throw error;
        }
        
        // Otherwise, store the error and continue to the next retry
        lastError = error;
        retries++;
      }
    }
    
    // This should never be reached, but just in case
    throw lastError || new Error('Request failed for unknown reason');
  }

  // Convenience methods
  get(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  post(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  /**
   * Post FormData to an endpoint without JSON stringifying
   * This is useful for file uploads
   * @param {string} endpoint - API endpoint
   * @param {FormData} formData - FormData object
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} - Parsed JSON response
   */
  async postForm(endpoint, formData, options = {}) {
    // Don't set Content-Type for FormData, browser will set it with boundary
    const fetchOptions = {
      ...options,
      method: 'POST',
      body: formData,
      headers: {
        // Explicitly remove Content-Type so browser can set it with proper boundary
        ...(options.headers || {}),
        'Content-Type': undefined
      }
    };
    
    return this.request(endpoint, fetchOptions);
  }

  /**
   * Get a URL with authentication token appended as a query parameter
   * This is useful for resources that can't use Authorization headers (like PDF downloads)
   * @param {string} endpoint - API endpoint
   * @returns {Promise<string>} - URL with auth token
   */
  async getAuthenticatedUrl(endpoint) {
    const url = `${this.baseUrl}${endpoint}`;
    
    // If authentication is not enabled, return the URL as is
    if (!this.useAuth) {
      return url;
    }
    
    // Get the authentication token
    const token = await this.getAuthToken();
    if (!token) {
      console.warn('No auth token available for authenticated URL');
      return url;
    }
    
    // Add token as a query parameter
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}access_token=${encodeURIComponent(token)}`;
  }
}

// Create a singleton instance
const apiClient = new ApiClient();

// Make it globally available
window.ApiClient = apiClient;
