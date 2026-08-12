// Ryuki v79: PWA-stable KPC drag lifecycle + reliable WebAudio kaca
const CACHE_NAME = "ryuki-pwa-v79-pwa-stable-kpc-drag";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest?v=79",
  "./style.css?v=79",
  "./script.js?v=79",
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
  "./assets/images/bs.png",
  "./assets/images/lzj.png",
  "./assets/images/lzj2.png",
  "./assets/images/lzj3.png",
  "./assets/images/lyfg.png",
  "./assets/images/ydbg.png",
  "./assets/images/ydup.png",
  "./assets/images/yddown.png",
  "./assets/images/khdc.png",
  "./assets/images/kpc.png",
  "./assets/images/khzd.png",
  "./assets/images/khfg.png",
  "./assets/images/ydfg.png",
  "./assets/audio/kh1.mp3",
  "./assets/audio/ydmusic.mp3",
  "./assets/audio/kaca.mp3",
  "./assets/audio/charu.mp3",
  "./assets/audio/chouka.mp3",
  "./assets/audio/huagai1.mp3",
  "./assets/audio/chaka.mp3",
  "./assets/audio/huagai2.mp3",
  "./assets/audio/j.mp3",
  "./assets/audio/q.mp3",
  "./assets/audio/d.mp3",
  "./assets/audio/l.mp3",
  "./assets/audio/f.mp3",
  "./assets/audio/hc.mp3",
  "./assets/audio/guo.mp3",
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
