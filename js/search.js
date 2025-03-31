/**
 * Search Module
 * Handles searching functionality
 */

const Search = {
    // Search results
    results: [],
    
    // Current search term
    currentTerm: '',
    
    // Search in progress flag
    isSearching: false,
    
    /**
     * Initialize search module
     */
    init: function() {
        this.attachEventListeners();
    },
    
    /**
     * Attach event listeners for search functionality
     */
    attachEventListeners: function() {
        // Simple search
        document.getElementById('search-button')?.addEventListener('click', () => {
            const term = document.getElementById('search-input')?.value?.trim();
            if (term) {
                this.performSearch(term);
            }
        });
        
        document.getElementById('search-input')?.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                const term = e.target.value.trim();
                if (term) {
                    this.performSearch(term);
                }
            }
        });
        
        // Advanced search
        document.getElementById('advanced-search-button')?.addEventListener('click', () => {
            const term = document.getElementById('advanced-search-input')?.value?.trim();
            if (term) {
                this.performSearch(term);
            }
        });
        
        document.getElementById('advanced-search-input')?.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                const term = e.target.value.trim();
                if (term) {
                    this.performSearch(term);
                }
            }
        });
        
        // Advanced search toggle
        document.getElementById('advanced-search-toggle')?.addEventListener('click', () => {
            const simpleSearch = document.getElementById('simple-search');
            const advancedSearch = document.getElementById('advanced-search');
            const searchFilters = document.getElementById('search-filters');
            
            if (simpleSearch && advancedSearch) {
                simpleSearch.classList.toggle('d-none');
                advancedSearch.classList.toggle('d-none');
                searchFilters?.classList.toggle('d-none');
            }
        });
        
        // Query builder
        document.getElementById('build-query')?.addEventListener('click', () => {
            const query = this.buildQueryFromInputs();
            if (query) {
                document.getElementById('advanced-search-input').value = query;
            }
        });
        
        document.getElementById('clear-query')?.addEventListener('click', () => {
            document.getElementById('advanced-search-input').value = '';
            document.querySelectorAll('.query-term:not(:first-child)').forEach(term => {
                term.remove();
            });
            document.querySelector('.query-input').value = '';
        });
        
        // Add query term button
        document.querySelector('.btn-add-term')?.addEventListener('click', this.addQueryTerm);
    },
    
    /**
     * Add a new query term input
     */
    addQueryTerm: function() {
        const queryBuilder = document.getElementById('query-builder');
        const template = document.querySelector('.query-term').cloneNode(true);
        
        // Clear input value
        template.querySelector('.query-input').value = '';
        
        // Add remove button
        const btnGroup = template.querySelector('.input-group');
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-outline-danger btn-remove-term';
        removeBtn.innerHTML = '<i class="bi bi-dash"></i>';
        removeBtn.addEventListener('click', (e) => {
            e.target.closest('.query-term').remove();
        });
        
        btnGroup.appendChild(removeBtn);
        
        // Add the new term to the form
        queryBuilder.appendChild(template);
        
        // Add event listener to new add button
        template.querySelector('.btn-add-term').addEventListener('click', this.addQueryTerm);
    },
    
    /**
     * Build a search query from the query builder inputs
     * @returns {string} Constructed query
     */
    buildQueryFromInputs: function() {
        const terms = [];
        
        document.querySelectorAll('.query-term').forEach(termElement => {
            const input = termElement.querySelector('.query-input').value.trim();
            
            if (!input) return;
            
            const operator = termElement.querySelector('.operator-select')?.value || 'AND';
            
            // If it's not the first term, prepend the operator
            if (terms.length > 0) {
                terms.push(operator);
            }
            
            // Wrap in quotes if it contains spaces
            const term = input.includes(' ') ? `"${input}"` : input;
            terms.push(term);
        });
        
        return terms.join(' ');
    },
    
    /**
     * Perform a search across all versions
     * @param {string} term - Search term
     * @param {boolean} updateHistory - Whether to update browser history (default: true)
     */
    performSearch: async function(term, updateHistory = true) {
        if (this.isSearching || !term) return;
        
        try {
            this.isSearching = true;
            this.currentTerm = term;
            UI.showLoading(`Preparing to search for "${term}"...`);
            
            // Save to search history
            Storage.addSearchTerm(term);
            UI.updateSearchHistoryUI();
            
            // Clear previous results
            this.results = [];
            
            // Get versions to search in
            const versionFilter = document.getElementById('version-filter')?.value;
            const versionsToSearch = this.getVersionsToSearch(versionFilter);
            
            // Get search options
            const headingsOnly = document.getElementById('filter-heading-only')?.checked || false;
            const caseSensitive = document.getElementById('filter-case-sensitive')?.checked || false;
            
            // Search each version
            const totalVersions = versionsToSearch.length;
            let processedVersions = 0;
            
            for (const version of versionsToSearch) {
                // Update loading status and progress
                processedVersions++;
                const progress = Math.round((processedVersions / totalVersions) * 100);
                UI.showLoading(`Searching ${version} (${processedVersions}/${totalVersions})...`, progress);
                
                // Load the content if not in cache
                let content = Versions.cache[version];
                
                if (!content) {
                    try {
                        const response = await fetch(`${CONFIG.changelogPath}${version}`);
                        if (!response.ok) continue;
                        
                        content = await response.text();
                        Versions.cache[version] = content;
                    } catch (error) {
                        console.error(`Error loading version ${version} for search:`, error);
                        continue;
                    }
                }
                
                // Perform the search
                const matches = this.searchInContent(content, term, {
                    headingsOnly,
                    caseSensitive
                });
                
                if (matches.length > 0) {
                    this.results.push({
                        version,
                        matches
                    });
                }
            }
            
            // Update loading status
            UI.showLoading('Processing search results...', 100);
            
            // Display results
            this.displayResults();
            
            // Update URL if needed
            if (updateHistory) {
                const newUrl = Utils.createUrlWithParams({ search: term });
                window.history.pushState({ search: term }, '', newUrl);
            }
        } catch (error) {
            console.error('Error performing search:', error);
            UI.showError('An error occurred while searching. Please try again.');
        } finally {
            this.isSearching = false;
            UI.hideLoading();
        }
    },
    
    /**
     * Get the list of versions to search based on filter
     * @param {string} filter - Version filter
     * @returns {Array} List of versions to search
     */
    getVersionsToSearch: function(filter) {
        if (!filter || filter === 'all') {
            return Versions.list;
        }
        
        // Filter by major version
        return Versions.list.filter(version => {
            const parsed = Utils.parseVersion(version);
            return parsed.major.toString() === filter;
        });
    },
    
    /**
     * Search for terms in content
     * @param {string} content - Content to search
     * @param {string} term - Search term
     * @param {Object} options - Search options
     * @returns {Array} Array of matches
     */
    searchInContent: function(content, term, options = {}) {
        const matches = [];
        
        // Default options
        const { headingsOnly = false, caseSensitive = false } = options;
        
        // Process the term
        let searchTerm = term;
        let searchContent = content;
        
        // Case sensitivity
        if (!caseSensitive) {
            searchTerm = term.toLowerCase();
            searchContent = content.toLowerCase();
        }
        
        // Check for exact phrase (quoted)
        const isExactPhrase = /^"(.+)"$/.test(term);
        if (isExactPhrase) {
            searchTerm = term.substring(1, term.length - 1);
            if (!caseSensitive) {
                searchTerm = searchTerm.toLowerCase();
            }
        }
        
        // Handle advanced search operators
        if (term.includes(' AND ') || term.includes(' OR ') || term.includes(' NOT ')) {
            return this.advancedSearch(content, term, options);
        }
        
        // Search headings only
        if (headingsOnly) {
            const headingRegex = /^#{1,6}\s+(.+)$/gm;
            let match;
            
            while ((match = headingRegex.exec(content)) !== null) {
                const heading = caseSensitive ? match[1] : match[1].toLowerCase();
                
                if (isExactPhrase) {
                    if (heading.includes(searchTerm)) {
                        matches.push({
                            text: match[0],
                            line: this.getLineNumber(content, match.index),
                            occurrences: this.countOccurrences(heading, searchTerm)
                        });
                    }
                } else if (heading.includes(searchTerm)) {
                    matches.push({
                        text: match[0],
                        line: this.getLineNumber(content, match.index),
                        occurrences: this.countOccurrences(heading, searchTerm)
                    });
                }
            }
            
            return matches;
        }
        
        // Search full content
        const lines = content.split('\n');
        const searchTermLower = searchTerm.toLowerCase();
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineToSearch = caseSensitive ? line : line.toLowerCase();
            
            if (isExactPhrase) {
                if (lineToSearch.includes(searchTerm)) {
                    matches.push({
                        text: line,
                        line: i + 1,
                        occurrences: this.countOccurrences(lineToSearch, searchTerm)
                    });
                }
            } else if (lineToSearch.includes(searchTermLower)) {
                matches.push({
                    text: line,
                    line: i + 1,
                    occurrences: this.countOccurrences(lineToSearch, searchTermLower)
                });
            }
        }
        
        return matches;
    },
    
    /**
     * Count occurrences of a substring in a string
     * @param {string} text - Text to search in
     * @param {string} searchTerm - Term to count
     * @returns {number} Number of occurrences
     */
    countOccurrences: function(text, searchTerm) {
        if (!text || !searchTerm) return 0;
        
        let count = 0;
        let position = 0;
        
        while ((position = text.indexOf(searchTerm, position)) !== -1) {
            count++;
            position += searchTerm.length;
        }
        
        return count;
    },
    
    /**
     * Perform advanced search with operators
     * @param {string} content - Content to search
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Array} Array of matches
     */
    advancedSearch: function(content, query, options = {}) {
        // This is a simplified implementation
        // A full implementation would parse the query and evaluate boolean expressions
        
        const matches = [];
        const { caseSensitive = false } = options;
        
        // Split into lines
        const lines = content.split('\n');
        
        // Process operators
        const terms = query.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineToSearch = caseSensitive ? line : line.toLowerCase();
            
            let includeMatch = true;
            let requireNext = false;
            let excludeNext = false;
            
            for (let j = 0; j < terms.length; j++) {
                let term = terms[j];
                
                if (term === 'AND') {
                    requireNext = true;
                    continue;
                }
                
                if (term === 'OR') {
                    requireNext = false;
                    continue;
                }
                
                if (term === 'NOT') {
                    excludeNext = true;
                    continue;
                }
                
                // Handle quoted phrases
                if (/^"(.+)"$/.test(term)) {
                    term = term.substring(1, term.length - 1);
                }
                
                const termToSearch = caseSensitive ? term : term.toLowerCase();
                const found = lineToSearch.includes(termToSearch);
                
                if (excludeNext) {
                    if (found) {
                        includeMatch = false;
                        break;
                    }
                    excludeNext = false;
                } else if (requireNext) {
                    if (!found) {
                        includeMatch = false;
                        break;
                    }
                    requireNext = false;
                } else if (j === 0 && !found) {
                    // First term must match
                    includeMatch = false;
                    break;
                }
            }
            
            if (includeMatch) {
                matches.push({
                    text: line,
                    line: i + 1
                });
            }
        }
        
        return matches;
    },
    
    /**
     * Get line number from content and index
     * @param {string} content - Content
     * @param {number} index - Character index
     * @returns {number} Line number (1-based)
     */
    getLineNumber: function(content, index) {
        const lines = content.substring(0, index).split('\n');
        return lines.length;
    },
    
    /**
     * Display search results
     */
    displayResults: function() {
        // Hide any version content and show search results
        const contentDisplay = document.getElementById('content-display');
        if (contentDisplay) {
            contentDisplay.style.display = 'none';
        }
        
        // Reset current version being viewed
        Versions.current = null;
        
        // Show search results
        UI.showSearchResults(this.results, this.currentTerm);
    }
}; 