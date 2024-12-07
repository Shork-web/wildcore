import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userRole, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(userRole)) {
    if (userRole === 'admin') {
      return <Navigate to="/admin" />;
    } else if (userRole === 'instructor') {
      return <Navigate to="/dashboard" />;
    }
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default ProtectedRoute;
