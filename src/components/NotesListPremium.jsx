import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotes } from '../context/NotesContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import PinButton from './PinButton';

// Enhanced personalized greeting system
const getPersonalizedGreeting = (currentUser, userProfile, notes, isGuestMode) => {
  const hour = new Date().getHours();
  const now = new Date();
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  // Calculate usage stats
  const totalNotes = notes?.length || 0;
  const pinnedNotes = notes?.filter(note => note.pinned)?.length || 0;
  const recentNotes = notes?.filter(note => {
    if (!note.lastUpdated) return false;
    const noteDate = new Date(note.lastUpdated);
    const daysDiff = Math.floor((now - noteDate) / (1000 * 60 * 60 * 24));
    return daysDiff <= 7;
  })?.length || 0;
  
  // Check if user has been active recently
  const lastActivity = notes?.length > 0 ? 
    Math.max(...notes.map(note => note.lastUpdated ? new Date(note.lastUpdated).getTime() : 0)) : null;
  const daysSinceLastActivity = lastActivity ? 
    Math.floor((now.getTime() - lastActivity) / (1000 * 60 * 60 * 24)) : null;
  
  // Better new user detection - check for default demo notes
  const hasOnlyDemoNotes = notes?.every(note => 
    note.id?.startsWith('demo-') || 
    note.title?.includes('Welcome') || 
    note.title?.includes('Getting Started') ||
    note.title?.includes('Quick Tips') ||
    note.title?.includes('NoteSphere Features')
  ) || false;
  
  // Check if user created any actual content (non-demo notes)
  const userCreatedNotes = notes?.filter(note => 
    !note.id?.startsWith('demo-') && 
    !note.title?.includes('Welcome') && 
    !note.title?.includes('Getting Started') &&
    !note.title?.includes('Quick Tips') &&
    !note.title?.includes('NoteSphere Features')
  ) || [];
  
  const isNewUser = totalNotes <= 4 && (hasOnlyDemoNotes || userCreatedNotes.length === 0);
  
  // Get base time greeting
  let timeGreeting = "";
  if (hour < 6) timeGreeting = "burning the midnight oil";
  else if (hour < 12) timeGreeting = "Good morning";
  else if (hour < 17) timeGreeting = "Good afternoon";
  else if (hour < 22) timeGreeting = "Good evening";
  else timeGreeting = "working late";
  
  // Get user's display name or fallback
  const userName = userProfile?.displayName || 
    (currentUser?.email ? currentUser.email.split('@')[0] : null);
  
  // Create a stable seed for consistent greetings during the same session
  const today = now.toDateString();
  const userSeed = currentUser?.uid || 'guest';
  const stableSeed = `${today}-${userSeed}-${isNewUser ? 'new' : 'existing'}`;
  
  // Simple hash function for consistent randomization
  const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  };
  
  const stableRandom = (seed, max) => hashCode(seed) % max;
  
  // Guest mode greetings
  if (isGuestMode) {
    const guestGreetings = [
      "Welcome, explorer! 🚀",
      "Hello there, creative mind! ✨",
      "Welcome aboard, guest! 🌟",
      "Ready to capture some brilliant ideas? 💡",
      "Welcome to your creative space! 🎨"
    ];
    
    const guestSubtitles = [
      "Take a spin and see what NoteSphere can do for you",
      "Your ideas deserve a beautiful home",
      "No signup needed – just pure creativity",
      "Every great idea starts with a single note",
      "Explore freely and unleash your creativity"
    ];
    
    const randomIndex = stableRandom(`guest-${stableSeed}`, guestGreetings.length);
    return {
      title: guestGreetings[randomIndex],
      subtitle: guestSubtitles[randomIndex]
    };
  }
  
  // Special occasion greetings
  const isNewYear = now.getMonth() === 0 && now.getDate() === 1;
  const isChristmas = now.getMonth() === 11 && now.getDate() === 25;
  const isNewYearEve = now.getMonth() === 11 && now.getDate() === 31;
  
  if (isNewYear) {
    return {
      title: `Happy New Year, ${userName || 'champion'}! 🎉`,
      subtitle: "Here's to filling this year with amazing ideas and memories"
    };
  }
  
  if (isChristmas) {
    return {
      title: `Merry Christmas, ${userName || 'friend'}! 🎄`,
      subtitle: "May your notes be merry and your ideas be bright"
    };
  }
  
  if (isNewYearEve) {
    return {
      title: `${timeGreeting}, ${userName || 'visionary'}! 🎊`,
      subtitle: "What better way to end the year than with fresh ideas?"
    };
  }
  
  // First-time user detection (only demo notes or no user-created content)
  if (isNewUser) {
    const firstTimeGreetings = [
      `${timeGreeting}, ${userName || 'creative soul'}! 🌟`,
      `Welcome to NoteSphere, ${userName || 'innovator'}! ✨`,
      `Hello there, ${userName || 'idea creator'}! 💡`,
      `${timeGreeting}, ${userName || 'storyteller'}! 📝`
    ];
    
    const firstTimeSubtitles = [
      "Ready to turn your thoughts into something magical?",
      "Your creative journey starts with a single note",
      "Let's capture your first brilliant idea together",
      "Every masterpiece begins with a simple thought"
    ];
    
    const randomIndex = stableRandom(`new-${stableSeed}`, firstTimeGreetings.length);
    return {
      title: firstTimeGreetings[randomIndex],
      subtitle: firstTimeSubtitles[randomIndex]
    };
  }
  
  // Returning user after long absence
  if (daysSinceLastActivity && daysSinceLastActivity > 30) {
    return {
      title: `Welcome back, ${userName || 'creator'}! 🎊`,
      subtitle: `It's been ${daysSinceLastActivity} days – your notes missed you!`
    };
  }
  
  if (daysSinceLastActivity && daysSinceLastActivity > 7) {
    return {
      title: `${timeGreeting}, ${userName || 'thinker'}! 👋`,
      subtitle: "Welcome back! Ready to dive back into your creative flow?"
    };
  }
  
  // Productivity-based greetings
  if (recentNotes >= 5) {
    const productiveGreetings = [
      `${timeGreeting}, productivity champion! 🚀`,
      `Hello there, creative powerhouse! ⚡`,
      `${timeGreeting}, idea machine! 🎯`,
      `Hey there, prolific creator! 🌟`
    ];
    
    const productiveSubtitles = [
      `${recentNotes} notes this week? You're on fire!`,
      "Your creative energy is absolutely inspiring",
      "You're building an amazing collection of ideas",
      "Your dedication to capturing thoughts is remarkable"
    ];
    
    const randomIndex = stableRandom(`productive-${stableSeed}`, productiveGreetings.length);
    return {
      title: productiveGreetings[randomIndex],
      subtitle: productiveSubtitles[randomIndex]
    };
  }
  
  // Milestone celebrations (based on user-created notes, not including demos)
  const userNoteCount = userCreatedNotes.length;
  
  if (userNoteCount === 1) {
    return {
      title: `${timeGreeting}, ${userName || 'pioneer'}! 🎉`,
      subtitle: "Congratulations on your first personal note! The journey begins..."
    };
  }
  
  if (userNoteCount === 5) {
    return {
      title: `${timeGreeting}, ${userName || 'collector'}! 🏆`,
      subtitle: "5 personal notes and counting! You're building something amazing"
    };
  }
  
  if (userNoteCount === 10) {
    return {
      title: `Double digits, ${userName || 'note master'}! 🎊`,
      subtitle: "10 notes! You're really getting into the flow of things"
    };
  }
  
  if (userNoteCount === 25) {
    return {
      title: `${timeGreeting}, ${userName || 'curator'}! 🌟`,
      subtitle: "25 notes! Your digital brain is getting impressive"
    };
  }
  
  if (userNoteCount === 50) {
    return {
      title: `${timeGreeting}, ${userName || 'master'}! 🎊`,
      subtitle: "50 notes! You're officially a NoteSphere legend"
    };
  }
  
  if (userNoteCount === 100) {
    return {
      title: `${userName}, you're incredible! 🚀`,
      subtitle: "100 notes! You've built an amazing knowledge repository"
    };
  }
  
  // Weekend vs weekday greetings
  if (isWeekend) {
    const weekendGreetings = [
      `${timeGreeting}, ${userName || 'weekend warrior'}! 🌈`,
      `Happy ${now.toLocaleDateString('en-US', { weekday: 'long' })}, ${userName || 'creator'}! ☀️`,
      `${timeGreeting}, ${userName || 'visionary'}! 🎨`
    ];
    
    const weekendSubtitles = [
      "Perfect time for some creative thinking and note-taking",
      "Weekend vibes call for capturing those brilliant thoughts",
      "Let your creativity flow freely this weekend"
    ];
    
    const randomIndex = stableRandom(`weekend-${stableSeed}`, weekendGreetings.length);
    return {
      title: weekendGreetings[randomIndex],
      subtitle: weekendSubtitles[randomIndex]
    };
  }
  
  // Time-specific contextual greetings
  if (hour < 6) {
    return {
      title: `Wow, ${userName || 'night owl'}! 🦉`,
      subtitle: "Those late-night ideas are often the most brilliant ones"
    };
  }
  
  if (hour >= 22) {
    return {
      title: `${timeGreeting}, ${userName || 'night thinker'}! 🌙`,
      subtitle: "Perfect time to wind down and capture today's thoughts"
    };
  }
  
  // Pinned notes appreciation (excluding demo notes)
  const userPinnedNotes = notes?.filter(note => 
    note.pinned && 
    !note.id?.startsWith('demo-') && 
    !note.title?.includes('Welcome') && 
    !note.title?.includes('Getting Started')
  )?.length || 0;
  
  if (userPinnedNotes > 0) {
    const pinnedGreetings = [
      `${timeGreeting}, ${userName || 'organizer'}! 📌`,
      `Hello, ${userName || 'curator'}! ⭐`,
      `${timeGreeting}, ${userName || 'prioritizer'}! 🎯`
    ];
    
    const pinnedSubtitles = [
      `Love how you've pinned ${userPinnedNotes} important ${userPinnedNotes === 1 ? 'note' : 'notes'}!`,
      "Your organizational skills are showing beautifully",
      "Great job highlighting your most important thoughts"
    ];
    
    const randomIndex = stableRandom(`pinned-${stableSeed}`, pinnedGreetings.length);
    return {
      title: pinnedGreetings[randomIndex],
      subtitle: pinnedSubtitles[randomIndex]
    };
  }
  
  // Default personalized greetings with variety
  const defaultGreetings = [
    `${timeGreeting}, ${userName || 'creative mind'}! ✨`,
    `Hello there, ${userName || 'idea collector'}! 💫`,
    `${timeGreeting}, ${userName || 'thought keeper'}! 🌟`,
    `Hey ${userName || 'brilliant thinker'}! 🚀`,
    `${timeGreeting}, ${userName || 'note master'}! 📝`
  ];
  
  const defaultSubtitles = [
    "Ready to capture some amazing thoughts today?",
    "What brilliant ideas will you explore today?",
    "Your creative space awaits your next inspiration",
    "Time to turn thoughts into something extraordinary",
    "Let's see what magic you'll create today"
  ];
  
  const randomIndex = stableRandom(`default-${stableSeed}`, defaultGreetings.length);
  return {
    title: defaultGreetings[randomIndex],
    subtitle: defaultSubtitles[randomIndex]
  };
};

function NotesList() {
  const { notes, loading, error, isOffline, moveToTrash, refreshNotes } = useNotes();
  const { currentUser, isGuestMode, userProfile } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [pinnedNotes, setPinnedNotes] = useState([]);
  const [unpinnedNotes, setUnpinnedNotes] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // New state for greeting transitions
  const [greetingKey, setGreetingKey] = useState(0);
  const [isGreetingVisible, setIsGreetingVisible] = useState(true);
  
  const scrollY = useMotionValue(0);
  const opacity = useTransform(scrollY, [0, 100], [1, 0.2]);
  const scale = useTransform(scrollY, [0, 100], [1, 0.95]);
  const y = useTransform(scrollY, [0, 100], [0, -20]);
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0]);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  
  // Track page visibility for greeting transitions
  useEffect(() => {
    let visibilityTimer;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User is leaving the page
        visibilityTimer = setTimeout(() => {
          // Only trigger if user has been away for more than 30 seconds
          setIsGreetingVisible(false);
          setTimeout(() => {
            setGreetingKey(prev => prev + 1); // Force new greeting generation
            setIsGreetingVisible(true);
          }, 300); // Smooth transition timing
        }, 30000); // 30 seconds
      } else {
        // User is returning to the page
        clearTimeout(visibilityTimer);
        
        // If user was away, trigger a greeting refresh with smooth transition
        if (!isGreetingVisible) {
          setIsGreetingVisible(false);
          setTimeout(() => {
            setGreetingKey(prev => prev + 1);
            setIsGreetingVisible(true);
          }, 200);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(visibilityTimer);
    };
  }, [isGreetingVisible]);

  // Enhanced personalized greeting with guaranteed name inclusion
  const getEnhancedPersonalizedGreeting = React.useMemo(() => {
    const hour = new Date().getHours();
    const now = new Date();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Calculate usage stats
    const totalNotes = notes?.length || 0;
    const pinnedNotes = notes?.filter(note => note.pinned)?.length || 0;
    
    // Check if user created any actual content (non-demo notes)
    const userCreatedNotes = notes?.filter(note => 
      !note.id?.startsWith('demo-') && 
      !note.title?.includes('Welcome') && 
      !note.title?.includes('Getting Started') &&
      !note.title?.includes('Quick Tips') &&
      !note.title?.includes('NoteSphere Features')
    ) || [];
    
    // Calculate recent notes ONLY from user-created notes, not demo notes
    const recentUserNotes = userCreatedNotes.filter(note => {
      if (!note.lastUpdated) return false;
      const noteDate = new Date(note.lastUpdated);
      const daysDiff = Math.floor((now - noteDate) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    });
    
    const recentNotesCount = recentUserNotes.length;
    
    // Check if user has been active recently (only counting user notes)
    const lastActivity = userCreatedNotes.length > 0 ? 
      Math.max(...userCreatedNotes.map(note => note.lastUpdated ? new Date(note.lastUpdated).getTime() : 0)) : null;
    const daysSinceLastActivity = lastActivity ? 
      Math.floor((now.getTime() - lastActivity) / (1000 * 60 * 60 * 24)) : null;
    
    // Better new user detection - check for default demo notes
    const hasOnlyDemoNotes = notes?.every(note => 
      note.id?.startsWith('demo-') || 
      note.title?.includes('Welcome') || 
      note.title?.includes('Getting Started') ||
      note.title?.includes('Quick Tips') ||
      note.title?.includes('NoteSphere Features')
    ) || false;
    
    const isNewUser = totalNotes <= 4 && (hasOnlyDemoNotes || userCreatedNotes.length === 0);
    
    // Get base time greeting
    let timeGreeting = "";
    if (hour < 6) timeGreeting = "burning the midnight oil";
    else if (hour < 12) timeGreeting = "Good morning";
    else if (hour < 17) timeGreeting = "Good afternoon";
    else if (hour < 22) timeGreeting = "Good evening";
    else timeGreeting = "working late";
    
    // Enhanced user name detection with fallbacks
    const getUserName = () => {
      if (isGuestMode) return 'explorer';
      
      // Try display name first
      if (userProfile?.displayName) {
        const firstName = userProfile.displayName.split(' ')[0];
        return firstName;
      }
      
      // Try email username
      if (currentUser?.email) {
        const emailUser = currentUser.email.split('@')[0];
        // Clean up email usernames (remove dots, numbers, etc.)
        const cleanName = emailUser.replace(/[0-9._-]/g, '');
        if (cleanName.length >= 3) return cleanName;
        return emailUser;
      }
      
      // Fallback names that sound personal
      const fallbackNames = ['friend', 'creator', 'thinker', 'innovator', 'visionary'];
      return fallbackNames[Math.floor(Math.random() * fallbackNames.length)];
    };
    
    const userName = getUserName();
    
    // Create a stable seed for consistent greetings including the greeting key for transitions
    const today = now.toDateString();
    const userSeed = currentUser?.uid || 'guest';
    const stableSeed = `${today}-${userSeed}-${isNewUser ? 'new' : 'existing'}-${greetingKey}`;
    
    // Simple hash function for consistent randomization
    const hashCode = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash);
    };
    
    const stableRandom = (seed, max) => hashCode(seed) % max;
    
    // Guest mode greetings - all include name
    if (isGuestMode) {
      const guestGreetings = [
        `Welcome, ${userName}! 🚀`,
        `Hello there, ${userName}! ✨`,
        `Hey ${userName}, welcome aboard! 🌟`,
        `Ready to explore, ${userName}? 💡`,
        `${timeGreeting}, ${userName}! 🎨`
      ];
      
      const guestSubtitles = [
        "Take a spin and see what NoteSphere can do for you",
        "Your ideas deserve a beautiful home",
        "No signup needed – just pure creativity awaits",
        "Every great idea starts with a single note",
        "Explore freely and unleash your creativity"
      ];
      
      const randomIndex = stableRandom(`guest-${stableSeed}`, guestGreetings.length);
      return {
        title: guestGreetings[randomIndex],
        subtitle: guestSubtitles[randomIndex]
      };
    }
    
    // Special occasion greetings - all include name
    const isNewYear = now.getMonth() === 0 && now.getDate() === 1;
    const isChristmas = now.getMonth() === 11 && now.getDate() === 25;
    const isNewYearEve = now.getMonth() === 11 && now.getDate() === 31;
    
    if (isNewYear) {
      return {
        title: `Happy New Year, ${userName}! 🎉`,
        subtitle: "Here's to filling this year with amazing ideas and memories"
      };
    }
    
    if (isChristmas) {
      return {
        title: `Merry Christmas, ${userName}! 🎄`,
        subtitle: "May your notes be merry and your ideas be bright"
      };
    }
    
    if (isNewYearEve) {
      return {
        title: `${timeGreeting}, ${userName}! 🎊`,
        subtitle: "What better way to end the year than with fresh ideas?"
      };
    }
    
    // First-time user detection - all include name
    if (isNewUser) {
      const firstTimeGreetings = [
        `${timeGreeting}, ${userName}! 🌟`,
        `Welcome to NoteSphere, ${userName}! ✨`,
        `Hello there, ${userName}! 💡`,
        `Hey ${userName}, ready to start? 📝`,
        `${timeGreeting}, ${userName}! Let's begin! 🚀`
      ];
      
      const firstTimeSubtitles = [
        "Ready to turn your thoughts into something magical?",
        "Your creative journey starts with a single note",
        "Let's capture your first brilliant idea together",
        "Every masterpiece begins with a simple thought",
        "Time to create something amazing together"
      ];
      
      const randomIndex = stableRandom(`new-${stableSeed}`, firstTimeGreetings.length);
      return {
        title: firstTimeGreetings[randomIndex],
        subtitle: firstTimeSubtitles[randomIndex]
      };
    }
    
    // Returning user after long absence - include name
    if (daysSinceLastActivity && daysSinceLastActivity > 30) {
      return {
        title: `Welcome back, ${userName}! 🎊`,
        subtitle: `It's been ${daysSinceLastActivity} days – your notes missed you!`
      };
    }
    
    if (daysSinceLastActivity && daysSinceLastActivity > 7) {
      return {
        title: `${timeGreeting}, ${userName}! 👋`,
        subtitle: "Welcome back! Ready to dive back into your creative flow?"
      };
    }
    
    // Productivity-based greetings - all include name (NOW USES ACTUAL USER NOTES COUNT)
    if (recentNotesCount >= 5) {
      const productiveGreetings = [
        `${timeGreeting}, ${userName}! 🚀`,
        `Hello there, ${userName}! ⚡`,
        `Hey ${userName}, you're on fire! 🎯`,
        `${userName}, you're unstoppable! 🌟`,
        `${timeGreeting}, ${userName}! 💪`
      ];
      
      const productiveSubtitles = [
        `${recentNotesCount} notes this week? You're absolutely crushing it!`,
        "Your creative energy is absolutely inspiring",
        "You're building an amazing collection of ideas",
        "Your dedication to capturing thoughts is remarkable",
        "Keep up this incredible momentum!"
      ];
      
      const randomIndex = stableRandom(`productive-${stableSeed}`, productiveGreetings.length);
      return {
        title: productiveGreetings[randomIndex],
        subtitle: productiveSubtitles[randomIndex]
      };
    }
    
    // Also add a lower threshold for encouragement (2-4 user notes this week)
    if (recentNotesCount >= 2 && recentNotesCount < 5) {
      const encouragingGreetings = [
        `${timeGreeting}, ${userName}! 📝`,
        `Hey ${userName}, great progress! ✨`,
        `${userName}, you're building momentum! 🌟`,
        `${timeGreeting}, ${userName}! 💫`,
        `Nice work, ${userName}! 🎯`
      ];
      
      const encouragingSubtitles = [
        `${recentNotesCount} notes this week – you're building a great habit!`,
        "Love seeing your consistent note-taking",
        "You're developing an excellent creative routine",
        "Your dedication to capturing ideas is showing",
        "Every note brings you closer to your goals"
      ];
      
      const randomIndex = stableRandom(`encouraging-${stableSeed}`, encouragingGreetings.length);
      return {
        title: encouragingGreetings[randomIndex],
        subtitle: encouragingSubtitles[randomIndex]
      };
    }
    
    // Milestone celebrations - all include name (ALREADY USING USER NOTES COUNT)
    const userNoteCount = userCreatedNotes.length;
    
    if (userNoteCount === 1) {
      return {
        title: `${timeGreeting}, ${userName}! 🎉`,
        subtitle: "Congratulations on your first personal note! The journey begins..."
      };
    }
    
    if (userNoteCount === 5) {
      return {
        title: `Amazing work, ${userName}! 🏆`,
        subtitle: "5 personal notes and counting! You're building something incredible"
      };
    }
    
    if (userNoteCount === 10) {
      return {
        title: `Double digits, ${userName}! 🎊`,
        subtitle: "10 notes! You're really getting into the flow of things"
      };
    }
    
    if (userNoteCount === 25) {
      return {
        title: `${timeGreeting}, ${userName}! 🌟`,
        subtitle: "25 notes! Your digital brain is getting impressive"
      };
    }
    
    if (userNoteCount === 50) {
      return {
        title: `${timeGreeting}, ${userName}! 🎊`,
        subtitle: "50 notes! You're officially a NoteSphere legend"
      };
    }
    
    if (userNoteCount === 100) {
      return {
        title: `${userName}, you're incredible! 🚀`,
        subtitle: "100 notes! You've built an amazing knowledge repository"
      };
    }
    
    // Weekend vs weekday greetings
    if (isWeekend) {
      const weekendGreetings = [
        `${timeGreeting}, ${userName || 'weekend warrior'}! 🌈`,
        `Happy ${now.toLocaleDateString('en-US', { weekday: 'long' })}, ${userName || 'creator'}! ☀️`,
        `${timeGreeting}, ${userName || 'visionary'}! 🎨`
      ];
      
      const weekendSubtitles = [
        "Perfect time for some creative thinking and note-taking",
        "Weekend vibes call for capturing those brilliant thoughts",
        "Let your creativity flow freely this weekend"
      ];
      
      const randomIndex = stableRandom(`weekend-${stableSeed}`, weekendGreetings.length);
      return {
        title: weekendGreetings[randomIndex],
        subtitle: weekendSubtitles[randomIndex]
      };
    }
    
    // Time-specific contextual greetings - all include name
    if (hour < 6) {
      return {
        title: `Wow, ${userName}! 🦉`,
        subtitle: "Those late-night ideas are often the most brilliant ones"
      };
    }
    
    if (hour >= 22) {
      return {
        title: `${timeGreeting}, ${userName}! 🌙`,
        subtitle: "Perfect time to wind down and capture today's thoughts"
      };
    }
    
    // Pinned notes appreciation - all include name (FILTER OUT DEMO PINS)
    const userPinnedNotes = notes?.filter(note => 
      note.pinned && 
      !note.id?.startsWith('demo-') && 
      !note.title?.includes('Welcome') && 
      !note.title?.includes('Getting Started') &&
      !note.title?.includes('Quick Tips') &&
      !note.title?.includes('NoteSphere Features')
    )?.length || 0;
    
    if (userPinnedNotes > 0) {
      const pinnedGreetings = [
        `${timeGreeting}, ${userName}! 📌`,
        `Hello, ${userName}! ⭐`,
        `Hey ${userName}, love the organization! 🎯`,
        `${userName}, you're so organized! 💫`,
        `${timeGreeting}, ${userName}! 🌟`
      ];
      
      const pinnedSubtitles = [
        `Love how you've pinned ${userPinnedNotes} important ${userPinnedNotes === 1 ? 'note' : 'notes'}!`,
        "Your organizational skills are showing beautifully",
        "Great job highlighting your most important thoughts",
        "You really know how to prioritize what matters",
        "Your system for organizing notes is inspiring"
      ];
      
      const randomIndex = stableRandom(`pinned-${stableSeed}`, pinnedGreetings.length);
      return {
        title: pinnedGreetings[randomIndex],
        subtitle: pinnedSubtitles[randomIndex]
      };
    }
    
    // Default personalized greetings - all include name
    const defaultGreetings = [
      `${timeGreeting}, ${userName}! ✨`,
      `Hello there, ${userName}! 💫`,
      `Hey ${userName}! 🌟`,
      `${userName}, ready to create? 🚀`,
      `${timeGreeting}, ${userName}! 📝`,
      `What's up, ${userName}? 💡`,
      `${userName}, let's make magic! ⭐`,
      `Hey ${userName}, inspiration awaits! 🎨`
    ];
    
    const defaultSubtitles = [
      "Ready to capture some amazing thoughts today?",
      "What brilliant ideas will you explore today?",
      "Your creative space awaits your next inspiration",
      "Time to turn thoughts into something extraordinary",
      "Let's see what magic you'll create today",
      "Every great idea starts right here with you",
      "Your creativity knows no bounds – let's explore it",
      "The world needs your unique perspective and ideas"
    ];
    
    const randomIndex = stableRandom(`default-${stableSeed}`, defaultGreetings.length);
    return {
      title: defaultGreetings[randomIndex],
      subtitle: defaultSubtitles[randomIndex]
    };
  }, [currentUser?.uid, userProfile?.displayName, notes?.length, isGuestMode, greetingKey, new Date().toDateString()]);

  // Load data on mount
  useEffect(() => {
    refreshNotes();
  }, [refreshNotes]);

  // Filter and separate pinned and unpinned notes
  useEffect(() => {
    if (!notes || notes.length === 0) {
      setFilteredNotes([]);
      setPinnedNotes([]);
      setUnpinnedNotes([]);
      return;
    }
    
    if (!searchText) {
      // Separate pinned and unpinned notes
      const pinned = notes.filter(note => note.pinned).sort((a, b) => {
        const dateA = a.lastUpdated ? new Date(a.lastUpdated) : new Date(0);
        const dateB = b.lastUpdated ? new Date(b.lastUpdated) : new Date(0);
        return dateB - dateA;
      });
      
      const unpinned = notes.filter(note => !note.pinned).sort((a, b) => {
        const dateA = a.lastUpdated ? new Date(a.lastUpdated) : new Date(0);
        const dateB = b.lastUpdated ? new Date(b.lastUpdated) : new Date(0);
        return dateB - dateA;
      });
      
      setPinnedNotes(pinned);
      setUnpinnedNotes(unpinned);
      setFilteredNotes([...pinned, ...unpinned]);
      return;
    }
    
    const lowerSearch = searchText.toLowerCase();
    const filtered = notes.filter(note => {
      // Check title
      if (note.title?.toLowerCase().includes(lowerSearch)) return true;
      
      // For content, we need to strip HTML tags for proper text search
      const textContent = note.content ? stripHtml(note.content) : '';
      return textContent.toLowerCase().includes(lowerSearch);
    });
    
    // Separate filtered results into pinned and unpinned
    const filteredPinned = filtered.filter(note => note.pinned).sort((a, b) => {
      const dateA = a.lastUpdated ? new Date(a.lastUpdated) : new Date(0);
      const dateB = b.lastUpdated ? new Date(b.lastUpdated) : new Date(0);
      return dateB - dateA;
    });
    
    const filteredUnpinned = filtered.filter(note => !note.pinned).sort((a, b) => {
      const dateA = a.lastUpdated ? new Date(a.lastUpdated) : new Date(0);
      const dateB = b.lastUpdated ? new Date(b.lastUpdated) : new Date(0);
      return dateB - dateA;
    });
    
    setPinnedNotes(filteredPinned);
    setUnpinnedNotes(filteredUnpinned);
    setFilteredNotes([...filteredPinned, ...filteredUnpinned]);
  }, [notes, searchText]);
  
  // Helper function to strip HTML tags for search
  const stripHtml = (html) => {
    if (!html) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };
  
  // Set up periodic refresh
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshNotes().catch(err => console.error('Background refresh error:', err));
      }
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [refreshNotes]);
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };
  
  // Format date for display with enhanced formatting
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      // If date is today, show time only
      if (date.toDateString() === now.toDateString()) {
        return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      
      // If yesterday
      if (diffDays === 1) {
        return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      
      // If within last 7 days, show day name
      if (diffDays < 7) {
        return `${date.toLocaleDateString([], { weekday: 'long' })}`;
      }
      
      // Otherwise show date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Open delete confirmation modal
  const openDeleteModal = (e, note) => {
    e.preventDefault();
    e.stopPropagation();
    setNoteToDelete(note);
    setDeleteModalOpen(true);
  };
  
  // Handle confirmed deletion
  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    
    setDeletingId(noteToDelete.id);
    setDeleteModalOpen(false);
    
    try {
      await moveToTrash(noteToDelete.id);
    } catch (err) {
      console.error('Error deleting note:', err);
    } finally {
      setDeletingId(null);
      setNoteToDelete(null);
    }
  };
  
  // Handle note download as HTML with enhanced formatting
  const handleDownloadNote = (e, note) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Create a sophisticated HTML format with note content
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${note.title || 'Untitled Note'} - NoteSphere</title>
          <style>
            :root {
              --primary-color: #8b5cf6;
              --text-color: #333;
              --bg-color: #fafafa;
              --border-color: #e5e7eb;
            }
            
            @media (prefers-color-scheme: dark) {
              :root {
                --primary-color: #a78bfa;
                --text-color: #f3f4f6;
                --bg-color: #1f2937;
                --border-color: #374151;
              }
            }
            
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.7;
              color: var(--text-color);
              background-color: var(--bg-color);
              max-width: 900px;
              margin: 0 auto;
              padding: 2rem;
            }
            
            .container {
              background-color: white;
              border-radius: 8px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              padding: 2rem;
              margin: 2rem 0;
            }
            
            h1 {
              font-size: 2rem;
              font-weight: 700;
              margin-bottom: 1rem;
              color: var(--primary-color);
              border-bottom: 2px solid var(--border-color);
              padding-bottom: 0.5rem;
            }
            
            .content {
              line-height: 1.7;
              margin: 1.5rem 0;
            }
            
            .content img {
              max-width: 100%;
              border-radius: 4px;
              margin: 1rem 0;
            }
            
            .content a {
              color: var(--primary-color);
              text-decoration: none;
            }
            
            .content a:hover {
              text-decoration: underline;
            }
            
            .content ul, .content ol {
              margin-left: 1.5rem;
              margin-bottom: 1rem;
            }
            
            .footer {
              margin-top: 3rem;
              font-size: 0.875rem;
              color: #6b7280;
              text-align: center;
              border-top: 1px solid var(--border-color);
              padding-top: 1rem;
            }
            
            .logo {
              display: block;
              text-align: center;
              margin-bottom: 1.5rem;
              font-weight: 700;
              font-size: 1.25rem;
              color: var(--primary-color);
            }
            
            @media (max-width: 768px) {
              body {
                padding: 1rem;
              }
              
              .container {
                padding: 1.5rem;
                margin: 1rem 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="logo">NoteSphere</div>
          <div class="container">
            <h1>${note.title || 'Untitled Note'}</h1>
            <div class="content">${note.content || ''}</div>
          </div>
          <div class="footer">
            Exported from NoteSphere<br>
            ${new Date().toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </body>
      </html>
    `;
    
    // Create a Blob and download link
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'Untitled Note'}.html`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };
  
  // Animated navigation to create a new note
  const handleCreateNote = () => {
    navigate('/notes/new');
  };

  // Animated navigation to view a note
  const handleNoteClick = (e, noteId) => {
    e.preventDefault();
    navigate(`/notes/${noteId}`);
  };
  
  // Get note excerpt for preview with smart truncation
  const getExcerpt = (content, maxLength = 120) => {
    if (!content) return '';
    
    // Strip HTML tags
    const textContent = stripHtml(content);
    
    if (textContent.length <= maxLength) return textContent;
    
    // Find the last complete sentence within the limit
    const truncated = textContent.substring(0, maxLength);
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'), 
      truncated.lastIndexOf('!'), 
      truncated.lastIndexOf('?')
    );
    
    if (lastSentenceEnd > maxLength * 0.5) {
      return textContent.substring(0, lastSentenceEnd + 1);
    }
    
    // Fall back to the last complete word
    return truncated.split(' ').slice(0, -1).join(' ') + '...';
  };
  
  // Force manual refresh with animation
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshNotes();
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 800); // Keep animation visible for a moment
    }
  };
  
  // Calculate time since last update for enhanced display
  const getTimeSince = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      
      if (diffSec < 60) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHour < 24) return `${diffHour}h ago`;
      if (diffDay === 1) return 'Yesterday';
      if (diffDay < 7) return `${diffDay}d ago`;
      
      return formatDate(dateString);
    } catch (e) {
      return '';
    }
  };
  
  // Get the appropriate icon for a note based on content
  const getNoteIcon = (note) => {
    if (!note.content) return 'document';
    
    const content = note.content.toLowerCase();
    
    if (content.includes('<img') || content.includes('![')) return 'image';
    if (content.includes('<ul') || content.includes('<ol') || content.includes('- ')) return 'list';
    if (content.includes('<table')) return 'table';
    if (content.includes('<code') || content.includes('```')) return 'code';
    if (content.length > 500) return 'document-text';
    
    return 'document';
  };
  
  // Replace the static getNoteTheme with a dynamic one:
  const getNoteTheme = (id) => {
	// Generate a hash from the note id to consistently pick colors
	const hash = id ? id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : Math.floor(Math.random() * 360);
	const hue = hash % 360;
	const hue2 = (hue + 45) % 360;
	return {
		bg: 'bg-white dark:bg-gray-800',
		// Use a linear gradient computed from HSL values
		accentStyle: { backgroundImage: `linear-gradient(to right, hsl(${hue}, 70%, 60%), hsl(${hue2}, 70%, 60%))` }
	};
};

  // Render a note card with enhanced visual design
  const renderNoteCard = (note, index) => {
    const theme = getNoteTheme(note.id);
    const noteIcon = getNoteIcon(note);
    const timeSince = getTimeSince(note.lastUpdated);
    const staggerDelay = index * 0.05; // For staggered animation
    
    // Extract the hue values for dynamic hover effects
    const gradientMatch = theme.accentStyle.backgroundImage?.match(/hsl\((\d+),/g);
    const hue1 = gradientMatch?.[0]?.match(/\d+/)?.[0] || '200';
    const hue2 = gradientMatch?.[1]?.match(/\d+/)?.[0] || '245';
    
    return (
      <motion.div
        key={note.id}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.5, 
          delay: staggerDelay,
          ease: [0.25, 0.46, 0.45, 0.94] // Custom cubic-bezier for smooth entry
        }}
        whileHover={{ 
          y: -8,
          scale: 1.015,
          transition: { 
            duration: 0.25,
            ease: [0.23, 1, 0.32, 1] // Premium easing curve
          }
        }}
        whileTap={{ 
          scale: 0.98,
          transition: { duration: 0.1 }
        }}
        className={`${theme.bg} rounded-xl overflow-hidden flex flex-col h-[320px] transform-gpu cursor-pointer relative group
          shadow-sm hover:shadow-lg dark:shadow-gray-900/20 dark:hover:shadow-gray-900/40
          transition-all duration-200 ease-out
          border border-gray-200/60 dark:border-gray-600/40
          hover:border-gray-300/80 dark:hover:border-gray-500/60`}
        style={{ 
          backfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d',
          aspectRatio: '1 / 1.25'
        }}
      >
        {/* Enhanced border glow effect with note-specific colors */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 ease-out">
          {/* Light mode glow effects */}
          <div className="dark:hidden">
            {/* Primary glow layer */}
            <div 
              className="absolute inset-0 rounded-xl"
              style={{
                background: `linear-gradient(135deg, hsl(${hue1}, 70%, 85%) 0%, hsl(${hue2}, 70%, 85%) 100%)`,
                opacity: 0.15,
              }}
            />
            
            {/* Secondary inner glow */}
            <div 
              className="absolute inset-2 rounded-lg"
              style={{
                background: `radial-gradient(ellipse at center, hsl(${hue1}, 60%, 90%) 0%, hsl(${hue2}, 60%, 92%) 30%, transparent 70%)`,
                opacity: 0.2,
              }}
            />
            
            {/* Subtle border highlight */}
            <div 
              className="absolute inset-0 rounded-xl p-[1px]"
              style={{
                background: `linear-gradient(135deg, hsl(${hue1}, 80%, 70%), hsl(${hue2}, 80%, 70%))`,
              }}
            >
              <div className="w-full h-full bg-white rounded-xl" />
            </div>
          </div>

          {/* Dark mode glow effects - completely redesigned */}
          <div className="hidden dark:block">
            {/* Outer glow ring */}
            <div 
              className="absolute -inset-0.5 rounded-xl blur-sm"
              style={{
                background: `linear-gradient(135deg, hsl(${hue1}, 80%, 60%) 0%, hsl(${hue2}, 80%, 60%) 100%)`,
                opacity: 0.4,
              }}
            />
            
            {/* Inner vibrant glow */}
            <div 
              className="absolute inset-1 rounded-lg"
              style={{
                background: `radial-gradient(ellipse at center, hsl(${hue1}, 90%, 70%) 0%, hsl(${hue2}, 90%, 75%) 25%, transparent 60%)`,
                opacity: 0.15,
              }}
            />
            
            {/* Premium border with gradient */}
            <div 
              className="absolute inset-0 rounded-xl p-[1.5px]"
              style={{
                background: `linear-gradient(135deg, hsl(${hue1}, 85%, 65%) 0%, hsl(${hue2}, 85%, 65%) 50%, hsl(${hue1}, 90%, 70%) 100%)`,
              }}
            >
              <div className="w-full h-full bg-gray-800 rounded-xl" />
            </div>

            {/* Subtle inner rim light */}
            <div 
              className="absolute inset-2 rounded-lg"
              style={{
                background: `linear-gradient(135deg, hsl(${hue1}, 60%, 40%) 0%, transparent 30%, transparent 70%, hsl(${hue2}, 60%, 40%) 100%)`,
                opacity: 0.2,
              }}
            />
          </div>
        </div>

        {/* Dark mode specific glow overlay */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 ease-out dark:block hidden">
          {/* Dark mode primary glow */}
          <div 
            className="absolute inset-0 rounded-xl"
            style={{
              background: `linear-gradient(135deg, hsl(${hue1}, 50%, 25%) 0%, hsl(${hue2}, 50%, 25%) 100%)`,
              opacity: 0.3,
            }}
          />
          
          {/* Dark mode inner highlight */}
          <div 
            className="absolute inset-4 rounded-lg"
            style={{
              background: `radial-gradient(ellipse at center, hsl(${hue1}, 40%, 35%) 0%, hsl(${hue2}, 40%, 35%) 20%, transparent 60%)`,
              opacity: 0.25,
            }}
          />
        </div>

        {/* Accent color top border with enhanced gradient */}
        <motion.div 
          className="h-1.5 w-full relative overflow-hidden z-10"
          style={theme.accentStyle}
        >
          {/* Shimmer effect adjusted for dark mode */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "easeInOut"
            }}
          />
        </motion.div>
        
        {/* Main content area with subtle dynamic hover background */}
        <motion.div 
          onClick={(e) => handleNoteClick(e, note.id)}
          className="flex-grow p-5 overflow-hidden flex flex-col relative z-10"
        >
          {/* Light mode hover background */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-[0.06] dark:opacity-0 transition-opacity duration-300 pointer-events-none rounded-lg"
            style={{
              background: `linear-gradient(135deg, hsl(${hue1}, 60%, 95%) 0%, hsl(${hue2}, 60%, 96%) 50%, hsl(${hue1}, 60%, 94%) 100%)`,
            }}
          />

          {/* Dark mode hover background - redesigned */}
          <div 
            className="absolute inset-0 opacity-0 dark:group-hover:opacity-[0.12] transition-opacity duration-300 pointer-events-none rounded-lg hidden dark:block"
            style={{
              background: `linear-gradient(135deg, hsl(${hue1}, 40%, 25%) 0%, hsl(${hue2}, 40%, 28%) 50%, hsl(${hue1}, 35%, 22%) 100%)`,
            }}
          />

          {/* Dark mode additional inner glow */}
          <div 
            className="absolute inset-4 opacity-0 dark:group-hover:opacity-[0.08] transition-opacity duration-300 pointer-events-none rounded-lg hidden dark:block"
            style={{
              background: `radial-gradient(ellipse at center, hsl(${hue1}, 70%, 60%) 0%, hsl(${hue2}, 70%, 65%) 20%, transparent 50%)`,
            }}
          />

          <div className="flex justify-between items-start mb-3 relative z-10">
            <motion.h2 
              className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-grow pr-2
                group-hover:text-gray-800 dark:group-hover:text-white
                transition-colors duration-200 ease-out line-clamp-2"
              style={{ lineHeight: '1.3' }}
            >
              {note.title || 'Untitled Note'}
            </motion.h2>
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.15 }}
            >
              <PinButton 
                noteId={note.id}
                isPinned={note.pinned || false}
                className="flex-shrink-0"
              />
            </motion.div>
          </div>
          
          <motion.div 
            className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3 relative z-10
              group-hover:text-gray-600 dark:group-hover:text-gray-300
              transition-colors duration-200 ease-out"
          >
            <span className="flex items-center">
              {/* Clock icon for timestamp */}
              <span className="mr-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                </svg>
              </span>
              {timeSince}
            </span>
          </motion.div>
          
          <motion.div 
            className="text-gray-600 dark:text-gray-300 text-sm flex-grow overflow-hidden note-preview line-clamp-6 relative z-10
              group-hover:text-gray-700 dark:group-hover:text-gray-200
              transition-colors duration-200 ease-out"
            style={{ lineHeight: '1.5' }}
          >
            {getExcerpt(note.content, 140)}
          </motion.div>
        </motion.div>
        
        {/* Enhanced status badges with better pinned icon */}
        <div className="px-5 flex flex-wrap gap-1.5 mb-3 relative z-10">
          <AnimatePresence>
            {note.pinned && (
              <motion.span 
                key={`pin-label-${note.id}`}
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: 0,
                  transition: { 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 25,
                    duration: 0.4
                  }
                }}
                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium 
                  bg-amber-100 dark:bg-amber-900/70 text-amber-800 dark:text-amber-200 cursor-pointer
                  hover:scale-105 hover:bg-amber-200 dark:hover:bg-amber-800/80
                  hover:shadow-sm dark:hover:shadow-amber-900/20
                  transition-all duration-150 ease-out"
              >
                {/* Better pin icon - thumbtack/pushpin */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 mr-1.5">
                  <path d="M16.5 12V7a1 1 0 00-1-1h-7a1 1 0 00-1 1v5c0 .8-.4 1.5-1 2v1a1 1 0 001 1h3v5a1 1 0 001 1h1a1 1 0 001-1v-5h3a1 1 0 001-1v-1c-.6-.5-1-1.2-1-2z"/>
                  <path d="M15.5 5V4a1 1 0 00-1-1h-5a1 1 0 00-1 1v1h7z"/>
                </svg>
                Pinned
              </motion.span>
            )}
          </AnimatePresence>
          
          {/* Enhanced local note badge with dark mode */}
          {note.id && note.id.startsWith('local-') && (
            <motion.span 
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium 
                bg-yellow-100 dark:bg-yellow-900/70 text-yellow-800 dark:text-yellow-200
                hover:scale-105 hover:bg-yellow-200 dark:hover:bg-yellow-800/80
                hover:shadow-sm dark:hover:shadow-yellow-900/20
                transition-all duration-150 ease-out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 mr-1.5">
                <path fillRule="evenodd" d="M10 .75a9.25 9.25 0 109.25 9.25A9.25 9.25 0 0010 .75zM6.95 5.667a.75.75 0 000 1.5h6.1a.75.75 0 000-1.5h-6.1z" clipRule="evenodd" />
              </svg>
              Not synced
            </motion.span>
          )}
          
          {/* Enhanced guest note badge with dark mode */}
          {note.id && note.id.startsWith('guest-') && (
            <motion.span 
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium 
                bg-purple-100 dark:bg-purple-900/70 text-purple-800 dark:text-purple-200
                hover:scale-105 hover:bg-purple-200 dark:hover:bg-purple-800/80
                hover:shadow-sm dark:hover:shadow-purple-900/20
                transition-all duration-150 ease-out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 mr-1.5">
                <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
              </svg>
              Guest Note
            </motion.span>
          )}
        </div>
        
        {/* Premium action buttons footer with note-specific hover effects */}
        <motion.div 
          className="px-5 py-3.5 flex justify-between items-center border-t border-gray-200/70 dark:border-gray-600/50 
            relative z-10 bg-gray-50/40 dark:bg-gray-800/40 backdrop-blur-sm
            group-hover:border-gray-300/80 dark:group-hover:border-gray-500/60
            transition-all duration-200 ease-out"
        >
          {/* Light mode footer glow */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none dark:hidden"
            style={{
              background: `linear-gradient(to bottom, transparent 0%, hsl(${hue1}, 40%, 96%) 50%, hsl(${hue2}, 40%, 97%) 100%)`,
            }}
          />
          
          {/* Dark mode footer glow - premium redesign */}
          <div 
            className="absolute inset-0 opacity-0 dark:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden dark:block"
            style={{
              background: `radial-gradient(to bottom, transparent 0%, hsl(${hue1}, 50%, 20%) 30%, hsl(${hue2}, 50%, 25%) 70%, hsl(${hue1}, 60%, 18%) 100%)`,
            }}
          />

          {/* Dark mode subtle top highlight */}
          <div 
            className="absolute top-0 left-0 right-0 h-px opacity-0 dark:group-hover:opacity-60 transition-opacity duration-300 pointer-events-none hidden dark:block"
            style={{
              background: `linear-gradient(to right, transparent, hsl(${hue1}, 80%, 60%), hsl(${hue2}, 80%, 60%), transparent)`,
            }}
          />

          {/* Enhanced Download Button with note-specific colors */}
          <motion.button
            onClick={(e) => handleDownloadNote(e, note)}
            className="p-2.5 rounded-full text-gray-500 dark:text-gray-400 relative cursor-pointer group/btn
              hover:text-blue-600 dark:hover:text-blue-400 
              transition-all duration-150 ease-out hover:scale-110"
            aria-label="Download note"
            whileHover="hover"
            initial="initial"
          >
            {/* Light mode button background */}
            <div 
              className="absolute inset-0 rounded-full opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 dark:hidden"
              style={{
                background: `hsl(${hue1}, 50%, 95%)`,
              }}
            />
            
            {/* Dark mode button background - premium */}
            <div 
              className="absolute inset-0 rounded-full opacity-0 dark:group-hover/btn:opacity-100 transition-opacity duration-200 hidden dark:block"
              style={{
                background: `radial-gradient(circle, hsl(${hue1}, 60%, 30%) 0%, hsl(${hue1}, 40%, 20%) 70%)`,
                boxShadow: `0 0 0 1px hsl(${hue1}, 70%, 50%, 0.3), inset 0 1px 0 hsl(${hue1}, 80%, 60%, 0.2)`,
              }}
            />
            
            <div className="w-5 h-5 relative z-10" style={{ pointerEvents: 'none' }}>
              {/* Enhanced Document Icon with smoother transitions */}
              <motion.svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-0"
                variants={{
                  initial: { y: 0, opacity: 1 },
                  hover: { y: -8, opacity: 0 }
                }}
                transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ pointerEvents: 'none' }}
              >
                <path
                  d="M14 2.5H6C5.44772 2.5 5 2.94772 5 3.5V20.5C5 21.0523 5.44772 21.5 6 21.5H18C18.5523 21.5 19 21.0523 19 20.5V7.5L14 2.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 2.5V7.5H19"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 12.5H8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 16.5H8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 8.5H9H8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>

              {/* Enhanced Download Arrow and Circle */}
              <motion.svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-0"
                variants={{
                  initial: { y: 8, opacity: 0 },
                  hover: { y: 0, opacity: 1 }
                }}
                transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ pointerEvents: 'none' }}
              >
                {/* Circle with premium animation */}
                <motion.circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  variants={{
                    initial: { pathLength: 0, rotate: -90 },
                    hover: { pathLength: 1, rotate: 0 }
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />

                {/* Arrow with enhanced timing */}
                <motion.path
                  d="M12 8V16M12 16L16 12M12 16L8 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  variants={{
                    initial: { y: -4, opacity: 0 },
                    hover: { y: 0, opacity: 1 }
                  }}
                  transition={{ duration: 0.25, delay: 0.05 }}
                />
              </motion.svg>
            </div>
          </motion.button>
          
          {/* Enhanced Trash Button with note-specific colors */}
          <motion.button
            onClick={(e) => openDeleteModal(e, note)}
            disabled={deletingId === note.id}
            className="p-2.5 rounded-full text-gray-500 dark:text-gray-400 relative cursor-pointer group/btn
              hover:text-red-600 dark:hover:text-red-400 
              transition-all duration-150 ease-out hover:scale-110"
            aria-label="Delete note"
            whileHover="hover"
            initial="initial"
          >
            {/* Light mode button background */}
            <div 
              className="absolute inset-0 rounded-full opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 dark:hidden"
              style={{
                background: `hsl(${hue2}, 50%, 95%)`,
              }}
            />
            
            {/* Dark mode button background - premium */}
            <div 
              className="absolute inset-0 rounded-full opacity-0 dark:group-hover/btn:opacity-100 transition-opacity duration-200 hidden dark:block"
              style={{
                background: `radial-gradient(circle, hsl(${hue2}, 60%, 30%) 0%, hsl(${hue2}, 40%, 20%) 70%)`,
                boxShadow: `0 0 0 1px hsl(${hue2}, 70%, 50%, 0.3), inset 0 1px 0 hsl(${hue2}, 80%, 60%, 0.2)`,
              }}
            />
            
            {deletingId === note.id ? (
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-gray-400 dark:border-gray-500 animate-spin" />
            ) : (
              <div className="w-5 h-5 relative z-10" style={{ pointerEvents: 'none' }}>
                {/* Skinnier Trash Can Body */}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="w-5 h-5"
                >
                  {/* Modified path to make trash can skinnier */}
                  <path d="M4 6h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />
                  {/* Adjusted vertical lines inside trash can */}
                  <line x1="9" y1="10" x2="9" y2="18" />
                  <line x1="12" y1="10" x2="12" y2="18" />
                  <line x1="15" y1="10" x2="15" y2="18" />
                </svg>
                
                {/* Enhanced Animated Lid */}
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 absolute top-0 left-0"
                  variants={{
                    initial: { y: 0, rotate: 0 },
                    hover: { y: -6, rotate: -5 }
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 500, 
                    damping: 20,
                    duration: 0.2
                  }}
                  style={{ pointerEvents: 'none' }}
                >
                  {/* Trash can lid */}
                  <path d="M4 6h16" />
                  {/* Top arch */}
                  <path d="M10 6V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" />
                </motion.svg>
              </div>
            )}
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }
  
  // Enhanced Loading State
  if (loading && filteredNotes.length === 0) {
    return (
      <div className="pt-16 h-screen flex justify-center items-start bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="mt-20">
          <div className="relative">
            {/* Animated loading spinner */}
            <div className="w-16 h-16 relative mx-auto">
              <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-purple-200 dark:border-purple-900/30"></div>
              <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
              
              {/* Document icon in center */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-purple-500 dark:text-purple-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            
            {/* Loading text with animated dots */}
            <div className="mt-5 text-center">
              <span className="text-gray-600 dark:text-gray-300 text-lg font-medium">Loading notes</span>
              <span className="inline-flex ml-1 animate-pulse">
                <span className="animate-[bounce_1s_infinite_0ms]">.</span>
                <span className="animate-[bounce_1s_infinite_200ms]">.</span>
                <span className="animate-[bounce_1s_infinite_400ms]">.</span>
                                        </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Get personalized greeting
  const personalizedGreeting = getPersonalizedGreeting(currentUser, userProfile, notes, isGuestMode);
  
  return (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" ref={containerRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      
        {/* Enhanced welcome message section with perfect centering */}
        <motion.div
          className="text-center mb-12 relative z-10 flex flex-col items-center justify-center" 
          style={{ opacity, y, scale }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={greetingKey}
              initial={{ opacity: 0, y: -30, scale: 0.9 }}
              animate={{ 
                opacity: isGreetingVisible ? 1 : 0, 
                y: isGreetingVisible ? 0 : -20,
                scale: isGreetingVisible ? 1 : 0.95
              }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ 
                duration: 0.6, 
                delay: 0.1, 
                ease: [0.25, 0.46, 0.45, 0.94] // Premium easing
              }}
              className="w-full flex flex-col items-center"
            >
              <motion.h1 
                className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 dark:from-purple-400 dark:via-pink-400 dark:to-orange-400 pb-2 text-center"
                initial={{ backgroundPosition: "0% 50%" }}
                animate={{ backgroundPosition: "100% 50%" }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
                style={{
                  backgroundSize: "300% 300%"
                }}
              >
                {getEnhancedPersonalizedGreeting.title}
              </motion.h1>
              <motion.p 
                className="text-lg text-gray-600 dark:text-gray-400 mt-2 max-w-2xl mx-auto text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                {getEnhancedPersonalizedGreeting.subtitle}
              </motion.p>
            </motion.div>
          </AnimatePresence>
          
          {/* Subtle decorative elements */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
            <motion.div 
              className="absolute w-80 h-80 bg-purple-200 dark:bg-purple-900/20 rounded-full -top-20 -left-20 filter blur-3xl opacity-30 dark:opacity-20"
              animate={{ 
                x: [0, 10, 0], 
                y: [0, 15, 0],
                scale: [1, 1.05, 1]
              }} 
              transition={{ 
                duration: 8, 
                repeat: Infinity,
                repeatType: 'reverse' 
              }}
            />
            <motion.div 
              className="absolute w-96 h-96 bg-pink-200 dark:bg-pink-900/20 rounded-full -bottom-40 -right-20 filter blur-3xl opacity-30 dark:opacity-20"
              animate={{ 
                x: [0, -15, 0], 
                y: [0, -10, 0],
                scale: [1, 1.03, 1]
              }} 
              transition={{ 
                duration: 10, 
                repeat: Infinity,
                repeatType: 'reverse',
                delay: 1
              }}
            />
          </div>
        </motion.div>

        {/* Static header bar that stays in place when scrolling */}
        <motion.div
          className="flex flex-col sm:flex-row justify-between items-center mb-8 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 p-4 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center mb-4 sm:mb-0">
            <motion.h1 
              className="text-2xl font-semibold text-gray-900 dark:text-white"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              My Notes
            </motion.h1>
            
            {/* Status indicators with animations */}
            <div className="flex gap-2 ml-3">
              {isOffline && (
                <motion.span 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="px-2.5 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/60 text-yellow-800 dark:text-yellow-200 rounded-full flex items-center"
                >
                  <span className="relative flex h-2 w-2 mr-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                  </span>
                  Offline
                </motion.span>
              )}
              
              {/* Guest mode indicator */}
              {isGuestMode && (
                <motion.span 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="px-2.5 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 rounded-full flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                  Guest Mode
                </motion.span>
              )}
            </div>
            
            {/* Manual refresh button with enhanced animation */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleManualRefresh} 
              className="ml-3 p-2 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              title="Refresh notes"
              disabled={isRefreshing}
            >
              <div className="relative w-5 h-5">
                {isRefreshing ? (
                  <svg className="animate-spin h-5 w-5 text-purple-600 dark:text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <motion.svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </motion.svg>
                  )}
                </div>
              </motion.button>
          </div>
          
          {/* Enhanced search input */}
          <div className="w-full sm:w-72">
            <div className={`relative transition-all duration-300 ${searchFocused ? 'scale-105' : 'scale-100'}`}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className={`h-5 w-5 transition-colors duration-300 ${searchFocused ? 'text-purple-500 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search notes..."
                value={searchText}
                onChange={handleSearchChange}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border transition-all duration-300 
                  ${searchFocused 
                    ? 'border-purple-500 dark:border-purple-400 bg-white dark:bg-gray-800 ring-4 ring-purple-100 dark:ring-purple-900/30' 
                    : 'border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 shadow-sm'
                  }
                  text-gray-900 dark:text-white focus:outline-none placeholder-gray-500 dark:placeholder-gray-400`}
              />
              {searchText && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button 
                    onClick={() => setSearchText('')}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm8-8a8 8 0 11-16 0 8 8 0 0116 0zM9.293 8.293a1 1 0 011.414 0L10 8.586l.293-.293a1 1 0 011.414 1.414L11.414 10l.293.293a1 1 0 01-1.414 1.414L10 11.414l-.293.293a1 1 0 01-1.414-1.414L8.586 10l-.293-.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
        
        {/* ...existing code... */}
        
        {/* Enhanced empty states and note grid */}
        {filteredNotes.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-20 px-6 bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
          >
            {searchText ? (
              <div>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0  11-14 0 0 1-14 0 7 7 0 0114 0zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">No matches found</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                  We couldn't find any notes matching "{searchText}". Try a different search term.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSearchText('')}
                  className="px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-purple-600 dark:text-purple-400 rounded-lg border border-purple-200 dark:border-purple-800/50 shadow-sm transition-colors"
                >
                  Clear search
                </motion.button>
              </div>
            ) : (
              <div>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/40 mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">No notes yet</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                  Start by creating your first note to capture your thoughts, ideas, or anything important.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale:  0.95 }}
                  onClick={handleCreateNote}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg shadow-md transition-all duration-300 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Create your first note
                </motion.button>
              </div>
            )}
          </motion.div>
        ) : (
          <div>
            {/* Pinned Notes Section with Enhanced Animation */}
            <AnimatePresence>
              {pinnedNotes.length > 0 && (
                <motion.div 
                  key="pinned-section"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mb-10"
                >
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="flex items-center mb-5 pl-2"
                  >
                    <motion.div
                      className="flex items-center"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <motion.svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="currentColor"
                        className="w-5 h-5 text-amber-500 dark:text-amber-400 mr-2"
                        initial={{ rotate: -30, scale: 0.8 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 15 }}
                      >
                        {/* Simple traditional push pin icon */}
                        <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z" />
                      </motion.svg>
                      <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">Pinned Notes</h2>
                    </motion.div>
                    <div className="ml-3 h-5 pl-3 border-l border-gray-300 dark:border-gray-600 flex items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {pinnedNotes.length} {pinnedNotes.length === 1 ? 'note' : 'notes'}
                      </span>
                    </div>
                  </motion.div>

                  {/* Professional grid layout - always left-aligned */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {pinnedNotes.map((note, index) => renderNoteCard(note, index))}
                  </div>
                  
                  {/* Simple clean divider */}
                  {unpinnedNotes.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="my-12"
                    >
                      <div className="h-0.5 bg-gradient-to-r from-transparent via-gray-400 dark:via-gray-500 to-transparent"></div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Other Notes Section with Enhanced Animation */}
            {unpinnedNotes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: pinnedNotes.length > 0 ? 0.2 : 0 }}
              >
                {pinnedNotes.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center mb-5 pl-2"
                  >
                    <motion.div
                      className="flex items-center"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <motion.svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="currentColor"
                        className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2"
                      >
                        <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75-3.75a.75.75 0 000 1.5h7.5a.75.75 0 000-1.5h-7.5z" />
                    </motion.svg>

                      <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">Other Notes</h2>
                    </motion.div>
                    <div className="ml-3 h-5 pl-3 border-l border-gray-300 dark:border-gray-600 flex items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {unpinnedNotes.length} {unpinnedNotes.length === 1 ? 'note' : 'notes'}
                      </span>
                    </div>
                  </motion.div>
                )}
                
                {/* Professional grid layout - always left-aligned */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {unpinnedNotes.map((note, index) => renderNoteCard(note, index + pinnedNotes.length))}
                </div>
              </motion.div>
            )}
          </div>
        )}
        
        {/* Enhanced floating action button with animation and effects */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3, type: "spring" }}
          className="fixed bottom-6 right-6 z-30"
        >
          <motion.button
            whileHover={{ 
              scale: 1.1,
              boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.5), 0 10px 10px -5px rgba(124, 58, 237, 0.2)"
            }}
            whileTap={{ scale: 0.95 }}
           
            onClick={handleCreateNote}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg transition-all duration-300"
            aria-label="Create new note"
          >
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              
              {/* Pulsing background effect */}
              <div className="absolute inset-0 rounded-full animate-ping opacity-30 bg-white" style={{ animationDuration: '2s' }}></div>
            </div>
          </motion.button>
          
          {/* Subtle label that appears on hover */}
          <div className="absolute -top-10 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="bg-gray-900 text-white text-sm py-1 px-3 rounded-lg shadow-md">
              New Note
            </div>
            <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900 mx-auto"></div>
          </div>
        </motion.div>
      </div>
      
      {/* Enhanced Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={noteToDelete?.title}
      />
    </div>
  );
}

export default NotesList;
