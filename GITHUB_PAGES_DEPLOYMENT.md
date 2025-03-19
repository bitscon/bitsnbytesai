# GitHub Pages Deployment Guide

## Overview
This document provides instructions for deploying the BitsnBytesAI application to GitHub Pages using GitHub Actions for automated deployment.

## Configuration Changes Made

### 1. Vite Configuration
Updated `vite.config.ts` to include the base path for GitHub Pages:
```js
export default defineConfig({
  // Base path for GitHub Pages deployment - repository name
  base: '/bitsnbytesai/',
  // ... other configuration
})
```

### 2. Package.json Updates
Added the following to `package.json`:
- Homepage field: `"homepage": "https://bitscon.github.io/bitsnbytesai/"`
- Deployment scripts:
  ```json
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
  ```
- Added gh-pages as a dev dependency

### 3. GitHub Actions Workflow
Created `.github/workflows/deploy.yml` with the following configuration:
- Triggers: Push to main branch or manual workflow dispatch
- Jobs:
  - Build: Checkout code, setup Node.js, install dependencies, build the app, and upload artifacts
  - Deploy: Deploy the built artifacts to GitHub Pages

## Manual Deployment Steps
If you need to deploy manually without GitHub Actions:

1. Make sure all changes are committed and pushed to the repository
2. Run the following commands:
   ```bash
   npm run build
   npm run deploy
   ```

## GitHub Pages Setup Requirements

For the GitHub Actions workflow to work properly, you need to:

1. Go to your GitHub repository settings
2. Navigate to "Pages" in the sidebar
3. Under "Build and deployment", select:
   - Source: "GitHub Actions"
4. Make sure the repository has the following permissions enabled:
   - Settings → Actions → General → Workflow permissions:
     - Allow GitHub Actions to create and approve pull requests
   - Settings → Pages → Build and deployment:
     - Source: GitHub Actions

## Troubleshooting

If you encounter issues with the deployment:

1. Check the GitHub Actions logs for any build or deployment errors
2. Verify that the base path in `vite.config.ts` matches your repository name
3. Ensure that the GitHub Pages source is set to GitHub Actions
4. Check that the workflow has the necessary permissions to deploy

## Notes on Client-Side Routing

Since this is a single-page application using client-side routing:

1. GitHub Pages doesn't natively support client-side routing
2. Direct access to routes like `https://bitscon.github.io/bitsnbytesai/dashboard` will result in a 404 error
3. To fix this, you can either:
   - Use hash-based routing (`/#/dashboard` instead of `/dashboard`)
   - Add a custom 404.html page that redirects to the main index.html with the requested path

## Future Improvements

Consider the following improvements for the deployment process:

1. Add environment-specific configuration for development vs. production
2. Implement a custom domain if needed
3. Add build caching to speed up the GitHub Actions workflow
4. Implement preview deployments for pull requests
