/**
 * useNoteEditor Hook
 * Manages note loading, saving, and state for the editor
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';
import { useAutoSave } from './useAutoSave';
import { createLogger } from '../utils/logger';

const logger = createLogger('useNoteEditor');

export function useNoteEditor() {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isGuestMode } = useAuth();
  const { getNote, createNote, updateNote, isOffline } = useNotes();

  // Note state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refs
  const actualNoteIdRef = useRef(noteId);
  const hasBeenSavedRef = useRef(false);

  // Auto-save logic
  const handleSave = useCallback(async (data) => {
    const noteData = {
      title: data.title,
      content: data.content,
      pinned: data.pinned
    };

    logger.info('handleSave called', {
      hasBeenSaved: hasBeenSavedRef.current,
      actualNoteId: actualNoteIdRef.current,
      title: noteData.title?.substring(0, 20)
    });

    if (!hasBeenSavedRef.current) {
      // Create new note
      logger.info('Creating new note...');
      const result = await createNote(noteData);
      
      logger.info('Create note result:', { success: result.success, id: result.data?.id });
      
      if (result.success) {
        actualNoteIdRef.current = result.data.id;
        hasBeenSavedRef.current = true;
        
        // Update URL silently
        window.history?.replaceState({}, '', `/notes/${result.data.id}`);
        
        // Save to localStorage for "last visited"
        if (currentUser) {
          localStorage.setItem(`lastNote-${currentUser.uid}`, result.data.id);
          localStorage.setItem(`lastNoteTimestamp-${currentUser.uid}`, Date.now().toString());
        }
      } else {
        logger.error('Failed to create note:', result.error);
      }
      return result;
    } else {
      // Update existing note
      logger.info('Updating existing note:', actualNoteIdRef.current);
      const result = await updateNote(actualNoteIdRef.current, noteData);
      logger.info('Update note result:', { success: result.success });
      return result;
    }
  }, [createNote, updateNote, currentUser]);

  const { debouncedSave, saveSynchronously, cancelPendingSave } = useAutoSave({
    onSave: handleSave,
    onStatusChange: setSaveStatus,
    delay: 800
  });

  // Load note on mount or when noteId changes
  useEffect(() => {
    async function loadNote() {
      if (location.pathname === '/notes/new') {
        // New note
        setTitle('');
        setContent('');
        setIsPinned(false);
        actualNoteIdRef.current = null;
        hasBeenSavedRef.current = false;
        setError(null);
        setIsLoading(false);
        return;
      }

      if (!noteId || noteId === 'new') {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const result = await getNote(noteId);
        
        if (result.success) {
          setTitle(result.data.title || '');
          setContent(result.data.content || '');
          setIsPinned(result.data.pinned || false);
          actualNoteIdRef.current = noteId;
          hasBeenSavedRef.current = true;
          setError(null);

          // Save as last visited
          if (currentUser) {
            localStorage.setItem(`lastNote-${currentUser.uid}`, noteId);
            localStorage.setItem(`lastNoteTimestamp-${currentUser.uid}`, Date.now().toString());
          }
        } else {
          setError('Note not found. It may have been deleted.');
        }
      } catch (err) {
        setError('Failed to load note. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    loadNote();
  }, [noteId, location.pathname, getNote, currentUser]);

  // Handle title change
  const handleTitleChange = useCallback((newTitle) => {
    setTitle(newTitle);
    debouncedSave({ title: newTitle, content, pinned: isPinned });
  }, [content, isPinned, debouncedSave]);

  // Handle content change
  const handleContentChange = useCallback((newContent) => {
    setContent(newContent);
    debouncedSave({ title, content: newContent, pinned: isPinned });
  }, [title, isPinned, debouncedSave]);

  // Handle pin change
  const handlePinChange = useCallback((newPinStatus) => {
    setIsPinned(newPinStatus);
  }, []);

  // Handle back navigation
  const handleBackToNotes = useCallback(() => {
    // Check if we have unsaved content
    const isContentEmpty = !content || content === '<p></p>' || content.replace(/<[^>]+>/g, '').trim() === '';
    
    if (title.trim() || !isContentEmpty) {
      // Save before navigating
      const noteData = { title, content, pinned: isPinned };
      saveSynchronously(noteData)
        .then(() => navigate('/notes'))
        .catch(() => navigate('/notes'));
    } else {
      navigate('/notes');
    }
  }, [title, content, isPinned, saveSynchronously, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelPendingSave();
    };
  }, [cancelPendingSave]);

  return {
    // State
    title,
    content,
    isPinned,
    saveStatus,
    isLoading,
    error,
    noteId: actualNoteIdRef.current,
    hasBeenSaved: hasBeenSavedRef.current,
    isOffline,
    isGuestMode,
    
    // Handlers
    handleTitleChange,
    handleContentChange,
    handlePinChange,
    handleBackToNotes,
    
    // Utils
    setContent // For direct content updates (e.g., from grammar fixes)
  };
}

export default useNoteEditor;
