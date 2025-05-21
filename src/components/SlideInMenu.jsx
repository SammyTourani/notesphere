import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';
import { useTheme } from '../context/ThemeContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const SlideInMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, isGuestMode, userProfile } = useAuth();
  const { trashedNotes } = useNotes();
  const { darkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [userInitial, setUserInitial] = useState('');
  const [hoverItem, setHoverItem] = useState(null);
  const [displayEmail, setDisplayEmail] = useState('');
  const emailContainerRef = useRef(null);

  // Process email for display - truncate if needed
  useEffect(() => {
    if (currentUser?.email && emailContainerRef.current) {
      const email = currentUser.email;
      
      // For shorter emails, just display them
      if (email.length < 25) {
        setDisplayEmail(email);
        return;
      }
      
      // For longer emails, create a truncated version with ellipsis
      const atIndex = email.indexOf('@');
      if (atIndex > 0) {
        // Keep first part up to a certain length + @ + start of domain + ...
        const firstPart = email.substring(0, Math.min(atIndex, 15));
        const domain = email.substring(atIndex);
        // Get first few chars of domain
        const shortDomain = domain.substring(0, Math.min(domain.length, 5)) + '...';
        setDisplayEmail(firstPart + shortDomain);
      } else {
        // Fallback if email doesn't have @
        setDisplayEmail(email.substring(0, 20) + '...');
      }
    }
  }, [currentUser?.email, isOpen]);

  // Extract user initial for avatar
  useEffect(() => {
    if (userProfile?.displayName) {
      setUserInitial(userProfile.displayName.charAt(0).toUpperCase());
    } else if (currentUser?.email) {
      setUserInitial(currentUser.email.charAt(0).toUpperCase());
    }
  }, [currentUser, userProfile]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  // Form submission logout approach - bypasses React Router completely
  const handleLogout = () => {
    // Close the menu
    closeMenu();

    // 1. First, disable the auth state listener temporarily
    // Set a flag that we're in the process of logging out
    window.isLoggingOut = true;

    // 2. Set the intentional logout flag that App.jsx checks for
    sessionStorage.setItem('intentional_logout', 'true');
    
    // 3. Create an actual HTML form to force navigation
    const form = document.createElement('form');
    form.method = 'GET';
    form.action = '/';
    document.body.appendChild(form);
    
    // 4. Perform the signOut asynchronously - this happens after navigation starts
    setTimeout(() => {
      signOut(auth).catch(error => {
        console.error('Error during logout:', error);
      });
    }, 0);
    
    // 5. Submit the form to force navigation
    form.submit();
  };

  // Navigate to login and close menu
  const handleLogin = () => {
    closeMenu();
    navigate('/login');
  };

  // Navigate to signup and close menu
  const handleSignup = () => {
    closeMenu();
    navigate('/signup');
  };

  // Navigate to home and close menu
  const handleHome = () => {
    closeMenu();
    navigate('/');
  };

  // Fixed: Navigate to profile page with proper logging and explicit path
  const handleProfileClick = () => {
    console.log("Profile clicked, navigating to /profile");
    closeMenu();
    // Force navigation to the profile path, bypassing any redirects
    setTimeout(() => {
      navigate('/profile', { replace: true });
    }, 10);
  };

  // Stop clicks inside the menu from closing it
  const handleMenuClick = (e) => {
    e.stopPropagation();
  };

  // Full page list for authenticated users
  const authenticatedPages = [
    {
      to: '/notes',
      label: 'Notes',
      description: 'Access and edit your notes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
      ),
    },
    {
      to: '/trash',
      label: 'Trash',
      description: 'Recover deleted notes',
      showBadge: trashedNotes?.length > 0,
      badgeCount: trashedNotes?.length || 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      ),
    },
    {
      to: '/profile',
      label: 'Profile',
      description: 'Manage your personal information',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
        </svg>
      ),
    },
    {
      to: '/settings',
      label: 'Settings',
      description: 'Customize your experience',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
      ),
    },
  ];

  // Limited page list for guest users
  const guestPages = [
    {
      to: '/',
      label: 'Home',
      description: 'Return to homepage',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
        </svg>
      ),
    },
    {
      to: '/notes',
      label: 'Notes',
      description: 'Browse your notes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
      ),
    },
  ];

  // Use appropriate pages based on user status
  const pages = currentUser ? authenticatedPages : (isGuestMode ? guestPages : []);

  // Use direct inline styles for faster theme switching
  const buttonStyle = {
    backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.85)' : 'rgba(255, 255, 255, 0.9)',
    boxShadow: darkMode ? '0 4px 14px 0 rgba(0, 0, 0, 0.25)' : '0 4px 14px 0 rgba(0, 0, 0, 0.08)',
    borderColor: darkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(229, 231, 235, 0.5)',
    transition: 'background-color 0.15s, box-shadow 0.15s, border-color 0.15s'
  };

  // Get the avatar image
  const getAvatarImage = () => {
    if (userProfile?.photoURL) {
      return userProfile.photoURL;
    }
    
    // Default avatar with initial
    return `https://ui-avatars.com/api/?name=${userInitial}&background=7C3AED&color=fff&size=200`;
  };

  return (
    <>
      {/* Menu toggle button with direct style application for faster theme updates */}
      <motion.button 
        className="fixed top-3 left-3 z-50 p-2.5 rounded-full focus:outline-none backdrop-blur-lg border"
        onClick={toggleMenu}
        initial={{ opacity: 0, y: -5 }}
        animate={{ 
          opacity: 1, 
          y: 0
        }}
        whileHover={{ 
          scale: 1.05, 
          y: -1,
          boxShadow: darkMode ? '0 8px 20px rgba(0, 0, 0, 0.3)' : '0 8px 20px rgba(79, 70, 229, 0.2)'
        }}
        whileTap={{ scale: 0.95 }}
        style={buttonStyle}
        transition={{ 
          duration: 0.15
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        
        {/* Enhanced radial gradient behind the menu button */}
        <div className={`absolute inset-0 rounded-full ${darkMode ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20' : 'bg-gradient-to-r from-purple-500/10 to-blue-500/10'} -z-10`}></div>
      </motion.button>
      
      {/* Backdrop with improved blur */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50 backdrop-blur-[8px]"
            onClick={closeMenu}
          />
        )}
      </AnimatePresence>
      
      {/* Side menu with enhanced animations */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '-100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0.5 }}
            transition={{ 
              type: 'spring', 
              damping: 30, 
              stiffness: 300,
              mass: 1.1
            }}
            className="fixed top-0 left-0 z-50 h-full w-80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.15)] dark:shadow-[0_0_50px_rgba(0,0,0,0.4)] overflow-hidden border-r border-white/30 dark:border-gray-800/60"
            onClick={handleMenuClick}
          >
            {/* Enhanced animated mesh gradient background */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              {/* Main gradient overlay with enhanced vibrance */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-indigo-50/30 to-blue-50/50 dark:from-purple-900/30 dark:via-indigo-900/20 dark:to-blue-900/30 z-0"></div>
              
              {/* Top radial gradient with improved animation */}
              <motion.div 
                className="absolute -top-40 -left-20 w-96 h-96 rounded-full bg-gradient-to-br from-purple-500/15 via-fuchsia-500/15 to-blue-500/15 dark:from-purple-400/15 dark:via-fuchsia-400/15 dark:to-blue-400/15 blur-3xl z-0"
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.7, 0.5],
                  y: ['-5%', '5%', '-5%'],
                  x: ['-5%', '5%', '-5%'],
                }} 
                transition={{ 
                  duration: 20,
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              />
              
              {/* Bottom radial gradient with improved animation */}
              <motion.div 
                className="absolute bottom-0 right-0 w-full h-full rounded-full bg-gradient-to-tr from-blue-500/15 via-purple-500/10 to-pink-500/15 dark:from-blue-400/15 dark:via-purple-400/10 dark:to-pink-400/15 blur-3xl z-0"
                animate={{ 
                  scale: [1, 1.05, 1],
                  opacity: [0.3, 0.5, 0.3],
                  y: ['5%', '-5%', '5%'],
                  x: ['5%', '-5%', '5%'],
                }} 
                transition={{ 
                  duration: 15,
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              />
              
              {/* Enhanced noise texture overlay for added depth */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-30 dark:opacity-20 z-0 mix-blend-soft-light"></div>
            </div>
            
            {/* Content container with refined spacing and premium styling */}
            <div className="relative z-10 flex flex-col h-full">
              {/* Premium header with enhanced branding */}
              <div className="pt-9 pb-7 px-7">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 relative group cursor-pointer">
                      {/* Enhanced logo background with gradient and effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 to-blue-600/90 dark:from-purple-500/90 dark:to-blue-500/90 rounded-xl blur-[2px] opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"></div>
                      
                      {/* Enhanced logo container with glass effect */}
                      <div className="relative bg-gradient-to-br from-purple-600 to-blue-500 text-white p-2.5 rounded-xl shadow-lg border border-white/20 dark:border-white/10 group-hover:shadow-purple-500/30 dark:group-hover:shadow-purple-500/30 transition-all duration-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        
                        {/* Enhanced inner light reflection */}
                        <div className="absolute top-0.5 left-0.5 right-0.5 h-1/2 bg-white/30 rounded-t-lg opacity-70"></div>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      {/* Enhanced brand name with premium gradient text */}
                      <h1 className="text-xl font-bold">
                        <span className="bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">NoteSphere</span>
                      </h1>
                      
                      {/* Enhanced brand tagline with subtle animation */}
                      <motion.div 
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                        className="text-xs text-gray-500 dark:text-gray-400 mt-0.5"
                      >
                        Capture your thoughts
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* Enhanced close button with refined animation */}
                  <motion.button
                    onClick={closeMenu}
                    className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 p-1.5 rounded-full hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-colors duration-200 border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50"
                    whileHover={{ 
                      scale: 1.1, 
                      rotate: 90,
                      backgroundColor: "rgba(255, 255, 255, 0.15)",
                      backdropFilter: "blur(8px)",
                    }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>
              
              {/* Enhanced user profile section with premium glass card - Only show for authenticated users */}
              {currentUser && (
                <motion.div 
                  className="px-7 pb-7"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  <motion.div 
                    className="rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-md shadow-sm border border-white/50 dark:border-gray-700/50 overflow-hidden relative"
                    whileHover={{ 
                      y: -5,
                      boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.2)"
                    }}
                    onClick={handleProfileClick}
                    role="button"
                    aria-label="View and edit profile"
                  >
                    {/* Enhanced subtle background pattern for the card */}
                    <div className="absolute inset-0 bg-grid-gray-100/[0.07] dark:bg-grid-gray-700/[0.07] -z-10"></div>
                    
                    <div className="flex items-center p-4">
                      <div className="relative group">
                        {/* Enhanced premium avatar with 3D-like effect */}
                        <div className="relative">
                          {/* Enhanced soft shadow behind avatar */}
                          <motion.div 
                            animate={{ 
                              opacity: [0.6, 0.8, 0.6],
                              scale: [1, 1.05, 1],
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -inset-1 bg-gradient-to-br from-purple-500/40 to-blue-500/40 dark:from-purple-400/30 dark:to-blue-400/30 blur-md rounded-xl opacity-70"
                          ></motion.div>
                          
                          {/* Profile image with hover effects */}
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-md border-2 border-white/70 dark:border-white/10 group-hover:border-purple-300 dark:group-hover:border-purple-500/50 transition-all duration-300">
                            <img 
                              src={getAvatarImage()}
                              alt={userProfile?.displayName || "User"}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            
                            {/* Hover overlay with edit icon */}
                            <div className="absolute inset-0 bg-purple-600/0 group-hover:bg-purple-600/60 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                              </svg>
                            </div>
                          </div>
                          
                          {/* Online status indicator */}
                          <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ 
                              delay: 0.5, 
                              type: "spring",
                              stiffness: 500,
                              damping: 15
                            }}
                            className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-green-500 border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center shadow-lg"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </motion.div>
                        </div>
                      </div>
                      
                      {/* User information with animations */}
                      <div className="ml-4 flex-1">
                        {/* Username with tooltip if truncated */}
                        <div className="flex items-center">
                          <h3 
                            className="font-semibold text-gray-900 dark:text-white text-base truncate"
                            title={userProfile?.displayName || currentUser?.email}
                          >
                            {userProfile?.displayName || displayEmail}
                          </h3>
                          
                          {/* Edit profile subtle indicator */}
                          <motion.div 
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 }}
                            className="ml-2 text-purple-600 dark:text-purple-400"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                            </svg>
                          </motion.div>
                        </div>
                        
                        {/* Email display */}
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5" title={currentUser?.email}>
                          {displayEmail}
                        </div>

                        {/* Usage preferences tags */}
                        {userProfile?.usagePreferences && userProfile.usagePreferences.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {userProfile.usagePreferences.map(usage => (
                              <span 
                                key={usage} 
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                              >
                                {usage.charAt(0).toUpperCase() + usage.slice(1)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Subtle arrow indicator */}
                      <div className="text-gray-400 dark:text-gray-500 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Enhanced guest mode banner with premium styling */}
              {isGuestMode && !currentUser && (
                <motion.div 
                  className="px-7 pb-7"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  <div className="rounded-2xl overflow-hidden shadow-sm border border-purple-100/50 dark:border-purple-900/50 backdrop-blur-md relative">
                    {/* Enhanced premium gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/90 via-indigo-50/80 to-blue-50/90 dark:from-purple-900/40 dark:via-indigo-900/30 dark:to-blue-900/40 -z-10"></div>
                    
                    {/* Enhanced decorative pattern */}
                    <div className="absolute inset-0 opacity-10 dark:opacity-5 bg-[radial-gradient(#a78bfa_1px,transparent_1px)] [background-size:16px_16px] -z-10"></div>
                    
                    <div className="p-5">
                      <div className="flex items-center mb-3">
                        {/* Enhanced icon container */}
                        <motion.div 
                          whileHover={{ scale: 1.1 }}
                          className="p-2 bg-gradient-to-br from-purple-100 to-purple-200/80 dark:from-purple-800/50 dark:to-purple-900/40 rounded-lg shadow-sm border border-purple-200/50 dark:border-purple-700/30"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 dark:text-purple-300" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                        </motion.div>
                        <span className="ml-3 font-semibold text-purple-700 dark:text-purple-300">Guest Mode</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                        Unlock full features like cloud sync, trash management, and settings by creating an account.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Enhanced premium navigation section divider */}
              <div className="px-7 mb-2 mt-1">
                <div className="flex items-center">
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300/70 dark:via-gray-700/70 to-transparent flex-grow"></div>
                  <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3">Navigation</h2>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300/70 dark:via-gray-700/70 to-transparent flex-grow"></div>
                </div>
              </div>
              
              {/* Enhanced navigation links with elevation and refined animations */}
              <nav className="flex-1 px-5 py-3">
                <motion.ul 
                  className="space-y-2.5"
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.07
                      }
                    }
                  }}
                >
                  {pages.map((page, index) => (
                    <motion.li 
                      key={page.to}
                      variants={{
                        hidden: { opacity: 0, x: -20 },
                        show: { opacity: 1, x: 0 }
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 24 }}
                      onHoverStart={() => setHoverItem(page.to)}
                      onHoverEnd={() => setHoverItem(null)}
                    >
                      <Link
                        to={page.to}
                        className={`flex items-center justify-between w-full p-3.5 rounded-xl transition-all duration-300 relative overflow-hidden ${
                          location.pathname === page.to || (page.to !== '/' && location.pathname.startsWith(page.to))
                            ? 'shadow-sm'
                            : 'hover:shadow-sm hover:scale-[1.02]'
                        } group`}
                        onClick={closeMenu}
                      >
                        {/* Enhanced background glow effect */}
                        <div className={`absolute inset-0 transition-opacity duration-300 ${
                          location.pathname === page.to || (page.to !== '/' && location.pathname.startsWith(page.to))
                            ? 'opacity-100 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/40 dark:to-blue-900/40 border border-purple-100/50 dark:border-purple-800/30'
                            : 'opacity-0 group-hover:opacity-100 bg-gradient-to-r from-gray-50/70 to-gray-100/70 dark:from-gray-800/40 dark:to-gray-700/40 border border-transparent group-hover:border-gray-200/40 dark:group-hover:border-gray-700/40'
                        } -z-10 rounded-xl`}></div>
                        
                        {/* Enhanced white backdrop with blur */}
                        <div className={`absolute inset-0 bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm rounded-xl -z-10 transition-opacity duration-300 ${
                          location.pathname === page.to || (page.to !== '/' && location.pathname.startsWith(page.to)) || hoverItem === page.to
                            ? 'opacity-100'
                            : 'opacity-0'
                        }`}></div>
                        
                        <div className="flex items-center">
                          {/* Enhanced icon with 3D-like hover effect */}
                          <motion.div 
                            whileHover={{ y: -2 }}
                            whileTap={{ y: 1 }}
                            className={`flex-shrink-0 p-2.5 rounded-lg transition-all duration-300 relative ${
                              location.pathname === page.to || (page.to !== '/' && location.pathname.startsWith(page.to))
                                ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-md'
                                : 'text-gray-600 dark:text-gray-300 bg-gray-100/80 dark:bg-gray-800/80 group-hover:bg-gradient-to-br group-hover:from-purple-500/90 group-hover:to-blue-500/90 group-hover:text-white/95'
                            }`}
                          >
                            {/* Enhanced icon highlight */}
                            <div className={`absolute inset-0 rounded-lg transition-opacity duration-300 ${
                              location.pathname === page.to || (page.to !== '/' && location.pathname.startsWith(page.to)) || hoverItem === page.to
                                ? 'opacity-100'
                                : 'opacity-0'
                            } bg-gradient-to-b from-white/20 to-transparent -z-10`}></div>
                            
                            {/* The actual icon */}
                            {page.icon}
                          </motion.div>
                          
                          <div className="ml-3.5">
                            <div className="font-medium text-gray-800 dark:text-gray-100">{page.label}</div>
                            {/* Enhanced subtle description text that appears on hover */}
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ 
                                height: (hoverItem === page.to || location.pathname === page.to) ? 'auto' : 0,
                                opacity: (hoverItem === page.to || location.pathname === page.to) ? 1 : 0
                              }}
                              transition={{ duration: 0.2 }}
                              className="text-xs text-gray-500 dark:text-gray-400 overflow-hidden"
                            >
                              {page.description}
                            </motion.div>
                          </div>
                        </div>
                        
                        {/* Enhanced badge with refined design */}
                        {page.showBadge && page.badgeCount > 0 && (
                          <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 15 }}
                            className="relative"
                          >
                            {/* Enhanced soft glow behind badge */}
                            <motion.div 
                              animate={{ 
                                opacity: [0.7, 0.9, 0.7],
                              }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                              className="absolute inset-0 bg-gradient-to-r from-red-500/60 to-pink-500/60 blur-md rounded-full opacity-80"
                            ></motion.div>
                            
                            {/* Enhanced badge with glass effect */}
                            <div className="relative bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full px-2.5 py-1 flex items-center justify-center min-w-[24px] shadow-md border border-white/20">
                              {page.badgeCount > 99 ? '99+' : page.badgeCount}
                            </div>
                          </motion.div>
                        )}
                      </Link>
                    </motion.li>
                  ))}
                </motion.ul>
              </nav>

              {/* Enhanced feature list for guest users with premium design */}
              {isGuestMode && !currentUser && (
                <motion.div 
                  className="px-7 py-4 mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <div className="p-5 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-md shadow-sm border border-gray-100/50 dark:border-gray-700/30 relative overflow-hidden">
                    {/* Enhanced subtle background pattern */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblRyYW5zZm9ybT0ic2NhbGUoLjUpIj48cGF0aCBkPSJNMjAgMTBhMTAgMTAgMCAxIDEtMjAgMCAxMCAxMCAwIDAgMSAyMCAweiIgZmlsbD0iI0E4QThBOCIgZmlsbC1vcGFjaXR5PSIuMDUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] opacity-50 dark:opacity-30 -z-10"></div>
                    
                    {/* Enhanced radial gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 to-blue-100/30 dark:from-purple-900/20 dark:to-blue-900/20 -z-10"></div>
                    
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center">
                      <motion.div 
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        className="p-2 mr-2.5 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200/70 dark:from-purple-900/60 dark:to-purple-800/50 shadow-sm border border-purple-200/50 dark:border-purple-800/40"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600 dark:text-purple-300" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </motion.div>
                      Premium Features
                    </h3>
                    
                    <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-3">
                      {[
                        { text: "Sync notes across all devices", icon: "📱" },
                        { text: "Recover deleted notes from trash", icon: "🔄" },
                        { text: "Customize app settings and themes", icon: "🎨" },
                        { text: "Secure cloud backup", icon: "🔒" }
                      ].map((feature, index) => (
                        <motion.li 
                          key={index} 
                          className="flex items-center p-2.5 hover:bg-white/50 dark:hover:bg-gray-700/40 rounded-lg transition-all duration-200 shadow-sm hover:shadow border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + (index * 0.1), duration: 0.3 }}
                          whileHover={{ 
                            scale: 1.02, 
                            x: 3,
                            backgroundColor: "rgba(255, 255, 255, 0.6)",
                            backdropFilter: "blur(12px)",
                          }}
                        >
                          <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-gray-100/80 to-gray-200/80 dark:from-gray-800/80 dark:to-gray-700/80 rounded-lg mr-3 text-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50">
                            {feature.icon}
                          </div>
                          <span className="font-medium">{feature.text}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
              
              {/* Enhanced improved footer area with premium styling */}
              <div className="mt-auto">
                <div className="px-7 py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <motion.div 
                      whileHover={{ rotate: 180 }}
                      transition={{ duration: 0.5 }}
                      className="p-1 rounded-full bg-gradient-to-br from-purple-100/70 to-purple-200/70 dark:from-purple-900/40 dark:to-purple-800/40 shadow-sm border border-purple-200/30 dark:border-purple-800/30"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-purple-600 dark:text-purple-300" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      NoteSphere v1.0.0
                    </div>
                  </div>
                  <motion.a 
                    href="#" 
                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200"
                    onClick={(e) => {
                      e.preventDefault();
                      closeMenu();
                    }}
                    whileHover={{ scale: 1.05 }}
                  >
                    Help
                  </motion.a>
                </div>
                
                {/* Enhanced logout button for authenticated users with ultra-premium styling */}
                {currentUser && (
                  <div className="px-7 py-5 border-t border-gray-200/50 dark:border-gray-700/50">
                    <motion.button
                      onClick={handleLogout}
                      className="flex items-center w-full p-3.5 text-sm font-medium rounded-xl transition-all duration-300 group relative overflow-hidden"
                      whileHover={{ 
                        x: 5, 
                        boxShadow: "0 5px 20px rgba(239, 68, 68, 0.25)",
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Enhanced gradient background that appears on hover */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-red-50 to-red-100/70 dark:from-red-900/30 dark:to-red-800/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl border border-red-200/50 dark:border-red-800/30 -z-10"
                      ></motion.div>
                      
                      {/* Enhanced icon with refined animation */}
                      <motion.div 
                        whileHover={{ rotate: -10 }}
                        className="p-2 rounded-lg bg-red-100/80 dark:bg-red-900/40 text-red-500 dark:text-red-400 mr-3 group-hover:bg-red-600 group-hover:text-white transition-colors duration-300 shadow-sm border border-red-200/50 dark:border-red-800/30"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                        </svg>
                      </motion.div>
                      <span className="text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors duration-300">Sign Out</span>
                    </motion.button>
                  </div>
                )}

                {/* Enhanced ultra-premium login/signup buttons for guest users */}
                {isGuestMode && !currentUser && (
                  <div className="px-7 py-5 border-t border-gray-200/50 dark:border-gray-700/50 space-y-3">
                    {/* Enhanced sign in button with premium effects */}
                    <motion.button
                      onClick={handleLogin}
                      className="flex items-center justify-center w-full p-3.5 text-sm font-medium text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg group relative overflow-hidden"
                      whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.5)" }}
                      whileTap={{ y: 0 }}
                    >
                      {/* Enhanced premium gradient background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500 rounded-xl -z-10"></div>
                      
                      {/* Enhanced subtle dot pattern overlay */}
                      <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,#ffffff00_1px)] [background-size:12px_12px] rounded-xl opacity-10 -z-10"></div>
                      
                      {/* Enhanced border glow */}
                      <div className="absolute inset-0 rounded-xl border border-white/20 -z-10"></div>
                      
                      {/* Enhanced shine effect on hover */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -z-10"
                        initial={{ x: "-100%", opacity: 0 }}
                        whileHover={{ x: "100%", opacity: 1 }}
                        transition={{ duration: 1 }}
                      />
                      
                      {/* Enhanced icon with premium styling */}
                      <motion.div 
                        whileHover={{ rotate: 10 }}
                        className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm mr-2.5 relative"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                        </svg>
                      </motion.div>
                      <span className="relative">Sign In</span>
                    </motion.button>
                    
                    {/* Enhanced create account button with premium glass styling */}
                    <motion.button
                      onClick={handleSignup}
                      className="flex items-center justify-center w-full p-3.5 text-sm font-medium rounded-xl transition-all duration-300 shadow-sm hover:shadow group relative overflow-hidden"
                      whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.1)" }}
                      whileTap={{ y: 0 }}
                    >
                      {/* Enhanced glass background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-50/80 to-purple-100/80 dark:from-purple-900/40 dark:to-purple-800/40 rounded-xl backdrop-blur-sm border border-purple-200/50 dark:border-purple-800/30 -z-10"></div>
                      
                      {/* Enhanced icon with premium styling */}
                      <motion.div 
                        whileHover={{ rotate: 10 }}
                        className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/90 to-purple-600/90 text-white mr-2.5 shadow-sm border border-purple-400/20 group-hover:from-purple-600 group-hover:to-purple-700 transition-all duration-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                        </svg>
                      </motion.div>
                      <span className="text-purple-700 dark:text-purple-300 group-hover:text-purple-900 dark:group-hover:text-purple-200 transition-colors duration-300">Create Account</span>
                    </motion.button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SlideInMenu;