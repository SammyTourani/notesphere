// src/components/AuthAnimation.jsx
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const AuthAnimation = ({ isLogin = true, phrases = [] }) => {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const typingSpeed = 50; // ms per character when typing
  const deletingSpeed = 30; // ms per character when deleting
  const delayAfterTyping = 2000; // ms to wait after typing is complete
  const delayAfterDeleting = 300; // ms to wait after deleting is complete
  
  const canvasRef = useRef(null);
  const timeoutRef = useRef(null);
  
  // Default phrases if none provided
  const defaultLoginPhrases = [
    "Your ideas and notes are waiting for you",
    "Welcome back to your digital notebook",
    "Pick up right where you left off",
    "Your thoughts are securely stored",
    "Access your notes from any device",
    "Continue your creative journey",
    "Your digital workspace awaits"
  ];
  
  const defaultSignupPhrases = [
    "Create, organize, and access your notes from anywhere",
    "Capture your ideas with our powerful note-taking app",
    "Start your journey with NoteSphere today",
    "Your thoughts deserve a beautiful home",
    "Seamlessly sync across all your devices",
    "Join thousands of productive note-takers"
  ];
  
  const displayPhrases = phrases.length > 0 
    ? phrases 
    : (isLogin ? defaultLoginPhrases : defaultSignupPhrases);
  
  // Completely rewritten typing effect
  useEffect(() => {
    const currentPhrase = displayPhrases[currentPhraseIndex];
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Typing phase
    if (isTyping) {
      if (displayedText.length < currentPhrase.length) {
        // Continue typing
        timeoutRef.current = setTimeout(() => {
          setDisplayedText(currentPhrase.substring(0, displayedText.length + 1));
        }, typingSpeed);
      } else {
        // Typing complete, pause before deleting
        timeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          setIsDeleting(true);
        }, delayAfterTyping);
      }
    } 
    // Deleting phase
    else if (isDeleting) {
      if (displayedText.length > 0) {
        // Continue deleting
        timeoutRef.current = setTimeout(() => {
          setDisplayedText(displayedText.substring(0, displayedText.length - 1));
        }, deletingSpeed);
      } else {
        // Deleting complete, move to next phrase
        timeoutRef.current = setTimeout(() => {
          const nextIndex = (currentPhraseIndex + 1) % displayPhrases.length;
          setCurrentPhraseIndex(nextIndex);
          setIsDeleting(false);
          setIsTyping(true);
        }, delayAfterDeleting);
      }
    }
    
    // Cleanup timeout on component unmount or effect re-run
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentPhraseIndex, displayPhrases, displayedText, isTyping, isDeleting]);
  
  // Particle animation system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const particles = [];
    let animationFrameId;
    let mouseX = 0;
    let mouseY = 0;
    
    // Match canvas size to parent element
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Track mouse movement
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });
    
    // Particle class
    class Particle {
      constructor() {
        this.reset();
      }
      
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 5 + 1;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.color = isLogin 
          ? `rgba(${Math.floor(Math.random() * 50) + 70}, ${Math.floor(Math.random() * 50) + 30}, ${Math.floor(Math.random() * 100) + 155}, ${Math.random() * 0.5 + 0.3})`
          : `rgba(${Math.floor(Math.random() * 100) + 155}, ${Math.floor(Math.random() * 50) + 30}, ${Math.floor(Math.random() * 50) + 70}, ${Math.random() * 0.5 + 0.3})`;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Mouse interaction
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 150;
        
        if (distance < maxDistance) {
          const force = (maxDistance - distance) / maxDistance;
          this.speedX += dx * force * 0.01;
          this.speedY += dy * force * 0.01;
        }
        
        // Boundary check
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
          this.reset();
        }
        
        // Speed dampening
        this.speedX *= 0.99;
        this.speedY *= 0.99;
      }
      
      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Initialize particles
    const initParticles = () => {
      for (let i = 0; i < 50; i++) {
        particles.push(new Particle());
      }
    };
    
    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    initParticles();
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isLogin]);
  
  const noteVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({ 
      opacity: 1, 
      y: 0,
      transition: { 
        delay: i * 0.2,
        duration: 0.5,
        ease: "easeOut"
      }
    }),
    hover: { 
      y: -5, 
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: { duration: 0.2 }
    }
  };
  
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10 dark:from-purple-900/30 dark:via-indigo-900/30 dark:to-blue-900/30">
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full" 
      />
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="max-w-xl w-full flex flex-col items-center px-6">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-4xl sm:text-5xl font-bold text-center mb-10 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500 dark:from-purple-400 dark:to-blue-300"
          >
            {isLogin ? "Welcome Back!" : "Join NoteSphere"}
          </motion.h1>
          
          <div className="relative w-full h-[290px]">
            {/* Floating notes stack */}
            <motion.div
              custom={0}
              variants={noteVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              className="absolute top-5 left-12 w-64 h-40 rounded-lg bg-white dark:bg-gray-800 shadow-lg transform -rotate-6 p-4 flex flex-col"
            >
              <div className="w-2/3 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="w-5/6 h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="w-4/6 h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="w-5/6 h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="w-3/6 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </motion.div>
            
            <motion.div
              custom={1}
              variants={noteVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              className="absolute top-[70px] left-[80px] w-64 h-40 rounded-lg bg-white dark:bg-gray-800 shadow-lg transform rotate-3 p-4 flex flex-col"
            >
              <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="w-4/6 h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="w-5/6 h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="w-3/6 h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="w-4/6 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </motion.div>
            
            <motion.div
              custom={2}
              variants={noteVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              className="absolute top-[40px] left-[120px] w-64 h-40 rounded-lg bg-white dark:bg-gray-800 shadow-lg transform -rotate-2 p-4 flex flex-col"
            >
              <div className="w-4/6 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="w-5/6 h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="w-3/6 h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="w-5/6 h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="w-4/6 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </motion.div>
          </div>
          
          {/* Typing Animation Text */}
          <div className="mt-8 h-16 flex items-center justify-center">
            <div className="relative">
              <p className="text-center text-xl font-medium text-gray-700 dark:text-gray-200">
                {displayedText}
                <span className={`inline-block w-0.5 h-5 ml-0.5 bg-gray-700 dark:bg-gray-200 align-middle ${isDeleting ? 'opacity-0' : 'animate-blink'}`}></span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthAnimation;