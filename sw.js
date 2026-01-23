const CACHE = "mi-app-personal-cache-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./sw.js"
];

self.addEventListener("install", (e)=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate", (e)=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.map(k=> k!==CACHE ? caches.delete(k) : null )))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch", (e)=>{
  e.respondWith(
    caches.match(e.request).then(cached=>{
      return cached || fetch(e.request).then(resp=>{
        const copy = resp.clone();
        caches.open(CACHE).then(c=>c.put(e.request, copy));
        return resp;
      }).catch(()=>cached);
    })
  );
});