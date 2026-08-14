// Ryuki v107: atomic PWA update + fresh critical audio
const BUILD = "107";
const CACHE_NAME = "ryuki-pwa-v107-atomic";
const INDEX_FALLBACK = `./index.html?appv=${BUILD}`;

// 这些文件必须全部成功下载，新版才有资格进入 waiting。
// charu / mocha 被列为关键资源，避免“新 JS + 旧/缺失关键音效”的半版本。
const REQUIRED_ASSETS = [
  INDEX_FALLBACK,
  `./manifest.webmanifest?v=${BUILD}`,
  `./style.css?v=${BUILD}`,
  `./script.js?v=${BUILD}`,
  `./assets/audio/charu.mp3?av=${BUILD}`,
  `./assets/audio/mocha.mp3?av=${BUILD}`,
];

const OPTIONAL_ASSETS = [
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
  `./assets/audio/kh1.mp3?av=${BUILD}`,
  `./assets/audio/ydmusic.mp3?av=${BUILD}`,
  `./assets/audio/chouka.mp3?av=${BUILD}`,
  `./assets/audio/chaka.mp3?av=${BUILD}`,
  `./assets/audio/huagai1.mp3?av=${BUILD}`,
  `./assets/audio/huagai2.mp3?av=${BUILD}`,
  `./assets/audio/j.mp3?av=${BUILD}`,
  `./assets/audio/q.mp3?av=${BUILD}`,
  `./assets/audio/d.mp3?av=${BUILD}`,
  `./assets/audio/l.mp3?av=${BUILD}`,
  `./assets/audio/f.mp3?av=${BUILD}`,
  `./assets/audio/hc.mp3?av=${BUILD}`,
  `./assets/audio/jianjianglin.mp3?av=${BUILD}`,
  `./assets/audio/longjiao.mp3?av=${BUILD}`,
  `./assets/audio/bsj.mp3?av=${BUILD}`,
  `./assets/audio/guo.mp3?av=${BUILD}`,
  `./assets/audio/boxing.mp3?av=${BUILD}`,
  `./assets/audio/jianji.mp3?av=${BUILD}`,
  "./assets/icons/icon-192.png?v=50",
  "./assets/icons/icon-512.png?v=50",
  "./assets/icons/icon-maskable-512.png?v=50",
  "./assets/icons/apple-touch-icon.png?v=50",
];

const scopedUrl = (path) => new URL(path, self.location.href).href;

async function fetchFresh(path) {
  const response = await fetch(scopedUrl(path), { cache: "no-store" });
  if (!response.ok) throw new Error(`${path} -> HTTP ${response.status}`);
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    // 原子核心安装：任何 REQUIRED_ASSETS 失败都会 reject install。旧 SW/旧缓存继续完整运行。
    for (const path of REQUIRED_ASSETS) {
      const response = await fetchFresh(path);
      await cache.put(scopedUrl(path), response);
    }

    // 非关键图片/附加音效允许按需补齐，但绝不影响核心版本一致性。
    await Promise.allSettled(
      OPTIONAL_ASSETS.map(async (path) => {
        const response = await fetchFresh(path);
        await cache.put(scopedUrl(path), response);
      }),
    );

    // 注意：这里故意不 skipWaiting。当前正在运行的旧页面继续由旧 SW 完整控制。
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

function canonicalAudioRequest(request) {
  const url = new URL(request.url);
  // sid 只用于绕过 Safari/媒体对象的会话级旧响应，不让 CacheStorage 生成无限多份。
  url.searchParams.delete("sid");
  return new Request(url.href, { method: "GET" });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;

  // 原子导航：只要当前 SW 仍是激活版本，就只返回它安装时已验证完整的 index。
  // 新版本通过 Service Worker update 在后台安装；完整安装并接管后，下一次 reload 才整体切版。
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cachedIndex = await caches.match(scopedUrl(INDEX_FALLBACK));
      if (cachedIndex) return cachedIndex;

      // 理论上 REQUIRED_ASSETS 保证这里一定命中；仅为首次/异常缓存状态保留网络兜底。
      const response = await fetch(request, { cache: "no-store" });
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(scopedUrl(INDEX_FALLBACK), response.clone());
      }
      return response;
    })());
    return;
  }

  // 音频永远 Network First + no-store。charu 的 sid 请求成功后缓存到 canonical ?av=107 键，
  // 失败时也只回退当前 build 的 canonical 音频，不会跨 build 命中旧缓存。
  if (requestUrl.pathname.includes("/assets/audio/")) {
    const cacheKey = canonicalAudioRequest(request);
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(cacheKey, response.clone());
          }
          return response;
        })
        .catch(() => caches.match(cacheKey)),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request, { cache: "no-store" }).then(async (response) => {
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      });
    }),
  );
});
