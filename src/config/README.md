# API Configuration System

This directory contains the centralized API configuration for the eMwaliko Admin application.

## Files

### `api.ts`
Contains all API endpoints and configuration:
- `API_CONFIG`: Base URL and timeout settings
- `API_ENDPOINTS`: All API endpoints organized by resource
- `buildApiUrl()`: Helper function to build URLs with query parameters

### `environment.ts`
Environment-specific configuration:
- Environment detection (development, staging, production)
- Environment variables management
- Default configurations for each environment

## Usage

### Basic API Call
```typescript
import { apiService } from '../services/api';

// Get customers with pagination
const customers = await apiService.getCustomers(1, 15);
```

### Using Endpoints Directly
```typescript
import { API_ENDPOINTS, buildApiUrl } from './config/api';

// Build URL with parameters
const url = buildApiUrl(API_ENDPOINTS.CUSTOMERS.LIST, {
  page: 1,
  per_page: 15
});
```

### Environment Configuration
```typescript
import { ENV_CONFIG, isDevelopment } from './config/environment';

console.log(ENV_CONFIG.API_BASE_URL); // Current API base URL
console.log(isDevelopment()); // Check if in development mode
```

## Environment Variables

Create a `.env` file in the project root with:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api

# App Configuration
VITE_APP_NAME=eMwaliko Admin
VITE_APP_VERSION=1.0.0

# Development Configuration
VITE_DEBUG=true
```

## Benefits

1. **Centralized Management**: All API endpoints in one place
2. **Environment Support**: Easy switching between dev/staging/prod
3. **Type Safety**: TypeScript support for all endpoints
4. **Maintainability**: Easy to update URLs and add new endpoints
5. **Consistency**: Standardized URL building across the app 