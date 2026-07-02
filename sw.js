const CACHE_NAME = 'dhaula-os-v4.0';
const ASSETS = [
    './',
    './index.html',
    './app.js',
    './modules/db.js',
    './data/personas.js',
    './modules/boardroom.js',
    './data/journal.js',
    './data/bibles.js',
    './data/pipeline.js',
    './css/design-system.css',
    './manifest.webmanifest'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys
                .filter(key => key !== CACHE_NAME)
                .map(key => caches.delete(key))
            );
        })
    );
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;

    const url = new URL(e.request.url);
    const isAppOrModuleJs = url.pathname.endsWith('app.js') || url.pathname.match(/\/modules\/.*\.js$/);

    if (isAppOrModuleJs) {
        e.respondWith(
            fetch(e.request).then(response => {
                const resClone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
                return response;
            }).catch(() => caches.match(e.request))
        );
    } else {
        e.respondWith(
            caches.match(e.request).then(response => {
                return response || fetch(e.request).then(netResponse => {
                    const resClone = netResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
                    return netResponse;
                });
            })
        );
    }
});
