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

// Import Page Components and ProtectedRoute
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

// --- Main application view (after login) ---
function AppDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [noteContent, setNoteContent] = useState(''); // State for the text editor content
  const [isLoadingNote, setIsLoadingNote] = useState(true); // State for loading note
  const [isSaving, setIsSaving] = useState(false); // State to indicate saving activity
  const debounceTimeoutRef = useRef(null); // Ref to hold the timeout ID for debouncing
  const noteId = "default_note"; // Using a single default note for now

  // --- Function to Load Note ---
  const loadNote = useCallback(async () => {
    if (!currentUser) return; // Don't run if user is not logged in
    setIsLoadingNote(true);
    console.log("Attempting to load note...");
    // Construct the path to the user's specific note document
    const noteRef = doc(db, "users", currentUser.uid, "notes", noteId);
    try {
      const docSnap = await getDoc(noteRef);
      if (docSnap.exists()) {
        // If the document exists, set the editor content
        setNoteContent(docSnap.data().content || ''); // Use content field, default to empty string
        console.log("Note loaded successfully.");
      } else {
        // Document doesn't exist (e.g., first time user)
        console.log("No such note document! Starting fresh.");
        setNoteContent(''); // Start with empty content
      }
    } catch (error) {
      console.error("Error loading note: ", error);
      // Handle error appropriately (e.g., show message to user)
      setNoteContent(''); // Default to empty on error
    } finally {
      setIsLoadingNote(false);
    }
  }, [currentUser, noteId]); // Dependencies: re-run if user or noteId changes

  // --- Function to Save Note ---
  const saveNote = useCallback(async (contentToSave) => {
    if (!currentUser) return; // Don't run if user is not logged in
    setIsSaving(true); // Indicate saving started
    console.log("Attempting to save note...");
    // Construct the path to the user's specific note document
    const noteRef = doc(db, "users", currentUser.uid, "notes", noteId);
    try {
      // Use setDoc with merge: true to create or update the document
      await setDoc(noteRef, {
        content: contentToSave,
        lastUpdated: serverTimestamp() // Add a timestamp
      }, { merge: true });
      console.log("Note saved successfully.");
      // Keep isSaving true briefly for visual feedback
      setTimeout(() => setIsSaving(false), 800); // Shorter delay now
    } catch (error) {
      console.error("Error saving note: ", error);
      setIsSaving(false); // Ensure saving indicator hides on error
    }
    // Removed finally block here, handled timing within try/catch
  }, [currentUser, noteId]); // Dependencies: re-run if user or noteId changes

  // --- Effect to Load Note on Mount or User Change ---
  useEffect(() => {
    if (currentUser) {
      loadNote();
    } else {
      // Handle case where user logs out while dashboard is mounted (optional)
      setNoteContent('');
      setIsLoadingNote(false);
    }
  }, [currentUser, loadNote]); // Run when currentUser or loadNote function changes

  // --- Effect for Autosave with Debouncing ---
  useEffect(() => {
    // Don't save initial load or while loading
    if (isLoadingNote) return;

    // Clear the previous timeout if there was one
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set a new timeout to save the note after a delay (e.g., 1.5 seconds)
    debounceTimeoutRef.current = setTimeout(() => {
      saveNote(noteContent);
    }, 1500); // Adjust delay as needed (in milliseconds)

    // Cleanup function: clear the timeout if the component unmounts
    // or if noteContent changes again before the timeout finishes
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [noteContent, saveNote, isLoadingNote]); // Run whenever noteContent changes (after initial load)


  // --- Logout Function ---
  const handleLogout = async () => {
    // Optional: Consider saving unsaved changes before logout
    if (debounceTimeoutRef.current) {
       clearTimeout(debounceTimeoutRef.current);
       // Maybe await saveNote(noteContent); // Uncomment to force save on logout
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

  // --- Render Logic ---
  return (
    // Main container with gradient, animation, font, and overflow handling
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 bg-[length:400%_400%] animate-gradient-xy font-inter overflow-hidden">
      {/* Top Navigation Bar - Absolutely positioned, subtle */}
      <nav className="absolute top-0 left-0 right-0 z-10 p-4 transition-opacity duration-300 opacity-60 hover:opacity-100">
        <ul className="flex justify-between items-center max-w-6xl mx-auto">
          <li>
            <span className="font-bold text-xl text-gray-700 tracking-tight">NoteSphere</span>
          </li>
          <li>
            {/* Removed saving text indicator from here */}
            <button
              onClick={handleLogout}
              className="bg-gray-900/5 hover:bg-gray-900/10 text-gray-600 font-medium py-1.5 px-4 rounded-full text-xs transition duration-200 ease-in-out"
            >
              Logout
            </button>
          </li>
        </ul>
      </nav>

      {/* Main Content Area - Centers the text area container */}
      {/* Added relative positioning for absolute children (spinner, save indicator) */}
      <main className="flex-1 flex items-center justify-center pt-16 pb-8 px-4 overflow-y-auto relative">

        {/* Centered Typing Area Container - Added relative positioning */}
        <div className="w-full max-w-2xl relative">

          {/* Loading Spinner Overlay */}
          {isLoadingNote && (
            // Covers the container, centers spinner, slightly blurred background
            <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm z-20 rounded-lg"> {/* Added rounded-lg */}
              {/* Tailwind spinner */}
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Text Area - Fades in after loading */}
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            // Applies styles including fade-in transition based on loading state
            className={`w-full h-[75vh] p-2 bg-transparent text-gray-800 placeholder:text-gray-400/90 text-base sm:text-lg font-normal leading-relaxed sm:leading-loose focus:outline-none resize-none caret-blue-600 transition-opacity duration-300 ${isLoadingNote ? 'opacity-0' : 'opacity-100'}`}
            placeholder="Write freely..."
            disabled={isLoadingNote || !currentUser} // Disable while loading or if no user
          />

          {/* Minimalist Save Indicator Dot */}
          {/* Positioned bottom-right relative to this container */}
          <div
             // Applies pulsing animation and controls visibility based on isSaving state
             className={`absolute bottom-4 right-4 h-2.5 w-2.5 rounded-full bg-blue-500 transition-opacity duration-500 ease-in-out animate-pulse-subtle ${isSaving ? 'opacity-75' : 'opacity-0'}`}
             title="Saving..." // Tooltip for accessibility
           ></div>

        </div>
      </main>
    </div>
  );
}
// --- End AppDashboard ---

// App component setup for routing
function App() {
  return (
    <div>
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
  );
}

export default App;

