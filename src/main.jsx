// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Your Tailwind CSS styles
import './styles/performance.css'; // Performance optimizations
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './core/state/AuthContext';
import { ThemeProvider } from './core/state/ThemeContext';
import { FontProvider } from './core/state/FontContext';
import { NotesProvider } from './core/state/NotesContext.jsx';
import ErrorBoundary from './shared/components/layout/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <FontProvider>
              <NotesProvider>
                <App />
              </NotesProvider>
            </FontProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);