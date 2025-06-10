/**
 * Results Feedback Module
 * Handles user feedback on analysis results
 */

const ResultsFeedback = (function() {
    // Store feedback data
    const feedbackData = {
        domainFeedback: {},
        itemFeedback: {},
        overallFeedback: {
            rating: 0,
            comment: ''
        },
        analysisId: null
    };

    /**
     * Initialize feedback functionality
     * @param {string} analysisId - The ID of the analysis
     */
    function init(analysisId) {
        feedbackData.analysisId = analysisId;
        
        console.log('Results feedback initialized for analysis:', analysisId);
    }

    /**
     * Add feedback UI to domain summary
     * @param {HTMLElement} domainRow - The table row for the domain
     * @param {Object} domain - The domain data
     * @param {HTMLElement} tbody - The table body element
     */
    function addDomainFeedbackUI(domainRow, domain, tbody) {
        // Add feedback toggle button to the domain row
        const lastCell = domainRow.lastElementChild;
        
        // Create feedback toggle button
        const feedbackToggle = document.createElement('button');
        feedbackToggle.className = 'feedback-toggle-btn';
        feedbackToggle.innerHTML = '<span class="feedback-icon">💬</span> Feedback';
        feedbackToggle.title = 'Toggle feedback form';
        
        // Add to last cell
        lastCell.appendChild(document.createElement('br'));
        lastCell.appendChild(feedbackToggle);
        
        // Add domain ID attribute to the row for reference
        domainRow.setAttribute('data-domain-id', domain.domain_id);
        
        // Create feedback row
        const feedbackRow = document.createElement('tr');
        feedbackRow.className = 'domain-feedback-row';
        feedbackRow.style.display = 'none'; // Initially hidden by default
        
        // Create feedback cell that spans all columns
        const feedbackCell = document.createElement('td');
        feedbackCell.className = 'domain-feedback-cell';
        feedbackCell.colSpan = domainRow.cells.length;
        
        // Create feedback container
        const feedbackContainer = document.createElement('div');
        feedbackContainer.className = 'domain-feedback-container';
        
        // Create accuracy feedback container
        const accuracyContainer = document.createElement('div');
        accuracyContainer.className = 'accuracy-feedback';
        
        // Create label
        const accuracyLabel = document.createElement('label');
        accuracyLabel.textContent = 'Is this assessment accurate and useful?';
        accuracyContainer.appendChild(accuracyLabel);
        
        // Create toggle buttons container
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'toggle-container';
        
        // Create Yes button
        const yesButton = document.createElement('button');
        yesButton.className = 'toggle-btn yes-btn';
        yesButton.textContent = 'Yes';
        yesButton.addEventListener('click', () => {
            // Remove active class from all buttons
            yesButton.classList.add('active');
            notUsefulButton.classList.remove('active');
            noButton.classList.remove('active');
            
            // Set accuracy feedback in memory but don't save to server
            setDomainAccuracyFeedback(domain.domain_id, 'yes');
        });
        
        // Create Not Useful button
        const notUsefulButton = document.createElement('button');
        notUsefulButton.className = 'toggle-btn not-useful-btn';
        notUsefulButton.textContent = 'Not useful';
        notUsefulButton.addEventListener('click', () => {
            // Remove active class from all buttons
            yesButton.classList.remove('active');
            notUsefulButton.classList.add('active');
            noButton.classList.remove('active');
            
            // Set accuracy feedback in memory but don't save to server
            setDomainAccuracyFeedback(domain.domain_id, 'not_useful');
        });
        
        // Create No button
        const noButton = document.createElement('button');
        noButton.className = 'toggle-btn no-btn';
        noButton.textContent = 'No';
        noButton.addEventListener('click', () => {
            // Remove active class from all buttons
            yesButton.classList.remove('active');
            notUsefulButton.classList.remove('active');
            noButton.classList.add('active');
            
            // Set accuracy feedback in memory but don't save to server
            setDomainAccuracyFeedback(domain.domain_id, 'no');
        });
        
        // Add buttons to container
        toggleContainer.appendChild(yesButton);
        toggleContainer.appendChild(notUsefulButton);
        toggleContainer.appendChild(noButton);
        accuracyContainer.appendChild(toggleContainer);
        
        // Create comment input container with everything on one row
        const commentContainer = document.createElement('div');
        commentContainer.className = 'comment-input-row';
        
        const commentLabel = document.createElement('label');
        commentLabel.textContent = 'Comment (optional):';
        commentLabel.className = 'comment-label';
        commentContainer.appendChild(commentLabel);
        
        const commentInput = document.createElement('input');
        commentInput.type = 'text';
        commentInput.className = 'comment-input';
        commentInput.maxLength = 140;
        commentInput.placeholder = 'Add your comment here...';
        commentInput.addEventListener('input', (e) => {
            setDomainCommentFeedback(domain.domain_id, e.target.value);
        });
        commentContainer.appendChild(commentInput);
        
        // Create submit button inline with comment input
        const submitButton = document.createElement('button');
        submitButton.className = 'inline-submit-btn';
        submitButton.textContent = 'Submit';
        submitButton.addEventListener('click', () => {
            // Save feedback for this specific domain
            saveDomainFeedback(domain.domain_id);
        });
        commentContainer.appendChild(submitButton);
        
        // Add status indicator
        const statusIndicator = document.createElement('span');
        statusIndicator.className = 'feedback-status';
        statusIndicator.id = `domain-${domain.domain_id}-feedback-status`;
        commentContainer.appendChild(statusIndicator);
        
        // Add to feedback container
        feedbackContainer.appendChild(accuracyContainer);
        feedbackContainer.appendChild(commentContainer);
        feedbackCell.appendChild(feedbackContainer);
        
        // Add to feedback row
        feedbackRow.appendChild(feedbackCell);
        
        // Insert feedback row after domain row
        if (domainRow.nextSibling) {
            tbody.insertBefore(feedbackRow, domainRow.nextSibling);
        } else {
            tbody.appendChild(feedbackRow);
        }
        
        // Toggle feedback row visibility when button is clicked
        feedbackToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isVisible = feedbackRow.style.display !== 'none';
            feedbackRow.style.display = isVisible ? 'none' : 'table-row';
            feedbackToggle.classList.toggle('active', !isVisible);
            return false;
        });
        
        // Set existing feedback if available
        const existingFeedback = feedbackData.domainFeedback[domain.domain_id];
        if (existingFeedback) {
            // Set accuracy toggle
            if (existingFeedback.accuracy === 'yes') {
                yesButton.classList.add('active');
                feedbackToggle.classList.add('has-feedback');
            } else if (existingFeedback.accuracy === 'not_useful') {
                notUsefulButton.classList.add('active');
                feedbackToggle.classList.add('has-feedback');
            } else if (existingFeedback.accuracy === 'no') {
                noButton.classList.add('active');
                feedbackToggle.classList.add('has-feedback');
            }
            
            // Set comment
            if (existingFeedback.comment) {
                commentInput.value = existingFeedback.comment;
                feedbackToggle.classList.add('has-feedback');
            }
        }
    }

    /**
     * Set accuracy feedback for a domain
     * @param {string} domainId - The domain ID
     * @param {string} accuracy - The accuracy value ('yes', 'not_useful', or 'no')
     */
    function setDomainAccuracyFeedback(domainId, accuracy) {
        // Initialize domain feedback if it doesn't exist
        if (!feedbackData.domainFeedback[domainId]) {
            feedbackData.domainFeedback[domainId] = {};
        }
        
        // Set accuracy feedback
        feedbackData.domainFeedback[domainId].accuracy = accuracy;
    }

    /**
     * Set domain comment feedback
     * @param {string} domainId - The domain ID
     * @param {string} comment - The comment text
     */
    function setDomainCommentFeedback(domainId, comment) {
        if (!feedbackData.domainFeedback[domainId]) {
            feedbackData.domainFeedback[domainId] = {
                accuracy: null,
                comment: comment
            };
        } else {
            feedbackData.domainFeedback[domainId].comment = comment;
        }
    }

    /**
     * Add overall feedback UI at the end of domain summaries
     * @param {HTMLElement} container - The container element
     */
    function addOverallFeedbackUI(container) {
        // Check if overall feedback already exists
        if (container.querySelector('.overall-feedback-container')) return;
        
        // Create overall feedback container
        const overallContainer = document.createElement('div');
        overallContainer.className = 'overall-feedback-container';
        
        // Create heading
        const heading = document.createElement('h3');
        heading.textContent = 'How well do these results capture the document\'s strengths and gaps?';
        overallContainer.appendChild(heading);
        
        // Create star rating
        const ratingContainer = document.createElement('div');
        ratingContainer.className = 'star-rating-container';
        
        // Create star rating label
        const ratingLabel = document.createElement('div');
        ratingLabel.className = 'rating-label';
        ratingLabel.textContent = 'Rate from 1 (poor) to 5 (excellent):';
        ratingContainer.appendChild(ratingLabel);
        
        // Create stars
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
        if (feedbackData.overallFeedback.rating > 0) {
            updateStarRating(starsContainer, feedbackData.overallFeedback.rating);
        }
        if (feedbackData.overallFeedback.comment) {
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
        feedbackData.overallFeedback.rating = rating;
    }

    /**
     * Set overall comment
     * @param {string} comment - The comment text
     */
    function setOverallComment(comment) {
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
            // Check if we have any feedback to save
            if (!feedbackData.overallFeedback.rating && !feedbackData.overallFeedback.comment) {
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
                analysis_id: feedbackData.analysisId,
                overall_feedback: feedbackData.overallFeedback,
                timestamp: new Date().toISOString()
            };
            
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
        const statusElement = document.getElementById(`domain-${domainId}-feedback-status`);
        
        // Show saving status
        statusElement.textContent = 'Saving...';
        statusElement.className = 'feedback-status saving';
        
        try {
            // Get the domain feedback
            const domainFeedbackData = feedbackData.domainFeedback[domainId] || {};
            
            // Check if we have any feedback to save
            if (!domainFeedbackData.accuracy && !domainFeedbackData.comment) {
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
                analysis_id: feedbackData.analysisId,
                domain_feedback: {
                    [domainId]: domainFeedbackData
                },
                timestamp: new Date().toISOString()
            };
            
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
            statusElement.textContent = 'Feedback saved!';
            statusElement.className = 'feedback-status success';
            
            // Update the feedback toggle button to show feedback has been provided
            const domainRow = document.querySelector(`tr[data-domain-id="${domainId}"]`);
            if (domainRow) {
                const feedbackToggle = domainRow.querySelector('.feedback-toggle-btn');
                if (feedbackToggle) {
                    feedbackToggle.classList.add('has-feedback');
                }
            }
            
            // Clear status after a delay
            setTimeout(() => {
                statusElement.textContent = '';
                statusElement.className = 'feedback-status';
            }, 3000);
            
        } catch (error) {
            console.error('Error saving domain feedback:', error);
            
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
    
    // The saveFeedback function has been removed as we now use individual submit buttons for each domain and overall feedback

    // Public API
    return {
        init,
        addDomainFeedbackUI,
        addOverallFeedbackUI
    };
})();
