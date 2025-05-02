// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Create the Context
const AuthContext = createContext();

// Custom hook to make it easier to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}

// Provider Component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);

  // Function to handle user logout
  const logout = async () => {
    try {
      // Don't automatically disable guest mode on logout
      // This allows users to log out and stay in guest mode if they wish
      await signOut(auth);
      console.log("User logged out successfully");
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: error.message };
    }
  };

  // Enable guest mode
  const enableGuestMode = () => {
    console.log("Enabling guest mode");
    setIsGuestMode(true);
    localStorage.setItem('isGuestMode', 'true');
  };

  // Disable guest mode
  const disableGuestMode = () => {
    console.log("Disabling guest mode");
    setIsGuestMode(false);
    localStorage.removeItem('isGuestMode');
  };

  // Set up the Firebase Auth State Listener
  useEffect(() => {
    // Check if user was in guest mode previously
    const storedGuestMode = localStorage.getItem('isGuestMode');
    if (storedGuestMode === 'true') {
      console.log("Restoring guest mode from localStorage");
      setIsGuestMode(true);
    }
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth State Changed:", user ? `User UID: ${user.uid}` : "No User");
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Define the value provided by the context
  const value = {
    currentUser,
    loading,
    logout,
    isGuestMode,
    enableGuestMode,
    disableGuestMode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {loading && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-gray-700 dark:text-gray-300 text-center">Loading...</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}