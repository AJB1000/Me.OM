let CACHE_NAME = 'pwa-git03-v57';
const BASE_URL = self.location.pathname.replace(/sw\.js$/, '');

const urlsToCache = [
    `${BASE_URL}`,
    `${BASE_URL}index.html`,
    `${BASE_URL}script.js`,
    `${BASE_URL}manifest.json`,
    `${BASE_URL}favicon.ico`,
    `${BASE_URL}icons/icon-192.png`,
    `${BASE_URL}icons/icon-512.png`
];

self.addEventListener('install', event => {
    console.log('[SW] Installation');
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('activate', event => {
    console.log('[SW] Activation');
    self.clients.claim();
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
});

self.addEventListener('fetch', event => {
    const requestURL = new URL(event.request.url);

    // On intercepte uniquement les requêtes du même domaine
    if (requestURL.origin === location.origin) {
        event.respondWith(
            caches.match(event.request).then(response => {
                // 1️⃣ Si on a une version dans le cache, on la renvoie
                if (response) return response;

                // 2️⃣ Sinon, on essaie le réseau
                return fetch(event.request).catch(() => {
                    // 3️⃣ Si offline et la requête est pour index.html (même avec paramètres)
                    if (event.request.mode === 'navigate' || requestURL.pathname.endsWith('index.html')) {
                        console.log('[SW] Fetch Offline');
                        return caches.match(`${BASE_URL}index.html`);
                    }
                    // 4️⃣ En dernier recours, on renvoie une réponse vide (pas undefined)
                    return new Response('Offline', { status: 503, statusText: 'Offline' });
                });
            })
        );
    }
});
