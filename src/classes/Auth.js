import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, getDocs, query, collection, where, updateDoc } from 'firebase/firestore';
import { app } from '../firebase-config';

const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_KEY = "NLOADMIN_24!!"; // Move the admin key constant here

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
      // Validate admin key if signing up as admin
      if (userData.role === 'admin' && !this.validateAdminKey(userData.adminKey)) {
        return { 
          success: false, 
          error: 'Invalid Admin Key' 
        };
      }

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
        // Store an array of sections instead of a single section
        profileData.sections = Array.isArray(userData.sections) ? userData.sections : [];
        // Keep section field for backward compatibility, use first section if available
        profileData.section = Array.isArray(userData.sections) && userData.sections.length > 0 
          ? userData.sections[0] 
          : "";
      }

      // Save to users collection
      await setDoc(doc(this._db, 'users', uid), profileData);

      // If instructor has sections, create section documents
      if (userData.role === 'instructor' && Array.isArray(userData.sections) && userData.sections.length > 0) {
        const instructorName = `${userData.firstName} ${userData.lastName}`.trim();
        
        // Create section documents for each section
        for (const sectionName of userData.sections) {
          if (sectionName && sectionName.trim() !== '') {
            const sectionRef = doc(this._db, 'sections', sectionName);
            await setDoc(sectionRef, {
              sectionName: sectionName,
              college: userData.college,
              instructorId: uid,
              instructorName: instructorName,
              createdAt: userData.createdAt,
              updatedAt: userData.createdAt,
              createdBy: uid,
              updatedBy: uid
            });
          }
        }
      }

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
    // Update the admin key validation logic
    return key === ADMIN_KEY;
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

  async updateUserSection(userId, newSection) {
    try {
      const userDoc = await getDoc(doc(this._db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      const oldSection = userData.section;
      
      // Only proceed if there's an actual section change
      if (oldSection === newSection) {
        return { success: true, message: 'No change in section' };
      }
      
      // Update the user's section in their profile
      await updateDoc(doc(this._db, 'users', userId), {
        section: newSection || '',
        updatedAt: new Date().toISOString()
      });
      
      // If there was a previous section, remove instructor association
      if (oldSection && oldSection.trim() !== '') {
        const oldSectionRef = doc(this._db, 'sections', oldSection);
        const oldSectionDoc = await getDoc(oldSectionRef);
        
        if (oldSectionDoc.exists() && oldSectionDoc.data().instructorId === userId) {
          // We found a section where this instructor was assigned
          // Update the section to mark it as unassigned
          await updateDoc(oldSectionRef, {
            instructorId: '',
            instructorName: 'Unassigned',
            updatedAt: new Date().toISOString(),
            updatedBy: userId
          });
        }
      }
      
      // If there's a new section, create or update it with this instructor
      if (newSection && newSection.trim() !== '') {
        const newSectionRef = doc(this._db, 'sections', newSection);
        const newSectionDoc = await getDoc(newSectionRef);
        
        if (!newSectionDoc.exists()) {
          // Create new section
          await setDoc(newSectionRef, {
            sectionName: newSection,
            college: userData.college,
            instructorId: userId,
            instructorName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: userId,
            updatedBy: userId
          });
        } else {
          // Update existing section with new instructor
          await updateDoc(newSectionRef, {
            instructorId: userId,
            instructorName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            updatedAt: new Date().toISOString(),
            updatedBy: userId
          });
        }
      }
      
      return { success: true, message: 'Section updated successfully' };
    } catch (error) {
      console.error('Error updating section:', error);
      return { success: false, error: error.message };
    }
  }

  // New method to add multiple sections for an instructor
  async updateUserSections(userId, newSections) {
    try {
      if (!Array.isArray(newSections)) {
        throw new Error('Sections must be an array');
      }

      const userDoc = await getDoc(doc(this._db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      
      // Get current sections from user data
      const currentSections = Array.isArray(userData.sections) ? userData.sections : 
                             (userData.section ? [userData.section] : []);
      
      // Find sections to remove and sections to add
      const sectionsToRemove = currentSections.filter(section => !newSections.includes(section));
      const sectionsToAdd = newSections.filter(section => !currentSections.includes(section));
      
      // Update the user's sections in their profile
      await updateDoc(doc(this._db, 'users', userId), {
        sections: newSections,
        // Keep section field for backward compatibility (use first section or empty string)
        section: newSections.length > 0 ? newSections[0] : '',
        updatedAt: new Date().toISOString()
      });
      
      // Handle removed sections
      for (const sectionName of sectionsToRemove) {
        if (sectionName && sectionName.trim() !== '') {
          const sectionRef = doc(this._db, 'sections', sectionName);
          const sectionDoc = await getDoc(sectionRef);
          
          if (sectionDoc.exists() && sectionDoc.data().instructorId === userId) {
            // Mark the section as unassigned
            await updateDoc(sectionRef, {
              instructorId: '',
              instructorName: 'Unassigned',
              updatedAt: new Date().toISOString(),
              updatedBy: userId
            });
          }
        }
      }
      
      // Handle added sections
      for (const sectionName of sectionsToAdd) {
        if (sectionName && sectionName.trim() !== '') {
          const sectionRef = doc(this._db, 'sections', sectionName);
          const sectionDoc = await getDoc(sectionRef);
          
          const instructorName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
          
          if (!sectionDoc.exists()) {
            // Create new section
            await setDoc(sectionRef, {
              sectionName: sectionName,
              college: userData.college,
              instructorId: userId,
              instructorName: instructorName,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              createdBy: userId,
              updatedBy: userId
            });
          } else {
            // Update existing section with new instructor
            await updateDoc(sectionRef, {
              instructorId: userId,
              instructorName: instructorName,
              updatedAt: new Date().toISOString(),
              updatedBy: userId
            });
          }
        }
      }
      
      return { 
        success: true, 
        message: `Updated sections successfully. Added: ${sectionsToAdd.length}, Removed: ${sectionsToRemove.length}` 
      };
    } catch (error) {
      console.error('Error updating sections:', error);
      return { success: false, error: error.message };
    }
  }
} 