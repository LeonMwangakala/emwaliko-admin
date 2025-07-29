# Environment Setup Guide

## Overview

This project now supports multiple environments to easily switch between development, staging, and production APIs without manually changing the base URL.

## Quick Start

### For Local Development (Default)
```bash
npm run dev
# or
npm run dev:local
```

### For Testing with Staging API
```bash
npm run dev:staging
```

### For Testing with Production API
```bash
npm run dev:prod
```

## Environment Files

The following environment files have been created:

- `.env.development` - Points to `http://localhost:8000/api`
- `.env.staging` - Points to `https://staging-api.kadirafiki.com/api`
- `.env.production` - Points to `https://api.kadirafiki.com/api`

## Available Commands

### Development Commands
```bash
npm run dev:local      # Development with local API
npm run dev:staging    # Development with staging API
npm run dev:prod       # Development with production API
```

### Build Commands
```bash
npm run build:dev      # Build for development
npm run build:staging  # Build for staging
npm run build:prod     # Build for production
```

### Preview Commands
```bash
npm run preview:dev    # Preview development build
npm run preview:staging # Preview staging build
npm run preview:prod   # Preview production build
```

## Environment Detection

The application automatically detects the current environment and:
- Shows the environment name in the browser console (development only)
- Displays the current API base URL
- Uses appropriate configuration for each environment

## Visual Indicators

- **Development**: App title shows "KadiRafiki Admin (Dev)"
- **Staging**: App title shows "KadiRafiki Admin (Staging)"
- **Production**: App title shows "KadiRafiki Admin"

## Troubleshooting

### If environment variables aren't loading:
1. Make sure you're using the correct npm command
2. Check that the `.env` files exist in the project root
3. Restart the development server

### To verify current environment:
1. Open browser developer tools
2. Check the console for environment logs
3. Look for the API base URL in the logs

## Deployment

When deploying to production:
1. Use `npm run build:prod` to build for production
2. The built files will use the production API URL
3. No manual configuration changes needed

## Benefits

✅ **No more manual URL changes**  
✅ **Easy switching between environments**  
✅ **Environment-specific configurations**  
✅ **Clear visual indicators**  
✅ **Automatic environment detection**  
✅ **Deployment-ready setup** 