// Minimal cache-first service worker for startup assets and app shell
// Bump this when replacing pre-cached assets (e.g., wordmark images) to ensure fresh fetch
const CACHE_NAME = 'bible-challenge-v2';
const CORE_ASSETS = [
	'./',
	'./index.html',
	'./bible-challenge.html',
	'./logo/logo1-light.png',
	'./logo/logo2-light.png',
	'./logo/logo1-dark.png',
	'./logo/logo2-dark.png',
	'./logo/word1-light.png',
	'./logo/word2-light.png',
	'./logo/word1-dark.png',
	'./logo/word2-dark.png'
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))))).then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', (event) => {
	const req = event.request;
	// Only handle GET requests
	if (req.method !== 'GET') return;
	const url = new URL(req.url);
	// Same-origin only
	if (url.origin !== self.location.origin) return;

	// Prefer cache-first for images and the app shell; network-first for JSON to get fresh data when online
	if (req.destination === 'image' || url.pathname.endsWith('.html')) {
		event.respondWith(
			caches.match(req).then((cached) => cached || fetch(req).then((res) => {
				const copy = res.clone();
				caches.open(CACHE_NAME).then((c) => c.put(req, copy));
				return res;
			}))
		);
		return;
	}

	if (url.pathname.endsWith('external-verses.json')) {
		event.respondWith(
			fetch(req).then((res) => {
				const copy = res.clone();
				caches.open(CACHE_NAME).then((c) => c.put(req, copy));
				return res;
			}).catch(() => caches.match(req))
		);
		return;
	}
});

