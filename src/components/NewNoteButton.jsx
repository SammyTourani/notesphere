// src/components/NewNoteButton.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

function NewNoteButton() {
  const navigate = useNavigate();
  
  const handleClick = () => {
    console.log("New note button clicked, navigating to /notes/new");
    navigate('/notes/new');
  };
  
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className="fixed right-6 bottom-6 z-10 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full p-3 shadow-lg"
      aria-label="New Note"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </motion.button>
  );
}

export default NewNoteButton;