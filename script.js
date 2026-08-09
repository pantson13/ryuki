const scene = document.querySelector("#scene");
const belt = document.querySelector("#belt");
const sceneImages = [...scene.querySelectorAll("img")];
const adjustToggle = document.querySelector("#adjustToggle");
const adjustPanel = document.querySelector("#adjustPanel");
const panelClose = document.querySelector("#panelClose");
const resetAdjustments = document.querySelector("#resetAdjustments");
const sequenceDurationInput = document.querySelector("#sequenceDuration");
const previewSequence = document.querySelector("#previewSequence");
const moveXInput = document.querySelector("#moveX");
const moveYInput = document.querySelector("#moveY");
const moveDurationInput = document.querySelector("#moveDuration");
const bg3XInput = document.querySelector("#bg3X");
const bg3YInput = document.querySelector("#bg3Y");
const bg3WidthInput = document.querySelector("#bg3Width");
const bg3HeightInput = document.querySelector("#bg3Height");
const bg3DurationInput = document.querySelector("#bg3Duration");
const waterNoise = document.querySelector("#waterNoise");
const waterDisplacement = document.querySelector("#waterDisplacement");
const OFFSET_STORAGE_KEY = "ryuki_layer_offsets_v2";
const SPEED_STORAGE_KEY = "ryuki_sequence_duration_v1";
const MOVE_STORAGE_KEY = "ryuki_final_position_v1";
const BG3_STORAGE_KEY = "ryuki_bg3_settings_v1";
const BG3_LAYOUT_MIGRATION_KEY = "ryuki_bg3_layout_migration_v15";
const SOURCE_SCENE_WIDTH = 1179;
const SOURCE_SCENE_HEIGHT = 2556;
const SOURCE_BELT_WIDTH = 1115;
const DEFAULT_OFFSETS = { up: { x: -20, y: 0 }, down: { x: -25, y: 0 } };
const DEFAULT_SEQUENCE_DURATION = 5;
const DEFAULT_MOVE = { x: 0, y: -500, duration: 1.2 };
const DEFAULT_BG3 = { x: 0, y: -320, width: 99, height: 100, duration: 1.5 };
const WATER_PHASE_RATIO = 0.2;
const MOVE_START_RATIO = 0.74;
const BACKGROUND_FADE_DURATION = 0.55;

const inputs = {
  up: {
    x: document.querySelector("#upX"),
    y: document.querySelector("#upY"),
  },
  down: {
    x: document.querySelector("#downX"),
    y: document.querySelector("#downY"),
  },
};

let offsets = loadOffsets();
let sequenceDuration = loadSequenceDuration();
let move = loadMove();
let bg3 = loadBg3();
let rippleAnimationFrame = 0;
let sceneTimers = [];

function loadOffsets() {
  const defaults = structuredClone(DEFAULT_OFFSETS);

  try {
    const saved = JSON.parse(localStorage.getItem(OFFSET_STORAGE_KEY));
    for (const layer of ["up", "down"]) {
      for (const axis of ["x", "y"]) {
        const value = Number(saved?.[layer]?.[axis]);
        if (Number.isFinite(value)) defaults[layer][axis] = value;
      }
    }
  } catch {
    // 无有效记录时使用默认值。
  }

  return defaults;
}

function loadSequenceDuration() {
  const saved = Number(localStorage.getItem(SPEED_STORAGE_KEY));
  return Number.isFinite(saved) && saved >= 1.5 && saved <= 20
    ? saved
    : DEFAULT_SEQUENCE_DURATION;
}

function loadMove() {
  const defaults = { ...DEFAULT_MOVE };

  try {
    const saved = JSON.parse(localStorage.getItem(MOVE_STORAGE_KEY));
    const x = Number(saved?.x);
    const y = Number(saved?.y);
    const duration = Number(saved?.duration);
    if (Number.isFinite(x)) defaults.x = Math.round(x);
    if (Number.isFinite(y)) defaults.y = Math.round(y);
    if (Number.isFinite(duration) && duration >= 0.2 && duration <= 10) {
      defaults.duration = Math.round(duration * 10) / 10;
    }

  } catch {
    // 无有效记录时使用默认值。
  }

  return defaults;
}

function loadBg3() {
  const defaults = { ...DEFAULT_BG3 };

  try {
    const saved = JSON.parse(localStorage.getItem(BG3_STORAGE_KEY));
    const x = Number(saved?.x);
    const y = Number(saved?.y);
    const width = Number(saved?.width);
    const height = Number(saved?.height);
    const duration = Number(saved?.duration);
    if (Number.isFinite(x)) defaults.x = Math.round(x);
    if (Number.isFinite(y)) defaults.y = Math.round(y);
    if (Number.isFinite(width) && width >= 20 && width <= 200) {
      defaults.width = Math.round(width);
    }
    if (Number.isFinite(height) && height >= 20 && height <= 300) {
      defaults.height = Math.round(height);
    }
    if (Number.isFinite(duration) && duration >= 0.2 && duration <= 10) {
      defaults.duration = Math.round(duration * 10) / 10;
    }

    if (localStorage.getItem(BG3_LAYOUT_MIGRATION_KEY) !== "done") {
      defaults.x = DEFAULT_BG3.x;
      defaults.y = DEFAULT_BG3.y;
      defaults.width = DEFAULT_BG3.width;
      defaults.height = DEFAULT_BG3.height;
      localStorage.setItem(BG3_LAYOUT_MIGRATION_KEY, "done");
    }
  } catch {
    // 无有效记录时使用默认值。
  }

  return defaults;
}

function applyOffsets() {
  // 背景使用 object-fit: cover；所有前景层必须使用完全相同的 cover 缩放比。
  // 这样 Safari 地址栏、安全区或不同屏幕比例只会改变统一画布的裁切，
  // 不会让腰带和 bg3 分别按不同基准缩放而错位。
  const scale = Math.max(
    scene.clientWidth / SOURCE_SCENE_WIDTH,
    scene.clientHeight / SOURCE_SCENE_HEIGHT,
  );
  scene.style.setProperty("--belt-width", `${SOURCE_BELT_WIDTH * scale}px`);

  belt.style.setProperty("--up-x", `${offsets.up.x * scale}px`);
  belt.style.setProperty("--up-y", `${offsets.up.y * scale}px`);
  belt.style.setProperty("--down-x", `${offsets.down.x * scale}px`);
  belt.style.setProperty("--down-y", `${offsets.down.y * scale}px`);

  for (const layer of ["up", "down"]) {
    for (const axis of ["x", "y"]) {
      inputs[layer][axis].value = offsets[layer][axis];
    }
  }

  belt.style.setProperty("--sequence-duration", `${sequenceDuration}s`);
  belt.style.setProperty("--move-delay", `${sequenceDuration * MOVE_START_RATIO}s`);
  belt.style.setProperty("--move-x", `${move.x * scale}px`);
  belt.style.setProperty("--move-y", `${move.y * scale}px`);
  belt.style.setProperty("--move-duration", `${move.duration}s`);
  scene.style.setProperty("--final-x", `${move.x * scale}px`);
  scene.style.setProperty("--final-y", `${move.y * scale}px`);
  scene.style.setProperty("--bg3-x", `${bg3.x * scale}px`);
  scene.style.setProperty("--bg3-y", `${bg3.y * scale}px`);
  scene.style.setProperty("--bg3-width", `${bg3.width}%`);
  scene.style.setProperty("--bg3-height-scale", String(bg3.height / 100));
  scene.style.setProperty("--bg3-duration", `${bg3.duration}s`);
  sequenceDurationInput.value = sequenceDuration;
  moveXInput.value = move.x;
  moveYInput.value = move.y;
  moveDurationInput.value = move.duration;
  bg3XInput.value = bg3.x;
  bg3YInput.value = bg3.y;
  bg3WidthInput.value = bg3.width;
  bg3HeightInput.value = bg3.height;
  bg3DurationInput.value = bg3.duration;
}

function saveOffsets() {
  localStorage.setItem(OFFSET_STORAGE_KEY, JSON.stringify(offsets));
}

function setOffset(layer, axis, value) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) return;
  offsets[layer][axis] = Math.round(nextValue);
  applyOffsets();
  saveOffsets();
}

function setSequenceDuration(value, replay = true) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) return;

  sequenceDuration = Math.min(20, Math.max(1.5, Math.round(nextValue * 10) / 10));
  belt.style.setProperty("--sequence-duration", `${sequenceDuration}s`);
  belt.style.setProperty("--move-delay", `${sequenceDuration * MOVE_START_RATIO}s`);
  sequenceDurationInput.value = sequenceDuration;
  localStorage.setItem(SPEED_STORAGE_KEY, String(sequenceDuration));

  if (replay) playSequence();
}

function saveMove() {
  localStorage.setItem(MOVE_STORAGE_KEY, JSON.stringify(move));
}

function setMoveAxis(axis, value) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) return;

  move[axis] = Math.round(nextValue);
  applyOffsets();
  saveMove();
}

function setMoveDuration(value, replay = true) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) return;

  move.duration = Math.min(10, Math.max(0.2, Math.round(nextValue * 10) / 10));
  applyOffsets();
  saveMove();

  if (replay) playSequence();
}

function saveBg3() {
  localStorage.setItem(BG3_STORAGE_KEY, JSON.stringify(bg3));
}

function setBg3Axis(axis, value) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) return;

  bg3[axis] = Math.round(nextValue);
  applyOffsets();
  saveBg3();
}

function setBg3Width(value) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) return;

  bg3.width = Math.min(200, Math.max(20, Math.round(nextValue)));
  applyOffsets();
  saveBg3();
}

function setBg3Height(value) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) return;

  bg3.height = Math.min(300, Math.max(20, Math.round(nextValue)));
  applyOffsets();
  saveBg3();
}

function setBg3Duration(value, replay = true) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) return;

  bg3.duration = Math.min(10, Math.max(0.2, Math.round(nextValue * 10) / 10));
  applyOffsets();
  saveBg3();

  if (replay) playSequence();
}

function setPanelOpen(open) {
  adjustPanel.hidden = !open;
  adjustToggle.setAttribute("aria-expanded", String(open));
  adjustToggle.textContent = open ? "收起调整" : "调整动画";
}

function runWaterRipple(startTime) {
  const waterPhaseDuration = sequenceDuration * WATER_PHASE_RATIO * 1000;

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
  belt.classList.remove("is-sequencing");
  void scene.offsetWidth;
  scene.classList.remove("is-resetting");
  belt.classList.add("is-sequencing");
  runWaterRipple(performance.now());

  const moveEndDelay = (sequenceDuration * MOVE_START_RATIO + move.duration) * 1000;
  sceneTimers.push(
    setTimeout(() => {
      scene.classList.add("show-final-background");
    }, moveEndDelay),
  );
  sceneTimers.push(
    setTimeout(() => {
      scene.classList.add("show-bg3");
    }, moveEndDelay + BACKGROUND_FADE_DURATION * 1000),
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
  belt.classList.add("is-ready");
  requestAnimationFrame(playSequence);
});
belt.addEventListener("click", playSequence);

for (const layer of ["up", "down"]) {
  for (const axis of ["x", "y"]) {
    inputs[layer][axis].addEventListener("input", (event) => {
      setOffset(layer, axis, event.currentTarget.value);
    });
  }
}

document.querySelectorAll("[data-layer][data-axis][data-step]").forEach((button) => {
  button.addEventListener("click", () => {
    const { layer, axis } = button.dataset;
    setOffset(layer, axis, offsets[layer][axis] + Number(button.dataset.step));
  });
});

sequenceDurationInput.addEventListener("change", (event) => {
  setSequenceDuration(event.currentTarget.value);
});

document.querySelectorAll("[data-speed-step]").forEach((button) => {
  button.addEventListener("click", () => {
    setSequenceDuration(sequenceDuration + Number(button.dataset.speedStep));
  });
});

moveXInput.addEventListener("input", (event) => {
  setMoveAxis("x", event.currentTarget.value);
});

moveYInput.addEventListener("input", (event) => {
  setMoveAxis("y", event.currentTarget.value);
});

document.querySelectorAll("[data-move-axis][data-move-step]").forEach((button) => {
  button.addEventListener("click", () => {
    setMoveAxis(button.dataset.moveAxis, move[button.dataset.moveAxis] + Number(button.dataset.moveStep));
  });
});

moveDurationInput.addEventListener("change", (event) => {
  setMoveDuration(event.currentTarget.value);
});

document.querySelectorAll("[data-move-duration-step]").forEach((button) => {
  button.addEventListener("click", () => {
    setMoveDuration(move.duration + Number(button.dataset.moveDurationStep));
  });
});

bg3XInput.addEventListener("input", (event) => {
  setBg3Axis("x", event.currentTarget.value);
});

bg3YInput.addEventListener("input", (event) => {
  setBg3Axis("y", event.currentTarget.value);
});

document.querySelectorAll("[data-bg3-axis][data-bg3-step]").forEach((button) => {
  button.addEventListener("click", () => {
    setBg3Axis(button.dataset.bg3Axis, bg3[button.dataset.bg3Axis] + Number(button.dataset.bg3Step));
  });
});

bg3WidthInput.addEventListener("input", (event) => {
  setBg3Width(event.currentTarget.value);
});

document.querySelectorAll("[data-bg3-width-step]").forEach((button) => {
  button.addEventListener("click", () => {
    setBg3Width(bg3.width + Number(button.dataset.bg3WidthStep));
  });
});

bg3HeightInput.addEventListener("input", (event) => {
  setBg3Height(event.currentTarget.value);
});

document.querySelectorAll("[data-bg3-height-step]").forEach((button) => {
  button.addEventListener("click", () => {
    setBg3Height(bg3.height + Number(button.dataset.bg3HeightStep));
  });
});

bg3DurationInput.addEventListener("change", (event) => {
  setBg3Duration(event.currentTarget.value);
});

document.querySelectorAll("[data-bg3-duration-step]").forEach((button) => {
  button.addEventListener("click", () => {
    setBg3Duration(bg3.duration + Number(button.dataset.bg3DurationStep));
  });
});

previewSequence.addEventListener("click", playSequence);

adjustToggle.addEventListener("click", () => setPanelOpen(adjustPanel.hidden));
panelClose.addEventListener("click", () => setPanelOpen(false));
resetAdjustments.addEventListener("click", () => {
  offsets = structuredClone(DEFAULT_OFFSETS);
  move = { ...DEFAULT_MOVE };
  bg3 = { ...DEFAULT_BG3 };
  applyOffsets();
  saveOffsets();
  saveMove();
  saveBg3();
  playSequence();
});

window.addEventListener("resize", applyOffsets);
window.visualViewport?.addEventListener("resize", applyOffsets);
applyOffsets();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("PWA 离线服务注册失败：", error);
    });
  });
}
