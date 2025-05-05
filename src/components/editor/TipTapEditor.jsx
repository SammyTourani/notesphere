import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { useFont } from '../../context/FontContext';
import { useTheme } from '../../context/ThemeContext';
import EditorToolbar from './EditorToolbar';
import WordCountDisplay from './WordCountDisplay';
import './editor-styles.css';

const TipTapEditor = ({ content, onChange, autofocus = false, title = '' }) => {
  const { fontFamily, fontSize, lineHeight } = useFont();
  const { darkMode } = useTheme();
  const isInitialRenderRef = useRef(true);
  const prevContentRef = useRef(content);
  const prevTitleRef = useRef(title);

  // Configure the editor with extensions
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
      })
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    autofocus,
  });

  // Update editor when content prop changes externally
  useEffect(() => {
    if (editor && content !== prevContentRef.current) {
      // Only update if the content actually changed to avoid cursor jumps
      editor.commands.setContent(content || '', false);
      prevContentRef.current = content;
    }
  }, [editor, content]);

  // Track title changes
  useEffect(() => {
    prevTitleRef.current = title;
  }, [title]);

  // Apply font settings
  useEffect(() => {
    if (!editor || !editor.view || !editor.view.dom) return;
    
    const editorElement = editor.view.dom;
    
    // Apply font family
    editorElement.style.fontFamily = 
      fontFamily === 'sans' ? 'var(--font-inter)' :
      fontFamily === 'serif' ? 'var(--font-merriweather)' :
      fontFamily === 'mono' ? 'var(--font-mono)' : 'var(--font-inter)';
    
    // Apply font size
    editorElement.style.fontSize = 
      fontSize === 'small' ? 'var(--font-size-small)' :
      fontSize === 'medium' ? 'var(--font-size-medium)' :
      fontSize === 'large' ? 'var(--font-size-large)' :
      fontSize === 'xlarge' ? 'var(--font-size-xlarge)' : 'var(--font-size-medium)';
    
    // Apply line height
    editorElement.style.lineHeight = 
      lineHeight === 'tight' ? 'var(--line-height-compact)' :
      lineHeight === 'normal' ? 'var(--line-height-normal)' :
      lineHeight === 'relaxed' ? 'var(--line-height-relaxed)' : 'var(--line-height-normal)';
    
  }, [editor, fontFamily, fontSize, lineHeight]);

  // After first render, mark as not initial anymore
  useEffect(() => {
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
    }
  }, []);

  return (
    <div className={`w-full ${darkMode ? 'dark' : ''}`}>
      {/* Completely transparent editor container */}
      <div className="tiptap-container w-full">
        <EditorContent editor={editor} className="tiptap" />
      </div>
      
      {/* Bottom controls group - contains toolbar and word count */}
      <div className="editor-controls">
        {/* Bottom toolbar */}
        <EditorToolbar editor={editor} />
        
        {/* Word count display - now includes title */}
        <WordCountDisplay editor={editor} title={title} />
      </div>
    </div>
  );
};

export default TipTapEditor;