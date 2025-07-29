# KadiRafiki Admin Dashboard

A modern React-based admin dashboard for the KadiRafiki event management system.

## Environment Configuration

This project supports multiple environments for development, staging, and production. The API base URL is automatically configured based on the environment.

### Available Environments

- **Development**: `http://localhost:8000/api` (for local development)
- **Staging**: `https://staging-api.kadirafiki.com/api` (for testing)
- **Production**: `https://api.kadirafiki.com/api` (for live deployment)

### Running the Application

#### Development (Local)
```bash
npm run dev:local
# or
npm run dev
```

#### Development (Staging API)
```bash
npm run dev:staging
```

#### Development (Production API)
```bash
npm run dev:prod
```

#### Building for Different Environments

```bash
# Build for development
npm run build:dev

# Build for staging
npm run build:staging

# Build for production
npm run build:prod
```

#### Preview Built Application

```bash
# Preview development build
npm run preview:dev

# Preview staging build
npm run preview:staging

# Preview production build
npm run preview:prod
```

### Environment Files

The project uses the following environment files:
- `.env.development` - Development environment (localhost)
- `.env.staging` - Staging environment
- `.env.production` - Production environment

These files contain the `VITE_API_BASE_URL` variable that determines which API endpoint the application connects to.

### Switching Environments

To switch between environments without changing code:

1. **For Development**: Use `npm run dev:local` (default)
2. **For Testing with Staging API**: Use `npm run dev:staging`
3. **For Testing with Production API**: Use `npm run dev:prod`

The environment will be logged to the console when running in development mode, showing the current environment and API base URL.
