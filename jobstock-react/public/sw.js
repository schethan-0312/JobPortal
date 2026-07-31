// Minimal service worker: caches the app shell for installability/offline start,
// and displays incoming Web Push notifications. Deliberately no aggressive runtime
// caching of API responses — job/application data must always be fresh.
const CACHE_NAME = "jobstock-shell-v2";
const SHELL_ASSETS = ["/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

// Deliberately does NOT intercept navigation requests (mode: "navigate") — every
// page load must hit the network so auth-gated, per-user content is never served
// stale from the install-time shell cache. Only opportunistically caches same-origin
// static assets (JS/CSS/images), never API calls or page documents.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/")) return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request)),
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = { title: "JobStock", body: "" };
  try {
    payload = event.data.json();
  } catch {
    payload.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || "JobStock", {
      body: payload.body,
      icon: "/assets/img/favicon.png",
      badge: "/assets/img/favicon.png",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/candidate-dashboard"));
});
