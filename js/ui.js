/**
 * UI Module
 * Handles user interface interactions and updates
 */

const UI = {
    /**
     * Initialize UI module
     */
    init: function() {
        this.attachEventListeners();
    },
    
    /**
     * Attach event listeners for UI interactions
     */
    attachEventListeners: function() {
        // Event listeners go here
    },
    
    /**
     * Show loading indicator
     * @param {string} status - Optional status message to display
     * @param {number} progress - Optional progress value (0-100)
     */
    showLoading: function(status, progress) {
        // Show loading indicator
        document.getElementById('loading-indicator')?.classList.remove('d-none');
        
        // Show loading container with progress bar
        const loadingContainer = document.getElementById('loading-container');
        if (loadingContainer) {
            loadingContainer.classList.remove('d-none');
        }
        
        // Update loading status if provided
        if (status) {
            const loadingStatus = document.getElementById('loading-status');
            if (loadingStatus) {
                loadingStatus.textContent = status;
            }
        }
        
        // Update progress bar if a value is provided
        if (progress !== undefined && progress >= 0 && progress <= 100) {
            const progressBar = document.getElementById('loading-progress-bar');
            if (progressBar) {
                progressBar.classList.remove('indeterminate');
                progressBar.style.width = `${progress}%`;
            }
        } else {
            // Use indeterminate progress bar when no value is provided
            const progressBar = document.getElementById('loading-progress-bar');
            if (progressBar) {
                progressBar.classList.add('indeterminate');
                progressBar.style.width = '50%';
            }
        }
    },
    
    /**
     * Hide loading indicator
     */
    hideLoading: function() {
        // Hide loading indicator
        document.getElementById('loading-indicator')?.classList.add('d-none');
        
        // Hide loading container
        const loadingContainer = document.getElementById('loading-container');
        if (loadingContainer) {
            loadingContainer.classList.add('d-none');
        }
        
        // Reset progress bar
        const progressBar = document.getElementById('loading-progress-bar');
        if (progressBar) {
            progressBar.style.width = '0%';
        }
    },
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError: function(message) {
        const contentDisplay = document.getElementById('content-display');
        if (contentDisplay) {
            contentDisplay.innerHTML = `<div class="alert alert-danger">${message}</div>`;
            contentDisplay.style.display = 'block';
        }
        
        const searchResults = document.getElementById('search-results');
        if (searchResults) {
            searchResults.style.display = 'none';
        }
    },
    
    /**
     * Render content in the main display area
     * @param {string} markdown - Markdown content
     */
    renderContent: function(markdown) {
        const contentDisplay = document.getElementById('content-display');
        const searchResults = document.getElementById('search-results');
        
        if (contentDisplay && searchResults) {
            const html = Render.renderMarkdown(markdown);
            contentDisplay.innerHTML = html;
            contentDisplay.style.display = 'block';
            searchResults.style.display = 'none';
            
            // Scroll to top
            window.scrollTo(0, 0);
        }
    },
    
    /**
     * Show search results
     * @param {Array} results - Search results
     * @param {string} searchTerm - Search term
     */
    showSearchResults: function(results, searchTerm) {
        const contentDisplay = document.getElementById('content-display');
        const searchResults = document.getElementById('search-results');
        
        if (!searchResults) return;
        
        // Always hide content display
        if (contentDisplay) {
            contentDisplay.style.display = 'none';
        }
        
        // Hide search-in-current-version option when showing search results
        this.updateSearchInCurrentVersionOption(false);
        
        // Always make search results visible
        searchResults.style.display = 'block';
        
        // If no results, show message
        if (!results || results.length === 0) {
            searchResults.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-search"></i> No results found for "${searchTerm}"
                </div>
            `;
            return;
        }
        
        // Calculate total matches
        let totalMatchesCount = 0;
        results.forEach(result => {
            let totalOccurrences = 0;
            result.matches.forEach(match => {
                totalOccurrences += match.occurrences || 1; // Use occurrences if available, otherwise count as 1
            });
            result.totalOccurrences = totalOccurrences;
            totalMatchesCount += totalOccurrences;
        });
        
        // Create filter input
        let html = `
            <div class="search-results">
                <div class="mb-3">
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-filter"></i></span>
                        <input type="text" id="result-filter" class="form-control" placeholder="Filter results...">
                        <button class="btn btn-outline-secondary" id="clear-filter">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                </div>
                
                <div class="alert alert-info mb-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <span>Found a total of <strong>${totalMatchesCount} results</strong> in ${results.length} versions</span>
                        <button class="btn btn-sm btn-outline-primary" id="expand-all-results" data-expanded="true">Collapse All</button>
                    </div>
                </div>
        `;
        
        // Sort results by importance (major version)
        results.sort((a, b) => {
            const versionA = Utils.parseVersion(a.version);
            const versionB = Utils.parseVersion(b.version);
            
            if (versionA.major !== versionB.major) {
                return versionB.major - versionA.major;
            }
            
            return versionB.minor - versionA.minor;
        });
        
        // Build results HTML
        results.forEach(result => {
            const version = Utils.parseVersion(result.version);
            
            html += `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div>
                            <h5 class="mb-0">Version ${version.displayName} <span class="badge bg-primary">${result.totalOccurrences} results</span></h5>
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-outline-secondary btn-collapse" data-target="matches-${version.major}-${version.minor}" data-expanded="true">
                                <i class="bi bi-arrows-collapse"></i>
                            </button>
                            <button class="btn btn-sm btn-primary view-version" data-version="${result.version}">
                                View Version
                            </button>
                        </div>
                    </div>
                    <div class="card-body" id="matches-${version.major}-${version.minor}" style="display: block;">
                        <ul class="list-group">
            `;
            
            result.matches.forEach(match => {
                // Highlight the search term in the match text
                const highlightedText = this.highlightSearchTerm(match.text, searchTerm);
                
                html += `
                    <li class="list-group-item search-match-item">
                        <div class="d-flex align-items-baseline gap-2">
                            <span class="badge bg-secondary">Line ${match.line}</span>
                            <code class="match-text">${highlightedText}</code>
                            ${match.occurrences > 1 ? `<span class="badge bg-info">${match.occurrences} times</span>` : ''}
                        </div>
                    </li>
                `;
            });
            
            html += `
                        </ul>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        // Set HTML and attach event listeners
        searchResults.innerHTML = html;
        
        // Attach event listeners for expand all results button
        document.getElementById('expand-all-results')?.addEventListener('click', () => {
            const expandAllBtn = document.getElementById('expand-all-results');
            const isExpanded = expandAllBtn.dataset.expanded === "true";
            
            if (isExpanded) {
                // Collapse all sections
                document.querySelectorAll('#search-results .card-body').forEach(body => {
                    body.style.display = 'none';
                });
                
                document.querySelectorAll('#search-results .btn-collapse').forEach(button => {
                    const icon = button.querySelector('i');
                    icon.classList.remove('bi-arrows-collapse');
                    icon.classList.add('bi-arrows-expand');
                    button.dataset.expanded = "false";
                });
                
                // Update expand all button
                expandAllBtn.textContent = "Expand All";
                expandAllBtn.dataset.expanded = "false";
            } else {
                // Expand all sections
                document.querySelectorAll('#search-results .card-body').forEach(body => {
                    body.style.display = 'block';
                });
                
                document.querySelectorAll('#search-results .btn-collapse').forEach(button => {
                    const icon = button.querySelector('i');
                    icon.classList.remove('bi-arrows-expand');
                    icon.classList.add('bi-arrows-collapse');
                    button.dataset.expanded = "true";
                });
                
                // Update expand all button
                expandAllBtn.textContent = "Collapse All";
                expandAllBtn.dataset.expanded = "true";
            }
        });
        
        // Attach event listeners
        document.querySelectorAll('.view-version').forEach(button => {
            button.addEventListener('click', () => {
                const version = button.dataset.version;
                Versions.loadVersion(version);
            });
        });
        
        // Collapse/expand sections
        document.querySelectorAll('.btn-collapse').forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.dataset.target;
                const target = document.getElementById(targetId);
                const icon = button.querySelector('i');
                
                // Check current state (stored in data attribute)
                const isExpanded = button.dataset.expanded === "true";
                
                if (isExpanded) {
                    // If expanded, collapse it
                    target.style.display = 'none';
                    icon.classList.remove('bi-arrows-collapse');
                    icon.classList.add('bi-arrows-expand');
                    button.dataset.expanded = "false";
                } else {
                    // If collapsed, expand it
                    target.style.display = 'block';
                    icon.classList.remove('bi-arrows-expand');
                    icon.classList.add('bi-arrows-collapse');
                    button.dataset.expanded = "true";
                }
            });
        });
        
        // Filter results
        const resultFilter = document.getElementById('result-filter');
        resultFilter?.addEventListener('input', (e) => {
            const filterText = e.target.value.toLowerCase();
            
            if (!filterText) {
                // Show all items
                document.querySelectorAll('.search-match-item').forEach(item => {
                    item.style.display = 'block';
                });
                
                // Show all version cards
                document.querySelectorAll('#search-results .card').forEach(card => {
                    card.style.display = 'block';
                });
                
                return;
            }
            
            // Track which cards have visible items
            const cardsWithVisibleItems = new Set();
            
            // First filter individual items
            document.querySelectorAll('.search-match-item').forEach(item => {
                const text = item.querySelector('.match-text').textContent.toLowerCase();
                const isVisible = text.includes(filterText);
                
                item.style.display = isVisible ? 'block' : 'none';
                
                // If visible, track its parent card
                if (isVisible) {
                    const cardBody = item.closest('.card-body');
                    const card = cardBody?.closest('.card');
                    if (card) {
                        cardsWithVisibleItems.add(card);
                    }
                }
            });
            
            // Then hide/show cards based on whether they have visible items
            document.querySelectorAll('#search-results .card').forEach(card => {
                card.style.display = cardsWithVisibleItems.has(card) ? 'block' : 'none';
            });
        });
        
        // Clear filter
        document.getElementById('clear-filter')?.addEventListener('click', () => {
            if (resultFilter) {
                resultFilter.value = '';
                
                // Show all items
                document.querySelectorAll('.search-match-item').forEach(item => {
                    item.style.display = 'block';
                });
                
                // Show all cards
                document.querySelectorAll('#search-results .card').forEach(card => {
                    card.style.display = 'block';
                });
            }
        });
        
        // Scroll to top
        window.scrollTo(0, 0);
    },
    
    /**
     * Highlight search term in a text
     * @param {string} text - Text to highlight in
     * @param {string} term - Term to highlight
     * @returns {string} Highlighted HTML
     */
    highlightSearchTerm: function(text, term) {
        if (!term) return Utils.escapeHtml(text);
        
        // Handle advanced search with operators
        if (term.includes(' AND ') || term.includes(' OR ') || term.includes(' NOT ')) {
            // Extract terms from the query
            const terms = term.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
            let highlightedText = Utils.escapeHtml(text);
            
            terms.forEach(t => {
                if (t === 'AND' || t === 'OR' || t === 'NOT') return;
                
                // Handle quoted phrases
                if (/^"(.+)"$/.test(t)) {
                    t = t.substring(1, t.length - 1);
                }
                
                highlightedText = this.applyHighlight(highlightedText, t);
            });
            
            return highlightedText;
        }
        
        // Handle exact phrase (quoted)
        let searchTerm = term;
        if (/^"(.+)"$/.test(term)) {
            searchTerm = term.substring(1, term.length - 1);
        }
        
        return this.applyHighlight(Utils.escapeHtml(text), searchTerm);
    },
    
    /**
     * Apply highlight to a text for a specific term
     * @param {string} html - HTML text
     * @param {string} term - Term to highlight
     * @returns {string} HTML with highlights
     */
    applyHighlight: function(html, term) {
        if (!term) return html;
        
        // Create a regex that ignores case
        const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        return html.replace(regex, match => `<mark class="highlight">${match}</mark>`);
    },
    
    /**
     * Update search history UI
     */
    updateSearchHistoryUI: function() {
        const container = document.getElementById('history-items');
        const historySection = document.getElementById('search-history');
        
        if (!container || !historySection) return;
        
        if (Storage.searchHistory.length === 0) {
            historySection.classList.add('d-none');
            return;
        }
        
        historySection.classList.remove('d-none');
        container.innerHTML = '';
        
        Storage.searchHistory.forEach(term => {
            const badge = document.createElement('span');
            badge.className = 'badge bg-secondary cursor-pointer';
            badge.textContent = term;
            
            badge.addEventListener('click', () => {
                document.getElementById('search-input').value = term;
                Search.performSearch(term);
            });
            
            container.appendChild(badge);
        });
    },
    
    /**
     * Display version in the main content area
     * @param {string} version - Version file name
     * @param {string} content - Content to display
     */
    displayVersion: function(version, content) {
        const contentDisplay = document.getElementById('content-display');
        const searchResults = document.getElementById('search-results');
        
        if (contentDisplay && searchResults) {
            const html = Render.renderMarkdown(content);
            contentDisplay.innerHTML = html;
            contentDisplay.style.display = 'block';
            searchResults.style.display = 'none';
            
            // Update title
            const parsedVersion = Utils.parseVersion(version);
            document.getElementById('current-file').textContent = `Version ${parsedVersion.displayName}`;
            
            // Show search-in-current-version checkbox
            this.updateSearchInCurrentVersionOption(true);
            
            // Scroll to top
            window.scrollTo(0, 0);
        }
    },
    
    /**
     * Update the visibility of the search in current version option
     * @param {boolean} isVersionActive - Whether a specific version is being viewed
     */
    updateSearchInCurrentVersionOption: function(isVersionActive) {
        const searchCurrentVersionCheckbox = document.getElementById('search-current-version');
        if (!searchCurrentVersionCheckbox) return;
        
        const searchCurrentVersionLabel = searchCurrentVersionCheckbox.parentElement;
        
        if (searchCurrentVersionLabel) {
            if (isVersionActive) {
                searchCurrentVersionLabel.classList.remove('d-none');
                // If we're viewing a version, always show the search-current-version option
                if (document.getElementById('content-display').style.display === 'block') {
                    searchCurrentVersionCheckbox.checked = true;
                }
            } else {
                searchCurrentVersionLabel.classList.add('d-none');
                searchCurrentVersionCheckbox.checked = false;
            }
        }
    }
}; 