// Ryuki v56: PWA/iPhone-first Canvas shatter + repeatable extract/replay/reinsert loop
const CACHE_NAME = "ryuki-pwa-v56-canvas-shatter-loop";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest?v=56",
  "./style.css?v=56",
  "./script.js?v=56",
  "./assets/images/bg.png",
  "./assets/images/bg2.png",
  "./assets/images/bg3.png",
  "./assets/images/bg4.png",
  "./assets/images/bg5.png",
  "./assets/images/lq1.png",
  "./assets/images/lq2.png",
  "./assets/images/lq3.png",
  "./assets/images/lq4.png",
  "./assets/images/lq5.png",
  "./assets/images/lq6.png",
  "./assets/images/ydbg.png",
  "./assets/images/ydup.png",
  "./assets/images/yddown.png",
  "./assets/images/khdc.png",
  "./assets/images/kpc.png",
  "./assets/images/khzd.png",
  "./assets/images/khfg.png",
  "./assets/images/ydfg.png",
  "./assets/audio/chouka.mp3",
  "./assets/icons/icon-192.png?v=50",
  "./assets/icons/icon-512.png?v=50",
  "./assets/icons/icon-maskable-512.png?v=50",
  "./assets/icons/apple-touch-icon.png?v=50"
];

const scopedUrl = (path) => new URL(path, self.location.href).href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // PWA 优先：单个图片/音效暂时缺失时，不允许拖垮整个新版 Service Worker 安装。
      // 否则 iPhone 会继续运行旧缓存，看起来就像“代码明明改了但 PWA 没变化”。
      await Promise.all(
        APP_SHELL.map(async (path) => {
          const url = scopedUrl(path);
          try {
            const response = await fetch(url, { cache: "reload" });
            if (response.ok) await cache.put(url, response);
          } catch {
            // 缺失或暂时离线的资源按需在 fetch 阶段再获取。
          }
        }),
      );
      await self.skipWaiting();
    }),
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
