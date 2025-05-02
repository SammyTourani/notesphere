// src/App.jsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import SlideInMenu from './components/SlideInMenu';
import GuestBanner from './components/GuestBanner';
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import NotesList from './components/NotesList';
import TrashView from './components/TrashView';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import SingleNoteEditor from './components/SingleNoteEditor';
import SavePrompt from './components/SavePrompt';
import MergeOptions from './components/MergeOptions';
import NewNoteButton from './components/NewNoteButton';

function App() {
  const { currentUser, isGuestMode, enableGuestMode } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMergeOptions, setShowMergeOptions] = useState(false);
  
  // For debugging
  useEffect(() => {
    console.log("App rendered - currentUser:", !!currentUser, "isGuestMode:", isGuestMode);
  }, [currentUser, isGuestMode]);
  
  // Handle the intentional logout flag for routes
  const isIntentionalLogout = sessionStorage.getItem('intentional_logout');
  
  // Handle guest mode activation from route
  useEffect(() => {
    const path = location.pathname;
    
    // Enable guest mode if navigating to /guest
    if (path === '/guest' && !currentUser && !isGuestMode) {
      console.log("Enabling guest mode from /guest route");
      enableGuestMode();
      navigate('/notes', { replace: true });
    }
  }, [location.pathname, currentUser, isGuestMode, enableGuestMode, navigate]);
  
  // Handle post-authentication redirection for guest users
  useEffect(() => {
    // Check if we have a pending guest redirect
    const hasGuestRedirect = sessionStorage.getItem('guestSignInRedirect');
    
    // Only process this if currentUser exists (user is authenticated) and we have a redirect flag
    if (currentUser && hasGuestRedirect) {
      console.log("Processing post-auth guest redirect");
      // Clear the redirect flag
      sessionStorage.removeItem('guestSignInRedirect');
      
      // Always navigate to the notes list after guest → authenticated transition
      navigate('/notes', { replace: true });
    }
  }, [currentUser, navigate]);
  
  // Update last visited page for returning users
  useEffect(() => {
    if (!currentUser) return;
    
    // Save the last visited note when navigating
    const path = location.pathname;
    if (path.startsWith('/notes/') && path !== '/notes/new') {
      const noteId = path.split('/').pop();
      localStorage.setItem(`lastNote-${currentUser.uid}`, noteId);
    }
  }, [currentUser, location]);
  
  // Get initial redirect location
  const getInitialRedirect = () => {
    if (!currentUser) return '/';
    
    // Always redirect to notes list when coming from guest mode
    if (sessionStorage.getItem('guestSignInRedirect')) {
      return '/notes';
    }
    
    // Check if user was previously on a specific note
    const lastNote = localStorage.getItem(`lastNote-${currentUser.uid}`);
    if (lastNote) {
      return `/notes/${lastNote}`;
    }
    
    return '/notes';
  };
  
  // Clear intentional logout flag if on landing page
  useEffect(() => {
    if (location.pathname === '/') {
      sessionStorage.removeItem('intentional_logout');
    }
  }, [location.pathname]);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <SlideInMenu />
      <GuestBanner />
      
      {/* Show merge options dialog if needed */}
      {showMergeOptions && (
        <MergeOptions onClose={() => setShowMergeOptions(false)} />
      )}
      
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          
          <Route path="/login" element={
            currentUser ? (
              <Navigate to={getInitialRedirect()} replace />
            ) : (
              isIntentionalLogout ? (
                <Navigate to="/" replace />
              ) : (
                <Login />
              )
            )
          } />
          
          <Route path="/signup" element={
            currentUser ? <Navigate to={getInitialRedirect()} replace /> : <SignUp />
          } />
          
          {/* Guest mode routes */}
          <Route path="/guest" element={
            <Navigate to="/notes" replace />
          } />
          
          <Route path="/save-prompt" element={<SavePrompt />} />
          
          <Route path="/merge-options" element={
            <MergeOptions onClose={() => navigate('/notes')} />
          } />
          
          {/* Protected routes with guest access */}
          <Route
            path="/notes"
            element={
              currentUser || isGuestMode ? (
                <>
                  <NotesList />
                  <NewNoteButton />
                </>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          
          <Route
            path="/notes/new"
            element={
              currentUser || isGuestMode ? (
                <SingleNoteEditor />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          
          <Route
            path="/notes/:noteId"
            element={
              currentUser || isGuestMode ? (
                <SingleNoteEditor />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          
          {/* Protected routes without guest access */}
          <Route
            path="/trash"
            element={
              <ProtectedRoute>
                <TrashView />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

export default App;