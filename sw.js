const CACHE_NAME = 'map-pwa-v4';
const FILES_TO_CACHE = [
    './',
    './index.html',
    './offline.html',
    './script.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// --- INSTALLATION ---
self.addEventListener('install', event => {
    console.log('📦 Installation du Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
    );
    self.skipWaiting();
});

// --- ACTIVATION ---
self.addEventListener('activate', event => {
    console.log('⚙️ Activation du SW...');
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// --- INTERCEPTION DES REQUÊTES ---
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // 🔹 Cas 1 : navigation ou URL avec paramètres
    if (event.request.mode === 'navigate' || url.search) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Si le réseau répond, on le renvoie
                    return response;
                })
                .catch(() => {
                    // Sinon on renvoie toujours index.html depuis le cache
                    return caches.match('index.html')
                        .then(resp => resp || caches.match('./index.html'))
                        .then(resp => resp || caches.match('offline.html'));
                })
        );

        // Prévenir les pages ouvertes de la nouvelle navigation
        event.waitUntil(
            self.clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then(clients => {
                    clients.forEach(client => client.postMessage({
                        type: 'NAVIGATE',
                        url: event.request.url
                    }));
                })
        );
        return;
    }

    // 🔹 Cas 2 : autres ressources (scripts, icônes, etc.)
    event.respondWith(
        caches.match(event.request).then(response => response || fetch(event.request))
    );
});
