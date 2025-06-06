// API base URL - can be overridden by environment variable if needed
const API_BASE = window.REACT_APP_API_URL || "https://reproai-app.lemondune-e106e75a.westeurope.azurecontainerapps.io";

// DOM elements
const downloadButton = document.getElementById('download-pdf');
const statusMessage = document.getElementById('status-message');
const errorMessage = document.getElementById('error-message');

/**
 * Initialize the PDF export page
 */
function initPdfExport() {
    // Extract access token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('token');
    
    if (!accessToken) {
        showError('No access token provided. Please use a valid link with a token parameter.');
        return;
    }
    
    // Set up download button
    downloadButton.addEventListener('click', () => downloadPdf(accessToken));
    downloadButton.disabled = false;
    
    // Show ready message
    statusMessage.textContent = 'Your analysis results are ready for download.';
}

/**
 * Download the PDF using the access token
 * @param {string} accessToken - The access token for the analysis
 */
async function downloadPdf(accessToken) {
    try {
        statusMessage.textContent = 'Preparing your PDF...';
        downloadButton.disabled = true;
        errorMessage.textContent = '';
        
        // Create the PDF URL
        const pdfUrl = `${API_BASE}/api/dmp/enriched-checklists/access/${accessToken}/export-pdf`;
        
        // Open the PDF in a new tab
        window.open(pdfUrl, '_blank');
        
        // Reset UI
        statusMessage.textContent = 'PDF opened in a new tab. If it didn\'t open, check your popup blocker settings.';
        downloadButton.disabled = false;
        
    } catch (error) {
        console.error('Error downloading PDF:', error);
        errorMessage.textContent = `Error: ${error.message}`;
        downloadButton.disabled = false;
        statusMessage.textContent = 'Failed to download PDF.';
    }
}

/**
 * Check if the API is healthy
 * @returns {Promise<boolean>} True if API is healthy, false otherwise
 */
async function checkApiHealth() {
    try {
        const response = await fetch(`${API_BASE}/health`, {
            mode: 'cors',
            credentials: 'same-origin'
        });
        
        // If we get any successful response, consider the API healthy
        if (response.ok) {
            console.log('API health check successful');
            return true;
        }
        
        console.warn('API health check failed with status:', response.status);
        return false;
    } catch (error) {
        console.error('API health check failed with error:', error);
        return false;
    }
}

/**
 * Show an error message
 * @param {string} message - The error message to display
 */
function showError(message) {
    errorMessage.textContent = message;
    statusMessage.textContent = 'Error occurred';
    downloadButton.disabled = true;
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', initPdfExport);
