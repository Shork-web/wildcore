import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userRole, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!currentUser) {
    // Save the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    // Only redirect if not already on a valid route
    const defaultRoute = userRole === 'admin' ? '/admin' : '/dashboard';
    if (location.pathname === defaultRoute) {
      return children;
    }
    return <Navigate to={defaultRoute} replace />;
  }

  return children;
};

export default ProtectedRoute;
