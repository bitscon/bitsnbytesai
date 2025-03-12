
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { appLogger } from '@/utils/logging';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and log unhandled errors in React components
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to our logging system
    appLogger.error(
      'Uncaught error in component', 
      error, 
      { 
        componentStack: errorInfo.componentStack,
        componentName: this.props.children?.type?.name || 'Unknown'
      }
    );
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Return fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default fallback UI
      return (
        <div className="p-4 bg-destructive/10 rounded-md border border-destructive text-destructive">
          <h2 className="font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm">{this.state.error?.message || 'An unexpected error occurred'}</p>
          <button 
            className="mt-2 text-xs px-2 py-1 bg-background border rounded-md"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
