/**
 * Render Module
 * Handles rendering markdown content and highlighting
 */

const Render = {
    /**
     * Initialize the markdown renderer
     */
    init: function() {
        this.configureMarked();
    },
    
    /**
     * Configure the marked.js library
     */
    configureMarked: function() {
        marked.setOptions({
            renderer: new marked.Renderer(),
            highlight: function(code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(code, { language: lang }).value;
                    } catch (err) {
                        console.error('Highlight error:', err);
                    }
                }
                
                return hljs.highlightAuto(code).value;
            },
            pedantic: false,
            gfm: true,
            breaks: true,
            sanitize: false,
            smartypants: true,
            xhtml: false
        });
    },
    
    /**
     * Render markdown content to HTML
     * @param {string} content - Markdown content
     * @returns {string} HTML content
     */
    renderMarkdown: function(content) {
        if (!content) return '';
        
        try {
            return marked.parse(content);
        } catch (error) {
            console.error('Error rendering markdown:', error);
            return `<div class="alert alert-danger">Error rendering content: ${error.message}</div>`;
        }
    },
    
    /**
     * Highlight search terms in HTML content
     * @param {string} html - HTML content
     * @param {string} searchTerm - Search term to highlight
     * @param {boolean} caseSensitive - Whether search is case sensitive
     * @returns {string} HTML with highlighted search terms
     */
    highlightSearchTerms: function(html, searchTerm, caseSensitive = false) {
        if (!searchTerm || !html) return html;
        
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            this.highlightTextNodes(doc.body, searchTerm, caseSensitive);
            
            return doc.body.innerHTML;
        } catch (error) {
            console.error('Error highlighting search terms:', error);
            return html;
        }
    },
    
    /**
     * Recursively highlight text nodes
     * @param {Node} node - DOM node to process
     * @param {string} searchTerm - Search term to highlight
     * @param {boolean} caseSensitive - Whether search is case sensitive
     */
    highlightTextNodes: function(node, searchTerm, caseSensitive) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            let searchText = searchTerm;
            let nodeText = text;
            
            if (!caseSensitive) {
                searchText = searchTerm.toLowerCase();
                nodeText = text.toLowerCase();
            }
            
            if (nodeText.includes(searchText)) {
                const regex = new RegExp(searchTerm.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), caseSensitive ? 'g' : 'gi');
                const wrapper = document.createElement('div');
                wrapper.innerHTML = text.replace(regex, '<span class="search-highlight">$&</span>');
                
                const fragment = document.createDocumentFragment();
                while (wrapper.firstChild) {
                    fragment.appendChild(wrapper.firstChild);
                }
                
                node.parentNode.replaceChild(fragment, node);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE && 
                  !['script', 'style', 'code', 'pre'].includes(node.nodeName.toLowerCase())) {
            // Don't process script, style, code, or pre tags
            Array.from(node.childNodes).forEach(child => {
                this.highlightTextNodes(child, searchTerm, caseSensitive);
            });
        }
    },
    
    /**
     * Render the diff between two markdown contents
     * @param {string} contentA - First markdown content
     * @param {string} contentB - Second markdown content
     * @returns {string} HTML diff
     */
    renderDiff: function(contentA, contentB) {
        if (!contentA || !contentB) {
            return '<div class="alert alert-warning">Cannot compare: One or both contents are empty</div>';
        }
        
        try {
            // Convert both markdown to raw text (strip HTML tags)
            const textA = contentA.replace(/<[^>]*>/g, '');
            const textB = contentB.replace(/<[^>]*>/g, '');
            
            // Calculate the diff
            const diff = Diff.diffLines(textA, textB);
            
            // Build the HTML for the diff
            let html = '';
            
            diff.forEach(part => {
                const value = Utils.escapeHtml(part.value);
                
                if (part.added) {
                    html += `<div class="diff-added">${value}</div>`;
                } else if (part.removed) {
                    html += `<div class="diff-removed">${value}</div>`;
                } else {
                    html += `<div>${value}</div>`;
                }
            });
            
            return html;
        } catch (error) {
            console.error('Error rendering diff:', error);
            return `<div class="alert alert-danger">Error generating diff: ${error.message}</div>`;
        }
    }
}; 