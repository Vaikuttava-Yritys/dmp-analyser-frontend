/**
 * Test script to verify that modules are loaded correctly
 */

// This will run when the script is loaded
console.log('Test script loaded');
console.log('FeedbackData available:', typeof window.FeedbackData !== 'undefined');
console.log('FeedbackRender available:', typeof window.FeedbackRender !== 'undefined');

if (window.FeedbackRender) {
    console.log('FeedbackRender functions:');
    console.log('- renderManuscriptMetadata:', typeof window.FeedbackRender.renderManuscriptMetadata);
    console.log('- renderAnalysisInfo:', typeof window.FeedbackRender.renderAnalysisInfo);
    console.log('- renderFeedbackNote:', typeof window.FeedbackRender.renderFeedbackNote);
    console.log('- renderDomainSummaries:', typeof window.FeedbackRender.renderDomainSummaries);
    console.log('- renderDomains:', typeof window.FeedbackRender.renderDomains);
    console.log('- renderOverallAssessment:', typeof window.FeedbackRender.renderOverallAssessment);
    console.log('- renderChecklistInfo:', typeof window.FeedbackRender.renderChecklistInfo);
}
