const CACHE = "brujula-emocional-cache-v4";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./sw.js"
];

// Instala y guarda archivos base
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activa y borra cachés viejos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Manejo de peticiones
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Solo manejar GET
  if (request.method !== "GET") return;

  // Para navegación y página principal: primero red, luego caché
  if (
    request.mode === "navigate" ||
    url.pathname.endsWith("/index.html") ||
    url.pathname === "/" ||
    url.pathname.endsWith("/")
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => {
              cache.put("./index.html", copy);
            });
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            return cached || caches.match("./index.html");
          })
        )
    );
    return;
  }

  // Para manifest: primero red, luego caché
  if (url.pathname.endsWith("/manifest.webmanifest")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => {
              cache.put("./manifest.webmanifest", copy);
            });
          }
          return response;
        })
        .catch(() => caches.match("./manifest.webmanifest"))
    );
    return;
  }

  // Para iconos, svg y otros archivos: caché primero, luego red
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => {
              cache.put(request, copy);
            });
          }
          return response;
        })
        .catch(() => {
          if (url.pathname.endsWith("/icon.svg")) {
            return caches.match("./icon.svg");
          }
        });
    })
  );
});
