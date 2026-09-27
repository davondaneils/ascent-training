// Ascent service worker. Deliberately small (docs/06-BUILD.md: installability + reliable workout use).
// - Navigations: network first; on failure, the cached copy of that page, else the cached Today.
// - Static build assets, icons, exercise media: cache first (they're content-hashed or immutable).
// - Everything else (Supabase API, RSC payloads, server actions): straight to the network.
const VERSION = "ascent-v1";
const PAGES = `${VERSION}-pages`;
const ASSETS = `${VERSION}-assets`;

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(ASSETS).then((c) => c.addAll(["/manifest.webmanifest", "/icons/192"]).catch(() => {})));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (!key.startsWith(VERSION)) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  // Sent on sign-out: forget cached pages so nothing personal lingers.
  if (event.data === "clear-pages") event.waitUntil(caches.delete(PAGES));
});

const isAsset = (url) =>
  url.pathname.startsWith("/_next/static/") ||
  url.pathname.startsWith("/exercise-media/") ||
  url.pathname.startsWith("/icons/");

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          // Cache real app pages only (not redirects to /login, not errors).
          if (res.ok && !res.redirected && !url.pathname.startsWith("/login") && !url.pathname.startsWith("/auth")) {
            const copy = res.clone();
            event.waitUntil(caches.open(PAGES).then((c) => c.put(request, copy)));
          }
          return res;
        } catch {
          const cache = await caches.open(PAGES);
          return (
            (await cache.match(request, { ignoreSearch: true })) ||
            (await cache.match("/today")) ||
            new Response("<h1>Offline</h1><p>Reconnect to open Ascent.</p>", { headers: { "Content-Type": "text/html" }, status: 503 })
          );
        }
      })(),
    );
    return;
  }

  if (isAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSETS);
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) event.waitUntil(cache.put(request, res.clone()));
        return res;
      })(),
    );
  }
});
