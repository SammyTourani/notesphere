import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';

// Create a completely separate editor component
const Editor = ({ title, content, onTitleChange, onContentChange, isNewNote }) => {
  return (
    <div className="w-full max-w-2xl">
      <input
        type="text"
        value={title}
        onChange={onTitleChange}
        placeholder="Note title..."
        className="w-full p-2 mb-2 bg-transparent text-gray-900 dark:text-white text-2xl font-bold focus:outline-none"
        autoFocus={isNewNote}
      />
      
      <textarea
        value={content}
        onChange={onContentChange}
        placeholder="Write freely..."
        className="w-full h-[70vh] p-2 bg-transparent text-gray-800 dark:text-gray-200 placeholder:text-gray-400/90 dark:placeholder:text-gray-500/90 text-base sm:text-lg font-normal leading-relaxed sm:leading-loose focus:outline-none resize-none"
      />
    </div>
  );
};

// Memoize the editor to prevent re-renders during saving
const MemoizedEditor = React.memo(Editor);

function NoteEditor() {
  const { noteId } = useParams();
  const { currentUser } = useAuth();
  const { getNote, createNote, updateNote, isOffline } = useNotes();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [error, setError] = useState(null);

  const isNewNoteRef = useRef(false);
  const currentNoteIdRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  
  // Setup & cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);
  
  // Load note data
  useEffect(() => {
    async function loadNote() {
      if (!currentUser) return;
      
      if (!noteId || noteId === 'new') {
        setTitle('');
        setContent('');
        isNewNoteRef.current = true;
        currentNoteIdRef.current = null;
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        const result = await getNote(noteId);
        
        if (!isMountedRef.current) return;
        
        if (result.success) {
          setTitle(result.data.title || '');
          setContent(result.data.content || '');
          currentNoteIdRef.current = noteId;
          isNewNoteRef.current = false;
        } else {
          console.error('Note not found or error:', result.error);
          setError('Note not found. It may have been deleted.');
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        console.error('Error loading note:', err);
        setError('Failed to load note. Please try again.');
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    }
    
    loadNote();
  }, [noteId, currentUser, getNote]);
  
  // Title change handler
  const handleTitleChange = useCallback((e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    // Don't debounce title changes to avoid flickering
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
  }, []);
  
  // Content change handler
  const handleContentChange = useCallback((e) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // Don't debounce content changes to avoid flickering
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
  }, []);
  
  // Save note - Triggered by effect, not directly from handlers
  useEffect(() => {
    // Don't run on initial render or while loading
    if (isLoading) return;
    
    // Skip empty notes
    if (!title.trim() && !content.trim()) return;
    
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set a new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return;
      
      setSaving(true);
      setSaveStatus('Saving...');
      
      try {
        const noteData = { title, content };
        let result;
        
        if (isNewNoteRef.current || !currentNoteIdRef.current) {
          result = await createNote(noteData);
          
          if (result.success) {
            currentNoteIdRef.current = result.id;
            isNewNoteRef.current = false;
            
            if ((noteId === 'new' || !noteId) && result.id) {
              navigate(`/notes/${result.id}`, { replace: true });
            }
            
            setSaveStatus(result.isOfflineOnly ? 'Saved offline' : 'Saved');
          } else {
            setSaveStatus('Failed to save');
          }
        } else {
          result = await updateNote(currentNoteIdRef.current, noteData);
          setSaveStatus(result.success ? 
            (result.isOfflineOnly ? 'Saved offline' : 'Saved') : 
            'Failed to save'
          );
        }
      } catch (err) {
        console.error('Error saving note:', err);
        setSaveStatus('Error saving');
      } finally {
        if (isMountedRef.current) {
          setSaving(false);
          
          setTimeout(() => {
            if (isMountedRef.current) {
              setSaveStatus(null);
            }
          }, 2000);
        }
      }
    }, 800);
  }, [title, content, noteId, createNote, updateNote, navigate, isLoading]);
  
  if (isLoading) {
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
          
          {saving && (
            <span className="text-gray-500 dark:text-gray-400">
              {isOffline ? 'Saving offline...' : 'Saving...'}
            </span>
          )}
          
          {!saving && saveStatus && (
            <span className="text-gray-500 dark:text-gray-400">
              {saveStatus}
            </span>
          )}
        </div>
      </div>

      {/* Editor - Wrapped in memo for stability */}
      <div className="flex justify-center pt-16 px-4">
        <MemoizedEditor
          title={title}
          content={content}
          onTitleChange={handleTitleChange}
          onContentChange={handleContentChange}
          isNewNote={isNewNoteRef.current}
        />
      </div>
    </div>
  );
}

export default NoteEditor;