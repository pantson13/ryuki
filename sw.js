// Ryuki v103: card-box drag mocha audio
const BUILD = "103";
const CACHE_NAME = "ryuki-pwa-v103-cardbox-mocha-drag";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest?v=103",
  "./style.css?v=103",
  "./script.js?v=103",
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
  "./assets/audio/kh1.mp3?av=103",
  "./assets/audio/ydmusic.mp3?av=103",
  "./assets/audio/charu.mp3?av=103",
  "./assets/audio/mocha.mp3?av=103",
  "./assets/audio/chouka.mp3?av=103",
  "./assets/audio/chaka.mp3?av=103",
  "./assets/audio/huagai1.mp3?av=103",
  "./assets/audio/huagai2.mp3?av=103",
  "./assets/audio/j.mp3?av=103",
  "./assets/audio/q.mp3?av=103",
  "./assets/audio/d.mp3?av=103",
  "./assets/audio/l.mp3?av=103",
  "./assets/audio/f.mp3?av=103",
  "./assets/audio/hc.mp3?av=103",
  "./assets/audio/jianjianglin.mp3?av=103",
  "./assets/audio/longjiao.mp3?av=103",
  "./assets/audio/bsj.mp3?av=103",
  "./assets/audio/guo.mp3?av=103",
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
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: "window", includeUncontrolled: true }))
      .then((clients) =>
        Promise.all(
          clients.map((client) => {
            try {
              const url = new URL(client.url);
              if (url.origin !== self.location.origin || url.searchParams.get("appv") === BUILD) return undefined;
              url.searchParams.set("appv", BUILD);
              return client.navigate(url.href);
            } catch {
              return undefined;
            }
          }),
        ),
      ),
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

  // v103：音频使用 Network First。配合 ?av=103 资源版本，覆盖同名 mp3 后不会再随机命中旧媒体缓存。
  if (requestUrl.pathname.includes("/assets/audio/")) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request)),
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
