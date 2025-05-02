// src/components/SingleNoteEditor.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';
import { motion } from 'framer-motion';

function SingleNoteEditor() {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isGuestMode } = useAuth();
  const { getNote, createNote, updateNote, isOffline } = useNotes();
  
  // State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Refs
  const isSavingRef = useRef(false);
  const saveTimeoutRef = useRef(null);
  const actualNoteIdRef = useRef(noteId);
  const hasBeenSavedRef = useRef(false); // Track if note has been saved at least once
  
  // Handle undefined noteId - redirect to new note ONLY if we're not already at /notes/new
  useEffect(() => {
    const path = location.pathname;
    if (noteId === undefined && path !== '/notes/new') {
      console.log("noteId is undefined and not on /notes/new, redirecting");
      navigate('/notes/new', { replace: true });
    }
  }, [noteId, navigate, location.pathname]);
  
  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
  
  // Reset state when redirected to /notes/new
  useEffect(() => {
    if (location.pathname === '/notes/new' && noteId === 'new') {
      console.log("Resetting editor state for new note");
      setTitle('');
      setContent('');
      actualNoteIdRef.current = null;
      hasBeenSavedRef.current = false;
    }
  }, [location.pathname, noteId]);
  
  // Initial load
  useEffect(() => {
    console.log("Initial load effect triggered with noteId:", noteId, "isGuestMode:", isGuestMode, "path:", location.pathname);
    
    // Check if we're on the /notes/new route
    if (location.pathname === '/notes/new') {
      console.log("On /notes/new route, loading empty editor");
      setTitle('');
      setContent('');
      actualNoteIdRef.current = null;
      hasBeenSavedRef.current = false;
      setError(null);
      setIsLoading(false);
      return;
    }
    
    // Skip loading if noteId is undefined
    if (noteId !== undefined) {
      loadNote();
    }
  }, [noteId, location.pathname]);
  
  // Load note function
  const loadNote = async () => {
    console.log("loadNote called - noteId:", noteId, "isGuestMode:", isGuestMode);
    setIsLoading(true);
    
    try {
      // Special handling for new note
      if (noteId === 'new') {
        console.log("This is a new note, resetting editor");
        setTitle('');
        setContent('');
        actualNoteIdRef.current = null;
        hasBeenSavedRef.current = false;
        setError(null);
        setIsLoading(false);
        return;
      }
      
      if (!noteId) {
        console.log("No noteId provided, cannot load note");
        setError('Invalid note ID');
        setIsLoading(false);
        return;
      }
      
      // Load existing note
      console.log("Trying to load note with ID:", noteId);
      const result = await getNote(noteId);
      
      if (result.success) {
        console.log("Note loaded successfully:", result.data);
        setTitle(result.data.title || '');
        setContent(result.data.content || '');
        actualNoteIdRef.current = noteId;
        hasBeenSavedRef.current = true; // Mark as saved since we're loading an existing note
        setError(null);
      } else {
        console.error('Note not found or error:', result.error);
        setError('Note not found. It may have been deleted.');
      }
    } catch (err) {
      console.error('Error loading note:', err);
      setError('Failed to load note. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // CRITICAL: Update URL without causing a component remount
  const updateUrlSilently = useCallback((newNoteId) => {
    console.log("Updating URL silently to:", newNoteId);
    if (window.history && newNoteId) {
      // This is the key - use history.replaceState instead of navigate
      window.history.replaceState(
        {}, 
        '', 
        `/notes/${newNoteId}`
      );
      actualNoteIdRef.current = newNoteId;
      hasBeenSavedRef.current = true; // Mark as saved after successful creation
      console.log('URL silently updated to:', newNoteId, 'actualNoteIdRef is now:', actualNoteIdRef.current);
    }
  }, []);
  
  // Handle title changes
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debounceSave(newTitle, content);
  };
  
  // Handle content changes
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    debounceSave(title, newContent);
  };
  
  // Animation transition to notes list
  const handleBackToNotes = () => {
    // If we have unsaved changes, save them before navigating away
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      
      // Force save if there are unsaved changes
      if (title || content) {
        const noteData = { title, content };
        
        if (!hasBeenSavedRef.current) {
          // This is a new note that hasn't been saved yet
          createNote(noteData)
            .then(result => {
              if (result.success) {
                console.log("Note created on navigation away");
              }
              navigate('/notes');
            })
            .catch(err => {
              console.error("Error creating note on navigation away:", err);
              navigate('/notes');
            });
          return;
        } else {
          // This is an existing note
          updateNote(actualNoteIdRef.current, noteData)
            .then(() => {
              navigate('/notes');
            })
            .catch(err => {
              console.error("Error updating note on navigation away:", err);
              navigate('/notes');
            });
          return;
        }
      }
    }
    
    // If no unsaved changes, just navigate back
    navigate('/notes');
  };
  
  // Debounced save
  const debounceSave = useCallback((newTitle, newContent) => {
    console.log("debounceSave called with title:", newTitle, "content length:", newContent?.length, 
      "hasBeenSaved:", hasBeenSavedRef.current, "actualNoteId:", actualNoteIdRef.current);
    
    // Skip empty notes
    if (!newTitle.trim() && !newContent.trim()) return;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        isSavingRef.current = true;
        setSaveStatus('Saving...');
        
        const noteData = { title: newTitle, content: newContent };
        
        // Check if this is a new note that hasn't been saved yet
        if (!hasBeenSavedRef.current) {
          console.log('Creating new note - has not been saved before');
          const result = await createNote(noteData);
          
          if (result.success) {
            console.log("Note created successfully with ID:", result.id);
            updateUrlSilently(result.id);
            setSaveStatus('Saved');
          } else {
            console.error("Failed to create note:", result.error);
            setSaveStatus('Failed to save');
          }
        } 
        // Updating existing note
        else {
          console.log('Updating existing note:', actualNoteIdRef.current);
          const result = await updateNote(actualNoteIdRef.current, noteData);
          setSaveStatus(result.success ? 'Saved' : 'Failed to save');
        }
      } catch (err) {
        console.error('Error saving note:', err);
        setSaveStatus('Error saving');
      } finally {
        isSavingRef.current = false;
        
        // Clear save status after a delay
        setTimeout(() => {
          setSaveStatus(null);
        }, 2000);
      }
    }, 800);
  }, [createNote, updateNote, updateUrlSilently]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen pt-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-4 text-center">Loading note...</p>
          </div>
        </motion.div>
      </div>
    );
  }
  
  if (error && !title && !content) {
    return (
      <div className="pt-20 max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-red-700 dark:text-red-400">
            <p>{error}</p>
            <button 
              onClick={handleBackToNotes}
              className="mt-2 text-sm underline"
            >
              Back to Notes
            </button>
          </div>
        </motion.div>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="pt-16 h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 font-inter overflow-hidden"
    >
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="fixed top-20 left-4 z-10"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleBackToNotes}
          className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <span>Back</span>
        </motion.button>
      </motion.div>
      
      {/* Status indicator */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-10"
      >
        <div className="flex items-center space-x-2 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-full px-3 py-1 text-xs">
          {isOffline && (
            <span className="text-yellow-600 dark:text-yellow-400 font-medium">
              Offline Mode
            </span>
          )}
          
          {isGuestMode && (
            <span className="text-purple-600 dark:text-purple-400 font-medium">
              Guest Mode
            </span>
          )}
          
          {isSavingRef.current && (
            <span className="text-gray-500 dark:text-gray-400">
              Saving...
            </span>
          )}
          
          {!isSavingRef.current && saveStatus && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-500 dark:text-gray-400"
            >
              {saveStatus}
            </motion.span>
          )}
        </div>
      </motion.div>
      
      {/* Editor inputs */}
      <div className="flex justify-center pt-16 px-4">
        <div className="w-full max-w-2xl">
          {/* Title input */}
          <motion.input
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Note title..."
            className="w-full p-2 mb-2 bg-transparent text-gray-900 dark:text-white text-2xl font-bold focus:outline-none"
            autoFocus={location.pathname === '/notes/new'}
          />
          
          {/* Content textarea */}
          <motion.textarea
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            value={content}
            onChange={handleContentChange}
            placeholder="Write freely..."
            className="w-full h-[70vh] p-2 bg-transparent text-gray-800 dark:text-gray-200 placeholder:text-gray-400/90 dark:placeholder:text-gray-500/90 text-base sm:text-lg font-normal leading-relaxed sm:leading-loose focus:outline-none resize-none"
          />
        </div>
      </div>
    </motion.div>
  );
}

export default SingleNoteEditor;