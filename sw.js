// sw.js

const CACHE_NAME = 'maps-pwa-v48'; // Changez la version à chaque modification

// Fichiers à mettre en cache
const FILES_TO_CACHE = [
    './',
    './index.html',
    './script.js',
    './deepseek.css',
    './manifest.json',
    './icon-192.png'
];

/// Installation classique
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
    );
    // self.skipWaiting();
});

// Activation et nettoyage
// self.addEventListener('activate', event => {
//     event.waitUntil(
//         caches.keys().then(keys =>
//             Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
//         )
//     );
//     self.clients.claim();
// });

// Interception des navigations (liens venant d’OruxMaps)
self.addEventListener('fetch', event => {
    // On n’intercepte que les navigations vers la page principale
    if (event.request.mode === 'navigate') {
        const url = event.request.url;

        // On envoie un message à toutes les pages contrôlées
        event.waitUntil(
            self.clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then(clients => {
                    for (const client of clients) {
                        client.postMessage({
                            type: 'NAVIGATE',
                            url: url
                        });
                    }
                })
        );

        // Répond quand même avec la page mise en cache
        event.respondWith(
            caches.match('/index.html').then(resp => resp || fetch(event.request))
        );
    }
});