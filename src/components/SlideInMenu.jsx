// src/components/SlideInMenu.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';
import { signOut } from 'firebase/auth'; // Direct import of Firebase signOut
import { auth } from '../firebaseConfig'; // Direct import of auth

const SlideInMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, isGuestMode } = useAuth(); // Added isGuestMode
  const { trashedNotes } = useNotes();
  const location = useLocation();
  const navigate = useNavigate();
  const [userInitial, setUserInitial] = useState('');

  // Extract user initial for avatar
  useEffect(() => {
    if (currentUser?.email) {
      setUserInitial(currentUser.email.charAt(0).toUpperCase());
    }
  }, [currentUser]);

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

  // Stop clicks inside the menu from closing it
  const handleMenuClick = (e) => {
    e.stopPropagation();
  };

  // Full page list for authenticated users
  const authenticatedPages = [
    {
      to: '/notes',
      label: 'Notes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
      ),
    },
    {
      to: '/trash',
      label: 'Trash',
      showBadge: trashedNotes?.length > 0,
      badgeCount: trashedNotes?.length || 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      ),
    },
    {
      to: '/settings',
      label: 'Settings',
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
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
        </svg>
      ),
    },
    {
      to: '/notes',
      label: 'Notes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
      ),
    },
  ];

  // Use appropriate pages based on user status
  const pages = currentUser ? authenticatedPages : (isGuestMode ? guestPages : []);

  return (
    <>
      {/* Menu toggle button - with improved animation */}
      <motion.button 
        className="fixed top-3 left-3 z-50 p-2 rounded-full focus:outline-none bg-white/90 dark:bg-gray-800/90 shadow-md backdrop-blur-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
        onClick={toggleMenu}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </motion.button>
      
      {/* Backdrop - covers the screen and closes menu when clicked */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={closeMenu}
          />
        )}
      </AnimatePresence>
      
      {/* Side menu - with improved styling */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-gray-800 shadow-xl overflow-hidden"
            onClick={handleMenuClick}
          >
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-br from-purple-600/20 via-pink-500/10 to-blue-500/20 dark:from-purple-900/20 dark:via-pink-800/10 dark:to-blue-900/20 z-0"></div>
            <div className="absolute -top-16 -left-16 w-40 h-40 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 dark:from-purple-500/10 dark:to-blue-500/10 blur-xl z-0"></div>
            <div className="absolute -bottom-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 dark:from-pink-500/10 dark:to-purple-500/10 blur-xl z-0"></div>
            
            {/* Content container */}
            <div className="relative z-10 flex flex-col h-full">
              {/* Header */}
              <div className="px-5 py-6 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-br from-purple-600 to-blue-500 text-white p-2 rounded-xl shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h1 className="ml-3 text-xl font-bold bg-gradient-to-br from-purple-700 to-blue-500 bg-clip-text text-transparent dark:from-purple-300 dark:to-blue-400">
                    NoteSphere
                  </h1>
                </div>
                <motion.button
                  onClick={closeMenu}
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
              
              {/* User info with beautiful gradient avatar - Only show for authenticated users */}
              {currentUser && (
                <div className="px-5 pt-2 pb-6">
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {userInitial}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">
                        {currentUser?.email}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Logged in
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Guest mode banner - Only show for guest users */}
              {isGuestMode && !currentUser && (
                <div className="px-5 pt-2 pb-6">
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 dark:text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-2 font-medium text-purple-700 dark:text-purple-300">Guest Mode</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      For features like trash, settings, and cloud sync, please create an account or log in.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Divider */}
              <div className="mx-5 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div>
              
              {/* Navigation links */}
              <nav className="flex-1 px-3 py-4">
                <ul className="space-y-1.5">
                  {pages.map((page) => (
                    <li key={page.to}>
                      <Link
                        to={page.to}
                        className={`flex items-center justify-between w-full p-3 rounded-xl transition-all duration-200 ${
                          location.pathname === page.to || (page.to !== '/' && location.pathname.startsWith(page.to))
                            ? 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 shadow-sm'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                        }`}
                        onClick={closeMenu}
                      >
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 p-1 rounded-lg ${
                            location.pathname === page.to || (page.to !== '/' && location.pathname.startsWith(page.to))
                              ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-sm'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {page.icon}
                          </div>
                          <div className="ml-3 font-medium">{page.label}</div>
                        </div>
                        
                        {/* Badge for trash if it has items */}
                        {page.showBadge && page.badgeCount > 0 && (
                          <motion.div 
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full px-2.5 py-1 flex items-center justify-center min-w-[24px] shadow-sm"
                          >
                            {page.badgeCount > 99 ? '99+' : page.badgeCount}
                          </motion.div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Feature list for guest users */}
              {isGuestMode && !currentUser && (
                <div className="px-5 py-3 mb-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Create an account to:</h3>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Sync notes across devices
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Access trash for deleted notes
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Customize app settings
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Never lose your notes
                    </li>
                  </ul>
                </div>
              )}
              
              {/* App version info */}
              <div className="px-5 py-2">
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  NoteSphere v1.0.0
                </div>
              </div>
              
              {/* Logout button for authenticated users */}
              {currentUser && (
                <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700">
                  <motion.button
                    onClick={handleLogout}
                    className="flex items-center w-full p-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors duration-200"
                    whileHover={{ x: 5 }}
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                    </svg>
                    Logout
                  </motion.button>
                </div>
              )}

              {/* Login/Signup buttons for guest users */}
              {isGuestMode && !currentUser && (
                <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <motion.button
                    onClick={handleLogin}
                    className="flex items-center justify-center w-full p-3 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 rounded-xl transition-colors duration-200 shadow-sm"
                    whileHover={{ y: -2 }}
                    whileTap={{ y: 0 }}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                    </svg>
                    Log In
                  </motion.button>
                  
                  <motion.button
                    onClick={handleSignup}
                    className="flex items-center justify-center w-full p-3 text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-xl transition-colors duration-200 shadow-sm"
                    whileHover={{ y: -2 }}
                    whileTap={{ y: 0 }}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                    </svg>
                    Create Account
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SlideInMenu;