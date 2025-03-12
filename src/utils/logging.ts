
interface LogContext {
  userId?: string;
  path?: string;
  component?: string;
  [key: string]: any;
}

class FrontendLogger {
  private context: LogContext;

  constructor(initialContext: LogContext = {}) {
    this.context = initialContext;
  }

  private formatLogEntry(level: string, message: string, context?: LogContext, error?: Error) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...context,
    };

    if (error) {
      entry['error'] = {
        message: error.message,
        stack: error.stack,
        // Include any custom properties
        ...(error as any),
      };
    }

    return entry;
  }

  setUserId(userId: string) {
    this.context.userId = userId;
  }

  setContext(context: LogContext) {
    this.context = { ...this.context, ...context };
  }

  info(message: string, context?: LogContext) {
    console.log(JSON.stringify(this.formatLogEntry('info', message, context)));
  }

  warn(message: string, context?: LogContext) {
    console.warn(JSON.stringify(this.formatLogEntry('warn', message, context)));
  }

  error(message: string, error: Error, context?: LogContext) {
    console.error(JSON.stringify(this.formatLogEntry('error', message, context, error)));
  }
}

export const logger = new FrontendLogger();

// Error boundary component for React
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  component?: string;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('React component error', error, {
      component: this.props.component,
      componentStack: errorInfo.componentStack,
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 rounded-md bg-red-50">
          <h2 className="text-red-800 font-semibold">Something went wrong</h2>
          <p className="text-red-600">Please try refreshing the page</p>
        </div>
      );
    }

    return this.props.children;
  }
}
