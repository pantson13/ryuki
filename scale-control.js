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
 * AN5：短按仍由原 script.js 播放 guo。
 * 长按满 1 秒后通过 Web Audio GainNode 做真正的音量包络淡出。
 *
 * 不能继续使用 HTMLAudioElement.volume 做淡出：iPhone Safari/PWA 对媒体元素的
 * 程序化 volume 调节并不可靠，会出现“前面音量没变，最后 pause 时突然硬切”的现象。
 * 因此这里把 guoAudio 接入 MediaElementSource -> GainNode -> destination，
 * 用 AudioParam 的指数斜坡在 1.2 秒内把增益平滑降到接近 0，之后才 pause + 复位。
 */
const an5Button = document.querySelector(".side-control-button");
const AN5_LONG_PRESS_MS = 1000;
const AN5_MOVE_CANCEL_PX = 12;
const GUO_FADE_OUT_MS = 1200;
const GUO_FADE_MIN_GAIN = 0.001;
let an5LongPressTimer = 0;
let an5PressPointerId = null;
let an5PressStart = null;
let an5LongPressTriggered = false;
let suppressNextGuoClick = false;
let guoFadeStopTimer = 0;
let guoFadeContext = null;
let guoFadeSource = null;
let guoFadeGain = null;

function clearAn5LongPressTimer() {
  clearTimeout(an5LongPressTimer);
  an5LongPressTimer = 0;
}

function ensureGuoFadeGraph() {
  if (typeof guoAudio === "undefined") return null;
  if (guoFadeContext && guoFadeGain) return guoFadeContext;

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;

  try {
    guoFadeContext = new AudioContextCtor();
    guoFadeSource = guoFadeContext.createMediaElementSource(guoAudio);
    guoFadeGain = guoFadeContext.createGain();
    guoFadeGain.gain.value = 1;
    guoFadeSource.connect(guoFadeGain);
    guoFadeGain.connect(guoFadeContext.destination);
    return guoFadeContext;
  } catch (error) {
    console.warn("guo Web Audio 淡出通道创建失败：", error);
    guoFadeContext = null;
    guoFadeSource = null;
    guoFadeGain = null;
    return null;
  }
}

async function resumeGuoFadeGraphFromGesture() {
  const context = ensureGuoFadeGraph();
  if (!context) return false;
  try {
    if (context.state === "suspended") await context.resume();
    return context.state === "running";
  } catch (error) {
    console.warn("guo 淡出 AudioContext resume 失败：", error);
    return false;
  }
}

function cancelGuoFadeAndRestoreGain() {
  clearTimeout(guoFadeStopTimer);
  guoFadeStopTimer = 0;

  if (!guoFadeGain || !guoFadeContext) return;
  const now = guoFadeContext.currentTime;
  try {
    guoFadeGain.gain.cancelScheduledValues(now);
    guoFadeGain.gain.setValueAtTime(1, now);
  } catch {
    guoFadeGain.gain.value = 1;
  }
}

function fadeOutAndStopGuo() {
  if (typeof guoAudio === "undefined" || guoAudio.paused) return;

  const context = ensureGuoFadeGraph();
  if (!context || !guoFadeGain || context.state !== "running") {
    // 理论上 pointerdown 已经解锁 Web Audio。若环境不支持，宁可暂时保留播放，
    // 也不再用 HTMLMediaElement.pause() 制造生硬切断。
    console.warn("guo 淡出通道未就绪，本次不执行硬停止");
    return;
  }

  clearTimeout(guoFadeStopTimer);
  const now = context.currentTime;
  const endTime = now + GUO_FADE_OUT_MS / 1000;
  const currentGain = Math.max(GUO_FADE_MIN_GAIN, guoFadeGain.gain.value || 1);

  try {
    guoFadeGain.gain.cancelScheduledValues(now);
    guoFadeGain.gain.setValueAtTime(currentGain, now);
    guoFadeGain.gain.exponentialRampToValueAtTime(GUO_FADE_MIN_GAIN, endTime);
  } catch (error) {
    console.warn("guo GainNode 淡出调度失败：", error);
    return;
  }

  guoFadeStopTimer = window.setTimeout(() => {
    guoFadeStopTimer = 0;
    guoAudio.pause();
    try {
      guoAudio.currentTime = 0;
    } catch {}

    const resetTime = guoFadeContext?.currentTime || 0;
    try {
      guoFadeGain.gain.cancelScheduledValues(resetTime);
      guoFadeGain.gain.setValueAtTime(1, resetTime);
    } catch {
      guoFadeGain.gain.value = 1;
    }
  }, GUO_FADE_OUT_MS + 40);
}

an5Button?.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) return;

  clearAn5LongPressTimer();
  an5PressPointerId = event.pointerId;
  an5PressStart = { x: event.clientX, y: event.clientY };
  an5LongPressTriggered = false;

  // 必须在真实手势里创建/恢复 AudioContext。这样普通短按开始播放 guo 时，
  // 声音已经经过 GainNode；稍后 1 秒定时器才有资格平滑控制音量。
  resumeGuoFadeGraphFromGesture().catch(() => undefined);

  an5Button?.setPointerCapture?.(event.pointerId);

  an5LongPressTimer = window.setTimeout(() => {
    if (an5PressPointerId !== event.pointerId) return;

    an5LongPressTriggered = true;
    suppressNextGuoClick = true;
    fadeOutAndStopGuo();
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

// capture 阶段先处理长按抑制；普通短按则在原 script.js click 播放前恢复 GainNode。
an5Button?.addEventListener("click", (event) => {
  if (suppressNextGuoClick) {
    event.preventDefault();
    event.stopImmediatePropagation();
    suppressNextGuoClick = false;
    an5LongPressTriggered = false;
    return;
  }

  cancelGuoFadeAndRestoreGain();
}, true);
