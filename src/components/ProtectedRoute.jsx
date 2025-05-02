// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import GuestBanner from './GuestBanner';

function ProtectedRoute({ children, allowGuest = false }) {
  const { currentUser, loading, isGuestMode } = useAuth();
  const location = useLocation();
  
  // Check for logout redirect token
  const hasLogoutToken = localStorage.getItem('logout_redirect');
  
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
  
  // Allow access if user is authenticated OR if guest mode is enabled and this route allows guests
  if (currentUser || (isGuestMode && allowGuest)) {
    return (
      <>
        {/* Show the guest banner for guests */}
        {isGuestMode && allowGuest && <GuestBanner />}
        {/* The actual protected content */}
        {children}
      </>
    );
  }
  
  // If we have a logout token, redirect to landing page
  if (hasLogoutToken) {
    localStorage.removeItem('logout_redirect');
    return <Navigate to="/" replace />;
  }
  
  // Standard unauthenticated redirect - either to login or to guest mode
  return <Navigate to="/login" replace />;
}

export default ProtectedRoute;