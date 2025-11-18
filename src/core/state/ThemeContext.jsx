import React from "react";
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null); // Added null as a default value

export const ThemeProvider = ({ children }) => {
  const { currentUser } = useAuth(); // isGuestMode was not used in the provided logic
  
  // Theme can be 'light', 'dark', or 'system'
  const [themePreference, setThemePreference] = useState(() => {
    return localStorage.getItem('themePreference') || 'system';
  });
  
  // Actual dark mode state based on preference and system
  const [darkMode, setDarkMode] = useState(false);
  
  // User's preference for showing the floating toggle button
  const [userPrefersFloatingToggle, setUserPrefersFloatingToggle] = useState(() => {
    const saved = localStorage.getItem('userPrefersFloatingToggle'); // Updated localStorage key
    // Default to true if no saved preference
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Actual state determining if the toggle should be displayed right now
  const [displayFloatingToggle, setDisplayFloatingToggle] = useState(false);

  // Effect to control actual display of toggle based on auth state and user preference
  useEffect(() => {
    if (!currentUser) {
      // If not logged in (e.g., on Welcome page), do not display the toggle
      setDisplayFloatingToggle(false);
      // Reset theme preferences for unauthenticated view
      setThemePreference('light'); 
      setDarkMode(false); 
    } else {
      // If logged in, display based on user's preference
      setDisplayFloatingToggle(userPrefersFloatingToggle);
    }
  }, [currentUser, userPrefersFloatingToggle]);

  // Save user's preference for the toggle to localStorage
  useEffect(() => {
    localStorage.setItem('userPrefersFloatingToggle', JSON.stringify(userPrefersFloatingToggle));
  }, [userPrefersFloatingToggle]);

  // Calculate actual theme based on preference and system setting
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (themePreference === 'system') {
      setDarkMode(prefersDark);
    } else {
      setDarkMode(themePreference === 'dark');
    }
    
    // Listen for system theme changes if using system preference
    if (themePreference === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => setDarkMode(e.matches);
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themePreference]);

  // Apply theme to document
  useEffect(() => {
    localStorage.setItem('themePreference', themePreference);
    document.documentElement.classList.toggle('dark', darkMode);
  }, [themePreference, darkMode]);
  
  // Toggle between light and dark
  const toggleTheme = () => {
    if (themePreference === 'system') {
      // If on system, switch to specific theme (opposite of current)
      setThemePreference(darkMode ? 'light' : 'dark');
    } else {
      // If on specific theme, toggle between light/dark
      setThemePreference(prev => prev === 'dark' ? 'light' : 'dark');
    }
  };
  
  // Explicitly set theme preference
  const setTheme = (newTheme) => {
    setThemePreference(newTheme);
  };
  
  // This function now toggles the USER'S PREFERENCE for the button's visibility
  const toggleFloatingButtonPreference = () => {
    setUserPrefersFloatingToggle(prev => !prev);
  };
  
  // Reset theme to default (can be called manually if needed)
  const resetTheme = () => {
    setThemePreference('light');
    setDarkMode(false);
    // Reset user's preference for the toggle to be visible by default
    setUserPrefersFloatingToggle(true); 
    localStorage.removeItem('themePreference');
    localStorage.removeItem('userPrefersFloatingToggle'); // Use updated localStorage key
  };

  return (
    <ThemeContext.Provider value={{ 
      darkMode, 
      themePreference,
      showFloatingToggle: displayFloatingToggle, // Consumers use this to decide visibility
      toggleTheme,
      setTheme,
      toggleFloatingButton: toggleFloatingButtonPreference, // This updates the user's preference
      resetTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Define the hook separately
const useThemeHook = () => {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export the hook with the desired name
export { useThemeHook as useTheme };