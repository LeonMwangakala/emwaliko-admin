// Environment Configuration
interface EnvironmentConfig {
  API_BASE_URL: string;
  APP_NAME: string;
  APP_VERSION: string;
  DEBUG: boolean;
}

const normalizeApiBaseUrl = (url: string): string => {
  if (!url) {
    return url;
  }

  return url
    .replace('staging-api.kadirafiki.com', 'api.emwaliko.com')
    .replace('api.kadirafiki.com', 'api.emwaliko.com');
};

// Get environment variables or use defaults
const getEnvVar = (key: string, defaultValue: string): string => {
  const value = import.meta.env[key] || defaultValue;

  if (key === 'VITE_API_BASE_URL') {
    return normalizeApiBaseUrl(value);
  }

  return value;
};

// Environment configurations
const environments: Record<string, EnvironmentConfig> = {
  development: {
    API_BASE_URL: getEnvVar('VITE_API_BASE_URL', 'http://localhost:8000/api'),
    APP_NAME: 'eMwaliko Admin (Dev)',
    APP_VERSION: '1.0.0',
    DEBUG: true,
  },
  staging: {
    API_BASE_URL: getEnvVar('VITE_API_BASE_URL', 'https://api.emwaliko.com/api'),
    APP_NAME: 'eMwaliko Admin (Staging)',
    APP_VERSION: '1.0.0',
    DEBUG: true,
  },
  production: {
    API_BASE_URL: getEnvVar('VITE_API_BASE_URL', 'https://api.emwaliko.com/api'),
    APP_NAME: 'eMwaliko Admin',
    APP_VERSION: '1.0.0',
    DEBUG: false,
  },
};

// Get current environment
const getCurrentEnvironment = (): string => {
  return import.meta.env.MODE || 'development';
};

// Export current environment config
export const ENV_CONFIG: EnvironmentConfig = environments[getCurrentEnvironment()];

// Export environment helper
export const isDevelopment = (): boolean => getCurrentEnvironment() === 'development';
export const isProduction = (): boolean => getCurrentEnvironment() === 'production';
export const isStaging = (): boolean => getCurrentEnvironment() === 'staging';

// Log current environment (only in development)
if (isDevelopment()) {
  console.log('🌍 Environment:', getCurrentEnvironment());
  console.log('🔗 API Base URL:', ENV_CONFIG.API_BASE_URL);
} 