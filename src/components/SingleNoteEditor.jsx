import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';
import { motion } from 'framer-motion';

function SingleNoteEditor() {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
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
  const isNewNoteProcessed = useRef(false); // Track if we've already processed a new note
  
  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
  
  // Initial load
  useEffect(() => {
    loadNote();
  }, []);
  
  // Handle URL parameter changes - only reload if it's a genuinely different note
  useEffect(() => {
    // Don't reload if we're staying on the same note or if we're on a new note
    // that has been processed (actualNoteIdRef.current is set to the real ID)
    if (noteId !== 'new' && noteId !== actualNoteIdRef.current) {
      // Reset the new note processed flag
      isNewNoteProcessed.current = false;
      loadNote();
    }
  }, [noteId]);
  
  // Load note function
  const loadNote = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    
    try {
      // If this is a new note, reset and return
      if (noteId === 'new') {
        setTitle('');
        setContent('');
        actualNoteIdRef.current = null;
        isNewNoteProcessed.current = false;
        setIsLoading(false);
        return;
      }
      
      // Load existing note
      const result = await getNote(noteId);
      
      if (result.success) {
        setTitle(result.data.title || '');
        setContent(result.data.content || '');
        actualNoteIdRef.current = noteId;
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
    if (window.history && newNoteId) {
      // This is the key - use history.replaceState instead of navigate
      window.history.replaceState(
        {}, 
        '', 
        `/notes/${newNoteId}`
      );
      actualNoteIdRef.current = newNoteId;
      // Mark that we've processed the new note
      isNewNoteProcessed.current = true;
      console.log('URL silently updated to:', newNoteId);
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
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      
      // Force save if there are unsaved changes
      if (title || content) {
        const noteData = { title, content };
        // Use actualNoteIdRef to determine if this is a new note
        if (actualNoteIdRef.current === null) {
          createNote(noteData);
        } else {
          updateNote(actualNoteIdRef.current, noteData);
        }
      }
    }
    
    // Add a slight delay for visual transition
    setTimeout(() => {
      navigate('/notes');
    }, 100);
  };
  
  // Debounced save
  const debounceSave = useCallback((newTitle, newContent) => {
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
        
        // CRITICAL CHANGE: Use actualNoteIdRef and isNewNoteProcessed to determine if this is a new note
        // Instead of using noteId from useParams()
        if (actualNoteIdRef.current === null || (!isNewNoteProcessed.current && noteId === 'new')) {
          console.log('Creating new note');
          const result = await createNote(noteData);
          
          if (result.success) {
            // CRITICAL: Update URL without component remount
            updateUrlSilently(result.id);
            setSaveStatus('Saved');
          } else {
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
  }, [noteId, createNote, updateNote, updateUrlSilently]);
  
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
        className="fixed top-4 right-1/2 transform translate-x-1/2 flex items-center justify-center z-10"
      >
        <div className="flex items-center space-x-2 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-full px-3 py-1 text-xs">
          {isOffline && (
            <span className="text-yellow-600 dark:text-yellow-400 font-medium">
              Offline Mode
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
            autoFocus={noteId === 'new'}
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