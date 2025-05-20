import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { profanity } from '@2toad/profanity';

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
  const [userProfile, setUserProfile] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Function to handle user logout
  const logout = async () => {
    try {
      // Don't automatically disable guest mode on logout
      // This allows users to log out and stay in guest mode if they wish
      await signOut(auth);
      console.log("User logged out successfully");
      setUserProfile(null);
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

  // Function to create or update user profile
  const updateUserProfile = async (profileData) => {
    if (!currentUser) return { success: false, error: 'No authenticated user' };

    try {
      setLoadingProfile(true);
      
      // Filter profanity if updating name
      if (profileData.displayName) {
        // Check for profanity
        if (profanity.exists(profileData.displayName)) {
          return { 
            success: false, 
            error: 'Please choose a name without inappropriate language' 
          };
        }
      }

      // Reference to the user's profile document
      const userDocRef = doc(db, 'userProfiles', currentUser.uid);
      
      // Get the current profile if it exists
      const userDoc = await getDoc(userDocRef);
      
      let updatedProfile;
      
      if (userDoc.exists()) {
        // Update existing profile
        updatedProfile = {
          ...userDoc.data(),
          ...profileData,
          updatedAt: serverTimestamp()
        };
      } else {
        // Create new profile
        updatedProfile = {
          userId: currentUser.uid,
          email: currentUser.email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...profileData,
          isProfileComplete: true
        };
      }
      
      // Write to Firestore
      await setDoc(userDocRef, updatedProfile, { merge: true });
      
      // Update local state
      setUserProfile(updatedProfile);
      
      // If this was a new user completing their profile, they're no longer new
      if (isNewUser) {
        setIsNewUser(false);
      }
      
      return { success: true, profile: updatedProfile };
    } catch (error) {
      console.error("Error updating user profile:", error);
      return { success: false, error: error.message };
    } finally {
      setLoadingProfile(false);
    }
  };
  
  // Function to check if user is new and needs to set up their profile
  const checkUserProfile = async (user) => {
    if (!user) return;
    
    try {
      setLoadingProfile(true);
      console.log("Checking user profile for:", user.uid);
      
      const userDocRef = doc(db, 'userProfiles', user.uid);
      
      try {
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          // User profile exists
          const profile = userDoc.data();
          console.log("Found user profile:", profile);
          setUserProfile(profile);
          
          // Check if profile is complete (has a name)
          if (!profile.isProfileComplete || !profile.displayName) {
            console.log("Profile exists but incomplete, setting isNewUser to true");
            setIsNewUser(true);
          } else {
            console.log("Profile complete, setting isNewUser to false");
            setIsNewUser(false);
          }
        } else {
          // New user, no profile yet
          console.log("No user profile found, setting isNewUser to true");
          setUserProfile(null);
          setIsNewUser(true);
        }
      } catch (docError) {
        // If we can't access the profile due to permissions,
        // we'll assume this is a new user
        console.error("Error getting user document:", docError);
        console.log("Setting isNewUser to true due to document access error");
        setUserProfile(null);
        setIsNewUser(true);
      }
    } catch (error) {
      console.error("Error checking user profile:", error);
      // Assume this is a new user if we can't verify
      setIsNewUser(true);
    } finally {
      setLoadingProfile(false);
    }
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
      
      if (user) {
        // Check if user has a profile
        checkUserProfile(user);
      } else {
        // Clear profile if logged out
        setUserProfile(null);
        setIsNewUser(false);
      }
      
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
    disableGuestMode,
    userProfile,
    isNewUser,
    updateUserProfile,
    loadingProfile
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