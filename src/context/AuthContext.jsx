import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth'; // Import signOut

// 1. Create the Context
const AuthContext = createContext();

// Custom hook to make it easier to use the auth context in other components
export function useAuth() {
  return useContext(AuthContext);
}

// 2. Create the Provider Component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to handle user logout
  const logout = async () => {
    try {
      await signOut(auth);
      console.log("User logged out successfully");
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: error.message };
    }
  };

  // 3. Set up the Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      console.log("Auth State Changed:", user ? `User UID: ${user.uid}` : "No User");
    });

    return unsubscribe;
  }, []);

  // 4. Define the value provided by the context
  const value = {
    currentUser,
    loading,
    logout // Include the logout function in the context value
  };

  // 5. Return the Provider, ALWAYS rendering children
  // Instead of conditional rendering, use an overlay for loading state if needed
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