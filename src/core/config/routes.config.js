/**
 * Route Configuration
 * 
 * Defines all application routes and their metadata
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  LANDING: '/landing',
  LOGIN: '/login',
  SIGNUP: '/signup',
  ONBOARDING: '/onboarding',
  
  // Protected routes
  NOTES: '/notes',
  NOTE_EDITOR: '/note/:noteId',
  TRASH: '/trash',
  SETTINGS: '/settings',
  PROFILE: '/profile',
};

export const ROUTE_CONFIG = {
  [ROUTES.HOME]: {
    title: 'Home',
    requiresAuth: false,
    layout: 'default',
  },
  [ROUTES.LANDING]: {
    title: 'Welcome to NoteSphere',
    requiresAuth: false,
    layout: 'minimal',
  },
  [ROUTES.LOGIN]: {
    title: 'Login',
    requiresAuth: false,
    layout: 'auth',
  },
  [ROUTES.SIGNUP]: {
    title: 'Sign Up',
    requiresAuth: false,
    layout: 'auth',
  },
  [ROUTES.NOTES]: {
    title: 'My Notes',
    requiresAuth: true,
    layout: 'default',
  },
  [ROUTES.NOTE_EDITOR]: {
    title: 'Edit Note',
    requiresAuth: true,
    layout: 'editor',
  },
  [ROUTES.SETTINGS]: {
    title: 'Settings',
    requiresAuth: true,
    layout: 'default',
  },
};

export default ROUTES;
