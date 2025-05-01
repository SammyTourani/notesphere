// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom'; // Used for redirecting
import { useAuth } from '../context/AuthContext'; // Import our custom hook

// This component takes another component as its 'children' prop.
// It checks the auth state and decides whether to render the children
// or redirect to the login page.
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth(); // Get user and loading state from context

  // 1. While Firebase is checking the auth state, don't render anything yet
  //    (or show a loading spinner). This prevents briefly showing the wrong
  //    page before the auth state is confirmed.
  if (loading) {
    // You could return a loading spinner component here
    return <div className="flex justify-center items-center min-h-screen">Loading authentication...</div>; // Added basic styling
  }

  // 2. If loading is finished and there's no logged-in user, redirect to /login
  if (!currentUser) {
    // Navigate component redirects the user declaratively
    return <Navigate to="/login" replace />;
    // 'replace' prevents the user from clicking "back" to the protected route
  }

  // 3. If loading is finished and a user is logged in, render the
  //    component that was passed as children (e.g., <AppDashboard />)
  return children;
}

export default ProtectedRoute;
