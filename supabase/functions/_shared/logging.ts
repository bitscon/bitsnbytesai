
// Structured logging utility for edge functions
export interface LogContext {
  userId?: string;
  requestId?: string;
  functionName: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
    details?: any;
  };
}

export class Logger {
  private context: LogContext;

  constructor(context: LogContext) {
    this.context = {
      ...context,
      environment: Deno.env.get('ENVIRONMENT') || 'development',
      region: Deno.env.get('REGION') || 'unknown',
      version: Deno.env.get('VERSION') || 'development'
    };
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
        details: (error as any).details || (error as any).data
      };
    }

    return logEntry;
  }

  private log(entry: LogEntry) {
    // Format the entry for console output
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.context.functionName}${entry.context.requestId ? ` requestId=${entry.context.requestId}` : ''}]`;
    
    switch (entry.level) {
      case 'debug':
        console.debug(`${prefix} ${entry.message}`, entry.context);
        break;
      case 'info':
        console.log(`${prefix} ${entry.message}`, entry.context);
        break;
      case 'warn':
        console.warn(`${prefix} ${entry.message}`, entry.context);
        break;
      case 'error':
        console.error(`${prefix} ${entry.message}`, entry.error || '', entry.context);
        break;
    }
    
    // In a production environment, you might want to send logs to a service
    // like Supabase Storage, Cloudflare R2, or a dedicated logging service
    this.persistLog(entry);
  }
  
  /**
   * Persist the log entry to a storage service
   * This is a placeholder implementation - replace with actual implementation
   */
  private async persistLog(entry: LogEntry) {
    // Skip persistence in development mode
    if (this.context.environment === 'development') {
      return;
    }
    
    try {
      // Example: store logs in Supabase storage
      // This would need to be implemented based on your storage solution
      /*
      const supabaseAdmin = getSupabaseAdmin();
      
      // Group logs by date for easier querying
      const date = new Date().toISOString().split('T')[0];
      const fileName = `${date}/${entry.context.functionName}/${entry.level}/${Date.now()}-${entry.context.requestId || 'unknown'}.json`;
      
      await supabaseAdmin
        .storage
        .from('logs')
        .upload(fileName, JSON.stringify(entry), {
          contentType: 'application/json',
          upsert: false
        });
      */
    } catch (error) {
      // Don't throw errors from logging logic to avoid infinite loops
      console.error('Failed to persist log:', error);
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log(this.createLogEntry('debug', message, context));
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
  
  /**
   * Create a child logger with additional context
   */
  child(additionalContext: Partial<LogContext>): Logger {
    return new Logger({
      ...this.context,
      ...additionalContext
    });
  }
  
  /**
   * Begin timing an operation
   */
  startTimer(operation: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.info(`Operation '${operation}' completed`, { 
        operation, 
        durationMs: duration.toFixed(2) 
      });
      
      // Log slow operations as warnings
      if (duration > 1000) {
        this.warn(`Slow operation detected: '${operation}'`, { 
          operation, 
          durationMs: duration.toFixed(2) 
        });
      }
    };
  }
  
  /**
   * Log API requests with timing
   */
  async logApiCall<T>(
    description: string, 
    apiCall: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const start = performance.now();
    this.info(`API Call started: ${description}`, context);
    
    try {
      const result = await apiCall();
      const duration = performance.now() - start;
      
      this.info(`API Call completed: ${description}`, {
        ...context,
        durationMs: duration.toFixed(2),
        success: true
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      this.error(`API Call failed: ${description}`, error as Error, {
        ...context,
        durationMs: duration.toFixed(2),
        success: false
      });
      
      throw error;
    }
  }
}

/**
 * Create a logger for an edge function
 */
export function createLogger(functionName: string, requestId?: string, userId?: string): Logger {
  return new Logger({
    functionName,
    requestId,
    userId,
    timestamp: new Date().toISOString(),
  });
}
