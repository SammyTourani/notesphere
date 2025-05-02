import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

function SettingsPage() {
  const { darkMode, toggleTheme } = useTheme();
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleTestFirestore = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      if (!auth.currentUser) {
        setTestResult({ success: false, error: "Not authenticated" });
        return;
      }
      
      const userId = auth.currentUser.uid;
      const testDocRef = doc(db, "users", userId, "system", "connection-test");
      
      // Write test
      await setDoc(testDocRef, {
        timestamp: new Date().toISOString(),
        serverTime: serverTimestamp(),
        connectionTest: true
      });
      
      // Read test
      const docSnap = await getDoc(testDocRef);
      
      if (docSnap.exists()) {
        setTestResult({ 
          success: true, 
          data: docSnap.data(),
          message: "Connection established!" 
        });
      } else {
        setTestResult({ 
          success: false, 
          error: "Document not found after write" 
        });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        error: error.message 
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200 pt-16 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>
        
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <label className="text-gray-800 dark:text-gray-200 font-medium">Dark Mode</label>
            <button 
              onClick={toggleTheme}
              className="relative inline-flex items-center h-6 rounded-full w-11 bg-gray-300 dark:bg-gray-600"
            >
              <span
                className={`${
                  darkMode ? 'translate-x-6 bg-purple-500' : 'translate-x-1 bg-white'
                } inline-block w-4 h-4 transform rounded-full transition-transform duration-200 ease-in-out`}
              />
            </button>
          </div>
        </div>
        
        {/* Firestore Test Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">Firestore Connection Test</h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Test your connection to Firebase Firestore database.
          </p>
          
          <button 
            onClick={handleTestFirestore}
            disabled={isLoading}
            className="mb-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Connection'}
          </button>
          
          {testResult && (
            <div className={`p-3 rounded-md ${
              testResult.success 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
            }`}>
              <p className="font-medium">
                {testResult.success ? '✅ Connection Successful!' : '❌ Connection Failed'}
              </p>
              <p className="text-sm mt-1">
                {testResult.success ? testResult.message : `Error: ${testResult.error}`}
              </p>
              
              {testResult.success && testResult.data && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm">View details</summary>
                  <pre className="mt-2 text-xs bg-white/50 dark:bg-black/30 p-2 rounded overflow-x-auto">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;