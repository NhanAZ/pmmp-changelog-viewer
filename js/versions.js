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
        this.attachEventListeners();
    },
    
    /**
     * Display version tree
     */
    displayVersionTree: function() {
        // Group versions by major version
        this.grouped = Utils.groupVersionsByMajor(this.list);
        
        // Get version sidebar container
        const versionList = document.getElementById('version-list');
        if (!versionList) return;
        
        // Clear existing content
        versionList.innerHTML = '';
        
        // Create version groups
        Object.keys(this.grouped).sort((a, b) => parseInt(b) - parseInt(a)).forEach(majorVersion => {
            const versions = this.grouped[majorVersion];
            
            // Create group container
            const groupDiv = document.createElement('div');
            groupDiv.className = 'version-group';
            
            // Create group header
            const headerDiv = document.createElement('div');
            headerDiv.className = 'version-group-header';
            headerDiv.dataset.group = majorVersion;
            headerDiv.textContent = `PocketMine-MP ${majorVersion}.x`;
            
            // Create version sublist
            const sublistDiv = document.createElement('div');
            sublistDiv.className = 'version-sublist';
            sublistDiv.id = `version-group-${majorVersion}`;
            
            // Add versions to sublist
            versions.forEach(version => {
                const versionItem = document.createElement('div');
                versionItem.className = 'version-item';
                versionItem.dataset.version = version.file;
                versionItem.textContent = version.displayName;
                
                // Add beta/alpha badge if needed
                if (version.isAlpha) {
                    const badge = document.createElement('span');
                    badge.className = 'badge bg-warning text-dark ms-2';
                    badge.textContent = 'Alpha';
                    versionItem.appendChild(badge);
                } else if (version.isBeta) {
                    const badge = document.createElement('span');
                    badge.className = 'badge bg-info text-dark ms-2';
                    badge.textContent = 'Beta';
                    versionItem.appendChild(badge);
                }
                
                sublistDiv.appendChild(versionItem);
            });
            
            // Build group
            groupDiv.appendChild(headerDiv);
            groupDiv.appendChild(sublistDiv);
            versionList.appendChild(groupDiv);
        });
    },
    
    /**
     * Attach event listeners for version items
     */
    attachEventListeners: function() {
        // Version item click event
        document.querySelectorAll('.version-item').forEach(item => {
            item.addEventListener('click', () => {
                const version = item.dataset.version;
                this.loadVersion(version);
            });
        });
        
        // Version group toggle events
        document.querySelectorAll('.version-group-header').forEach(header => {
            header.addEventListener('click', () => {
                const groupId = header.dataset.group;
                this.toggleVersionGroup(groupId);
            });
        });
        
        // Expand/collapse buttons
        document.getElementById('expand-all')?.addEventListener('click', () => {
            this.expandAllGroups();
        });
        document.getElementById('collapse-all')?.addEventListener('click', () => {
            this.collapseAllGroups();
        });
        
        // Version filter
        document.getElementById('version-filter')?.addEventListener('change', event => {
            this.filterVersionsByMajor(event.target.value);
        });
        
        // Version search
        document.getElementById('version-search')?.addEventListener('input', event => {
            this.filterVersionsByText(event.target.value);
        });
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
     */
    loadVersion: async function(version, updateHistory = true) {
        try {
            if (!version) return;
            
            // Show loading indicator
            UI.showLoading(`Loading version ${version.replace('.md', '')}...`);
            
            // Check if already in cache
            if (this.cache[version]) {
                this.displayVersion(version, this.cache[version], updateHistory);
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
            
            // Display the content
            this.displayVersion(version, content, updateHistory);
            
            // Update URL if needed
            if (updateHistory) {
                const newUrl = Utils.createUrlWithParams({ version });
                window.history.pushState({ version }, '', newUrl);
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
     */
    displayVersion: function(version, content, updateHistory = true) {
        // Update current version
        this.current = version;
        
        // Hide search results if visible
        const searchResults = document.getElementById('search-results');
        if (searchResults) {
            searchResults.style.display = 'none';
        }
        
        // Render content
        UI.renderContent(content);
        
        // Update UI elements
        document.querySelectorAll('.version-item').forEach(item => {
            item.classList.toggle('active', item.dataset.version === version);
        });
        
        const parsedVersion = Utils.parseVersion(version);
        document.getElementById('current-file').textContent = `Version ${parsedVersion.displayName}`;
        
        // Update URL for sharing and add to browser history if needed
        if (updateHistory) {
            const newUrl = Utils.createUrlWithParams({ version });
            window.history.pushState({ version }, '', newUrl);
        }
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
    }
}; 