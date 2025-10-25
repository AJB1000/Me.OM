// sw.js

const CACHE_NAME = 'maps-pwa-v32'; // Changez la version à chaque modification

// Fichiers à mettre en cache
const FILES_TO_CACHE = [
    './',
    './index.html',
    // Ajoutez ici vos autres fichiers (CSS, JS, images)
];

// Installation - Mise en cache des fichiers
self.addEventListener('install', event => {
    console.log('[SW] Installation...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Mise en cache des fichiers');
                return cache.addAll(FILES_TO_CACHE);
            })
            .then(() => self.skipWaiting()) // Force l'activation immédiate
    );
});

// Activation - Nettoyage des anciens caches
self.addEventListener('activate', event => {
    console.log('[SW] Activation...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Suppression ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
            .then(() => self.clients.claim()) // Prend le contrôle immédiatement
    );
});

// Fetch - INTERCEPTION DE TOUTES LES REQUÊTES
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    console.log('[SW] Fetch:', url.pathname, 'Mode:', event.request.mode);

    // Ignorer les requêtes externes (APIs, CDN, etc.)
    if (url.origin !== self.location.origin) {
        console.log('[SW] Requête externe ignorée:', url.href);
        return;
    }

    // STRATÉGIE CACHE-FIRST POUR TOUT
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    console.log('[SW] Réponse depuis cache:', url.pathname);
                    return cachedResponse;
                }

                // Si pas en cache, essayer le réseau
                console.log('[SW] Pas en cache, récupération réseau:', url.pathname);
                return fetch(event.request)
                    .then(response => {
                        // Ne pas mettre en cache les erreurs
                        if (!response || response.status !== 200) {
                            return response;
                        }

                        // Cloner la réponse pour la mettre en cache
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                        return response;
                    })
                    .catch(error => {
                        console.log('[SW] Erreur réseau:', error);

                        // Pour les pages HTML, retourner index.html du cache
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html')
                                .then(response => {
                                    if (response) {
                                        console.log('[SW] Fallback vers index.html');
                                        return response;
                                    }
                                    // Si même index.html n'est pas en cache
                                    return new Response(
                                        '<html><body><h1>Erreur</h1><p>Impossible de charger la page hors ligne.</p></body></html>',
                                        { headers: { 'Content-Type': 'text/html' } }
                                    );
                                });
                        }

                        throw error;
                    });
            })
    );
});

// const CACHE_NAME = 'v19';
// const urlsToCache = [
//     '/',
//     '/index.html',
//     '/manifest.json',
//     '/icon-192.png',
//     // ajoutez vos autres assets statiques
// ];

// self.addEventListener('install', event => {
//     event.waitUntil(
//         caches.open(CACHE_NAME)
//             .then(cache => cache.addAll(urlsToCache))
//     );
// });

// self.addEventListener('fetch', event => {
//     const url = new URL(event.request.url);
//     // console.log(url.origin, url.pathname, location)
//     // Si c’est une requête vers la racine ou avec des paramètres
//     if (url.origin === location.origin && (url.pathname === '/' || url.pathname === '/index.html')) {
//         event.respondWith(
//             caches.match('/index.html')
//                 .then(response => { return response || fetch(event.request) })
//         )
//     }
// });

// self.addEventListener('fetch', event => {
//     const url = new URL(event.request.url);
//     // Ne gérer que les requêtes vers votre site
//     if (url.origin !== self.location.origin) return;
//     // Si c'est la page racine (même avec paramètres), servir index.html
//     let ref = new URL(event.request.referrer);
//     ref = ref.search
//     console.log('fetch', ref)
//     if (url.pathname === '/' || url.pathname === '/index.html') {
//         event.respondWith(
//             caches.match('/index.html'
//                 .then(response => '/index.html' + ref || fetch(event.request))
//             );
//         return;
//     }

//     // Pour les autres ressources (JS, CSS, images), stratégie cache-first
//     event.respondWith(
//         caches.match(event.request)
//             .then(response => response || fetch(event.request))
//     );
// });

