
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
  
  console.log('Attempting to render application...');
  
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  
  console.log('Application rendered successfully');
} catch (error) {
  console.error('Failed to render application:', error);
  appLogger.error('Critical rendering failure', { error: String(error) }, error instanceof Error ? error : new Error(String(error)));
  
  // Fallback rendering in case of error
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #333; background-color: #f9f9f9; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <h1 style="color: #e53e3e;">Something went wrong</h1>
        <p>We're sorry, but the application failed to load. Please try refreshing the page.</p>
        <pre style="margin-top: 20px; padding: 10px; background: #eee; border-radius: 4px; text-align: left; max-width: 80%; overflow: auto;">${String(error)}</pre>
        <button style="margin-top: 20px; padding: 8px 16px; background: #3182ce; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="window.location.reload()">Refresh Page</button>
      </div>
    `;
  }
}
