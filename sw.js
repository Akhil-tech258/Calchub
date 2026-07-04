/* CalcHub Service Worker — cache-first for app shell, network-first fallback */
const CACHE_NAME = "calchub-v2";
const APP_SHELL = [
  "index.html",
  "category.html",
  "calculator.html",
  "about.html",
  "contact.html",
  "privacy.html",
  "terms.html",
  "css/style.css",
  "css/responsive.css",
  "js/app.js",
  "js/search.js",
  "js/theme.js",
  "js/calculator-engine.js",
  "js/calculators-data.js",
  "js/premium-ui.js",
  "manifest.json",
  "assets/icons/favicon.svg",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match("index.html"));
    })
  );
});
