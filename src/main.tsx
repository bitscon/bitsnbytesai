
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { appLogger } from './utils/logging';

// Log unhandled errors at the global level
window.addEventListener('error', (event) => {
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
