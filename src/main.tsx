
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Root element not found');

// Insert a global style element for dynamic theming if it doesn't exist
const existingStyle = document.getElementById('global-theme-style');
if (!existingStyle) {
  const globalStyle = document.createElement('style');
  globalStyle.id = 'global-theme-style';
  document.head.appendChild(globalStyle);
}

createRoot(rootElement).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
