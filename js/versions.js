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
        await this.loadVersionList();
        this.setupVersionListUI();
        this.attachEventListeners();
    },
    
    /**
     * Load the list of available changelog versions
     * @returns {Promise} Promise that resolves when versions are loaded
     */
    loadVersionList: async function() {
        try {
            // In a real application, this would fetch the list of changelog files
            // For GitHub Pages static site, we would have to manually maintain this list
            // or generate it during build time
            
            // For now, we'll simulate this by fetching directory contents or using a predefined list
            // This could be replaced with a fetch call to a generated json file with version listing
            
            // Simulated example:
            const response = await fetch('changelogs/versions.json');
            if (!response.ok) {
                throw new Error('Failed to load version list');
            }
            
            const data = await response.json();
            this.list = data.versions;
            
            // Group versions by major version
            this.grouped = Utils.groupVersionsByMajor(this.list);
            
            return this.list;
        } catch (error) {
            console.error('Error loading version list:', error);
            // Fallback to a predefined list or display error
            UI.showError('Failed to load version list. Please try refreshing the page.');
            return [];
        }
    },
    
    /**
     * Set up the version list UI
     */
    setupVersionListUI: function() {
        CONFIG.versionGroups.forEach(groupId => {
            const container = document.getElementById(`version-group-${groupId}`);
            if (!container) return;
            
            const versions = this.grouped[groupId] || [];
            container.innerHTML = '';
            
            versions.forEach(version => {
                const item = document.createElement('li');
                item.className = 'list-group-item version-item';
                item.dataset.version = version.file;
                item.textContent = version.parsed.displayName;
                
                if (version.parsed.isAlpha) {
                    item.innerHTML += ' <span class="badge bg-warning text-dark">Alpha</span>';
                } else if (version.parsed.isBeta) {
                    item.innerHTML += ' <span class="badge bg-info text-dark">Beta</span>';
                }
                
                container.appendChild(item);
            });
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
        document.getElementById('expand-all')?.addEventListener('click', this.expandAllGroups);
        document.getElementById('collapse-all')?.addEventListener('click', this.collapseAllGroups);
        
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
     * Load and display a specific version
     * @param {string} version - Version file name
     * @returns {Promise} Promise that resolves when version is loaded
     */
    loadVersion: async function(version) {
        try {
            UI.showLoading();
            
            // Check cache first
            if (this.cache[version]) {
                this.displayVersion(version, this.cache[version]);
                return;
            }
            
            const response = await fetch(`${CONFIG.changelogPath}${version}`);
            if (!response.ok) {
                throw new Error(`Failed to load version ${version}`);
            }
            
            const content = await response.text();
            
            // Cache the content
            this.cache[version] = content;
            
            // Display the version
            this.displayVersion(version, content);
            
            // Save as last viewed version
            Storage.saveLastVersion(version);
            
            return content;
        } catch (error) {
            console.error(`Error loading version ${version}:`, error);
            UI.showError(`Failed to load version ${version}. Please try again.`);
        } finally {
            UI.hideLoading();
        }
    },
    
    /**
     * Display a loaded version
     * @param {string} version - Version file name
     * @param {string} content - Markdown content
     */
    displayVersion: function(version, content) {
        // Update current version
        this.current = version;
        
        // Render content
        UI.renderContent(content);
        
        // Update UI elements
        document.querySelectorAll('.version-item').forEach(item => {
            item.classList.toggle('active', item.dataset.version === version);
        });
        
        const parsedVersion = Utils.parseVersion(version);
        document.getElementById('current-file').textContent = `Version ${parsedVersion.displayName}`;
        
        // Update bookmark button state
        UI.updateBookmarkButton(Storage.isBookmarked(version));
        
        // Update URL for sharing
        const newUrl = Utils.createUrlWithParams({ version });
        window.history.replaceState({}, '', newUrl);
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