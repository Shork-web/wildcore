import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBLrJcUISHH2UVKeT88cT3uHN0tpTp5Dx0",
  authDomain: "wildcore-88292.firebaseapp.com",
  databaseURL: "https://wildcore-88292-default-rtdb.firebaseio.com",
  projectId: "wildcore-88292",
  storageBucket: "wildcore-88292.firebasestorage.app",
  messagingSenderId: "380042176463",
  appId: "1:380042176463:web:9cb282817911239b4754ba",
  measurementId: "G-C3C9JETKK3"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics }; 