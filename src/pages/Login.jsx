// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db, microsoftProvider } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';
import { motion } from 'framer-motion';
import AuthAnimation from '../components/AuthAnimation';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Login-specific phrases for the animation
const loginPhrases = [
  "Your ideas and notes are waiting for you",
  "Welcome back to your digital notebook",
  "Pick up right where you left off",
  "Your thoughts are securely stored",
  "Access your notes from any device",
  "Continue your creative journey",
  "Your digital workspace awaits"
];

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingMicrosoft, setIsLoadingMicrosoft] = useState(false);
  const [formFocus, setFormFocus] = useState(null);
  const navigate = useNavigate();
  const { isGuestMode, disableGuestMode } = useAuth();
  const { getMergeOptions } = useNotes();
  
  // Check if there are guest notes to transfer
  const { hasGuestNotes, guestNotesCount } = getMergeOptions();

  // Handler for transferring guest notes after login
  const handleNoteTransfer = async (user) => {
    if (isGuestMode && hasGuestNotes) {
      console.log(`Transferring ${guestNotesCount} guest notes to user account using UID:`, user.uid);
      
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
      
      // Transfer notes if in guest mode - pass user object directly
      await handleNoteTransfer(userCredential.user);
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

  // --- Handler for Microsoft Sign In ---
  const handleMicrosoftLogin = async () => {
    setError('');
    setIsLoadingMicrosoft(true);

    try {
      const result = await signInWithPopup(auth, microsoftProvider);
      const user = result.user;
      console.log("User signed in with Microsoft:", user);
      
      // Transfer notes if in guest mode - pass user object directly
      await handleNoteTransfer(user);
    } catch (err) {
      console.error("Firebase Microsoft sign-in error:", err.code, err.message);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in process cancelled.');
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with the same email address but different sign-in credentials.');
      } else {
        setError('Failed to sign in with Microsoft. Please try again.');
      }
    } finally {
      setIsLoadingMicrosoft(false);
    }
  };

  // Are any authentication methods loading?
  const isLoading = isLoadingEmail || isLoadingGoogle || isLoadingMicrosoft;

  const formVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 }
  };

  const inputClasses = "w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 dark:focus:ring-purple-500/30 transition-all duration-200";
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <div className="flex flex-col lg:flex-row h-screen">
      {/* Animated Side */}
      <div className="hidden lg:block w-full lg:w-1/2 h-full">
        <AuthAnimation isLogin={true} phrases={loginPhrases} />
      </div>
      
      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-gray-900 overflow-hidden">
        <motion.div 
          className="max-w-md w-full"
          variants={formVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20 dark:shadow-purple-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
            <p className="mt-3 text-gray-500 dark:text-gray-400">Sign in to your account and continue your journey</p>
          </motion.div>
          
          {error && (
            <motion.div 
              variants={itemVariants}
              className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/20 text-red-600 dark:text-red-400 rounded-lg p-4 flex items-start"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p>{error}</p>
            </motion.div>
          )}
          
          {/* Show guest mode note transfer message if applicable */}
          {isGuestMode && hasGuestNotes && (
            <motion.div 
              variants={itemVariants}
              className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/20 text-blue-600 dark:text-blue-400 rounded-lg p-4"
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                <p className="font-medium">You have {guestNotesCount} notes in guest mode</p>
              </div>
              <p className="text-sm mt-1 ml-7">These will be transferred to your account when you log in.</p>
            </motion.div>
          )}

          <motion.form variants={itemVariants} onSubmit={handleEmailLogin} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label htmlFor="login-email" className={labelClasses}>Email Address</label>
                <div className={`relative ${formFocus === 'email' ? 'transform scale-[1.01]' : ''} transition-transform duration-200`}>
                  <input 
                    type="email" 
                    id="login-email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    onFocus={() => setFormFocus('email')}
                    onBlur={() => setFormFocus(null)}
                    className={inputClasses}
                    placeholder="you@example.com" 
                    required 
                    disabled={isLoading} 
                  />
                  <div className="absolute inset-0 border border-purple-500/0 rounded-lg pointer-events-none transition-opacity duration-200"></div>
                </div>
              </div>
              
              <div>
                <label htmlFor="login-password" className={labelClasses}>Password</label>
                <div className={`relative ${formFocus === 'password' ? 'transform scale-[1.01]' : ''} transition-transform duration-200`}>
                  <input 
                    type="password" 
                    id="login-password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    onFocus={() => setFormFocus('password')}
                    onBlur={() => setFormFocus(null)}
                    className={inputClasses}
                    placeholder="••••••••" 
                    required 
                    disabled={isLoading}
                  />
                  <div className="absolute inset-0 border border-purple-500/0 rounded-lg pointer-events-none transition-opacity duration-200"></div>
                </div>
              </div>
            </div>
            
            <motion.button
              type="submit"
              variants={buttonVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
              disabled={isLoading}
              className={`w-full flex items-center justify-center py-3 px-6 rounded-lg text-white font-medium transition-all duration-200 ${
                isLoadingEmail 
                  ? 'bg-purple-400 dark:bg-purple-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 shadow-md hover:shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20'
              }`}
            >
              {isLoadingEmail ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing In...</span>
                </>
              ) : (
                'Sign In with Email'
              )}
            </motion.button>
          </motion.form>
          
          <motion.div variants={itemVariants} className="my-8 flex items-center">
            <div className="flex-grow h-0.5 bg-gray-200 dark:bg-gray-700"></div>
            <p className="mx-4 text-sm text-gray-500 dark:text-gray-400">or continue with</p>
            <div className="flex-grow h-0.5 bg-gray-200 dark:bg-gray-700"></div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.button
              variants={buttonVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className={`flex items-center justify-center py-3 px-4 rounded-lg font-medium border transition-all duration-200 ${
                isLoadingGoogle
                  ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 hover:shadow-md'
              }`}
            >
              {isLoadingGoogle ? (
                <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z" />
                    <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z" />
                    <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z" />
                    <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z" />
                  </svg>
                  <span>Google</span>
                </>
              )}
            </motion.button>
            
            <motion.button
              variants={buttonVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
              onClick={handleMicrosoftLogin}
              disabled={isLoading}
              className={`flex items-center justify-center py-3 px-4 rounded-lg font-medium border transition-all duration-200 ${
                isLoadingMicrosoft
                  ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 hover:shadow-md'
              }`}
            >
              {isLoadingMicrosoft ? (
                <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23">
                    <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
                    <path fill="#f35325" d="M1 1h10v10H1z"/>
                    <path fill="#81bc06" d="M12 1h10v10H12z"/>
                    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                    <path fill="#ffba08" d="M12 12h10v10H12z"/>
                  </svg>
                  <span>Microsoft</span>
                </>
              )}
            </motion.button>
          </motion.div>
          
          <motion.div variants={itemVariants} className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <Link 
              to="/guest" 
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center text-sm transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Continue as Guest
            </Link>
            
            <Link 
              to="/signup" 
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium text-sm bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 py-2 px-4 rounded-lg transition-colors"
            >
              Create Account
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default Login;