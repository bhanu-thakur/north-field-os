const CACHE_NAME = 'north-field-os-v1';
const ASSETS = [
    './',
    './index.html',
    './app.js',
    './css/design-system.css',
    './manifest.webmanifest'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(response => {
            return response || fetch(e.request);
        })
    );
});
