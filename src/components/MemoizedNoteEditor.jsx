import React, { memo } from 'react';
import NoteEditor from './NoteEditor'; // Your existing editor

// This wrapper prevents re-renders from parent components
const MemoizedNoteEditor = memo(function MemoizedNoteEditor(props) {
  return <NoteEditor {...props} />;
}, () => true); // Always return true to prevent re-renders from props

export default MemoizedNoteEditor;