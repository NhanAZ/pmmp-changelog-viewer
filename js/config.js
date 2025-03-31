/**
 * Application Configuration
 * Contains default settings and constants
 */

const CONFIG = {
    // Local storage keys
    storage: {
        searchHistory: 'pmmp_changelog_search_history',
        lastVersion: 'pmmp_changelog_last_version'
    },
    
    // Path to changelogs
    changelogPath: './changelogs/',
    
    // Version groups
    versionGroups: ['5', '4', '3', '1'],
    
    // Maximum search history items
    maxSearchHistory: 10
}; 