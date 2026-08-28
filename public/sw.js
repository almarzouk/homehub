// HomeHub Service Worker — offline shell + Web Push
const CACHE = "homehub-v2";
const SHELL = ["/dashboard", "/manifest.webmanifest", "/icon-192.svg", "/icon-512.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  const isShell = url.pathname === "/dashboard" || url.pathname === "/";
  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    /\.(svg|png|ico|css|js|woff2?)$/.test(url.pathname);

  if (isShell) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy));
          return res;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match("/dashboard"))
        )
    );
    return;
  }

  if (isStatic) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(event.request, copy));
            return res;
          })
      )
    );
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "HomeHub", body: event.data.text(), url: "/" };
  }

  const options = {
    body: data.body,
    icon: data.icon || "/icon-192.svg",
    badge: data.badge || "/icon-192.svg",
    tag: "homehub-notification",
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: data.url || "/" },
    actions: [
      { action: "open", title: "Öffnen" },
      { action: "close", title: "Schließen" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "HomeHub", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "close") return;

  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
