const CACHE_NAME = 'urdu-cal-v4';
const ASSETS = [
    './',
    './index.html',
    './style.css?v=4',
    './script.js?v=4',
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
