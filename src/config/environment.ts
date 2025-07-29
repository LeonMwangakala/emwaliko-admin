// Environment Configuration
interface EnvironmentConfig {
  API_BASE_URL: string;
  APP_NAME: string;
  APP_VERSION: string;
  DEBUG: boolean;
}

// Get environment variables or use defaults
const getEnvVar = (key: string, defaultValue: string): string => {
  return import.meta.env[key] || defaultValue;
};

// Environment configurations
const environments: Record<string, EnvironmentConfig> = {
  development: {
    API_BASE_URL: getEnvVar('VITE_API_BASE_URL', 'http://localhost:8000/api'),
    APP_NAME: 'KadiRafiki Admin',
    APP_VERSION: '1.0.0',
    DEBUG: true,
  },
  staging: {
    API_BASE_URL: getEnvVar('VITE_API_BASE_URL', 'https://staging-api.kadirafiki.com/api'),
    APP_NAME: 'KadiRafiki Admin',
    APP_VERSION: '1.0.0',
    DEBUG: true,
  },
  production: {
    API_BASE_URL: getEnvVar('VITE_API_BASE_URL', 'https://api.kadirafiki.com/api'),
    APP_NAME: 'KadiRafiki Admin',
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