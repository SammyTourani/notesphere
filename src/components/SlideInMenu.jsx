import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export function SlideInMenu() {
  const { currentUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  
  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && 
          !menuRef.current.contains(event.target) && 
          !event.target.closest('.menu-button')) {
        setMenuOpen(false);
      }
    }
    
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  if (!currentUser) return null;
  
  return (
    <>
      {/* Logo Button to open menu */}
      <div className="fixed top-0 left-0 z-50 p-4">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="menu-button font-bold text-xl text-gray-700 dark:text-gray-200 tracking-tight hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
        >
          NoteSphere
        </button>
      </div>
      
      {/* Theme Toggle - always visible */}
      <div className="fixed top-0 right-0 z-50 p-4">
        <ThemeToggle />
      </div>
      
      {/* Slide-in Menu */}
      <div 
        ref={menuRef}
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out z-40 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5">
          {/* Removed title completely */}
          <nav className="space-y-3 mt-14">
            <Link 
              to="/notes" 
              className="block py-2 px-4 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/notes/new" 
              className="block py-2 px-4 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              New Note
            </Link>
            <Link 
              to="/settings" 
              className="block py-2 px-4 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Settings
            </Link>
            
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
              <button
                onClick={handleLogout}
                className="block w-full text-left py-2 px-4 rounded-md text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </nav>
        </div>
      </div>
      
      {/* Overlay when menu is open */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${
          menuOpen ? 'opacity-30 z-30' : 'opacity-0 -z-10'
        }`}
        onClick={() => setMenuOpen(false)}
      />
    </>
  );
}

export default SlideInMenu;