import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  userRole?: UserRole;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  isAuthenticated,
  userRole,
  allowedRoles,
  redirectTo = '/',
}) => {
  const location = useLocation();

  // If not authenticated, redirect to login/homepage
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If role restriction is specified, check if user has the right role
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    // Redirect to their appropriate dashboard based on role
    const roleRedirects: Record<UserRole, string> = {
      [UserRole.ADMIN]: '/admin',
      [UserRole.TEACHER]: '/teacher',
      [UserRole.STUDENT]: '/student',
      [UserRole.PARENT]: '/parent',
    };
    return <Navigate to={roleRedirects[userRole] || '/'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
