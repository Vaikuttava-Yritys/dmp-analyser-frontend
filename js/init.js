/**
 * Application Initialization
 * 
 * This file initializes the application and makes core functionality available globally.
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Log environment information
  console.log('Application initialized in', window.AppConfig.env, 'mode');
  console.log('API Base URL:', window.AppConfig.api.baseUrl);
  
  // Show the form after API health check
  checkApiHealth().then(isHealthy => {
    const spinner = document.getElementById('spinner-overlay');
    const form = document.getElementById('analysis-form');
    
    if (spinner) {
      spinner.style.opacity = 0;
      setTimeout(() => {
        spinner.style.display = 'none';
        if (form) form.style.display = 'block';
      }, 400);
    } else if (form) {
      form.style.display = 'block';
    }
  });

  // Form submission is handled in app.js
});

/**
 * Check if the API is reachable
 */
async function checkApiHealth() {
  try {
    const health = await window.ApiClient.get(window.AppConfig.api.endpoints.health);
    console.log('API Health:', health);
    return true;
  } catch (error) {
    console.error('API is not reachable:', error);
    return false;
  }
}

// Make checkApiHealth globally available
window.checkApiHealth = checkApiHealth;
