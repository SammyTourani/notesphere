// src/firebaseConfig.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// If you plan to use Analytics (optional)
// import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration is read from environment variables
const firebaseConfig = {
  // IMPORTANT: Make sure VITE_ prefix is used in your .env file
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID // Optional
};

// --- DIAGNOSTIC LOG ---
// Log the API key being read from the environment variable
// Check your browser console to see what value is actually being used.
console.log("API Key read from env:", import.meta.env.VITE_FIREBASE_API_KEY);
// --------------------

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const auth = getAuth(app); // Export auth instance
export const db = getFirestore(app); // Export Firestore instance

// If you plan to use Analytics (optional)
// export const analytics = getAnalytics(app);

// Optional: Log success/failure of initialization (check browser console)
// console.log("Firebase App Initialized:", app.name ? "Success" : "Failure");