import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase-config';
import Auth from '../classes/Auth';

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
      setCurrentUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [firebaseAuth]);

  if (loading) {
    return null;
  }

  const value = {
    auth,
    currentUser,
    userRole,
    handleSignOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 