
import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';
import AppThemeWrapper from './components/AppThemeWrapper';
import { AuthProvider } from './context/auth';
import { Toaster } from './components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './components/ErrorBoundary';
import { appLogger } from './utils/logging';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // Log application startup
  useEffect(() => {
    appLogger.info('Application initialized', {
      version: import.meta.env.VITE_APP_VERSION || 'development',
      environment: import.meta.env.MODE,
      buildTimestamp: import.meta.env.VITE_BUILD_TIMESTAMP || new Date().toISOString()
    });
    
    // Log when application unloads
    const handleUnload = () => {
      appLogger.info('Application closed');
    };
    
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppThemeWrapper>
          <AuthProvider>
            <Router>
              <AppRoutes />
              <Toaster />
            </Router>
          </AuthProvider>
        </AppThemeWrapper>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
