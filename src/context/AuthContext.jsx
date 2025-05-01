// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../firebaseConfig'; // Import your Firebase auth instance
import { onAuthStateChanged } from 'firebase/auth'; // Import the listener function

// 1. Create the Context
const AuthContext = createContext();

// Custom hook to make it easier to use the auth context in other components
export function useAuth() {
  return useContext(AuthContext);
}

// 2. Create the Provider Component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null); // State to hold the logged-in user object (or null)
  const [loading, setLoading] = useState(true);       // State to track if Firebase is checking auth status

  // 3. Set up the Firebase Auth State Listener
  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // This function runs whenever the user's login state changes
      // It receives the user object if logged in, or null if logged out
      setCurrentUser(user); // Update our state with the current user
      setLoading(false);    // Set loading to false once we have the initial status
      console.log("Auth State Changed:", user ? `User UID: ${user.uid}` : "No User"); // Log changes
    });

    // Cleanup function: Unsubscribe from the listener when the component unmounts
    return unsubscribe;
  }, []); // Empty dependency array ensures this effect runs only once on mount

  // 4. Define the value provided by the context
  const value = {
    currentUser, // The current user object (or null)
    loading      // Boolean indicating if auth state is still loading
    // You can add other auth-related functions here later (like login, signup, logout)
    // but for now, we just need the user and loading state.
  };

  // 5. Return the Provider wrapping the children
  // We only render children once loading is false to prevent flickering
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
      {/* Optionally, show a global loading indicator while loading is true */}
      {/* {loading && <p>Loading Application...</p>} */}
    </AuthContext.Provider>
  );
}
