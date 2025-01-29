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
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      try {
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userWithProfile = {
              ...user,
              profile: userData
            };
            setCurrentUser(userWithProfile);
            setUserRole(userData.role);
            
            localStorage.setItem('userData', JSON.stringify({
              uid: user.uid,
              role: userData.role,
              college: userData.college
            }));
          } else {
            handleSignOut();
          }
        } else {
          handleSignOut();
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        handleSignOut();
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [firebaseAuth]);

  const handleSignOut = () => {
    setCurrentUser(null);
    setUserRole(null);
    localStorage.removeItem('userData');
  };

  const value = {
    auth,
    currentUser,
    userRole,
    loading
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
      {!loading && children}
    </AuthContext.Provider>
  );
}; 