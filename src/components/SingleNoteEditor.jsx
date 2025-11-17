/**
 * Single Note Editor - Refactored
 * Clean component using custom hooks
 * Reduced from 601 lines to ~250 lines
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

// Custom hooks
import { useNoteEditor } from '../hooks/useNoteEditor';
import { useTipTapEditor } from '../hooks/useTipTapEditor';
import { useGrammarIntegration } from '../hooks/useGrammarIntegration';

// Components
import TipTapEditor from './editor/TipTapEditor';
import EditorToolbar from './editor/EditorToolbar';
import WordCountDisplay from './editor/WordCountDisplay';
import PinButton from './PinButton';
import AdvancedGrammarInsights from './editor/AdvancedGrammarInsights';

function SingleNoteEditor() {
  const location = useLocation();
  
  // Note management hook
  const {
    title,
    content,
    isPinned,
    saveStatus,
    isLoading,
    error,
    noteId,
    hasBeenSaved,
    isOffline,
    isGuestMode,
    handleTitleChange,
    handleContentChange,
    handlePinChange,
    handleBackToNotes,
    setContent
  } = useNoteEditor();

  // TipTap editor
  const editor = useTipTapEditor(content, handleContentChange);

  // Grammar integration
  const {
    isGrammarSidebarVisible,
    toggleGrammarSidebar,
    closeGrammarSidebar,
    grammarControllerRef,
    grammarInsightsRef
  } = useGrammarIntegration(editor);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen pt-16">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
        >
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-4">Loading note...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Error state (only show if note is truly empty)
  const isEditorContentEmpty = !content || content === '<p></p>' || content.replace(/<[^>]+>/g, '').trim() === '';
  if (error && !title && isEditorContentEmpty) {
    return (
      <div className="pt-20 max-w-4xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-red-700 dark:text-red-400">
            <p>{error}</p>
            <button onClick={handleBackToNotes} className="mt-2 text-sm underline">
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
      className="pt-16 h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden flex flex-col"
    >
      {/* Header section */}
      <div className="fixed top-0 left-0 right-0 z-20">
        {/* Back button */}
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span>Back</span>
          </motion.button>
        </motion.div>

        {/* Status bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center justify-center"
        >
          <div className="flex items-center space-x-2 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-full px-3 py-1 text-xs">
            {isOffline && <span className="text-yellow-600 dark:text-yellow-400 font-medium">Offline Mode</span>}
            {isGuestMode && <span className="text-purple-600 dark:text-purple-400 font-medium">Guest Mode</span>}
            {saveStatus && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-500 dark:text-gray-400">
                {saveStatus}
              </motion.span>
            )}
          </div>
        </motion.div>

        {/* Grammar toggle button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4, type: "spring" }}
          className="fixed bottom-8 right-8 z-50"
        >
          <motion.button
            onClick={toggleGrammarSidebar}
            className={`
              group relative w-16 h-16 rounded-2xl font-medium transition-all duration-300 shadow-2xl
              ${isGrammarSidebarVisible 
                ? 'bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 text-white ring-4 ring-blue-200 dark:ring-blue-800' 
                : 'bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 text-gray-700 dark:text-gray-300 hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-600 ring-2 ring-gray-200 dark:ring-gray-600 hover:ring-blue-300 dark:hover:ring-blue-500'
              }
              backdrop-blur-xl border border-white/20 dark:border-gray-700/50
            `}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="flex items-center justify-center h-full">
              {isGrammarSidebarVisible ? (
                <motion.div initial={{ rotate: 0 }} animate={{ rotate: 180 }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.div>
              ) : (
                <motion.div initial={{ rotate: 180 }} animate={{ rotate: 0 }} className="relative">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-lg" />
                </motion.div>
              )}
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-20 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-gray-900 dark:bg-gray-700 text-white text-sm px-4 py-3 rounded-lg shadow-xl whitespace-nowrap">
                <div className="font-semibold">
                  {isGrammarSidebarVisible ? '🏆 Grammar System' : '🚀 Grammar Analysis'}
                </div>
                <div className="text-xs text-gray-300">
                  {isGrammarSidebarVisible ? 'Click to close' : 'Click to analyze'}
                </div>
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
              </div>
            </div>
          </motion.button>
        </motion.div>
      </div>

      {/* Main content area */}
      <motion.div
        className="flex-grow flex justify-center pt-16 px-4 overflow-y-auto pb-24 transition-all duration-300 ease-in-out"
        animate={{
          marginRight: isGrammarSidebarVisible ? '500px' : '0px'
        }}
      >
        <div className="w-full max-w-2xl note-content">
          {/* Title and pin button */}
          <div className="flex items-center justify-between mb-2">
            <motion.input
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Note title..."
              className="flex-grow p-2 bg-transparent text-gray-900 dark:text-white text-2xl font-bold focus:outline-none"
              autoFocus={location.pathname === '/notes/new'}
            />

            {hasBeenSaved && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex-shrink-0"
              >
                <PinButton
                  noteId={noteId}
                  isPinned={isPinned}
                  onPinChange={handlePinChange}
                />
              </motion.div>
            )}
          </div>

          {/* Editor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            {editor && <TipTapEditor editor={editor} />}
          </motion.div>
        </div>
      </motion.div>

      {/* Editor controls */}
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

      {/* Grammar sidebar */}
      <div className="fixed right-0 top-0 h-full z-40">
        <AdvancedGrammarInsights
          ref={grammarInsightsRef}
          editor={editor}
          content={content}
          isVisible={isGrammarSidebarVisible}
          onToggle={closeGrammarSidebar}
          onOpen={() => {}} // No-op, controlled by toggle
          onContentUpdate={setContent}
          grammarController={grammarControllerRef.current}
        />
      </div>
    </motion.div>
  );
}

export default SingleNoteEditor;
