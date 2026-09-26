import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Keep unexpected browser errors visible in DevTools instead of leaving a
// completely blank GitHub Pages screen. The React ErrorBoundary handles render
// errors; this covers uncaught promise/runtime errors outside React.
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
window.addEventListener('error', (event) => {
  console.error('Unhandled application error:', event.error || event.message);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
