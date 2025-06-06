/**
 * Data handling utilities for the DMP feedback view
 */

// Helper function to safely get nested properties
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

// Extract and normalize data from the API response
function normalizeData(data) {
    // Check if data is nested inside enriched_data
    if (data.enriched_data && !data.sections) {
        return data.enriched_data;
    }
    return data;
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '';
    
    try {
        // Handle MongoDB ISODate format or standard date string
        const date = new Date(dateString);
        return date.toLocaleDateString();
    } catch (e) {
        console.warn('Error formatting date:', e);
        return dateString;
    }
}

// Extract domains from sections or directly from data
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
    
    return domains;
}

// Get domain summaries from either the summary object or by collecting from domains
function extractDomainSummaries(data) {
    // First try to get from summary.domain_summaries
    const summaryDomainSummaries = safeGet(data, 'summary.domain_summaries');
    if (summaryDomainSummaries && Object.keys(summaryDomainSummaries).length > 0) {
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
    
    return domainSummaries;
}

// Get sections with their domains
function extractSections(data) {
    if (!data.sections || !Array.isArray(data.sections)) {
        // If no sections, create a default one with all domains
        return [{
            section_id: '0',
            name: 'Analysis Results',
            domains: extractDomains(data)
        }];
    }
    
    return data.sections;
}

// Get the appropriate color class for a compliance value
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

// Export the functions
window.FeedbackData = {
    safeGet,
    normalizeData,
    formatDate,
    extractDomains,
    extractDomainSummaries,
    extractSections,
    getComplianceColorClass
};
