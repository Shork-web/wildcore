import React, { createContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase-config';
import Auth from '../classes/Auth';
import { CircularProgress, Box } from '@mui/material';

export const AuthContext = createContext();
export const StudentsContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth] = useState(new Auth());
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const firebaseAuth = getAuth();

  useEffect(() => {
    // Try to restore user data from localStorage
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      const { role } = JSON.parse(storedUserData);
      setUserRole(role);
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      try {
        if (user) {
          // Get user role from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser(user);
            setUserRole(userData.role);
            
            // Update localStorage
            localStorage.setItem('userData', JSON.stringify({
              uid: user.uid,
              role: userData.role
            }));
          } else {
            console.error('User document not found');
            setCurrentUser(null);
            setUserRole(null);
            localStorage.removeItem('userData');
          }
        } else {
          setCurrentUser(null);
          setUserRole(null);
          localStorage.removeItem('userData');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setCurrentUser(null);
        setUserRole(null);
        localStorage.removeItem('userData');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [firebaseAuth]);

  const value = {
    auth,
    currentUser,
    userRole,
    loading,
    setCurrentUser,
    setUserRole
  };

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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 