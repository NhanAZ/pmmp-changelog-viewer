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
            Storage.init();
            
            // Initialize UI
            UI.init();
            
            // Initialize Search
            Search.init();
            
            // Initialize Compare
            Compare.init();
            
            // Initialize Versions (loads data)
            await Versions.init();
            
            // Create dummy versions.json if in development
            this.createDummyVersionsFile();
            
            // Check URL parameters for direct loading
            this.processUrlParameters();
            
            console.log('Initialization complete');
        } catch (error) {
            console.error('Error initializing application:', error);
            UI.showError('Failed to initialize the application. Please try refreshing the page.');
        }
    },
    
    /**
     * Process URL parameters
     */
    processUrlParameters: function() {
        const params = Utils.getUrlParams();
        
        // Handle direct version loading
        if (params.version) {
            Versions.loadVersion(params.version);
        } else {
            // Try to load last viewed version
            const lastVersion = Storage.getLastVersion();
            if (lastVersion && Versions.list.includes(lastVersion)) {
                Versions.loadVersion(lastVersion);
            }
        }
        
        // Handle search
        if (params.search) {
            document.getElementById('search-input').value = params.search;
            Search.performSearch(params.search);
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