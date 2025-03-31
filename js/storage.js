/**
 * Storage Module
 * Handles local storage operations and app settings
 */

const Storage = {
    // Current app settings
    settings: {},
    
    // Bookmarks
    bookmarks: [],
    
    // Search history
    searchHistory: [],
    
    /**
     * Initialize storage and load saved data
     */
    init: function() {
        this.loadSettings();
        this.loadBookmarks();
        this.loadSearchHistory();
    },
    
    /**
     * Load settings from localStorage
     */
    loadSettings: function() {
        try {
            const savedSettings = localStorage.getItem(CONFIG.storage.settings);
            this.settings = savedSettings 
                ? JSON.parse(savedSettings) 
                : { ...CONFIG.defaults };
                
            // Apply settings to UI
            this.applySettings();
        } catch (error) {
            console.error('Error loading settings:', error);
            this.settings = { ...CONFIG.defaults };
        }
    },
    
    /**
     * Save settings to localStorage
     */
    saveSettings: function() {
        try {
            localStorage.setItem(CONFIG.storage.settings, JSON.stringify(this.settings));
            this.applySettings();
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    },
    
    /**
     * Apply current settings to the UI
     */
    applySettings: function() {
        // Apply font size
        document.documentElement.className = document.documentElement.className
            .replace(/font-(small|medium|large)/g, '')
            .trim();
        document.documentElement.classList.add(`font-${this.settings.fontSize}`);
        
        // Apply theme
        const isDarkMode = this.settings.theme === 'dark' || 
            (this.settings.theme === 'auto' && Utils.systemPrefersDarkMode());
            
        if (isDarkMode) {
            document.body.classList.add('dark-theme');
            document.getElementById('theme-toggle')?.querySelector('i')?.classList.replace('bi-sun-fill', 'bi-moon-fill');
        } else {
            document.body.classList.remove('dark-theme');
            document.getElementById('theme-toggle')?.querySelector('i')?.classList.replace('bi-moon-fill', 'bi-sun-fill');
        }
        
        // Update settings in UI elements
        document.getElementById('font-size')?.value = this.settings.fontSize;
        document.getElementById('theme-select')?.value = this.settings.theme;
        document.getElementById('save-search-history')?.checked = this.settings.saveSearchHistory;
        document.getElementById('max-results')?.value = this.settings.maxResults;
    },
    
    /**
     * Update a single setting
     * @param {string} key - Setting key
     * @param {any} value - Setting value
     */
    updateSetting: function(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    },
    
    /**
     * Load bookmarks from localStorage
     */
    loadBookmarks: function() {
        try {
            const savedBookmarks = localStorage.getItem(CONFIG.storage.bookmarks);
            this.bookmarks = savedBookmarks ? JSON.parse(savedBookmarks) : [];
        } catch (error) {
            console.error('Error loading bookmarks:', error);
            this.bookmarks = [];
        }
    },
    
    /**
     * Save bookmarks to localStorage
     */
    saveBookmarks: function() {
        try {
            localStorage.setItem(CONFIG.storage.bookmarks, JSON.stringify(this.bookmarks));
        } catch (error) {
            console.error('Error saving bookmarks:', error);
        }
    },
    
    /**
     * Add a bookmark
     * @param {string} version - Version to bookmark
     * @returns {boolean} Success status
     */
    addBookmark: function(version) {
        if (this.bookmarks.includes(version)) {
            return false;
        }
        
        if (this.bookmarks.length >= CONFIG.maxBookmarks) {
            this.bookmarks.pop(); // Remove the oldest bookmark
        }
        
        this.bookmarks.unshift(version);
        this.saveBookmarks();
        return true;
    },
    
    /**
     * Remove a bookmark
     * @param {string} version - Version to remove
     * @returns {boolean} Success status
     */
    removeBookmark: function(version) {
        const index = this.bookmarks.indexOf(version);
        if (index === -1) {
            return false;
        }
        
        this.bookmarks.splice(index, 1);
        this.saveBookmarks();
        return true;
    },
    
    /**
     * Clear all bookmarks
     */
    clearBookmarks: function() {
        this.bookmarks = [];
        this.saveBookmarks();
    },
    
    /**
     * Check if a version is bookmarked
     * @param {string} version - Version to check
     * @returns {boolean} True if bookmarked
     */
    isBookmarked: function(version) {
        return this.bookmarks.includes(version);
    },
    
    /**
     * Load search history from localStorage
     */
    loadSearchHistory: function() {
        if (!this.settings.saveSearchHistory) {
            this.searchHistory = [];
            return;
        }
        
        try {
            const savedHistory = localStorage.getItem(CONFIG.storage.searchHistory);
            this.searchHistory = savedHistory ? JSON.parse(savedHistory) : [];
        } catch (error) {
            console.error('Error loading search history:', error);
            this.searchHistory = [];
        }
    },
    
    /**
     * Save search history to localStorage
     */
    saveSearchHistory: function() {
        if (!this.settings.saveSearchHistory) {
            return;
        }
        
        try {
            localStorage.setItem(CONFIG.storage.searchHistory, JSON.stringify(this.searchHistory));
        } catch (error) {
            console.error('Error saving search history:', error);
        }
    },
    
    /**
     * Add a search term to history
     * @param {string} term - Search term to add
     */
    addSearchTerm: function(term) {
        if (!this.settings.saveSearchHistory) {
            return;
        }
        
        // Remove if exists already (to move to front)
        const index = this.searchHistory.indexOf(term);
        if (index !== -1) {
            this.searchHistory.splice(index, 1);
        }
        
        // Add to front
        this.searchHistory.unshift(term);
        
        // Limit the number of items
        if (this.searchHistory.length > CONFIG.maxSearchHistory) {
            this.searchHistory = this.searchHistory.slice(0, CONFIG.maxSearchHistory);
        }
        
        this.saveSearchHistory();
    },
    
    /**
     * Clear search history
     */
    clearSearchHistory: function() {
        this.searchHistory = [];
        this.saveSearchHistory();
    },
    
    /**
     * Save the last viewed version
     * @param {string} version - Version file name
     */
    saveLastVersion: function(version) {
        localStorage.setItem(CONFIG.storage.lastVersion, version);
    },
    
    /**
     * Get the last viewed version
     * @returns {string|null} Last version or null
     */
    getLastVersion: function() {
        return localStorage.getItem(CONFIG.storage.lastVersion);
    }
}; 