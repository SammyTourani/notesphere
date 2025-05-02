import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import SlideInMenu from './components/SlideInMenu';
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import NotesList from './components/NotesList';
import TrashView from './components/TrashView';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import SingleNoteEditor from './components/SingleNoteEditor';

function App() {
  const { currentUser } = useAuth();
  const location = useLocation();
  
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
    
    // Check if user was previously on a specific note
    const lastNote = localStorage.getItem(`lastNote-${currentUser.uid}`);
    if (lastNote) {
      return `/notes/${lastNote}`;
    }
    
    return '/notes';
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <SlideInMenu />
      
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public routes */}
          <Route path="/" element={
            currentUser ? <Navigate to={getInitialRedirect()} replace /> : <LandingPage />
          } />
          <Route path="/login" element={
            currentUser ? <Navigate to={getInitialRedirect()} replace /> : <Login />
          } />
          <Route path="/signup" element={
            currentUser ? <Navigate to={getInitialRedirect()} replace /> : <SignUp />
          } />
          
          {/* Protected routes */}
          <Route
            path="/notes"
            element={
              <ProtectedRoute>
                <NotesList />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/notes/:noteId"
            element={
              <ProtectedRoute>
                <SingleNoteEditor />
              </ProtectedRoute>
            }
          />
          
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