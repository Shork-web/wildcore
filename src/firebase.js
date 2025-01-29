import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBxGUe4G4EyX7di62IH9F4ImCDxJeqF8Hs",
  authDomain: "wildcore-b4ef2.firebaseapp.com",
  projectId: "wildcore-b4ef2",
  storageBucket: "wildcore-b4ef2.appspot.com",
  messagingSenderId: "1043601014942",
  appId: "1:1043601014942:web:c7d2b1c650e3d99d7cb4c0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Auth and Firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app; 