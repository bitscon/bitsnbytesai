import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { createRoot } from 'react-dom/client';
import './index.css';

// Use BrowserRouter with the correct base name for GitHub Pages
createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename="/bitsnbytesai">
    <App />
  </BrowserRouter>
);
