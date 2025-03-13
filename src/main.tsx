
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { appLogger } from './utils/logging';

// Log unhandled errors at the global level
window.addEventListener('error', (event) => {
  console.error('Uncaught global error:', event.error);
  appLogger.error(
    'Uncaught global error',
    {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      type: event.type
    },
    event.error,
    ['global', 'uncaught']
  );
});

// Log unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  appLogger.error(
    'Unhandled promise rejection',
    {
      type: event.type,
      reason: event.reason?.toString() || 'Unknown reason'
    },
    event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
    ['global', 'unhandled-promise']
  );
});

// Log initial page load
appLogger.info('Application starting', {
  url: window.location.href,
  userAgent: navigator.userAgent
});

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} catch (error) {
  console.error('Failed to render application:', error);
  appLogger.error('Critical rendering failure', { error: String(error) }, error instanceof Error ? error : new Error(String(error)));
  
  // Fallback rendering in case of error
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h1>Something went wrong</h1>
        <p>We're sorry, but the application failed to load. Please try refreshing the page.</p>
      </div>
    `;
  }
}
