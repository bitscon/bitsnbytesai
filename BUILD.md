
# Build Notes for BitsnBytesAI

## Overview
This document provides instructions for building and deploying the BitsnBytesAI application, along with information about recent improvements to the codebase.

## Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher
- Git

## Installation

1. Clone the repository:
```bash
git clone https://github.com/bitscon/bitsnbytesai.git
cd bitsnbytesai
```

2. Install dependencies:
```bash
npm install
```

3. Update browserslist database (recommended):
```bash
npx update-browserslist-db@latest
```

## Development

Run the development server:
```bash
npm run dev
```

The application will be available at http://localhost:8080

## Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Recent Improvements

### Prompt Library Loading Fixes
The application has been updated with several improvements to fix prompt library loading issues in both user and admin dashboards:

1. **New Utility Files**:
   - `src/utils/supabase-realtime.ts`: Centralized management of Supabase real-time subscriptions
   - `src/hooks/use-error-handling.ts`: Standardized error handling across components
   - `src/hooks/use-supabase-query.ts`: Reusable query hook for Supabase operations

2. **Updated Hooks**:
   - `use-prompts.tsx`
   - `use-saved-prompts.tsx`
   - `use-admin-prompts.tsx`
   - `use-admin-prompts-list.tsx`
   - `use-admin-prompt-categories.tsx`

### Benefits of Updates
- Improved reliability with consistent error handling
- Better type safety with proper handling of optional properties
- Reduced code duplication through centralized utilities
- Enhanced maintainability with separation of concerns
- Better performance with more efficient subscription handling

## Known Issues and Future Improvements

1. **Large Chunk Sizes**: The build produces some chunks larger than 500 kB after minification. Consider:
   - Using dynamic import() to code-split the application
   - Using build.rollupOptions.output.manualChunks to improve chunking
   - Adjusting chunk size limit via build.chunkSizeWarningLimit

2. **Security Vulnerabilities**: npm audit shows some moderate severity vulnerabilities that should be addressed.

3. **Performance Optimization**:
   - Implement pagination for large datasets
   - Optimize data fetching strategies

## Deployment

The application can be deployed to any static hosting service. Simply upload the contents of the `dist` directory after building.

For Supabase configuration, ensure your environment variables are properly set up according to the production environment.
