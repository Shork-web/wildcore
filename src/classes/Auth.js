import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { app } from '../firebase-config';

const auth = getAuth(app);
const db = getFirestore(app);

export default class Auth {
  constructor() {
    this._auth = auth;
    this._db = db;
    this._currentUser = null;
    this._userRole = null;
    
    // Set persistence when class is instantiated
    setPersistence(this._auth, browserLocalPersistence)
      .catch((error) => {
        console.error("Auth persistence error:", error);
      });
  }

  // Getters
  get currentUser() {
    return this._currentUser;
  }

  get userRole() {
    return this._userRole;
  }

  // Authentication methods
  async signUp(userData) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this._auth,
        userData.email,
        userData.password
      );

      // Create user profile with all required fields
      const userProfile = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        idNumber: userData.idNumber,
        phoneNumber: userData.phoneNumber,
        role: userData.role,
        createdAt: new Date().toISOString()  // Add createdAt timestamp
      };

      // Save user profile to Firestore
      await setDoc(doc(this._db, 'users', userCredential.user.uid), userProfile);

      // Create role-specific profile
      const profilePath = `users/${userCredential.user.uid}/${userData.role}Profile/profile`;
      await setDoc(doc(this._db, profilePath), userProfile);

      this._currentUser = userCredential.user;
      this._userRole = userData.role;

      return { success: true };
    } catch (error) {
      console.error('Signup error:', error); // Add error logging
      return { success: false, error: error.message };
    }
  }

  async signIn(email, password, accountType) {
    try {
      // First set persistence, then sign in
      await setPersistence(this._auth, browserLocalPersistence);
      
      const userCredential = await signInWithEmailAndPassword(this._auth, email, password);
      const userDoc = await getDoc(doc(this._db, 'users', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data();
      if (userData.role !== accountType) {
        throw new Error(`Invalid account type. This account is not registered as ${accountType}`);
      }

      this._currentUser = userCredential.user;
      this._userRole = userData.role;

      // Store user data in localStorage for persistence
      localStorage.setItem('userData', JSON.stringify({
        uid: userCredential.user.uid,
        role: userData.role
      }));

      return { 
        success: true, 
        user: {
          ...userCredential.user,
          role: userData.role,
          profile: userData
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(this._auth, email);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      await this._auth.signOut();
      this._currentUser = null;
      this._userRole = null;
      // Clear stored user data
      localStorage.removeItem('userData');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // User state observer
  onAuthStateChanged(callback) {
    return this._auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(this._db, 'users', user.uid));
        if (userDoc.exists()) {
          this._currentUser = user;
          this._userRole = userDoc.data().role;
          callback({ user, role: userDoc.data().role });
        }
      } else {
        this._currentUser = null;
        this._userRole = null;
        callback(null);
      }
    });
  }

  // Validation methods
  validateAdminKey(key) {
    // Replace with your actual admin key validation logic
    return key === 'your-admin-key';
  }

  validatePasswords(password, confirmPassword) {
    return password === confirmPassword;
  }

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validateRequiredFields(userData) {
    const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'password',
      'idNumber',
      'phoneNumber'
    ];

    return requiredFields.every(field => userData[field] && userData[field].trim() !== '');
  }
} 