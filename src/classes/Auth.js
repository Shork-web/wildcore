import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, browserLocalPersistence, setPersistence } from 'firebase/auth';
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

      const uid = userCredential.user.uid;

      // Create the base profile document in users collection
      const profileData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        idNumber: userData.idNumber,
        phoneNumber: userData.phoneNumber,
        role: userData.role,
        createdAt: userData.createdAt,
        adminKeyVerified: userData.adminKeyVerified
      };

      // 1. Save to users collection
      await setDoc(doc(this._db, 'users', uid), profileData);

      // 2. Create role-specific profile document
      const roleProfileData = {
        ...profileData,
        accountType: userData.accountType,
        confirmPassword: userData.confirmPassword
      };

      if (userData.accountType === 'admin') {
        roleProfileData.adminKey = userData.adminKey;
      }

      // Save to nested role-specific collection (adminProfile or instructorProfile)
      const rolePath = userData.role === 'admin' ? 'adminProfile' : 'instructorProfile';
      await setDoc(
        doc(this._db, 'users', uid, rolePath, 'profile'),
        roleProfileData
      );

      // 3. Save to general profile collection
      await setDoc(doc(this._db, 'profile', uid), roleProfileData);

      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    }
  }

  async signIn(email, password, accountType) {
    try {
      // First set persistence
      await setPersistence(this._auth, browserLocalPersistence);
      
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
        await this.signOut(); // Sign out if validation fails
        return { 
          success: false, 
          error: 'This is an instructor account. Please use instructor login.' 
        };
      }

      if (accountType === 'instructor' && userData.adminKeyVerified) {
        await this.signOut(); // Sign out if validation fails
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