// API base URL - loaded from centralized config
const API_BASE = window.AppConfig?.api?.baseUrl || 'http://localhost:8002';

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
        // Update href attribute for the link using centralized config
        downloadChecklistBtn.setAttribute('href', `${API_BASE}/dmp/checklists/${selectedChecklistId}/export-pdf`);
    }
}

/**
 * Reset the form to its default state, clearing any custom elements
 * that aren't automatically reset by form.reset()
 */
function resetFormToDefaultState() {
    // Reset file input (which isn't cleared by form.reset)
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        // Clear the file input value
        input.value = '';
        
        // Clear any displayed filename
        const filenameDisplay = document.querySelector('.file-name');
        if (filenameDisplay) {
            filenameDisplay.textContent = '';
        }
    });
    
    // Reset any custom tabs to default state
    const tabs = document.querySelectorAll('.tab-button');
    if (tabs.length > 0) {
        // Activate the first tab
        tabs.forEach(tab => tab.classList.remove('active'));
        tabs[0].classList.add('active');
        
        // Show the first tab content, hide others
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => content.style.display = 'none');
        if (tabContents[0]) {
            tabContents[0].style.display = 'block';
        }
    }
    
    // Clear any validation messages
    const validationMessages = document.querySelectorAll('.validation-message');
    validationMessages.forEach(message => message.textContent = '');
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Show the form immediately so users know they can interact with it
    const analysisForm = document.getElementById('analysis-form');
    if (analysisForm) {
        analysisForm.style.display = 'block';
    }
    
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
    
    // Get the active tab
    const textTabActive = document.getElementById('text-input-tab').classList.contains('active');
    const fileTabActive = document.getElementById('file-upload-tab').classList.contains('active');
    
    // Get input values
    const textInput = document.getElementById('text-input').value.trim();
    const pdfFile = document.getElementById('pdf-file').files[0];
    const userEmail = document.getElementById('user-email').value.trim();
    
    // Validate input based on active tab
    if (textTabActive && !textInput) {
        alert('Please enter text to analyze');
        return;
    } else if (fileTabActive && !pdfFile) {
        alert('Please select a PDF file to upload');
        return;
    }
    
    // Validate email (now mandatory)
    if (!userEmail) {
        alert('Please enter your email address');
        return;
    }
    
    // Show status section, hide other sections
    document.getElementById('analysis-form').style.display = 'none';
    document.getElementById('analysis-status').style.display = 'block';
    document.getElementById('analysis-result').style.display = 'none';
    
    try {
        let response;
        
        if (pdfFile) {
            // Handle PDF file upload
            console.log('Submitting PDF file for analysis:', {
                checklist_id: selectedChecklistId,
                config_id: selectedConfigId,
                file_name: pdfFile.name,
                file_size: pdfFile.size,
                user_email: userEmail || 'not provided'
            });
            
            // Create form data
            const formData = new FormData();
            formData.append('pdf_file', pdfFile);
            
            // Build URL with query parameters
            let uploadUrl = `${API_BASE}/api/dmp/enriched-checklists/upload-pdf?checklist_id=${encodeURIComponent(selectedChecklistId)}&config_id=${encodeURIComponent(selectedConfigId)}`;
            
            // Add user email if provided
            if (userEmail) {
                uploadUrl += `&user_email=${encodeURIComponent(userEmail)}`;
            }
            
            // Submit PDF upload request
            response = await fetch(uploadUrl, {
                method: 'POST',
                mode: 'cors',
                credentials: 'same-origin',
                body: formData
            });
        } else {
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
            
            console.log('Submitting text analysis with parameters:', {
                checklist_id: selectedChecklistId,
                config_id: selectedConfigId,
                text_length: processedText.length,
                user_email: userEmail || 'not provided'
            });
            
            // Build request body
            const requestBody = {
                checklist_id: selectedChecklistId,
                text: processedText,
                config_id: selectedConfigId
            };
            
            // Add user email if provided
            if (userEmail) {
                requestBody.user_email = userEmail;
            }
            
            // Submit text analysis request
            response = await fetch(`${API_BASE}/api/dmp/enriched-checklists/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors',
                credentials: 'same-origin',
                body: JSON.stringify(requestBody)
            });
        }
        
        if (!response.ok) {
            throw new Error(`Failed to submit analysis: ${response.status}`);
        }
        
        const data = await response.json();
        currentRunId = data.run_id;
        currentAccessToken = data.access_token;
        
        // Update status message to inform user about email notification
        document.getElementById('status-message').textContent = `Your DMP analysis has been submitted successfully! You will receive an email at ${userEmail} when the analysis is ready.`;
        
        // Add a button to return to the form
        const statusContainer = document.getElementById('analysis-status');
        
        // Check if the return button already exists
        if (!document.getElementById('return-to-form-btn')) {
            const returnButton = document.createElement('button');
            returnButton.id = 'return-to-form-btn';
            returnButton.className = 'btn';
            returnButton.textContent = 'Submit another';
            returnButton.addEventListener('click', () => {
                // Show the form and hide the status
                document.getElementById('analysis-form').style.display = 'block';
                document.getElementById('analysis-status').style.display = 'none';
                
                // Reset the form to default state
                document.getElementById('analysis-form').reset();
                
                // Reset any custom form elements that aren't cleared by form.reset()
                resetFormToDefaultState();
            });
            statusContainer.appendChild(returnButton);
        }
        
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

// Function to handle the case when a user receives results via email and wants to view them
function setupResultsViewing(accessToken) {
    if (!accessToken) return;
    
    // Set up the direct link to results
    const resultsUrl = `results.html?token=${accessToken}`;
    const resultsLink = document.getElementById('results-direct-link');
    if (resultsLink) {
        resultsLink.href = resultsUrl;
    }
    
    // Set up the shareable link if elements exist
    const shareableLink = document.getElementById('shareable-link');
    if (shareableLink) {
        const fullUrl = new URL(resultsUrl, window.location.origin).href;
        shareableLink.value = fullUrl;
        
        // Set up copy button functionality
        const copyButton = document.getElementById('copy-link-btn');
        const copySuccessMessage = document.getElementById('copy-success-message');
        
        if (copyButton && copySuccessMessage) {
            copyButton.addEventListener('click', () => {
                shareableLink.select();
                document.execCommand('copy');
                copySuccessMessage.style.display = 'inline';
                setTimeout(() => {
                    copySuccessMessage.style.display = 'none';
                }, 3000);
            });
        }
    }
    
    // Set up view results button if it exists
    const viewResultsButton = document.getElementById('view-results-btn');
    if (viewResultsButton) {
        viewResultsButton.addEventListener('click', () => {
            window.location.href = resultsUrl;
        });
    }
}

// Handle View Results button click
async function handleViewResults() {
    if (!currentRunId || !currentAccessToken) {
        document.getElementById('status-message').textContent = 'No analysis results available to view.';
        return;
    }
    
    try {
        // Navigate to the results page with the access token
        const resultsUrl = `results.html?token=${currentAccessToken}`;
        window.open(resultsUrl, '_blank');
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
