# Contributing to Salesforce Org Browser

Thank you for your interest in contributing to the Salesforce Org Browser! This document provides guidelines for contributing to the project.

## Getting Started

### Prerequisites

- Node.js 18+
- Salesforce CLI (sf)
- A Salesforce org for testing

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/org-browser.git
   cd org-browser
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up a test Salesforce org:
   ```bash
   sf org login web
   sf config set target-org your-test-org-alias
   ```

## Development Workflow

### Running the Application

```bash
# Start the TUI
npm start

# Or use the script directly
./scripts/org-browser tui

# Fast mode for development
./scripts/org-browser tui --fast
```

### Code Style

- Use ES6+ features
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Use JSDoc for function documentation

### Adding New Metadata Types

To add support for a new metadata type:

1. Update `src/config/metadata-types.js`:
   ```javascript
   NewMetadataType: {
     displayName: 'New Metadata',
     icon: '🔧',
     description: 'Description of the metadata type',
     exportType: 'NewMetadataType',
     tuiValue: 'new-metadata',
     listMethod: 'getNewMetadata',
     detailMethod: 'getNewMetadataDetails'
   }
   ```

2. Add the corresponding methods to `src/salesforce.js`:
   ```javascript
   async getNewMetadata() {
     return await this.getMetadataList('NewMetadataType');
   }

   async getNewMetadataDetails(metadataName) {
     try {
       const [metadata] = await this.getMetadata('NewMetadataType', [metadataName]);
       return metadata;
     } catch (error) {
       console.error(`Error fetching new metadata ${metadataName}:`, error.message);
       return null;
     }
   }
   ```

3. Update the TUI menu options (automatically handled by the configuration)

### Testing

- Test with different Salesforce org types (Production, Sandbox, Developer)
- Test with various metadata types
- Test error scenarios (no connection, invalid org, etc.)
- Test the fast mode feature

## Pull Request Process

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them:
   ```bash
   git add .
   git commit -m "feat: add support for new metadata type"
   ```

3. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a Pull Request with:
   - Clear description of the changes
   - Screenshots if UI changes are involved
   - Test cases covered

### Commit Message Format

Use conventional commit format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

## Issues

When reporting issues, please include:
- Operating system and Node.js version
- Salesforce CLI version
- Steps to reproduce
- Expected vs actual behavior
- Error messages (if any)

## Questions?

Feel free to open an issue for questions or discussions about the project.

Thank you for contributing! 🚀
