/**
 * UI Module
 * Handles user interface interactions and updates
 */

const UI = {
    /**
     * Initialize UI module
     */
    init: function () {
        this.attachEventListeners();
        this.createBackToTopButton();

        // Initialize Bootstrap tooltips
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        const tooltipList = [...tooltipTriggerList].map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl));
    },

    /**
     * Attach event listeners for UI interactions
     */
    attachEventListeners: function () {
        // Event listeners go here

        // Handle scroll events for back-to-top button
        window.addEventListener('scroll', () => {
            this.toggleBackToTopButton();
        });

        // Handle scroll events for navigation buttons
        window.addEventListener('scroll', () => {
            this.toggleScrollButtons();
        });
    },

    /**
     * Create the back to top button
     */
    createBackToTopButton: function () {
        // Create back to top button if it doesn't exist
        if (!document.getElementById('back-to-top')) {
            const buttonTop = document.createElement('button');
            buttonTop.id = 'back-to-top';
            buttonTop.className = 'btn btn-back-to-top';
            buttonTop.innerHTML = '<i class="bi bi-arrow-up"></i>';
            buttonTop.title = 'Back to top';

            // Add click event listener
            buttonTop.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth',
                });
            });

            // Add to the document
            document.body.appendChild(buttonTop);
        }

        // Create back to bottom button if it doesn't exist
        if (!document.getElementById('back-to-bottom')) {
            const buttonBottom = document.createElement('button');
            buttonBottom.id = 'back-to-bottom';
            buttonBottom.className = 'btn btn-back-to-bottom';
            buttonBottom.innerHTML = '<i class="bi bi-arrow-down"></i>';
            buttonBottom.title = 'Go to bottom';

            // Add click event listener
            buttonBottom.addEventListener('click', () => {
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth',
                });
            });

            // Add to the document
            document.body.appendChild(buttonBottom);
        }

        // Initialize visibility
        this.toggleScrollButtons();
    },

    /**
     * Toggle the visibility of navigation buttons based on scroll position
     */
    toggleScrollButtons: function () {
        const buttonTop = document.getElementById('back-to-top');
        const buttonBottom = document.getElementById('back-to-bottom');
        if (!buttonTop || !buttonBottom) return;

        // Get document measurements
        const documentHeight = Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);

        // Get viewport height and scroll position
        const viewportHeight = window.innerHeight;
        const scrollPosition = window.scrollY;

        // Minimum height to show any buttons (1.5x viewport height)
        const minHeightForButtons = viewportHeight * 1.5;

        // Only process if document is tall enough
        if (documentHeight < minHeightForButtons) {
            buttonTop.classList.remove('visible');
            buttonBottom.classList.remove('visible');
            return;
        }

        // Threshold positions (as percentage of scrollable area)
        const topThreshold = 300; // 300px from top
        const bottomThreshold = documentHeight - viewportHeight - 300; // 300px from bottom

        // At top of page: hide top button, show bottom button
        if (scrollPosition < topThreshold) {
            buttonTop.classList.remove('visible');
            buttonBottom.classList.add('visible');
        }
        // At bottom of page: show top button, hide bottom button
        else if (scrollPosition > bottomThreshold) {
            buttonTop.classList.add('visible');
            buttonBottom.classList.remove('visible');
        }
        // In middle of page: show both buttons
        else {
            buttonTop.classList.add('visible');
            buttonBottom.classList.add('visible');
        }
    },

    /**
     * Show loading indicator
     * @param {string} status - Optional status message to display
     * @param {number} progress - Optional progress value (0-100)
     */
    showLoading: function (status, progress) {
        // Show loading indicator
        document.getElementById('loading-indicator')?.classList.remove('d-none');

        // Show loading container with progress bar
        const loadingContainer = document.getElementById('loading-container');
        if (loadingContainer) {
            loadingContainer.classList.remove('d-none');
        }

        // Update loading status if provided
        if (status) {
            const loadingStatus = document.getElementById('loading-status');
            if (loadingStatus) {
                loadingStatus.textContent = status;
            }
        }

        // Update progress bar if a value is provided
        if (progress !== undefined && progress >= 0 && progress <= 100) {
            const progressBar = document.getElementById('loading-progress-bar');
            if (progressBar) {
                progressBar.classList.remove('indeterminate');
                progressBar.style.width = `${progress}%`;
            }
        } else {
            // Use indeterminate progress bar when no value is provided
            const progressBar = document.getElementById('loading-progress-bar');
            if (progressBar) {
                progressBar.classList.add('indeterminate');
                progressBar.style.width = '50%';
            }
        }
    },

    /**
     * Hide loading indicator
     */
    hideLoading: function () {
        // Hide loading indicator
        document.getElementById('loading-indicator')?.classList.add('d-none');

        // Hide loading container
        const loadingContainer = document.getElementById('loading-container');
        if (loadingContainer) {
            loadingContainer.classList.add('d-none');
        }

        // Reset progress bar
        const progressBar = document.getElementById('loading-progress-bar');
        if (progressBar) {
            progressBar.style.width = '0%';
        }
    },

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError: function (message) {
        const contentDisplay = document.getElementById('content-display');
        if (contentDisplay) {
            contentDisplay.innerHTML = `<div class="alert alert-danger">${message}</div>`;
            contentDisplay.style.display = 'block';
        }

        const searchResults = document.getElementById('search-results');
        if (searchResults) {
            searchResults.style.display = 'none';
        }
    },

    /**
     * Render content in the main display area
     * @param {string} markdown - Markdown content
     */
    renderContent: function (markdown) {
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
    showSearchResults: function (results, searchTerm) {
        const contentDisplay = document.getElementById('content-display');
        const searchResults = document.getElementById('search-results');

        if (!searchResults) return;

        // Always hide content display
        if (contentDisplay) {
            contentDisplay.style.display = 'none';
        }

        // Hide search-in-current-version option when showing search results
        this.updateSearchInCurrentVersionOption(false);

        // Always make search results visible
        searchResults.style.display = 'block';

        // If no results, show message
        if (!results || results.length === 0) {
            searchResults.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-search"></i> No results found for "${searchTerm}"
                </div>
            `;

            // Check if navigation buttons should be shown
            setTimeout(() => this.toggleScrollButtons(), 300);

            return;
        }

        // Calculate total matches
        let totalMatchesCount = 0;
        results.forEach((result) => {
            let totalOccurrences = 0;
            result.matches.forEach((match) => {
                totalOccurrences += match.occurrences || 1; // Use occurrences if available, otherwise count as 1
            });
            result.totalOccurrences = totalOccurrences;
            totalMatchesCount += totalOccurrences;
        });

        // Create filter input
        let html = `
            <div class="search-results">
                <div class="mb-3">
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-filter"></i></span>
                        <input type="text" id="result-filter" class="form-control" placeholder="Filter results...">
                        <button class="btn btn-outline-secondary" id="clear-filter">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                </div>
                
                <div class="alert alert-info mb-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <span>Found a total of <strong>${totalMatchesCount} results</strong> in ${results.length} versions</span>
                        <button class="btn btn-sm btn-outline-primary" id="expand-all-results" data-expanded="true">Collapse All</button>
                    </div>
                </div>
        `;

        // Sort results by importance (major version)
        results.sort((a, b) => {
            const versionA = Utils.parseVersion(a.version);
            const versionB = Utils.parseVersion(b.version);

            if (versionA.major !== versionB.major) {
                return versionB.major - versionA.major;
            }

            return versionB.minor - versionA.minor;
        });

        // Build results HTML
        results.forEach((result) => {
            const version = Utils.parseVersion(result.version);

            html += `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <div>
                            <h5 class="mb-0">Version ${version.displayName} <span class="badge bg-primary">${result.totalOccurrences} results</span></h5>
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-outline-secondary btn-collapse" data-target="matches-${version.major}-${version.minor}" data-expanded="true">
                                <i class="bi bi-arrows-collapse"></i>
                            </button>
                            <button class="btn btn-sm btn-primary view-version" data-version="${result.version}">
                                View Version
                            </button>
                        </div>
                    </div>
                    <div class="card-body" id="matches-${version.major}-${version.minor}" style="display: block;">
                        <ul class="list-group">
            `;

            result.matches.forEach((match) => {
                // Highlight the search term in the match text
                const highlightedText = this.highlightSearchTerm(match.text, searchTerm);

                html += `
                    <li class="list-group-item search-match-item">
                        <div class="d-flex align-items-baseline gap-2">
                            <span class="badge bg-secondary">Line ${match.line}</span>
                            <code class="match-text">${highlightedText}</code>
                            ${match.occurrences > 1 ? `<span class="badge bg-info">${match.occurrences} times</span>` : ''}
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

        // Attach event listeners for expand all results button
        document.getElementById('expand-all-results')?.addEventListener('click', () => {
            const expandAllBtn = document.getElementById('expand-all-results');
            const isExpanded = expandAllBtn.dataset.expanded === 'true';

            if (isExpanded) {
                // Collapse all sections
                document.querySelectorAll('#search-results .card-body').forEach((body) => {
                    body.style.display = 'none';
                });

                document.querySelectorAll('#search-results .btn-collapse').forEach((button) => {
                    const icon = button.querySelector('i');
                    icon.classList.remove('bi-arrows-collapse');
                    icon.classList.add('bi-arrows-expand');
                    button.dataset.expanded = 'false';
                });

                // Update expand all button
                expandAllBtn.textContent = 'Expand All';
                expandAllBtn.dataset.expanded = 'false';
            } else {
                // Expand all sections
                document.querySelectorAll('#search-results .card-body').forEach((body) => {
                    body.style.display = 'block';
                });

                document.querySelectorAll('#search-results .btn-collapse').forEach((button) => {
                    const icon = button.querySelector('i');
                    icon.classList.remove('bi-arrows-expand');
                    icon.classList.add('bi-arrows-collapse');
                    button.dataset.expanded = 'true';
                });

                // Update expand all button
                expandAllBtn.textContent = 'Collapse All';
                expandAllBtn.dataset.expanded = 'true';
            }
        });

        // Attach event listeners
        document.querySelectorAll('.view-version').forEach((button) => {
            button.addEventListener('click', () => {
                const version = button.dataset.version;
                // Store current search term in URL as a parameter
                const params = { version: version };

                // Check if we have a search term to highlight
                if (searchTerm) {
                    params.highlight = searchTerm;
                }

                // Load version with search term for highlighting
                Versions.loadVersion(version, true, searchTerm);
            });
        });

        // Collapse/expand sections
        document.querySelectorAll('.btn-collapse').forEach((button) => {
            button.addEventListener('click', () => {
                const targetId = button.dataset.target;
                const target = document.getElementById(targetId);
                const icon = button.querySelector('i');

                // Check current state (stored in data attribute)
                const isExpanded = button.dataset.expanded === 'true';

                if (isExpanded) {
                    // If expanded, collapse it
                    target.style.display = 'none';
                    icon.classList.remove('bi-arrows-collapse');
                    icon.classList.add('bi-arrows-expand');
                    button.dataset.expanded = 'false';
                } else {
                    // If collapsed, expand it
                    target.style.display = 'block';
                    icon.classList.remove('bi-arrows-expand');
                    icon.classList.add('bi-arrows-collapse');
                    button.dataset.expanded = 'true';
                }
            });
        });

        // Filter results
        const resultFilter = document.getElementById('result-filter');
        resultFilter?.addEventListener('input', (e) => {
            const filterText = e.target.value.toLowerCase();

            if (!filterText) {
                // Show all items
                document.querySelectorAll('.search-match-item').forEach((item) => {
                    item.style.display = 'block';
                });

                // Show all version cards
                document.querySelectorAll('#search-results .card').forEach((card) => {
                    card.style.display = 'block';
                });

                return;
            }

            // Track which cards have visible items
            const cardsWithVisibleItems = new Set();

            // First filter individual items
            document.querySelectorAll('.search-match-item').forEach((item) => {
                const text = item.querySelector('.match-text').textContent.toLowerCase();
                const isVisible = text.includes(filterText);

                item.style.display = isVisible ? 'block' : 'none';

                // If visible, track its parent card
                if (isVisible) {
                    const cardBody = item.closest('.card-body');
                    const card = cardBody?.closest('.card');
                    if (card) {
                        cardsWithVisibleItems.add(card);
                    }
                }
            });

            // Then hide/show cards based on whether they have visible items
            document.querySelectorAll('#search-results .card').forEach((card) => {
                card.style.display = cardsWithVisibleItems.has(card) ? 'block' : 'none';
            });
        });

        // Clear filter
        document.getElementById('clear-filter')?.addEventListener('click', () => {
            if (resultFilter) {
                resultFilter.value = '';

                // Show all items
                document.querySelectorAll('.search-match-item').forEach((item) => {
                    item.style.display = 'block';
                });

                // Show all cards
                document.querySelectorAll('#search-results .card').forEach((card) => {
                    card.style.display = 'block';
                });
            }
        });

        // Scroll to top
        window.scrollTo(0, 0);

        // Check if navigation buttons should be shown
        setTimeout(() => this.toggleScrollButtons(), 300);
    },

    /**
     * Highlight search term in a text
     * @param {string} text - Text to highlight in
     * @param {string} term - Term to highlight
     * @returns {string} Highlighted HTML
     */
    highlightSearchTerm: function (text, term) {
        if (!term) return Utils.escapeHtml(text);

        // Handle advanced search with operators
        if (term.includes(' AND ') || term.includes(' OR ') || term.includes(' NOT ')) {
            // Extract terms from the query
            const terms = term.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
            let highlightedText = Utils.escapeHtml(text);

            terms.forEach((t) => {
                if (t === 'AND' || t === 'OR' || t === 'NOT') return;

                // Handle quoted phrases
                if (/^"(.+)"$/.test(t)) {
                    t = t.substring(1, t.length - 1);
                }

                highlightedText = this.applyHighlight(highlightedText, t);
            });

            return highlightedText;
        }

        // Handle exact phrase (quoted)
        let searchTerm = term;
        if (/^"(.+)"$/.test(term)) {
            searchTerm = term.substring(1, term.length - 1);
        }

        return this.applyHighlight(Utils.escapeHtml(text), searchTerm);
    },

    /**
     * Apply highlight to a text for a specific term
     * @param {string} html - HTML text
     * @param {string} term - Term to highlight
     * @returns {string} HTML with highlights
     */
    applyHighlight: function (html, term) {
        if (!term) return html;

        // Create a regex that ignores case
        const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        return html.replace(regex, (match) => `<mark class="highlight">${match}</mark>`);
    },

    /**
     * Update search history UI
     */
    updateSearchHistoryUI: function () {
        const container = document.getElementById('history-items');
        const historySection = document.getElementById('search-history');

        if (!container || !historySection) return;

        if (Storage.searchHistory.length === 0) {
            historySection.classList.add('d-none');
            return;
        }

        historySection.classList.remove('d-none');
        container.innerHTML = '';

        Storage.searchHistory.forEach((term) => {
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
     * Display version in the main content area
     * @param {string} version - Version file name
     * @param {string} content - Content to display
     * @param {string} searchTerm - Optional search term to highlight
     * @param {boolean} updateHistory - Whether to update browser history (default: false)
     */
    displayVersion: function (version, content, searchTerm = null, updateHistory = false) {
        const contentDisplay = document.getElementById('content-display');
        const searchResults = document.getElementById('search-results');

        if (contentDisplay && searchResults) {
            let html = Render.renderMarkdown(content);

            // If search term is provided, highlight it in the version content
            if (searchTerm) {
                // Use a unique placeholder for rendered HTML to avoid breaking HTML tags
                const placeholder = `__HIGHLIGHT_PLACEHOLDER_${Date.now()}__`;
                const highlightClass = 'highlight-search-term';

                // Create a temporary div to manipulate the HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;

                // Create a TreeWalker to traverse text nodes
                const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT, null, false);

                // Process each text node
                const nodesToReplace = [];
                let currentNode;

                // Collect text nodes to replace
                while ((currentNode = walker.nextNode())) {
                    // Skip nodes in pre tags (code blocks) but allow highlighting in inline code
                    let parent = currentNode.parentNode;
                    let inPreTag = false;

                    while (parent) {
                        if (parent.nodeName === 'PRE') {
                            inPreTag = true;
                            break;
                        }
                        parent = parent.parentNode;
                    }

                    if (!inPreTag && currentNode.textContent.length > 0) {
                        // Case insensitive search
                        const text = currentNode.textContent;
                        const searchTermLower = searchTerm.toLowerCase();
                        const textLower = text.toLowerCase();
                        let position = textLower.indexOf(searchTermLower);

                        if (position !== -1) {
                            nodesToReplace.push({
                                node: currentNode,
                                text: text,
                                positions: [],
                            });

                            // Find all occurrences
                            while (position !== -1) {
                                nodesToReplace[nodesToReplace.length - 1].positions.push(position);
                                position = textLower.indexOf(searchTermLower, position + searchTermLower.length);
                            }
                        }
                    }
                }

                // Replace text with highlighted versions
                for (const item of nodesToReplace) {
                    const { node, text, positions } = item;
                    let newHtml = '';
                    let lastPosition = 0;

                    for (const position of positions) {
                        // Add text before match
                        newHtml += text.substring(lastPosition, position);

                        // Add highlighted match
                        newHtml += `<span class="${highlightClass}">${text.substring(position, position + searchTerm.length)}</span>`;

                        lastPosition = position + searchTerm.length;
                    }

                    // Add remaining text
                    newHtml += text.substring(lastPosition);

                    // Create container for the new HTML
                    const container = document.createElement('span');
                    container.innerHTML = newHtml;

                    // Replace the original node with the new container
                    node.parentNode.replaceChild(container, node);
                }

                // Get the modified HTML
                html = tempDiv.innerHTML;
            }

            contentDisplay.innerHTML = html;
            contentDisplay.style.display = 'block';
            searchResults.style.display = 'none';

            // If search term is provided, add CSS for highlighting
            if (searchTerm) {
                // Ensure the highlight style is added
                if (!document.getElementById('highlight-search-style')) {
                    const style = document.createElement('style');
                    style.id = 'highlight-search-style';
                    style.textContent = `
                        .highlight-search-term {
                            background-color: #ffeb3b;
                            color: #000;
                            padding: 0 2px;
                            border-radius: 2px;
                            font-weight: bold;
                        }
                        .results-navigator {
                            position: fixed;
                            top: 80px;
                            right: 30px;
                            background: white;
                            border: 1px solid #ddd;
                            border-radius: 4px;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                            padding: 8px 10px;
                            display: flex;
                            align-items: center;
                            z-index: 1000;
                        }
                        .results-navigator .nav-text {
                            margin: 0 10px;
                            font-weight: 500;
                        }
                        .results-navigator button {
                            background: transparent;
                            border: none;
                            color: #555;
                            cursor: pointer;
                            padding: 0 5px;
                        }
                        .results-navigator button:hover {
                            color: #007bff;
                        }
                        .current-highlight {
                            background-color: #fd7e14 !important;
                            color: white !important;
                        }
                    `;
                    document.head.appendChild(style);
                }

                // Wait a bit for DOM to be fully rendered
                setTimeout(() => {
                    const highlights = contentDisplay.querySelectorAll('.highlight-search-term');
                    if (highlights.length > 0) {
                        // Create navigation bar for search results
                        const navigator = document.createElement('div');
                        navigator.className = 'results-navigator';
                        navigator.innerHTML = `
                            <button class="prev-result" title="Previous result"><i class="bi bi-chevron-up"></i></button>
                            <span class="nav-text">1/${highlights.length}</span>
                            <button class="next-result" title="Next result"><i class="bi bi-chevron-down"></i></button>
                            <button class="close-navigator" title="Close"><i class="bi bi-x"></i></button>
                        `;
                        document.body.appendChild(navigator);

                        // Track current highlight position
                        let currentPosition = 0;
                        highlights[0].classList.add('current-highlight');
                        highlights[0].scrollIntoView({ behavior: 'smooth', block: 'center' });

                        // Navigate to previous result
                        navigator.querySelector('.prev-result').addEventListener('click', () => {
                            highlights[currentPosition].classList.remove('current-highlight');
                            currentPosition = (currentPosition - 1 + highlights.length) % highlights.length;
                            highlights[currentPosition].classList.add('current-highlight');
                            highlights[currentPosition].scrollIntoView({ behavior: 'smooth', block: 'center' });
                            navigator.querySelector('.nav-text').textContent = `${currentPosition + 1}/${highlights.length}`;
                        });

                        // Navigate to next result
                        navigator.querySelector('.next-result').addEventListener('click', () => {
                            highlights[currentPosition].classList.remove('current-highlight');
                            currentPosition = (currentPosition + 1) % highlights.length;
                            highlights[currentPosition].classList.add('current-highlight');
                            highlights[currentPosition].scrollIntoView({ behavior: 'smooth', block: 'center' });
                            navigator.querySelector('.nav-text').textContent = `${currentPosition + 1}/${highlights.length}`;
                        });

                        // Close navigator
                        navigator.querySelector('.close-navigator').addEventListener('click', () => {
                            navigator.remove();
                            highlights.forEach((h) => h.classList.remove('current-highlight'));
                        });

                        // Also add keyboard shortcuts for navigation
                        const handleKeyNavigation = (e) => {
                            if (e.key === 'F3' || (e.ctrlKey && e.key === 'g')) {
                                e.preventDefault();
                                navigator.querySelector('.next-result').click();
                            } else if ((e.shiftKey && e.key === 'F3') || (e.ctrlKey && e.shiftKey && e.key === 'g')) {
                                e.preventDefault();
                                navigator.querySelector('.prev-result').click();
                            } else if (e.key === 'Escape') {
                                navigator.querySelector('.close-navigator').click();
                                document.removeEventListener('keydown', handleKeyNavigation);
                            }
                        };

                        document.addEventListener('keydown', handleKeyNavigation);
                    }
                }, 300);
            }

            // Update title
            const parsedVersion = Utils.parseVersion(version);
            document.getElementById('current-file').textContent = `Version ${parsedVersion.displayName}`;

            // Show search-in-current-version checkbox
            this.updateSearchInCurrentVersionOption(true);

            // Scroll to top if no search term
            if (!searchTerm) {
                window.scrollTo(0, 0);
            }

            // Check if navigation buttons should be shown
            setTimeout(() => this.toggleScrollButtons(), 300);
        }
    },

    /**
     * Update the visibility of the search in current version option
     * @param {boolean} isVersionActive - Whether a specific version is being viewed
     */
    updateSearchInCurrentVersionOption: function (isVersionActive) {
        const searchCurrentVersionCheckbox = document.getElementById('search-current-version');
        if (!searchCurrentVersionCheckbox) return;

        // Always keep the checkbox visible but only enable it when viewing a version
        searchCurrentVersionCheckbox.disabled = !isVersionActive;

        // No longer auto-check the checkbox when viewing a version
        // Let the user decide whether to use this feature
    },

    /**
     * Show a temporary notification
     * @param {string} message - Message to show
     * @param {string} type - Notification type (success, info, warning, danger)
     * @param {number} duration - Duration in milliseconds (default: 3000ms)
     */
    showNotification: function (message, type = 'info', duration = 3000) {
        // Get or create notification container
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.position = 'fixed';
            container.style.top = '10px';
            container.style.left = '50%';
            container.style.transform = 'translateX(-50%)';
            container.style.zIndex = '9999';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'center';
            container.style.gap = '10px';
            document.body.appendChild(container);
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} notification`;
        notification.role = 'alert';
        notification.textContent = message;
        notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        notification.style.minWidth = '250px';
        notification.style.animation = 'fadeIn 0.3s';
        notification.style.textAlign = 'center';
        notification.style.padding = '10px 15px';

        // Add to container
        container.appendChild(notification);

        // Add CSS for animation if not already present
        if (!document.getElementById('notification-style')) {
            const style = document.createElement('style');
            style.id = 'notification-style';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeOut {
                    from { opacity: 1; transform: translateY(0); }
                    to { opacity: 0; transform: translateY(-10px); }
                }
                .notification.fade-out {
                    animation: fadeOut 0.3s forwards;
                }
            `;
            document.head.appendChild(style);
        }

        // Auto-remove after duration
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, duration);

        return notification;
    },
};
