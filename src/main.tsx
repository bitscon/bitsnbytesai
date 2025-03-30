
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Root element not found');

// Insert a global style element for dynamic theming
const globalStyle = document.createElement('style');
globalStyle.id = 'global-theme-style';
document.head.appendChild(globalStyle);

createRoot(rootElement).render(<App />);
