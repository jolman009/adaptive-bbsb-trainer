import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipOnboardingCheck?: boolean;
}

/**
 * ProtectedRoute
 *
 * Wrapper component that redirects to welcome page if user is not authenticated.
 * Redirects to onboarding if user hasn't completed profile setup.
 * Shows loading spinner while checking authentication state.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  skipOnboardingCheck = false,
}) => {
  const { isAuthenticated, isLoading, needsOnboarding } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#0f1419',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  // Redirect to onboarding if needed (unless we're already on onboarding page)
  if (needsOnboarding && !skipOnboardingCheck && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
