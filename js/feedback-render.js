/**
 * Rendering utilities for the DMP feedback view
 */

// Render manuscript metadata section
function renderManuscriptMetadata(data) {
    const container = document.getElementById('manuscript-metadata');
    container.innerHTML = '';
    
    // Get normalized data
    const normalizedData = FeedbackData.normalizeData(data);
    
    // Create section header
    const header = document.createElement('h2');
    header.className = 'section-header';
    header.textContent = 'Manuscript Metadata';
    container.appendChild(header);
    
    // Create metadata container
    const metadataDiv = document.createElement('div');
    metadataDiv.className = 'metadata-container';
    
    // Get DMP metadata from the correct location
    const dmpMetadata = FeedbackData.safeGet(normalizedData, 'summary.dmp_metadata') || 
                        FeedbackData.safeGet(normalizedData, 'enriched_data.summary.dmp_metadata') || 
                        {};
    
    // Get manuscript title from multiple possible fields
    const title = dmpMetadata.title || 
                  FeedbackData.safeGet(normalizedData, 'title') || 
                  FeedbackData.safeGet(normalizedData, 'manuscript_title') || 
                  'Untitled Manuscript';
    
    // Create title element
    const titleElem = document.createElement('h3');
    titleElem.className = 'manuscript-title';
    titleElem.textContent = title;
    metadataDiv.appendChild(titleElem);
    
    // Get study design and discipline from DMP metadata
    const studyDesign = dmpMetadata.design || FeedbackData.safeGet(normalizedData, 'study_design');
    const discipline = dmpMetadata.discipline || FeedbackData.safeGet(normalizedData, 'discipline');
    
    if (studyDesign) {
        const designElem = document.createElement('p');
        designElem.className = 'metadata-item';
        designElem.textContent = `Study Design: ${studyDesign}`;
        metadataDiv.appendChild(designElem);
    }
    
    if (discipline) {
        const disciplineElem = document.createElement('p');
        disciplineElem.className = 'metadata-item';
        disciplineElem.textContent = `Discipline: ${discipline}`;
        metadataDiv.appendChild(disciplineElem);
    }
    
    // Get authors
    const authors = FeedbackData.safeGet(normalizedData, 'authors', []);
    if (authors && authors.length > 0) {
        const authorsElem = document.createElement('p');
        authorsElem.className = 'metadata-item';
        authorsElem.textContent = `Authors: ${authors.join(', ')}`;
        metadataDiv.appendChild(authorsElem);
    }
    
    // Get DOI
    let doi = FeedbackData.safeGet(normalizedData, 'doi');
    // Handle MongoDB ObjectId format
    if (doi && typeof doi === 'object' && doi.$oid) {
        doi = doi.$oid;
    }
    
    if (doi) {
        const doiElem = document.createElement('p');
        doiElem.className = 'metadata-item';
        doiElem.textContent = `DOI: ${doi}`;
        metadataDiv.appendChild(doiElem);
    }
    
    // Add debug info for metadata if needed
    if (Object.keys(dmpMetadata).length > 0) {
        console.log('DMP Metadata found:', dmpMetadata);
    } else {
        console.log('No DMP metadata found in:', normalizedData);
    }
    
    container.appendChild(metadataDiv);
}

// Render analysis information section (combined with checklist info and manuscript metadata)
function renderAnalysisInfo(data) {
    const container = document.getElementById('analysis-info');
    container.innerHTML = '';
    
    // Get normalized data
    const normalizedData = FeedbackData.normalizeData(data);
    
    // Create section header
    const header = document.createElement('h2');
    header.className = 'section-header';
    header.textContent = 'Analysis Information';
    container.appendChild(header);
    
    // Create info container
    const infoDiv = document.createElement('div');
    infoDiv.className = 'metadata-container';
    
    // Get DMP metadata from the correct location
    const dmpMetadata = FeedbackData.safeGet(normalizedData, 'summary.dmp_metadata') || 
                        FeedbackData.safeGet(normalizedData, 'enriched_data.summary.dmp_metadata') || 
                        {};
    
    // Add manuscript metadata
    // Get manuscript title from multiple possible fields
    const title = dmpMetadata.title || 
                  FeedbackData.safeGet(normalizedData, 'title') || 
                  FeedbackData.safeGet(normalizedData, 'manuscript_title') || 
                  null;
    
    if (title) {
        const titleElem = document.createElement('p');
        titleElem.className = 'metadata-item';
        titleElem.innerHTML = `<strong>DMP Title: ${title}</strong>`;
        infoDiv.appendChild(titleElem);
    }
    
    // Get study design and discipline from DMP metadata
    const studyDesign = dmpMetadata.design || FeedbackData.safeGet(normalizedData, 'study_design');
    const discipline = dmpMetadata.discipline || FeedbackData.safeGet(normalizedData, 'discipline');
    
    if (studyDesign) {
        const designElem = document.createElement('p');
        designElem.className = 'metadata-item';
        designElem.textContent = `Study Design identified: ${studyDesign}`;
        infoDiv.appendChild(designElem);
    }
    
    if (discipline) {
        const disciplineElem = document.createElement('p');
        disciplineElem.className = 'metadata-item';
        disciplineElem.textContent = `Discipline identified: ${discipline}`;
        infoDiv.appendChild(disciplineElem);
    }
    
    // Get authors
    const authors = FeedbackData.safeGet(normalizedData, 'authors', []);
    if (authors && authors.length > 0) {
        const authorsElem = document.createElement('p');
        authorsElem.className = 'metadata-item';
        authorsElem.textContent = `Authors: ${authors.join(', ')}`;
        infoDiv.appendChild(authorsElem);
    }
    
    // Analysis date
    const timestamp = FeedbackData.safeGet(normalizedData, 'timestamp') || 
                      FeedbackData.safeGet(normalizedData, 'created_at');
    
    if (timestamp) {
        const dateElem = document.createElement('p');
        dateElem.className = 'metadata-item';
        dateElem.textContent = `Date: ${FeedbackData.formatDate(timestamp)}`;
        infoDiv.appendChild(dateElem);
    }
    
    // Analysis ID
    const runId = FeedbackData.safeGet(normalizedData, 'run_id');
    const id = FeedbackData.safeGet(normalizedData, '_id');
    
    if (runId) {
        const idElem = document.createElement('p');
        idElem.className = 'metadata-item';
        idElem.textContent = `Run ID: ${runId}`;
        infoDiv.appendChild(idElem);
    } else if (id) {
        const idElem = document.createElement('p');
        idElem.className = 'metadata-item';
        idElem.textContent = `ID: ${typeof id === 'object' && id.$oid ? id.$oid : id}`;
        infoDiv.appendChild(idElem);
    }
    
    // Get checklist data
    const checklist = normalizedData.checklist_id ? normalizedData : {};
    
    // Display checklist information if available
    if (checklist.checklist_id) {
        const checklistIdElem = document.createElement('p');
        checklistIdElem.className = 'metadata-item';
        checklistIdElem.textContent = `Checklist: ${checklist.name || ''} (${checklist.checklist_id}${checklist.version ? ' v' + checklist.version : ''})`;
        infoDiv.appendChild(checklistIdElem);
    }
    
    // Configuration ID (only if different from checklist ID)
    const configId = FeedbackData.safeGet(normalizedData, 'config_id');
    
    if (configId && configId !== checklist.checklist_id) {
        const configElem = document.createElement('p');
        configElem.className = 'metadata-item';
        configElem.textContent = `Config: ${configId}`;
        infoDiv.appendChild(configElem);
    }
    
    // Add text length if available
    const textLength = FeedbackData.safeGet(normalizedData, 'dmp_text_length');
    if (textLength) {
        const lengthElem = document.createElement('p');
        lengthElem.className = 'metadata-item';
        lengthElem.textContent = `Text length: ${textLength} chars`;
        infoDiv.appendChild(lengthElem);
    }
    
    container.appendChild(infoDiv);
}

// Render feedback note section
function renderFeedbackNote(feedbackNote) {
    const container = document.getElementById('feedback-note');
    container.innerHTML = '';
    
    if (!feedbackNote) return;
    
    // Create section header
    const header = document.createElement('h2');
    header.className = 'section-header';
    header.textContent = 'Feedback for Author';
    container.appendChild(header);
    
    // Create note container
    const noteDiv = document.createElement('div');
    noteDiv.className = 'feedback-note-container';
    
    // Convert markdown to HTML
    const converter = new showdown.Converter();
    noteDiv.innerHTML = converter.makeHtml(feedbackNote);
    
    container.appendChild(noteDiv);
}

// Render domain summaries section
function renderDomainSummaries(data) {
    const container = document.getElementById('domain-summaries');
    container.innerHTML = '';
    
    // Get normalized data
    const normalizedData = FeedbackData.normalizeData(data);
    
    // Create section container for collapsible content
    const sectionContainer = document.createElement('div');
    sectionContainer.className = 'section-container';
    container.appendChild(sectionContainer);
    
    // Create section header with toggle button
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'section-header-container';
    
    const header = document.createElement('h2');
    header.className = 'section-header';
    header.textContent = 'Domain-level Results';
    
    const toggleButton = document.createElement('button');
    toggleButton.className = 'toggle-button section-toggle';
    toggleButton.innerHTML = '▼';
    toggleButton.setAttribute('aria-label', 'Toggle domain summaries');
    toggleButton.setAttribute('aria-expanded', 'true');
    toggleButton.setAttribute('aria-controls', 'domain-summaries-content');
    
    sectionHeader.appendChild(header);
    sectionHeader.appendChild(toggleButton);
    sectionContainer.appendChild(sectionHeader);
    
    // Create content container
    const contentDiv = document.createElement('div');
    contentDiv.className = 'section-content';
    contentDiv.id = 'domain-summaries-content';
    sectionContainer.appendChild(contentDiv);
    
    // Add toggle functionality
    const toggleContent = () => {
        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
        toggleButton.setAttribute('aria-expanded', !isExpanded);
        toggleButton.innerHTML = isExpanded ? '▶' : '▼';
        contentDiv.style.display = isExpanded ? 'none' : 'block';
    };
    
    toggleButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleContent();
    });
    
    sectionHeader.addEventListener('click', toggleContent);
    
    // Get sections with domains
    const sections = FeedbackData.extractSections(normalizedData);
    
    if (!sections || sections.length === 0 || !sections.some(s => s.domains && s.domains.length > 0)) {
        const noData = document.createElement('div');
        noData.textContent = 'No domain summaries available.';
        contentDiv.appendChild(noData);
        return;
    }
    
    // Create table for each section
    sections.forEach(section => {
        if (!section.domains || section.domains.length === 0) return;
        
        // Create section header if there are multiple sections
        if (sections.length > 1) {
            const sectionHeader = document.createElement('h3');
            sectionHeader.className = 'section-subheader';
            // Include section_id with the name
            sectionHeader.textContent = section.section_id ? 
                `${section.section_id}. ${section.name || 'Section'}` : 
                (section.name || 'Section');
            contentDiv.appendChild(sectionHeader);
        }
        
        // Create table container for responsiveness
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-container';
        
        // Create table
        const table = document.createElement('table');
        table.className = 'results-table domain-summary-table';
        
        // Create table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const headers = ['Domain', 'Result', 'Evidence', 'Recommendations'];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement('tbody');
        
        // Add rows for each domain in this section
        section.domains.forEach(domain => {
            if (!domain.domain_id) return;
            
            const row = document.createElement('tr');
            
            // Domain title with ID
            const domainCell = document.createElement('td');
            domainCell.textContent = domain.domain_id ? 
                `${domain.domain_id} ${domain.title || 'Domain'}` : 
                (domain.title || 'Domain');
            row.appendChild(domainCell);
            
            // Result/Classification
            const resultCell = document.createElement('td');
            const classification = domain.summary?.classification || 
                                  domain.compliance || 
                                  'Unknown';
            
            const badge = document.createElement('span');
            badge.className = `compliance-badge ${FeedbackData.getComplianceColorClass(classification)}`;
            badge.textContent = classification;
            resultCell.appendChild(badge);
            row.appendChild(resultCell);
            
            // Evidence
            const evidenceCell = document.createElement('td');
            if (domain.summary?.evidence && Array.isArray(domain.summary.evidence)) {
                const evidenceList = document.createElement('ul');
                domain.summary.evidence.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item;
                    evidenceList.appendChild(li);
                });
                evidenceCell.appendChild(evidenceList);
            } else {
                evidenceCell.textContent = '-';
            }
            row.appendChild(evidenceCell);
            
            // Recommendations
            const recoCell = document.createElement('td');
            recoCell.textContent = domain.summary?.recommendations || '-';
            row.appendChild(recoCell);
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        tableContainer.appendChild(table);
        contentDiv.appendChild(tableContainer);
    });
}

// Render domains and items section
function renderDomains(data, checklist) {
    const container = document.getElementById('domains');
    container.innerHTML = '';
    
    // Get normalized data
    const normalizedData = FeedbackData.normalizeData(data);
    
    // Create section header
    const header = document.createElement('h2');
    header.className = 'section-header';
    header.textContent = 'Detailed Results';
    container.appendChild(header);
    
    // Get sections with domains
    const sections = FeedbackData.extractSections(normalizedData);
    
    // Process each section
    sections.forEach(section => {
        if (!section.domains || section.domains.length === 0) return;
        
        // Create section container
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'analysis-section';
        
        // Create section header if there are multiple sections
        if (sections.length > 1) {
            const sectionHeader = document.createElement('h3');
            sectionHeader.className = 'section-subheader';
            // Include section_id with the name
            sectionHeader.textContent = section.section_id ? 
                `${section.section_id}. ${section.name || 'Section'}` : 
                (section.name || 'Section');
            sectionDiv.appendChild(sectionHeader);
        }
        
        // Process each domain in this section
        section.domains.forEach(domain => {
            if (!domain.domain_id) return;
            
            // Create domain container
            const domainDiv = document.createElement('div');
            domainDiv.className = 'domain-container';
            domainDiv.id = `domain-${domain.domain_id}`;
            
            // Domain header with title and compliance
            const domainHeader = document.createElement('div');
            domainHeader.className = 'domain-header';
            
            // Domain title and ID
            const domainTitle = document.createElement('h4');
            domainTitle.className = 'domain-title';
            // Include domain_id with the title
            domainTitle.textContent = domain.domain_id ? 
                `${domain.domain_id} ${domain.title || 'Domain'}` : 
                (domain.title || 'Domain');
            domainHeader.appendChild(domainTitle);
            
            // Domain compliance badge
            const classification = domain.summary?.classification || 
                                   domain.compliance || 
                                   'Unknown';
            
            const badge = document.createElement('span');
            badge.className = `compliance-badge ${FeedbackData.getComplianceColorClass(classification)}`;
            badge.textContent = classification;
            
            // Toggle button for collapsible content
            const toggleButton = document.createElement('button');
            toggleButton.className = 'toggle-button';
            toggleButton.innerHTML = '▼';
            toggleButton.setAttribute('aria-label', 'Toggle domain details');
            
            const headerControls = document.createElement('div');
            headerControls.className = 'header-controls';
            headerControls.appendChild(badge);
            headerControls.appendChild(toggleButton);
            
            domainHeader.appendChild(domainTitle);
            domainHeader.appendChild(headerControls);
            
            // Create collapsible content container
            const contentDiv = document.createElement('div');
            contentDiv.className = 'domain-content';
            contentDiv.id = `domain-content-${domain.domain_id}`;
            
            // Set ARIA attributes for accessibility
            toggleButton.setAttribute('aria-expanded', 'false');
            toggleButton.setAttribute('aria-controls', `domain-content-${domain.domain_id}`);
            
            // Add toggle functionality
            const toggleContent = () => {
                // Toggle the content visibility
                contentDiv.classList.toggle('open');
                
                // Update button state
                const isOpen = contentDiv.classList.contains('open');
                toggleButton.innerHTML = isOpen ? '▲' : '▼';
                toggleButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            };
            
            // Add click event to the toggle button with propagation stopped
            toggleButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent header click from firing
                toggleContent();
            });
            
            // Add click event to the entire header
            domainHeader.addEventListener('click', toggleContent);
            
            domainDiv.appendChild(domainHeader);
            
            // Domain summary
            if (domain.summary?.summary || domain.explanation) {
                const summaryDiv = document.createElement('div');
                summaryDiv.className = 'domain-summary';
                
                const summaryText = domain.summary?.summary || domain.explanation || '';
                
                // If summary is long, add show more/less functionality
                if (summaryText.length > 150) {
                    const excerptDiv = document.createElement('div');
                    excerptDiv.className = 'excerpt collapsed';
                    excerptDiv.textContent = summaryText;
                    
                    const toggleBtn = document.createElement('button');
                    toggleBtn.className = 'toggle-btn';
                    toggleBtn.textContent = 'Show more';
                    toggleBtn.addEventListener('click', () => {
                        excerptDiv.classList.toggle('collapsed');
                        toggleBtn.textContent = excerptDiv.classList.contains('collapsed') ? 'Show more' : 'Show less';
                    });
                    
                    summaryDiv.appendChild(excerptDiv);
                    summaryDiv.appendChild(toggleBtn);
                } else {
                    summaryDiv.textContent = summaryText;
                }
                
                contentDiv.appendChild(summaryDiv);
            }
            
            // Items table if available
            if (domain.items && domain.items.length > 0) {
                // Create table container for responsiveness
                const tableContainer = document.createElement('div');
                tableContainer.className = 'table-container';
                
                // Create table
                const table = document.createElement('table');
                table.className = 'results-table items-table';
                
                // Create table header
                const thead = document.createElement('thead');
                const headerRow = document.createElement('tr');
                
                const headers = ['Item', 'Compliance', 'Question', 'Explanation'];
                headers.forEach(headerText => {
                    const th = document.createElement('th');
                    th.textContent = headerText;
                    headerRow.appendChild(th);
                });
                
                thead.appendChild(headerRow);
                table.appendChild(thead);
                
                // Create table body
                const tbody = document.createElement('tbody');
                
                // Add rows for each item
                domain.items.forEach((item, index) => {
                    const row = document.createElement('tr');
                    row.className = index % 2 === 0 ? 'even-row' : 'odd-row';
                    
                    // Item title and ID
                    const itemCell = document.createElement('td');
                    // Include item_id with the title
                    itemCell.textContent = item.item_id ? 
                        `${item.item_id} ${item.title || 'Item'}` : 
                        (item.title || 'Item');
                    row.appendChild(itemCell);
                    
                    // Compliance
                    const complianceCell = document.createElement('td');
                    const itemCompliance = item.analysis?.compliance || 'Unknown';
                    
                    const itemBadge = document.createElement('span');
                    itemBadge.className = `badge ${FeedbackData.getComplianceColorClass(itemCompliance)}`;
                    itemBadge.textContent = itemCompliance;
                    complianceCell.appendChild(itemBadge);
                    row.appendChild(complianceCell);
                    
                    // Question
                    const questionCell = document.createElement('td');
                    questionCell.textContent = item.question || '';
                    row.appendChild(questionCell);
                    
                    // Explanation with show more/less for long text
                    const explanationCell = document.createElement('td');
                    const explanationText = item.analysis?.explanation || '';
                    
                    if (explanationText.length > 120) {
                        const excerptDiv = document.createElement('div');
                        excerptDiv.className = 'excerpt collapsed';
                        excerptDiv.textContent = explanationText;
                        
                        const toggleBtn = document.createElement('button');
                        toggleBtn.className = 'toggle-btn';
                        toggleBtn.textContent = 'Show more';
                        toggleBtn.addEventListener('click', () => {
                            excerptDiv.classList.toggle('collapsed');
                            toggleBtn.textContent = excerptDiv.classList.contains('collapsed') ? 'Show more' : 'Show less';
                        });
                        
                        explanationCell.appendChild(excerptDiv);
                        explanationCell.appendChild(toggleBtn);
                    } else {
                        explanationCell.textContent = explanationText;
                    }
                    
                    row.appendChild(explanationCell);
                    
                    tbody.appendChild(row);
                });
                
                table.appendChild(tbody);
                tableContainer.appendChild(table);
                contentDiv.appendChild(tableContainer);
            }
            
            domainDiv.appendChild(contentDiv);
            sectionDiv.appendChild(domainDiv);
        });
        
        container.appendChild(sectionDiv);
    });
}

// Render overall assessment section
function renderOverallAssessment(data) {
    const container = document.getElementById('overall-assessment');
    container.innerHTML = '';
    
    // Create section header
    const header = document.createElement('h2');
    header.className = 'section-header';
    header.textContent = 'Overall Assessment';
    container.appendChild(header);
    
    // Get normalized data
    const normalizedData = FeedbackData.normalizeData(data);
    
    // Get overall assessment from summary if available
    const summary = normalizedData.summary || {};
    const overallScore = summary.overall_score || 0;
    
    // Determine overall classification based on domain-level classifications
    let overallClassification = summary.overall_classification || '';
    
    if (!overallClassification) {
        // Get all domain classifications from the sections
        const sections = normalizedData.sections || [];
        const domainClassifications = [];
        
        sections.forEach(section => {
            const domains = section.domains || [];
            domains.forEach(domain => {
                if (domain.summary && domain.summary.classification) {
                    domainClassifications.push(domain.summary.classification.toLowerCase());
                }
            });
        });
        
        // If no domain classifications found in sections, check summary.domain_summaries
        if (domainClassifications.length === 0 && summary.domain_summaries) {
            // Extract domain IDs from domain_summaries
            const domainIds = Object.keys(summary.domain_summaries);
            
            // For each domain, try to find its classification
            domainIds.forEach(domainId => {
                // Look for the domain in the sections
                sections.forEach(section => {
                    const domains = section.domains || [];
                    const domain = domains.find(d => d.domain_id === domainId);
                    if (domain && domain.summary && domain.summary.classification) {
                        domainClassifications.push(domain.summary.classification.toLowerCase());
                    }
                });
            });
        }
        
        // Determine overall classification based on domain classifications
        if (domainClassifications.length > 0) {
            // Count occurrences of each classification
            const counts = {
                'poor': 0,
                'satisfactory': 0,
                'excellent': 0
            };
            
            domainClassifications.forEach(classification => {
                if (counts[classification] !== undefined) {
                    counts[classification]++;
                }
            });
            
            const totalDomains = domainClassifications.length;
            const poorPercentage = (counts['poor'] / totalDomains) * 100;
            const excellentPercentage = (counts['excellent'] / totalDomains) * 100;
            
            // If more than 20% of domains are Poor -> Poor
            if (poorPercentage > 20) {
                overallClassification = 'Poor';
            }
            // If more than half are Excellent, and none is Poor -> Excellent
            else if (excellentPercentage > 50 && counts['poor'] === 0) {
                overallClassification = 'Excellent';
            }
            // Otherwise -> Satisfactory
            else {
                overallClassification = 'Satisfactory';
            }
        } else {
            // Fallback to score-based classification if no domain classifications found
            if (overallScore >= 0.8) {
                overallClassification = 'Excellent';
            } else if (overallScore >= 0.5) {
                overallClassification = 'Satisfactory';
            } else {
                overallClassification = 'Poor';
            }
        }
    }
    
    // Create compliance score display (scaled to 0-100)
    const scaledScore = Math.round(overallScore * 100);
    
    const scoreContainer = document.createElement('div');
    scoreContainer.className = 'compliance-score-container';
    
    // Create compliance score label with tooltip
    const scoreLabelContainer = document.createElement('div');
    scoreLabelContainer.className = 'compliance-score-label-container';
    
    const scoreLabel = document.createElement('div');
    scoreLabel.className = 'compliance-score-label';
    scoreLabel.textContent = 'Compliance score: ';
    
    // Create tooltip icon
    const tooltipIcon = document.createElement('span');
    tooltipIcon.className = 'info-tooltip';
    tooltipIcon.innerHTML = '?';
    tooltipIcon.title = 'Classification Logic: Poor if >20% domains are Poor, Excellent if >50% domains are Excellent with no Poor domains, otherwise Satisfactory';
    
    scoreLabelContainer.appendChild(scoreLabel);
    scoreLabelContainer.appendChild(tooltipIcon);
    scoreContainer.appendChild(scoreLabelContainer);
    
    // Score value and visualization container
    const scoreVisContainer = document.createElement('div');
    scoreVisContainer.className = 'compliance-score-visualization';
    
    // Score value
    const scoreValue = document.createElement('div');
    scoreValue.className = 'compliance-score-value';
    scoreValue.textContent = `${scaledScore}/100`;
    scoreVisContainer.appendChild(scoreValue);
    
    // Progress bar container
    const progressContainer = document.createElement('div');
    progressContainer.className = 'compliance-progress-container';
    
    // Progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'compliance-progress-bar';
    progressBar.style.width = `${scaledScore}%`;
    
    // Set color based on overall classification instead of score
    const classification = overallClassification.toLowerCase();
    if (classification === 'excellent') {
        progressBar.classList.add('excellent');
    } else if (classification === 'satisfactory') {
        progressBar.classList.add('satisfactory');
    } else if (classification === 'poor') {
        progressBar.classList.add('poor');
    } else {
        // Fallback to score-based coloring if classification is not available
        if (scaledScore >= 80) {
            progressBar.classList.add('excellent');
        } else if (scaledScore >= 50) {
            progressBar.classList.add('satisfactory');
        } else {
            progressBar.classList.add('poor');
        }
    }
    
    progressContainer.appendChild(progressBar);
    scoreVisContainer.appendChild(progressContainer);
    
    scoreContainer.appendChild(scoreVisContainer);
    container.appendChild(scoreContainer);
    
    // Create assessment scale
    const scaleDiv = document.createElement('div');
    scaleDiv.className = 'assessment-scale';
    
    // Poor assessment
    const poorDiv = document.createElement('div');
    poorDiv.className = 'assessment-item assessment-poor';
    poorDiv.textContent = 'Poor';
    if (overallClassification.toLowerCase() === 'poor') {
        poorDiv.classList.add('assessment-active');
    }
    scaleDiv.appendChild(poorDiv);
    
    // Satisfactory assessment
    const satisfactoryDiv = document.createElement('div');
    satisfactoryDiv.className = 'assessment-item assessment-satisfactory';
    satisfactoryDiv.textContent = 'Satisfactory';
    if (overallClassification.toLowerCase() === 'satisfactory') {
        satisfactoryDiv.classList.add('assessment-active');
    }
    scaleDiv.appendChild(satisfactoryDiv);
    
    // Excellent assessment
    const excellentDiv = document.createElement('div');
    excellentDiv.className = 'assessment-item assessment-excellent';
    excellentDiv.textContent = 'Excellent';
    if (overallClassification.toLowerCase() === 'excellent') {
        excellentDiv.classList.add('assessment-active');
    }
    scaleDiv.appendChild(excellentDiv);
    
    container.appendChild(scaleDiv);
}

// Render checklist information section
function renderChecklistInfo(data) {
    const container = document.getElementById('checklist-info');
    container.innerHTML = '';
    
    // Create section header
    const header = document.createElement('h2');
    header.className = 'section-header';
    header.textContent = 'Checklist Information';
    container.appendChild(header);
    
    // Get normalized data
    const normalizedData = FeedbackData.normalizeData(data);
    
    // Get checklist data
    const checklist = normalizedData.checklist || {};
    
    // Create info container
    const infoDiv = document.createElement('div');
    infoDiv.className = 'metadata-container';
    
    // Display checklist version if available
    if (checklist.version) {
        const versionElem = document.createElement('p');
        versionElem.className = 'metadata-item';
        versionElem.textContent = `Checklist Version: ${checklist.version}`;
        infoDiv.appendChild(versionElem);
    }
    
    // Display checklist name if available
    if (checklist.name) {
        const nameElem = document.createElement('p');
        nameElem.className = 'metadata-item';
        nameElem.textContent = `Checklist Name: ${checklist.name}`;
        infoDiv.appendChild(nameElem);
    }
    
    // Display checklist ID if available
    if (checklist.checklist_id) {
        const idElem = document.createElement('p');
        idElem.className = 'metadata-item';
        idElem.textContent = `Checklist ID: ${checklist.checklist_id}`;
        infoDiv.appendChild(idElem);
    }
    
    container.appendChild(infoDiv);
}

// Export the functions
window.FeedbackRender = {
    renderManuscriptMetadata,
    renderAnalysisInfo,
    renderFeedbackNote,
    renderDomainSummaries,
    renderDomains,
    renderOverallAssessment,
    renderChecklistInfo
};
