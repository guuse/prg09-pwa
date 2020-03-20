self.addEventListener('install', async event => {
    let cache = caches.open('assets').then((c) => {
        c.addAll([
            './',
            './style.css',
            './app.js'
        ]);
    });
    event.waitUntil(cache);
});

self.addEventListener('fetch', function (event) {
    let request = event.request;
    let url = new URL(request.url);
    if (url.origin === location.origin) {
        event.respondWith(cacheFirst(request));
    } else {
        event.respondWith(networkFirst(request));
    }
});

async function cacheFirst(request) {
    let cachedResponse = await caches.match(request);
    return cachedResponse || fetch(request);
}
async function networkFirst(request) {
    let cache = caches.open('api-data');

    try {
        let response = fetch(request);
        (await cache).put(request, (await response).clone());
        return response;
    } catch (e) {
        return (await cache).match(request);
    }
}
