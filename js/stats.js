/**
 * Statistics Module
 * Handles data analysis and chart generation for changelog statistics
 */

const Stats = {
	/**
	 * Initialize statistics module
	 */
	init: function() {
		console.log('Initializing statistics module...');
		this.attachEventListeners();
	},

	/**
	 * Attach event listeners for statistics module
	 */
	attachEventListeners: function() {
		// Attach the show stats button event
		document.getElementById('btn-stats')?.addEventListener('click', this.showStatsModal.bind(this));
	},

	/**
	 * Show the statistics modal with generated charts
	 */
	showStatsModal: function() {
		console.log('Showing statistics modal');
		
		// If modal doesn't exist, create it
		if (!document.getElementById('stats-modal')) {
			this.createStatsModal();
		}
		
		// Generate and show statistics
		this.generateStatistics();
		
		// Show the modal
		const statsModal = new bootstrap.Modal(document.getElementById('stats-modal'));
		statsModal.show();
	},
	
	/**
	 * Create the statistics modal
	 */
	createStatsModal: function() {
		const modalHtml = `
		<div class="modal fade" id="stats-modal" tabindex="-1" aria-labelledby="stats-modal-label" aria-hidden="true">
			<div class="modal-dialog modal-xl">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title" id="stats-modal-label">PocketMine-MP Changelog Statistics</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<div class="row mb-4">
							<div class="col-12">
								<div class="alert alert-info">
									<i class="bi bi-info-circle me-2"></i>
									Analyzing data from ${Versions.list.length} changelog files.
								</div>
							</div>
						</div>
						
						<div class="row mb-4">
							<div class="col-md-6">
								<div class="card h-100">
									<div class="card-header">
										<h5 class="card-title mb-0">Releases by Major Version</h5>
									</div>
									<div class="card-body">
										<canvas id="releases-by-major-chart"></canvas>
									</div>
								</div>
							</div>
							<div class="col-md-6">
								<div class="card h-100">
									<div class="card-header">
										<h5 class="card-title mb-0">Release Timeline</h5>
									</div>
									<div class="card-body">
										<canvas id="release-timeline-chart"></canvas>
									</div>
								</div>
							</div>
						</div>
						
						<div class="row mb-4">
							<div class="col-md-6">
								<div class="card h-100">
									<div class="card-header">
										<h5 class="card-title mb-0">Changes by Category</h5>
									</div>
									<div class="card-body">
										<canvas id="changes-by-category-chart"></canvas>
									</div>
								</div>
							</div>
							<div class="col-md-6">
								<div class="card h-100">
									<div class="card-header">
										<h5 class="card-title mb-0">Change Types</h5>
									</div>
									<div class="card-body">
										<canvas id="change-types-chart"></canvas>
									</div>
								</div>
							</div>
						</div>
						
						<div class="row">
							<div class="col-12">
								<div class="card">
									<div class="card-header">
										<h5 class="card-title mb-0">Version Stats</h5>
									</div>
									<div class="card-body">
										<div id="version-stats-table-container" class="table-responsive">
											<table id="version-stats-table" class="table table-striped">
												<thead>
													<tr>
														<th>Version</th>
														<th>Release Date</th>
														<th>Changes</th>
														<th>Major Categories</th>
													</tr>
												</thead>
												<tbody>
													<!-- Will be filled dynamically -->
												</tbody>
											</table>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			</div>
		</div>`;
		
		const modalContainer = document.createElement('div');
		modalContainer.innerHTML = modalHtml;
		document.body.appendChild(modalContainer);
	},
	
	/**
	 * Generate statistics and charts
	 */
	generateStatistics: async function() {
		UI.showLoading('Analyzing changelogs...');
		
		try {
			// Load all changelogs if they're not already loaded
			await this.loadAllChangelogs();
			
			// Parse and analyze the changelogs
			const statsData = this.analyzeChangelogs();
			
			// Generate and render charts
			this.renderCharts(statsData);
			
			// Generate the version stats table
			this.generateVersionStatsTable(statsData);
			
			UI.hideLoading();
		} catch (error) {
			console.error('Error generating statistics:', error);
			UI.showError('Failed to generate statistics.');
			UI.hideLoading();
		}
	},
	
	/**
	 * Load all changelogs for analysis
	 */
	loadAllChangelogs: async function() {
		const unloadedVersions = Versions.list.filter(version => !Versions.cache[version]);
		
		if (unloadedVersions.length === 0) {
			return; // All changelogs are already loaded
		}
		
		UI.showLoading(`Loading ${unloadedVersions.length} changelog files...`);
		
		// Load changelogs in batches to avoid too many simultaneous requests
		const batchSize = 5;
		for (let i = 0; i < unloadedVersions.length; i += batchSize) {
			const batch = unloadedVersions.slice(i, i + batchSize);
			await Promise.all(batch.map(async (version) => {
				try {
					const response = await fetch(`${CONFIG.changelogPath}${version}`);
					if (!response.ok) throw new Error(`Failed to fetch ${version}`);
					
					const content = await response.text();
					Versions.cache[version] = content;
				} catch (error) {
					console.error(`Error loading version ${version}:`, error);
				}
			}));
			
			// Update loading progress
			const progress = Math.min(100, Math.round((i + batch.length) / unloadedVersions.length * 100));
			UI.showLoading(`Loading changelogs... ${progress}%`, progress);
		}
	},
	
	/**
	 * Analyze changelog data to generate statistics
	 * @returns {Object} Statistics data
	 */
	analyzeChangelogs: function() {
		console.log('Analyzing changelog data...');
		
		const stats = {
			// Releases by major version
			releasesByMajor: {},
			
			// Release timeline data
			releaseTimeline: [],
			
			// Changes by category
			changesByCategory: {},
			
			// Change types (added, fixed, removed, changed)
			changeTypes: {
				added: 0,
				fixed: 0,
				removed: 0,
				changed: 0,
				other: 0
			},
			
			// Version stats for table
			versionStats: []
		};
		
		// Analyze each version
		Versions.list.forEach(version => {
			const parsedVersion = Utils.parseVersion(version);
			const content = Versions.cache[version];
			
			if (!content) {
				console.warn(`No content found for version ${version}`);
				return;
			}
			
			// Count by major version
			const majorVersion = parsedVersion.major.toString();
			stats.releasesByMajor[majorVersion] = (stats.releasesByMajor[majorVersion] || 0) + 1;
			
			// Extract release date if available
			const releaseDate = this.extractReleaseDate(content);
			
			// Parse sections and counts
			const sections = Render.extractSections(content);
			
			// Count changes by category
			let totalChanges = 0;
			let topCategories = [];
			
			for (const [category, sectionContent] of Object.entries(sections)) {
				// Skip the title/main section
				if (category === 'General') continue;
				
				// Count lines that start with "-" as change entries
				const changeLines = sectionContent.split('\n').filter(line => line.trim().startsWith('-'));
				const changeCount = changeLines.length;
				totalChanges += changeCount;
				
				// Add to categories count
				if (changeCount > 0) {
					stats.changesByCategory[category] = (stats.changesByCategory[category] || 0) + changeCount;
					topCategories.push({ category, count: changeCount });
				}
				
				// Count change types
				changeLines.forEach(line => {
					const normalizedLine = line.toLowerCase();
					if (normalizedLine.includes('add') || normalizedLine.includes('new') || normalizedLine.includes('support')) {
						stats.changeTypes.added++;
					} else if (normalizedLine.includes('fix') || normalizedLine.includes('bug')) {
						stats.changeTypes.fixed++;
					} else if (normalizedLine.includes('remov') || normalizedLine.includes('deprecat')) {
						stats.changeTypes.removed++;
					} else if (normalizedLine.includes('chang') || normalizedLine.includes('updat') || normalizedLine.includes('improv')) {
						stats.changeTypes.changed++;
					} else {
						stats.changeTypes.other++;
					}
				});
			}
			
			// Sort categories by count and take top 3
			topCategories.sort((a, b) => b.count - a.count);
			const topCategoriesText = topCategories.slice(0, 3).map(c => `${c.category} (${c.count})`).join(', ');
			
			// Add to timeline if we have a date
			if (releaseDate) {
				stats.releaseTimeline.push({
					version: parsedVersion.displayName,
					date: releaseDate,
					changes: totalChanges
				});
			}
			
			// Add to version stats
			stats.versionStats.push({
				version: parsedVersion.displayName,
				fullVersion: version,
				date: releaseDate || 'Unknown',
				changes: totalChanges,
				topCategories: topCategoriesText || 'None'
			});
		});
		
		// Sort timeline by date
		stats.releaseTimeline.sort((a, b) => new Date(a.date) - new Date(b.date));
		
		// Sort version stats by version (descending)
		stats.versionStats.sort((a, b) => {
			const parsedA = Utils.parseVersion(a.fullVersion);
			const parsedB = Utils.parseVersion(b.fullVersion);
			return Utils.compareVersions(parsedA, parsedB);
		});
		
		console.log('Stats data:', stats);
		return stats;
	},
	
	/**
	 * Extract release date from changelog content
	 * @param {string} content - Changelog content
	 * @returns {string|null} Release date or null if not found
	 */
	extractReleaseDate: function(content) {
		// Look for patterns like "Released 12th December 2021."
		const releaseDateRegex = /Released\s+(\d+(?:st|nd|rd|th)?\s+\w+\s+\d{4})/i;
		const match = content.match(releaseDateRegex);
		
		if (match && match[1]) {
			return match[1];
		}
		
		// Look for alternative patterns like "Released yyyy-mm-dd"
		const isoDateRegex = /Released\s+(\d{4}-\d{2}-\d{2})/i;
		const isoMatch = content.match(isoDateRegex);
		
		if (isoMatch && isoMatch[1]) {
			return isoMatch[1];
		}
		
		// Try to find any date-like format near "released"
		const simpleRegex = /Released[^.]*?(\d{1,2}[\s/-]\w+[\s/-]\d{4}|\d{4}[\s/-]\d{1,2}[\s/-]\d{1,2})/i;
		const simpleMatch = content.match(simpleRegex);
		
		if (simpleMatch && simpleMatch[1]) {
			return simpleMatch[1];
		}
		
		return null;
	},
	
	/**
	 * Render charts with the analyzed data
	 * @param {Object} statsData - Statistics data
	 */
	renderCharts: function(statsData) {
		// Clear any existing charts
		Chart.helpers.each(Chart.instances, (instance) => {
			instance.destroy();
		});
		
		// 1. Releases by Major Version chart
		this.renderReleasesByMajorChart(statsData.releasesByMajor);
		
		// 2. Release Timeline chart
		this.renderReleaseTimelineChart(statsData.releaseTimeline);
		
		// 3. Changes by Category chart
		this.renderChangesByCategoryChart(statsData.changesByCategory);
		
		// 4. Change Types chart
		this.renderChangeTypesChart(statsData.changeTypes);
	},
	
	/**
	 * Render releases by major version chart
	 * @param {Object} data - Major version data
	 */
	renderReleasesByMajorChart: function(data) {
		const ctx = document.getElementById('releases-by-major-chart').getContext('2d');
		
		const labels = Object.keys(data).sort((a, b) => parseInt(a) - parseInt(b));
		const values = labels.map(key => data[key]);
		
		new Chart(ctx, {
			type: 'bar',
			data: {
				labels: labels.map(l => `Version ${l}.x`),
				datasets: [{
					label: 'Number of Releases',
					data: values,
					backgroundColor: [
						'rgba(54, 162, 235, 0.7)',
						'rgba(75, 192, 192, 0.7)',
						'rgba(255, 206, 86, 0.7)',
						'rgba(153, 102, 255, 0.7)'
					],
					borderColor: [
						'rgba(54, 162, 235, 1)',
						'rgba(75, 192, 192, 1)',
						'rgba(255, 206, 86, 1)',
						'rgba(153, 102, 255, 1)'
					],
					borderWidth: 1
				}]
			},
			options: {
				responsive: true,
				plugins: {
					title: {
						display: true,
						text: 'Releases by Major Version'
					},
					legend: {
						display: false
					},
					tooltip: {
						callbacks: {
							label: function(context) {
								return `${context.parsed.y} releases`;
							}
						}
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							precision: 0
						}
					}
				}
			}
		});
	},
	
	/**
	 * Render release timeline chart
	 * @param {Array} data - Timeline data
	 */
	renderReleaseTimelineChart: function(data) {
		if (data.length === 0) {
			document.getElementById('release-timeline-chart').parentNode.innerHTML = 
				'<div class="alert alert-warning">Not enough release date information available.</div>';
			return;
		}
		
		const ctx = document.getElementById('release-timeline-chart').getContext('2d');
		
		// Prepare data by quarters
		// Group releases by year-quarter
		const timeData = {};
		const validData = [];
		
		data.forEach(item => {
			try {
				// Try to normalize the date format first
				let normalizedDate = item.date;
				let date;
				
				// Check if date is already in ISO format
				if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
					date = new Date(normalizedDate);
				} else {
					// Handle formats like "12th December 2021"
					normalizedDate = normalizedDate
						.replace(/(\d+)(st|nd|rd|th)/, '$1') // Remove ordinals
						.replace(/\s+/g, ' ')
						.trim();
					
					// Try parsing with various date formats
					date = new Date(normalizedDate);
					
					// If date is invalid, try alternative formats
					if (isNaN(date.getTime())) {
						// Try to extract components
						const parts = normalizedDate.split(/[\s/-]+/);
						if (parts.length >= 3) {
							// Try different combinations
							const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
							
							// Check if one part is a month name
							for (let i = 0; i < parts.length; i++) {
								const monthIndex = monthNames.findIndex(m => parts[i].toLowerCase().includes(m));
								if (monthIndex !== -1) {
									// Found month name
									const day = parseInt(parts[i-1] || parts[i+1]);
									const year = parts.find(p => p.length === 4 && /^\d{4}$/.test(p));
									
									if (day && year) {
										date = new Date(year, monthIndex, day);
										break;
									}
								}
							}
						}
					}
				}
				
				// Skip invalid dates
				if (isNaN(date.getTime())) {
					console.warn('Invalid date:', item.date);
					return;
				}
				
				validData.push({...item, parsedDate: date});
				
				const year = date.getFullYear();
				const quarter = Math.floor(date.getMonth() / 3) + 1;
				const key = `${year} Q${quarter}`;
				
				if (!timeData[key]) {
					timeData[key] = { count: 0, changes: 0 };
				}
				
				timeData[key].count++;
				timeData[key].changes += item.changes;
			} catch (error) {
				console.error('Error parsing date:', item.date, error);
			}
		});
		
		// Sort keys chronologically
		const sortedKeys = Object.keys(timeData).sort((a, b) => {
			const [yearA, quarterA] = a.split(' Q');
			const [yearB, quarterB] = b.split(' Q');
			return (parseInt(yearA) - parseInt(yearB)) || (parseInt(quarterA) - parseInt(quarterB));
		});
		
		// If we have no valid data, show an error
		if (sortedKeys.length === 0) {
			document.getElementById('release-timeline-chart').parentNode.innerHTML = 
				'<div class="alert alert-warning">Could not parse release dates from the changelog files. Timeline cannot be generated.</div>';
			return;
		}
		
		new Chart(ctx, {
			type: 'line',
			data: {
				labels: sortedKeys,
				datasets: [
					{
						label: 'Number of Releases',
						data: sortedKeys.map(key => timeData[key].count),
						borderColor: 'rgba(54, 162, 235, 1)',
						backgroundColor: 'rgba(54, 162, 235, 0.1)',
						borderWidth: 2,
						fill: false,
						tension: 0.1,
						yAxisID: 'y'
					},
					{
						label: 'Number of Changes',
						data: sortedKeys.map(key => timeData[key].changes),
						borderColor: 'rgba(255, 99, 132, 1)',
						backgroundColor: 'rgba(255, 99, 132, 0.1)',
						borderWidth: 2,
						fill: false,
						tension: 0.1,
						yAxisID: 'y1'
					}
				]
			},
			options: {
				responsive: true,
				plugins: {
					title: {
						display: true,
						text: 'Release Timeline'
					},
					tooltip: {
						mode: 'index',
						intersect: false
					}
				},
				scales: {
					y: {
						type: 'linear',
						display: true,
						position: 'left',
						title: {
							display: true,
							text: 'Releases'
						},
						beginAtZero: true,
						ticks: {
							precision: 0
						}
					},
					y1: {
						type: 'linear',
						display: true,
						position: 'right',
						title: {
							display: true,
							text: 'Changes'
						},
						beginAtZero: true,
						ticks: {
							precision: 0
						},
						grid: {
							drawOnChartArea: false
						}
					}
				}
			}
		});
	},
	
	/**
	 * Render changes by category chart
	 * @param {Object} data - Category data
	 */
	renderChangesByCategoryChart: function(data) {
		const ctx = document.getElementById('changes-by-category-chart').getContext('2d');
		
		// Sort categories by count (descending)
		const sortedCategories = Object.entries(data)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10); // Take top 10
		
		const labels = sortedCategories.map(([category]) => category);
		const values = sortedCategories.map(([, count]) => count);
		
		new Chart(ctx, {
			type: 'doughnut',
			data: {
				labels: labels,
				datasets: [{
					data: values,
					backgroundColor: [
						'rgba(54, 162, 235, 0.7)',
						'rgba(255, 99, 132, 0.7)',
						'rgba(255, 206, 86, 0.7)',
						'rgba(75, 192, 192, 0.7)',
						'rgba(153, 102, 255, 0.7)',
						'rgba(255, 159, 64, 0.7)',
						'rgba(201, 203, 207, 0.7)',
						'rgba(59, 143, 77, 0.7)',
						'rgba(139, 69, 19, 0.7)',
						'rgba(204, 0, 204, 0.7)'
					],
					borderWidth: 1
				}]
			},
			options: {
				responsive: true,
				plugins: {
					title: {
						display: true,
						text: 'Top 10 Change Categories'
					},
					tooltip: {
						callbacks: {
							label: function(context) {
								const label = context.label || '';
								const value = context.parsed || 0;
								const total = context.dataset.data.reduce((a, b) => a + b, 0);
								const percentage = Math.round((value / total) * 100);
								return `${label}: ${value} changes (${percentage}%)`;
							}
						}
					}
				}
			}
		});
	},
	
	/**
	 * Render change types chart
	 * @param {Object} data - Change types data
	 */
	renderChangeTypesChart: function(data) {
		const ctx = document.getElementById('change-types-chart').getContext('2d');
		
		const labels = ['Added/New', 'Fixed/Bugs', 'Removed/Deprecated', 'Changed/Updated', 'Other'];
		const values = [data.added, data.fixed, data.removed, data.changed, data.other];
		
		new Chart(ctx, {
			type: 'pie',
			data: {
				labels: labels,
				datasets: [{
					data: values,
					backgroundColor: [
						'rgba(75, 192, 192, 0.7)',
						'rgba(54, 162, 235, 0.7)',
						'rgba(255, 99, 132, 0.7)',
						'rgba(255, 206, 86, 0.7)',
						'rgba(153, 102, 255, 0.7)'
					],
					borderWidth: 1
				}]
			},
			options: {
				responsive: true,
				plugins: {
					title: {
						display: true,
						text: 'Types of Changes'
					},
					tooltip: {
						callbacks: {
							label: function(context) {
								const label = context.label || '';
								const value = context.parsed || 0;
								const total = context.dataset.data.reduce((a, b) => a + b, 0);
								const percentage = Math.round((value / total) * 100);
								return `${label}: ${value} (${percentage}%)`;
							}
						}
					}
				}
			}
		});
	},
	
	/**
	 * Generate version stats table
	 * @param {Object} statsData - Statistics data
	 */
	generateVersionStatsTable: function(statsData) {
		const tableBody = document.querySelector('#version-stats-table tbody');
		if (!tableBody) return;
		
		tableBody.innerHTML = '';
		
		statsData.versionStats.forEach(stat => {
			const row = document.createElement('tr');
			
			// Version with link
			const versionCell = document.createElement('td');
			const versionLink = document.createElement('a');
			versionLink.href = `?version=${stat.fullVersion}`;
			versionLink.textContent = stat.version;
			versionLink.classList.add('version-link');
			versionLink.addEventListener('click', (e) => {
				e.preventDefault();
				Versions.loadVersion(stat.fullVersion);
				bootstrap.Modal.getInstance(document.getElementById('stats-modal')).hide();
			});
			versionCell.appendChild(versionLink);
			
			// Create other cells
			const dateCell = document.createElement('td');
			dateCell.textContent = stat.date;
			
			const changesCell = document.createElement('td');
			changesCell.textContent = stat.changes;
			
			const categoriesCell = document.createElement('td');
			categoriesCell.textContent = stat.topCategories;
			
			// Add cells to row
			row.appendChild(versionCell);
			row.appendChild(dateCell);
			row.appendChild(changesCell);
			row.appendChild(categoriesCell);
			
			// Add row to table
			tableBody.appendChild(row);
		});
	}
}; 