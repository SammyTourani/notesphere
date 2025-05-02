// src/pages/LandingPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';

function LandingPage() {
  // Refs for mouse interaction
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [clientMousePosition, setClientMousePosition] = useState({ x: 0, y: 0 });
  const backgroundRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const controls = useAnimation();
  const [hoveredNote, setHoveredNote] = useState(null);
  
  // Track mouse position for interactive elements
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Set client mouse position for spotlight
      setClientMousePosition({ x: e.clientX, y: e.clientY });
      
      if (backgroundRef.current) {
        const { width, height, left, top } = backgroundRef.current.getBoundingClientRect();
        const x = (e.clientX - left) / width;
        const y = (e.clientY - top) / height;
        setMousePosition({ x, y });
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  // Animate elements after initial load
  useEffect(() => {
    controls.start({ opacity: 1, y: 0 });
    const timer = setTimeout(() => setIsLoaded(true), 300);
    return () => clearTimeout(timer);
  }, [controls]);
  
  // Feature cards data
  const features = [
    {
      title: "Capture Ideas Instantly",
      description: "Write down thoughts, ideas, and inspirations the moment they strike you.",
      icon: (
        <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
        </svg>
      ),
    },
    {
      title: "Access Anywhere",
      description: "Your notes are synchronized and accessible from any device, anytime.",
      icon: (
        <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
        </svg>
      ),
    },
    {
      title: "Stay Organized",
      description: "Effortlessly organize and find your notes with powerful search and categorization.",
      icon: (
        <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
        </svg>
      ),
    }
  ];
  
  // Floating notes data (decorative elements)
  const floatingNotes = [
    { x: '10%', y: '20%', rotate: -5, delay: 0.1, scale: 0.6 },
    { x: '85%', y: '15%', rotate: 8, delay: 0.3, scale: 0.7 },
    { x: '75%', y: '60%', rotate: -8, delay: 0.5, scale: 0.8 },
    { x: '20%', y: '65%', rotate: 12, delay: 0.7, scale: 0.5 },
    { x: '40%', y: '85%', rotate: -10, delay: 0.9, scale: 0.7 },
  ];

  // Parallax effect based on mouse position
  const getParallaxStyle = (strength = 30) => {
    return {
      transform: `translate(${(mousePosition.x - 0.5) * -strength}px, ${(mousePosition.y - 0.5) * -strength}px)`,
    };
  };

  return (
    <div 
      ref={backgroundRef}
      className="min-h-screen overflow-hidden relative text-gray-800"
      style={{
        background: 'linear-gradient(-45deg, rgba(226, 232, 255, 0.9), rgba(252, 217, 239, 0.9), rgba(219, 236, 255, 0.9), rgba(229, 210, 255, 0.9))',
        backgroundSize: '400% 400%',
        animation: 'gradient-shift 15s ease infinite'
      }}
    >
      {/* Animated gradient background - the keyframes are added inline */}
      <style jsx>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
      `}</style>
      
      {/* Enhanced spotlight effect */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
        style={{
          background: clientMousePosition.x 
            ? `radial-gradient(circle 60vmax at ${clientMousePosition.x}px ${clientMousePosition.y}px, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.1), transparent 70%)`
            : 'none',
          transition: 'background 0.5s cubic-bezier(0.33, 1, 0.68, 1)',
        }}
      />

      {/* Floating Notes (Decorative) - now with proper animation */}
      <div className="absolute inset-0 pointer-events-none">
        {floatingNotes.map((note, index) => (
          <motion.div
            key={index}
            className="absolute cursor-pointer"
            initial={{ opacity: 0, x: note.x, y: note.y, rotate: note.rotate, scale: note.scale }}
            animate={{ 
              opacity: isLoaded ? 0.9 : 0,
              y: `calc(${note.y} - 10px)`,
            }}
            whileHover={{
              scale: note.scale * 1.2,
              transition: { duration: 0.2 },
              boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.1)"
            }}
            transition={{
              delay: note.delay,
              duration: 0.6,
              y: {
                repeat: Infinity,
                repeatType: "reverse",
                duration: 2 + Math.random() * 2,
              }
            }}
            style={{ 
              left: note.x, 
              top: note.y,
              pointerEvents: 'auto'
            }}
          >
            <div className="bg-white shadow-lg rounded-lg p-4 w-24 h-28 flex items-center justify-center">
              <div className="w-full space-y-2">
                <div className="h-2 bg-blue-200 rounded w-3/4"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
                <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                <div className="h-2 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main content container */}
      <div className="relative z-10 flex flex-col items-center min-h-screen">
        {/* Header & Hero Section */}
        <header className="text-center pt-16 md:pt-32 px-4 max-w-6xl mx-auto w-full">
          {/* Main Headline with typing effect */}
          <div className="relative inline-block">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration:.5, ease: "easeInOut" }}
              className="absolute h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-500 bottom-0 left-0 rounded-full"
            ></motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl md:text-7xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Welcome to NoteSphere
            </motion.h1>
          </div>

          {/* Sub-headline with staggered animation */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto font-light"
          >
            Your simple, elegant space to capture, organize, and access your thoughts anytime, anywhere.
          </motion.p>

          {/* Call to Action Buttons Container with improved styling */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 mt-12 justify-center"
          >
            {/* Get Started Button with enhanced effects */}
            <Link
              to="/signup"
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-blue-500/30 transition duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none overflow-hidden"
            >
              <span className="relative z-10">Get Started</span>
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl" 
                initial={{ x: "100%", opacity: 0 }}
                whileHover={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
              />
            </Link>

            {/* Login Button with glass effect */}
            <Link
              to="/login"
              className="px-8 py-4 bg-white/80 backdrop-blur-sm text-blue-600 text-lg font-semibold rounded-xl shadow-md hover:shadow-lg hover:bg-white border border-blue-200 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transform hover:-translate-y-1"
            >
              Log In
            </Link>
          </motion.div>

          {/* Decorative arrow down (scrolling hint) */}
          <motion.div 
            className="mt-16 hidden md:block"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ 
              delay: 1.2,
              y: {
                repeat: Infinity,
                duration: 2
              }
            }}
          >
            <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </motion.div>
        </header>

        {/* Features Section with 3D cards */}
        <motion.section 
          className="w-full max-w-6xl mx-auto px-4 py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-800">Streamline Your Note-Taking</h2>
          <p className="text-xl text-center text-gray-600 mb-16 max-w-3xl mx-auto">
            NoteSphere combines simplicity with powerful features to transform how you capture and organize information.
          </p>

          {/* Feature cards container */}
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.2 }}
                whileHover={{ 
                  y: -10,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-blue-100/50 transform transition-all duration-300 hover:border-blue-200"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* App Preview Section */}
        <motion.section 
          className="w-full py-20 relative overflow-hidden bg-white/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-12">
              {/* Text content */}
              <motion.div 
                className="md:w-1/2"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800">Focus on What Matters</h2>
                <ul className="space-y-4">
                  {[
                    "Clean, distraction-free writing environment",
                    "Instant cloud syncing for access anywhere",
                    "Simple organization with powerful search",
                    "Dark mode for comfortable night writing",
                    "Works online and offline"
                  ].map((item, index) => (
                    <motion.li 
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                      className="flex items-start"
                    >
                      <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-lg text-gray-700">{item}</span>
                    </motion.li>
                  ))}
                </ul>
                <motion.div 
                  className="mt-10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <Link
                    to="/signup"
                    className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    Start Writing Now
                  </Link>
                </motion.div>
              </motion.div>
              
              {/* App mockup */}
              <motion.div 
                className="md:w-1/2 mt-10 md:mt-0"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                style={getParallaxStyle(15)}
              >
                <div className="relative">
                  {/* Main device mockup */}
                  <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-6 overflow-hidden border-8 border-gray-800 relative z-10 transform rotate-2">
                    {/* App header mockup */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-10 rounded-lg flex items-center mb-4">
                      <div className="flex space-x-2 ml-3">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <div className="text-white text-sm mx-auto pr-6">NoteSphere</div>
                    </div>
                    
                    {/* App content mockup */}
                    <div className="flex gap-4">
                      {/* Sidebar */}
                      <div className="w-1/4 border-r border-gray-200 pr-3">
                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className={`h-8 rounded mb-2 ${i === 2 ? 'bg-blue-100' : 'bg-gray-100'}`}></div>
                        ))}
                      </div>
                      
                      {/* Main content */}
                      <div className="w-3/4">
                        <div className="h-8 bg-blue-100 rounded mb-4 w-1/2"></div>
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-3 bg-gray-200 rounded mb-2 w-full"></div>
                        ))}
                        <div className="h-3 bg-gray-200 rounded mb-2 w-4/5"></div>
                        <div className="h-3 bg-gray-200 rounded mb-5 w-3/5"></div>
                        
                        <div className="h-10 bg-gray-100 rounded border border-gray-200"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Secondary device mockup */}
                  <div className="hidden md:block absolute left-10 bottom-10 bg-white rounded-xl shadow-xl p-3 border-4 border-gray-800 w-40 z-0 -rotate-6">
                    <div className="bg-blue-500 h-6 rounded mb-2"></div>
                    <div className="space-y-1">
                      <div className="h-2 bg-gray-200 rounded"></div>
                      <div className="h-2 bg-gray-200 rounded"></div>
                      <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Testimonial/Final CTA Section */}
        <motion.section 
          className="w-full py-20 px-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-800">Ready to Transform Your Note-Taking?</h2>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Join thousands of users who have simplified their digital lives with NoteSphere. Start capturing your ideas today.
            </p>
            
            <motion.div 
              className="inline-block"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/signup"
                className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xl font-semibold rounded-xl shadow-xl hover:shadow-blue-500/30 transition duration-300 ease-in-out"
              >
                Get Started — It's Free
              </Link>
            </motion.div>
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="w-full py-8 px-4 border-t border-gray-200 bg-white/70">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} NoteSphere. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <span className="text-gray-600 text-sm cursor-pointer hover:text-blue-600 transition-colors">Privacy Policy</span>
              <span className="text-gray-600 text-sm cursor-pointer hover:text-blue-600 transition-colors">Terms of Service</span>
              <span className="text-gray-600 text-sm cursor-pointer hover:text-blue-600 transition-colors">Contact</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default LandingPage;