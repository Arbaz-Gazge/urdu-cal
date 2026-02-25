const CACHE_NAME = 'urdu-cal-v2';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js?v=2',
    './bg.png',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => response || fetch(event.request))
    );
});
