// src/pages/LandingPage.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation

function LandingPage() {
  return (
    // Main container with gradient background and centered content
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 text-gray-800 px-4 overflow-hidden"> {/* Added overflow-hidden */}

      {/* Header Section */}
      {/* Applies fade-in-down animation defined in index.css */}
      <header className="text-center mb-12 mt-10 animate-fade-in-down">
        {/* You can add an SVG logo here later if you like */}
        {/* <svg ... > */}

        {/* Main Headline */}
        <h1 className="text-5xl md:text-6xl font-extrabold text-blue-700 mb-4">
          Welcome to NoteSphere
        </h1>

        {/* Sub-headline / Description */}
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
          Your simple, elegant space to capture, organize, and access your thoughts anytime, anywhere.
        </p>
      </header>

      {/* Call to Action Buttons Container */}
      {/* Applies fade-in-up animation defined in index.css */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 animate-fade-in-up">

        {/* Get Started Button (Links to Sign Up page) */}
        <Link
          to="/signup" // This directs the user to the sign-up page
          className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-center"
        >
          Get Started
        </Link>

        {/* Login Button (Links to Login page) */}
        <Link
          to="/login" // This directs the user to the login page
          className="px-8 py-3 bg-white text-blue-600 text-lg font-semibold rounded-lg shadow-md hover:bg-gray-100 border border-blue-300 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-center"
        >
          Log In
        </Link>

        {/* Optional Sign Up Button - commented out as "Get Started" usually suffices */}
        {/*
        <Link
          to="/signup"
          className="px-8 py-3 bg-green-500 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-green-600 transition duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 text-center"
        >
          Sign Up
        </Link>
        */}
      </div>

      {/* You can add more sections here later (e.g., features) */}
      {/* <section className="mt-20 text-center"> ... </section> */}

    </div>
  );
}

export default LandingPage;
