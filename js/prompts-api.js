/**
 * Prompts API Module
 * 
 * This module handles secure API calls to the ReproAI Prompts API using client credentials flow.
 */

// API endpoints from config
const API_BASE_URL = window.AppConfig.api.baseUrl;
const PROMPTS_API_ENDPOINT = '/api/reproai/prompts';

/**
 * Get prompts from the API using secure authentication
 * @returns {Promise<Object>} The prompts data
 */
async function getPrompts() {
  try {
    // Get the access token from the auth module
    const token = await window.AuthModule.getAccessToken();
    
    // Make the authenticated request
    const response = await fetch(`${API_BASE_URL}${PROMPTS_API_ENDPOINT}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Prompts fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to fetch prompts:', error);
    throw error;
  }
}

// Export will be done at the end of the file

/**
 * Display prompts in the UI
 * @param {Object} prompts - The prompts data from the API
 * @param {string} containerId - ID of the container element to display prompts in
 */
function displayPrompts(prompts, containerId = 'prompts-container') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container element with ID '${containerId}' not found`);
    return;
  }

  // Clear existing content
  container.innerHTML = '';

  // Check if prompts data exists
  if (!prompts || Object.keys(prompts).length === 0) {
    container.innerHTML = '<p>No prompts available</p>';
    return;
  }

  // Create a formatted display of the prompts
  const promptsDisplay = document.createElement('div');
  promptsDisplay.className = 'prompts-display';

  // Format the JSON for display
  const pre = document.createElement('pre');
  pre.className = 'json-display';
  pre.textContent = JSON.stringify(prompts, null, 2);
  promptsDisplay.appendChild(pre);

  // Add to container
  container.appendChild(promptsDisplay);
}

// Export the module functions
window.PromptsApi = {
  getPrompts,
  displayPrompts
};
