import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If route requires authentication and user is not authenticated
  if (requireAuth && !user) {
    // Redirect to signin with the current location as redirect path
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // If route is for unauthenticated users and user is authenticated
  if (!requireAuth && user) {
    // Redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated and can access the route
  return <>{children}</>;
};

export default ProtectedRoute; 