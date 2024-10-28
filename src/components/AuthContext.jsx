import React, { createContext, useState } from 'react';

// Create the context
export const AuthContext = createContext();

// Create a provider component
export const AuthProvider = ({ children }) => {
  // For simplicity, we'll use state to manage the user role

  // In a real application, you'd get this from an authentication service or DATA BASE
  const [userRole, setUserRole] = useState('user'); // 'admin' or 'user'

  // Function to change the user role (for testing purposes)
  const toggleUserRole = () => {
    setUserRole((prevRole) => (prevRole === 'admin' ? 'user' : 'admin'));
  };

  return (
    <AuthContext.Provider value={{ userRole, toggleUserRole }}>
      {children}
    </AuthContext.Provider>
  );
};
