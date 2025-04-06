/**
 * Storage Module
 * Handles local storage operations and app settings
 */

const Storage = {
    // Search history
    searchHistory: [],

    /**
     * Initialize storage and load saved data
     */
    init: function () {
        this.loadSearchHistory();
    },

    /**
     * Load search history from localStorage
     */
    loadSearchHistory: function () {
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
    saveSearchHistory: function () {
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
    addSearchTerm: function (term) {
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
    clearSearchHistory: function () {
        this.searchHistory = [];
        this.saveSearchHistory();
    },

    /**
     * Save the last viewed version
     * @param {string} version - Version file name
     */
    saveLastVersion: function (version) {
        localStorage.setItem(CONFIG.storage.lastVersion, version);
    },

    /**
     * Get the last viewed version
     * @returns {string|null} Last version or null
     */
    getLastVersion: function () {
        return localStorage.getItem(CONFIG.storage.lastVersion);
    },
};
