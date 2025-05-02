import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Simple offline-first editor that loads instantly
export default function OfflineEditor({ onSaveToCloud, initialNoteData }) {
  const [title, setTitle] = useState(initialNoteData?.title || '');
  const [content, setContent] = useState(initialNoteData?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSaved, setLastSaved] = useState(null);
  const [noteId, setNoteId] = useState(initialNoteData?.id || `local-${Date.now()}`);
  const navigate = useNavigate();
  
  const titleRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Focus on title when editor loads
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Clear previous autosave timer when unmounting
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Save to local storage immediately
  useEffect(() => {
    // Don't bother saving empty notes
    if (!title && !content) return;
    
    const noteData = {
      id: noteId,
      title,
      content,
      updatedAt: new Date().toISOString(),
      createdAt: initialNoteData?.createdAt || new Date().toISOString(),
    };
    
    // Save to local storage immediately
    localStorage.setItem(`note-${noteId}`, JSON.stringify(noteData));
    
    // Autosave to cloud with debounce
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Only attempt cloud save if we're online
    if (isOnline && (title || content)) {
      setIsSaving(true);
      saveTimeoutRef.current = setTimeout(() => {
        onSaveToCloud(noteData)
          .then(() => {
            setLastSaved(new Date());
            setIsSaving(false);
          })
          .catch(error => {
            console.error('Failed to save to cloud:', error);
            setIsSaving(false);
          });
      }, 1500); // 1.5 second debounce
    }
  }, [title, content, noteId, isOnline, onSaveToCloud, initialNoteData]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Simple toolbar */}
      <div className="border-b border-gray-200 dark:border-gray-700 py-2 px-4 flex justify-between items-center">
        <button 
          onClick={() => navigate('/notes')}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        
        <div className="flex items-center">
          {isSaving ? (
            <span className="text-xs text-gray-500 dark:text-gray-400 animate-pulse-subtle">
              Saving...
            </span>
          ) : lastSaved ? (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Saved {new Date(lastSaved).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          ) : null}
          
          {!isOnline && (
            <span className="ml-3 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 px-2 py-1 rounded">
              Offline
            </span>
          )}
        </div>
      </div>

      {/* Editor container */}
      <div className="flex-1 overflow-auto px-4 py-6 max-w-4xl mx-auto w-full">
        {/* Title */}
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full px-0 text-3xl font-bold border-0 focus:ring-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 mb-4"
        />
        
        {/* Content */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing your note..."
          className="w-full h-[calc(100vh-200px)] px-0 border-0 focus:ring-0 bg-transparent text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 resize-none"
        />
      </div>
    </div>
  );
}