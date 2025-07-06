import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';
import { motion } from 'framer-motion';

// Tiptap imports for useEditor
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { GrammarExtension } from '../extensions/GrammarExtension';

import TipTapEditor from './editor/TipTapEditor';
import EditorToolbar from './editor/EditorToolbar';
import WordCountDisplay from './editor/WordCountDisplay';
import PinButton from './PinButton';
import UltimateGrammarUI from './editor/UltimateGrammarUI';
import NoFramerGrammarButton from './editor/NoFramerGrammarButton';

function SingleNoteEditor() {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isGuestMode } = useAuth();
  const { getNote, createNote, updateNote, isOffline } = useNotes();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState(''); 
  const [saveStatus, setSaveStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPinned, setIsPinned] = useState(false);
  const [noteKey, setNoteKey] = useState(Date.now()); // Key to force PinButton re-render

  // === GRAMMAR UI STATE ===
  const [showGrammarUI, setShowGrammarUI] = useState(false);
  const [grammarIssues, setGrammarIssues] = useState([]);

  const isSavingRef = useRef(false);
  const saveTimeoutRef = useRef(null);
  const actualNoteIdRef = useRef(noteId);
  const hasBeenSavedRef = useRef(false);

  const toggleGrammarUI = useCallback(() => {
    setShowGrammarUI(prev => !prev);
  }, []);

  const onIssuesFound = useCallback((issues) => {
    setGrammarIssues(issues);
  }, []);

  const onIssuesUpdated = useCallback((issues) => {
    setGrammarIssues(issues);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          class: 'text-blue-600 dark:text-blue-400 underline'
        }
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      TextStyle,
      Highlight.configure({
        HTMLAttributes: {
          class: 'bg-yellow-200 dark:bg-yellow-800',
        },
      }),
      Placeholder.configure({
        placeholder: 'Write freely...',
      }),
      GrammarExtension.configure({
        onIssuesFound,
        onIssuesUpdated,
      })
    ],
    content: content, 
    onUpdate: ({ editor: updatedEditor }) => {
      handleContentChange(updatedEditor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '', false); 
    }
  }, [content, editor]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []); 

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  useEffect(() => {
    if (location.pathname === '/notes/new') {
      setTitle('');
      setContent('');
      setIsPinned(false);
      actualNoteIdRef.current = null;
      hasBeenSavedRef.current = false;
      setError(null);
      setIsLoading(false);
      // Focus title input for new notes
      const titleInput = document.querySelector('input[placeholder="Note title..."]');
      titleInput?.focus();
      return;
    }
    if (noteId !== undefined) {
      loadNote();
      
      // FIXED: Save the last visited note immediately when loading
      if (currentUser && noteId && noteId !== 'new') {
        localStorage.setItem(`lastNote-${currentUser.uid}`, noteId);
        localStorage.setItem(`lastNoteTimestamp-${currentUser.uid}`, Date.now().toString());
      }
    }
  }, [noteId, location.pathname, currentUser]);

  const loadNote = async () => {
    setIsLoading(true);
    try {
      if (noteId === 'new') {
        setTitle('');
        setContent('');
        setIsPinned(false);
        actualNoteIdRef.current = null;
        hasBeenSavedRef.current = false;
        setError(null);
        setIsLoading(false);
        return;
      }
      if (!noteId) {
        setError('Invalid note ID');
        setIsLoading(false);
        return;
      }
      const result = await getNote(noteId);
      if (result.success) {
        setTitle(result.data.title || '');
        setContent(result.data.content || ''); 
        setIsPinned(result.data.pinned || false);
        actualNoteIdRef.current = noteId;
        hasBeenSavedRef.current = true;
        setError(null);
        
        // FIXED: Update last visited note after successful load
        if (currentUser && noteId !== 'new') {
          localStorage.setItem(`lastNote-${currentUser.uid}`, noteId);
          localStorage.setItem(`lastNoteTimestamp-${currentUser.uid}`, Date.now().toString());
        }
        
        // Autofocus editor content if not a new note and editor exists
        if (editor && location.pathname !== '/notes/new') {
            setTimeout(() => editor.commands.focus('end'), 100); // Focus after content is set
        }
      } else {
        setError('Note not found. It may have been deleted.');
      }
    } catch (err) {
      setError('Failed to load note. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUrlSilently = useCallback((newNoteId) => {
    if (window.history && newNoteId) {
      window.history.replaceState({}, '', `/notes/${newNoteId}`);
      actualNoteIdRef.current = newNoteId;
      hasBeenSavedRef.current = true;
      
      // FIXED: Update last visited note when URL changes
      if (currentUser) {
        localStorage.setItem(`lastNote-${currentUser.uid}`, newNoteId);
        localStorage.setItem(`lastNoteTimestamp-${currentUser.uid}`, Date.now().toString());
      }
    }
  }, [currentUser]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debounceSave(newTitle, editor ? editor.getHTML() : content);
  };

  const handleContentChange = (newContent) => {
    setContent(newContent); 
    debounceSave(title, newContent);
  };

  // Update local pin state when pin status changes
  const handlePinChange = useCallback((isPinnedNow) => {
    console.log("Pin status changed to:", isPinnedNow);
    // Update the pin state in the component
    setIsPinned(isPinnedNow);
    
    // Force re-render of pin button with new key
    setNoteKey(Date.now());
    
    // No need to reload the entire note - the context will handle updating the data
  }, []);

  const handleBackToNotes = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      const currentEditorContent = editor ? editor.getHTML() : content;
      if (title.trim() || (currentEditorContent && currentEditorContent.replace(/<[^>]+>/g, '').trim())) { 
        // Preserve pin status when saving on navigation
        const noteData = { 
          title, 
          content: currentEditorContent,
          pinned: isPinned  // Include current pin status
        };
        if (!hasBeenSavedRef.current) {
          createNote(noteData)
            .then(() => navigate('/notes'))
            .catch(() => navigate('/notes'));
          return;
        } else {
          updateNote(actualNoteIdRef.current, noteData)
            .then(() => navigate('/notes'))
            .catch(() => navigate('/notes'));
          return;
        }
      }
    }
    navigate('/notes');
  };

  const debounceSave = useCallback((newTitle, newContent) => {
    const isContentEmpty = !newContent || newContent === '<p></p>' || newContent.replace(/<[^>]+>/g, '').trim() === '';
    if (!newTitle.trim() && isContentEmpty) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        isSavingRef.current = true;
        setSaveStatus('Saving...');
        // Preserve the current pin status when updating
        const noteData = { 
          title: newTitle, 
          content: newContent,
          pinned: isPinned  // Include current pin status
        };
        if (!hasBeenSavedRef.current) {
          const result = await createNote(noteData);
          if (result.success) {
            updateUrlSilently(result.id);
            setSaveStatus('Saved');
          } else {
            setSaveStatus('Failed to save');
          }
        } else {
          const result = await updateNote(actualNoteIdRef.current, noteData);
          setSaveStatus(result.success ? 'Saved' : 'Failed to save');
        }
      } catch (err) {
        setSaveStatus('Error saving');
      } finally {
        isSavingRef.current = false;
        setTimeout(() => setSaveStatus(null), 2000);
      }
    }, 800);
  }, [createNote, updateNote, updateUrlSilently, isPinned]); // Added isPinned to dependencies

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen pt-16">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-4 text-center">Loading note...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const isEditorContentEmpty = !content || content === '<p></p>' || content.replace(/<[^>]+>/g, '').trim() === '';
  if (error && !title && isEditorContentEmpty) { 
    return (
      <div className="pt-20 max-w-4xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-red-700 dark:text-red-400">
            <p>{error}</p>
            <button onClick={handleBackToNotes} className="mt-2 text-sm underline">Back to Notes</button>
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
      className="pt-16 h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden flex flex-col"
    >
      {/* Header section with back button and info */}
      <div className="fixed top-0 left-0 right-0 z-20"> 
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="absolute top-20 left-4"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleBackToNotes}
            className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
            <span>Back</span>
          </motion.button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center justify-center"
        >
          <div className="flex items-center space-x-2 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-full px-3 py-1 text-xs">
            {isOffline && (<span className="text-yellow-600 dark:text-yellow-400 font-medium">Offline Mode</span>)}
            {isGuestMode && (<span className="text-purple-600 dark:text-purple-400 font-medium">Guest Mode</span>)}
            {isSavingRef.current && (<span className="text-gray-500 dark:text-gray-400">Saving...</span>)}
            {!isSavingRef.current && saveStatus && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-500 dark:text-gray-400">{saveStatus}</motion.span>
            )}
          </div>
        </motion.div>
      </div>

      <div className="flex-grow flex justify-center pt-16 px-4 overflow-y-auto pb-24">
        <div className="w-full max-w-2xl note-content">
          <div className="flex items-center justify-between mb-2">
            <motion.input
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Note title..."
              className="flex-grow p-2 bg-transparent text-gray-900 dark:text-white text-2xl font-bold focus:outline-none"
              autoFocus={location.pathname === '/notes/new'}
            />
            
            {/* Repositioned Pin Button */}
            {hasBeenSavedRef.current && (
              <motion.div 
                key={noteKey} // Force re-render when pin state changes
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex-shrink-0"
              >
                <PinButton 
                  noteId={actualNoteIdRef.current}
                  isPinned={isPinned}
                  onPinChange={handlePinChange}
                />
              </motion.div>
            )}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            {editor && <TipTapEditor editor={editor} />} 
          </motion.div>
        </div>
      </div>
      
      {editor && ( 
        <motion.div
          className="editor-controls"
          initial={{ opacity: 0, y: 30, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }} 
        >
          <EditorToolbar editor={editor} />
          <WordCountDisplay editor={editor} title={title} />
        </motion.div>
      )}
      
      {/* Ultimate Grammar UI */}
      <UltimateGrammarUI 
        editor={editor}
        isVisible={showGrammarUI}
        onToggle={toggleGrammarUI}
      />
      
      {/* No-Framer Grammar Button */}
      <NoFramerGrammarButton 
        isActive={showGrammarUI}
        onClick={toggleGrammarUI}
        issueCount={grammarIssues.length}
        position="bottom-right"
        size="medium"
      />
    </motion.div>
  );
}

export default SingleNoteEditor;