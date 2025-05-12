import React, { useEffect } from 'react'; // Removed useRef as it's not used
import { EditorContent } from '@tiptap/react';
import { useFont } from '../../context/FontContext';
import { useTheme } from '../../context/ThemeContext';
import './editor-styles.css';

const TipTapEditor = ({ editor }) => { // Removed title prop as it's not used here directly
  const { fontFamily, fontSize, lineHeight } = useFont();
  const { darkMode } = useTheme();

  useEffect(() => {
    if (!editor || !editor.view || !editor.view.dom) return;
    const editorElement = editor.view.dom;
    editorElement.style.fontFamily =
      fontFamily === 'sans' ? 'var(--font-inter)' :
      fontFamily === 'serif' ? 'var(--font-merriweather)' :
      fontFamily === 'mono' ? 'var(--font-mono)' : 'var(--font-inter)';
    editorElement.style.fontSize =
      fontSize === 'small' ? 'var(--font-size-small)' :
      fontSize === 'medium' ? 'var(--font-size-medium)' :
      fontSize === 'large' ? 'var(--font-size-large)' :
      fontSize === 'xlarge' ? 'var(--font-size-xlarge)' : 'var(--font-size-medium)';
    editorElement.style.lineHeight =
      lineHeight === 'tight' ? 'var(--line-height-compact)' :
      lineHeight === 'normal' ? 'var(--line-height-normal)' :
      lineHeight === 'relaxed' ? 'var(--line-height-relaxed)' : 'var(--line-height-normal)';
  }, [editor, fontFamily, fontSize, lineHeight]);

  if (!editor) {
    return null; 
  }

  return (
    <div className={`w-full ${darkMode ? 'dark' : ''}`}>
      <div className="tiptap-container w-full">
        <EditorContent editor={editor} className="tiptap" />
      </div>
    </div>
  );
};

export default TipTapEditor;