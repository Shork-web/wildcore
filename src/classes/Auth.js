import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, getDocs, query, collection, where } from 'firebase/firestore';
import { app } from '../firebase-config';

const auth = getAuth(app);
const db = getFirestore(app);

export default class Auth {
  constructor() {
    this._auth = auth;
    this._db = db;
    this._currentUser = null;
    this._userRole = null;
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
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        this._auth,
        userData.email,
        userData.password
      );

      const uid = userCredential.user.uid;

      // Create the base profile document
      const profileData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        idNumber: userData.idNumber,
        phoneNumber: userData.phoneNumber,
        role: userData.role,
        createdAt: userData.createdAt
      };

      // Add role-specific fields
      if (userData.role === 'admin') {
        profileData.adminKeyVerified = true;
      } else if (userData.role === 'instructor') {
        profileData.college = userData.college;
      }

      // Save to users collection
      await setDoc(doc(this._db, 'users', uid), profileData);

      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    }
  }

  async signIn(email, password, accountType) {
    try {
      // Get user credentials
      const userCredential = await signInWithEmailAndPassword(this._auth, email, password);
      
      // Get the user's profile data
      const userDoc = await getDoc(doc(this._db, 'users', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data();
      
      // Validate account type based on adminKeyVerified
      if (accountType === 'admin' && !userData.adminKeyVerified) {
        await this.signOut();
        return { 
          success: false, 
          error: 'This is an instructor account. Please use instructor login.' 
        };
      }

      if (accountType === 'instructor' && userData.adminKeyVerified) {
        await this.signOut();
        return { 
          success: false, 
          error: 'This is an admin account. Please use admin login.' 
        };
      }

      // If validation passes, proceed with login
      this._currentUser = userCredential.user;
      this._userRole = userData.role;

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

  async signOut() {
    try {
      await signOut(this._auth);
      this._currentUser = null;
      this._userRole = null;
      return { success: true };
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

  // User state observer
  onAuthStateChanged(callback) {
    return this._auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(this._db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          this._currentUser = user;
          this._userRole = userData.role;
          // Include all user data in callback
          callback({ 
            user, 
            role: userData.role,
            college: userData.college, // Include college
            profile: userData 
          });
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

    // Add college validation for instructors
    if (userData.role === 'instructor') {
      requiredFields.push('college');
    }

    return requiredFields.every(field => userData[field] && userData[field].trim() !== '');
  }

  async getUserProfile(uid) {
    try {
      const userDoc = await getDocs(
        query(
          collection(db, 'profile'),
          where('uid', '==', uid)
        )
      );

      if (!userDoc.empty) {
        return userDoc.docs[0].data();
      }
      throw new Error('User profile not found');
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }
} 