import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EditorMenuButton from './EditorMenuButton';

const EditorToolbar = ({ editor }) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const toolbarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!editor) return null;

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 0 }, // Added y:0
    visible: (custom) => ({
      opacity: 1,
      scale: 1,
      y: 0, // Added y:0
      transition: {
        delay: custom * 0.05, 
        duration: 0.3,
        ease: [0.2, 0.65, 0.3, 0.9]
      }
    })
  };
  
  const dropdownVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 5 },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: { duration: 0.2, ease: [0.2, 0.65, 0.3, 0.9] }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      y: 5,
      transition: { duration: 0.15, ease: [0.4, 0, 1, 1] }
    }
  };

  const buttons = [
    <motion.div key="bold" custom={0} variants={itemVariants}>
      <EditorMenuButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} tooltip="Bold">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>
      </EditorMenuButton>
    </motion.div>,
    <motion.div key="italic" custom={1} variants={itemVariants}>
      <EditorMenuButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} tooltip="Italic">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>
      </EditorMenuButton>
    </motion.div>,
    <motion.div key="underline" custom={2} variants={itemVariants}>
      <EditorMenuButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} tooltip="Underline">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path><line x1="4" y1="21" x2="20" y2="21"></line></svg>
      </EditorMenuButton>
    </motion.div>,
    <motion.div key="sep-1" custom={3} variants={itemVariants} className="toolbar-separator"></motion.div>,
    <motion.div key="headings" custom={4} variants={itemVariants} className="relative">
      <EditorMenuButton onClick={() => toggleDropdown('heading')} isActive={editor.isActive('heading')} tooltip="Headings">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 12h12"></path><path d="M6 20V4"></path><path d="M18 20V4"></path></svg>
      </EditorMenuButton>
      <AnimatePresence>
        {activeDropdown === 'heading' && (
          <motion.div className="toolbar-dropdown" variants={dropdownVariants} initial="hidden" animate="visible" exit="exit" style={{ left: "-1rem" }}>
            <button className={`toolbar-dropdown-item ${editor.isActive('heading', { level: 1 }) ? 'text-indigo-600 dark:text-indigo-400' : ''}`} onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); setActiveDropdown(null); }}><span className="text-lg font-bold">Heading 1</span></button>
            <button className={`toolbar-dropdown-item ${editor.isActive('heading', { level: 2 }) ? 'text-indigo-600 dark:text-indigo-400' : ''}`} onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); setActiveDropdown(null); }}><span className="text-md font-semibold">Heading 2</span></button>
            <button className={`toolbar-dropdown-item ${editor.isActive('heading', { level: 3 }) ? 'text-indigo-600 dark:text-indigo-400' : ''}`} onClick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); setActiveDropdown(null); }}><span className="text-sm font-medium">Heading 3</span></button>
            <button className={`toolbar-dropdown-item ${editor.isActive('paragraph') ? 'text-indigo-600 dark:text-indigo-400' : ''}`} onClick={() => { editor.chain().focus().setParagraph().run(); setActiveDropdown(null); }}><span>Normal Text</span></button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>,
    <motion.div key="sep-2" custom={5} variants={itemVariants} className="toolbar-separator"></motion.div>,
    <motion.div key="lists" custom={6} variants={itemVariants} className="relative">
      <EditorMenuButton onClick={() => toggleDropdown('list')} isActive={editor.isActive('bulletList') || editor.isActive('orderedList')} tooltip="Lists">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
      </EditorMenuButton>
      <AnimatePresence> 
        {activeDropdown === 'list' && (
          <motion.div className="toolbar-dropdown" variants={dropdownVariants} initial="hidden" animate="visible" exit="exit" style={{ left: "-1rem" }}>
            <button className={`toolbar-dropdown-item ${editor.isActive('bulletList') ? 'text-indigo-600 dark:text-indigo-400' : ''}`} onClick={() => { editor.chain().focus().toggleBulletList().run(); setActiveDropdown(null); }}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg><span>Bullet List</span></button>
            <button className={`toolbar-dropdown-item ${editor.isActive('orderedList') ? 'text-indigo-600 dark:text-indigo-400' : ''}`} onClick={() => { editor.chain().focus().toggleOrderedList().run(); setActiveDropdown(null); }}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg><span># List</span></button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>,
    <motion.div key="sep-3" custom={7} variants={itemVariants} className="toolbar-separator"></motion.div>,
    <motion.div key="link" custom={8} variants={itemVariants}>
      <EditorMenuButton onClick={() => { const url = window.prompt('Enter URL'); if (url) { editor.chain().focus().setLink({ href: url }).run(); } }} isActive={editor.isActive('link')} tooltip="Insert Link">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
      </EditorMenuButton>
    </motion.div>,
    editor.isActive('link') && ( <motion.div key="unlink" custom={9} variants={itemVariants}> <EditorMenuButton onClick={() => editor.chain().focus().unsetLink().run()} tooltip="Remove Link"> <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.364 18.364A9 9 0 1 1 5.636 5.636a9 9 0 0 1 12.728 12.728z"></path><path d="M15 9l-6 6"></path></svg> </EditorMenuButton> </motion.div> ),
    editor.isActive('link') && ( <motion.div key="sep-4" custom={10} variants={itemVariants} className="toolbar-separator"></motion.div> ),
    <motion.div key="highlight" custom={11} variants={itemVariants}>
      <EditorMenuButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} tooltip="Highlight">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 11-6 6v3h9l3-3"></path><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"></path></svg>
      </EditorMenuButton>
    </motion.div>,
    <motion.div key="clear" custom={12} variants={itemVariants}>
      <EditorMenuButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} tooltip="Clear Formatting">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
      </EditorMenuButton>
    </motion.div>
  ];
  
  const filteredButtons = buttons.filter(Boolean);

  return (
    <motion.div
      className="editor-toolbar"
      ref={toolbarRef}
      initial="hidden" 
      animate="visible" 
      variants={{ 
        hidden: { opacity: 0, y: 0 }, // Explicitly set y:0
        visible: {
          opacity: 1,
          y: 0, // Explicitly set y:0
          transition: {
            delay: 0.15, // Slightly increased delay
            duration: 0.3,
            when: "beforeChildren", 
          }
        }
      }}
    >
      {filteredButtons}
    </motion.div>
  );
};

export default EditorToolbar;