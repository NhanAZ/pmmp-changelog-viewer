/**
 * Versions Module
 * Handles version listing, loading, and management
 */

const Versions = {
    // Available versions
    list: [],
    
    // Grouped versions by major version
    grouped: {},
    
    // Current version being viewed
    current: null,
    
    // Changelog content cache
    cache: {},
    
    /**
     * Initialize versions module
     * @returns {Promise} Promise that resolves when initialization is complete
     */
    init: async function() {
        await this.loadVersions();
    },
    
    /**
     * Display version tree
     */
    displayVersionTree: function() {
        // Group versions by major version
        this.grouped = Utils.groupVersionsByMajor(this.list);
        
        // Get version tree container - not version-list but version-tree
        const versionTree = document.querySelector('.version-tree');
        if (!versionTree) {
            console.error('Version tree container not found');
            return;
        }
        
        // Process each major version group
        Object.keys(this.grouped).sort((a, b) => parseInt(b) - parseInt(a)).forEach(majorVersion => {
            const versions = this.grouped[majorVersion];
            
            // Find the existing sublist for this major version
            const subList = document.getElementById(`version-group-${majorVersion}`);
            if (!subList) {
                console.warn(`Sublist for major version ${majorVersion} not found`);
                return;
            }
            
            // Clear existing content in the sublist
            subList.innerHTML = '';
            
            // Add versions to sublist
            versions.forEach(version => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item version-item';
                listItem.dataset.version = version.file;
                
                // Ensure displayName is accessible - handle the parsed property correctly
                const displayName = version.parsed ? version.parsed.displayName : version.file.replace('.md', '');
                listItem.textContent = displayName;
                
                // Add beta/alpha badge if needed - handle the parsed property correctly
                if (version.parsed && version.parsed.isAlpha) {
                    const badge = document.createElement('span');
                    badge.className = 'badge bg-warning text-dark ms-2';
                    badge.textContent = 'Alpha';
                    listItem.appendChild(badge);
                } else if (version.parsed && version.parsed.isBeta) {
                    const badge = document.createElement('span');
                    badge.className = 'badge bg-info text-dark ms-2';
                    badge.textContent = 'Beta';
                    listItem.appendChild(badge);
                }
                
                subList.appendChild(listItem);
            });
        });
        
        console.log('Version tree displayed, attaching event listeners...');
        // Attach event listeners after updating the DOM
        this.attachEventListeners();
    },
    
    /**
     * Attach event listeners for version items
     */
    attachEventListeners: function() {
        console.log('Attaching version event listeners...');
        
        // Remove existing event listeners (to prevent duplicates)
        const versionItems = document.querySelectorAll('.version-item');
        console.log(`Found ${versionItems.length} version items`);
        
        // Version item click event
        versionItems.forEach(item => {
            // Remove existing listeners (clone and replace)
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            // Add new listener
            newItem.addEventListener('click', () => {
                const version = newItem.dataset.version;
                console.log(`Clicked version: ${version}`);
                this.loadVersion(version);
            });
        });
        
        // Version group toggle events
        document.querySelectorAll('.version-group-header').forEach(header => {
            // Remove existing listeners (clone and replace)
            const newHeader = header.cloneNode(true);
            header.parentNode.replaceChild(newHeader, header);
            
            // Add new listener
            newHeader.addEventListener('click', () => {
                const groupId = newHeader.dataset.group;
                console.log(`Toggling group: ${groupId}`);
                this.toggleVersionGroup(groupId);
            });
        });
        
        // Expand/collapse buttons
        const expandAll = document.getElementById('expand-all');
        if (expandAll) {
            expandAll.onclick = () => {
                console.log('Expanding all groups');
                this.expandAllGroups();
            };
        }
        
        const collapseAll = document.getElementById('collapse-all');
        if (collapseAll) {
            collapseAll.onclick = () => {
                console.log('Collapsing all groups');
                this.collapseAllGroups();
            };
        }
        
        // Version filter
        const versionFilter = document.getElementById('version-filter');
        if (versionFilter) {
            versionFilter.onchange = (event) => {
                console.log(`Filter by major: ${event.target.value}`);
                this.filterVersionsByMajor(event.target.value);
            };
        }
        
        // Version search
        const versionSearch = document.getElementById('version-search');
        if (versionSearch) {
            versionSearch.oninput = (event) => {
                console.log(`Search version text: ${event.target.value}`);
                this.filterVersionsByText(event.target.value);
            };
        }
        
        console.log('All version event listeners attached');
    },
    
    /**
     * Load available versions from versions.json
     */
    loadVersions: async function() {
        try {
            UI.showLoading('Loading version list...');
            
            // Fetch the versions list
            const response = await fetch(`${CONFIG.changelogPath}versions.json`);
            if (!response.ok) throw new Error('Failed to fetch versions list');
            
            const data = await response.json();
            this.list = data.versions;
            
            // Create version tree
            this.displayVersionTree();
            
            // Check URL parameters for version
            const params = Utils.getUrlParams();
            if (params.version) {
                this.loadVersion(params.version, false);
            } else {
                // Hide loading indicator
                UI.hideLoading();
            }
            
            return true;
        } catch (error) {
            console.error('Error loading versions:', error);
            UI.showError('Failed to load version list. Please reload the page or check your connection.');
            UI.hideLoading();
            return false;
        }
    },
    
    /**
     * Load a specific version
     * @param {string} version - Version file name
     * @param {boolean} updateHistory - Whether to update browser history
     * @param {string} searchTerm - Optional search term to highlight
     */
    loadVersion: async function(version, updateHistory = true, searchTerm = null) {
        try {
            if (!version) return;
            
            // Show loading indicator
            UI.showLoading(`Loading version ${version.replace('.md', '')}...`);
            
            // Check if already in cache
            if (this.cache[version]) {
                this.displayVersion(version, this.cache[version], updateHistory, searchTerm);
                UI.hideLoading();
                return;
            }
            
            // Fetch the content
            const response = await fetch(`${CONFIG.changelogPath}${version}`);
            if (!response.ok) throw new Error(`Failed to fetch ${version}`);
            
            // Start with progress at 50% for download completion
            UI.showLoading('Processing content...', 50);
            
            const content = await response.text();
            this.cache[version] = content;
            
            // Update loading status for rendering phase
            UI.showLoading('Rendering content...', 90);
            
            // Display the content with search term if provided
            this.displayVersion(version, content, updateHistory, searchTerm);
            
            // Update URL if needed
            if (updateHistory) {
                const params = { version };
                // Include search term in URL if provided
                if (searchTerm) {
                    params.highlight = searchTerm;
                }
                const newUrl = Utils.createUrlWithParams(params);
                window.history.pushState({ version, searchTerm }, '', newUrl);
            }
            
            // Save to local storage as last viewed version
            Storage.saveLastVersion(version);
            
            // Hide loading indicator
            UI.hideLoading();
        } catch (error) {
            console.error('Error loading version:', error);
            UI.showError(`Failed to load version ${version}. Please try again later.`);
            UI.hideLoading();
        }
    },
    
    /**
     * Display a loaded version
     * @param {string} version - Version file name
     * @param {string} content - Markdown content
     * @param {boolean} updateHistory - Whether to update browser history (default: true)
     * @param {string} searchTerm - Optional search term to highlight
     */
    displayVersion: function(version, content, updateHistory = true, searchTerm = null) {
        // Update current version
        this.current = version;
        
        // Hide search results if visible
        const searchResults = document.getElementById('search-results');
        if (searchResults) {
            searchResults.style.display = 'none';
        }
        
        // Render content using UI module with search term highlighting if provided
        // Don't update history here - we'll do it separately if needed
        UI.displayVersion(version, content, searchTerm, false);
        
        // Update UI elements
        document.querySelectorAll('.version-item').forEach(item => {
            item.classList.toggle('active', item.dataset.version === version);
        });
        
        const parsedVersion = Utils.parseVersion(version);
        document.getElementById('current-file').textContent = `Version ${parsedVersion.displayName}`;
        
        // Update URL for sharing and add to browser history if needed
        if (updateHistory) {
            const params = { version };
            // Include search term in URL if provided
            if (searchTerm) {
                params.highlight = searchTerm;
            }
            const newUrl = Utils.createUrlWithParams(params);
            window.history.pushState({ version, searchTerm }, '', newUrl);
        }
        
        // Check if navigation buttons should be shown
        setTimeout(() => UI.toggleScrollButtons(), 100);
    },
    
    /**
     * Toggle a version group expansion
     * @param {string} groupId - Group ID to toggle
     */
    toggleVersionGroup: function(groupId) {
        const header = document.querySelector(`.version-group-header[data-group="${groupId}"]`);
        const list = document.getElementById(`version-group-${groupId}`);
        
        if (!header || !list) return;
        
        header.classList.toggle('collapsed');
        list.classList.toggle('collapsed');
    },
    
    /**
     * Expand all version groups
     */
    expandAllGroups: function() {
        document.querySelectorAll('.version-group-header').forEach(header => {
            header.classList.remove('collapsed');
        });
        
        document.querySelectorAll('.version-sublist').forEach(list => {
            list.classList.remove('collapsed');
        });
    },
    
    /**
     * Collapse all version groups
     */
    collapseAllGroups: function() {
        document.querySelectorAll('.version-group-header').forEach(header => {
            header.classList.add('collapsed');
        });
        
        document.querySelectorAll('.version-sublist').forEach(list => {
            list.classList.add('collapsed');
        });
    },
    
    /**
     * Filter versions by major version
     * @param {string} major - Major version to filter by ('all' for all versions)
     */
    filterVersionsByMajor: function(major) {
        if (major === 'all') {
            document.querySelectorAll('.version-group').forEach(group => {
                group.style.display = '';
            });
            return;
        }
        
        document.querySelectorAll('.version-group').forEach(group => {
            const groupId = group.querySelector('.version-group-header').dataset.group;
            group.style.display = groupId === major ? '' : 'none';
        });
    },
    
    /**
     * Filter versions by text search
     * @param {string} text - Text to search for
     */
    filterVersionsByText: function(text) {
        const searchText = text.toLowerCase().trim();
        
        document.querySelectorAll('.version-item').forEach(item => {
            const versionText = item.textContent.toLowerCase();
            item.style.display = searchText === '' || versionText.includes(searchText) ? '' : 'none';
        });
    },
    
    /**
     * Highlight search term in the current version content
     * @param {string} searchTerm - Term to highlight
     * @param {boolean} updateHistory - Whether to update browser history (default: true)
     */
    highlightSearchTerm: function(searchTerm, updateHistory = true) {
        if (!this.current || !searchTerm) return;
        
        // Get the current content from cache
        const content = this.cache[this.current];
        if (!content) return;
        
        // Redisplay the version with the highlight parameter
        UI.displayVersion(this.current, content, searchTerm);
        
        // Check if any highlights were created
        setTimeout(() => {
            const highlights = document.querySelectorAll('.highlight-search-term');
            if (highlights.length === 0) {
                // No results found, show a message
                UI.showNotification(`No matches found for "${searchTerm}" in this version`, 'warning');
            }
        }, 300);
        
        // Update URL to include the highlight parameter if not already there
        if (updateHistory) {
            const currentParams = Utils.getUrlParams();
            if (currentParams.highlight !== searchTerm) {
                const params = { 
                    version: this.current,
                    highlight: searchTerm 
                };
                const newUrl = Utils.createUrlWithParams(params);
                window.history.pushState(params, '', newUrl);
            }
        }
    }
}; 