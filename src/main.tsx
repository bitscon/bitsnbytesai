import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { appLogger } from './utils/logging';

// Create global error handler for uncaught exceptions
window.addEventListener('error', (event) => {
  appLogger.error(
    'Uncaught global error', 
    event.error || new Error(event.message), 
    {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      type: 'uncaught_error'
    }
  );
});

// Create global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason instanceof Error 
    ? event.reason
    : new Error(String(event.reason));
  
  appLogger.error(
    'Unhandled promise rejection', 
    error, 
    {
      type: 'unhandled_rejection',
      reason: String(event.reason)
    }
  );
});

// Log navigation events
const logNavigation = () => {
  appLogger.info(`Page navigation: ${window.location.pathname}${window.location.search}`);
};

// Log initial navigation
logNavigation();

// Log subsequent navigations
window.addEventListener('popstate', logNavigation);

// Initialize React app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
