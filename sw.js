// Ryuki v137: atomic core update + Safari stale-PWA escape.
const BUILD = "137";
const CACHE_PREFIX = "ryuki-pwa-";
const CACHE_NAME = "ryuki-pwa-v137-stable";
const INSTALL_CACHE_NAME = `${CACHE_NAME}-install`;
const INDEX_FALLBACK = `./index.html?appv=${BUILD}`;

// 主流程所需文件必须作为同一个完整版本安装成功。
// 任意一项失败，install 直接失败，旧 Service Worker 与旧缓存继续完整运行。
const CURRENT_AUDIO_ASSETS = [
  `./assets/audio/kh1.mp3?av=${BUILD}`,
  `./assets/audio/ydmusic.mp3?av=${BUILD}`,
  `./assets/audio/charu.mp3?av=${BUILD}`,
  `./assets/audio/mocha.mp3?av=${BUILD}`,
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
  `./assets/audio/longquanjianglin.mp3?av=${BUILD}`,
  `./assets/audio/longjiao.mp3?av=${BUILD}`,
  `./assets/audio/bsj.mp3?av=${BUILD}`,
  `./assets/audio/guo.mp3?av=${BUILD}`,
  `./assets/audio/huhuan.mp3?av=${BUILD}`,
  `./assets/audio/jingshijie.mp3?av=${BUILD}`,
  `./assets/audio/timeout.mp3?av=${BUILD}`,
  `./assets/audio/jianji.mp3?av=${BUILD}`,
  `./assets/audio/jiechu.mp3?av=${BUILD}`,
];

const REQUIRED_ASSETS = [
  INDEX_FALLBACK,
  `./manifest.webmanifest?v=${BUILD}`,
  `./style.css?v=${BUILD}`,
  `./script.js?v=${BUILD}`,

  "./assets/images/bg.png",
  "./assets/images/bg2.png",
  "./assets/images/bg3.png",
  "./assets/images/bg4.png",
  "./assets/images/bg5.png",
  "./assets/images/ydbg.png",
  "./assets/images/ydup.png",
  "./assets/images/yddown.png",
  "./assets/images/khdc.png",
  `./assets/images/kpc.png?iv=${BUILD}`,
  `./assets/images/an1.png?iv=${BUILD}`,
  `./assets/images/an2.png?iv=${BUILD}`,
  `./assets/images/an5.png?iv=${BUILD}`,
  `./assets/images/an6.png?iv=${BUILD}`,
  `./assets/images/an7.png?iv=${BUILD}`,
  `./assets/images/an8.png?iv=${BUILD}`,
  "./assets/images/khzd.png",
  "./assets/images/khfg.png",
  "./assets/images/ydfg.png",

  ...CURRENT_AUDIO_ASSETS,
];

// 非核心图片继续允许按需缓存。boxing.mp3 当前仓库仍不存在，按之前约定继续忽略。
const OPTIONAL_ASSETS = [
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
  `./assets/audio/boxing.mp3?av=${BUILD}`,
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
    // 安装阶段先写独立临时缓存。任何一步失败都会把本 build 的临时/半成品缓存清干净。
    await caches.delete(INSTALL_CACHE_NAME);
    try {
      const installCache = await caches.open(INSTALL_CACHE_NAME);

      for (const path of REQUIRED_ASSETS) {
        const response = await fetchFresh(path);
        await installCache.put(scopedUrl(path), response);
      }

      await Promise.allSettled(
        OPTIONAL_ASSETS.map(async (path) => {
          const response = await fetchFresh(path);
          await installCache.put(scopedUrl(path), response);
        }),
      );

      // 关键资源全部成功后才提交为正式缓存。
      await caches.delete(CACHE_NAME);
      const finalCache = await caches.open(CACHE_NAME);
      const requests = await installCache.keys();
      for (const request of requests) {
        const response = await installCache.match(request);
        if (!response) throw new Error(`install cache missing: ${request.url}`);
        await finalCache.put(request, response);
      }
      await caches.delete(INSTALL_CACHE_NAME);

      // 只有完整 v137 缓存准备完毕后才立即激活。
      // 这一步专门解决 iOS Safari 普通模式长期被旧 v135 waiting/active SW 锁住的问题。
      await self.skipWaiting();
    } catch (error) {
      await Promise.all([
        caches.delete(INSTALL_CACHE_NAME),
        caches.delete(CACHE_NAME),
      ]);
      throw error;
    }
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING" && String(event.data?.build) === BUILD) {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    // 只清理 Ryuki 自己的旧缓存，避免误删同一域名下其他 PWA/页面的 CacheStorage。
    await Promise.all(
      names
        .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
        .map((name) => caches.delete(name)),
    );

    // 不 claim 当前已经打开的旧页面，避免用户正在操作时被新 SW 半途换控制器。
    // 下一次刷新/重新打开时自然进入当前完整 build。
  })());
});

function canonicalRequest(request) {
  const url = new URL(request.url);
  // sid 只用于区分浏览器媒体会话；同一 build 永远映射到安装时已经验证过的 canonical 字节。
  url.searchParams.delete("sid");
  return new Request(url.href, { method: "GET" });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;

  // 页面导航改为 Network First。
  // 在线时永远先取 GitHub Pages 当前 index，避免旧 CacheStorage 永久把 Safari 锁在 appv=135；
  // 离线或网络失败时才回退到当前 build 已验证过的原子缓存。
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request, { cache: "no-store" });
        if (fresh.ok) return fresh;
      } catch {}

      const cachedIndex = await caches.match(scopedUrl(INDEX_FALLBACK));
      if (cachedIndex) return cachedIndex;

      return fetch(request, { cache: "no-store" });
    })());
    return;
  }

  // 带 ?av=BUILD 的音频属于不可变 build 资源：Cache First。
  if (requestUrl.pathname.includes("/assets/audio/") && requestUrl.searchParams.get("av") === BUILD) {
    const cacheKey = canonicalRequest(request);
    event.respondWith((async () => {
      const cached = await caches.match(cacheKey);
      if (cached) return cached;
      const response = await fetch(request, { cache: "no-store" });
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(cacheKey, response.clone());
      }
      return response;
    })());
    return;
  }

  // 其余静态资源继续 Cache First，保持 PWA 离线和音效/图片稳定性。
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request, { cache: "no-store" });
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  })());
});
