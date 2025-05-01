// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Your Tailwind CSS styles
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // Import the AuthProvider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Wrap the entire app with AuthProvider */}
    <AuthProvider>
      {/* BrowserRouter provides routing capabilities */}
      <BrowserRouter>
        <App /> {/* App component now has access to AuthContext */}
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
