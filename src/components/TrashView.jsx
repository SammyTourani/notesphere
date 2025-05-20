import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotes } from '../context/NotesContext';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from './PageTransition';

function TrashView() {
  const { trashedNotes, loading, error, restoreFromTrash, deleteNotePermanently, emptyTrash } = useNotes();
  const [sortedNotes, setSortedNotes] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const [hoveredNoteId, setHoveredNoteId] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  const navigate = useNavigate();

  // Sort notes by deletion date when trashedNotes changes
  useEffect(() => {
    if (!trashedNotes || trashedNotes.length === 0) {
      setSortedNotes([]);
      return;
    }
    
    // Sort by deletedAt timestamp, most recent first
    const sorted = [...trashedNotes].sort((a, b) => {
      const dateA = a.deletedAt ? new Date(a.deletedAt) : new Date(0);
      const dateB = b.deletedAt ? new Date(b.deletedAt) : new Date(0);
      return dateB - dateA;
    });
    
    setSortedNotes(sorted);
  }, [trashedNotes]);
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      
      // If date is today, show time only
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      
      // If date is yesterday
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      
      // Otherwise show date and time
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
        ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Unknown date';
    }
  };
  
  // Calculate days remaining before permanent deletion
  const getDaysRemaining = (dateString) => {
    if (!dateString) return null;
    
    try {
      const deletedDate = new Date(dateString);
      const expiryDate = new Date(deletedDate);
      expiryDate.setDate(deletedDate.getDate() + 30);
      
      const today = new Date();
      const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      return daysRemaining;
    } catch (e) {
      return null;
    }
  };
  
  // Handle navigation back to notes
  const handleBackToNotes = () => {
    navigate('/notes');
  };
  
  // Open delete confirmation modal for a single note
  const openDeleteModal = (note) => {
    setNoteToDelete(note);
    setDeleteModalOpen(true);
  };
  
  // Open delete all confirmation modal
  const openDeleteAllModal = () => {
    setDeleteAllModalOpen(true);
  };
  
  // Handle confirmed single note deletion
  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    
    setDeletingId(noteToDelete.id);
    setDeleteModalOpen(false);
    
    try {
      await deleteNotePermanently(noteToDelete.id);
    } catch (err) {
      console.error('Error permanently deleting note:', err);
    } finally {
      setDeletingId(null);
      setNoteToDelete(null);
    }
  };
  
  // Handle confirmed empty trash
  const handleConfirmEmptyTrash = async () => {
    setDeleteAllModalOpen(false);
    
    try {
      await emptyTrash();
    } catch (err) {
      console.error('Error emptying trash:', err);
    }
  };
  
  // Handle note restoration
  const handleRestore = async (noteId) => {
    try {
      setDeletingId(noteId);
      await restoreFromTrash(noteId);
    } catch (err) {
      console.error('Error restoring note:', err);
    } finally {
      setDeletingId(null);
    }
  };
  
  // Helper function to strip HTML tags for preview
  const stripHtml = (html) => {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };
  
  // Get note excerpt for preview - handles HTML content
  const getExcerpt = (content, maxLength = 120) => {
    if (!content) return '';
    
    // Strip HTML tags
    const textContent = stripHtml(content);
    
    if (textContent.length <= maxLength) return textContent;
    
    // Find the last complete word within the limit
    return textContent.substring(0, maxLength).split(' ').slice(0, -1).join(' ') + '...';
  };

  // Variants for different animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100
      }
    },
    exit: { 
      opacity: 0, 
      x: -300,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 100
      }
    }
  };

  const progressVariants = {
    hidden: { width: 0 },
    visible: (custom) => ({
      width: `${100 - (custom / 30) * 100}%`,
      transition: { duration: 0.8, ease: "easeOut" }
    })
  };

  // Enhanced loading state with animation
  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="pt-16 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex justify-center items-start"
      >
        <div className="mt-20 flex flex-col items-center">
          <motion.div 
            className="relative w-20 h-20"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              animate={{ 
                opacity: [0.5, 1, 0.5],
                scale: [0.95, 1.05, 0.95],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut" 
              }}
              className="absolute inset-0 bg-purple-500/20 dark:bg-purple-500/30 rounded-full blur-xl"
            />
            <svg className="animate-spin h-20 w-20 text-purple-600 dark:text-purple-400 relative" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-gray-600 dark:text-gray-300 mt-6 text-center font-medium text-lg"
          >
            Loading your trash...
          </motion.p>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "120px" }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="h-0.5 bg-purple-500/50 dark:bg-purple-400/50 mt-4 rounded-full"
          />
        </div>
      </motion.div>
    );
  }
  
  return (
    <PageTransition>
      <div className="pt-16 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Page backdrop with subtle pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/5 to-blue-50/5 dark:from-purple-900/10 dark:to-blue-900/10 z-0 pointer-events-none" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iLjAyIj48cGF0aCBkPSJNMzYgMzRjMC0yLjItMS44LTQtNC00cy00IDEuOC00IDQgMS44IDQgNCA0IDQtMS44IDQtNHptMC0zMGMwLTIuMi0xLjgtNC00LTRzLTQgMS44LTQgNCAxLjggNCA0IDQgNC0xLjggNC00em0wIDYwYzAtMi4yLTEuOC00LTQtNHMtNCAxLjgtNCA0IDEuOCA0IDQgNCA0LTEuOCA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30 dark:opacity-20 z-0 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
          {/* Header with animations */}
          <motion.div 
            className="flex flex-col sm:flex-row justify-between items-center mb-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center mb-4 sm:mb-0">
              <motion.button
                onClick={handleBackToNotes}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="mr-4 p-2.5 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm hover:shadow-md text-gray-600 dark:text-gray-300 transition-all duration-200 border border-gray-200/50 dark:border-gray-700/50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </motion.button>
              
              <div className="flex items-center">
                <motion.div 
                  className="relative p-2.5 rounded-full bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 mr-3.5 shadow-sm border border-red-200/50 dark:border-red-800/50 group"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.div
                    animate={{ 
                      opacity: [0, 0.3, 0],
                      scale: [0.8, 1.2, 0.8], 
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-red-400/20 dark:bg-red-400/20 rounded-full blur-md -z-10"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </motion.div>
                <div>
                  <motion.h1 
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 dark:from-red-500 dark:to-red-400 bg-clip-text text-transparent"
                  >
                    Trash
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    className="text-sm text-gray-500 dark:text-gray-400"
                  >
                    Items will be permanently deleted after 30 days
                  </motion.p>
                </div>
              </div>
            </div>
            
            {/* Empty trash button with animation */}
            {sortedNotes.length > 0 && (
              <motion.button
                onClick={openDeleteAllModal}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: "0 4px 20px rgba(239, 68, 68, 0.25)"
                }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2.5 font-medium border border-red-500/20"
              >
                <motion.span
                  initial={{ rotate: 0 }}
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </motion.span>
                <span>Empty Trash</span>
              </motion.button>
            )}
          </motion.div>
          
          {/* Error display with animation */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100/80 dark:from-red-900/20 dark:to-red-800/20 text-red-800 dark:text-red-300 rounded-xl shadow-sm border border-red-200/50 dark:border-red-800/30 backdrop-blur-sm"
            >
              <div className="flex items-center">
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 relative text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </motion.div>
                <motion.span 
                  initial={{ opacity: 0, x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="ml-2.5 font-medium"
                >
                  {error}
                </motion.span>
              </div>
            </motion.div>
          )}
          
          {/* Empty state with animations */}
          {sortedNotes.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center py-16 bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-md border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm"
            >
              <div className="max-w-md mx-auto px-4">
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.2 
                  }}
                  className="relative w-24 h-24 mx-auto mb-8"
                >
                  <motion.div
                    animate={{ 
                      opacity: [0.3, 0.5, 0.3],
                      scale: [0.9, 1.05, 0.9],
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut" 
                    }}
                    className="absolute inset-0 bg-red-400/10 dark:bg-red-400/20 rounded-full blur-xl"
                  />
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center relative border border-gray-200/50 dark:border-gray-700/50 shadow-inner">
                    <motion.svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-12 w-12 text-gray-400 dark:text-gray-500" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      initial={{ rotate: -10 }}
                      animate={{ rotate: 0 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 100 
                      }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </motion.svg>
                  </div>
                </motion.div>
                <motion.h2 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2"
                >
                  Your trash is empty
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  className="text-gray-500 dark:text-gray-400 mb-8"
                >
                  Deleted notes will appear here for 30 days before being permanently removed
                </motion.p>
                <motion.button
                  onClick={handleBackToNotes}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  whileHover={{ 
                    scale: 1.03, 
                    y: -2,
                    boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.4)"
                  }}
                  whileTap={{ scale: 0.97 }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                >
                  Back to Notes
                </motion.button>
              </div>
            </motion.div>
          ) : (
            // Notes list with animations - FIX: Changed AnimatePresence mode to "popLayout"
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {/* FIX: Removed the wait mode from AnimatePresence */}
              <AnimatePresence mode="popLayout">
                {sortedNotes.map((note, index) => {
                  const daysRemaining = getDaysRemaining(note.deletedAt);
                  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7;
                  const isHovered = hoveredNoteId === note.id;
                  
                  return (
                    <motion.div
                      key={note.id}
                      custom={index}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      layoutId={`note-${note.id}`}
                      onMouseEnter={() => setHoveredNoteId(note.id)}
                      onMouseLeave={() => setHoveredNoteId(null)}
                      className="bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-sm hover:shadow-md border border-gray-200/60 dark:border-gray-700/60 overflow-hidden transition-all duration-300 backdrop-blur-sm relative"
                    >
                      {/* Background decoration for hover effect */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-red-50/40 to-red-100/40 dark:from-red-900/20 dark:to-red-800/20 -z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isHovered ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                      />
                      
                      <div className="px-5 py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-grow pr-4">
                            <motion.h3 
                              className="text-lg font-semibold text-gray-900 dark:text-white mb-1.5 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors duration-200"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              {note.title || 'Untitled Note'}
                            </motion.h3>
                            <motion.p 
                              className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2.5"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3, delay: 0.1 }}
                            >
                              {getExcerpt(note.content)}
                            </motion.p>
                            
                            <div className="flex flex-wrap items-center text-xs text-gray-500 dark:text-gray-400 gap-3">
                              <motion.span 
                                className="flex items-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Deleted {formatDate(note.deletedAt)}
                              </motion.span>
                              
                              {isExpiringSoon && (
                                <motion.span 
                                  className="flex items-center bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full text-xs font-medium"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ 
                                    opacity: 1, 
                                    scale: daysRemaining <= 3 ? [1, 1.05, 1] : 1 
                                  }}
                                  transition={{ 
                                    duration: 0.3, 
                                    delay: 0.25,
                                    scale: {
                                      repeat: daysRemaining <= 3 ? Infinity : 0,
                                      duration: 1.5
                                    }
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  {daysRemaining <= 0 ? 'Expiring today' : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left`}
                                </motion.span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2.5">
                            {/* Restore button */}
                            <motion.button
                              onClick={() => handleRestore(note.id)}
                              disabled={deletingId === note.id}
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.95 }}
                              className="relative p-2.5 rounded-full text-blue-600 dark:text-blue-400 transition-colors duration-200 overflow-hidden"
                              aria-label="Restore note"
                            >
                              {/* Button glow effect */}
                              <motion.div 
                                className="absolute inset-0 rounded-full bg-blue-100 dark:bg-blue-900/30 opacity-0"
                                animate={{ opacity: hoveredButton === 'restore-' + note.id ? 0.8 : 0 }}
                                transition={{ duration: 0.2 }}
                                onMouseEnter={() => setHoveredButton('restore-' + note.id)}
                                onMouseLeave={() => setHoveredButton(null)}
                              />
                              
                              <div className="relative z-10">
                                {deletingId === note.id ? (
                                  <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-blue-600 dark:border-blue-400 animate-spin" />
                                ) : (
                                  <motion.svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    className="h-5 w-5" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                    whileHover={{ rotate: 180 }}
                                    transition={{ duration: 0.4 }}
                                    onMouseEnter={() => setHoveredButton('restore-' + note.id)}
                                    onMouseLeave={() => setHoveredButton(null)}
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </motion.svg>
                                )}
                              </div>
                            </motion.button>
                            
                            {/* Delete button */}
                            <motion.button
                              onClick={() => openDeleteModal(note)}
                              disabled={deletingId === note.id}
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.95 }}
                              className="relative p-2.5 rounded-full text-red-600 dark:text-red-400 transition-colors duration-200 overflow-hidden"
                              aria-label="Delete permanently"
                            >
                              {/* Button glow effect */}
                              <motion.div 
                                className="absolute inset-0 rounded-full bg-red-100 dark:bg-red-900/30 opacity-0"
                                animate={{ opacity: hoveredButton === 'delete-' + note.id ? 0.8 : 0 }}
                                transition={{ duration: 0.2 }}
                                onMouseEnter={() => setHoveredButton('delete-' + note.id)}
                                onMouseLeave={() => setHoveredButton(null)}
                              />
                              
                              <div className="relative z-10">
                                {deletingId === note.id ? (
                                  <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-red-600 dark:border-red-400 animate-spin" />
                                ) : (
                                  <motion.svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    className="h-5 w-5" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                    whileHover={{ scale: [1, 1.2, 0.9, 1.1, 1] }}
                                    transition={{ duration: 0.5 }}
                                    onMouseEnter={() => setHoveredButton('delete-' + note.id)}
                                    onMouseLeave={() => setHoveredButton(null)}
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </motion.svg>
                                )}
                              </div>
                            </motion.button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Animated progress bar */}
                      {daysRemaining !== null && (
                        <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                          <motion.div 
                            className={`h-full ${
                              daysRemaining <= 3 
                                ? 'bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700' 
                                : daysRemaining <= 7
                                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700'
                                  : 'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700'
                            }`}
                            variants={progressVariants}
                            initial="hidden"
                            animate="visible"
                            custom={daysRemaining}
                          >
                            {/* Static subtle highlight */}
                            {isHovered && (
                              <motion.div 
                                className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                              />
                            )}
                          </motion.div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
        
        {/* Confirmation modals */}
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title={noteToDelete?.title}
          isPermanent={true}
        />
        
        <DeleteConfirmationModal
          isOpen={deleteAllModalOpen}
          onClose={() => setDeleteAllModalOpen(false)}
          onConfirm={handleConfirmEmptyTrash}
          title="all items"
          isPermanent={true}
          isEmptyTrash={true}
        />
      </div>
    </PageTransition>
  );
}

export default TrashView;