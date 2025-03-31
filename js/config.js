/**
 * Application Configuration
 * Contains default settings and constants
 */

const CONFIG = {
    // Default app settings
    defaults: {
        fontSize: 'medium',
        theme: 'light', // light, dark, auto
        saveSearchHistory: true,
        maxResults: 5
    },
    
    // Local storage keys
    storage: {
        settings: 'pmmp_changelog_settings',
        bookmarks: 'pmmp_changelog_bookmarks',
        searchHistory: 'pmmp_changelog_search_history',
        lastVersion: 'pmmp_changelog_last_version'
    },
    
    // Path to changelogs
    changelogPath: './changelogs/',
    
    // Version groups
    versionGroups: ['5', '4', '3', '1'],
    
    // Maximum search history items
    maxSearchHistory: 10,
    
    // Maximum bookmarks
    maxBookmarks: 20
}; 