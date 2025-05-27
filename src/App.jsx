import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import SlideInMenu from './components/SlideInMenu';
import GuestBanner from './components/GuestBanner';
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import UserOnboarding from './pages/UserOnboarding';
import NotesList from './components/NotesList';
import TrashView from './components/TrashView';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import SingleNoteEditor from './components/SingleNoteEditor';
import SavePrompt from './components/SavePrompt';
import MergeOptions from './components/MergeOptions';
import FloatingThemeToggle from './components/FloatingThemeToggle';
import UserProfile from './components/UserProfile';

function App() {
  const { currentUser, isGuestMode, enableGuestMode, isNewUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMergeOptions, setShowMergeOptions] = useState(false);
  
  // For debugging
  useEffect(() => {
    console.log("App rendered - currentUser:", !!currentUser, "isGuestMode:", isGuestMode, "isNewUser:", isNewUser);
  }, [currentUser, isGuestMode, isNewUser]);
  
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
  
  // Redirect new users to onboarding
  useEffect(() => {
    // Only redirect if:
    // 1. We have a current user (they're logged in)
    // 2. They're marked as a new user
    // 3. They're not already on the onboarding page
    // 4. They're not in guest mode
    // 5. They're not trying to access the profile page
    if (currentUser && isNewUser && 
        location.pathname !== '/onboarding' && 
        location.pathname !== '/profile' && 
        !isGuestMode) {
      console.log("Redirecting new user to onboarding");
      navigate('/onboarding', { replace: true });
    }
  }, [currentUser, isNewUser, location.pathname, isGuestMode, navigate]);
  
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
      // Add timestamp for when the note was last viewed
      localStorage.setItem(`lastNoteTimestamp-${currentUser.uid}`, Date.now().toString());
    }
  }, [currentUser, location]);
  
  // Get initial redirect location with improved logic
  const getInitialRedirect = () => {
    if (!currentUser) return '/';
    
    // If they're a new user, send them to onboarding
    if (isNewUser) {
      return '/onboarding';
    }
    
    // Always redirect to notes list when coming from guest mode
    if (sessionStorage.getItem('guestSignInRedirect')) {
      return '/notes';
    }
    
    // Only redirect to a specific note if:
    // 1. We have a last note ID in localStorage
    // 2. We have a timestamp indicating when it was last viewed
    // 3. The timestamp is recent (within the last hour)
    const lastNote = localStorage.getItem(`lastNote-${currentUser.uid}`);
    const lastNoteTimestamp = localStorage.getItem(`lastNoteTimestamp-${currentUser.uid}`);
    
    if (lastNote && lastNoteTimestamp) {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      if (parseInt(lastNoteTimestamp) > oneHourAgo) {
        // Only redirect to the specific note if it was viewed recently
        return `/notes/${lastNote}`;
      }
    }
    
    // Default: always go to notes list
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
      {/* Don't show menu/banner for onboarding */}
      {location.pathname !== '/onboarding' && (
        <>
          <SlideInMenu />
          <GuestBanner />
        </>
      )}
      <FloatingThemeToggle />
      
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
          
          {/* Onboarding route - only for authenticated users */}
          <Route path="/onboarding" element={
            currentUser ? (
              isNewUser ? <UserOnboarding /> : <Navigate to="/notes" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          {/* Profile route - accessible even for new users */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
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
                currentUser && isNewUser ? (
                  <Navigate to="/onboarding" replace />
                ) : (
                  <NotesList />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          
          <Route
            path="/notes/new"
            element={
              currentUser || isGuestMode ? (
                currentUser && isNewUser ? (
                  <Navigate to="/onboarding" replace />
                ) : (
                  <SingleNoteEditor />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          
          <Route
            path="/notes/:noteId"
            element={
              currentUser || isGuestMode ? (
                currentUser && isNewUser ? (
                  <Navigate to="/onboarding" replace />
                ) : (
                  <SingleNoteEditor />
                )
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
                {isNewUser ? (
                  <Navigate to="/onboarding" replace />
                ) : (
                  <TrashView />
                )}
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                {isNewUser ? (
                  <Navigate to="/onboarding" replace />
                ) : (
                  <SettingsPage />
                )}
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