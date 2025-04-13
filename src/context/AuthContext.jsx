import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase-config';
import Auth from '../classes/Auth';
import { Box, CircularProgress, Typography } from '@mui/material';
import { keyframes } from '@mui/system';

// Define animations
const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

export const AuthContext = createContext();
export const StudentsContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth] = useState(new Auth());
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const firebaseAuth = getAuth();

  const handleSignOut = useCallback(async () => {
    try {
      await auth.signOut();
      setCurrentUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [auth]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      try {
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('User data from firestore:', userData);
            console.log('Section value:', userData.section);
            
            setCurrentUser({
              ...user,
              profile: userData,
              role: userData.role
            });
            setUserRole(userData.role);
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
  }, [firebaseAuth, handleSignOut]);

  // Add a function to update user section
  const updateUserSection = async (newSection) => {
    if (!currentUser) return { success: false, error: 'No user is logged in' };
    
    try {
      // Use the auth class method to update section
      const result = await auth.updateUserSection(currentUser.uid, newSection);
      
      if (result.success) {
        // Update the local state with the new section
        setCurrentUser(prevUser => ({
          ...prevUser,
          profile: {
            ...prevUser.profile,
            section: newSection || ''
          }
        }));
        
        console.log('Section updated successfully:', newSection);
        return result;
      } else {
        console.error('Failed to update section:', result.error);
        return result;
      }
    } catch (error) {
      console.error('Error in updateUserSection:', error);
      return { success: false, error: error.message };
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          width: '100%',
          position: 'fixed',
          top: 0,
          left: 0,
          gap: 3,
          animation: `${fadeIn} 0.5s ease-in-out`,
          backgroundColor: 'white',
          zIndex: 1000,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Outer progress circle */}
          <CircularProgress
            size={100}
            thickness={2}
            sx={{
              color: '#FFD700',
              position: 'absolute',
              animation: `${pulse} 2s infinite ease-in-out`,
            }}
          />
          {/* Inner progress circle */}
          <CircularProgress
            size={80}
            thickness={3}
            sx={{
              color: '#800000',
              animation: `${pulse} 2s infinite ease-in-out`,
              animationDelay: '0.3s',
            }}
          />
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 'bold',
              mb: 1,
              background: 'linear-gradient(45deg, #800000, #FFD700)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: `${pulse} 2s infinite ease-in-out`,
            }}
          >
            Initializing WILD C.O.R.E
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              animation: `${fadeIn} 0.5s ease-in-out`,
              animationDelay: '0.2s',
            }}
          >
            Please wait while we set things up...
          </Typography>
        </Box>

        {/* Loading dots */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            mt: 2,
          }}
        >
          {[0, 1, 2].map((index) => (
            <Box
              key={index}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#800000',
                animation: `${pulse} 1s infinite ease-in-out`,
                animationDelay: `${index * 0.2}s`,
              }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  const value = {
    auth,
    currentUser,
    userRole,
    handleSignOut,
    updateUserSection
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 