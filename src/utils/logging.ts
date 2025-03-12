
/**
 * Application Logging System
 * 
 * A centralized logging system for the application that supports different log levels,
 * structured logging, and context information.
 */

// Define log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// Log entry structure
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
  duration?: number;
  tags?: string[];
}

// Constants for logging
const LOG_TO_CONSOLE = true;
const INCLUDE_TIMESTAMP = true;
const DEFAULT_CONTEXT: Record<string, any> = {
  application: 'subscription-app',
  environment: import.meta.env.MODE || 'development',
  version: import.meta.env.VITE_APP_VERSION || 'dev'
};

// Generate a unique request ID for correlation
export const generateRequestId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Main logger class
class AppLogger {
  private context: Record<string, any> = {};
  private requestId: string | null = null;
  private userId: string | null = null;

  constructor() {
    this.setDefaultContext();
  }

  private setDefaultContext(): void {
    this.context = { ...DEFAULT_CONTEXT };
  }

  public setRequestId(requestId: string): AppLogger {
    this.requestId = requestId;
    return this;
  }

  public setUserId(userId: string): AppLogger {
    this.userId = userId;
    return this;
  }

  public setContext(context: Record<string, any>): AppLogger {
    this.context = { ...DEFAULT_CONTEXT, ...context };
    return this;
  }

  public addContext(key: string, value: any): AppLogger {
    this.context[key] = value;
    return this;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    duration?: number,
    tags?: string[]
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...(context || {}) },
      tags
    };

    if (this.userId) {
      entry.userId = this.userId;
    }

    if (this.requestId) {
      entry.requestId = this.requestId;
    }

    if (duration !== undefined) {
      entry.duration = duration;
    }

    return entry;
  }

  private formatConsoleOutput(entry: LogEntry): string {
    const timestamp = INCLUDE_TIMESTAMP ? `[${new Date(entry.timestamp).toLocaleTimeString()}] ` : '';
    const userId = entry.userId ? `[User: ${entry.userId}] ` : '';
    const requestId = entry.requestId ? `[ReqID: ${entry.requestId.substring(0, 6)}] ` : '';
    const duration = entry.duration !== undefined ? ` (${entry.duration.toFixed(2)}ms)` : '';
    
    return `${timestamp}${userId}${requestId}${entry.level.toUpperCase()}: ${entry.message}${duration}`;
  }

  private logToConsole(entry: LogEntry): void {
    if (!LOG_TO_CONSOLE) return;

    const formattedMessage = this.formatConsoleOutput(entry);
    const contextObject = { ...entry.context };

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, contextObject);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, contextObject);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, contextObject);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, contextObject);
        break;
      default:
        console.log(formattedMessage, contextObject);
    }
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    duration?: number,
    tags?: string[]
  ): void {
    const entry = this.createLogEntry(level, message, context, duration, tags);
    this.logToConsole(entry);
    
    // TODO: In the future, we can add external logging services here
    // like sending logs to a backend API or a third-party service.
  }

  // Public logging methods
  public debug(message: string, context?: Record<string, any>, duration?: number, tags?: string[]): void {
    this.log(LogLevel.DEBUG, message, context, duration, tags);
  }

  public info(message: string, context?: Record<string, any>, duration?: number, tags?: string[]): void {
    this.log(LogLevel.INFO, message, context, duration, tags);
  }

  public warn(message: string, context?: Record<string, any>, duration?: number, tags?: string[]): void {
    this.log(LogLevel.WARN, message, context, duration, tags);
  }

  public error(message: string, context?: Record<string, any>, duration?: number, tags?: string[]): void {
    this.log(LogLevel.ERROR, message, context, duration, tags);
  }

  // Timer methods for performance logging
  public startTimer(): number {
    return performance.now();
  }

  public endTimer(startTime: number): number {
    return performance.now() - startTime;
  }

  public logWithTiming(level: LogLevel, message: string, startTime: number, context?: Record<string, any>, tags?: string[]): void {
    const duration = this.endTimer(startTime);
    this.log(level, message, context, duration, tags);
  }
}

// Create global instance
export const appLogger = new AppLogger();

// Create context-specific loggers
export const createLogger = (context: Record<string, any>): AppLogger => {
  return new AppLogger().setContext(context);
};

// Export a database logger specifically for database operations
export const dbLogger = createLogger({ module: 'database' });

// Export an API logger for API calls
export const apiLogger = createLogger({ module: 'api' });

// Export an auth logger for authentication events
export const authLogger = createLogger({ module: 'auth' });

// Export a subscription logger
export const subscriptionLogger = createLogger({ module: 'subscription' });

// Helper for logging API requests and responses
export const logApiCall = async <T>(
  name: string,
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> => {
  const startTime = apiLogger.startTimer();
  try {
    apiLogger.info(`API Call: ${name} - Started`, context);
    const result = await fn();
    const duration = apiLogger.endTimer(startTime);
    apiLogger.info(
      `API Call: ${name} - Completed`,
      { ...context, success: true, duration },
      duration,
      ['api']
    );
    return result;
  } catch (error: any) {
    const duration = apiLogger.endTimer(startTime);
    apiLogger.error(
      `API Call: ${name} - Failed`,
      { ...context, error: error.message, stack: error.stack, duration },
      duration,
      ['api', 'error']
    );
    throw error;
  }
};

// Export a utility for wrapping database queries with logging
export const logDbQuery = async <T>(
  queryName: string,
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> => {
  const startTime = dbLogger.startTimer();
  try {
    dbLogger.debug(`DB Query: ${queryName} - Started`, context);
    const result = await fn();
    const duration = dbLogger.endTimer(startTime);
    
    // Log slow queries with a warning level
    if (duration > 500) {
      dbLogger.warn(
        `DB Query: ${queryName} - Slow Query`,
        { ...context, duration },
        duration,
        ['database', 'slow-query']
      );
    } else {
      dbLogger.debug(
        `DB Query: ${queryName} - Completed`,
        { ...context, duration },
        duration,
        ['database']
      );
    }
    
    return result;
  } catch (error: any) {
    const duration = dbLogger.endTimer(startTime);
    dbLogger.error(
      `DB Query: ${queryName} - Failed`,
      { ...context, error: error.message, duration },
      duration,
      ['database', 'error']
    );
    throw error;
  }
};

export default appLogger;
