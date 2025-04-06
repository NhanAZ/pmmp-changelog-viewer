/**
 * Application Entry Point
 * Initializes all modules and starts the application
 * @version 1.0.3
 */

// Main App
const App = {
    version: '1.0.3',
    /**
     * Initialize the application
     */
    init: function() {
        console.log('Initializing application...');
        
        // Initialize modules
        UI.init();
        Search.init();
        Versions.init();
        
        // Hide search-in-current-version option initially
        UI.updateSearchInCurrentVersionOption(false);
        
        try {
            // Process URL parameters
            this.processUrlParameters();
        } catch (error) {
            console.error('Error processing URL parameters:', error);
            // Try to recover and still process search parameter
            this.processSearchParameter();
        }
        
        // Setup development notice
        this.setupDevelopmentNotice();
        
        // Add browser history navigation handler
        this.setupHistoryNavigation();
        
        console.log('Application initialized');
    },
    
    /**
     * Setup development notice banner
     */
    setupDevelopmentNotice: function() {
        const noticeBanner = document.getElementById('development-notice');
        if (!noticeBanner) return;
        
        // Check if user has dismissed the notice before
        const isDismissed = localStorage.getItem('developmentNoticeDismissed');
        if (isDismissed === 'true') {
            noticeBanner.style.display = 'none';
        }
        
        // Add event listener to close button
        const closeButton = noticeBanner.querySelector('.btn-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                // Store in localStorage that user has dismissed the notice
                localStorage.setItem('developmentNoticeDismissed', 'true');
            });
        }
    },
    
    /**
     * Setup handler for browser history navigation (back/forward buttons)
     */
    setupHistoryNavigation: function() {
        window.addEventListener('popstate', (event) => {
            console.log('Navigation state changed', event.state);
            
            // Get current URL parameters
            const params = Utils.getUrlParams();
            
            // Handle version parameter
            if (params.version) {
                Versions.loadVersion(params.version, false);
            } else if (params.search) {
                // If there's no version but there is a search, clear the version display
                document.getElementById('content-display').style.display = 'none';
                document.getElementById('current-file').textContent = 'Search Results';
            } else {
                // Neither version nor search, show welcome
                this.renderWelcomePage();
            }
            
            // Handle search parameter
            if (params.search) {
                // Update search input field
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.value = params.search;
                }
                
                // Perform the search without updating history
                try {
                    Search.performSearch(params.search, false);
                } catch (error) {
                    console.error('Error performing search during navigation:', error);
                }
            } else {
                // Clear search results if no search param
                const searchResults = document.getElementById('search-results');
                if (searchResults) {
                    searchResults.style.display = 'none';
                }
                
                // Clear search input
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    searchInput.value = '';
                }
            }
        });
    },
    
    /**
     * Process URL parameters
     */
    processUrlParameters: function() {
        const params = Utils.getUrlParams();
        
        // If a version is specified in the URL, load it
        if (params.version) {
            Versions.loadVersion(params.version, false);
        } else {
            // If no version is specified, check if we have a last viewed version
            try {
                const lastViewedVersion = Storage.getLastVersion();
                // You could use lastViewedVersion here if needed
            } catch (error) {
                console.error('Error getting last version:', error);
            }
            
            // No need to load the welcome page or any default version
            // Let the user choose from the version tree
        }
        
        // Process search parameter separately to ensure it works
        this.processSearchParameter();
    },
    
    /**
     * Process just the search parameter - separated to improve resilience
     */
    processSearchParameter: function() {
        const params = Utils.getUrlParams();
        
        // If a search term is specified in the URL, perform the search
        if (params.search) {
            // Set the search input value
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = params.search;
            }
            
            // Perform the search without updating history
            // Delay slightly to ensure Search module is fully initialized
            setTimeout(() => {
                try {
                    Search.performSearch(params.search, false);
                } catch (error) {
                    console.error('Error performing search:', error);
                    UI.showError('Search failed. Please try again.');
                }
            }, 500);
        }
    },
    
    /**
     * Render welcome page when no version is selected
     */
    renderWelcomePage: function() {
        const contentDisplay = document.getElementById('content-display');
        if (contentDisplay) {
            const welcomeHtml = `
                <div class="welcome-page text-center py-5">
                    <h2>Welcome to PocketMine-MP Changelog Viewer</h2>
                    <p class="mt-4 mb-5">Select a version from the list on the left or search for specific features.</p>
                    <div class="row">
                        <div class="col-md-12 mb-4">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title"><i class="bi bi-search"></i> Search</h5>
                                    <p class="card-text">Search for specific changes across all versions.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            contentDisplay.innerHTML = welcomeHtml;
            contentDisplay.style.display = 'block';
            
            // Update title and clear current version
            document.getElementById('current-file').textContent = 'PocketMine-MP Changelog Viewer';
            Versions.current = null;
            
            // Update URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    },
    
    /**
     * Create a dummy versions.json file for development
     * This is not needed in production as the file would be generated during build
     */
    createDummyVersionsFile: function() {
        // Only in development mode
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            return;
        }
        
        // Check if versions.json exists already
        fetch('changelogs/versions.json')
            .then(response => {
                if (response.ok) {
                    console.log('versions.json already exists');
                    return;
                }
                
                console.log('Creating dummy versions.json...');
                
                // Create dummy data
                const dummyVersions = {
                    versions: [
                        // Add some example versions for testing
                        '5.9.md', 
                        '5.8.md', 
                        '5.7.md', 
                        '5.6.md',
                        '5.5.md', 
                        '5.4.md', 
                        '5.3.md', 
                        '5.2.md', 
                        '5.1.md', 
                        '5.0.md',
                        '4.9.md', 
                        '4.8.md', 
                        '4.7.md', 
                        '4.6.md',
                        '4.5.md', 
                        '4.4.md', 
                        '4.3.md', 
                        '4.2.md', 
                        '4.1.md', 
                        '4.0.md',
                        '3.9.md', 
                        '3.8.md', 
                        '3.7.md', 
                        '3.6.md',
                        '3.5.md', 
                        '3.4.md', 
                        '3.3.md', 
                        '3.2.md', 
                        '3.1.md', 
                        '3.0.md',
                        '1.6.md', 
                        '1.4.md', 
                        '1.3.md'
                    ]
                };
                
                // Create a blob and create a download link
                const blob = new Blob([JSON.stringify(dummyVersions, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = 'versions.json';
                link.textContent = 'Download dummy versions.json';
                link.style.position = 'fixed';
                link.style.bottom = '10px';
                link.style.right = '10px';
                link.style.padding = '10px';
                link.style.background = '#007bff';
                link.style.color = 'white';
                link.style.textDecoration = 'none';
                link.style.borderRadius = '5px';
                link.style.zIndex = '9999';
                
                document.body.appendChild(link);
                
                console.log('Dummy versions.json is ready for download');
            })
            .catch(error => {
                console.error('Error checking versions.json:', error);
            });
    }
};

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
}); 