const CACHE_NAME = __CACHE_VERSION__;
const PRECACHE_PATHS = __PRECACHE_MANIFEST__;
const scopeUrl = self.registration.scope;
const precacheUrls = PRECACHE_PATHS.map((path) => new URL(path, scopeUrl).href);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME)
    .then((cache) => cache.addAll(precacheUrls))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key.startsWith("dsa-engine-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) ||
      (await cache.match(new URL("./playbook.html", scopeUrl).href)) ||
      (await cache.match(new URL("./index.html", scopeUrl).href));
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fresh = fetch(request).then((response) => {
    if (response.ok || response.type === "opaque") void cache.put(request, response.clone());
    return response;
  }).catch(() => cached);
  return cached || fresh;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.pathname.includes("/api/") || url.pathname.includes("/auth/v1/") || url.pathname.includes("/rest/v1/")) return;
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }
  if (url.origin === self.location.origin || ["style", "script", "image", "font", "worker"].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

