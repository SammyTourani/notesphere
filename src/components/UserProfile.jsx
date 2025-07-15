import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useTheme } from '../context/ThemeContext';

// Avatar options from onboarding
const AVATAR_OPTIONS = [
  {
    id: 1,
    name: 'Classic',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=classic&backgroundColor=b6e3f4',
    color: 'bg-blue-500'
  },
  {
    id: 2,
    name: 'Professional',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=professional&backgroundColor=d1d4f9',
    color: 'bg-indigo-500'
  },
  {
    id: 3,
    name: 'Creative',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=creative&backgroundColor=c0aede',
    color: 'bg-purple-500'
  },
  {
    id: 4,
    name: 'Explorer',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=explorer&backgroundColor=ffdfbf',
    color: 'bg-orange-500'
  },
  {
    id: 5,
    name: 'Minimalist',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=minimalist&backgroundColor=bde4a8',
    color: 'bg-green-500'
  },
  {
    id: 6,
    name: 'Artistic',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=artistic&backgroundColor=ffd5dc',
    color: 'bg-pink-500'
  },
  {
    id: 7,
    name: 'Scholar',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=scholar&backgroundColor=f9d6c4',
    color: 'bg-amber-500'
  },
  {
    id: 8,
    name: 'Techie',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=techie&backgroundColor=c4e6f9',
    color: 'bg-cyan-500'
  },
  {
    id: 9,
    name: 'Mystic',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=mystic&backgroundColor=d8c4f9',
    color: 'bg-violet-500'
  },
  {
    id: 10,
    name: 'Custom',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=custom&backgroundColor=ffd5dc',
    color: 'bg-rose-500'
  }
];

// Usage preference options - matches onboarding exactly
const USAGE_OPTIONS = [
  {
    id: 'personal',
    name: 'Personal',
    label: 'Personal Notes',
    description: 'For your personal notes and tasks',
    color: 'bg-gradient-to-br from-blue-400 to-indigo-500'
  },
  {
    id: 'work',
    name: 'Work',
    label: 'Work Notes',
    description: 'For work-related projects and tasks',
    color: 'bg-gradient-to-br from-green-400 to-teal-500'
  },
  {
    id: 'education',
    name: 'Education',
    label: 'Study Notes',
    description: 'For studying and learning',
    color: 'bg-gradient-to-br from-purple-400 to-pink-500'
  },
  {
    id: 'creative',
    name: 'Creative',
    label: 'Creative Writing',
    description: 'For artistic projects and ideas',
    color: 'bg-gradient-to-br from-yellow-400 to-orange-500'
  }
];

// Theme options matching onboarding
const THEME_OPTIONS = [
  {
    id: 'light',
    name: 'Light Mode',
    color: 'bg-gradient-to-br from-yellow-300 to-orange-400',
    background: 'bg-white',
    text: 'text-gray-900'
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    color: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    background: 'bg-gray-900',
    text: 'text-white'
  },
  {
    id: 'auto',
    name: 'System Default',
    color: 'bg-gradient-to-br from-gray-400 to-blue-500',
    background: 'bg-gradient-to-br from-gray-100 to-white dark:from-gray-900 dark:to-gray-800',
    text: 'text-gray-900 dark:text-white'
  }
];

// Profanity filter for name input
const PROFANITY_LIST = [
  'fuck', 'shit', 'ass', 'bitch', 'cunt', 'dick', 'cock', 'pussy',
  'whore', 'slut', 'bastard', 'damn', 'hell', 'piss', 'nsfw',
  'asshole', 'bullshit', 'motherfucker', 'fuckoff', 'dickhead',
  'twat', 'prick', 'bollocks', 'wanker', 'crap', 'bugger'
];

// Enhanced utility to check for profanity
const containsProfanity = (text) => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return PROFANITY_LIST.some(word => lowerText.includes(word));
};

const UserProfile = () => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const { notes, trashedNotes } = useNotes();
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(THEME_OPTIONS[0]);
  const [usagePreferences, setUsagePreferences] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [nameError, setNameError] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [usageError, setUsageError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  // Initialize form with current user data
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.displayName || '');
      
      // Find avatar by URL
      const avatarOption = AVATAR_OPTIONS.find(
        avatar => avatar.image === userProfile.photoURL
      );
      setSelectedAvatar(avatarOption || AVATAR_OPTIONS[0]);
      
      // Find theme by ID
      const themeOption = THEME_OPTIONS.find(
        theme => theme.id === userProfile.theme
      );
      setSelectedTheme(themeOption || THEME_OPTIONS[0]);
      
      // Set usage preferences
      setUsagePreferences(userProfile.usagePreferences || []);
    }
  }, [userProfile]);

  // Toggle edit mode
  const handleEditToggle = () => {
    if (isEditing) {
      // If canceling edit, reset to original values
      if (userProfile) {
        setName(userProfile.displayName || '');
        const avatarOption = AVATAR_OPTIONS.find(
          avatar => avatar.image === userProfile.photoURL
        );
        setSelectedAvatar(avatarOption || AVATAR_OPTIONS[0]);
        const themeOption = THEME_OPTIONS.find(
          theme => theme.id === userProfile.theme
        );
        setSelectedTheme(themeOption || THEME_OPTIONS[0]);
        setUsagePreferences(userProfile.usagePreferences || []);
      }
      // Clear any errors
      setNameError('');
      setAvatarError('');
      setUsageError('');
    }
    setIsEditing(!isEditing);
  };

  // Handle avatar selection
  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar);
    setAvatarError('');
  };

  // Handle name change
  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    
    // Validate name
    if (newName.trim() === '') {
      setNameError('Name cannot be empty');
    } else if (containsProfanity(newName)) {
      setNameError('Please use appropriate language');
    } else if (newName.length > 30) {
      setNameError('Name must be 30 characters or less');
    } else {
      setNameError('');
    }
  };

  // Handle theme selection
  const handleThemeSelect = (theme) => {
    setSelectedTheme(theme);
  };

  // Handle usage preference toggle
  const handleUsageToggle = (usageId) => {
    setUsagePreferences(prev => {
      if (prev.includes(usageId)) {
        return prev.filter(id => id !== usageId);
      } else {
        return [...prev, usageId];
      }
    });
    setUsageError('');
  };

  // Save profile changes
  const handleSave = async () => {
    // Validate all fields
    let hasError = false;
    
    if (name.trim() === '') {
      setNameError('Name cannot be empty');
      hasError = true;
    }
    
    if (!selectedAvatar) {
      setAvatarError('Please select an avatar');
      hasError = true;
    }
    
    if (usagePreferences.length === 0) {
      setUsageError('Please select at least one usage preference');
      hasError = true;
    }
    
    if (hasError) return;
    
    setIsSaving(true);
    
    try {
      const updateData = {
        displayName: name.trim(),
        photoURL: selectedAvatar.image,
        theme: selectedTheme.id,
        usagePreferences: usagePreferences,
        updatedAt: new Date().toISOString()
      };
      
      // Update Firestore document
      if (currentUser) {
        await updateDoc(doc(db, "userProfiles", currentUser.uid), updateData);
      }
      
      // Update context
      await updateUserProfile(updateData);
      
      // Show success message
      setShowSavedMessage(true);
      setTimeout(() => setShowSavedMessage(false), 3000);
      
      // Exit edit mode
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Go back to previous page
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen py-12 sm:py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-8">
          <motion.button
            onClick={handleBack}
            className="p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300"
            whileHover={{ scale: 1.05, x: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </motion.button>
          
          <motion.h1 
            className="text-2xl font-bold text-gray-800 dark:text-white text-center flex-1"
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            Your Profile
          </motion.h1>
          
          <motion.button
            onClick={handleEditToggle}
            className={`p-2 rounded-full ${isEditing 
              ? 'bg-gray-200/80 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300' 
              : 'bg-purple-100/80 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'} 
              backdrop-blur-sm shadow-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-purple-600/90 hover:text-white transition-all duration-300`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isEditing ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
            )}
          </motion.button>
        </div>
        
        {/* Profile card */}
        <motion.div 
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/30 overflow-hidden"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
        >
          {/* Profile header with large avatar */}
          <div className="relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/80 to-blue-500/80 h-40"></div>
            
            {/* Decorative pattern */}
            <div className="absolute inset-0 h-40 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
            
            {/* Avatar container */}
            <div className="relative pt-16 pb-10 px-6 flex flex-col items-center">
              <motion.div 
                className="relative mb-3"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
              >
                {/* Glowing effect behind avatar */}
                <motion.div 
                  className="absolute -inset-4 rounded-full bg-white/30 dark:bg-white/10 blur-md"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    opacity: [0.5, 0.7, 0.5] 
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                ></motion.div>
                
                {/* Avatar image */}
                <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg">
                  <img 
                    src={selectedAvatar?.image || (userProfile?.photoURL || AVATAR_OPTIONS[0].image)}
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Edit overlay for avatar */}
                {isEditing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </div>
                )}
              </motion.div>
              
              {/* Name display or edit */}
              <div className="text-center mb-1">
                {isEditing ? (
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={handleNameChange}
                      className={`text-xl font-semibold px-4 py-2 rounded-lg bg-white/90 dark:bg-gray-700/90 border ${
                        nameError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent outline-none text-center text-gray-900 dark:text-white`}
                      placeholder="Your name"
                      maxLength={30}
                    />
                    {nameError && (
                      <motion.p 
                        className="text-red-500 text-xs mt-1 absolute inset-x-0 -bottom-6"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {nameError}
                      </motion.p>
                    )}
                  </div>
                ) : (
                  <motion.h2 
                    className="text-2xl font-bold text-gray-900 dark:text-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {userProfile?.displayName || 'User'}
                  </motion.h2>
                )}
              </div>
              
              {/* Email (non-editable) */}
              <motion.p 
                className="text-sm text-gray-600 dark:text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {currentUser?.email || 'No email'}
              </motion.p>
              
              {/* Account Statistics */}
              <motion.div 
                className="mt-6 grid grid-cols-3 gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="text-center">
                  <motion.div 
                    className="text-2xl font-bold text-purple-600 dark:text-purple-400"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                  >
                    {notes?.length || 0}
                  </motion.div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Notes</div>
                </div>
                <div className="text-center">
                  <motion.div 
                    className="text-2xl font-bold text-red-500 dark:text-red-400"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: 0.5 }}
                  >
                    {trashedNotes?.length || 0}
                  </motion.div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">In Trash</div>
                </div>
                <div className="text-center">
                  <motion.div 
                    className="text-2xl font-bold text-green-600 dark:text-green-400"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: 1 }}
                  >
                    {userProfile?.createdAt ? Math.floor((new Date() - new Date(userProfile.createdAt.seconds * 1000)) / (1000 * 60 * 60 * 24)) || 0 : 0}
                  </motion.div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Days Active</div>
                </div>
              </motion.div>
              
              {/* Join Date */}
              {userProfile?.createdAt && (
                <motion.div 
                  className="mt-4 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Member since {new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
          
          {/* Avatar selection (only in edit mode) */}
          <AnimatePresence>
            {isEditing && (
              <motion.div 
                className="px-6 py-4 border-t border-gray-200 dark:border-gray-700"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Select Avatar</h3>
                
                <div className="grid grid-cols-5 gap-4">
                  {AVATAR_OPTIONS.map((avatar) => (
                    <motion.div
                      key={avatar.id}
                      className={`relative rounded-xl overflow-hidden cursor-pointer border-2 ${
                        selectedAvatar?.id === avatar.id 
                          ? 'border-purple-500 dark:border-purple-400 shadow-lg' 
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAvatarSelect(avatar)}
                    >
                      <img 
                        src={avatar.image} 
                        alt={avatar.name}
                        className="w-full h-16 object-cover"
                      />
                      
                      {/* Selected indicator */}
                      {selectedAvatar?.id === avatar.id && (
                        <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                          <div className="bg-purple-500 text-white p-1 rounded-full">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
                
                {avatarError && (
                  <motion.p 
                    className="text-red-500 text-xs mt-2"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {avatarError}
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Theme preferences section */}
          <div className="px-6 py-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Theme Preference
              </h3>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {THEME_OPTIONS.map((theme) => (
                <motion.div
                  key={theme.id}
                  className={`rounded-xl p-4 cursor-pointer border-2 transition-all duration-200 ${
                    selectedTheme.id === theme.id
                      ? 'border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                  } ${!isEditing ? 'opacity-60' : ''}`}
                  whileHover={isEditing ? { scale: 1.03, y: -2 } : {}}
                  onClick={() => isEditing && handleThemeSelect(theme)}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-8 h-8 rounded-full ${theme.color} mb-2 flex items-center justify-center`}>
                      {theme.id === 'light' && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                        </svg>
                      )}
                      {theme.id === 'dark' && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                        </svg>
                      )}
                      {theme.id === 'auto' && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {theme.name}
                    </span>
                    {selectedTheme.id === theme.id && (
                      <motion.div 
                        className="mt-2 bg-purple-500 text-white p-1 rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Usage preferences */}
          <div className="px-6 py-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                What you use NoteSphere for
              </h3>
              
              {isEditing && usageError && (
                <motion.p 
                  className="text-red-500 text-xs"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {usageError}
                </motion.p>
              )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {USAGE_OPTIONS.map((option) => (
                <motion.div
                  key={option.id}
                  className={`rounded-xl p-3 ${
                    usagePreferences.includes(option.id)
                      ? 'bg-purple-100 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-700/50 text-purple-700 dark:text-purple-300'
                      : 'bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 text-gray-700 dark:text-gray-300'
                  } ${isEditing ? 'cursor-pointer' : ''}`}
                  whileHover={isEditing ? { scale: 1.03, y: -2 } : {}}
                  onClick={() => isEditing && handleUsageToggle(option.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{option.label}</span>
                    
                    {usagePreferences.includes(option.id) && (
                      <motion.div 
                        className="bg-purple-500 dark:bg-purple-400 text-white p-1 rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Quick Settings Section */}
          <div className="px-6 py-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Account Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Last Login */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Last Active</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Today</div>
                  </div>
                </div>
              </div>
              
              {/* Account Type */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Account Type</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Free User</div>
                  </div>
                </div>
              </div>
              
              {/* Storage Used */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Storage</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{((notes?.length || 0) * 0.5).toFixed(1)} KB used</div>
                  </div>
                </div>
              </div>
              
              {/* Language */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Language</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">English (US)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Save button (only in edit mode) */}
          <AnimatePresence>
            {isEditing && (
              <motion.div 
                className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <motion.button
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500 text-white rounded-xl shadow-md flex items-center space-x-2 hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                  disabled={isSaving || !!nameError || !!avatarError || usagePreferences.length === 0}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span>Save Changes</span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Success message */}
        <AnimatePresence>
          {showSavedMessage && (
            <motion.div 
              className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span>Profile updated successfully!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default UserProfile;