/**
 * Results Feedback Module
 * Handles user feedback UI for analysis results
 */

const ResultsFeedback = (function() {
    // Initialize feedback data storage
    const feedbackData = {
        feedback: {}, // Unified feedback storage for both domains and items
        overallFeedback: null,
        runId: null
    };
    
    /**
     * Initialize feedback functionality
     * @param {string} runId - The ID of the analysis run
     */
    function init(runId) {
        // Check if already initialized with a valid runId
        if (feedbackData.runId) {
            return;
        }
        
        // Try to recover runId if not provided
        if (!runId) {
            // Try to get run ID from window.runId or window.token as fallback
            if (window.runId) {
                runId = window.runId;
            } else if (window.token) {
                runId = window.token;
            }
        }
        
        // Store run ID in feedback data and globally
        feedbackData.runId = runId;
        window.runId = runId; // Ensure global consistency
        
        // Initialize FeedbackAPI
        if (typeof FeedbackAPI !== 'undefined') {
            FeedbackAPI.init(runId);
        } else {
            console.error('FeedbackAPI is not defined! Cannot initialize feedback API.');
        }
    }
    
    /**
     * Set accuracy feedback for a domain or item
     * @param {string} elementId - The domain or item ID
     * @param {string} accuracy - The accuracy value ('yes', 'not_useful', or 'no')
     */
    function setAccuracyFeedback(elementId, accuracy) {
        // Initialize feedback if it doesn't exist
        if (!feedbackData.feedback[elementId]) {
            feedbackData.feedback[elementId] = {};
        }
        
        // Set accuracy
        feedbackData.feedback[elementId].accuracy = accuracy;
    }
    
    /**
     * Set clarity feedback for a domain or item
     * @param {string} elementId - The domain or item ID
     * @param {string} clarity - The clarity value ('yes', 'unclear', or 'off_target')
     */
    function setClarityFeedback(elementId, clarity) {
        // Initialize feedback if it doesn't exist
        if (!feedbackData.feedback[elementId]) {
            feedbackData.feedback[elementId] = {};
        }
        
        // Set clarity
        feedbackData.feedback[elementId].clarity = clarity;
    }
    
    /**
     * Set comment feedback for an element (domain or item)
     * @param {string} elementId - The element ID (domain or item)
     * @param {string} comment - The comment text
     */
    function setCommentFeedback(elementId, comment) {
        if (!feedbackData.feedback[elementId]) {
            feedbackData.feedback[elementId] = {};
        }
        feedbackData.feedback[elementId].comment = comment;
    }
    
    /**
     * Save feedback to server
     * @param {string} elementId - The element ID (domain or item) to save feedback for
     */
    function saveFeedback(elementId) {
        const feedback = feedbackData.feedback[elementId];
        if (!feedback) {
            return;
        }
        
        // Determine if this is a domain or item based on ID format
        // Items typically have more segments in their ID (e.g., 1.1.2 vs 1.1)
        const isDomain = !elementId.match(/\d+\.\d+\.\d+/);
        const elementType = isDomain ? 'domain' : 'item';
        
        // Update status indicator
        const statusIndicator = document.getElementById(`${elementType}-${elementId}-feedback-status`);
        if (statusIndicator) {
            statusIndicator.textContent = 'Saving...';
            statusIndicator.className = 'feedback-status saving';
        }
        
        // Update toggle button to show feedback has been provided
        const toggleBtn = document.getElementById(`${elementType}-${elementId}-feedback-toggle`);
        if (toggleBtn) {
            toggleBtn.classList.add('has-feedback');
        }
        
        // Submit feedback via API
        if (typeof FeedbackAPI !== 'undefined') {
            // Make sure we have a runId
            if (!feedbackData.runId) {
                console.error('No runId available for feedback submission');
                console.error('feedbackData:', feedbackData);
                console.error('window.token:', window.token);
                
                // Try to recover using window.token
                if (window.token) {
                    console.log('Attempting to recover using window.token');
                    feedbackData.runId = window.token;
                    console.log('Updated runId to:', feedbackData.runId);
                }
                
                // If still no runId, show error
                if (!feedbackData.runId) {
                    if (statusIndicator) {
                        statusIndicator.textContent = 'Error: No run ID';
                        statusIndicator.className = 'feedback-status error';
                    }
                    return;
                }
            }
            
            console.log('Using runId for feedback submission:', feedbackData.runId);
            
            // Use the correct FeedbackAPI method with proper parameters
            if (feedback.accuracy) {
                FeedbackAPI.setAccuracyFeedback(elementId, isDomain ? 'domain' : 'item', feedback.accuracy);
            }
            
            if (feedback.clarity) {
                FeedbackAPI.setClarityFeedback(elementId, isDomain ? 'domain' : 'item', feedback.clarity);
            }
            
            if (feedback.comment) {
                FeedbackAPI.setCommentFeedback(elementId, isDomain ? 'domain' : 'item', feedback.comment);
            }
            
            // Pass the element ID and type to the saveFeedback method
            FeedbackAPI.saveFeedback(elementId, isDomain ? 'domain' : 'item')
            .then(() => {
                if (statusIndicator) {
                    statusIndicator.textContent = 'Saved!';
                    statusIndicator.className = 'feedback-status saved';
                    setTimeout(() => {
                        statusIndicator.textContent = '';
                    }, 3000);
                }
            })
            .catch(err => {
                if (statusIndicator) {
                    statusIndicator.textContent = 'Failed to save';
                    statusIndicator.className = 'feedback-status error';
                }
            });
        } else {
            if (statusIndicator) {
                statusIndicator.textContent = 'API not available';
                statusIndicator.className = 'feedback-status error';
            }
        }
    }

    /**
     * Generic function to add feedback UI to any element (domain or item)
     * @param {HTMLElement} row - The table row for the element
     * @param {Object} element - The element data (domain or item)
     * @param {HTMLElement} tbody - The table body element
     * @param {string} elementType - Type of element ('domain' or 'item')
     * @param {string} elementId - ID of the element
     */
    function addFeedbackUI(row, element, tbody, elementType, elementId) {
        // Add feedback toggle button to the row
        // Get the last cell (recommendations cell)
        const lastCell = row.lastElementChild;
        
        if (!lastCell) {
            return;
        }
        
        // Create feedback toggle button with more visible styling but smaller (no icon)
        const feedbackToggle = document.createElement('button');
        feedbackToggle.className = 'feedback-toggle-btn';
        feedbackToggle.id = `${elementType}-${elementId}-feedback-toggle`; // Add unique ID
        feedbackToggle.textContent = 'Feedback'; // Remove icon, just text
        feedbackToggle.title = 'Toggle feedback form';
        feedbackToggle.style.display = 'block'; // Ensure it's displayed as a block
        feedbackToggle.style.marginTop = '10px';
        feedbackToggle.style.padding = '4px 10px'; // Smaller padding
        feedbackToggle.style.backgroundColor = '#007bff';
        feedbackToggle.style.color = 'white';
        feedbackToggle.style.border = 'none';
        feedbackToggle.style.borderRadius = '4px';
        feedbackToggle.style.cursor = 'pointer';
        feedbackToggle.style.fontSize = '0.9em'; // Slightly smaller font
        
        // Add to last cell
        lastCell.appendChild(document.createElement('br'));
        lastCell.appendChild(feedbackToggle);
        
        // Add element ID attribute to the row for reference
        row.setAttribute(`data-${elementType}-id`, elementId);
        
        // Create feedback row
        const feedbackRow = document.createElement('tr');
        feedbackRow.className = `${elementType}-feedback-row`;
        feedbackRow.style.display = 'none'; // Initially hidden by default
        
        // Create feedback cell that spans all columns
        const feedbackCell = document.createElement('td');
        feedbackCell.className = `${elementType}-feedback-cell`;
        feedbackCell.colSpan = row.cells.length;
        
        // Create feedback container - main container for all feedback elements
        const feedbackContainer = document.createElement('div');
        feedbackContainer.className = `${elementType}-feedback-container`;
        feedbackContainer.style.width = '100%';
        
        // Create clarity feedback container - first question row
        const clarityContainer = document.createElement('div');
        clarityContainer.className = 'clarity-feedback';
        clarityContainer.style.display = 'flex';
        clarityContainer.style.flexDirection = 'row';
        clarityContainer.style.alignItems = 'center';
        clarityContainer.style.justifyContent = 'flex-start';
        clarityContainer.style.flexWrap = 'nowrap';
        clarityContainer.style.gap = '8px';
        clarityContainer.style.margin = '5px 0';
        clarityContainer.style.width = '100%';
        
        // Create label for clarity question
        const clarityLabel = document.createElement('label');
        clarityLabel.textContent = 'Criterion - is it clear and appropriate?';
        clarityLabel.style.marginRight = '10px';
        clarityLabel.style.whiteSpace = 'nowrap';
        clarityLabel.style.fontWeight = '500';
        clarityContainer.appendChild(clarityLabel);
        
        // Create accuracy feedback container - ensure it's a flex container for inline layout
        const accuracyContainer = document.createElement('div');
        accuracyContainer.className = 'accuracy-feedback';
        accuracyContainer.style.display = 'flex';
        accuracyContainer.style.flexDirection = 'row';
        accuracyContainer.style.alignItems = 'center';
        accuracyContainer.style.justifyContent = 'flex-start';
        accuracyContainer.style.flexWrap = 'nowrap';
        accuracyContainer.style.gap = '8px';
        accuracyContainer.style.margin = '5px 0';
        accuracyContainer.style.width = '100%';
        
        // Create label - ensure it's on the same row as icons
        const accuracyLabel = document.createElement('label');
        accuracyLabel.textContent = 'AI assessment - is it accurate and useful?';
        accuracyLabel.style.marginRight = '10px';
        accuracyLabel.style.whiteSpace = 'nowrap';
        accuracyLabel.style.fontWeight = '500';
        accuracyContainer.appendChild(accuracyLabel);
        
        // Create icon-based toggle container - ensure it's on the same row as the question
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'toggle-container';
        toggleContainer.style.display = 'flex';
        toggleContainer.style.alignItems = 'center';
        toggleContainer.style.gap = '12px';
        toggleContainer.style.flexShrink = '0';
        toggleContainer.style.whiteSpace = 'nowrap';
        
        // Create Yes icon with green color
        const yesIcon = document.createElement('span');
        yesIcon.className = 'feedback-icon yes-icon';
        yesIcon.innerHTML = '&#10004;';
        yesIcon.title = 'Yes';
        yesIcon.style.fontSize = '1.6em';
        yesIcon.style.cursor = 'pointer';
        yesIcon.style.color = '#4CAF50'; // Green color
        yesIcon.style.opacity = '0.6';
        yesIcon.style.padding = '1px 3px';
        yesIcon.style.borderRadius = '3px';
        yesIcon.style.transition = 'all 0.2s ease';
        yesIcon.style.display = 'inline-block';
        yesIcon.style.lineHeight = '1';
        yesIcon.addEventListener('click', () => {
            // Update active state visually
            yesIcon.style.opacity = '1';
            yesIcon.style.transform = 'scale(1.1)';
            yesIcon.style.backgroundColor = 'rgba(76, 175, 80, 0.05)';
            
            notUsefulIcon.style.opacity = '0.6';
            notUsefulIcon.style.transform = 'scale(1)';
            notUsefulIcon.style.backgroundColor = 'transparent';
            
            noIcon.style.opacity = '0.6';
            noIcon.style.transform = 'scale(1)';
            noIcon.style.backgroundColor = 'transparent';
            
            // Set accuracy feedback
            setAccuracyFeedback(elementId, 'yes');
        });
        toggleContainer.appendChild(yesIcon);
        
        // Create Not Useful icon with amber/orange color
        const notUsefulIcon = document.createElement('span');
        notUsefulIcon.className = 'feedback-icon not-useful-icon';
        notUsefulIcon.innerHTML = '&#9888;';
        notUsefulIcon.title = 'Not useful';
        notUsefulIcon.style.fontSize = '1.6em';
        notUsefulIcon.style.cursor = 'pointer';
        notUsefulIcon.style.color = '#FF9800'; // Amber/orange color
        notUsefulIcon.style.opacity = '0.6';
        notUsefulIcon.style.padding = '1px 3px';
        notUsefulIcon.style.borderRadius = '3px';
        notUsefulIcon.style.transition = 'all 0.2s ease';
        notUsefulIcon.style.display = 'inline-block';
        notUsefulIcon.style.lineHeight = '1';
        notUsefulIcon.addEventListener('click', () => {
            // Update active state visually
            yesIcon.style.opacity = '0.6';
            yesIcon.style.transform = 'scale(1)';
            yesIcon.style.backgroundColor = 'transparent';
            
            notUsefulIcon.style.opacity = '1';
            notUsefulIcon.style.transform = 'scale(1.1)';
            notUsefulIcon.style.backgroundColor = 'rgba(255, 152, 0, 0.05)';
            
            noIcon.style.opacity = '0.6';
            noIcon.style.transform = 'scale(1)';
            noIcon.style.backgroundColor = 'transparent';
            
            // Set accuracy feedback
            setAccuracyFeedback(elementId, 'not_useful');
        });
        toggleContainer.appendChild(notUsefulIcon);
        
        // Create No icon with red color
        const noIcon = document.createElement('span');
        noIcon.className = 'feedback-icon no-icon';
        noIcon.innerHTML = '&#10006;';
        noIcon.title = 'No';
        noIcon.style.fontSize = '1.6em';
        noIcon.style.cursor = 'pointer';
        noIcon.style.color = '#F44336'; // Red color
        noIcon.style.opacity = '0.6';
        noIcon.style.padding = '1px 3px';
        noIcon.style.borderRadius = '3px';
        noIcon.style.transition = 'all 0.2s ease';
        noIcon.style.display = 'inline-block';
        noIcon.style.lineHeight = '1';
        noIcon.addEventListener('click', () => {
            // Update active state visually
            yesIcon.style.opacity = '0.6';
            yesIcon.style.transform = 'scale(1)';
            yesIcon.style.backgroundColor = 'transparent';
            
            notUsefulIcon.style.opacity = '0.6';
            notUsefulIcon.style.transform = 'scale(1)';
            notUsefulIcon.style.backgroundColor = 'transparent';
            
            noIcon.style.opacity = '1';
            noIcon.style.transform = 'scale(1.1)';
            noIcon.style.backgroundColor = 'rgba(244, 67, 54, 0.05)';
            
            // Set accuracy feedback
            setAccuracyFeedback(elementId, 'no');
        });
        toggleContainer.appendChild(noIcon);
        
        accuracyContainer.appendChild(toggleContainer);
        
        // Clarity container and label already created above
        
        // Create icon-based toggle container for clarity
        const clarityToggleContainer = document.createElement('div');
        clarityToggleContainer.className = 'toggle-container';
        clarityToggleContainer.style.display = 'flex';
        clarityToggleContainer.style.alignItems = 'center';
        clarityToggleContainer.style.gap = '12px';
        clarityToggleContainer.style.flexShrink = '0';
        clarityToggleContainer.style.whiteSpace = 'nowrap';
        
        // Create Yes icon for clarity with green color
        const clarityYesIcon = document.createElement('span');
        clarityYesIcon.className = 'feedback-icon clarity-yes-icon';
        clarityYesIcon.innerHTML = '&#10004;';
        clarityYesIcon.title = 'Yes';
        clarityYesIcon.style.fontSize = '1.6em';
        clarityYesIcon.style.cursor = 'pointer';
        clarityYesIcon.style.color = '#4CAF50'; // Green color
        clarityYesIcon.style.opacity = '0.6';
        clarityYesIcon.style.padding = '1px 3px';
        clarityYesIcon.style.borderRadius = '3px';
        clarityYesIcon.style.transition = 'all 0.2s ease';
        clarityYesIcon.style.display = 'inline-block';
        clarityYesIcon.style.lineHeight = '1';
        clarityYesIcon.addEventListener('click', () => {
            // Update active state visually
            clarityYesIcon.style.opacity = '1';
            clarityYesIcon.style.transform = 'scale(1.1)';
            clarityYesIcon.style.backgroundColor = 'rgba(76, 175, 80, 0.05)';
            
            clarityUnclearIcon.style.opacity = '0.6';
            clarityUnclearIcon.style.transform = 'scale(1)';
            clarityUnclearIcon.style.backgroundColor = 'transparent';
            
            clarityOffTargetIcon.style.opacity = '0.6';
            clarityOffTargetIcon.style.transform = 'scale(1)';
            clarityOffTargetIcon.style.backgroundColor = 'transparent';
            
            // Set clarity feedback
            setClarityFeedback(elementId, 'yes');
        });
        clarityToggleContainer.appendChild(clarityYesIcon);
        
        // Create Unclear icon with amber/orange color
        const clarityUnclearIcon = document.createElement('span');
        clarityUnclearIcon.className = 'feedback-icon clarity-unclear-icon';
        clarityUnclearIcon.innerHTML = '&#9888;';
        clarityUnclearIcon.title = 'Unclear';
        clarityUnclearIcon.style.fontSize = '1.6em';
        clarityUnclearIcon.style.cursor = 'pointer';
        clarityUnclearIcon.style.color = '#FF9800'; // Amber/orange color
        clarityUnclearIcon.style.opacity = '0.6';
        clarityUnclearIcon.style.padding = '1px 3px';
        clarityUnclearIcon.style.borderRadius = '3px';
        clarityUnclearIcon.style.transition = 'all 0.2s ease';
        clarityUnclearIcon.style.display = 'inline-block';
        clarityUnclearIcon.style.lineHeight = '1';
        clarityUnclearIcon.addEventListener('click', () => {
            // Update active state visually
            clarityYesIcon.style.opacity = '0.6';
            clarityYesIcon.style.transform = 'scale(1)';
            clarityYesIcon.style.backgroundColor = 'transparent';
            
            clarityUnclearIcon.style.opacity = '1';
            clarityUnclearIcon.style.transform = 'scale(1.1)';
            clarityUnclearIcon.style.backgroundColor = 'rgba(255, 152, 0, 0.05)';
            
            clarityOffTargetIcon.style.opacity = '0.6';
            clarityOffTargetIcon.style.transform = 'scale(1)';
            clarityOffTargetIcon.style.backgroundColor = 'transparent';
            
            // Set clarity feedback
            setClarityFeedback(elementId, 'unclear');
        });
        clarityToggleContainer.appendChild(clarityUnclearIcon);
        
        // Create Off Target icon with red color
        const clarityOffTargetIcon = document.createElement('span');
        clarityOffTargetIcon.className = 'feedback-icon clarity-offtarget-icon';
        clarityOffTargetIcon.innerHTML = '&#10006;';
        clarityOffTargetIcon.title = 'Off target';
        clarityOffTargetIcon.style.fontSize = '1.6em';
        clarityOffTargetIcon.style.cursor = 'pointer';
        clarityOffTargetIcon.style.color = '#F44336'; // Red color
        clarityOffTargetIcon.style.opacity = '0.6';
        clarityOffTargetIcon.style.padding = '1px 3px';
        clarityOffTargetIcon.style.borderRadius = '3px';
        clarityOffTargetIcon.style.transition = 'all 0.2s ease';
        clarityOffTargetIcon.style.display = 'inline-block';
        clarityOffTargetIcon.style.lineHeight = '1';
        clarityOffTargetIcon.addEventListener('click', () => {
            // Update active state visually
            clarityYesIcon.style.opacity = '0.6';
            clarityYesIcon.style.transform = 'scale(1)';
            clarityYesIcon.style.backgroundColor = 'transparent';
            
            clarityUnclearIcon.style.opacity = '0.6';
            clarityUnclearIcon.style.transform = 'scale(1)';
            clarityUnclearIcon.style.backgroundColor = 'transparent';
            
            clarityOffTargetIcon.style.opacity = '1';
            clarityOffTargetIcon.style.transform = 'scale(1.1)';
            clarityOffTargetIcon.style.backgroundColor = 'rgba(244, 67, 54, 0.05)';
            
            // Set clarity feedback
            setClarityFeedback(elementId, 'off_target');
        });
        clarityToggleContainer.appendChild(clarityOffTargetIcon);
        
        clarityContainer.appendChild(clarityToggleContainer);
        
        // Add clarity container to feedback container
        feedbackContainer.appendChild(clarityContainer);
        
        // Create comment input container with everything on one row
        const commentContainer = document.createElement('div');
        commentContainer.className = 'comment-input-row';
        commentContainer.style.display = 'flex';
        commentContainer.style.flexWrap = 'wrap';
        commentContainer.style.alignItems = 'center';
        commentContainer.style.gap = '8px';
        commentContainer.style.margin = '10px 0';
        
        // Create a flex container for the input and buttons
        const inputButtonContainer = document.createElement('div');
        inputButtonContainer.style.display = 'flex';
        inputButtonContainer.style.flexGrow = '1';
        inputButtonContainer.style.gap = '8px';
        inputButtonContainer.style.alignItems = 'center';
        
        const commentInput = document.createElement('input');
        commentInput.type = 'text';
        commentInput.className = 'comment-input';
        commentInput.maxLength = 140;
        commentInput.placeholder = 'Your optional comment here...';
        commentInput.style.flexGrow = '1';
        commentInput.style.padding = '6px 8px';
        commentInput.style.borderRadius = '4px';
        commentInput.style.border = '1px solid #ced4da';
        commentInput.addEventListener('input', (e) => {
            setCommentFeedback(elementId, e.target.value);
        });
        inputButtonContainer.appendChild(commentInput);
        
        // Create button container for submit and cancel
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '8px';
        
        // Create submit button inline with comment input
        const submitButton = document.createElement('button');
        submitButton.className = 'inline-submit-btn';
        submitButton.textContent = 'Submit';
        submitButton.style.backgroundColor = '#007bff';
        submitButton.style.color = 'white';
        submitButton.style.border = 'none';
        submitButton.style.borderRadius = '4px';
        submitButton.style.padding = '6px 12px';
        submitButton.style.cursor = 'pointer';
        submitButton.style.fontSize = '14px';
        submitButton.style.height = '32px';
        submitButton.style.minWidth = '80px';
        submitButton.addEventListener('click', () => {
            // Save feedback for this specific element
            saveFeedback(elementId);
        });
        buttonContainer.appendChild(submitButton);
        
        // Create cancel button inline with submit button - matching height but smaller width
        const cancelButton = document.createElement('button');
        cancelButton.className = 'inline-cancel-btn';
        cancelButton.textContent = 'Cancel';
        cancelButton.style.backgroundColor = '#6c757d'; // Gray color
        cancelButton.style.color = 'white';
        cancelButton.style.border = 'none';
        cancelButton.style.borderRadius = '4px';
        cancelButton.style.padding = '6px 8px'; // Slightly smaller padding
        cancelButton.style.cursor = 'pointer';
        cancelButton.style.fontSize = '14px';
        cancelButton.style.height = '32px'; // Same height as submit
        cancelButton.style.minWidth = '60px'; // Smaller width than submit
        cancelButton.addEventListener('click', () => {
            // Hide the feedback row
            feedbackRow.style.display = 'none';
            // Reset feedback toggle button color to blue
            feedbackToggle.style.backgroundColor = '#007bff';
        });
        buttonContainer.appendChild(cancelButton);
        
        inputButtonContainer.appendChild(buttonContainer);
        commentContainer.appendChild(inputButtonContainer);
        
        // Add status indicator with improved styling
        const statusIndicator = document.createElement('span');
        statusIndicator.className = 'feedback-status';
        statusIndicator.id = `${elementType}-${elementId}-feedback-status`;
        statusIndicator.style.marginLeft = '8px';
        statusIndicator.style.fontSize = '14px';
        statusIndicator.style.padding = '4px 8px';
        statusIndicator.style.borderRadius = '4px';
        statusIndicator.style.display = 'inline-block';
        statusIndicator.style.maxWidth = '200px';
        statusIndicator.style.overflow = 'hidden';
        statusIndicator.style.textOverflow = 'ellipsis';
        statusIndicator.style.whiteSpace = 'nowrap';
        commentContainer.appendChild(statusIndicator);
        
        // Add to feedback container - put clarity (criterion) first, then accuracy (AI assessment)
        feedbackContainer.appendChild(clarityContainer);
        feedbackContainer.appendChild(accuracyContainer);
        feedbackContainer.appendChild(commentContainer);
        
        // Add to feedback cell
        feedbackCell.appendChild(feedbackContainer);
        
        // Add to feedback row
        feedbackRow.appendChild(feedbackCell);
        
        // Insert feedback row after element row
        const nextRow = row.nextElementSibling;
        if (nextRow) {
            tbody.insertBefore(feedbackRow, nextRow);
        } else {
            tbody.appendChild(feedbackRow);
        }
        
        // Add click event to toggle feedback row visibility
        feedbackToggle.addEventListener('click', () => {
            if (feedbackRow.style.display === 'none') {
                feedbackRow.style.display = 'table-row';
                // Change button style to less prominent when feedback is open
                feedbackToggle.style.backgroundColor = '#6c757d'; // Gray color instead of blue
            } else {
                feedbackRow.style.display = 'none';
                // Restore original button style when feedback is closed
                feedbackToggle.style.backgroundColor = '#007bff'; // Back to blue
            }
        });
        
        // Check for existing feedback and update UI accordingly
        const existingFeedback = feedbackData.feedback[elementId];
        if (existingFeedback) {
            // Check for accuracy feedback
            if (existingFeedback.accuracy === 'yes') {
                yesIcon.style.opacity = '1';
                yesIcon.style.transform = 'scale(1.1)';
                yesIcon.style.backgroundColor = 'rgba(76, 175, 80, 0.05)';
                feedbackToggle.classList.add('has-feedback');
            } else if (existingFeedback.accuracy === 'not_useful') {
                notUsefulIcon.style.opacity = '1';
                notUsefulIcon.style.transform = 'scale(1.1)';
                notUsefulIcon.style.backgroundColor = 'rgba(255, 152, 0, 0.05)';
                feedbackToggle.classList.add('has-feedback');
            } else if (existingFeedback.accuracy === 'no') {
                noIcon.style.opacity = '1';
                noIcon.style.transform = 'scale(1.1)';
                noIcon.style.backgroundColor = 'rgba(244, 67, 54, 0.05)';
                feedbackToggle.classList.add('has-feedback');
            }
            
            // Check for clarity feedback
            if (existingFeedback.clarity === 'yes') {
                clarityYesIcon.style.opacity = '1';
                clarityYesIcon.style.transform = 'scale(1.1)';
                clarityYesIcon.style.backgroundColor = 'rgba(76, 175, 80, 0.05)';
                feedbackToggle.classList.add('has-feedback');
            } else if (existingFeedback.clarity === 'unclear') {
                clarityUnclearIcon.style.opacity = '1';
                clarityUnclearIcon.style.transform = 'scale(1.1)';
                clarityUnclearIcon.style.backgroundColor = 'rgba(255, 152, 0, 0.05)';
                feedbackToggle.classList.add('has-feedback');
            } else if (existingFeedback.clarity === 'off_target') {
                clarityOffTargetIcon.style.opacity = '1';
                clarityOffTargetIcon.style.transform = 'scale(1.1)';
                clarityOffTargetIcon.style.backgroundColor = 'rgba(244, 67, 54, 0.05)';
                feedbackToggle.classList.add('has-feedback');
            }
            
            if (existingFeedback.comment) {
                commentInput.value = existingFeedback.comment;
            }
        }
    }
    
    /**
     * Add feedback UI to domain summary
     * @param {HTMLElement} domainRow - The table row for the domain
     * @param {Object} domain - The domain data
     * @param {HTMLElement} tbody - The table body element
     */
    function addDomainFeedbackUI(domainRow, domain, tbody) {
        addFeedbackUI(domainRow, domain, tbody, 'domain', domain.domain_id);
    }
    
    /**
     * Add feedback UI to item
     * @param {HTMLElement} itemContainer - The container element for the item
     * @param {Object} item - The item data
     */
    function addItemFeedbackUI(itemContainer, item) {
        // Create a row-like structure for the item feedback
        const feedbackRow = document.createElement('div');
        feedbackRow.className = 'item-feedback-row';
        
        // Create a container for the feedback UI
        const feedbackCell = document.createElement('div');
        feedbackCell.className = 'item-feedback-cell';
        
        // Add the feedback row to the item container
        feedbackRow.appendChild(feedbackCell);
        itemContainer.appendChild(feedbackRow);
        
        // Use the unified addFeedbackUI function
        addFeedbackUI(feedbackRow, item, itemContainer, 'item', item.item_id);
        
        // Add a heading to the feedback section
        const heading = document.createElement('h4');
        heading.className = 'feedback-heading';
        heading.textContent = 'Provide Feedback';
        feedbackCell.querySelector('.item-feedback-container').prepend(heading);
    }
    // Legacy functions are now replaced by unified feedback system

    /**
     * Add overall feedback UI to the container
     * @param {HTMLElement} container - The container to add the overall feedback UI to
     */
    function addOverallFeedbackUI(container) {
        // Check if overall feedback already exists
        if (container.querySelector('.overall-feedback-container')) return;
        
        // Create overall feedback container
        const overallContainer = document.createElement('div');
        overallContainer.className = 'overall-feedback-container';
        
        // Create header
        const header = document.createElement('h3');
        header.className = 'feedback-header';
        header.textContent = 'Overall Feedback';
        overallContainer.appendChild(header);
        
        // Create star rating container
        const ratingContainer = document.createElement('div');
        ratingContainer.className = 'star-rating-container';
        
        const ratingLabel = document.createElement('div');
        ratingLabel.className = 'rating-label';
        ratingLabel.textContent = 'Rate the overall quality of this assessment:';
        ratingContainer.appendChild(ratingLabel);
        
        // Create stars container
        const starsContainer = document.createElement('div');
        starsContainer.className = 'stars-container';
        
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('span');
            star.className = 'star';
            star.textContent = '★';
            star.dataset.value = i;
            star.addEventListener('click', () => {
                setOverallRating(i);
                updateStarRating(starsContainer, i);
            });
            starsContainer.appendChild(star);
        }
        
        ratingContainer.appendChild(starsContainer);
        overallContainer.appendChild(ratingContainer);
        
        // Create comment input
        const commentContainer = document.createElement('div');
        commentContainer.className = 'overall-comment-container';
        
        const commentLabel = document.createElement('label');
        commentLabel.textContent = 'What could be improved? (optional)';
        commentContainer.appendChild(commentLabel);
        
        const commentInput = document.createElement('textarea');
        commentInput.className = 'overall-comment-input';
        commentInput.placeholder = 'Your suggestions for improvement...';
        commentInput.addEventListener('input', () => {
            setOverallComment(commentInput.value);
        });
        commentContainer.appendChild(commentInput);
        
        // Create submit button for overall feedback
        const submitContainer = document.createElement('div');
        submitContainer.className = 'submit-container';
        
        const submitButton = document.createElement('button');
        submitButton.className = 'submit-feedback-btn';
        submitButton.textContent = 'Submit Overall Feedback';
        submitButton.addEventListener('click', () => {
            // Save overall feedback
            saveOverallFeedback();
        });
        
        // Add status indicator
        const statusIndicator = document.createElement('span');
        statusIndicator.className = 'feedback-status';
        statusIndicator.id = 'overall-feedback-status';
        
        submitContainer.appendChild(submitButton);
        submitContainer.appendChild(statusIndicator);
        
        overallContainer.appendChild(commentContainer);
        overallContainer.appendChild(submitContainer);
        
        // Add to container
        container.appendChild(overallContainer);
        
        // Set existing feedback if available
        if (feedbackData.overallFeedback && feedbackData.overallFeedback.rating && feedbackData.overallFeedback.rating > 0) {
            updateStarRating(starsContainer, feedbackData.overallFeedback.rating);
        }
        if (feedbackData.overallFeedback && feedbackData.overallFeedback.comment) {
            commentInput.value = feedbackData.overallFeedback.comment;
        }
    }

    /**
     * Update star rating UI
     * @param {HTMLElement} starsContainer - The stars container element
     * @param {number} rating - The rating value (1-5)
     */
    function updateStarRating(starsContainer, rating) {
        const stars = starsContainer.querySelectorAll('.star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    /**
     * Set overall rating
     * @param {number} rating - The rating value (1-5)
     */
    function setOverallRating(rating) {
        // Initialize overallFeedback object if it doesn't exist
        if (!feedbackData.overallFeedback) {
            feedbackData.overallFeedback = {};
        }
        feedbackData.overallFeedback.rating = rating;
    }

    /**
     * Set overall comment
     * @param {string} comment - The comment text
     */
    function setOverallComment(comment) {
        // Initialize overallFeedback object if it doesn't exist
        if (!feedbackData.overallFeedback) {
            feedbackData.overallFeedback = {};
        }
        feedbackData.overallFeedback.comment = comment;
    }
    
    /**
     * Save overall feedback
     */
    async function saveOverallFeedback() {
        const statusElement = document.getElementById('overall-feedback-status');
        
        // Show saving status
        statusElement.textContent = 'Saving...';
        statusElement.className = 'feedback-status saving';
        
        try {
            // Make sure we have a runId
            if (!feedbackData.runId) {
                console.error('No runId available for overall feedback submission');
                console.error('feedbackData:', feedbackData);
                console.error('window.token:', window.token);
                
                // Try to recover using window.token
                if (window.token) {
                    console.log('Attempting to recover using window.token');
                    feedbackData.runId = window.token;
                    console.log('Updated runId to:', feedbackData.runId);
                }
                
                // If still no runId, show error
                if (!feedbackData.runId) {
                    statusElement.textContent = 'Error: No run ID';
                    statusElement.className = 'feedback-status error';
                    return;
                }
            }
            
            // Initialize overallFeedback object if it doesn't exist
            if (!feedbackData.overallFeedback) {
                feedbackData.overallFeedback = {};
            }
            
            // Check if we have any feedback to save
            if ((!feedbackData.overallFeedback.rating || feedbackData.overallFeedback.rating <= 0) && 
                (!feedbackData.overallFeedback.comment || feedbackData.overallFeedback.comment.trim() === '')) {
                statusElement.textContent = 'No feedback to save';
                statusElement.className = 'feedback-status warning';
                
                // Clear status after a delay
                setTimeout(() => {
                    statusElement.textContent = '';
                    statusElement.className = 'feedback-status';
                }, 3000);
                return;
            }
            
            // Prepare feedback data for submission
            const feedbackPayload = {
                run_id: feedbackData.runId,
                feedback_type: 'overall',
                feedback: feedbackData.overallFeedback
            };
            
            console.log('Sending overall feedback with run_id:', feedbackData.runId);
            
            // Send feedback to API
            const response = await fetch(`${window.AppConfig.api.baseUrl}${window.AppConfig.api.endpoints.resultsFeedback}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(feedbackPayload)
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            // Show success status
            statusElement.textContent = 'Overall feedback saved!';
            statusElement.className = 'feedback-status success';
            
            // Clear status after a delay
            setTimeout(() => {
                statusElement.textContent = '';
                statusElement.className = 'feedback-status';
            }, 3000);
            
        } catch (error) {
            console.error('Error saving overall feedback:', error);
            
            // Show error status
            statusElement.textContent = 'Error saving feedback';
            statusElement.className = 'feedback-status error';
            
            // Clear status after a delay
            setTimeout(() => {
                statusElement.textContent = '';
                statusElement.className = 'feedback-status';
            }, 5000);
        }
    }

    /**
     * Save feedback for a specific domain
     * @param {string} domainId - The domain ID
     */
    async function saveDomainFeedback(domainId) {
        return FeedbackAPI.saveFeedback(domainId, 'domain');
    }
    
    // The saveFeedback function has been removed as we now use individual submit buttons for each domain and overall feedback

    /**
     * Set item accuracy feedback
     * @param {string} itemId - The item ID
     * @param {string} accuracy - The accuracy value ('yes', 'not_useful', or 'no')
     */
    function setItemAccuracyFeedback(itemId, accuracy) {
        FeedbackAPI.setAccuracyFeedback(itemId, 'item', accuracy);
    }

    /**
     * Set item comment feedback
     * @param {string} itemId - The item ID
     * @param {string} comment - The comment text
     */
    function setItemCommentFeedback(itemId, comment) {
        FeedbackAPI.setCommentFeedback(itemId, 'item', comment);
    }

    /**
     * Save feedback for a specific item
     * @param {string} itemId - The item ID
     */
    async function saveItemFeedback(itemId) {
        return FeedbackAPI.saveFeedback(itemId, 'item');
    }

    /**
     * Add feedback UI to item detail
     * @param {HTMLElement} itemContainer - The container for the item
     * @param {Object} item - The item data
     */
    function addItemFeedbackUI(itemContainer, item) {
        if (!item || !item.id) {
            console.error('Item data is missing or invalid');
            return;
        }
        
        const itemId = item.id;
        
        // Create feedback container
        const feedbackContainer = document.createElement('div');
        feedbackContainer.className = 'feedback-container item-feedback';
        
        // Create accuracy feedback section
        const accuracyContainer = document.createElement('div');
        accuracyContainer.className = 'accuracy-feedback';
        
        const accuracyLabel = document.createElement('div');
        accuracyLabel.className = 'feedback-label';
        accuracyLabel.textContent = 'Was this assessment accurate?';
        accuracyContainer.appendChild(accuracyLabel);
        
        // Create accuracy toggle buttons
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'accuracy-toggle';
        
        // Yes button
        const yesButton = document.createElement('button');
        yesButton.className = 'accuracy-btn yes';
        yesButton.textContent = 'Yes';
        yesButton.addEventListener('click', () => {
            // Update active state
            toggleContainer.querySelectorAll('.accuracy-btn').forEach(btn => btn.classList.remove('active'));
            yesButton.classList.add('active');
            
            // Set feedback
            setItemAccuracyFeedback(itemId, 'yes');
        });
        toggleContainer.appendChild(yesButton);
        
        // Not useful button
        const notUsefulButton = document.createElement('button');
        notUsefulButton.className = 'accuracy-btn not-useful';
        notUsefulButton.textContent = 'Not useful';
        notUsefulButton.addEventListener('click', () => {
            // Update active state
            toggleContainer.querySelectorAll('.accuracy-btn').forEach(btn => btn.classList.remove('active'));
            notUsefulButton.classList.add('active');
            
            // Set feedback
            setItemAccuracyFeedback(itemId, 'not_useful');
        });
        toggleContainer.appendChild(notUsefulButton);
        
        // No button
        const noButton = document.createElement('button');
        noButton.className = 'accuracy-btn no';
        noButton.textContent = 'No';
        noButton.addEventListener('click', () => {
            // Update active state
            toggleContainer.querySelectorAll('.accuracy-btn').forEach(btn => btn.classList.remove('active'));
            noButton.classList.add('active');
            
            // Set feedback
            setItemAccuracyFeedback(itemId, 'no');
        });
        toggleContainer.appendChild(noButton);
        
        accuracyContainer.appendChild(toggleContainer);
        feedbackContainer.appendChild(accuracyContainer);
        
        // Create comment input
        const commentContainer = document.createElement('div');
        commentContainer.className = 'comment-feedback';
        
        const commentLabel = document.createElement('label');
        commentLabel.textContent = 'Comments (optional, max 140 chars)';
        commentContainer.appendChild(commentLabel);
        
        const commentInput = document.createElement('input');
        commentInput.type = 'text';
        commentInput.className = 'comment-input';
        commentInput.maxLength = 140;
        commentInput.placeholder = 'Your feedback on this item...';
        commentInput.addEventListener('input', () => {
            setItemCommentFeedback(itemId, commentInput.value);
        });
        commentContainer.appendChild(commentInput);
        
        // Create submit button and status indicator
        const submitContainer = document.createElement('div');
        submitContainer.className = 'submit-container';
        
        const submitButton = document.createElement('button');
        submitButton.className = 'submit-feedback-btn';
        submitButton.textContent = 'Submit Feedback';
        submitButton.id = `item-${itemId}-submit-btn`;
        submitButton.addEventListener('click', () => {
            saveItemFeedback(itemId);
        });
        
        // Add status indicator
        const statusIndicator = document.createElement('span');
        statusIndicator.className = 'feedback-status';
        statusIndicator.id = `item-${itemId}-feedback-status`;
        
        submitContainer.appendChild(submitButton);
        submitContainer.appendChild(statusIndicator);
        
        commentContainer.appendChild(submitContainer);
        feedbackContainer.appendChild(commentContainer);
        
        // Add feedback container to item container
        itemContainer.appendChild(feedbackContainer);
        
        // Add feedback toggle button to item header if it exists
        const itemHeader = itemContainer.querySelector('.item-header') || itemContainer.querySelector('.item-title');
        if (itemHeader) {
            const feedbackToggle = document.createElement('button');
            feedbackToggle.className = 'feedback-toggle-btn';
            feedbackToggle.id = `item-${itemId}-feedback-toggle`;
            feedbackToggle.innerHTML = '<span class="icon">💬</span>';
            feedbackToggle.title = 'Provide feedback on this item';
            feedbackToggle.addEventListener('click', () => {
                // Toggle visibility of feedback container
                if (feedbackContainer.style.display === 'none') {
                    feedbackContainer.style.display = 'block';
                } else {
                    feedbackContainer.style.display = 'none';
                }
            });
            
            itemHeader.appendChild(feedbackToggle);
            
            // Initially hide feedback container
            feedbackContainer.style.display = 'none';
        }
    }

    // This section has been moved to the implementation above

    /**
     * Check if the module has been initialized
     * @returns {boolean} True if initialized, false otherwise
     */
    function isInitialized() {
        return !!feedbackData.runId;
    }
    
    // Export public API
    const ResultsFeedbackAPI = {
        init,
        isInitialized,
        // Unified feedback functions
        addFeedbackUI,
        setAccuracyFeedback,
        setCommentFeedback,
        saveFeedback,
        // Wrapper functions for backward compatibility
        addDomainFeedbackUI,
        addItemFeedbackUI,
        // Overall feedback functions
        addOverallFeedbackUI,
        setOverallComment,
        setOverallRating,
        saveOverallFeedback
    };
    
    // Make sure it's available globally
    window.ResultsFeedback = ResultsFeedbackAPI;
    
    // Log that the module has been loaded
    console.log('ResultsFeedback module loaded and exported to window');
    
    // Return the API for module systems
    return ResultsFeedbackAPI;
})();
