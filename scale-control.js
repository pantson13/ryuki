/*
 * Ryuki 缩放参数
 *
 * global = 总缩放倍率
 * 1.0 = 当前尺寸
 * 0.9 = 当前尺寸的 90%
 * 1.1 = 当前尺寸的 110%
 *
 * 最终实际倍率 = global × 单项倍率
 *
 * 平时如果只是想全部一起缩放，只改 global 即可。
 * 单项倍率默认保持 1.0，需要单独微调某一项时再改对应参数。
 */
const RYUKI_SCALE_CONFIG = {
  global: 1.0,     // 总缩放：一次控制下面所有项目

  belt: 1.0,       // 腰带整体视觉：ydbg / ydup / yddown / ydfg
  cardBox: 1.0,    // 卡盒：初始卡盒 + 插入腰带后的卡盒
  bg3: 1.0,        // 最终 bg3
  bg4: 1.0,        // 四张 bg4
  bg5: 1.0,        // 闪现 bg5
  auxDevice: 1.0,  // 龙召机 / 蛇杖整体
};

function clampScale(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 1;
  return Math.min(3, Math.max(0.1, number));
}

function applyRyukiScaleConfig(nextConfig = null) {
  if (nextConfig && typeof nextConfig === "object") {
    Object.assign(RYUKI_SCALE_CONFIG, nextConfig);
  }

  const scene = document.getElementById("scene");
  if (!scene) return;

  const globalScale = clampScale(RYUKI_SCALE_CONFIG.global);

  const mapping = {
    belt: "--ryuki-belt-scale",
    cardBox: "--ryuki-card-box-scale",
    bg3: "--ryuki-bg3-scale",
    bg4: "--ryuki-bg4-scale",
    bg5: "--ryuki-bg5-scale",
    auxDevice: "--ryuki-aux-device-scale",
  };

  for (const [key, cssVariable] of Object.entries(mapping)) {
    const itemScale = clampScale(RYUKI_SCALE_CONFIG[key]);
    const finalScale = globalScale * itemScale;
    scene.style.setProperty(cssVariable, String(finalScale));
  }
}

/*
 * 临时调试示例：
 *
 * 全部一起缩到 90%：
 * applyRyukiScaleConfig({ global: 0.9 });
 *
 * 全部 90%，但 bg4 再放大 10%：
 * applyRyukiScaleConfig({ global: 0.9, bg4: 1.1 });
 *
 * 刷新页面后仍以文件顶部的 RYUKI_SCALE_CONFIG 为准。
 */
window.RYUKI_SCALE_CONFIG = RYUKI_SCALE_CONFIG;
window.applyRyukiScaleConfig = applyRyukiScaleConfig;

applyRyukiScaleConfig();

/*
 * AN2：复用 OUJA 的短按 / 长按判定。
 * - 短按：继续交给原 script.js 的 click 逻辑播放 jianji。
 * - 长按满 1 秒：播放 jianji2，并拦截松手后的 click，避免同时播放 jianji。
 * - 移动超过 12px 取消长按，避免拖动手势误触。
 */
const an2Button = document.getElementById("centerActionButton2");
const jianji2Audio = new Audio("./assets/audio/jianji2.mp3");
jianji2Audio.preload = "auto";
jianji2Audio.load();

const JIANJI2_LONG_PRESS_MS = 1000;
const JIANJI2_MOVE_CANCEL_PX = 12;
let jianji2LongPressTimer = 0;
let jianji2PressPointerId = null;
let jianji2PressStart = null;
let jianji2LongPressTriggered = false;
let suppressNextJianjiClick = false;

function clearJianji2LongPressTimer() {
  clearTimeout(jianji2LongPressTimer);
  jianji2LongPressTimer = 0;
}

an2Button?.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) return;

  clearJianji2LongPressTimer();
  jianji2PressPointerId = event.pointerId;
  jianji2PressStart = { x: event.clientX, y: event.clientY };
  jianji2LongPressTriggered = false;

  if (typeof primeAudio === "function") {
    primeAudio(jianji2Audio, () => false).catch(() => undefined);
  }

  an2Button?.setPointerCapture?.(event.pointerId);

  jianji2LongPressTimer = window.setTimeout(() => {
    if (jianji2PressPointerId !== event.pointerId) return;

    jianji2LongPressTriggered = true;
    suppressNextJianjiClick = true;
    jianji2Audio.muted = false;

    if (typeof playAudio === "function") {
      playAudio(jianji2Audio).catch((error) => {
        console.warn("jianji2 长按音效播放失败：", error);
      });
    } else {
      jianji2Audio.currentTime = 0;
      jianji2Audio.play().catch((error) => {
        console.warn("jianji2 长按音效播放失败：", error);
      });
    }
  }, JIANJI2_LONG_PRESS_MS);
});

an2Button?.addEventListener("pointermove", (event) => {
  if (
    event.pointerId !== jianji2PressPointerId ||
    !jianji2PressStart ||
    jianji2LongPressTriggered
  ) return;

  const dx = event.clientX - jianji2PressStart.x;
  const dy = event.clientY - jianji2PressStart.y;
  if (Math.hypot(dx, dy) > JIANJI2_MOVE_CANCEL_PX) {
    clearJianji2LongPressTimer();
  }
});

an2Button?.addEventListener("pointerup", (event) => {
  if (event.pointerId !== jianji2PressPointerId) return;

  clearJianji2LongPressTimer();
  jianji2PressPointerId = null;
  jianji2PressStart = null;
});

an2Button?.addEventListener("pointercancel", (event) => {
  if (event.pointerId !== jianji2PressPointerId) return;

  clearJianji2LongPressTimer();
  jianji2PressPointerId = null;
  jianji2PressStart = null;
  jianji2LongPressTriggered = false;
});

an2Button?.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

an2Button?.addEventListener("click", (event) => {
  if (!suppressNextJianjiClick) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  suppressNextJianjiClick = false;
  jianji2LongPressTriggered = false;
}, true);

/*
 * AN5：完全改为独立 Web Audio Buffer 播放。
 *
 * 旧实现把 script.js 的 HTMLAudio guoAudio 接到 MediaElementSource + GainNode。
 * iPhone Safari/PWA 在媒体元素 seek/pause 与 GainNode 恢复增益交界处会出现瞬时回弹、
 * 单采样卡住或第一次播放前的短促杂音。
 *
 * 现在 AN5 的 click 在 capture 阶段直接拦截原 script.js 的 guoAudio click，
 * 短按和长按都只操作同一套 AudioBufferSourceNode + GainNode：
 * - 短按：从头正常播放 guo。
 * - 长按满 1 秒：当前 GainNode 在 1.2 秒内线性降到 0.0001，然后 stop 当前 source。
 * - 淡出节点结束后直接销毁，不恢复旧节点增益，因此不会在结尾突然回响或卡一个音。
 */
const an5Button = document.querySelector(".side-control-button");
const AN5_LONG_PRESS_MS = 1000;
const AN5_MOVE_CANCEL_PX = 12;
const GUO_FADE_OUT_MS = 1200;
const GUO_FADE_MIN_GAIN = 0.0001;
const GUO_AUDIO_URL = "./assets/audio/guo.mp3";

let an5LongPressTimer = 0;
let an5PressPointerId = null;
let an5PressStart = null;
let an5LongPressTriggered = false;
let suppressNextGuoClick = false;

let guoWebAudioContext = null;
let guoWebAudioBuffer = null;
let guoWebAudioDecodePromise = null;
let guoWebAudioSource = null;
let guoWebAudioGain = null;
let guoWebAudioStopTimer = 0;
let guoPlaybackToken = 0;

function clearAn5LongPressTimer() {
  clearTimeout(an5LongPressTimer);
  an5LongPressTimer = 0;
}

function getGuoWebAudioContext() {
  if (guoWebAudioContext) return guoWebAudioContext;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;

  try {
    guoWebAudioContext = new AudioContextCtor();
  } catch (error) {
    console.warn("guo AudioContext 创建失败：", error);
    guoWebAudioContext = null;
  }
  return guoWebAudioContext;
}

function decodeGuoWebAudio() {
  if (guoWebAudioBuffer) return Promise.resolve(guoWebAudioBuffer);
  if (guoWebAudioDecodePromise) return guoWebAudioDecodePromise;

  const context = getGuoWebAudioContext();
  if (!context) return Promise.resolve(null);

  guoWebAudioDecodePromise = fetch(GUO_AUDIO_URL, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`guo fetch ${response.status}`);
      return response.arrayBuffer();
    })
    .then((bytes) => new Promise((resolve, reject) => {
      context.decodeAudioData(bytes.slice(0), resolve, reject);
    }))
    .then((buffer) => {
      guoWebAudioBuffer = buffer;
      return buffer;
    })
    .catch((error) => {
      console.warn("guo Web Audio 解码失败：", error);
      guoWebAudioDecodePromise = null;
      return null;
    });

  return guoWebAudioDecodePromise;
}

async function prepareGuoWebAudioFromGesture() {
  const context = getGuoWebAudioContext();
  if (!context) return false;

  try {
    if (context.state === "suspended") await context.resume();
  } catch (error) {
    console.warn("guo AudioContext resume 失败：", error);
    return false;
  }

  await decodeGuoWebAudio();
  return Boolean(guoWebAudioBuffer && context.state === "running");
}

function disposeCurrentGuoSource({ stop = true } = {}) {
  clearTimeout(guoWebAudioStopTimer);
  guoWebAudioStopTimer = 0;

  const source = guoWebAudioSource;
  const gain = guoWebAudioGain;
  guoWebAudioSource = null;
  guoWebAudioGain = null;

  if (source) {
    source.onended = null;
    if (stop) {
      try { source.stop(); } catch {}
    }
    try { source.disconnect(); } catch {}
  }
  if (gain) {
    try { gain.disconnect(); } catch {}
  }
}

async function playGuoWebAudio() {
  const token = ++guoPlaybackToken;
  const ready = await prepareGuoWebAudioFromGesture();
  if (!ready || token !== guoPlaybackToken) return false;

  const context = guoWebAudioContext;
  const buffer = guoWebAudioBuffer;
  if (!context || !buffer || context.state !== "running") return false;

  disposeCurrentGuoSource();

  try {
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(1, context.currentTime);
    source.connect(gain);
    gain.connect(context.destination);

    source.onended = () => {
      if (guoWebAudioSource !== source) return;
      guoWebAudioSource = null;
      guoWebAudioGain = null;
      try { source.disconnect(); } catch {}
      try { gain.disconnect(); } catch {}
    };

    guoWebAudioSource = source;
    guoWebAudioGain = gain;
    source.start(0);
    return true;
  } catch (error) {
    console.warn("guo Web Audio 播放失败：", error);
    disposeCurrentGuoSource();
    return false;
  }
}

function fadeOutAndStopGuoWebAudio() {
  const context = guoWebAudioContext;
  const source = guoWebAudioSource;
  const gain = guoWebAudioGain;
  if (!context || !source || !gain || context.state !== "running") return false;

  clearTimeout(guoWebAudioStopTimer);
  const now = context.currentTime;
  const endTime = now + GUO_FADE_OUT_MS / 1000;

  try {
    gain.gain.cancelScheduledValues(now);
    const currentGain = Math.max(GUO_FADE_MIN_GAIN, Number(gain.gain.value) || 1);
    gain.gain.setValueAtTime(currentGain, now);
    gain.gain.linearRampToValueAtTime(GUO_FADE_MIN_GAIN, endTime);
  } catch (error) {
    console.warn("guo 淡出调度失败：", error);
    return false;
  }

  const fadingSource = source;
  const fadingGain = gain;

  guoWebAudioStopTimer = window.setTimeout(() => {
    guoWebAudioStopTimer = 0;

    if (guoWebAudioSource === fadingSource) {
      guoWebAudioSource = null;
      guoWebAudioGain = null;
    }

    fadingSource.onended = null;
    try { fadingSource.stop(); } catch {}
    try { fadingSource.disconnect(); } catch {}
    try { fadingGain.disconnect(); } catch {}
  }, GUO_FADE_OUT_MS + 60);

  return true;
}

// 页面打开后先后台读取/解码；AudioContext 即使仍 suspended 也不影响准备 buffer。
decodeGuoWebAudio().catch(() => undefined);

an5Button?.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) return;

  clearAn5LongPressTimer();
  an5PressPointerId = event.pointerId;
  an5PressStart = { x: event.clientX, y: event.clientY };
  an5LongPressTriggered = false;

  // iPhone/PWA 要在真实手势里恢复 AudioContext。
  prepareGuoWebAudioFromGesture().catch(() => undefined);

  an5Button?.setPointerCapture?.(event.pointerId);

  an5LongPressTimer = window.setTimeout(() => {
    if (an5PressPointerId !== event.pointerId) return;

    an5LongPressTriggered = true;
    suppressNextGuoClick = true;
    fadeOutAndStopGuoWebAudio();
  }, AN5_LONG_PRESS_MS);
});

an5Button?.addEventListener("pointermove", (event) => {
  if (
    event.pointerId !== an5PressPointerId ||
    !an5PressStart ||
    an5LongPressTriggered
  ) return;

  const dx = event.clientX - an5PressStart.x;
  const dy = event.clientY - an5PressStart.y;
  if (Math.hypot(dx, dy) > AN5_MOVE_CANCEL_PX) {
    clearAn5LongPressTimer();
  }
});

an5Button?.addEventListener("pointerup", (event) => {
  if (event.pointerId !== an5PressPointerId) return;

  clearAn5LongPressTimer();
  an5PressPointerId = null;
  an5PressStart = null;
});

an5Button?.addEventListener("pointercancel", (event) => {
  if (event.pointerId !== an5PressPointerId) return;

  clearAn5LongPressTimer();
  an5PressPointerId = null;
  an5PressStart = null;
  an5LongPressTriggered = false;
});

an5Button?.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

// AN5 由这里完全接管，必须在 capture 阶段阻止 script.js 原来的 HTMLAudio guo click。
an5Button?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopImmediatePropagation();

  if (suppressNextGuoClick) {
    suppressNextGuoClick = false;
    an5LongPressTriggered = false;
    return;
  }

  playGuoWebAudio().catch((error) => {
    console.warn("guo 短按播放失败：", error);
  });
}, true);
