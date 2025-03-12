
/**
 * Structured logging utility for the frontend application
 */

// Log levels in order of severity
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Context data to include with each log entry
export interface LogContext {
  userId?: string;
  sessionId?: string;
  component?: string;
  path?: string;
  [key: string]: any;
}

// Structure of a log entry
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

// Configurable options for the logger
interface LoggerOptions {
  minLevel?: LogLevel;
  captureConsole?: boolean;
  sendToServer?: boolean;
  serverEndpoint?: string;
}

// Default logger options
const DEFAULT_OPTIONS: LoggerOptions = {
  minLevel: 'info',
  captureConsole: true,
  sendToServer: false
};

/**
 * Logger class for structured application logging
 */
export class Logger {
  private context: LogContext;
  private options: LoggerOptions;
  private sessionId: string;
  
  constructor(context: LogContext = {}, options: LoggerOptions = {}) {
    this.context = context;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.sessionId = context.sessionId || this.generateSessionId();
    
    // Set up console capture if enabled
    if (this.options.captureConsole) {
      this.captureConsole();
    }
  }
  
  /**
   * Generate a unique session ID for tracking logs across page loads
   */
  private generateSessionId(): string {
    const existingId = typeof window !== 'undefined' ? sessionStorage.getItem('app_log_session_id') : null;
    
    if (existingId) {
      return existingId;
    }
    
    const newId = Math.random().toString(36).substring(2, 15);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('app_log_session_id', newId);
    }
    
    return newId;
  }
  
  /**
   * Captures and redirects console methods to structured logging
   */
  private captureConsole() {
    if (typeof window === 'undefined') return;
    
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error
    };
    
    // Capture console.log
    console.log = (...args: any[]) => {
      this.debug(args[0], { consoleArgs: args.slice(1) });
      originalConsole.log.apply(console, args);
    };
    
    // Capture console.info
    console.info = (...args: any[]) => {
      this.info(args[0], { consoleArgs: args.slice(1) });
      originalConsole.info.apply(console, args);
    };
    
    // Capture console.warn
    console.warn = (...args: any[]) => {
      this.warn(args[0], { consoleArgs: args.slice(1) });
      originalConsole.warn.apply(console, args);
    };
    
    // Capture console.error
    console.error = (...args: any[]) => {
      const error = args.find(arg => arg instanceof Error);
      if (error) {
        this.error(args[0], error, { consoleArgs: args.filter(arg => arg !== error).slice(1) });
      } else {
        this.error(args[0], null, { consoleArgs: args.slice(1) });
      }
      originalConsole.error.apply(console, args);
    };
  }
  
  /**
   * Creates a structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    additionalContext?: Record<string, any>,
    error?: Error | null
  ): LogEntry {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...this.context,
        sessionId: this.sessionId,
        path: typeof window !== 'undefined' ? window.location.pathname : undefined,
        ...additionalContext,
      },
    };

    if (error) {
      logEntry.error = {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    return logEntry;
  }

  /**
   * Processes and outputs a log entry
   */
  private log(entry: LogEntry) {
    // In production, you might want to send this to a logging service
    // For now, we'll use console.log with proper formatting
    console.log(`[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`, entry);
    
    // If server logging is enabled, send log to server
    if (this.options.sendToServer && this.options.serverEndpoint) {
      this.sendToServer(entry);
    }
  }
  
  /**
   * Sends a log entry to the server for storage/analysis
   */
  private async sendToServer(entry: LogEntry) {
    if (!this.options.serverEndpoint) return;
    
    try {
      await fetch(this.options.serverEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
        // Send logs with low priority and don't block main thread
        keepalive: true
      });
    } catch (err) {
      // Don't log this error to avoid infinite loops
      console.error('Failed to send log to server:', err);
    }
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: Record<string, any>) {
    if (this.shouldLog('debug')) {
      this.log(this.createLogEntry('debug', message, context));
    }
  }

  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, any>) {
    if (this.shouldLog('info')) {
      this.log(this.createLogEntry('info', message, context));
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: Record<string, any>) {
    if (this.shouldLog('warn')) {
      this.log(this.createLogEntry('warn', message, context));
    }
  }

  /**
   * Log an error message with optional Error object
   */
  error(message: string, error: Error | null = null, context?: Record<string, any>) {
    if (this.shouldLog('error')) {
      this.log(this.createLogEntry('error', message, context, error));
    }
  }
  
  /**
   * Check if the given level should be logged based on configured minLevel
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const minLevelIndex = levels.indexOf(this.options.minLevel || 'info');
    const currentLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex >= minLevelIndex;
  }
  
  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger(
      { ...this.context, ...additionalContext },
      this.options
    );
  }
}

// Create a default application logger instance
export const appLogger = new Logger({ 
  component: 'App'
});

// Export a hook to use the logger in components
export function useLogger(componentName: string) {
  return appLogger.child({ component: componentName });
}
