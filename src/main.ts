import './styles/main.css';
import { App } from './app.js';

// ─── Register Service Worker ──────────────────────────────────────────────────

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // vite-plugin-pwa handles SW registration automatically
  });
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

function boot(): void {
  const container = document.getElementById('app');
  if (!container) {
    console.error('Flash: #app container not found');
    return;
  }

  new App(container);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
