/*
 * iPhone 16 Pro Max 参数区
 * 目标画布：440 × 956 CSS px（竖屏）。
 * 坐标仍以 1179 × 2556 原始背景像素为单位，方便直接微调。
 */
const ANIMATION_CONFIG = {
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
    start: { x: 0, y: 1700 },
    insert: { x: 0, y: 0 },
    width: 485,
    duration: 1.25,
  },
};

const PHONE_VIEWPORT = { width: 440, height: 956 };
const SOURCE_SCENE = { width: 1179, height: 2556 };
const SOURCE_BELT_WIDTH = 1115;
const WATER_PHASE_RATIO = 0.2;
const MOVE_START_RATIO = 0.74;
const CARD_READY_DELAY = 0.55;

const scene = document.querySelector("#scene");
const belt = document.querySelector("#belt");
const cardBox = document.querySelector("#cardBox");
const sceneImages = [...scene.querySelectorAll("img")];
const waterNoise = document.querySelector("#waterNoise");
const waterDisplacement = document.querySelector("#waterDisplacement");

let rippleAnimationFrame = 0;
let sceneTimers = [];

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

  const { sequenceDuration, move, bg3, beltLayers, card } = ANIMATION_CONFIG;

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
  scene.style.setProperty("--card-insert-x", `${card.insert.x * scale}px`);
  scene.style.setProperty("--card-insert-y", `${card.insert.y * scale}px`);
  scene.style.setProperty("--card-width", `${card.width * scale}px`);
  scene.style.setProperty("--card-insert-duration", `${card.duration}s`);

  belt.style.setProperty("--sequence-duration", `${sequenceDuration}s`);
  belt.style.setProperty("--move-delay", `${sequenceDuration * MOVE_START_RATIO}s`);
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

    if (progress < 1 && belt.classList.contains("is-sequencing")) {
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

function playSequence() {
  clearSceneTimers();
  cancelAnimationFrame(rippleAnimationFrame);
  waterDisplacement.setAttribute("scale", "30");

  scene.classList.add("is-resetting");
  scene.classList.remove("show-final-background", "show-bg3");
  belt.classList.remove("is-sequencing", "is-card-powered");
  cardBox.classList.remove("is-ready", "is-inserting", "is-inserted");
  void scene.offsetWidth;
  scene.classList.remove("is-resetting");
  belt.classList.add("is-sequencing");
  runWaterRipple(performance.now());

  const { sequenceDuration, move } = ANIMATION_CONFIG;
  const moveEndDelay = (sequenceDuration * MOVE_START_RATIO + move.duration) * 1000;

  sceneTimers.push(
    setTimeout(() => {
      scene.classList.add("show-final-background");
    }, moveEndDelay),
  );
  sceneTimers.push(
    setTimeout(() => {
      cardBox.classList.add("is-ready");
    }, moveEndDelay + CARD_READY_DELAY * 1000),
  );
}

function insertCard(event) {
  event?.stopPropagation();
  if (!cardBox.classList.contains("is-ready") || cardBox.classList.contains("is-inserting")) {
    return;
  }

  cardBox.classList.remove("is-ready");
  cardBox.classList.add("is-inserting");

  sceneTimers.push(
    setTimeout(() => {
      cardBox.classList.remove("is-inserting");
      cardBox.classList.add("is-inserted");
      belt.classList.add("is-card-powered");
    }, ANIMATION_CONFIG.card.duration * 1000),
  );
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
  belt.classList.add("is-ready");
  requestAnimationFrame(playSequence);
});

cardBox.addEventListener("click", insertCard);
belt.addEventListener("click", (event) => {
  if (event.target.closest("#cardBox")) return;
  playSequence();
});
belt.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  playSequence();
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
