// src/context/ThemeContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { currentUser, isGuestMode } = useAuth();
  
  // Theme can be 'light', 'dark', or 'system'
  const [themePreference, setThemePreference] = useState(() => {
    return localStorage.getItem('themePreference') || 'system';
  });
  
  // Actual dark mode state based on preference and system
  const [darkMode, setDarkMode] = useState(false);
  
  // Show floating toggle button
  const [showFloatingToggle, setShowFloatingToggle] = useState(() => {
    const saved = localStorage.getItem('showFloatingToggle');
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Reset theme when user signs out
  useEffect(() => {
    // If there was a user and now there isn't (sign out occurred)
    if (!currentUser) {
      // Reset to light mode
      setThemePreference('light');
      setDarkMode(false);
      // Also reset floating toggle
      setShowFloatingToggle(false);
    }
  }, [currentUser]);

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
  
  // Save floating toggle preference
  useEffect(() => {
    localStorage.setItem('showFloatingToggle', JSON.stringify(showFloatingToggle));
  }, [showFloatingToggle]);

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
  
  // Toggle floating button visibility
  const toggleFloatingButton = () => {
    setShowFloatingToggle(prev => !prev);
  };
  
  // Reset theme to default (can be called manually if needed)
  const resetTheme = () => {
    setThemePreference('light');
    setDarkMode(false);
    setShowFloatingToggle(false);
  };

  return (
    <ThemeContext.Provider value={{ 
      darkMode, 
      themePreference,
      showFloatingToggle,
      toggleTheme,
      setTheme,
      toggleFloatingButton,
      resetTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);