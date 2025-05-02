// src/components/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const navigate = useNavigate();
  const { isGuestMode, disableGuestMode } = useAuth();
  const { transferGuestNotesToUser } = useNotes();

  // Handler to transfer guest notes after successful login
  const transferNotesIfNeeded = async () => {
    if (isGuestMode) {
      console.log("Transferring guest notes to user account");
      await transferGuestNotesToUser();
      disableGuestMode();
    }
  };

  // --- Handler for Email/Password Login ---
  const handleEmailLogin = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoadingEmail(true);

    if (!email || !password) {
      setError('Please enter both email and password.');
      setIsLoadingEmail(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User logged in successfully (Email/Pass):', userCredential.user);
      
      // Transfer guest notes if needed
      await transferNotesIfNeeded();
      
      // Redirect to notes page instead of /app
      navigate('/notes');

    } catch (err) {
      console.error("Firebase login error (Email/Pass):", err.code, err.message);
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
             setError('Invalid email or password. Please try again.');
             break;
        case 'auth/invalid-email':
             setError('Please enter a valid email address.');
             break;
        case 'auth/too-many-requests':
             setError('Access temporarily disabled due to too many failed login attempts. Please reset your password or try again later.');
             break;
        default:
          setError('Failed to log in. Please try again.');
      }
    } finally {
      setIsLoadingEmail(false);
    }
  };

  // --- Handler for Google Sign In ---
  const handleGoogleLogin = async () => {
    setError('');
    setIsLoadingGoogle(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("User signed in with Google:", user);
      
      // Transfer guest notes if needed
      await transferNotesIfNeeded();
      
      // Redirect to notes page
      navigate('/notes');

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
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Log In</h2>

        {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}

        {/* --- Email/Password Form --- */}
        <form onSubmit={handleEmailLogin}>
          {/* Inputs disabled based on loading states */}
          <div className="mb-4">
            <label htmlFor="login-email" className="block text-gray-700 text-sm font-bold mb-2">Email Address</label>
            <input type="email" id="login-email" value={email} onChange={(e) => setEmail(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="you@example.com" required disabled={isLoadingEmail || isLoadingGoogle} />
          </div>
          <div className="mb-6">
            <label htmlFor="login-password" className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input type="password" id="login-password" value={password} onChange={(e) => setPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="••••••••" required disabled={isLoadingEmail || isLoadingGoogle} />
          </div>
          <div className="mb-4">
            <button
              type="submit"
              className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full ${isLoadingEmail ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoadingEmail || isLoadingGoogle} // Disable if any are loading
            >
              {isLoadingEmail ? 'Logging In...' : 'Log In with Email'}
            </button>
          </div>
        </form>
        {/* --- End Email/Password Form --- */}

        {/* --- OR Divider --- */}
        <div className="my-4 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-neutral-300 after:mt-0.5 after:flex-1 after:border-t after:border-neutral-300">
           <p className="mx-4 mb-0 text-center font-semibold text-gray-500">OR</p>
        </div>
        {/* --- End OR Divider --- */}

        {/* --- Social Login Buttons --- */}
        <div className="space-y-3">
          {/* Google Button */}
          <button
              onClick={handleGoogleLogin}
              type="button"
              className={`flex w-full items-center justify-center rounded bg-white px-6 py-2.5 text-sm font-medium uppercase leading-normal text-black shadow-md transition duration-150 ease-in-out hover:shadow-lg focus:shadow-lg focus:outline-none focus:ring-0 active:shadow-lg border border-gray-300 ${isLoadingGoogle ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoadingEmail || isLoadingGoogle} // Disable if any are loading
          >
              {/* Google Icon */}
              <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.4 0 6.3 1.2 8.7 3.4l6.5-6.5C35.3 2.6 30.1 0 24 0 14.9 0 7.4 5.4 4 13l7.8 6C13.8 12.8 18.5 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.7 24.1c0-1.6-.1-3.1-.4-4.6H24v8.8h12.8c-.6 2.8-2.3 5.2-4.8 6.8l7.8 6c4.6-4.2 7.3-10.2 7.3-17z"></path><path fill="#FBBC05" d="M11.8 28.1c-.6-1.8-.9-3.7-.9-5.6s.3-3.8.9-5.6l-7.8-6C1.6 15.7 0 20.1 0 24.6s1.6 8.9 4 13l7.8-6z"></path><path fill="#34A853" d="M24 48c5.9 0 10.9-1.9 14.6-5.2l-7.8-6c-2 1.3-4.5 2.1-7.3 2.1-5.5 0-10.2-3.3-11.9-7.9l-7.8 6C7.2 42.4 14.9 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
              {isLoadingGoogle ? 'Processing...' : 'Continue with Google'}
          </button>
        </div>
        {/* --- End Social Login Buttons --- */}

        {/* --- Link to Sign Up Page --- */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            Sign Up
          </Link>
        </p>
         {/* --- End Link to Sign Up Page --- */}

      </div>
    </div>
  );
}

export default Login;