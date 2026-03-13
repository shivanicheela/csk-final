import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// ============================================
// FIREBASE CONFIGURATION
// ============================================
// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDhDhE7yJgROeq94sbrS15x2TD6L6vHDrc",
  authDomain: "civil-services-kendra.firebaseapp.com",
  projectId: "civil-services-kendra",
  storageBucket: "civil-services-kendra.firebasestorage.app",
  messagingSenderId: "330576531917",
  appId: "1:330576531917:web:192db926fd5aa226227484",
  measurementId: "G-MKRCMTGNGH"
};
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore Database
export const db = getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Export app for use in other files
export default app;
