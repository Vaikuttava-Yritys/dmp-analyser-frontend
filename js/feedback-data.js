/**
 * Data handling utilities for the DMP results view
 * @module FeedbackData
 */

// Use strict mode for better error catching and performance
'use strict';

/**
 * Helper function to safely get nested properties without throwing errors
 * @param {Object} obj - The object to extract data from
 * @param {string} path - Dot notation path to the property
 * @param {*} defaultValue - Default value to return if property doesn't exist
 * @returns {*} The property value or defaultValue
 */
function safeGet(obj, path, defaultValue = '') {
    if (!obj) return defaultValue;
    
    // Handle direct property access
    if (!path.includes('.')) {
        return obj[path] !== undefined ? obj[path] : defaultValue;
    }
    
    // Handle nested property access
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
        if (current === null || current === undefined || typeof current !== 'object') {
            return defaultValue;
        }
        current = current[part];
    }
    
    return current !== undefined ? current : defaultValue;
}

/**
 * Extract and normalize data from the API response
 * @param {Object} data - The raw data from the API
 * @returns {Object} Normalized data structure
 */
function normalizeData(data) {
    // Ensure AppConfig is properly initialized
    ensureAppConfig();
    
    // Log data structure if debug is enabled
    if (window.AppConfig?.ui?.debug) {
        console.log('Normalizing data:', data);
    }
    
    // Check if data is nested inside enriched_data
    if (data.enriched_data && !data.sections) {
        return data.enriched_data;
    }
    return data;
}

/**
 * Format date for display using locale settings
 * @param {string} dateString - ISO date string or MongoDB date
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    if (!dateString) return '';
    
    try {
        // Handle MongoDB ISODate format or standard date string
        const date = new Date(dateString);
        return date.toLocaleDateString();
    } catch (e) {
        ensureAppConfig();
        if (window.AppConfig.ui.debug) {
            console.warn('Error formatting date:', e);
        }
        return dateString;
    }
}

/**
 * Extract domains from sections or directly from data
 * @param {Object} data - The normalized data object
 * @returns {Array} Array of domain objects
 */
function extractDomains(data) {
    let domains = [];
    
    // Check if domains are nested in sections
    if (data.sections && Array.isArray(data.sections)) {
        data.sections.forEach(section => {
            if (section.domains && Array.isArray(section.domains)) {
                domains = domains.concat(section.domains);
            }
        });
    } 
    // Check if domains are directly in the data
    else if (data.domains && Array.isArray(data.domains)) {
        domains = data.domains;
    }
    
    ensureAppConfig();
    if (window.AppConfig.ui.debug) {
        console.log(`Found ${domains.length} domains in data`);
    }
    
    return domains;
}

/**
 * Get domain summaries from either the summary object or by collecting from domains
 * @param {Object} data - The normalized data object
 * @returns {Object} Map of domain_id to summary text
 */
function extractDomainSummaries(data) {
    // First try to get from summary.domain_summaries
    const summaryDomainSummaries = safeGet(data, 'summary.domain_summaries');
    if (summaryDomainSummaries && Object.keys(summaryDomainSummaries).length > 0) {
        ensureAppConfig();
        if (window.AppConfig.ui.debug) {
            console.log('Using domain summaries from summary object');
        }
        return summaryDomainSummaries;
    }
    
    // If not found, try to collect from domains
    const domains = extractDomains(data);
    const domainSummaries = {};
    
    domains.forEach(domain => {
        if (domain.domain_id && domain.summary) {
            domainSummaries[domain.domain_id] = 
                typeof domain.summary === 'string' ? domain.summary : 
                domain.summary.summary || '';
        }
    });
    
    ensureAppConfig();
    if (window.AppConfig.ui.debug) {
        console.log(`Built domain summaries from ${domains.length} domains`);
    }
    
    return domainSummaries;
}

/**
 * Get sections with their domains
 * @param {Object} data - The normalized data object
 * @returns {Array} Array of section objects
 */
function extractSections(data) {
    if (!data.sections || !Array.isArray(data.sections)) {
        // If no sections, create a default one with all domains
        const domains = extractDomains(data);
        ensureAppConfig();
        if (window.AppConfig.ui.debug) {
            console.log('No sections found, creating default section with all domains');
        }
        return [{
            section_id: '0',
            name: 'Analysis Results',
            domains: domains
        }];
    }
    
    ensureAppConfig();
    if (window.AppConfig.ui.debug) {
        console.log(`Found ${data.sections.length} sections in data`);
    }
    
    return data.sections;
}

/**
 * Get the appropriate color class for a compliance value
 * @param {string} compliance - The compliance value text
 * @returns {string} CSS class name for styling
 */
function getComplianceColorClass(compliance) {
    if (!compliance) return 'compliance-Unknown';
    
    const value = typeof compliance === 'string' ? compliance.toLowerCase() : '';
    
    if (value === 'yes' || value === 'excellent' || value === 'full') {
        return 'compliance-Excellent';
    } else if (value === 'partial' || value === 'satisfactory') {
        return 'compliance-Satisfactory';
    } else if (value === 'no' || value === 'poor') {
        return 'compliance-Poor';
    }
    
    return 'compliance-Unknown';
}

/**
 * Ensure the AppConfig is properly initialized with required properties
 * @private
 */
function ensureAppConfig() {
    if (!window.AppConfig) {
        console.warn('AppConfig not initialized, creating default configuration');
        window.AppConfig = {
            api: { 
                baseUrl: window.ENV?.API_BASE_URL || '',
                timeout: window.ENV?.API_TIMEOUT_MS || 30000,
                maxRetries: window.ENV?.API_MAX_RETRIES || 3,
                endpoints: {}
            },
            auth: {
                proxyUrl: window.ENV?.AUTH_PROXY_URL || '',
                tokenEndpoint: window.ENV?.TOKEN_ENDPOINT || '/api/token'
            },
            ui: {
                debug: window.ENV?.DEBUG || false,
                showApiStatus: window.ENV?.SHOW_API_STATUS || false
            },
            features: {
                enableFeedback: window.ENV?.ENABLE_FEEDBACK || true
            }
        };
    } else {
        // Ensure all required properties exist
        if (!window.AppConfig.api) window.AppConfig.api = {};
        if (!window.AppConfig.api.endpoints) window.AppConfig.api.endpoints = {};
        if (!window.AppConfig.ui) window.AppConfig.ui = { debug: false };
    }
}

/**
 * FeedbackData module - Exports data handling utilities for the DMP results view
 * @namespace FeedbackData
 */
window.FeedbackData = {
    /**
     * Safely get nested properties from objects
     */
    safeGet,
    
    /**
     * Normalize data structure from API
     */
    normalizeData,
    
    /**
     * Format dates for display
     */
    formatDate,
    
    /**
     * Extract domains from data
     */
    extractDomains,
    
    /**
     * Extract domain summaries
     */
    extractDomainSummaries,
    
    /**
     * Extract sections with domains
     */
    extractSections,
    
    /**
     * Get compliance color class
     */
    getComplianceColorClass,
    
    /**
     * Initialize the module
     * @returns {boolean} True if initialization was successful
     */
    init() {
        // Ensure AppConfig is properly initialized
        ensureAppConfig();
        
        // AppConfig already ensured at the beginning of init()
        if (window.AppConfig.ui.debug) {
            console.log('FeedbackData module initialized');
        }
        return true;
    }
};
