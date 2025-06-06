// API base URL - can be overridden by environment variable if needed
const API_BASE = window.REACT_APP_API_URL || "https://reproai-app.lemondune-e106e75a.westeurope.azurecontainerapps.io";

// Default parameters for analysis (will be overridden by dropdown selections)
let selectedChecklistId = "finnish_dmp_evaluation";
let selectedConfigId = "Full-GPT4-turbo-preview";

// Global variables to store current analysis info
let currentRunId = null;
let currentAccessToken = null;
let apiHealthy = false;

/**
 * Updates the download checklist link URL based on the currently selected checklist
 */
function updateChecklistDownloadLink() {
    const downloadChecklistBtn = document.getElementById('download-checklist-btn');
    if (downloadChecklistBtn) {
        // Update href attribute for the link
        downloadChecklistBtn.setAttribute('href', `${API_BASE}/api/dmp/checklists/${selectedChecklistId}/export-pdf`);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check API health first
    checkApiHealth();
    
    // Set up form submission handler
    const form = document.getElementById('dmp-form');
    if (form) {
        form.addEventListener('submit', handleAnalysisSubmit);
    }
    
    // Set up dropdown change handlers
    const checklistSelect = document.getElementById('checklist-select');
    const configSelect = document.getElementById('config-select');
    
    if (checklistSelect) {
        // Set initial value
        selectedChecklistId = checklistSelect.value;
        
        // Add change listener
        checklistSelect.addEventListener('change', () => {
            selectedChecklistId = checklistSelect.value;
            console.log('Selected checklist:', selectedChecklistId);
            
            // Update download checklist link URL
            updateChecklistDownloadLink();
        });
    }
    
    if (configSelect) {
        // Set initial value
        selectedConfigId = configSelect.value;
        
        // Add change listener
        configSelect.addEventListener('change', () => {
            selectedConfigId = configSelect.value;
            console.log('Selected config:', selectedConfigId);
        });
    }
    
    // Set up PDF export button handler
    const exportBtn = document.getElementById('export-pdf-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExportPDF);
    }
    
    // Set up View Results button handler
    const viewResultsBtn = document.getElementById('view-results-btn');
    if (viewResultsBtn) {
        viewResultsBtn.addEventListener('click', handleViewResults);
    }
    
    // Initialize download checklist link with current selection
    updateChecklistDownloadLink();
    
    // Set up Download Checklist link handler
    const downloadChecklistBtn = document.getElementById('download-checklist-btn');
    if (downloadChecklistBtn) {
        downloadChecklistBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.open(`${API_BASE}/api/dmp/checklists/${selectedChecklistId}/export-pdf`, '_blank');
        });
    }
});

// Check if the API is running
async function checkApiHealth() {
    const statusElement = document.getElementById('api-status');
    const formElement = document.getElementById('analysis-form');
    
    try {
        // Try to fetch the API health check endpoint
        // Note: The correct endpoint is /health (not /api/v1/health)
        const response = await fetch(`${API_BASE}/health`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            mode: 'cors', // Add explicit CORS mode
            credentials: 'same-origin'
        });
        
        if (response.ok) {
            apiHealthy = true;
            statusElement.innerHTML = '';
            formElement.style.display = 'block';
        } else {
            throw new Error(`API returned status: ${response.status}`);
        }
    } catch (error) {
        apiHealthy = false;
        statusElement.innerHTML = `<div class="status-error">API is offline or unreachable. Please try again later.</div>`;
        formElement.style.display = 'none';
        console.error('API health check failed:', error);
    }
}

// Handle form submission to run analysis
async function handleAnalysisSubmit(event) {
    event.preventDefault();
    
    // Check if API is healthy before proceeding
    if (!apiHealthy) {
        // Re-check API health
        await checkApiHealth();
        if (!apiHealthy) {
            alert('Cannot submit analysis: API is currently unavailable');
            return;
        }
    }
    
    // Get text input
    const textInput = document.getElementById('text-input').value.trim();
    if (!textInput) {
        alert('Please enter text to analyze');
        return;
    }
    
    // Process text input - try to parse as JSON if it looks like JSON
    let processedText = textInput;
    if ((textInput.startsWith('{') && textInput.endsWith('}')) || 
        (textInput.startsWith('[') && textInput.endsWith(']'))) {
        try {
            // Try to parse and re-stringify to format it properly
            const jsonObj = JSON.parse(textInput);
            processedText = JSON.stringify(jsonObj, null, 2);
            console.log('Input text was formatted as valid JSON');
        } catch (e) {
            console.log('Input text looks like JSON but is not valid:', e.message);
            // Keep original text if parsing fails
        }
    }
    
    // Show status section, hide other sections
    document.getElementById('analysis-form').style.display = 'none';
    document.getElementById('analysis-status').style.display = 'block';
    document.getElementById('analysis-result').style.display = 'none';
    
    try {
        console.log('Submitting analysis with parameters:', {
            checklist_id: selectedChecklistId,
            config_id: selectedConfigId,
            text_length: processedText.length
        });
        
        // Submit analysis request with selected parameters
        const response = await fetch(`${API_BASE}/api/dmp/enriched-checklists/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors', // Add explicit CORS mode
            credentials: 'same-origin',
            body: JSON.stringify({
                checklist_id: selectedChecklistId,
                text: processedText,
                config_id: selectedConfigId
            })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to submit analysis: ${response.status}`);
        }
        
        const data = await response.json();
        currentRunId = data.run_id;
        currentAccessToken = data.access_token;
        
        // Start polling for analysis completion
        pollAnalysisStatus();
        
    } catch (error) {
        document.getElementById('status-message').textContent = `Error: ${error.message}`;
        // Show form again on error
        document.getElementById('analysis-form').style.display = 'block';
        document.getElementById('analysis-status').style.display = 'none';
        
        // If we got a server error, the API might be down
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            // API might be down, recheck health
            apiHealthy = false;
            await checkApiHealth();
        }
    }
}

// Poll for analysis status
async function pollAnalysisStatus() {
    if (!currentRunId) return;
    
    try {
        console.log('Polling for analysis status...');
        // Try to fetch the analysis result
        const response = await fetch(`${API_BASE}/api/dmp/enriched-checklists/run/${currentRunId}`, {
            headers: {
                'Accept': 'application/json'
            },
            mode: 'cors', // Add explicit CORS mode
            credentials: 'same-origin'
        });
        
        const data = await response.json();
        console.log('Poll response:', data);
        
        // Check if we got an error response
        if (data.detail) {
            // Still processing or error - continue polling
            document.getElementById('status-message').textContent = 'Your DMP is being analyzed. This can take 2-5 minutes to complete...';
            setTimeout(pollAnalysisStatus, 5000); // Poll every 5 seconds
            return;
        }
        
        // Check if we have enriched_data in the response
        if (data.enriched_data) {
            // Analysis is complete - show results
            document.getElementById('status-message').textContent = 'Analysis complete!';
            document.getElementById('analysis-status').style.display = 'none';
            document.getElementById('analysis-result').style.display = 'block';
            
            // Store the access token for PDF export and results viewing
            if (data.access_token) {
                currentAccessToken = data.access_token;
                
                // Set up the direct link to results
                const resultsUrl = `feedback_view.html?token=${currentAccessToken}`;
                const resultsLink = document.getElementById('results-direct-link');
                resultsLink.href = resultsUrl;
                
                // Set up the shareable link
                const fullUrl = new URL(resultsUrl, window.location.origin).href;
                const shareableLink = document.getElementById('shareable-link');
                shareableLink.value = fullUrl;
                
                // Set up copy button functionality
                const copyButton = document.getElementById('copy-link-btn');
                const copySuccessMessage = document.getElementById('copy-success-message');
                
                copyButton.addEventListener('click', () => {
                    shareableLink.select();
                    document.execCommand('copy');
                    copySuccessMessage.style.display = 'block';
                    setTimeout(() => {
                        copySuccessMessage.style.display = 'none';
                    }, 3000);
                });
            }
            
            // Stop polling
            return;
        }
        
        // If we get here, we don't know the status - keep polling
        setTimeout(pollAnalysisStatus, 5000);
        
    } catch (error) {
        console.error('Error polling analysis status:', error);
        document.getElementById('status-message').textContent = `Error checking analysis status: ${error.message}`;
        // Keep polling anyway in case it's a temporary error
        setTimeout(pollAnalysisStatus, 10000); // Try again in 10 seconds
    }
}

// Handle View Results button click
async function handleViewResults() {
    if (!currentRunId || !currentAccessToken) {
        document.getElementById('status-message').textContent = 'No analysis results available to view.';
        return;
    }
    
    try {
        // Navigate to the feedback view page with the access token
        const feedbackViewUrl = `feedback_view.html?token=${currentAccessToken}`;
        window.open(feedbackViewUrl, '_blank');
    } catch (error) {
        console.error('Error viewing results:', error);
        document.getElementById('status-message').textContent = `Error viewing results: ${error.message}`;
    }
}

// Handle PDF export button click
async function handleExportPDF() {
    if (!currentRunId || !currentAccessToken) {
        document.getElementById('status-message').textContent = 'No analysis results available to export.';
        return;
    }
    
    try {
        // Direct download using the run_id endpoint
        const pdfUrl = `${API_BASE}/api/dmp/enriched-checklists/run/${currentRunId}/export-pdf?access_token=${currentAccessToken}`;
        
        // Open the PDF directly in a new tab
        window.open(pdfUrl, '_blank');
        
    } catch (error) {
        console.error('Error exporting PDF:', error);
        document.getElementById('status-message').textContent = `Error exporting PDF: ${error.message}`;
        
        // Check if API is still healthy
        const isHealthy = await checkApiHealth();
        if (!isHealthy) {
            document.getElementById('status-message').textContent = 'API is offline or unreachable. Please try again later.';
        }
    }
}

// Handle Download Checklist button click
async function handleDownloadChecklist(event) {
    event.preventDefault();
    
    // Check if API is healthy before proceeding
    if (!apiHealthy) {
        // Re-check API health
        await checkApiHealth();
        if (!apiHealthy) {
            alert('Cannot download checklist: API is currently unavailable');
            return;
        }
    }
    
    try {
        console.log('Downloading checklist...');
        
        // Create a URL to the checklist PDF export endpoint
        const checklistUrl = `${API_BASE}/api/dmp/checklists/finnish_dmp_evaluation_1domain/export-pdf`;
        
        // Open the PDF in a new tab
        window.open(checklistUrl, '_blank');
        
    } catch (error) {
        alert(`Failed to download checklist: ${error.message}`);
        
        // If we got a server error, the API might be down
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            // API might be down, recheck health
            apiHealthy = false;
            await checkApiHealth();
        }
    }
}
