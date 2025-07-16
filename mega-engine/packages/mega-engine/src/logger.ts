/**
 * Basic Logger Class
 * Structured logging with timestamps, levels, and source engine
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  data?: any;
}

export class Logger {
  private source: string;
  private level: LogLevel;
  private static globalLevel: LogLevel = LogLevel.INFO;
  private static logs: LogEntry[] = [];
  private static maxLogs = 1000;

  constructor(source: string, level: LogLevel = LogLevel.INFO) {
    this.source = source;
    this.level = level;
  }

  /**
   * Set global log level
   */
  static setGlobalLevel(level: LogLevel): void {
    Logger.globalLevel = level;
  }

  /**
   * Get all logs
   */
  static getLogs(): LogEntry[] {
    return [...Logger.logs];
  }

  /**
   * Clear logs
   */
  static clearLogs(): void {
    Logger.logs = [];
  }

  /**
   * Get logs by source
   */
  static getLogsBySource(source: string): LogEntry[] {
    return Logger.logs.filter(log => log.source === source);
  }

  /**
   * Get logs by level
   */
  static getLogsByLevel(level: LogLevel): LogEntry[] {
    return Logger.logs.filter(log => log.level >= level);
  }

  /**
   * Debug level logging
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Info level logging
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Warning level logging
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Error level logging
   */
  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, data?: any): void {
    // Check if we should log this level
    if (level < Math.max(this.level, Logger.globalLevel)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      source: this.source,
      message,
      data
    };

    // Add to global logs
    Logger.logs.push(entry);
    
    // Keep logs under max size
    if (Logger.logs.length > Logger.maxLogs) {
      Logger.logs.shift();
    }

    // Format and print to console
    this.printToConsole(entry);
  }

  /**
   * Print log entry to console
   */
  private printToConsole(entry: LogEntry): void {
    const levelStr = LogLevel[entry.level];
    const timestamp = entry.timestamp.split('T')[1].split('.')[0]; // HH:MM:SS
    const prefix = `[${timestamp}] [${levelStr}] [${entry.source}]`;
    
    const args = [prefix, entry.message];
    if (entry.data !== undefined) {
      args.push(entry.data);
    }

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(...args);
        break;
      case LogLevel.INFO:
        console.info(...args);
        break;
      case LogLevel.WARN:
        console.warn(...args);
        break;
      case LogLevel.ERROR:
        console.error(...args);
        break;
    }
  }

  /**
   * Create a child logger with a sub-source
   */
  child(subSource: string): Logger {
    return new Logger(`${this.source}:${subSource}`, this.level);
  }

  /**
   * Set log level for this logger
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

// Export default logger instance
export const logger = new Logger('MegaEngine'); 