/**
 * Render Module
 * Handles rendering markdown content and highlighting
 */

const Render = {
	/**
	 * Initialize the markdown renderer
	 */
	init: function () {
		this.configureMarked();
	},

	/**
	 * Configure the marked.js library
	 */
	configureMarked: function () {
		marked.setOptions({
			renderer: new marked.Renderer(),
			highlight: function (code, lang) {
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
			xhtml: false,
		});
	},

	/**
	 * Render markdown content to HTML
	 * @param {string} content - Markdown content
	 * @returns {string} HTML content
	 */
	renderMarkdown: function (content) {
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
	highlightSearchTerms: function (html, searchTerm, caseSensitive = false) {
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
	highlightTextNodes: function (node, searchTerm, caseSensitive) {
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
		} else if (node.nodeType === Node.ELEMENT_NODE && !['script', 'style', 'code', 'pre'].includes(node.nodeName.toLowerCase())) {
			// Don't process script, style, code, or pre tags
			Array.from(node.childNodes).forEach((child) => {
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
	renderDiff: function (contentA, contentB) {
		if (!contentA || !contentB) {
			return '<div class="alert alert-warning">Cannot compare: One or both contents are empty</div>';
		}

		try {
			// Extract sections from content
			const sectionsA = this.extractSections(contentA);
			const sectionsB = this.extractSections(contentB);

			// Build HTML for comparison
			let html = '<div class="diff-container">';

			// Compare each section
			const allSections = new Set([...Object.keys(sectionsA), ...Object.keys(sectionsB)]);

			for (const section of allSections) {
				html += `<h4 class="diff-section-title">${section}</h4>`;

				if (!sectionsA[section]) {
					// Section only in B
					html += `<div class="diff-section diff-added"><pre>${Utils.escapeHtml(sectionsB[section])}</pre></div>`;
				} else if (!sectionsB[section]) {
					// Section only in A
					html += `<div class="diff-section diff-removed"><pre>${Utils.escapeHtml(sectionsA[section])}</pre></div>`;
				} else {
					// Section in both, calculate detailed diff
					const sectionDiff = Diff.diffLines(sectionsA[section], sectionsB[section]);

					if (sectionDiff.some((part) => part.added || part.removed)) {
						// If there are differences, show diff
						html += '<div class="diff-section">';
						sectionDiff.forEach((part) => {
							const value = Utils.escapeHtml(part.value);
							if (part.added) {
								html += `<div class="diff-line diff-added"><pre>${value}</pre></div>`;
							} else if (part.removed) {
								html += `<div class="diff-line diff-removed"><pre>${value}</pre></div>`;
							} else {
								html += `<div class="diff-line"><pre>${value}</pre></div>`;
							}
						});
						html += '</div>';
					} else {
						// If identical, show message
						html += '<div class="diff-section diff-unchanged"><p><em>No changes in this section</em></p></div>';
					}
				}
			}

			html += '</div>';
			return html;
		} catch (error) {
			console.error('Error rendering diff:', error);
			return `<div class="alert alert-danger">Error generating diff: ${error.message}</div>`;
		}
	},

	/**
	 * Extract sections from changelog content
	 * @param {string} content - Markdown content
	 * @returns {Object} Sections with titles as keys and content as values
	 */
	extractSections: function (content) {
		if (!content) return {};

		const sections = {};
		let currentSection = 'General';
		let currentContent = '';

		// Parse content line by line
		const lines = content.split('\n');

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];

			// Check if the line is a section heading
			if (line.startsWith('##') && !line.startsWith('###')) {
				// Save current section before moving to a new one
				if (currentContent.trim()) {
					sections[currentSection] = currentContent.trim();
				}

				// Update to new section
				currentSection = line.replace(/^##\s*/, '').trim();
				currentContent = '';
			} else {
				// Add line to current section content
				currentContent += line + '\n';
			}
		}

		// Save the last section
		if (currentContent.trim()) {
			sections[currentSection] = currentContent.trim();
		}

		return sections;
	},
};
