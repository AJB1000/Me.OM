/* =========  CONFIGURATION  ========= */
const VERSION = 'v11';                       // ← changez ici pour forcer la MAJ
const CACHE_NAME = `meom-${VERSION}`;
const BASE_URL = self.location.pathname.replace(/sw\.js$/, '');
const SHELL_URLS = [
    `${BASE_URL}`,
    `${BASE_URL}index.html`,
    `${BASE_URL}script.js`,
    `${BASE_URL}manifest.json`,
    `${BASE_URL}favicon.ico`,
    `${BASE_URL}icons/icon-192.png`,
    `${BASE_URL}icons/icon-512.png`
];

/* =========  INSTALL  ========= */
self.addEventListener('install', evt => {
    evt.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(SHELL_URLS))
            .then(() => self.skipWaiting())       // active le nouveau SW immédiatement
    );
});

/* =========  ACTIVATE  ========= */
self.addEventListener('activate', evt => {
    // on supprime les vieux caches
    evt.waitUntil(
        caches.keys()
            .then(names => Promise.all(
                names.map(n => n !== CACHE_NAME && caches.delete(n))
            ))
            .then(() => self.clients.claim())     // prend le contrôle des onglets ouverts
    );
});

/* =========  FETCH  ========= */
self.addEventListener('fetch', evt => {
    const url = new URL(evt.request.url);

    /* 1) Si c’est index.html (quelques soient les params) → cache-first */
    if (url.pathname.endsWith('/index.html')) {
        evt.respondWith(
            caches.match(`${BASE_URL}index.html`)           // clé *sans* query-string
                .then(resp => resp || fetch(evt.request))
        );
        return;
    }

    /* 2) Si c’est script.js → cache-first */
    if (url.pathname.endsWith('/script.js')) {
        evt.respondWith(
            caches.match(`${BASE_URL}script.js`)
                .then(resp => resp || fetch(evt.request))
        );
        return;
    }

    /* 3) Tout le reste (API, images, etc.) → network-first */
    evt.respondWith(
        fetch(evt.request)
            .catch(() => caches.match(evt.request)) // éventuel fallback
    );
});