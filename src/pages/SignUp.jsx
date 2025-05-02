// src/pages/SignUp.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const navigate = useNavigate();
  const { isGuestMode, disableGuestMode } = useAuth();
  const { getMergeOptions } = useNotes();
  
  // Check if there are guest notes to transfer
  const { hasGuestNotes, guestNotesCount } = getMergeOptions();

  // Handler for transferring guest notes after signup
  const handleNoteTransfer = async (user) => {
    if (isGuestMode && hasGuestNotes) {
      console.log(`Transferring ${guestNotesCount} guest notes to new user account using UID:`, user.uid);
      
      try {
        // Perform direct transfer instead of relying on context
        const storedNotes = localStorage.getItem('guestNotes');
        if (!storedNotes) {
          console.log("No guest notes found in localStorage");
          disableGuestMode();
          navigate('/notes');
          return;
        }
        
        const guestNotes = JSON.parse(storedNotes);
        console.log(`Found ${guestNotes.length} guest notes to transfer directly`);
        
        // Create each note in Firestore
        let transferredCount = 0;
        
        for (const note of guestNotes) {
          try {
            const newNote = {
              title: note.title || '',
              content: note.content || '',
              userId: user.uid,
              created: serverTimestamp(),
              lastUpdated: serverTimestamp(),
              deleted: false,
              deletedAt: null
            };
            
            // Add to Firestore using the direct db reference
            const docRef = await addDoc(collection(db, 'notes'), newNote);
            console.log(`Successfully transferred note to ID: ${docRef.id}`);
            transferredCount++;
          } catch (err) {
            console.error(`Error transferring note:`, err);
          }
        }
        
        console.log(`Successfully transferred ${transferredCount} of ${guestNotes.length} notes directly`);
        
        // Clear guest notes after successful transfer to prevent duplicates
        localStorage.removeItem('guestNotes');
      } catch (err) {
        console.error("Error during direct note transfer:", err);
      } finally {
        // Always disable guest mode after trying to transfer
        disableGuestMode();
        
        // Clear the guest sign-in redirect flag
        sessionStorage.removeItem('guestSignInRedirect');
        
        // Navigate to notes list
        navigate('/notes');
      }
    } else {
      // No notes to transfer or not in guest mode
      disableGuestMode();
      navigate('/notes');
    }
  };

  // --- Handler for Email/Password Sign Up ---
  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoadingEmail(true);

    // Validation...
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      setIsLoadingEmail(false); return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoadingEmail(false); return;
    }
     if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setIsLoadingEmail(false); return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created successfully (Email/Pass):', userCredential.user);
      
      // Transfer notes if in guest mode - pass user object directly
      await handleNoteTransfer(userCredential.user);
    } catch (err) {
      console.error("Firebase signup error (Email/Pass):", err.code, err.message);
       switch (err.code) {
        case 'auth/email-already-in-use':
          setError('This email address is already registered.'); break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.'); break;
        case 'auth/weak-password':
          setError('Password is too weak.'); break;
        case 'auth/configuration-not-found':
             setError('Email/Password sign-in is not enabled in Firebase console.'); break;
        default:
          setError('Failed to create account. Please try again.');
      }
    } finally {
      setIsLoadingEmail(false);
    }
  };

  // --- Handler for Google Sign Up / Sign In ---
  const handleGoogleSignUp = async () => {
     setError('');
    setIsLoadingGoogle(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("User signed up/in with Google:", user);
      
      // Transfer notes if in guest mode - pass user object directly
      await handleNoteTransfer(user);
    } catch (err) {
      console.error("Firebase Google sign-in error:", err.code, err.message);
      if (err.code === 'auth/popup-closed-by-user') {
           setError('Sign-in process cancelled.');
      } else {
          setError('Failed to sign in with Google. Please try again.');
      }
    } finally {
        setIsLoadingGoogle(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Create Account</h2>

        {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}
        
        {/* Show guest mode note transfer message if applicable */}
        {isGuestMode && hasGuestNotes && (
          <div className="bg-blue-50 text-blue-700 p-3 rounded mb-4">
            <p className="font-medium">You have {guestNotesCount} notes in guest mode</p>
            <p className="text-sm mt-1">These will be transferred to your account when you sign up.</p>
          </div>
        )}

        {/* --- Email/Password Form --- */}
        <form onSubmit={handleEmailSubmit}>
          {/* Inputs disabled based on loading states */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email Address</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="you@example.com" required disabled={isLoadingEmail || isLoadingGoogle} />
          </div>
          <div className="mb-4">
             <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="••••••••" required disabled={isLoadingEmail || isLoadingGoogle} />
            <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters long.</p>
          </div>
          <div className="mb-6">
             <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">Confirm Password</label>
            <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="••••••••" required disabled={isLoadingEmail || isLoadingGoogle} />
          </div>
          <div className="mb-4">
            <button
              type="submit"
              className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full ${isLoadingEmail ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoadingEmail || isLoadingGoogle} // Disable if any are loading
            >
              {isLoadingEmail ? 'Signing Up...' : 'Sign Up with Email'}
            </button>
          </div>
        </form>
         {/* --- End Email/Password Form --- */}

         {/* --- OR Divider --- */}
         <div className="my-4 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-neutral-300 after:mt-0.5 after:flex-1 after:border-t after:border-neutral-300">
            <p className="mx-4 mb-0 text-center font-semibold text-gray-500">OR</p>
         </div>
         {/* --- End OR Divider --- */}

         {/* --- Social Sign Up Buttons --- */}
         <div className="space-y-3">
            {/* Google Button */}
            <button
                onClick={handleGoogleSignUp}
                type="button"
                className={`flex w-full items-center justify-center rounded bg-white px-6 py-2.5 text-sm font-medium uppercase leading-normal text-black shadow-md transition duration-150 ease-in-out hover:shadow-lg focus:shadow-lg focus:outline-none focus:ring-0 active:shadow-lg border border-gray-300 ${isLoadingGoogle ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isLoadingEmail || isLoadingGoogle} // Disable if any are loading
            >
                {/* Google Icon */}
                <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.4 0 6.3 1.2 8.7 3.4l6.5-6.5C35.3 2.6 30.1 0 24 0 14.9 0 7.4 5.4 4 13l7.8 6C13.8 12.8 18.5 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.7 24.1c0-1.6-.1-3.1-.4-4.6H24v8.8h12.8c-.6 2.8-2.3 5.2-4.8 6.8l7.8 6c4.6-4.2 7.3-10.2 7.3-17z"></path><path fill="#FBBC05" d="M11.8 28.1c-.6-1.8-.9-3.7-.9-5.6s.3-3.8.9-5.6l-7.8-6C1.6 15.7 0 20.1 0 24.6s1.6 8.9 4 13l7.8-6z"></path><path fill="#34A853" d="M24 48c5.9 0 10.9-1.9 14.6-5.2l-7.8-6c-2 1.3-4.5 2.1-7.3 2.1-5.5 0-10.2-3.3-11.9-7.9l-7.8 6C7.2 42.4 14.9 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
                {isLoadingGoogle ? 'Processing...' : 'Continue with Google'}
            </button>
         </div>
         {/* --- End Social Sign Up Buttons --- */}

        {/* --- Link to Login Page and Guest Mode --- */}
        <div className="mt-6 flex justify-center items-center space-x-4">
          <Link to="/guest" className="text-gray-600 hover:text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Continue as Guest
          </Link>
          <span className="text-gray-400">|</span>
          <Link to="/login" className="text-blue-600 hover:text-blue-800">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SignUp;