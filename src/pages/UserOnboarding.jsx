import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import PageTransition from '../components/PageTransition';
import Lottie from 'lottie-react';
import successAnimation from '../assets/animations/success-animation.json';
import loadingAnimation from '../assets/animations/loading-animation.json';
import avatarAnimation from '../assets/animations/avatar-animation.json';
import themeAnimation from '../assets/animations/theme-animation.json';
import confetti from 'canvas-confetti';

// Advanced profanity filter with comprehensive list
const PROFANITY_LIST = [
  'fuck', 'shit', 'ass', 'bitch', 'cunt', 'dick', 'cock', 'pussy',
  'whore', 'slut', 'bastard', 'damn', 'hell', 'piss', 'nsfw',
  'asshole', 'bullshit', 'motherfucker', 'fuckoff', 'dickhead',
  'twat', 'prick', 'bollocks', 'wanker', 'crap', 'bugger'
];

// Enhanced utility to check for profanity with sophisticated detection
const containsProfanity = (text) => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  
  // Check for exact matches and substring matches
  return PROFANITY_LIST.some(word => {
    // Check for exact word match with word boundaries
    const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
    if (wordRegex.test(lowerText)) return true;
    
    // Check for deliberate obfuscation (like 'f*ck', 'f**k', 'f.uck', etc.)
    const firstChar = word.charAt(0);
    const lastChar = word.charAt(word.length - 1);
    const obfuscationRegex = new RegExp(`\\b${firstChar}[^a-z]*${lastChar}\\b`, 'i');
    
    return obfuscationRegex.test(lowerText);
  });
};

// Expanded avatar options
const AVATAR_OPTIONS = [
  {
    id: 1,
    name: 'Classic',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=classic&backgroundColor=b6e3f4',
    color: 'bg-blue-500'
  },
  {
    id: 2,
    name: 'Professional',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=professional&backgroundColor=d1d4f9',
    color: 'bg-indigo-500'
  },
  {
    id: 3,
    name: 'Creative',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=creative&backgroundColor=c0aede',
    color: 'bg-purple-500'
  },
  {
    id: 4,
    name: 'Explorer',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=explorer&backgroundColor=ffdfbf',
    color: 'bg-orange-500'
  },
  {
    id: 5,
    name: 'Minimalist',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=minimalist&backgroundColor=bde4a8',
    color: 'bg-green-500'
  },
  {
    id: 6,
    name: 'Artistic',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=artistic&backgroundColor=ffd5dc',
    color: 'bg-pink-500'
  },
  {
    id: 7,
    name: 'Scholar',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=scholar&backgroundColor=f9d6c4',
    color: 'bg-amber-500'
  },
  {
    id: 8,
    name: 'Techie',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=techie&backgroundColor=c4e6f9',
    color: 'bg-cyan-500'
  },
  {
    id: 9,
    name: 'Mystic',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=mystic&backgroundColor=d8c4f9',
    color: 'bg-violet-500'
  },
  {
    id: 10,
    name: 'Custom',
    image: 'https://api.dicebear.com/7.x/personas/svg?seed=custom&backgroundColor=ffd5dc',
    color: 'bg-rose-500'
  }
];

// Theme options for user selection
const THEME_OPTIONS = [
  {
    id: 'light',
    name: 'Light Mode',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
      </svg>
    ),
    color: 'bg-gradient-to-br from-yellow-300 to-orange-400',
    background: 'bg-white',
    text: 'text-gray-900'
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
      </svg>
    ),
    color: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    background: 'bg-gray-900',
    text: 'text-white'
  },
  {
    id: 'auto',
    name: 'System Default',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
      </svg>
    ),
    color: 'bg-gradient-to-br from-gray-400 to-blue-500',
    background: 'bg-gradient-to-br from-gray-100 to-white dark:from-gray-900 dark:to-gray-800',
    text: 'text-gray-900 dark:text-white'
  }
];

// Usage preferences for personalization
const USAGE_OPTIONS = [
  {
    id: 'personal',
    name: 'Personal',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
      </svg>
    ),
    description: 'For your personal notes and tasks',
    color: 'bg-gradient-to-br from-blue-400 to-indigo-500'
  },
  {
    id: 'work',
    name: 'Work',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
      </svg>
    ),
    description: 'For work-related projects and tasks',
    color: 'bg-gradient-to-br from-green-400 to-teal-500'
  },
  {
    id: 'education',
    name: 'Education',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 14l9-5-9-5-9 5 9 5z"></path>
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"></path>
      </svg>
    ),
    description: 'For studying and learning',
    color: 'bg-gradient-to-br from-purple-400 to-pink-500'
  },
  {
    id: 'creative',
    name: 'Creative',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
      </svg>
    ),
    description: 'For artistic projects and ideas',
    color: 'bg-gradient-to-br from-yellow-400 to-orange-500'
  }
];

// Simple waving hand animation component
const WavingHand = () => {
  return (
    <motion.div
      className="text-7xl"
      animate={{
        rotate: [0, 20, -10, 20, 0],
      }}
      transition={{
        duration: 1.5,
        ease: "easeInOut",
        times: [0, 0.2, 0.5, 0.8, 1],
        repeat: Infinity,
        repeatDelay: 1
      }}
      style={{ originX: 0.7, originY: 0.7 }}
    >
      👋
    </motion.div>
  );
};

// Mouse follower cursor effect
const CursorFollower = () => {
  const cursorRef = useRef(null);
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  
  const handleMouseMove = useCallback((event) => {
    mouseX.set(event.clientX);
    mouseY.set(event.clientY);
  }, [mouseX, mouseY]);
  
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);
  
  const cursorX = useTransform(mouseX, (value) => value - 15);
  const cursorY = useTransform(mouseY, (value) => value - 15);
  
  return (
    <motion.div
      ref={cursorRef}
      className="pointer-events-none fixed z-50 h-8 w-8 rounded-full border-2 border-purple-600 bg-purple-400 bg-opacity-30 backdrop-blur-sm"
      style={{
        x: cursorX,
        y: cursorY,
      }}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 300,
        mass: 0.5
      }}
    />
  );
};

// Enhanced typing effect with configurable settings
const TypeWriter = ({ text, speed = 40, onComplete = () => {}, className = '' }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prevText => prevText + text[currentIndex]);
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, speed);
      
      return () => clearTimeout(timeout);
    } else if (!isComplete) {
      setIsComplete(true);
      onComplete();
    }
  }, [currentIndex, text, speed, isComplete, onComplete]);
  
  return (
    <span className={className}>
      {displayedText}
      <span className={`inline-block w-0.5 h-5 ml-0.5 bg-current align-middle ${isComplete ? 'opacity-0' : 'animate-blink'}`}></span>
    </span>
  );
};

// Particle system component for decorative effects
const ParticleSystem = ({ color = '#8B5CF6', count = 70 }) => { // increased count from 50 to 70
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);
  const mousePos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  
  // Listen to mouse movement to update mousePos
  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 2, // size from 2 to 5 (bigger particles)
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          opacity: Math.random() * 0.5 + 0.3
        });
      }
    };
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = color + Math.floor(particle.opacity * 255).toString(16).padStart(2, '0');
        ctx.fill();
        
        // Mouse repulsion: if particle is within 100px, push it away and slightly enlarge it.
        const dx = particle.x - mousePos.current.x;
        const dy = particle.y - mousePos.current.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 100) {
          const force = (100 - dist) / 100;
          particle.speedX += (dx / dist) * force * 0.05;
          particle.speedY += (dy / dist) * force * 0.05;
          particle.size = Math.min(particle.size * 1.01, 10);
        } else {
          particle.size = Math.max(particle.size * 0.99, 2);
        }
        
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.speedX *= -1;
        }
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.speedY *= -1;
        }
        if (Math.random() > 0.99) {
          particle.speedX = (Math.random() - 0.5) * 0.5;
          particle.speedY = (Math.random() - 0.5) * 0.5;
        }
      });
      animationRef.current = requestAnimationFrame(animate);
    };
    
    window.addEventListener('resize', setCanvasSize);
    setCanvasSize();
    initParticles();
    animate();
    
    return () => {
      window.removeEventListener('resize', setCanvasSize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [color, count]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-0 pointer-events-none"
    />
  );
};

// High-quality confetti explosion effect
const triggerConfetti = () => {
  const duration = 5000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
  
  const randomInRange = (min, max) => Math.random() * (max - min) + min;
  
  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    
    if (timeLeft <= 0) {
      return clearInterval(interval);
    }
    
    const particleCount = 50 * (timeLeft / duration);
    
    // Confetti burst
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    });
    
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    });
    
    // Confetti cannon
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'],
    });
    
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'],
    });
  }, 250);
};

// Enhanced gradient background component
const GradientBackground = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      setMousePosition({ x, y });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  return (
    <motion.div 
      className="absolute inset-0 z-0 opacity-50"
      animate={{
        background: [
          `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(139, 92, 246, 0.3), rgba(79, 70, 229, 0.2), rgba(59, 130, 246, 0.1))`,
          `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(236, 72, 153, 0.3), rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.1))`,
          `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(16, 185, 129, 0.3), rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.1))`,
          `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(139, 92, 246, 0.3), rgba(79, 70, 229, 0.2), rgba(59, 130, 246, 0.1))`,
        ]
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        repeatType: "reverse"
      }}
    />
  );
};

// Floating elements component to add visual interest
const FloatingElements = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Soft circles */}
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-purple-500/10 blur-3xl"
        animate={{
          x: ['-10%', '5%', '-5%', '10%', '-10%'],
          y: ['10%', '25%', '15%', '20%', '10%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse"
        }}
        style={{ top: '10%', left: '20%' }}
      />
      <motion.div
        className="absolute w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl"
        animate={{
          x: ['10%', '-5%', '5%', '-10%', '10%'],
          y: ['0%', '-15%', '-5%', '-10%', '0%'],
        }}
        transition={{
          duration: 23,
          repeat: Infinity,
          repeatType: "reverse"
        }}
        style={{ top: '60%', right: '10%' }}
      />
      <motion.div
        className="absolute w-72 h-72 rounded-full bg-blue-500/10 blur-3xl"
        animate={{
          x: ['0%', '10%', '5%', '-5%', '0%'],
          y: ['0%', '10%', '5%', '-5%', '0%'],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: "reverse"
        }}
        style={{ bottom: '10%', left: '30%' }}
      />
      
      {/* Floating dots */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-purple-400 opacity-30"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  );
};

// Add this new CountdownTimer component near the other utility components
const CountdownTimer = ({ seconds, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const circumference = 2 * Math.PI * 22; // Circle radius is 22
  const strokeDashoffset = ((seconds - timeLeft) / seconds) * circumference;
  
  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }
    
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [timeLeft, onComplete, seconds]);
  
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 48 48">
          {/* Background circle */}
          <circle
            cx="24"
            cy="24"
            r="22"
            fill="none"
            stroke="rgba(229, 231, 235, 0.5)"
            strokeWidth="4"
          />
          {/* Progress circle */}
          <circle
            cx="24"
            cy="24"
            r="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-green-500 dark:text-green-400 transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-green-600 dark:text-green-400">
          {timeLeft}
        </div>
      </div>
    </div>
  );
};

// Main UserOnboarding Component
function UserOnboarding() {
  const { currentUser, updateUserProfile, isNewUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [typingComplete, setTypingComplete] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const navigate = useNavigate();
  
  // User profile data
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [customAvatar, setCustomAvatar] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(THEME_OPTIONS[0]);
  const [selectedUsage, setSelectedUsage] = useState([]);
  const [areMandatoryFieldsComplete, setAreMandatoryFieldsComplete] = useState(false);
  
  // Refs
  const inputRef = useRef(null);
  const nameInputRef = useRef(null);
  const containerRef = useRef(null);
  const parallaxRef = useRef(null);
  const timeoutRef = useRef(null);
  
  // Motion controls
  const parallaxX = useMotionValue(0);
  const parallaxY = useMotionValue(0);
  // NEW: Smooth the parallax values using a spring
  const smoothParallaxX = useSpring(parallaxX, { stiffness: 300, damping: 30 });
  const smoothParallaxY = useSpring(parallaxY, { stiffness: 300, damping: 30 });
  
  // Update the rotated transforms to use the smoothed values
  const rotateX = useTransform(smoothParallaxY, [-100, 100], [5, -5]);
  const rotateY = useTransform(smoothParallaxX, [-100, 100], [-5, 5]);
  
  // Enhanced animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 }, // Start slightly below and faded
    visible: { 
      opacity: 1, 
      y: 0, // Animate to original position
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: 0.3,
        ease: "easeOut" // Added for smoother transition
      }
    },
    exit: { 
      opacity: 0, 
      y: -20, // Exit upwards and faded
      transition: { 
        when: "afterChildren",
        staggerChildren: 0.05,
        staggerDirection: -1,
        duration: 0.2,
        ease: "easeInOut" // Added for smoother transition
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring",
        damping: 20,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { 
        duration: 0.2
      }
    }
  };
  
  // Define the steps of the onboarding process
  const steps = [
    { id: 'welcome', title: 'Welcome' },
    { id: 'name', title: 'Your Name' },
    { id: 'avatar', title: 'Choose Avatar' },
    { id: 'theme', title: 'Select Theme' },
    { id: 'usage', title: 'Personalize' },
    { id: 'complete', title: 'All Set!' }
  ];
  
  // Update progress percentage based on current step
  useEffect(() => {
    setProgressPercentage((currentStep / (steps.length - 1)) * 100);
  }, [currentStep, steps.length]);
  
  // Check if mandatory fields are complete
  useEffect(() => {
    setAreMandatoryFieldsComplete(name.trim().length >= 2);
  }, [name]);
  
  // Auto focus the name input when it appears
  useEffect(() => {
    if (currentStep === 1 && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current.focus();
      }, 500); // Delay focus to allow animations to settle
    }
  }, [currentStep]);
  
  // Redirect if user is not new or not logged in
  useEffect(() => {
    if (currentUser === null) {
      navigate('/login');
    } else if (isNewUser === false && 
              !sessionStorage.getItem('needsOnboarding') && 
              !sessionStorage.getItem('showingOnboardingFinalStep')) {
      // Only redirect if profile is complete AND we're NOT trying to show the final onboarding step
      navigate('/notes');
    }
  }, [currentUser, isNewUser, navigate]);
  
  // Parallax effect for background
  useEffect(() => {
    if (!containerRef.current) return;
    
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { width, height, left, top } = containerRef.current.getBoundingClientRect();
      
      const x = (clientX - left - width / 2) / 20; // Adjust divisor for sensitivity
      const y = (clientY - top - height / 2) / 20; // Adjust divisor for sensitivity
      
      parallaxX.set(x);
      parallaxY.set(y);
    };
    
    containerRef.current.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [parallaxX, parallaxY]);
  
  // Typing animation for welcome message
  useEffect(() => {
    const messages = [
      "Welcome to NoteSphere!",
      "Let's get to know you",
      "Choose your avatar",
      "Select your preferred theme",
      "Tell us how you'll use NoteSphere",
      "You're all set and ready to go!"
    ];

    const message = messages[currentStep] || '';
    let index = 0;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setWelcomeMessage('');
    setTypingComplete(false);
    // console.log(`[Onboarding Typing] Starting step ${currentStep}. Full message to type: "${message}"`);

    const typeMessage = () => {
      if (index < message.length) {
        const substringToSet = message.substring(0, index + 1);
        // console.log(`[Onboarding Typing] index: ${index}, charAt(index): '${message.charAt(index)}', substringToSet: '${substringToSet}'`);
        setWelcomeMessage(substringToSet);
        index++;
        timeoutRef.current = setTimeout(typeMessage, 40); // Typing speed
      } else {
        // console.log(`[Onboarding Typing] Typing complete for: "${message}"`);
        setTypingComplete(true);
      }
    };

    timeoutRef.current = setTimeout(typeMessage, 300); // Initial delay

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentStep]);
  
  // Handle avatar change
  const handleAvatarChange = (avatar) => {
    setSelectedAvatar(avatar);
    if (avatar.id === 10 && !customAvatar) {
      const randomSeed = Math.random().toString(36).substring(2, 10);
      setCustomAvatar(`https://api.dicebear.com/7.x/personas/svg?seed=${randomSeed}&backgroundColor=ffd5dc`);
    }
  };
  
  // Handle theme change
  const handleThemeChange = (theme) => {
    setSelectedTheme(theme);
    if (theme.id === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme.id === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };
  
  // Toggle usage selection
  const toggleUsage = (usage) => {
    if (selectedUsage.includes(usage.id)) {
      setSelectedUsage(selectedUsage.filter(id => id !== usage.id));
    } else {
      setSelectedUsage([...selectedUsage, usage.id]);
    }
  };
  
  // Handle continue to next step - simplified for AnimatePresence
  const handleContinue = () => {
    setCurrentStep(prevStep => prevStep + 1);
  };
  
  // Handle go back to previous step - simplified for AnimatePresence
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prevStep => prevStep - 1);
    }
  };
  
  // Submit user profile data - MODIFIED: Now only advances to the next step
  // This function is called when "Complete Setup" is clicked on step 4 (Usage Preferences)
  const handleSubmit = () => {
    // No profile update here. All data is saved in completeOnboarding from step 5.
    // Set the flag indicating we are proceeding to the final step.
    // The useEffect for currentStep === 5 will also set this, but this is an early signal.
    sessionStorage.setItem('showingOnboardingFinalStep', 'true');
    handleContinue(); // This increments currentStep to 5
  };
  
  // Complete Onboarding - MODIFIED: Now saves all profile data
  const completeOnboarding = useCallback(async () => {
    if (loading) return; // Prevent multiple submissions
    setLoading(true);
    setError('');

    try {
      const profileData = {
        displayName: name.trim(),
        photoURL: selectedAvatar.id === 10 ? customAvatar : selectedAvatar.image,
        theme: selectedTheme.id,
        usagePreferences: selectedUsage,
        isProfileComplete: true, // Mark profile as complete now
      };

      const result = await updateUserProfile(profileData); // Save all data

      if (result.success) {
        triggerConfetti(); // Confetti on final success
        localStorage.setItem('onboardingComplete', 'true');
        sessionStorage.removeItem('needsOnboarding');
        sessionStorage.removeItem('showingOnboardingFinalStep'); // Remove flag before navigation

        // Delay navigation slightly to allow confetti/animations
        setTimeout(() => {
          navigate('/notes', { replace: true });
        }, 700); // Increased delay slightly
      } else {
        setError(result.error || "Failed to complete setup. Please try again.");
        // Clear the flag even on failure to allow retry or prevent sticky state
        sessionStorage.removeItem('showingOnboardingFinalStep');
        setLoading(false);
      }
    } catch (err) {
      console.error("Error completing onboarding profile:", err);
      setError("An unexpected error occurred. Please try again.");
      sessionStorage.removeItem('showingOnboardingFinalStep');
      setLoading(false);
    }
    // setLoading(false) is handled for error cases. On success, component unmounts.
  }, [
    name, selectedAvatar, customAvatar, selectedTheme, selectedUsage, // User data
    updateUserProfile, navigate, // Functions from context/router
    loading, setLoading, setError // Local state and setters
  ]);
  
  // Effect to set the 'showingOnboardingFinalStep' flag when step 5 is active
  useEffect(() => {
    if (currentStep === 5) {
      sessionStorage.setItem('showingOnboardingFinalStep', 'true');
    }
    // Do not clean up the flag here; it's cleaned by completeOnboarding
    // or if the user navigates away through other means.
  }, [currentStep]);
  
  // Redirect if user is not new or not logged in - This logic remains crucial
  useEffect(() => {
    if (currentUser === null) {
      navigate('/login');
    } else if (isNewUser === false && 
              !sessionStorage.getItem('needsOnboarding') && 
              !sessionStorage.getItem('showingOnboardingFinalStep')) {
      // Only redirect if profile is complete AND we're NOT trying to show the final onboarding step
      navigate('/notes');
    }
  }, [currentUser, isNewUser, navigate]);
  
  // Generate a random avatar
  const generateRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(2, 10);
    const colors = ['b6e3f4', 'd1d4f9', 'c0aede', 'ffdfbf', 'bde4a8', 'ffd5dc', 'f9d6c4', 'c4e6f9', 'd8c4f9'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newAvatarUrl = `https://api.dicebear.com/7.x/personas/svg?seed=${randomSeed}&backgroundColor=${randomColor}`;
    setCustomAvatar(newAvatarUrl);
  };
  
  // Remove the existing useEffect that auto-navigates after a delay
  // and replace the step 5 rendering with this new version
  return (
    <PageTransition>
      <div 
        ref={containerRef}
        className="min-h-screen bg-gradient-to-b from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex flex-col overflow-hidden relative"
      >
        <GradientBackground />
        <FloatingElements />
        <ParticleSystem color="#8B5CF6" count={70} />
        
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 z-50">
          <motion.div 
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-600"
            initial={{ width: `${progressPercentage}%` }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: [0.4, 0.0, 0.2, 1] }}
          />
        </div>
        
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 hidden md:flex space-x-2">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className="group relative"
            >
              <motion.div 
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index < currentStep 
                    ? 'bg-green-500' 
                    : index === currentStep 
                    ? 'bg-purple-600 ring-4 ring-purple-200 dark:ring-purple-900' 
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
                whileHover={{ scale: 1.2 }}
                animate={index === currentStep ? { 
                  scale: [1, 1.2, 1],
                  transition: { 
                    duration: 1.5, 
                    repeat: Infinity,
                    repeatType: "reverse" 
                  }
                } : {}}
              />
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs font-medium px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                {step.title}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex-1 flex items-center justify-center px-4 py-12 z-10">
          <motion.div 
            ref={parallaxRef}
            style={{ 
              rotateX,
              rotateY,
              transformPerspective: 1000,
            }}
            className="w-full max-w-3xl perspective-1000"
            // animate={controls} // REMOVED: AnimatePresence handles step transitions
            // initial={{ opacity: 1, y: 0 }} // REMOVED: Steps handle their own initial state
          >
            <AnimatePresence mode="wait">
              {/* Step 0: Welcome */}
              {currentStep === 0 && (
                <motion.div 
                  key="welcome"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden border border-white/20 dark:border-gray-700/50"
                >
                  <div className="p-8 md:p-12">
                    <motion.div variants={itemVariants} className="w-40 h-40 mx-auto mb-8 relative flex items-center justify-center">
                      <WavingHand />
                    </motion.div>
                    
                    <div className="mb-8 text-center">
                      <motion.h1 variants={itemVariants} className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent mb-6">
                        {welcomeMessage}
                        <span className={`inline-block w-1 h-8 ml-0.5 bg-purple-600 dark:bg-purple-400 align-middle ${typingComplete ? 'opacity-0' : 'animate-blink'}`}></span>
                      </motion.h1>
                      
                      {/* Removed typingComplete condition so the text always appears */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-4"
                      >
                        <motion.p variants={itemVariants} className="text-xl text-gray-700 dark:text-gray-300">
                          We're excited to help you organize your thoughts and ideas.
                        </motion.p>
                        <motion.p variants={itemVariants} className="text-gray-600 dark:text-gray-400">
                          Let's personalize your experience in just a few simple steps.
                        </motion.p>
                      </motion.div>
                    </div>
                    
                    {typingComplete && (
                      <motion.div
                        variants={itemVariants}
                        className="flex flex-col items-center"
                      >
                        <motion.button
                          whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.5)" }}
                          whileTap={{ scale: 0.97 }}
                          onClick={handleContinue}
                          className="relative w-full sm:w-64 py-4 px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg transition duration-300 flex items-center justify-center text-lg overflow-hidden group"
                        >
                          <motion.span 
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            animate={{ 
                              x: ['100%', '-100%']
                            }}
                            transition={{ 
                              duration: 1.5, 
                              repeat: Infinity,
                              repeatDelay: 2,
                              ease: "easeInOut"
                            }}
                          />
                          <span className="relative flex items-center">
                            Get Started
                            <svg className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                            </svg>
                          </span>
                        </motion.button>
                        
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                          This will only take a minute
                        </p>
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="h-2 bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-600"></div>
                </motion.div>
              )}
              
              {currentStep === 1 && (
                <motion.div 
                  key="nameInput"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden border border-white/20 dark:border-gray-700/50"
                >
                  <div className="p-8 md:p-12">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                      <motion.div variants={itemVariants} className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 flex items-center justify-center">
                        <motion.div
                          animate={{
                            scale: [1, 1.05, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "reverse"
                          }}
                        >
                          <WavingHand />
                        </motion.div>
                      </motion.div>
                      
                      <div className="flex-1">
                        <motion.div variants={itemVariants} className="mb-6">
                          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent mb-4">
                            {welcomeMessage}
                            <span className={`inline-block w-1 h-6 ml-0.5 bg-purple-600 dark:bg-purple-400 align-middle ${typingComplete ? 'opacity-0' : 'animate-blink'}`}></span>
                          </h2>
                          {/* Removed the conditional rendering so the extra text always shows */}
                          <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="text-gray-700 dark:text-gray-300"
                          >
                            We'll use this to personalize your experience
                          </motion.p>
                          <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="mt-4 text-sm text-gray-500 dark:text-gray-400"
                          >
                            This will only take a minute. Please enter your name.
                          </motion.p>
                        </motion.div>
                        
                        {typingComplete && (
                          <motion.div 
                            variants={itemVariants}
                            className="space-y-6"
                          >
                            <div>
                              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Your Name
                              </label>
                              <div className="relative">
                                <motion.input
                                  whileFocus={{ boxShadow: "0 0 0 3px rgba(124, 58, 237, 0.3)" }}
                                  type="text"
                                  id="name"
                                  ref={nameInputRef}
                                  value={name}
                                  onChange={(e) => {
                                    setName(e.target.value);
                                    setError('');
                                  }}
                                  disabled={loading}
                                  className="block w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 dark:bg-gray-700 dark:text-white text-lg shadow-sm transition-shadow duration-200 focus:ring-0 focus:outline-none"
                                  placeholder="Enter your name"
                                />
                                {name && (
                                  <motion.button
                                    type="button"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setName('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                  </motion.button>
                                )}
                              </div>
                              {error && (
                                <motion.p 
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="mt-2 text-sm text-red-600 dark:text-red-400"
                                >
                                  {error}
                                </motion.p>
                              )}
                              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                This is how we'll address you in the app
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                    
                    <motion.div 
                      variants={itemVariants}
                      className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
                    >
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleBack}
                        className="py-2 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition duration-300 flex items-center"
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                        Back
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.03, boxShadow: "0 4px 10px -2px rgba(124, 58, 237, 0.3)" }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleContinue}
                        disabled={!areMandatoryFieldsComplete}
                        className={`py-2 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-md transition duration-300 flex items-center ${!areMandatoryFieldsComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Next
                        <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </motion.button>
                    </motion.div>
                  </div>
                  
                  <div className="h-2 bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-600"></div>
                </motion.div>
              )}
              
              {currentStep === 2 && (
                <motion.div 
                  key="avatarSelection"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden border border-white/20 dark:border-gray-700/50"
                >
                  <div className="p-8 md:p-12">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                      <motion.div variants={itemVariants} className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
                        <Lottie 
                          animationData={avatarAnimation} 
                          loop={true} 
                          className="w-full h-full" 
                        />
                      </motion.div>
                      
                      <div className="flex-1">
                        <motion.div variants={itemVariants} className="mb-6">
                          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent mb-4">
                            {welcomeMessage}
                            <span className={`inline-block w-1 h-6 ml-0.5 bg-purple-600 dark:bg-purple-400 align-middle ${typingComplete ? 'opacity-0' : 'animate-blink'}`}></span>
                          </h2>
                          
                          {typingComplete && (
                            <motion.p 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.5 }}
                              className="text-gray-700 dark:text-gray-300"
                            >
                              Select an avatar for your profile, or customize your own
                            </motion.p>
                          )}
                        </motion.div>
                        
                        {typingComplete && (
                          <motion.div 
                            variants={itemVariants}
                          >
                            <div className="grid grid-cols-3 gap-3 md:grid-cols-5 md:gap-4">
                              {AVATAR_OPTIONS.map((avatar) => (
                                <motion.div
                                  key={avatar.id}
                                  whileHover={{ scale: 1.08, y: -5 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleAvatarChange(avatar)}
                                  className={`relative cursor-pointer transition-all duration-200 rounded-xl overflow-hidden ${
                                    selectedAvatar.id === avatar.id
                                      ? 'ring-4 ring-purple-500 dark:ring-purple-400 shadow-lg transform'
                                      : 'ring-2 ring-gray-200 dark:ring-gray-700 hover:ring-purple-300 dark:hover:ring-purple-600'
                                  }`}
                                  style={{
                                    transform: selectedAvatar.id === avatar.id ? 'translateY(-5px)' : 'none'
                                  }}
                                >
                                  <div className={`w-full pb-[100%] ${avatar.color}`}>
                                    <img
                                      src={avatar.id === 10 && customAvatar ? customAvatar : avatar.image}
                                      alt={avatar.name}
                                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300"
                                      loading="lazy"
                                    />
                                  </div>
                                  
                                  {selectedAvatar.id === avatar.id && (
                                    <motion.div 
                                      initial={{ opacity: 0, scale: 0 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ type: "spring", damping: 12 }}
                                      className="absolute bottom-1 right-1 bg-purple-600 rounded-full p-0.5 border-2 border-white dark:border-gray-800"
                                    >
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                    </motion.div>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                            
                            {selectedAvatar.id === 10 && (
                              <motion.div
                                initial={{ opacity: 0, height: 0, y: -20 }}
                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl shadow-inner"
                              >
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                  <div className="w-20 h-20 rounded-xl overflow-hidden ring-2 ring-purple-200 dark:ring-purple-900">
                                    <motion.img
                                      animate={{ rotate: customAvatar ? [0, 5, -5, 0] : 0 }}
                                      transition={{ 
                                        duration: 0.5,
                                        delay: 0.2,
                                      }}
                                      src={customAvatar}
                                      alt="Custom Avatar"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                      Generate random avatars until you find one you like
                                    </p>
                                    <motion.button
                                      whileHover={{ scale: 1.05, boxShadow: "0 4px 12px -2px rgba(124, 58, 237, 0.3)" }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={generateRandomAvatar}
                                      className="py-2 px-4 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-800/40 text-purple-700 dark:text-purple-300 rounded-lg font-medium transition duration-300 text-sm flex items-center"
                                    >
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                      </svg>
                                      Generate New Avatar
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </div>
                    
                    <motion.div 
                      variants={itemVariants}
                      className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
                    >
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleBack}
                        className="py-2 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition duration-300 flex items-center"
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                        Back
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.03, boxShadow: "0 4px 10px -2px rgba(124, 58, 237, 0.3)" }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleContinue}
                        className="py-2 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-md transition duration-300 flex items-center"
                      >
                        Next
                        <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </motion.button>
                    </motion.div>
                  </div>
                  
                  <div className="h-2 bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-600"></div>
                </motion.div>
              )}
              
              {currentStep === 3 && (
                <motion.div 
                  key="themeSelection"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden border border-white/20 dark:border-gray-700/50"
                >
                  <div className="p-8 md:p-12">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                      <motion.div variants={itemVariants} className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
                        <Lottie 
                          animationData={themeAnimation} 
                          loop={true} 
                          className="w-full h-full" 
                        />
                      </motion.div>
                      
                      <div className="flex-1">
                        <motion.div variants={itemVariants} className="mb-6">
                          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent mb-4">
                            {welcomeMessage}
                            <span className={`inline-block w-1 h-6 ml-0.5 bg-purple-600 dark:bg-purple-400 align-middle ${typingComplete ? 'opacity-0' : 'animate-blink'}`}></span>
                          </h2>
                          
                          {typingComplete && (
                            <motion.p 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.5 }}
                              className="text-gray-700 dark:text-gray-300"
                            >
                              Choose your preferred interface theme
                            </motion.p>
                          )}
                        </motion.div>
                        
                        {typingComplete && (
                          <motion.div 
                            variants={itemVariants}
                          >
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                              {THEME_OPTIONS.map((theme) => (
                                <motion.div
                                  key={theme.id}
                                  whileHover={{ scale: 1.05, y: -5 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleThemeChange(theme)}
                                  className={`relative cursor-pointer transition-all duration-200 rounded-xl overflow-hidden ${
                                    selectedTheme.id === theme.id
                                      ? 'ring-4 ring-purple-500 dark:ring-purple-400 shadow-xl transform'
                                      : 'ring-2 ring-gray-200 dark:ring-gray-700 hover:ring-purple-300 dark:hover:ring-purple-600'
                                  }`}
                                  style={{
                                    transform: selectedTheme.id === theme.id ? 'translateY(-5px)' : 'none'
                                  }}
                                >
                                  <motion.div 
                                    className={`${theme.background} p-6 flex flex-col items-center text-center h-full min-h-[140px]`}
                                    animate={selectedTheme.id === theme.id ? {
                                      y: [0, -5, 0],
                                      transition: { 
                                        duration: 1.5, 
                                        repeat: Infinity,
                                        repeatType: "reverse" 
                                      }
                                    } : {}}
                                  >
                                    <div className={`w-12 h-12 rounded-full ${theme.color} flex items-center justify-center mb-3 shadow-lg`}>
                                      {theme.icon}
                                    </div>
                                    <h3 className={`font-semibold ${theme.text} text-lg mb-1`}>
                                      {theme.name}
                                    </h3>
                                    <p className={`text-xs ${theme.id === 'auto' ? 'text-gray-600 dark:text-gray-400' : theme.id === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {theme.id === 'light' ? 'Bright & clear interface' : 
                                       theme.id === 'dark' ? 'Easy on the eyes at night' : 
                                       'Adapts to system settings'}
                                    </p>
                                  </motion.div>
                                  
                                  {selectedTheme.id === theme.id && (
                                    <motion.div 
                                      initial={{ opacity: 0, scale: 0 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ type: "spring", damping: 12 }}
                                      className="absolute bottom-2 right-2 bg-purple-600 rounded-full p-0.5 border-2 border-white dark:border-gray-800"
                                    >
                                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                    </svg>
                                    </motion.div>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                            
                            <motion.p 
                              animate={{ 
                                opacity: [0.5, 1, 0.5],
                              }}
                              transition={{ 
                                duration: 4,
                                repeat: Infinity,
                              }}
                              className="mt-4 text-sm text-gray-500 dark:text-gray-400"
                            >
                              Try switching themes to see how they look in real-time. You can always change it later.
                            </motion.p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                    
                    <motion.div 
                      variants={itemVariants}
                      className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
                    >
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleBack}
                        className="py-2 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition duration-300 flex items-center"
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                        Back
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.03, boxShadow: "0 4px 10px -2px rgba(124, 58, 237, 0.3)" }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleContinue}
                        className="py-2 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-md transition duration-300 flex items-center"
                      >
                        Next
                        <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </motion.button>
                    </motion.div>
                  </div>
                  
                  <div className="h-2 bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-600"></div>
                </motion.div>
              )}
              
              {currentStep === 4 && (
                <motion.div 
                  key="usagePreferences"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden border border-white/20 dark:border-gray-700/50"
                >
                  <div className="p-8 md:p-12">
                    {/* Changed layout to a centered column and removed gear animation */}
                    <div className="flex flex-col items-center gap-8">
                      <motion.div variants={itemVariants} className="text-center">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent mb-4">
                          {welcomeMessage}
                          <span className={`inline-block w-1 h-6 ml-0.5 bg-purple-600 dark:bg-purple-400 align-middle ${typingComplete ? 'opacity-0' : 'animate-blink'}`}></span>
                        </h2>
                        {typingComplete && (
                          <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="text-gray-700 dark:text-gray-300"
                          >
                            How do you plan to use NoteSphere? (Select all that apply)
                          </motion.p>
                        )}
                      </motion.div>
                      {typingComplete && (
                        <motion.div variants={itemVariants}>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {USAGE_OPTIONS.map((usage) => (
                              <motion.div
                                key={usage.id}
                                whileHover={{ scale: 1.02, y: -3 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => toggleUsage(usage)}
                                className={`relative cursor-pointer transition-all duration-200 rounded-xl overflow-hidden ${
                                  selectedUsage.includes(usage.id)
                                    ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-500 dark:border-purple-400 shadow-lg'
                                    : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                                }`}
                              >
                                <div className="p-5 flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-lg ${usage.color} flex items-center justify-center text-white shrink-0 shadow-md`}>
                                    {usage.icon}
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                      {usage.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      {usage.description}
                                    </p>
                                  </div>
                                  <motion.div 
                                    animate={selectedUsage.includes(usage.id) ? {
                                      scale: [1, 1.15, 1],
                                      transition: { duration: 0.3 }
                                    } : {}}
                                    className={`w-5 h-5 rounded-full border-2 ${
                                      selectedUsage.includes(usage.id)
                                        ? 'bg-purple-500 border-purple-500 dark:bg-purple-500 dark:border-purple-500'
                                        : 'bg-white border-gray-300 dark:bg-gray-700 dark:border-gray-500'
                                    } flex items-center justify-center`}
                                  >
                                    {selectedUsage.includes(usage.id) && (
                                      <motion.svg 
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ type: "spring", damping:  12 }}
                                        className="w-3 h-3 text-white" 
                                        fill="currentColor" 
                                        viewBox="0 0 20 20" 
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                      </motion.svg>
                                    )}
                                  </motion.div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                            This helps us tailor the experience to your needs
                          </p>
                        </motion.div>
                      )}
                    </div>
                    <motion.div variants={itemVariants} className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleBack}
                        className="py-2 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition duration-300 flex items-center"
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                        Back
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.03, boxShadow: "0 4px 10px -2px rgba(124, 58, 237, 0.3)" }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSubmit}
                        className="py-2 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-md transition duration-300 flex items-center"
                      >
                        Complete Setup
                        <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </motion.button>
                    </motion.div>
                  </div>
                  
                  <div className="h-2 bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-600"></div>
                </motion.div>
              )}
              
              {currentStep === 5 && (
                <motion.div 
                  key="complete"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden border border-white/20 dark:border-gray-700/50"
                >
                  <div className="p-8 md:p-12">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                      <motion.div 
                        variants={itemVariants}
                        className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0"
                        onAnimationComplete={() => {
                          if (typingComplete) {
                            triggerConfetti();
                          }
                        }}
                      >
                        <Lottie 
                          animationData={successAnimation} // Changed from loadingAnimation
                          loop={false} // Success animation usually doesn't loop
                          className="w-full h-full" 
                        />
                      </motion.div>
                      
                      <div className="flex-1">
                        <motion.div variants={itemVariants} className="mb-4">
                          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent mb-3">
                            {welcomeMessage}
                            <span className={`inline-block w-1 h-6 ml-0.5 bg-green-500 dark:bg-green-400 align-middle ${typingComplete ? 'opacity-0' : 'animate-blink'}`}></span>
                          </h2>
                          
                          {typingComplete && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.5 }}
                            >
                              <p className="text-xl text-gray-700 dark:text-gray-300 mb-3">
                                Thanks, {name}! Your profile has been set up successfully.
                              </p>
                              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                                <motion.div 
                                  animate={{ 
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 10, 0, -10, 0] 
                                  }}
                                  transition={{ 
                                    duration: 1.5, 
                                    repeat: Infinity,
                                    repeatDelay: 2
                                  }}
                                >
                                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                  </svg>
                                </motion.div>
                                <p>Redirecting you to create your first note</p>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                        
                        {typingComplete && (
                          <>
                            <motion.div 
                              variants={itemVariants}
                              className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-6 w-full flex justify-between items-center"
                            >
                              <span className="text-gray-800 dark:text-gray-200">Redirecting in</span>
                              <CountdownTimer seconds={8} onComplete={completeOnboarding} />
                            </motion.div>
                            
                            <motion.button
                              whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.5)" }}
                              whileTap={{ scale: 0.97 }}
                              onClick={completeOnboarding}
                              className="py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-medium shadow-md transition duration-300 flex items-center"
                            >
                              Take Me to NoteSphere
                              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                              </svg>
                            </motion.button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
        
        <div className="mt-auto py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>NoteSphere © {new Date().getFullYear()} • Your Digital Workspace</p>
        </div>
      </div>
    </PageTransition>
  );
}

export default UserOnboarding;