// Minimal service worker so the tablet can install the kiosk as an app.
// It caches nothing, so changes you commit to GitHub still show up on refresh.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
