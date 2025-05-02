// src/components/GuestRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

function GuestRoute({ children }) {
  const { currentUser, loading, isGuestMode } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading...</p>
        </motion.div>
      </div>
    );
  }
  
  // Allow access if user is authenticated OR in guest mode
  if (currentUser || isGuestMode) {
    return children;
  }
  
  // Otherwise redirect to login
  return <Navigate to="/login" replace />;
}

export default GuestRoute;