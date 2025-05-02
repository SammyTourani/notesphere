// src/App.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

// Import Firebase Auth functions and instance
import { signOut } from 'firebase/auth';
import { auth, db } from './firebaseConfig'; // Import db (Firestore instance)

// Import Firestore functions
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

// Import Auth Context hook
import { useAuth } from './context/AuthContext'; // Import useAuth
import { ThemeProvider } from './context/ThemeContext'; // Add ThemeProvider import

// Import Page Components and ProtectedRoute
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import ThemeToggle from './components/ThemeToggle'; // Add Theme Toggle import

// --- Main application view (after login) ---
function AppDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [noteContent, setNoteContent] = useState(''); // State for the text editor content
  const [noteTitle, setNoteTitle] = useState(''); // New: State for the note title
  const [isSaving, setIsSaving] = useState(false); // State to indicate saving activity
  const [isSyncing, setIsSyncing] = useState(false); // Background syncing indicator
  const debounceTimeoutRef = useRef(null); // Ref to hold the timeout ID for debouncing
  const noteId = "default_note"; // Using a single default note for now
  const titleRef = useRef(null); // Ref for the title input
  
  // --- Function to Try Loading from Local Storage ---
  const loadFromLocalStorage = useCallback(() => {
    if (!currentUser) return false;
    
    try {
      const cachedNote = localStorage.getItem(`note-${currentUser.uid}-${noteId}`);
      if (cachedNote) {
        const parsedNote = JSON.parse(cachedNote);
        setNoteContent(parsedNote.content || '');
        setNoteTitle(parsedNote.title || '');
        return true;
      }
    } catch (err) {
      console.warn("Error loading from localStorage:", err);
    }
    return false;
  }, [currentUser, noteId]);

  // --- Function to Load Note from Firebase ---
  const syncWithFirebase = useCallback(async () => {
    if (!currentUser) return;
    
    // Only show syncing indicator if we already have content from localStorage
    const hasLocalContent = noteContent !== '' || noteTitle !== '';
    if (hasLocalContent) {
      setIsSyncing(true);
    }
    
    console.log("Syncing with Firebase...");
    // Construct the path to the user's specific note document
    const noteRef = doc(db, "users", currentUser.uid, "notes", noteId);
    try {
      const docSnap = await getDoc(noteRef);
      if (docSnap.exists()) {
        // Only update if Firebase data is newer
        // This prevents overwriting user's latest changes if they've been working offline
        const localData = localStorage.getItem(`note-${currentUser.uid}-${noteId}`);
        let localTimestamp = 0;
        if (localData) {
          const parsedData = JSON.parse(localData);
          localTimestamp = new Date(parsedData.lastUpdated).getTime();
        }
        
        const serverData = docSnap.data();
        const serverTimestamp = serverData.lastUpdated?.toDate().getTime() || 0;
        
        // If server data is newer, update local state
        if (serverTimestamp > localTimestamp) {
          setNoteContent(serverData.content || '');
          setNoteTitle(serverData.title || '');
          
          // Update localStorage with newer data
          localStorage.setItem(`note-${currentUser.uid}-${noteId}`, JSON.stringify({
            content: serverData.content || '',
            title: serverData.title || '',
            lastUpdated: new Date(serverTimestamp).toISOString()
          }));
        }
      } else {
        // Document doesn't exist (new user) - we'll create it on first save
        console.log("No document found in Firebase, will create on save");
      }
    } catch (error) {
      console.error("Error syncing with Firebase: ", error);
    } finally {
      setIsSyncing(false);
    }
  }, [currentUser, noteId, noteContent, noteTitle]);

  // --- Function to Save Note ---
  const saveNote = useCallback(async (contentToSave, titleToSave) => {
    if (!currentUser) return;
    
    setIsSaving(true); // Indicate saving started
    
    // Always save to localStorage immediately for instant access next time
    const timestamp = new Date().toISOString();
    localStorage.setItem(`note-${currentUser.uid}-${noteId}`, JSON.stringify({
      content: contentToSave,
      title: titleToSave,
      lastUpdated: timestamp
    }));
    
    // Then save to Firestore
    try {
      const noteRef = doc(db, "users", currentUser.uid, "notes", noteId);
      await setDoc(noteRef, {
        content: contentToSave,
        title: titleToSave,
        lastUpdated: serverTimestamp()
      }, { merge: true });
      
      console.log("Note saved successfully to Firebase");
    } catch (error) {
      console.error("Error saving to Firebase: ", error);
      // Note: We don't show error to user since localStorage save succeeded
    } finally {
      // Brief visual feedback
      setTimeout(() => setIsSaving(false), 800);
    }
  }, [currentUser, noteId]);

  // --- Effect on Mount: Instant Load + Background Sync ---
  useEffect(() => {
    if (currentUser) {
      // Try loading from localStorage for instant access
      const loaded = loadFromLocalStorage();
      
      // Regardless of localStorage result, sync with Firebase in the background
      syncWithFirebase();
      
      // Focus on title field (if empty) or content area
      setTimeout(() => {
        if ((!noteTitle || noteTitle === '') && titleRef.current) {
          titleRef.current.focus();
        }
      }, 100);
    }
  }, [currentUser, loadFromLocalStorage, syncWithFirebase, noteTitle]);

  // --- Effect for Autosave with Debouncing ---
  useEffect(() => {
    if (!currentUser) return;
    
    // Skip the initial render (don't trigger save on load)
    const skipInitial = useRef(true);
    if (skipInitial.current) {
      skipInitial.current = false;
      return;
    }

    // Clear the previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set a new timeout to save after delay
    debounceTimeoutRef.current = setTimeout(() => {
      saveNote(noteContent, noteTitle);
    }, 1500);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [noteContent, noteTitle, saveNote, currentUser]);

  // --- Logout Function ---
  const handleLogout = async () => {
    // Force save before logout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      await saveNote(noteContent, noteTitle);
    }
    
    try {
      await signOut(auth);
      console.log("User signed out successfully.");
      navigate('/');
    } catch (error) {
      console.error("Error signing out: ", error);
      alert("Failed to log out. Please try again.");
    }
  };

  // Last saved time display
  const [lastSavedText, setLastSavedText] = useState('');
  
  useEffect(() => {
    let timeout;
    const updateLastSavedText = () => {
      try {
        const cachedNote = localStorage.getItem(`note-${currentUser?.uid}-${noteId}`);
        if (cachedNote) {
          const parsedNote = JSON.parse(cachedNote);
          const lastSaved = new Date(parsedNote.lastUpdated);
          const now = new Date();
          const diffMinutes = Math.floor((now - lastSaved) / 60000);
          
          if (diffMinutes < 1) {
            setLastSavedText('Saved just now');
          } else if (diffMinutes === 1) {
            setLastSavedText('Saved 1 minute ago');
          } else if (diffMinutes < 60) {
            setLastSavedText(`Saved ${diffMinutes} minutes ago`);
          } else {
            const hours = Math.floor(diffMinutes / 60);
            if (hours === 1) {
              setLastSavedText('Saved 1 hour ago');
            } else {
              setLastSavedText(`Saved ${hours} hours ago`);
            }
          }
        }
      } catch (err) {
        console.warn("Error updating last saved text:", err);
      }
      
      timeout = setTimeout(updateLastSavedText, 60000); // Update every minute
    };
    
    if (currentUser) {
      updateLastSavedText();
    }
    
    return () => clearTimeout(timeout);
  }, [currentUser, noteId, isSaving]);

  // --- Render Logic ---
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 bg-[length:400%_400%] animate-gradient-xy font-inter overflow-hidden">
      {/* Top Navigation Bar */}
      <nav className="absolute top-0 left-0 right-0 z-10 p-4 transition-opacity duration-300 opacity-60 hover:opacity-100">
        <ul className="flex justify-between items-center max-w-6xl mx-auto">
          <li>
            <span className="font-bold text-xl text-gray-700 dark:text-gray-200 tracking-tight">NoteSphere</span>
          </li>
          <li className="flex items-center space-x-3">
            {/* Status indicators */}
            <div className="flex items-center space-x-2">
              {isSyncing && (
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Syncing
                </span>
              )}
              
              {isSaving && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Saving...
                </span>
              )}
              
              {!isSaving && !isSyncing && lastSavedText && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {lastSavedText}
                </span>
              )}
            </div>
            
            <ThemeToggle />
            
            <button
              onClick={handleLogout}
              className="bg-gray-900/5 hover:bg-gray-900/10 dark:bg-gray-700/30 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-300 font-medium py-1.5 px-4 rounded-full text-xs transition duration-200 ease-in-out"
            >
              Logout
            </button>
          </li>
        </ul>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center pt-16 pb-8 px-4 overflow-y-auto">
        <div className="w-full max-w-2xl">
          {/* Title Input */}
          <input
            ref={titleRef}
            type="text"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Note title..."
            className="w-full p-2 mb-2 bg-transparent text-gray-900 dark:text-white text-2xl font-bold focus:outline-none"
          />

          {/* Text Area */}
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="w-full h-[70vh] p-2 bg-transparent text-gray-800 dark:text-gray-200 placeholder:text-gray-400/90 dark:placeholder:text-gray-500/90 text-base sm:text-lg font-normal leading-relaxed sm:leading-loose focus:outline-none resize-none caret-blue-600 dark:caret-blue-400"
            placeholder="Write freely..."
          />
        </div>
      </main>
    </div>
  );
}

// App component setup for routing
function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Protected Route for the main application */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </ThemeProvider>
  );
}

export default App;