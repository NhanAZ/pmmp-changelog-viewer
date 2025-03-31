# PocketMine-MP Changelog Viewer

A modern, responsive web application for viewing and searching PocketMine-MP changelogs. Built for GitHub Pages.

> **DEVELOPMENT NOTICE:** This project is currently under development and has not been officially released. Features may be incomplete or subject to change.

## Features

- 📱 Responsive design for desktop and mobile
- 🔍 Advanced search capabilities with filter options
- 📈 Loading progress bar with status updates
- 🔄 Expandable/collapsible version groups
- 📋 Search history
- 🔗 Shareable links via URL parameters

## How to Use

1. Browse the version list to find a specific changelog
2. Use the search functionality to find specific changes across all versions
3. Filter search results for easier navigation
4. Use the URL parameters to share specific versions or search results

## Live Demo

Visit [https://nhanaz.github.io/pmmp-changelog-viewer/](https://nhanaz.github.io/pmmp-changelog-viewer/) to see the application in action.

## About This Project

A small contribution from Vietnam 🇻🇳 to make PocketMine-MP changelogs more accessible to the community.

Contributions, suggestions, and feedback are always welcome! Feel free to:
- Open an issue if you find a bug or have a feature request
- Submit a pull request to contribute code
- Star the repository if you find it useful

## Development

This is a pure static web application designed to be hosted on GitHub Pages. It uses modern JavaScript with modular design.

### Structure

- `index.html` - Main HTML file
- `css/` - CSS stylesheets
- `js/` - JavaScript modules
  - `app.js` - Application entry point
  - `config.js` - Configuration variables
  - `utils.js` - Utility functions
  - `storage.js` - Local storage management
  - `ui.js` - UI interactions
  - `search.js` - Search functionality
  - `versions.js` - Version management
  - `render.js` - Markdown rendering
- `changelogs/` - Changelog markdown files
  - `versions.json` - List of available versions

### Local Development

1. Clone the repository
2. Open the project folder
3. Run a local server (or use browser-sync)
4. Open in your browser (typically http://localhost:3000)

Using browser-sync (if installed):

```
npm install
npm start
```

**Security Note**: The current version of browser-sync includes a dependency (eazy-logger) with a prototype pollution vulnerability (CVE-2024-57075). This is a development dependency only and doesn't affect the deployed application. Consider using an alternative local server for development if security is a concern.

### Adding New Changelogs

1. Add your markdown changelog file to the `changelogs/` directory
2. Update `changelogs/versions.json` to include the new file

### Automated Changelog Updates

The repository includes a GitHub Action that automatically updates changelogs from the official PocketMine-MP repository:

- Updates run daily at 00:00 UTC automatically
- Can be manually triggered from the GitHub Actions tab
- Fetches all changelog files from the PocketMine-MP stable branch
- Copies new changelog files to the `changelogs/` directory
- Automatically updates the `versions.json` file
- Commits and pushes changes if any updates are found
- Automatically deploys to GitHub Pages

## Deployment

To deploy to GitHub Pages:

1. Push your changes to the repository
2. GitHub Actions will automatically build and deploy to GitHub Pages

## Technologies Used

- HTML5, CSS3, JavaScript
- Bootstrap 5 for UI components
- Marked.js for Markdown parsing
- highlight.js for code syntax highlighting
- browser-sync for local development

## Browser Support

The application supports all modern browsers:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is licensed under the MIT License - see the LICENSE file for details. 