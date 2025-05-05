// src/pages/SettingsPage.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useFont } from '../context/FontContext';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import FontPreview from '../components/FontPreview';

function SettingsPage() {
  const { themePreference, setTheme, showFloatingToggle, toggleFloatingButton } = useTheme();
  const { fontFamily, fontSize, lineHeight, setFontFamily, setFontSize, setLineHeight } = useFont();
  const { currentUser, isGuestMode } = useAuth();
  
  // Check if user can use premium features (authenticated and not in guest mode)
  const canUsePremiumFeatures = currentUser && !isGuestMode;
  
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200 pt-16 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-2xl font-bold text-gray-900 dark:text-white mb-8"
        >
          Settings
        </motion.h1>
        
        {/* Appearance Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow p-6 mb-6"
        >
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">Appearance</h2>
          
          {/* Theme Selector */}
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              Theme
            </label>
            <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
              <div className="flex space-x-3">
                {/* Light Mode Option */}
                <button
                  onClick={() => setTheme('light')}
                  className={`p-3 rounded-lg flex items-center justify-center ${
                    themePreference === 'light' 
                      ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-500 ring-opacity-50' 
                      : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                  Light
                </button>
                
                {/* Dark Mode Option */}
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-3 rounded-lg flex items-center justify-center ${
                    themePreference === 'dark' 
                      ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 ring-2 ring-indigo-500 ring-opacity-50' 
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                  Dark
                </button>
                
                {/* System Mode Option */}
                <button
                  onClick={() => setTheme('system')}
                  className={`p-3 rounded-lg flex items-center justify-center ${
                    themePreference === 'system' 
                      ? 'bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 ring-2 ring-purple-500 ring-opacity-50' 
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  System
                </button>
              </div>
              
              {/* Current theme preview */}
              <ThemeToggle size="md" />
            </div>
          </div>
          
          {/* Floating Toggle Option */}
          <div className={`flex items-center justify-between ${!canUsePremiumFeatures ? 'opacity-60' : ''}`}>
            <div>
              <label className="text-gray-800 dark:text-gray-200 font-medium flex items-center">
                Show Theme Toggle in Corner
                {!canUsePremiumFeatures && (
                  <span className="ml-2 text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full">
                    Premium
                  </span>
                )}
              </label>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {canUsePremiumFeatures 
                  ? "Display a floating theme toggle button in the top-right corner" 
                  : "Sign in to access this premium feature"}
              </p>
            </div>
            <button 
              onClick={canUsePremiumFeatures ? toggleFloatingButton : undefined}
              disabled={!canUsePremiumFeatures}
              className={`relative inline-flex items-center h-6 rounded-full w-11 bg-gray-300 dark:bg-gray-600 ${!canUsePremiumFeatures ? 'cursor-not-allowed' : ''}`}
              title={!canUsePremiumFeatures ? "Available only for signed-in users" : ""}
            >
              <span
                className={`${
                  showFloatingToggle && canUsePremiumFeatures ? 'translate-x-6 bg-purple-500' : 'translate-x-1 bg-white'
                } inline-block w-4 h-4 transform rounded-full transition-transform duration-200 ease-in-out`}
              />
            </button>
          </div>
        </motion.div>
        
        {/* Font Settings Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow p-6 mb-6"
        >
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">Typography</h2>
          
          {/* Font Preview */}
          <div className="mb-5">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              Preview
            </label>
            <FontPreview 
              fontFamily={fontFamily}
              fontSize={fontSize}
              lineHeight={lineHeight}
              className="mb-2"
            />
          </div>
          
          {/* Font Family Selector */}
          <div className="mb-5">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              Font Family
            </label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <button
                onClick={() => setFontFamily('inter')}
                className={`p-3 rounded-lg flex flex-col items-center justify-center text-center ${
                  fontFamily === 'inter' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500 ring-opacity-50' 
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <span className="font-inter text-base">Inter</span>
                <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">Modern Sans</span>
              </button>
              
              <button
                onClick={() => setFontFamily('roboto')}
                className={`p-3 rounded-lg flex flex-col items-center justify-center text-center ${
                  fontFamily === 'roboto' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500 ring-opacity-50' 
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <span className="font-roboto text-base">Roboto</span>
                <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">Clean Sans</span>
              </button>
              
              <button
                onClick={() => setFontFamily('merriweather')}
                className={`p-3 rounded-lg flex flex-col items-center justify-center text-center ${
                  fontFamily === 'merriweather' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500 ring-opacity-50' 
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <span className="font-merriweather text-base">Merriweather</span>
                <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">Elegant Serif</span>
              </button>
              
              <button
                onClick={() => setFontFamily('mono')}
                className={`p-3 rounded-lg flex flex-col items-center justify-center text-center ${
                  fontFamily === 'mono' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500 ring-opacity-50' 
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <span className="font-mono text-base">Mono</span>
                <span className="text-xs mt-1 text-gray-500 dark:text-gray-400">Monospace</span>
              </button>
            </div>
          </div>
          
          {/* Font Size Selector */}
          <div className="mb-5">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              Font Size
            </label>
            <div className="flex space-x-3">
              <button
                onClick={() => setFontSize('small')}
                className={`p-3 rounded-lg flex-1 flex items-center justify-center ${
                  fontSize === 'small' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500 ring-opacity-50' 
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <span className="text-size-small">Small</span>
              </button>
              
              <button
                onClick={() => setFontSize('medium')}
                className={`p-3 rounded-lg flex-1 flex items-center justify-center ${
                  fontSize === 'medium' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500 ring-opacity-50' 
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <span className="text-size-medium">Medium</span>
              </button>
              
              <button
                onClick={() => setFontSize('large')}
                className={`p-3 rounded-lg flex-1 flex items-center justify-center ${
                  fontSize === 'large' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500 ring-opacity-50' 
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <span className="text-size-large">Large</span>
              </button>
              
              <button
                onClick={() => setFontSize('xlarge')}
                className={`p-3 rounded-lg flex-1 flex items-center justify-center ${
                  fontSize === 'xlarge' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500 ring-opacity-50' 
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <span className="text-size-xlarge">XLarge</span>
              </button>
            </div>
          </div>
          
          {/* Line Height Selector */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              Line Spacing
            </label>
            <div className="flex space-x-3">
              <button
                onClick={() => setLineHeight('compact')}
                className={`p-3 rounded-lg flex-1 flex items-center justify-center ${
                  lineHeight === 'compact' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500 ring-opacity-50' 
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <span>Compact</span>
              </button>
              
              <button
                onClick={() => setLineHeight('normal')}
                className={`p-3 rounded-lg flex-1 flex items-center justify-center ${
                  lineHeight === 'normal' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500 ring-opacity-50' 
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <span>Normal</span>
              </button>
              
              <button
                onClick={() => setLineHeight('relaxed')}
                className={`p-3 rounded-lg flex-1 flex items-center justify-center ${
                  lineHeight === 'relaxed' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500 ring-opacity-50' 
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <span>Relaxed</span>
              </button>
            </div>
          </div>
        </motion.div>
        
        {/* Editor Experience Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow p-6 mb-6"
        >
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">Editor Experience</h2>
          
          {/* Placeholder for future settings */}
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 text-sm">
            <p className="mb-2">Editor customization options coming soon:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Focus mode</li>
              <li>Auto-save preferences</li>
              <li>Default note view</li>
              <li>Keyboard shortcuts</li>
            </ul>
          </div>
        </motion.div>
        
        {/* Privacy & Data Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow p-6"
        >
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">Privacy & Data</h2>
          
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 text-sm">
            <p className="mb-2">Privacy settings coming soon:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Data export</li>
              <li>Auto-lock preferences</li>
              <li>Sync frequency options</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default SettingsPage;