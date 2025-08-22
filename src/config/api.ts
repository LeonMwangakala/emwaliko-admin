import { ENV_CONFIG } from './environment';

// API Configuration
export const API_CONFIG = {
  BASE_URL: ENV_CONFIG.API_BASE_URL,
  TIMEOUT: 30000, // 30 seconds
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/login',
    LOGOUT: '/logout',
    USER: '/user',
  },

  // Profile
  PROFILE: {
    SHOW: '/profile',
    UPDATE: '/profile',
    UPDATE_PICTURE: '/profile/picture',
  },

  // Users
  USERS: {
    SCANNERS: '/users/scanners',
  },

  // Scanners
  SCANNERS: {
    AVAILABLE: '/scanners/available',
    EVENT_SCANNERS: (eventId: number) => `/events/${eventId}/scanners`,
    ASSIGN: (eventId: number) => `/events/${eventId}/scanners`,
    UPDATE_ROLE: (eventId: number, scannerId: number) => `/events/${eventId}/scanners/${scannerId}/role`,
    DEACTIVATE: (eventId: number, scannerId: number) => `/events/${eventId}/scanners/${scannerId}/deactivate`,
    REACTIVATE: (eventId: number, scannerId: number) => `/events/${eventId}/scanners/${scannerId}/reactivate`,
  },

  // Customers
  CUSTOMERS: {
    LIST: '/customers',
    CREATE: '/customers',
    SHOW: (id: number) => `/customers/${id}`,
    UPDATE: (id: number) => `/customers/${id}`,
    DELETE: (id: number) => `/customers/${id}`,
    TOGGLE_STATUS: (id: number) => `/customers/${id}/toggle-status`,
    ACTIVATE: (id: number) => `/customers/${id}/activate`,
    DEACTIVATE: (id: number) => `/customers/${id}/deactivate`,
  },

  // Events
  EVENTS: {
    LIST: '/events',
    CREATE: '/events',
    SHOW: (id: number) => `/events/${id}`,
    SHOW_BY_CODE: (eventCode: string) => `/events/code/${eventCode}`,
    UPDATE: (id: number) => `/events/${id}`,
    DELETE: (id: number) => `/events/${id}`,
    OPTIONS: (id: number) => `/events/${id}/options`,
    UPDATE_STATUS: (id: number) => `/events/${id}/status`,
  },

  // Guests
  GUESTS: {
    LIST: '/guests',
    CREATE: '/guests',
    SHOW: (id: number) => `/guests/${id}`,
    UPDATE: (id: number) => `/guests/${id}`,
    DELETE: (id: number) => `/guests/${id}`,
    EVENT_GUESTS: (eventId: number) => `/events/${eventId}/guests`,
    BULK_CREATE: (eventId: number) => `/events/${eventId}/guests/bulk`,
    INVITE: (inviteCode: string) => `/guests/invite/${inviteCode}`,
    RSVP: (inviteCode: string) => `/guests/${inviteCode}/rsvp`,
  },

  // Event Types
  EVENT_TYPES: {
    LIST: '/event-types',
    CREATE: '/event-types',
    UPDATE: (id: number) => `/event-types/${id}`,
    TOGGLE_STATUS: (id: number) => `/event-types/${id}/toggle-status`,
  },

  // Card Types
  CARD_TYPES: {
    LIST: '/card-types',
    CREATE: '/card-types',
    UPDATE: (id: number) => `/card-types/${id}`,
    TOGGLE_STATUS: (id: number) => `/card-types/${id}/toggle-status`,
  },

  // Card Classes
  CARD_CLASSES: {
    LIST: '/card-classes',
    CREATE: '/card-classes',
    UPDATE: (id: number) => `/card-classes/${id}`,
    TOGGLE_STATUS: (id: number) => `/card-classes/${id}/toggle-status`,
  },

  // Packages
  PACKAGES: {
    LIST: '/packages',
    CREATE: '/packages',
    UPDATE: (id: number) => `/packages/${id}`,
    TOGGLE_STATUS: (id: number) => `/packages/${id}/toggle-status`,
  },

  // Locations
  LOCATIONS: {
    COUNTRIES: '/countries',
    REGIONS: (countryId: number) => `/regions/${countryId}`,
    DISTRICTS: (regionId: number) => `/districts/${regionId}`,
    ALL: '/locations',
  },
};

// Helper function to build full URL
export const buildApiUrl = (endpoint: string, params?: Record<string, string | number>): string => {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, value.toString());
    });
    url += `?${searchParams.toString()}`;
  }
  
  return url;
}; 