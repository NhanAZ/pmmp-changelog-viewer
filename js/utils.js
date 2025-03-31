/**
 * Utility Functions
 * Collection of helper functions used throughout the application
 */

const Utils = {
    /**
     * Parse a version string into components
     * @param {string} version - Version string (e.g. "5.7.md")
     * @returns {Object} Parsed version object
     */
    parseVersion: (version) => {
        const fileName = version.replace('.md', '');
        const isAlpha = fileName.includes('-alpha');
        const isBeta = fileName.includes('-beta');
        const baseVersion = fileName.replace('-alpha', '').replace('-beta', '');
        
        const parts = baseVersion.split('.');
        const major = parseInt(parts[0], 10);
        const minor = parts.length > 1 ? parseInt(parts[1], 10) : 0;
        
        return {
            major,
            minor,
            isAlpha,
            isBeta,
            isPreRelease: isAlpha || isBeta,
            fileName,
            fullVersion: version,
            displayName: `${major}.${minor}${isAlpha ? '-alpha' : isBeta ? '-beta' : ''}`
        };
    },
    
    /**
     * Compare two version objects for sorting
     * @param {Object} a - First version object
     * @param {Object} b - Second version object
     * @returns {number} Comparison result (-1, 0, 1)
     */
    compareVersions: (a, b) => {
        if (a.major !== b.major) {
            return b.major - a.major; // Higher major versions first
        }
        
        if (a.minor !== b.minor) {
            return b.minor - a.minor; // Higher minor versions first
        }
        
        // For same version numbers, stable releases come before pre-releases
        if (a.isPreRelease && !b.isPreRelease) return 1;
        if (!a.isPreRelease && b.isPreRelease) return -1;
        
        // Alpha comes after beta
        if (a.isAlpha && b.isBeta) return -1;
        if (a.isBeta && b.isAlpha) return 1;
        
        return 0;
    },
    
    /**
     * Group versions by major version
     * @param {Array} versions - List of version strings
     * @returns {Object} Grouped versions
     */
    groupVersionsByMajor: (versions) => {
        const groups = {};
        
        versions.forEach(version => {
            const parsedVersion = Utils.parseVersion(version);
            const majorVersion = parsedVersion.major.toString();
            
            if (!groups[majorVersion]) {
                groups[majorVersion] = [];
            }
            
            groups[majorVersion].push({
                file: version,
                parsed: parsedVersion
            });
        });
        
        // Sort versions within each group
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => Utils.compareVersions(a.parsed, b.parsed));
        });
        
        return groups;
    },
    
    /**
     * Truncate text to a specified length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     */
    truncateText: (text, maxLength = 100) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },
    
    /**
     * Escape HTML special characters
     * @param {string} html - String to escape
     * @returns {string} Escaped string
     */
    escapeHtml: (html) => {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    },
    
    /**
     * Generate a unique ID
     * @returns {string} Unique ID
     */
    generateId: () => {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    },
    
    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise} Promise that resolves when text is copied
     */
    copyToClipboard: (text) => {
        return navigator.clipboard.writeText(text);
    },
    
    /**
     * Format a date to a readable string
     * @param {Date} date - Date object
     * @returns {string} Formatted date string
     */
    formatDate: (date) => {
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },
    
    /**
     * Check if the system prefers dark mode
     * @returns {boolean} True if system prefers dark mode
     */
    systemPrefersDarkMode: () => {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    },
    
    /**
     * Get URL parameters as an object
     * @returns {Object} URL parameters
     */
    getUrlParams: () => {
        const params = {};
        const queryString = window.location.search.substring(1);
        
        if (queryString) {
            const pairs = queryString.split('&');
            pairs.forEach(pair => {
                const [key, value] = pair.split('=');
                // Replace '+' with space before decoding to ensure proper handling of spaces
                const decodedKey = decodeURIComponent(key);
                const decodedValue = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
                params[decodedKey] = decodedValue;
            });
        }
        
        return params;
    },
    
    /**
     * Create URL with parameters
     * @param {Object} params - Parameters to include
     * @returns {string} URL with parameters
     */
    createUrlWithParams: (params) => {
        const url = new URL(window.location.href.split('?')[0]);
        
        Object.keys(params).forEach(key => {
            if (params[key]) {
                url.searchParams.append(key, params[key]);
            }
        });
        
        return url.toString();
    }
}; 