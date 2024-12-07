import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { app } from '../firebase-config';

const auth = getAuth(app);
const db = getFirestore(app);

export default class Auth {
  constructor() {
    this._auth = auth;
    this._db = db;
  }

  async signUp(user) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this._auth,
        user.email,
        user.password
      );

      // Create user document
      await setDoc(doc(this._db, 'users', userCredential.user.uid), user.toJSON());

      // Create profile document based on role
      if (user.accountType === 'admin') {
        await setDoc(doc(this._db, 'users', userCredential.user.uid, 'adminProfile', 'profile'), {
          createdAt: new Date(),
          ...user.toJSON()
        });
      } else {
        await setDoc(doc(this._db, 'users', userCredential.user.uid, 'instructorProfile', 'profile'), {
          createdAt: new Date(),
          ...user.toJSON()
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async signIn(email, password, accountType) {
    try {
      const userCredential = await signInWithEmailAndPassword(this._auth, email, password);
      const userDoc = await getDoc(doc(this._db, 'users', userCredential.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role !== accountType) {
          throw new Error(`This account is not an ${accountType}`);
        }
        return { success: true, user: userCredential.user };
      } else {
        throw new Error('User data not found');
      }
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
} 