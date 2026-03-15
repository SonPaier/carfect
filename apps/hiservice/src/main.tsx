import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register service worker with auto-update — new versions activate immediately
registerSW({
  onRegisteredSW(swUrl, registration) {
    console.log('[PWA] SW registered:', swUrl);
    if (registration) {
      // Check for SW updates every 15 minutes, but only when tab is visible
      const intervalMs = 15 * 60 * 1000;
      let intervalId = setInterval(() => registration.update(), intervalMs);

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          clearInterval(intervalId);
        } else {
          registration.update();
          intervalId = setInterval(() => registration.update(), intervalMs);
        }
      });
    }
  },
  onOfflineReady() {
    console.log('[PWA] App ready for offline use');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
