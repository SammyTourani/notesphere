import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';

function StableNoteEditor() {
  const { noteId } = useParams();
  const { currentUser } = useAuth();
  const { getNote, createNote, updateNote, isOffline } = useNotes();
  const navigate = useNavigate();
  
  // UI State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  // Background state (doesn't affect rendering)
  const [saveStatus, setSaveStatus] = useState(null);
  const [error, setError] = useState(null);
  
  // References (don't cause re-renders)
  const noteIdRef = useRef(noteId);
  const isLoadingRef = useRef(true);
  const isSavingRef = useRef(false);
  const isNewNoteRef = useRef(noteId === 'new' || !noteId);
  const initialLoadDoneRef = useRef(false);
  const saveTimeoutRef = useRef(null);
  const lastSavedDataRef = useRef({ title: '', content: '' });
  
  // ====== CRITICAL FIX: Only show loading on initial mount ======
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Clear any pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
  
  // Handle note loading - runs only once per note ID
  useEffect(() => {
    // Update ref to track current note ID
    noteIdRef.current = noteId;
    
    // Only reset loading state when note ID changes
    if (noteId !== noteIdRef.current) {
      setInitialLoading(true);
    }
    
    async function loadNote() {
      // Handle new note case
      if (noteId === 'new' || !noteId) {
        setTitle('');
        setContent('');
        isNewNoteRef.current = true;
        initialLoadDoneRef.current = true;
        setInitialLoading(false);
        return;
      }
      
      try {
        isLoadingRef.current = true;
        const result = await getNote(noteId);
        
        if (result.success) {
          // Only update if we're still looking at this note
          if (noteIdRef.current === noteId) {
            setTitle(result.data.title || '');
            setContent(result.data.content || '');
            lastSavedDataRef.current = {
              title: result.data.title || '',
              content: result.data.content || ''
            };
            isNewNoteRef.current = false;
            setError(null);
          }
        } else {
          console.error('Note not found or error:', result.error);
          setError('Note not found. It may have been deleted.');
        }
      } catch (err) {
        console.error('Error loading note:', err);
        setError('Failed to load note. Please try again.');
      } finally {
        // Only update if we're still looking at this note
        if (noteIdRef.current === noteId) {
          isLoadingRef.current = false;
          initialLoadDoneRef.current = true;
          setInitialLoading(false);
        }
      }
    }
    
    if (currentUser) {
      loadNote();
    }
  }, [noteId, currentUser, getNote]);
  
  // Debounced save function that doesn't affect UI
  const saveNote = useCallback((newTitle, newContent) => {
    // Don't save if we haven't loaded yet
    if (!initialLoadDoneRef.current) return;
    
    // Don't save if there's no user
    if (!currentUser) return;
    
    // Don't save if nothing changed
    if (newTitle === lastSavedDataRef.current.title && 
        newContent === lastSavedDataRef.current.content) {
      return;
    }
    
    // Don't save if both fields are empty
    if (!newTitle.trim() && !newContent.trim()) return;
    
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set a new timeout for debounced saving
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        isSavingRef.current = true;
        setSaveStatus('Saving...');
        
        const noteData = { title: newTitle, content: newContent };
        let result;
        
        if (isNewNoteRef.current) {
          // Create a new note
          result = await createNote(noteData);
          
          if (result.success) {
            // Update references
            noteIdRef.current = result.id;
            isNewNoteRef.current = false;
            
            // Update URL without triggering a component reload
            if ((noteId === 'new' || !noteId) && result.id) {
              navigate(`/notes/${result.id}`, { replace: true });
            }
            
            // Update saved data reference
            lastSavedDataRef.current = { title: newTitle, content: newContent };
            
            setSaveStatus(result.isOfflineOnly ? 'Saved offline' : 'Saved');
          } else {
            setSaveStatus('Failed to save');
          }
        } else {
          // Update existing note
          result = await updateNote(noteIdRef.current, noteData);
          
          if (result.success) {
            // Update saved data reference
            lastSavedDataRef.current = { title: newTitle, content: newContent };
            
            setSaveStatus(result.isOfflineOnly ? 'Saved offline' : 'Saved');
          } else {
            setSaveStatus('Failed to save');
          }
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
  }, [currentUser, createNote, updateNote, navigate, noteId]);
  
  // Handle title changes
  const handleTitleChange = useCallback((e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    saveNote(newTitle, content);
  }, [content, saveNote]);
  
  // Handle content changes
  const handleContentChange = useCallback((e) => {
    const newContent = e.target.value;
    setContent(newContent);
    saveNote(title, newContent);
  }, [title, saveNote]);
  
  // Show loading screen only during initial load
  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-screen pt-16">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  if (error && !title && !content) {
    return (
      <div className="pt-20 max-w-4xl mx-auto px-4">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-red-700 dark:text-red-400">
          <p>{error}</p>
          <button 
            onClick={() => navigate('/notes')} 
            className="mt-2 text-sm underline"
          >
            Back to Notes
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="pt-16 h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 font-inter overflow-hidden">
      {/* Status indicator */}
      <div className="fixed top-4 right-1/2 transform translate-x-1/2 flex items-center justify-center z-10">
        <div className="flex items-center space-x-2 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-full px-3 py-1 text-xs">
          {isOffline && (
            <span className="text-yellow-600 dark:text-yellow-400 font-medium">
              Offline Mode
            </span>
          )}
          
          {isSavingRef.current && (
            <span className="text-gray-500 dark:text-gray-400">
              {isOffline ? 'Saving offline...' : 'Saving...'}
            </span>
          )}
          
          {!isSavingRef.current && saveStatus && (
            <span className="text-gray-500 dark:text-gray-400">
              {saveStatus}
            </span>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex justify-center pt-16 px-4">
        <div className="w-full max-w-2xl">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Note title..."
            className="w-full p-2 mb-2 bg-transparent text-gray-900 dark:text-white text-2xl font-bold focus:outline-none"
            autoFocus={isNewNoteRef.current}
          />
          
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Write freely..."
            className="w-full h-[70vh] p-2 bg-transparent text-gray-800 dark:text-gray-200 placeholder:text-gray-400/90 dark:placeholder:text-gray-500/90 text-base sm:text-lg font-normal leading-relaxed sm:leading-loose focus:outline-none resize-none"
          />
        </div>
      </div>
    </div>
  );
}

export default StableNoteEditor;