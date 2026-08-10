/*
 * iPhone 16 Pro Max 参数区
 * 目标画布：440 × 956 CSS px（竖屏）。
 * 坐标仍以 1179 × 2556 原始背景像素为单位，方便直接微调。
 */
const ANIMATION_CONFIG = {
  // 第二阶段：腰带出现到翻转结束。上移不包含在这 5 秒内。
  sequenceDuration: 5,
  move: {
    x: 0,
    y: -950,
    duration: 1.2,
  },
  bg3: {
    x: 0,
    y: -320,
    width: 99,
    height: 100,
    duration: 1.5,
  },
  beltLayers: {
    up: { x: -20, y: 0 },
    down: { x: -25, y: 0 },
  },
  card: {
    start: { x: 0, y: 500 },
    insert: { x: 0, y: 0 },
    width: 485,
    duration: 1.25,
    layers: {
      // kpc：正数向右/向下，width 控制大小（原图宽 437）。
      middle: { x: 0, y: 0, width: 437 },
      // khfg：正数向右/向下，width 控制大小（原图宽 339）。
      glow: { x: 0, y: 0, width: 339 },
      // khzd：正数向右/向下，width 控制大小（原图宽 485）。
      cover: { x: 0, y: 0, width: 485 },
    },
  },
  // ydfg：正数向右/向下，width 控制大小（原图宽 777）。
  beltGlow: { x: -25, y: -80, width: 777 },
};

// 音效文件放在仓库 assets/audio/ 下；如文件格式不同，只改这里即可。
const AUDIO_CONFIG = {
  kh1: "./assets/audio/kh1.mp3",
  kh2: "./assets/audio/kh2.mp3",
};

const PHONE_VIEWPORT = { width: 440, height: 956 };
const SOURCE_SCENE = { width: 1179, height: 2556 };
const SOURCE_BELT_WIDTH = 1115;
const WATER_PHASE_RATIO = 0.2;

const scene = document.querySelector("#scene");
const belt = document.querySelector("#belt");
const cardBox = document.querySelector("#cardBox");
const cardTrigger = document.querySelector("#cardTrigger");
const sceneImages = [...scene.querySelectorAll("img")];
const waterNoise = document.querySelector("#waterNoise");
const waterDisplacement = document.querySelector("#waterDisplacement");

let rippleAnimationFrame = 0;
let sceneTimers = [];
let flowStarted = false;
let kh2InUse = false;

const kh1Audio = new Audio(AUDIO_CONFIG.kh1);
const kh2Audio = new Audio(AUDIO_CONFIG.kh2);
kh1Audio.preload = "auto";
kh2Audio.preload = "auto";

function applyPhoneLayout() {
  // scene 始终保持 iPhone 16 Pro Max 的 440:956 比例。
  // 前景与 object-fit: cover 背景共用同一缩放值，避免 Safari 上错位。
  const targetRatio = PHONE_VIEWPORT.width / PHONE_VIEWPORT.height;
  const currentRatio = scene.clientWidth / scene.clientHeight;

  if (Math.abs(currentRatio - targetRatio) > 0.002) {
    console.warn("当前画布比例偏离 iPhone 16 Pro Max：", currentRatio);
  }

  const scale = Math.max(
    scene.clientWidth / SOURCE_SCENE.width,
    scene.clientHeight / SOURCE_SCENE.height,
  );

  const { sequenceDuration, move, bg3, beltLayers, card, beltGlow } = ANIMATION_CONFIG;

  scene.style.setProperty("--belt-width", `${SOURCE_BELT_WIDTH * scale}px`);
  scene.style.setProperty("--final-x", `${move.x * scale}px`);
  scene.style.setProperty("--final-y", `${move.y * scale}px`);
  scene.style.setProperty("--bg3-x", `${bg3.x * scale}px`);
  scene.style.setProperty("--bg3-y", `${bg3.y * scale}px`);
  scene.style.setProperty("--bg3-width", `${bg3.width}%`);
  scene.style.setProperty("--bg3-height-scale", String(bg3.height / 100));
  scene.style.setProperty("--bg3-duration", `${bg3.duration}s`);
  scene.style.setProperty("--card-start-x", `${card.start.x * scale}px`);
  scene.style.setProperty("--card-start-y", `${card.start.y * scale}px`);
  // 内层卡盒在腰带上移后接棒；减去 move 可让接棒前后保持同一屏幕坐标。
  scene.style.setProperty("--card-nested-start-x", `${(card.start.x - move.x) * scale}px`);
  scene.style.setProperty("--card-nested-start-y", `${(card.start.y - move.y) * scale}px`);
  scene.style.setProperty("--card-insert-x", `${card.insert.x * scale}px`);
  scene.style.setProperty("--card-insert-y", `${card.insert.y * scale}px`);
  scene.style.setProperty("--card-width", `${card.width * scale}px`);
  scene.style.setProperty("--card-insert-duration", `${card.duration}s`);
  scene.style.setProperty("--kpc-x", `${card.layers.middle.x * scale}px`);
  scene.style.setProperty("--kpc-y", `${card.layers.middle.y * scale}px`);
  scene.style.setProperty("--kpc-width", `${card.layers.middle.width * scale}px`);
  scene.style.setProperty("--khfg-x", `${card.layers.glow.x * scale}px`);
  scene.style.setProperty("--khfg-y", `${card.layers.glow.y * scale}px`);
  scene.style.setProperty("--khfg-width", `${card.layers.glow.width * scale}px`);
  scene.style.setProperty("--khzd-x", `${card.layers.cover.x * scale}px`);
  scene.style.setProperty("--khzd-y", `${card.layers.cover.y * scale}px`);
  scene.style.setProperty("--khzd-width", `${card.layers.cover.width * scale}px`);
  scene.style.setProperty("--ydfg-x", `${beltGlow.x * scale}px`);
  scene.style.setProperty("--ydfg-y", `${beltGlow.y * scale}px`);
  scene.style.setProperty("--ydfg-width", `${beltGlow.width * scale}px`);

  belt.style.setProperty("--sequence-duration", `${sequenceDuration}s`);
  belt.style.setProperty("--move-x", `${move.x * scale}px`);
  belt.style.setProperty("--move-y", `${move.y * scale}px`);
  belt.style.setProperty("--move-duration", `${move.duration}s`);
  belt.style.setProperty("--up-x", `${beltLayers.up.x * scale}px`);
  belt.style.setProperty("--up-y", `${beltLayers.up.y * scale}px`);
  belt.style.setProperty("--down-x", `${beltLayers.down.x * scale}px`);
  belt.style.setProperty("--down-y", `${beltLayers.down.y * scale}px`);
}

function runWaterRipple(startTime) {
  const waterPhaseDuration = ANIMATION_CONFIG.sequenceDuration * WATER_PHASE_RATIO * 1000;

  function update(now) {
    const progress = Math.min(1, (now - startTime) / waterPhaseDuration);
    const fade = 1 - progress;
    const pulse = 0.72 + Math.sin(progress * Math.PI * 10) * 0.28;
    const strength = Math.max(0, 30 * fade * pulse);
    const horizontalFrequency = 0.007 + Math.sin(progress * Math.PI * 5) * 0.0022;
    const verticalFrequency = 0.023 + Math.cos(progress * Math.PI * 6) * 0.006;

    waterDisplacement.setAttribute("scale", strength.toFixed(2));
    waterNoise.setAttribute(
      "baseFrequency",
      `${horizontalFrequency.toFixed(4)} ${verticalFrequency.toFixed(4)}`,
    );

    if (progress < 1 && belt.classList.contains("is-stage-two")) {
      rippleAnimationFrame = requestAnimationFrame(update);
    } else {
      waterDisplacement.setAttribute("scale", "0");
    }
  }

  rippleAnimationFrame = requestAnimationFrame(update);
}

function clearSceneTimers() {
  sceneTimers.forEach((timer) => clearTimeout(timer));
  sceneTimers = [];
}

function stopAudio(audio) {
  audio.pause();
  try {
    audio.currentTime = 0;
  } catch {
    // Safari 在音频元数据尚未载入时可能不允许设置 currentTime。
  }
}

function playAudio(audio) {
  stopAudio(audio);
  const playPromise = audio.play();
  return playPromise instanceof Promise ? playPromise : Promise.resolve();
}

function primeKh2Audio() {
  kh2InUse = false;
  kh2Audio.muted = true;
  const playPromise = kh2Audio.play();

  if (!(playPromise instanceof Promise)) {
    kh2Audio.pause();
    kh2Audio.currentTime = 0;
    kh2Audio.muted = false;
    return;
  }

  playPromise
    .then(() => {
      if (!kh2InUse) {
        kh2Audio.pause();
        kh2Audio.currentTime = 0;
      }
      kh2Audio.muted = false;
    })
    .catch(() => {
      kh2Audio.muted = false;
    });
}

function resetToCard() {
  clearSceneTimers();
  cancelAnimationFrame(rippleAnimationFrame);
  waterDisplacement.setAttribute("scale", "0");
  stopAudio(kh1Audio);
  stopAudio(kh2Audio);
  kh2InUse = false;
  flowStarted = false;

  scene.classList.add("is-resetting");
  scene.classList.remove("show-final-background", "show-bg3");
  belt.classList.remove("is-ready", "is-stage-two", "is-moving", "is-card-powered");
  cardBox.classList.remove("is-handoff", "is-inserting", "is-inserted");
  cardTrigger.classList.remove("is-waiting", "is-hidden");
  void scene.offsetWidth;
  scene.classList.remove("is-resetting");
  cardTrigger.classList.add("is-ready");
}

function insertCard() {
  // 外层卡盒与腰带内部卡盒在同一屏幕位置无缝接棒，之后才向插槽移动。
  cardTrigger.classList.remove("is-waiting");
  cardTrigger.classList.add("is-hidden");
  cardBox.classList.add("is-handoff");
  void cardBox.offsetWidth;
  cardBox.classList.remove("is-handoff");
  cardBox.classList.add("is-inserting");

  sceneTimers.push(
    setTimeout(() => {
      cardBox.classList.remove("is-inserting");
      cardBox.classList.add("is-inserted");
      belt.classList.add("is-card-powered");
    }, ANIMATION_CONFIG.card.duration * 1000),
  );
}

function startStageTwo() {
  if (!flowStarted) return;

  // kh2 与第二阶段从同一帧开始。
  kh2InUse = true;
  kh2Audio.muted = false;
  playAudio(kh2Audio).catch((error) => {
    console.warn("kh2 音效播放失败：", error);
  });

  belt.classList.add("is-ready", "is-stage-two");
  runWaterRipple(performance.now());

  const { sequenceDuration, move } = ANIMATION_CONFIG;
  sceneTimers.push(
    setTimeout(() => {
      // 第二阶段结束后，才单独执行腰带上移。
      belt.classList.add("is-moving");

      sceneTimers.push(
        setTimeout(() => {
          scene.classList.add("show-final-background");
          insertCard();
        }, move.duration * 1000),
      );
    }, sequenceDuration * 1000),
  );
}

function startFromCard(event) {
  event?.stopPropagation();
  if (flowStarted || !cardTrigger.classList.contains("is-ready")) {
    return;
  }

  flowStarted = true;
  cardTrigger.classList.remove("is-ready");
  cardTrigger.classList.add("is-waiting");

  // 在 iPhone 的真实点击手势中预解锁 kh2，确保 kh1 播放完后仍能自动播放。
  primeKh2Audio();

  let stageStarted = false;
  const beginStageOnce = () => {
    if (stageStarted) return;
    stageStarted = true;
    startStageTwo();
  };

  kh1Audio.addEventListener("ended", beginStageOnce, { once: true });
  kh1Audio.addEventListener("error", beginStageOnce, { once: true });

  playAudio(kh1Audio).catch((error) => {
    console.warn("kh1 音效播放失败：", error);
    beginStageOnce();
  });
}

async function waitForSceneImages() {
  await Promise.all(
    sceneImages.map((image) => {
      if (image.complete) return Promise.resolve();
      return new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    }),
  );
}

waitForSceneImages().then(() => {
  applyPhoneLayout();
  requestAnimationFrame(resetToCard);
});

cardTrigger.addEventListener("click", startFromCard);
belt.addEventListener("click", (event) => {
  if (event.target.closest("#cardBox")) return;
  resetToCard();
});
belt.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  resetToCard();
});
window.addEventListener("resize", applyPhoneLayout);
window.visualViewport?.addEventListener("resize", applyPhoneLayout);
applyPhoneLayout();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("PWA 离线服务注册失败：", error);
    });
  });
}
