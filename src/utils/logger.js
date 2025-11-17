/**
 * Logger Utility
 * Centralized logging with environment-aware output
 * Replaces scattered console.log statements
 */

const isDevelopment = import.meta.env.DEV;

class Logger {
  constructor(context = 'App') {
    this.context = context;
  }

  info(message, data) {
    if (isDevelopment) {
      console.log(`[${this.context}] ${message}`, data !== undefined ? data : '');
    }
  }

  warn(message, data) {
    console.warn(`[${this.context}] ${message}`, data !== undefined ? data : '');
  }

  error(message, error) {
    console.error(`[${this.context}] ${message}`, error || '');
    
    // In production, send to error tracking service (e.g., Sentry)
    if (!isDevelopment && window.Sentry) {
      window.Sentry.captureException(error || new Error(message));
    }
  }

  debug(message, data) {
    if (isDevelopment) {
      console.debug(`[${this.context}] ${message}`, data !== undefined ? data : '');
    }
  }

  group(label) {
    if (isDevelopment) {
      console.group(`[${this.context}] ${label}`);
    }
  }

  groupEnd() {
    if (isDevelopment) {
      console.groupEnd();
    }
  }

  time(label) {
    if (isDevelopment) {
      console.time(`[${this.context}] ${label}`);
    }
  }

  timeEnd(label) {
    if (isDevelopment) {
      console.timeEnd(`[${this.context}] ${label}`);
    }
  }
}

// Create logger instances for different contexts
export const createLogger = (context) => new Logger(context);

// Default logger
export const logger = new Logger('NoteSphere');

export default logger;
