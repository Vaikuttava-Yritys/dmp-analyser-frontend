/**
 * Feedback API Module
 * Handles all feedback submissions to the API
 */

const FeedbackAPI = (function() {
    // Store feedback data
    const feedbackData = {
        domainFeedback: {},
        itemFeedback: {},
        overallFeedback: {
            rating: 0,
            comment: ''
        },
        runId: null
    };

    /**
     * Initialize feedback functionality
     * @param {string} runId - The ID of the analysis run (token)
     */
    function init(runId) {
        feedbackData.runId = runId;
        console.log('Feedback API initialized for run:', runId);
    }

    /**
     * Set accuracy feedback for a domain or item
     * @param {string} id - The domain or item ID
     * @param {string} type - The type of feedback ('domain' or 'item')
     * @param {string} accuracy - The accuracy value ('yes', 'not_useful', or 'no')
     */
    function setAccuracyFeedback(id, type, accuracy) {
        const container = type === 'domain' ? feedbackData.domainFeedback : feedbackData.itemFeedback;
        
        if (!container[id]) {
            container[id] = {};
        }
        
        container[id].accuracy = accuracy;
    }

    /**
     * Set comment feedback for a domain or item
     * @param {string} id - The domain or item ID
     * @param {string} type - The type of feedback ('domain' or 'item')
     * @param {string} comment - The comment text
     */
    function setCommentFeedback(id, type, comment) {
        const container = type === 'domain' ? feedbackData.domainFeedback : feedbackData.itemFeedback;
        
        if (!container[id]) {
            container[id] = {};
        }
        
        container[id].comment = comment;
    }

    /**
     * Save feedback for a domain or item
     * @param {string} id - The domain or item ID
     * @param {string} type - The type of feedback ('domain' or 'item')
     * @returns {Promise} - A promise that resolves when the feedback is saved
     */
    async function saveFeedback(id, type) {
        const statusElementId = `${type}-${id}-feedback-status`;
        const statusElement = document.getElementById(statusElementId);
        
        if (!statusElement) {
            console.error(`Status element not found: ${statusElementId}`);
            return Promise.reject(new Error(`Status element not found: ${statusElementId}`));
        }
        
        // Show saving status
        statusElement.textContent = 'Saving...';
        statusElement.className = 'feedback-status saving';
        
        try {
            // Get the feedback data
            const container = type === 'domain' ? feedbackData.domainFeedback : feedbackData.itemFeedback;
            const feedbackItem = container[id] || {};
            
            // Check if we have any feedback to save
            if (!feedbackItem.accuracy && !feedbackItem.comment) {
                statusElement.textContent = 'No feedback to save';
                statusElement.className = 'feedback-status warning';
                
                // Clear status after a delay
                setTimeout(() => {
                    statusElement.textContent = '';
                    statusElement.className = 'feedback-status';
                }, 3000);
                
                return Promise.resolve(false);
            }
            
            // Prepare feedback data for submission
            const feedbackPayload = {
                run_id: feedbackData.runId,
                feedback_type: type,
                id: id,
                feedback: feedbackItem
            };
            
            console.log(`Sending ${type} feedback:`, id, feedbackItem);
            
            // Send feedback to API with timeout handling
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(`${window.AppConfig.api.baseUrl}${window.AppConfig.api.endpoints.resultsFeedback}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(feedbackPayload),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API error: ${response.status} - ${errorText}`);
            }
            
            // Try to parse response as JSON
            let responseData;
            try {
                responseData = await response.json();
                console.log('Feedback submission response:', responseData);
            } catch (e) {
                // Response wasn't JSON, that's okay
            }
            
            // Show success status
            statusElement.textContent = 'Feedback saved!';
            statusElement.className = 'feedback-status success';
            
            // Update the feedback toggle button to show feedback has been provided
            const feedbackToggleId = `${type}-${id}-feedback-toggle`;
            const feedbackToggle = document.getElementById(feedbackToggleId);
            if (feedbackToggle) {
                feedbackToggle.classList.add('has-feedback');
            }
            
            // Clear status after a delay
            setTimeout(() => {
                statusElement.textContent = '';
                statusElement.className = 'feedback-status';
            }, 3000);
            
            return Promise.resolve(true);
            
        } catch (error) {
            console.error(`Error saving ${type} feedback:`, error);
            
            // Show error status
            statusElement.textContent = 'Error saving feedback';
            statusElement.className = 'feedback-status error';
            
            // Clear status after a delay
            setTimeout(() => {
                statusElement.textContent = '';
                statusElement.className = 'feedback-status';
            }, 5000);
            
            return Promise.reject(error);
        }
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
     * @returns {Promise} - A promise that resolves when the feedback is saved
     */
    async function saveOverallFeedback() {
        const statusElement = document.getElementById('overall-feedback-status');
        
        if (!statusElement) {
            console.error('Overall feedback status element not found');
            return Promise.reject(new Error('Overall feedback status element not found'));
        }
        
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
                
                return Promise.resolve(false);
            }
            
            // Prepare feedback data for submission
            const feedbackPayload = {
                run_id: feedbackData.runId,
                feedback_type: 'overall',
                feedback: feedbackData.overallFeedback
            };
            
            console.log('Sending overall feedback with payload:', feedbackPayload);
            
            console.log('Sending overall feedback:', feedbackData.overallFeedback);
            
            // Send feedback to API with timeout handling
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(`${window.AppConfig.api.baseUrl}${window.AppConfig.api.endpoints.resultsFeedback}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(feedbackPayload),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API error: ${response.status} - ${errorText}`);
            }
            
            // Try to parse response as JSON
            let responseData;
            try {
                responseData = await response.json();
                console.log('Overall feedback submission response:', responseData);
            } catch (e) {
                // Response wasn't JSON, that's okay
            }
            
            // Show success status
            statusElement.textContent = 'Feedback saved!';
            statusElement.className = 'feedback-status success';
            
            // Clear status after a delay
            setTimeout(() => {
                statusElement.textContent = '';
                statusElement.className = 'feedback-status';
            }, 3000);
            
            return Promise.resolve(true);
            
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
            
            return Promise.reject(error);
        }
    }

    // Public API
    return {
        init,
        setAccuracyFeedback,
        setCommentFeedback,
        saveFeedback,
        setOverallRating,
        setOverallComment,
        saveOverallFeedback
    };
})();
