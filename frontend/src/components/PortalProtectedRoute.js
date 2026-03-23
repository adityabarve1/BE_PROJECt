import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { usePortal } from '../contexts/PortalContext';

const PortalProtectedRoute = ({ children, role }) => {
  const { isPortalAuthenticated, portalSession, loading } = usePortal();

  if (loading && !portalSession) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isPortalAuthenticated) {
    return <Navigate to="/portal/access" replace />;
  }

  if (role && portalSession?.role !== role) {
    return <Navigate to={`/portal/${portalSession.role}`} replace />;
  }

  return children;
};

export default PortalProtectedRoute;