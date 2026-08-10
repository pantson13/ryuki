const CACHE_NAME = "ryuki-pwa-v23-ydmusic-audio";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./style.css?v=22",
  "./script.js?v=22",
  "./assets/images/bg.png",
  "./assets/images/bg2.png",
  "./assets/images/bg3.png",
  "./assets/images/ydbg.png",
  "./assets/images/ydup.png",
  "./assets/images/yddown.png",
  "./assets/images/khdc.png",
  "./assets/images/kpc.png",
  "./assets/images/khzd.png",
  "./assets/images/khfg.png",
  "./assets/images/ydfg.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png",
  "./assets/icons/apple-touch-icon.png"
];

const scopedUrl = (path) => new URL(path, self.location.href).href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL.map(scopedUrl)))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(scopedUrl("./index.html"), copy));
          return response;
        })
        .catch(() => caches.match(scopedUrl("./index.html"))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
