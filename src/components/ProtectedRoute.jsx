import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, allowedRoles, userRole }) {
  return allowedRoles.includes(userRole) ? children : <Navigate to="/" />;
}

export default ProtectedRoute;
