import { initializeApp } from "firebase/app";
import { getAuth, OAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Your web app's Firebase configuration
// Replace these with your actual Firebase config values if they differ
const firebaseConfig = {
  apiKey: "AIzaSyBugqtCMkECjHyC_wDQzlB9cvhbzp5DiuA", // This appears to be your actual API key from console logs
  authDomain: "notesphere-f0b93.firebaseapp.com", // Replace with your authDomain
  projectId: "notesphere-f0b93", // This appears to be your project ID from console logs
  storageBucket: "notesphere-f0b93.appspot.com", // Replace with your storageBucket
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace with your messagingSenderId
  appId: "YOUR_APP_ID" // Replace with your appId
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Microsoft Auth Provider
export const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.setCustomParameters({
  // Force re-consent prompt
  prompt: 'consent',
});

// Enable offline persistence for better performance
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn('Firebase persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all of the features required
      console.warn('Firebase persistence not available in this browser');
    } else {
      console.error('Firebase persistence error:', err);
    }
  });

// Export the app as well in case we need it elsewhere
export default app;