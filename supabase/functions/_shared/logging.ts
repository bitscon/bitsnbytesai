
// Structured logging utility for edge functions
export interface LogContext {
  userId?: string;
  requestId?: string;
  functionName: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  context: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

export class Logger {
  private context: LogContext;

  constructor(context: LogContext) {
    this.context = context;
  }

  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    additionalContext?: Record<string, any>,
    error?: Error
  ): LogEntry {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...this.context,
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

  private log(entry: LogEntry) {
    // In production, you might want to send this to a logging service
    // For now, we'll use console.log with proper formatting
    console.log(JSON.stringify(entry));
  }

  info(message: string, context?: Record<string, any>) {
    this.log(this.createLogEntry('info', message, context));
  }

  warn(message: string, context?: Record<string, any>) {
    this.log(this.createLogEntry('warn', message, context));
  }

  error(message: string, error: Error, context?: Record<string, any>) {
    this.log(this.createLogEntry('error', message, context, error));
  }
}

export function createLogger(functionName: string, requestId?: string, userId?: string): Logger {
  return new Logger({
    functionName,
    requestId,
    userId,
    environment: Deno.env.get('ENVIRONMENT') || 'development',
  });
}
