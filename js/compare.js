/**
 * Compare Module
 * Handles version comparison functionality
 */

const Compare = {
    /**
     * Initialize compare module
     */
    init: function () {
        this.attachEventListeners();
    },

    /**
     * Attach event listeners for compare functionality
     */
    attachEventListeners: function () {
        document.getElementById('btn-compare')?.addEventListener('click', this.openCompareModal.bind(this));
        document.getElementById('btn-start-compare')?.addEventListener('click', this.compareVersions.bind(this));
    },

    /**
     * Open the compare modal
     */
    openCompareModal: function () {
        // Populate version dropdowns
        const versionA = document.getElementById('version-a');
        const versionB = document.getElementById('version-b');

        if (!versionA || !versionB) return;

        versionA.innerHTML = '';
        versionB.innerHTML = '';

        // Add all versions to the dropdowns
        Versions.list.forEach((version) => {
            const parsedVersion = Utils.parseVersion(version);

            const option = document.createElement('option');
            option.value = version;
            option.textContent = parsedVersion.displayName;

            versionA.appendChild(option.cloneNode(true));
            versionB.appendChild(option);
        });

        // If current version exists, select it in first dropdown
        if (Versions.current) {
            versionA.value = Versions.current;

            // Find next logical version to compare with
            const currentParsed = Utils.parseVersion(Versions.current);
            let bestMatch = null;

            for (const version of Versions.list) {
                if (version === Versions.current) continue;

                const parsed = Utils.parseVersion(version);

                // Try to find the previous version in sequence
                if (parsed.major === currentParsed.major && parsed.minor === currentParsed.minor - 1 && !parsed.isPreRelease) {
                    bestMatch = version;
                    break;
                }

                // If not found, try to find the next version
                if (!bestMatch && parsed.major === currentParsed.major && parsed.minor === currentParsed.minor + 1 && !parsed.isPreRelease) {
                    bestMatch = version;
                }
            }

            if (bestMatch) {
                versionB.value = bestMatch;
            } else {
                // Just select the next version in the list
                const currentIndex = Versions.list.indexOf(Versions.current);
                if (currentIndex > 0 && currentIndex < Versions.list.length - 1) {
                    versionB.value = Versions.list[currentIndex + 1];
                } else if (currentIndex === 0 && Versions.list.length > 1) {
                    versionB.value = Versions.list[1];
                } else if (currentIndex === Versions.list.length - 1 && Versions.list.length > 1) {
                    versionB.value = Versions.list[currentIndex - 1];
                }
            }
        }

        // Clear previous results
        document.getElementById('compare-result').innerHTML = '';

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('compare-modal'));
        modal.show();
    },

    /**
     * Compare two selected versions
     */
    compareVersions: async function () {
        const versionA = document.getElementById('version-a')?.value;
        const versionB = document.getElementById('version-b')?.value;
        const resultContainer = document.getElementById('compare-result');

        if (!versionA || !versionB || !resultContainer) return;

        if (versionA === versionB) {
            resultContainer.innerHTML = '<div class="alert alert-warning">Please select different versions to compare</div>';
            return;
        }

        try {
            UI.showLoading();
            resultContainer.innerHTML = '<div class="text-center">Comparing versions...</div>';

            // Fetch content for both versions if not in cache
            let contentA = Versions.cache[versionA];
            let contentB = Versions.cache[versionB];

            if (!contentA) {
                const response = await fetch(`${CONFIG.changelogPath}${versionA}`);
                if (!response.ok) throw new Error(`Failed to load version ${versionA}`);
                contentA = await response.text();
                Versions.cache[versionA] = contentA;
            }

            if (!contentB) {
                const response = await fetch(`${CONFIG.changelogPath}${versionB}`);
                if (!response.ok) throw new Error(`Failed to load version ${versionB}`);
                contentB = await response.text();
                Versions.cache[versionB] = contentB;
            }

            // Extract sections from both contents
            const sectionsA = Compare.extractSections(contentA);
            const sectionsB = Compare.extractSections(contentB);

            // Generate comparison HTML
            const diffHtml = Compare.generateComparisonHTML(sectionsA, sectionsB, versionA, versionB);

            // Show result
            const parsedA = Utils.parseVersion(versionA);
            const parsedB = Utils.parseVersion(versionB);

            resultContainer.innerHTML = `
                <div class="alert alert-info">
                    Comparing version ${parsedA.displayName} with ${parsedB.displayName}
                </div>
                <div class="diff-container">${diffHtml}</div>
            `;
        } catch (error) {
            console.error('Error comparing versions:', error);
            resultContainer.innerHTML = `<div class="alert alert-danger">Error comparing versions: ${error.message}</div>`;
        } finally {
            UI.hideLoading();
        }
    },

    /**
     * Extract sections from markdown content
     * @param {string} content - Markdown content
     * @returns {Object} Sections with titles as keys and content as values
     */
    extractSections: function (content) {
        const sections = {};
        const lines = content.split('\n');

        let currentSection = 'Main';
        let currentContent = [];

        lines.forEach((line) => {
            if (line.startsWith('# ')) {
                // Save previous section
                if (currentContent.length > 0) {
                    sections[currentSection] = currentContent.join('\n');
                }

                // Start new section
                currentSection = line.substring(2).trim();
                currentContent = [line];
            } else if (line.startsWith('## ')) {
                // Save previous section
                if (currentContent.length > 0) {
                    sections[currentSection] = currentContent.join('\n');
                }

                // Start new section
                currentSection = line.substring(3).trim();
                currentContent = [line];
            } else {
                currentContent.push(line);
            }
        });

        // Save the last section
        if (currentContent.length > 0) {
            sections[currentSection] = currentContent.join('\n');
        }

        return sections;
    },

    /**
     * Generate comparison HTML
     * @param {Object} sectionsA - Sections from first version
     * @param {Object} sectionsB - Sections from second version
     * @param {string} versionA - First version
     * @param {string} versionB - Second version
     * @returns {string} HTML comparison
     */
    generateComparisonHTML: function (sectionsA, sectionsB, versionA, versionB) {
        const parsedA = Utils.parseVersion(versionA);
        const parsedB = Utils.parseVersion(versionB);

        let html = `<div class="comparison-container">`;

        // Find common sections
        const allSections = new Set([...Object.keys(sectionsA), ...Object.keys(sectionsB)]);

        // For each section, show the diff
        allSections.forEach((section) => {
            const contentA = sectionsA[section] || '';
            const contentB = sectionsB[section] || '';

            html += `<div class="comparison-section mb-4">`;
            html += `<h4 class="section-title border-bottom pb-2 mb-3">${Utils.escapeHtml(section)}</h4>`;

            if (!contentA) {
                html += `<div class="alert alert-info">Section doesn't exist in ${parsedA.displayName}</div>`;
                html += `<div class="section-content p-3 border rounded">${Render.renderMarkdown(contentB)}</div>`;
            } else if (!contentB) {
                html += `<div class="alert alert-info">Section doesn't exist in ${parsedB.displayName}</div>`;
                html += `<div class="section-content p-3 border rounded">${Render.renderMarkdown(contentA)}</div>`;
            } else if (contentA === contentB) {
                html += `<div class="alert alert-success">No differences in this section</div>`;
                html += `<div class="section-content p-3 border rounded">${Render.renderMarkdown(contentA)}</div>`;
            } else {
                // Calculate the diff
                const diff = Diff.diffLines(contentA, contentB);

                // Build the HTML for the diff
                let diffHtml = '';

                diff.forEach((part) => {
                    const value = Utils.escapeHtml(part.value);

                    if (part.added) {
                        diffHtml += `<div class="diff-added">${value}</div>`;
                    } else if (part.removed) {
                        diffHtml += `<div class="diff-removed">${value}</div>`;
                    } else {
                        diffHtml += `<div>${value}</div>`;
                    }
                });

                html += `<div class="diff-view p-3 border rounded">${diffHtml}</div>`;
            }

            html += `</div>`;
        });

        html += `</div>`;
        return html;
    },
};
