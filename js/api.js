/**
 * API Client
 * 
 * A simple wrapper around the Fetch API to make HTTP requests.
 */
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || window.AppConfig.api.baseUrl;
  }

  /**
   * Make an API request
   * @param {string} endpoint - API endpoint (e.g., '/health')
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} - Parsed JSON response
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Set default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include cookies for auth
      });

      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.response = response;
        throw error;
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return {};
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
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
}

// Create a singleton instance
const apiClient = new ApiClient();

// Make it globally available
window.ApiClient = apiClient;
