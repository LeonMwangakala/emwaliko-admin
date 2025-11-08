import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { apiService, LoginCredentials, LoginResponse } from '../services/api';

type User = LoginResponse['user'];

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isScanner: boolean;
  resetInactivityTimer: () => void;
  showAutoLogoutModal: boolean;
  onStayLoggedIn: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAutoLogoutModal, setShowAutoLogoutModal] = useState(false);
  
  // Use refs for timers to avoid dependency issues
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-logout configuration
  const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
  const WARNING_TIMEOUT = 1 * 60 * 1000; // 1 minute warning

  const resetInactivityTimer = useCallback(() => {
    // Clear existing timers
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    setShowAutoLogoutModal(false);

    // Only set timers if user is authenticated
    if (user) {
      // Set warning timer (9 minutes)
      const warningTimerId = setTimeout(() => {
        setShowAutoLogoutModal(true);
      }, INACTIVITY_TIMEOUT - WARNING_TIMEOUT);

      // Set logout timer (10 minutes)
      const logoutTimerId = setTimeout(() => {
        logout();
      }, INACTIVITY_TIMEOUT);

      warningTimerRef.current = warningTimerId;
      inactivityTimerRef.current = logoutTimerId;
    }
  }, [user]);

  const onStayLoggedIn = useCallback(() => {
    setShowAutoLogoutModal(false);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  // Set up activity listeners
  useEffect(() => {
    if (user) {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      
      const handleActivity = () => {
        resetInactivityTimer();
      };

      events.forEach(event => {
        document.addEventListener(event, handleActivity, true);
      });

      // Initial timer setup
      resetInactivityTimer();

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleActivity, true);
        });
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      };
    }
  }, [user, resetInactivityTimer]);

  useEffect(() => {
    // Check if user is already authenticated on app load
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const userData = await apiService.getUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        apiService.clearToken();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, []);

  // Close auto-logout modal when user is logged out
  useEffect(() => {
    if (!user) {
      setShowAutoLogoutModal(false);
    }
  }, [user]);

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      const response: LoginResponse = await apiService.login(credentials);
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      // Close the auto-logout modal when logging out
      setShowAutoLogoutModal(false);
      await apiService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const isAdmin = !!user && user.role_name?.toLowerCase() === 'admin';
  const isScanner = !!user && user.role_name?.toLowerCase() === 'scanner';

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin,
    isScanner,
    resetInactivityTimer,
    showAutoLogoutModal,
    onStayLoggedIn,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 