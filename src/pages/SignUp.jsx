// src/pages/SignUp.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db, microsoftProvider } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../context/NotesContext';
import { motion } from 'framer-motion';
import AuthAnimation from '../components/AuthAnimation';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Signup-specific phrases for the animation
const signupPhrases = [
  "Create, organize, and access your notes from anywhere",
  "Capture your ideas with our powerful note-taking app",
  "Seamlessly sync your notes across all your devices",
  "Stay organized with customizable categories and tags",
  "Effortlessly share notes with teammates and friends",
  "Transform your ideas into actionable insights",
  "Simplify your digital life with NoteSphere"
];

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingMicrosoft, setIsLoadingMicrosoft] = useState(false);
  const [formFocus, setFormFocus] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  const { isGuestMode, disableGuestMode } = useAuth();
  const { getMergeOptions } = useNotes();
  
  // Check if there are guest notes to transfer
  const { hasGuestNotes, guestNotesCount } = getMergeOptions();

  // Check password strength
  const checkPasswordStrength = (pass) => {
    if (!pass) {
      setPasswordStrength(0);
      return;
    }
    
    let strength = 0;
    
    // Length check
    if (pass.length >= 8) strength += 1;
    
    // Character variety checks
    if (/[A-Z]/.test(pass)) strength += 1; // Uppercase
    if (/[a-z]/.test(pass)) strength += 1; // Lowercase
    if (/[0-9]/.test(pass)) strength += 1; // Numbers
    if (/[^A-Za-z0-9]/.test(pass)) strength += 1; // Special characters
    
    setPasswordStrength(strength);
  };

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

  // --- Handler for Microsoft Sign Up / Sign In ---
  const handleMicrosoftSignUp = async () => {
    setError('');
    setIsLoadingMicrosoft(true);

    try {
      const result = await signInWithPopup(auth, microsoftProvider);
      const user = result.user;
      console.log("User signed up/in with Microsoft:", user);
      
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

  const inputClasses = "w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 dark:focus:ring-purple-500/30 transition-all duration-200";
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  // Get strength indicator color
  const getStrengthColor = () => {
    switch(passwordStrength) {
      case 0: return 'bg-gray-200 dark:bg-gray-700';
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-blue-500';
      case 5: return 'bg-green-500';
      default: return 'bg-gray-200 dark:bg-gray-700';
    }
  };
  
  // Get strength label
  const getStrengthLabel = () => {
    switch(passwordStrength) {
      case 0: return '';
      case 1: return 'Very Weak';
      case 2: return 'Weak';
      case 3: return 'Fair';
      case 4: return 'Good';
      case 5: return 'Strong';
      default: return '';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen">
      {/* Animated Side */}
      <div className="hidden lg:block w-full lg:w-1/2 order-1 lg:order-2 h-full">
        <AuthAnimation isLogin={false} phrases={signupPhrases} />
      </div>
      
      {/* Form Side - Fixed height container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-white dark:bg-gray-900 overflow-auto order-2 lg:order-1">
        <motion.div 
          className="max-w-md w-full"
          variants={formVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-500 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-purple-500/20 dark:shadow-purple-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Join NoteSphere and start your note-taking journey</p>
          </motion.div>
          
          {/* Error and notification messages - fixed height */}
          <div className="mb-3 min-h-[40px]">
            {error && (
              <motion.div 
                variants={itemVariants}
                className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/20 text-red-600 dark:text-red-400 rounded-lg p-3 flex items-start text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p>{error}</p>
              </motion.div>
            )}
            
            {/* Guest mode note transfer message in the same container */}
            {isGuestMode && hasGuestNotes && !error && (
              <motion.div 
                variants={itemVariants}
                className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/20 text-blue-600 dark:text-blue-400 rounded-lg p-3 text-sm"
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  <p className="font-medium">You have {guestNotesCount} notes in guest mode</p>
                </div>
                <p className="text-xs mt-1 ml-6">These will be transferred to your account when you sign up.</p>
              </motion.div>
            )}
          </div>

          {/* Compact form with reduced vertical spacing */}
          <motion.form variants={itemVariants} onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label htmlFor="email" className={labelClasses}>Email Address</label>
                <div className={`relative ${formFocus === 'email' ? 'transform scale-[1.01]' : ''} transition-transform duration-200`}>
                  <input 
                    type="email" 
                    id="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    onFocus={() => setFormFocus('email')}
                    onBlur={() => setFormFocus(null)}
                    className={inputClasses}
                    placeholder="you@example.com" 
                    required 
                    disabled={isLoading} 
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className={labelClasses}>Password</label>
                <div className={`relative ${formFocus === 'password' ? 'transform scale-[1.01]' : ''} transition-transform duration-200`}>
                  <input 
                    type="password" 
                    id="password" 
                    value={password} 
                    onChange={(e) => {
                      setPassword(e.target.value);
                      checkPasswordStrength(e.target.value);
                    }} 
                    onFocus={() => setFormFocus('password')}
                    onBlur={() => setFormFocus(null)}
                    className={inputClasses}
                    placeholder="••••••••" 
                    required 
                    disabled={isLoading}
                  />
                </div>
                
                {/* Ultra-compact password strength indicator */}
                {password && (
                  <div className="flex items-center mt-1">
                    <div className="w-24 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      {[...Array(5)].map((_, i) => (
                        <div 
                          key={i}
                          style={{ width: i < passwordStrength ? '20%' : '0%' }}
                          className={`h-full inline-block ${i < passwordStrength ? getStrengthColor() : ''}`}
                        />
                      ))}
                    </div>
                    <span className={`ml-2 text-xs ${passwordStrength > 0 ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {getStrengthLabel()}
                    </span>
                  </div>
                )}
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className={labelClasses}>Confirm Password</label>
                <div className={`relative ${formFocus === 'confirmPassword' ? 'transform scale-[1.01]' : ''} transition-transform duration-200`}>
                  <input 
                    type="password" 
                    id="confirmPassword" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    onFocus={() => setFormFocus('confirmPassword')}
                    onBlur={() => setFormFocus(null)}
                    className={`${inputClasses} ${
                      confirmPassword && password !== confirmPassword 
                        ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10' 
                        : confirmPassword ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10' : ''
                    }`}
                    placeholder="••••••••" 
                    required 
                    disabled={isLoading}
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
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
              className={`w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-white font-medium transition-all duration-200 ${
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
                  <span>Creating Account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </motion.button>
          </motion.form>
          
          <motion.div variants={itemVariants} className="my-4 flex items-center">
            <div className="flex-grow h-px bg-gray-200 dark:bg-gray-700"></div>
            <p className="mx-4 text-xs text-gray-500 dark:text-gray-400">or continue with</p>
            <div className="flex-grow h-px bg-gray-200 dark:bg-gray-700"></div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
            <motion.button
              variants={buttonVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className={`flex items-center justify-center py-2 px-3 rounded-lg font-medium border text-sm transition-all duration-200 ${
                isLoadingGoogle
                  ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 hover:shadow-md'
              }`}
            >
              {isLoadingGoogle ? (
                <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
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
              onClick={handleMicrosoftSignUp}
              disabled={isLoading}
              className={`flex items-center justify-center py-2 px-3 rounded-lg font-medium border text-sm transition-all duration-200 ${
                isLoadingMicrosoft
                  ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 hover:shadow-md'
              }`}
            >
              {isLoadingMicrosoft ? (
                <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23">
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
          
          {/* Bottom links - Always visible section with fixed spacing */}
          <motion.div
            variants={itemVariants}
            className="mt-6 flex flex-row justify-between gap-4 text-center items-center"
          >
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
              to="/login" 
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium text-sm bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 py-2 px-4 rounded-lg transition-colors"
            >
              Sign In Instead
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default SignUp;