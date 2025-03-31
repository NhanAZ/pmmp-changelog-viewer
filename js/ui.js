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
        // Theme toggle
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            const currentTheme = Storage.settings.theme;
            
            if (currentTheme === 'dark') {
                Storage.updateSetting('theme', 'light');
            } else {
                Storage.updateSetting('theme', 'dark');
            }
        });
        
        // Settings button
        document.getElementById('settings-btn')?.addEventListener('click', this.openSettingsModal);
        
        // Save settings button
        document.getElementById('save-settings')?.addEventListener('click', this.saveSettingsFromModal);
        
        // Bookmark button
        document.getElementById('btn-bookmark')?.addEventListener('click', this.toggleBookmark);
        
        // Clear bookmarks button
        document.getElementById('clear-bookmarks')?.addEventListener('click', this.clearAllBookmarks);
        
        // Share button
        document.getElementById('btn-share')?.addEventListener('click', this.shareCurrentView);
        
        // Compare button
        document.getElementById('btn-compare')?.addEventListener('click', this.openCompareModal);
        
        // Start compare button
        document.getElementById('btn-start-compare')?.addEventListener('click', this.compareVersions);
    },
    
    /**
     * Show loading indicator
     */
    showLoading: function() {
        document.getElementById('loading-indicator')?.classList.remove('d-none');
    },
    
    /**
     * Hide loading indicator
     */
    hideLoading: function() {
        document.getElementById('loading-indicator')?.classList.add('d-none');
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
        
        document.getElementById('search-results')?.style.display = 'none';
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
        
        if (!contentDisplay || !searchResults) return;
        
        contentDisplay.style.display = 'none';
        searchResults.style.display = 'block';
        
        // Update header
        document.getElementById('current-file').textContent = `Search Results: "${searchTerm}"`;
        
        if (results.length === 0) {
            searchResults.innerHTML = `<div class="alert alert-info">No results found for "${searchTerm}"</div>`;
            return;
        }
        
        // Build results HTML
        let html = '<div class="search-results-container">';
        
        results.forEach(result => {
            const version = Utils.parseVersion(result.version);
            
            html += `
                <div class="card mb-3 search-result-card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Version ${version.displayName}</h5>
                        <button class="btn btn-sm btn-primary view-version" data-version="${result.version}">View</button>
                    </div>
                    <div class="card-body">
                        <ul class="list-group">
            `;
            
            result.matches.forEach(match => {
                html += `
                    <li class="list-group-item">
                        <div class="d-flex align-items-baseline gap-2">
                            <span class="badge bg-secondary">Line ${match.line}</span>
                            <code>${Utils.escapeHtml(match.text)}</code>
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
        
        document.querySelectorAll('.view-version').forEach(button => {
            button.addEventListener('click', () => {
                const version = button.dataset.version;
                Versions.loadVersion(version);
            });
        });
        
        // Scroll to top
        window.scrollTo(0, 0);
    },
    
    /**
     * Update bookmark button state
     * @param {boolean} isBookmarked - Whether current version is bookmarked
     */
    updateBookmarkButton: function(isBookmarked) {
        const button = document.getElementById('btn-bookmark');
        if (!button) return;
        
        const icon = button.querySelector('i');
        
        if (isBookmarked) {
            button.classList.add('active');
            icon?.classList.replace('bi-bookmark', 'bi-bookmark-fill');
        } else {
            button.classList.remove('active');
            icon?.classList.replace('bi-bookmark-fill', 'bi-bookmark');
        }
    },
    
    /**
     * Toggle bookmark for current version
     */
    toggleBookmark: function() {
        const currentVersion = Versions.current;
        if (!currentVersion) return;
        
        if (Storage.isBookmarked(currentVersion)) {
            Storage.removeBookmark(currentVersion);
        } else {
            Storage.addBookmark(currentVersion);
        }
        
        UI.updateBookmarkButton(Storage.isBookmarked(currentVersion));
        UI.updateBookmarksUI();
    },
    
    /**
     * Clear all bookmarks
     */
    clearAllBookmarks: function() {
        if (confirm('Are you sure you want to remove all bookmarks?')) {
            Storage.clearBookmarks();
            UI.updateBookmarksUI();
            UI.updateBookmarkButton(false);
        }
    },
    
    /**
     * Update bookmarks UI
     */
    updateBookmarksUI: function() {
        const container = document.getElementById('bookmarks-container');
        const panel = document.getElementById('bookmarks-panel');
        
        if (!container || !panel) return;
        
        if (Storage.bookmarks.length === 0) {
            panel.classList.add('d-none');
            return;
        }
        
        panel.classList.remove('d-none');
        container.innerHTML = '';
        
        Storage.bookmarks.forEach(version => {
            const parsedVersion = Utils.parseVersion(version);
            const chip = document.createElement('div');
            chip.className = 'bookmark-chip';
            chip.innerHTML = `${parsedVersion.displayName} <i class="bi bi-x"></i>`;
            chip.dataset.version = version;
            
            chip.addEventListener('click', event => {
                if (event.target.tagName.toLowerCase() === 'i') {
                    Storage.removeBookmark(version);
                    UI.updateBookmarksUI();
                    UI.updateBookmarkButton(Storage.isBookmarked(Versions.current));
                } else {
                    Versions.loadVersion(version);
                }
            });
            
            container.appendChild(chip);
        });
    },
    
    /**
     * Update search history UI
     */
    updateSearchHistoryUI: function() {
        const container = document.getElementById('history-items');
        const historySection = document.getElementById('search-history');
        
        if (!container || !historySection) return;
        
        if (!Storage.settings.saveSearchHistory || Storage.searchHistory.length === 0) {
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
     * Open settings modal
     */
    openSettingsModal: function() {
        // Set current values
        document.getElementById('theme-select').value = Storage.settings.theme;
        document.getElementById('font-size').value = Storage.settings.fontSize;
        document.getElementById('save-search-history').checked = Storage.settings.saveSearchHistory;
        document.getElementById('max-results').value = Storage.settings.maxResults;
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('settings-modal'));
        modal.show();
    },
    
    /**
     * Save settings from modal
     */
    saveSettingsFromModal: function() {
        const theme = document.getElementById('theme-select').value;
        const fontSize = document.getElementById('font-size').value;
        const saveSearchHistory = document.getElementById('save-search-history').checked;
        const maxResults = parseInt(document.getElementById('max-results').value, 10);
        
        Storage.settings = {
            ...Storage.settings,
            theme,
            fontSize,
            saveSearchHistory,
            maxResults: isNaN(maxResults) ? CONFIG.defaults.maxResults : maxResults
        };
        
        Storage.saveSettings();
        
        // Hide modal
        bootstrap.Modal.getInstance(document.getElementById('settings-modal'))?.hide();
    },
    
    /**
     * Share current view
     */
    shareCurrentView: function() {
        const url = window.location.href;
        
        try {
            // Try to use the modern clipboard API
            navigator.clipboard.writeText(url)
                .then(() => {
                    alert('Link copied to clipboard!');
                })
                .catch(() => {
                    // Fallback for older browsers
                    prompt('Copy this link to share:', url);
                });
        } catch (error) {
            // Final fallback
            prompt('Copy this link to share:', url);
        }
    },
    
    /**
     * Open compare modal
     */
    openCompareModal: function() {
        // Populate version dropdowns
        const versionA = document.getElementById('version-a');
        const versionB = document.getElementById('version-b');
        
        if (!versionA || !versionB) return;
        
        versionA.innerHTML = '';
        versionB.innerHTML = '';
        
        // Add all versions to the dropdowns
        Versions.list.forEach(version => {
            const parsedVersion = Utils.parseVersion(version);
            
            const option = document.createElement('option');
            option.value = version;
            option.textContent = parsedVersion.displayName;
            
            versionA.appendChild(option.cloneNode(true));
            versionB.appendChild(option);
        });
        
        // If current version exists, select it in first dropdown
        if (Versions.current) {
            versionA.value = Versions.current;
            
            // Try to select the previous version in the second dropdown
            const currentIndex = Versions.list.indexOf(Versions.current);
            if (currentIndex > 0 && currentIndex < Versions.list.length) {
                versionB.value = Versions.list[currentIndex + 1] || Versions.list[0];
            }
        }
        
        // Clear previous results
        document.getElementById('compare-result').innerHTML = '';
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('compare-modal'));
        modal.show();
    },
    
    /**
     * Compare selected versions
     */
    compareVersions: async function() {
        const versionA = document.getElementById('version-a').value;
        const versionB = document.getElementById('version-b').value;
        const resultContainer = document.getElementById('compare-result');
        
        if (!versionA || !versionB || !resultContainer) return;
        
        if (versionA === versionB) {
            resultContainer.innerHTML = '<div class="alert alert-warning">Please select different versions to compare</div>';
            return;
        }
        
        try {
            UI.showLoading();
            resultContainer.innerHTML = '<div class="text-center">Comparing versions...</div>';
            
            // Fetch content for both versions if not in cache
            let contentA = Versions.cache[versionA];
            let contentB = Versions.cache[versionB];
            
            if (!contentA) {
                const response = await fetch(`${CONFIG.changelogPath}${versionA}`);
                if (!response.ok) throw new Error(`Failed to load version ${versionA}`);
                contentA = await response.text();
                Versions.cache[versionA] = contentA;
            }
            
            if (!contentB) {
                const response = await fetch(`${CONFIG.changelogPath}${versionB}`);
                if (!response.ok) throw new Error(`Failed to load version ${versionB}`);
                contentB = await response.text();
                Versions.cache[versionB] = contentB;
            }
            
            // Render diff
            const diffHtml = Render.renderDiff(contentA, contentB);
            
            // Show result
            const parsedA = Utils.parseVersion(versionA);
            const parsedB = Utils.parseVersion(versionB);
            
            resultContainer.innerHTML = `
                <div class="alert alert-info">
                    Comparing version ${parsedA.displayName} with ${parsedB.displayName}
                </div>
                <div class="diff-container">${diffHtml}</div>
            `;
        } catch (error) {
            console.error('Error comparing versions:', error);
            resultContainer.innerHTML = `<div class="alert alert-danger">Error comparing versions: ${error.message}</div>`;
        } finally {
            UI.hideLoading();
        }
    }
}; 