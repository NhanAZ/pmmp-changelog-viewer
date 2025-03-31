/**
 * Application Entry Point
 * Initializes all modules and starts the application
 */

// Main App
const App = {
    /**
     * Initialize the application
     */
    init: async function() {
        try {
            console.log('Initializing PocketMine-MP Changelog Viewer...');
            
            // Initialize modules in order
            Render.init();
            
            try {
                Storage.init();
                console.log('Storage initialized successfully');
            } catch (storageError) {
                console.error('Error initializing Storage module:', storageError);
            }
            
            try {
                UI.init();
                console.log('UI initialized successfully');
            } catch (uiError) {
                console.error('Error initializing UI module:', uiError);
            }
            
            // Initialize Search
            Search.init();
            
            // Initialize Versions (loads data)
            await Versions.init();
            
            // Create dummy versions.json if in development
            this.createDummyVersionsFile();
            
            // Check URL parameters for direct loading
            this.processUrlParameters();
            
            // Handle browser back/forward buttons
            window.addEventListener('popstate', (event) => {
                // Get current URL parameters when back/forward is pressed
                const currentParams = Utils.getUrlParams();
                
                if (currentParams.search) {
                    // If URL has search parameter, prioritize displaying search results
                    document.getElementById('search-input').value = currentParams.search;
                    Search.performSearch(currentParams.search, false);
                } else if (currentParams.version) {
                    // If URL has version parameter, display that version
                    Versions.loadVersion(currentParams.version, false);
                } else if (event.state && event.state.search) {
                    // Fallback to state if URL parameters are missing
                    document.getElementById('search-input').value = event.state.search;
                    Search.performSearch(event.state.search, false);
                } else if (event.state && event.state.version) {
                    // Fallback to state if URL parameters are missing
                    Versions.loadVersion(event.state.version, false);
                } else {
                    // Default to welcome page
                    this.renderWelcomePage();
                }
            });
            
            console.log('Initialization complete');
        } catch (error) {
            console.error('Error initializing application:', error);
            alert('Failed to initialize the application. Please try refreshing the page.');
        }
    },
    
    /**
     * Process URL parameters
     */
    processUrlParameters: function() {
        const params = Utils.getUrlParams();
        
        // Handle direct search loading (prioritize search over version)
        if (params.search) {
            document.getElementById('search-input').value = params.search;
            Search.performSearch(params.search);
        }
        // Handle direct version loading only if there's no search
        else if (params.version) {
            Versions.loadVersion(params.version);
        } else {
            // Display welcome page instead of automatically loading the last viewed version
            this.renderWelcomePage();
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