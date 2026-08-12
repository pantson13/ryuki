/* Ryuki v80: first-insertion-safe WebAudio kaca pipeline for iPhone PWA */

/*
 * iPhone 16 Pro Max 参数区
 * 目标画布：440 × 956 CSS px（竖屏）。
 * 坐标仍以 1179 × 2556 原始背景像素为单位，方便直接微调。
 */
const ANIMATION_CONFIG = {
  // 第一阶段最长 3 秒；kh1 提前播完时立即进入第二阶段，不再空等。
  firstStageDuration: 3,
  // 第二阶段音效异常时的保底总时长；正常流程以 ydmusic ended 为结束点。
  sequenceDuration: 3.5,
  stageTwo: {
    backHold: 1.5,
    flipDuration: 0.42,
  },
  move: {
    x: 0,
    y: -800,
    duration: 1.2,
  },
  bg3: {
    x: 0,
    y: -320,
    width: 99,
    height: 100,
    duration: 1.5,
  },
  bg4: {
    // 四张 bg4：左/上/右 + 一张从屏幕正前方沿深度方向反转进入；最后向中心汇合。
    spread: 360,
    // 起始位置放到画面外，左右两张从两侧进入，中间一张从上方进入。
    entryDistance: 1400,
    duration: 1.2,
    // charu 播放到 1.00 秒时启动 bg4。
    startTimecode: { seconds: 1, frames: 0, fps: 30 },
  },
  bg5: {
    // bg4 汇合后，bg5 带白色外发光显示 0.5 秒，再切换 bg3。
    duration: 0.5,
  },
  shatter: {
    // 卡盒向右抽出成功时，bg3 + 腰带镜面碎裂并消失。
    duration: 0.72,
  },
  lq: {
    // 六张 lq 在 charu 结束后从界面左侧进入；上排 1/2/3，下排 4/5/6。
    x: -400,
    y: 420,
    cardWidth: 280,
    gapX: 25,
    gapY: 25,
    entryDistance: 420,
    duration: 0.45,
  },
  sideButtons: {
    // 左下角常驻 4 个圆形按钮：x / y 为第一颗按钮中心相对场景中心的位置。
    x: -520,
    y: 420,
    size: 84,
    gap: 20,
  },
  auxDevice: {
    // BS 按钮。x / y / width 可自行调整。
    bs: { x: 560, y: 330, width: 150 },

    // 龙召机整体容器：x / y 为整体基准位置；slideX 为从 BS 弹出的距离。
    container: { x: 0, y: 0, slideX: -610, duration: 0.42 },

    // 第4层（最底层）lzj3：每层都可独立调 x / y / width。
    lzj3: { x: 0, y: 0, width: 630 },

    // 第3层 lzj2：独立调位置与大小。
    lzj2: { x: 0, y: -500, width: 370 },

    // 第2层 lzj：独立调位置与大小；点击后额外向下移动 dropY。
    lzj: { x: 5, y: -410, width: 630, dropY: 210 },

    // 第1层（最上层）lyfg：独立调位置与大小。
    // showForTuning=true：当前先常亮显示，方便你调位置；之后改 false 即恢复隐藏逻辑。
    lyfg: { x: 8, y: -160, width: 500, duration: 1, showForTuning: false },

    // 红框卡槽有效区：相对龙召机容器中心。只有卡片中心进入此区域并松手才算插入成功。
    // 下面默认值按你提供的红框比例估算，可自行微调。
    cardSlot: {
      showDebug: false,
      x: -10,
      y: -380,
      width: 400,
      height: 530,
      // 插入后卡片在槽内的大小与位置。超出 cardSlot 的部分会被裁切，不会穿帮。
      cardX: 0,
      cardY: 18,
      cardWidth: 280,
    },

    // KPC 手动拖出参数：抽出约一半时播放 chouka，完全抽出后才交接为自由拖动。
    kpcDrag: {
      dropHitPadding: 24,
      flipDuration: 0.52,
      // 整张卡右边缘必须完全离开卡盒左边界后才算抽出；可微调额外安全距离。
      fullExtractPadding: 6,
      // 抽出到完整距离的多少比例时播放 chouka；0.5 = 一半。
      choukaTriggerRatio: 0.5,
      // 卡片与红色卡槽至少进入这么多像素，就立即触发 chaka 并切入龙召机内部层级。
      slotEnterThreshold: 8,
      // 翻面成所选卡片正面后的宽度；翻面开始前就先切到这个尺寸，避免“先大后小”。
      flippedWidth: 350,
    },

    // 龙召机弹出期间，下方 lq 区域虚化强度。
    lqBlur: 7,
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
    // charu 完成后，卡盒从腰带内拖出超过这个距离就算抽出成功。
    extract: { threshold: 210 },
    drag: {
      // 先经过腰带右侧的平行位置，再允许插入凹槽。
      parallel: { x: 360, y: -950, toleranceX: 100, toleranceY: 220 },
      // 凹槽中心沿用 move + card.insert，只在此范围内判定插入成功。
      slotTolerance: { x: 140, y: 130 },
    },
    layers: {
      // kpc：正数向右/向下，width 控制大小（原图宽 437）。
      middle: { x: -20, y: 0, width: 437 },
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
  ydmusic: "./assets/audio/ydmusic.mp3",
  kaca: "./assets/audio/kaca.mp3",
  charu: "./assets/audio/charu.mp3",
  chouka: "./assets/audio/chouka.mp3",
  huagai1: "./assets/audio/huagai1.mp3",
  chaka: "./assets/audio/chaka.mp3",
  huagai2: "./assets/audio/huagai2.mp3",
  guo: "./assets/audio/guo.mp3",
  cardVoices: {
    1: "./assets/audio/j.mp3",
    2: "./assets/audio/q.mp3",
    3: "./assets/audio/d.mp3",
    4: "./assets/audio/l.mp3",
    5: "./assets/audio/f.mp3",
    6: "./assets/audio/hc.mp3",
  },
};

const PHONE_VIEWPORT = { width: 440, height: 956 };
const SOURCE_SCENE = { width: 1179, height: 2556 };
const SOURCE_BELT_WIDTH = 1115;
const STAGE_TWO_WAVE_DURATION = 1.5;
// 第二阶段水波位移峰值；v33 为 30，在 iPhone 上过弱。v34 提高至 72。
const WATER_MAX_DISPLACEMENT = 170;

// 镜面碎裂分片：12 个不规则区域覆盖完整画面，不依赖额外图片素材。
const SHATTER_POLYGONS = [
  "polygon(0 0, 28% 0, 25% 28%, 0 38%)",
  "polygon(28% 0, 55% 0, 50% 32%, 25% 28%)",
  "polygon(55% 0, 80% 0, 75% 25%, 50% 32%)",
  "polygon(80% 0, 100% 0, 100% 38%, 75% 25%)",
  "polygon(0 38%, 25% 28%, 30% 62%, 0 68%)",
  "polygon(25% 28%, 50% 32%, 48% 66%, 30% 62%)",
  "polygon(50% 32%, 75% 25%, 70% 62%, 48% 66%)",
  "polygon(75% 25%, 100% 38%, 100% 68%, 70% 62%)",
  "polygon(0 68%, 30% 62%, 26% 100%, 0 100%)",
  "polygon(30% 62%, 48% 66%, 52% 100%, 26% 100%)",
  "polygon(48% 66%, 70% 62%, 76% 100%, 52% 100%)",
  "polygon(70% 62%, 100% 68%, 100% 100%, 76% 100%)",
];

const SHATTER_MOTION = [
  [-110, -75, -17, -28, 18], [-42, -110, 12, 34, -14], [36, -112, -11, -30, 16], [112, -72, 18, 30, -18],
  [-128, -18, 14, -36, 12], [-48, -12, -9, 28, -16], [52, 8, 10, -26, 15], [130, -8, -15, 34, -13],
  [-105, 78, 16, -32, 20], [-38, 105, -12, 26, -18], [44, 108, 13, -28, 16], [108, 76, -18, 34, -20],
];

const scene = document.querySelector("#scene");
const belt = document.querySelector("#belt");
const beltEffect = document.querySelector("#beltEffect");
const cardBox = document.querySelector("#cardBox");
const cardTrigger = document.querySelector("#cardTrigger");
const bg4Center = document.querySelector(".character-merge-center");
const lqPanel = document.querySelector("#lqPanel");
const lqButtons = [...document.querySelectorAll(".lq-card")];
const kpcLayer = document.querySelector("#kpcLayer");
const bsButton = document.querySelector("#bsButton");
const auxDock = document.querySelector("#auxDock");
const lzjButton = document.querySelector("#lzjButton");
const lzjImage = document.querySelector("#lzjImage");
const lzj2Image = document.querySelector("#lzj2Image");
const lzj3Image = document.querySelector("#lzj3Image");
const lzjCardSlotMask = document.querySelector("#lzjCardSlotMask");
const lzjInsertedCard = document.querySelector("#lzjInsertedCard");
const auxTransferCard = document.querySelector("#auxTransferCard");
const auxTransferCardImage = document.querySelector("#auxTransferCardImage");
const auxCardCoverMask = document.querySelector("#auxCardCoverMask");
const cardCoverLayer = cardBox?.querySelector(".card-cover");
const sideButtons = [...document.querySelectorAll(".side-control-button")];
const lyfgImage = document.querySelector("#lyfgImage");
const beltArt = document.querySelector("#beltArt");
const characterReveal = document.querySelector(".character-reveal");
const shatterCanvas = document.querySelector("#shatterCanvas");
const sceneImages = [...scene.querySelectorAll("img")];
const waterNoise = document.querySelector("#waterNoise");
const waterDisplacement = document.querySelector("#waterDisplacement");

let rippleAnimationFrame = 0;
let lastRippleUpdate = 0;
let sceneTimers = [];
let flowStarted = false;
let ydMusicInUse = false;
let insertionAudioInUse = false;
let sceneScale = 1;
let dragReady = false;
let isDragging = false;
let parallelReached = false;
let activePointerId = null;
let stageTwoAudioFallback = 0;
let stageTwoSyncFrame = 0;
let stageTwoFlipFallback = 0;
let stageTwoFinishFallback = 0;
let insertionAudioFallback = 0;
let insertionTimer = 0;
let charuFinished = true;
let bg4MergeStarted = false;
let bg5TransitionTimer = 0;
let shatterCleanupTimer = 0;
let shatterAnimationFrame = 0;
let charuBg4SyncFrame = 0;
let selectedLq = null;
let extractReady = false;
let isExtracting = false;
let extractPointerId = null;
let cardWasExtracted = false;
let extractedStageTwoReplayActive = false;
let reinsertReady = false;
let suppressExtractedCardClick = false;
let externalCardPointerTravel = 0;
let extractPointerStart = { x: 0, y: 0 };
let extractOrigin = { x: 0, y: 0 };
let cardExtractPosition = { x: 0, y: 0 };
let pointerStart = { x: 0, y: 0 };
let dragOrigin = { x: 0, y: 0 };
let cardDragPosition = { x: ANIMATION_CONFIG.card.start.x, y: ANIMATION_CONFIG.card.start.y };
let auxOpen = false;
let auxArmed = false;
let auxCardInserted = false;
let auxKpcDragging = false;
let auxKpcPointerId = null;
let auxKpcPointerStart = { x: 0, y: 0 };
let auxKpcStartPosition = { left: 0, top: 0 };
let auxKpcPosition = { left: 0, top: 0 };
let auxKpcPullX = 0;
let auxKpcPullStartX = 0;
let auxKpcHasBeenPulled = false;
let auxKpcCaptureTarget = null;
let auxKpcFullyExtracted = false;
let auxKpcFlipped = false;
let auxKpcFlipInProgress = false;
let auxKpcExtractStartCenterY = 0;
let auxKpcInitialLeft = 0;
let auxKpcOriginalRect = null;
let auxKpcFullExtractDistance = 0;
let auxKpcSize = { width: 0, height: 0 };
let auxKpcAspectRatio = 1;
let auxDockViewportOrigin = { left: 0, top: 0 };
let auxChoukaPlayed = false;
let auxResultPlayed = false;
let lyfgTimer = 0;

const kh1Audio = new Audio(AUDIO_CONFIG.kh1);
const ydMusicAudio = new Audio(AUDIO_CONFIG.ydmusic);
const kacaAudio = new Audio(AUDIO_CONFIG.kaca);
const charuAudio = new Audio(AUDIO_CONFIG.charu);
const choukaAudio = new Audio(AUDIO_CONFIG.chouka);
const huagai1Audio = new Audio(AUDIO_CONFIG.huagai1);
const chakaAudio = new Audio(AUDIO_CONFIG.chaka);
const huagai2Audio = new Audio(AUDIO_CONFIG.huagai2);
const guoAudio = new Audio(AUDIO_CONFIG.guo);
const cardVoiceAudios = Object.fromEntries(
  Object.entries(AUDIO_CONFIG.cardVoices).map(([key, src]) => [key, new Audio(src)]),
);

// iPhone/PWA：kaca 走独立 Web Audio 通道。
// 关键点：网络数据提前 fetch；第一次真实用户手势里同步发起 AudioContext.resume()，
// 并建立唯一的 ready Promise。插卡命中时等待这个 Promise，再 start()，彻底消除首次竞态。
let sfxAudioContext = null;
let kacaAudioBuffer = null;
let kacaBytesPromise = null;
let kacaReadyPromise = null;
let activeKacaSource = null;
kh1Audio.preload = "auto";
ydMusicAudio.preload = "auto";
kacaAudio.preload = "auto";
charuAudio.preload = "auto";
choukaAudio.preload = "auto";
huagai1Audio.preload = "auto";
chakaAudio.preload = "auto";
huagai2Audio.preload = "auto";
guoAudio.preload = "auto";
Object.values(cardVoiceAudios).forEach((audio) => { audio.preload = "auto"; });
[
  kh1Audio, ydMusicAudio, kacaAudio, charuAudio, choukaAudio,
  huagai1Audio, chakaAudio, huagai2Audio, guoAudio, ...Object.values(cardVoiceAudios),
].forEach((audio) => audio.load());

// 尽早读取 kaca 的原始音频数据；解锁/解码仍留到真实用户手势。
preloadKacaBytes();

function applyPhoneLayout() {
  // 背景覆盖完整动态视口；前景继续按 iPhone 16 Pro Max 的 440:956
  // 设计坐标等比缩放并居中，避免 Safari 地址栏改变高度时被拉伸。
  const targetRatio = PHONE_VIEWPORT.width / PHONE_VIEWPORT.height;
  const currentRatio = scene.clientWidth / scene.clientHeight;

  if (Math.abs(currentRatio - targetRatio) > 0.002) {
    console.warn("当前画布比例偏离 iPhone 16 Pro Max：", currentRatio);
  }

  const scale = Math.min(
    scene.clientWidth / SOURCE_SCENE.width,
    scene.clientHeight / SOURCE_SCENE.height,
  );
  sceneScale = scale;

  const { sequenceDuration, stageTwo, move, bg3, bg4, bg5, shatter, lq, sideButtons, auxDevice, beltLayers, card, beltGlow } = ANIMATION_CONFIG;

  scene.style.setProperty("--belt-width", `${SOURCE_BELT_WIDTH * scale}px`);
  scene.style.setProperty("--final-x", `${move.x * scale}px`);
  scene.style.setProperty("--final-y", `${move.y * scale}px`);
  scene.style.setProperty("--bg3-x", `${bg3.x * scale}px`);
  scene.style.setProperty("--bg3-y", `${bg3.y * scale}px`);
  scene.style.setProperty("--bg3-width", `${bg3.width}%`);
  scene.style.setProperty("--bg3-height-scale", String(bg3.height / 100));
  scene.style.setProperty("--bg3-duration", `${bg3.duration}s`);
  scene.style.setProperty("--bg4-spread", `${bg4.spread * scale}px`);
  scene.style.setProperty("--bg4-entry", `${bg4.entryDistance * scale}px`);
  scene.style.setProperty("--bg4-duration", `${bg4.duration}s`);
  scene.style.setProperty("--bg5-duration", `${bg5.duration}s`);
  scene.style.setProperty("--shatter-duration", `${shatter.duration}s`);
  scene.style.setProperty("--lq-x", `${lq.x * scale}px`);
  scene.style.setProperty("--lq-y", `${lq.y * scale}px`);
  scene.style.setProperty("--lq-card-width", `${lq.cardWidth * scale}px`);
  scene.style.setProperty("--lq-gap-x", `${lq.gapX * scale}px`);
  scene.style.setProperty("--lq-gap-y", `${lq.gapY * scale}px`);
  scene.style.setProperty("--lq-entry", `${lq.entryDistance * scale}px`);
  scene.style.setProperty("--lq-duration", `${lq.duration}s`);
  scene.style.setProperty("--side-buttons-x", `${sideButtons.x * scale}px`);
  scene.style.setProperty("--side-buttons-y", `${sideButtons.y * scale}px`);
  scene.style.setProperty("--side-button-size", `${sideButtons.size * scale}px`);
  scene.style.setProperty("--side-button-gap", `${sideButtons.gap * scale}px`);
  scene.style.setProperty("--kpc-flip-duration", `${auxDevice.kpcDrag.flipDuration}s`);
  scene.style.setProperty("--bs-x", `${auxDevice.bs.x * scale}px`);
  scene.style.setProperty("--bs-y", `${auxDevice.bs.y * scale}px`);
  scene.style.setProperty("--bs-width", `${auxDevice.bs.width * scale}px`);
  scene.style.setProperty("--lzj-container-x", `${(auxDevice.container.x || 0) * scale}px`);
  scene.style.setProperty("--lzj-container-y", `${(auxDevice.container.y || 0) * scale}px`);
  scene.style.setProperty("--lzj-slide-x", `${auxDevice.container.slideX * scale}px`);
  scene.style.setProperty("--lzj-duration", `${auxDevice.container.duration}s`);

  scene.style.setProperty("--lzj3-x", `${auxDevice.lzj3.x * scale}px`);
  scene.style.setProperty("--lzj3-y", `${auxDevice.lzj3.y * scale}px`);
  scene.style.setProperty("--lzj3-width", `${auxDevice.lzj3.width * scale}px`);

  scene.style.setProperty("--lzj2-x", `${auxDevice.lzj2.x * scale}px`);
  scene.style.setProperty("--lzj2-y", `${auxDevice.lzj2.y * scale}px`);
  scene.style.setProperty("--lzj2-width", `${auxDevice.lzj2.width * scale}px`);

  scene.style.setProperty("--lzj-x", `${auxDevice.lzj.x * scale}px`);
  scene.style.setProperty("--lzj-y", `${auxDevice.lzj.y * scale}px`);
  scene.style.setProperty("--lzj-width", `${auxDevice.lzj.width * scale}px`);
  scene.style.setProperty("--lzj-drop-y", `${(auxDevice.lzj.dropY || 0) * scale}px`);

  scene.style.setProperty("--lyfg-x", `${auxDevice.lyfg.x * scale}px`);
  scene.style.setProperty("--lyfg-y", `${auxDevice.lyfg.y * scale}px`);
  scene.style.setProperty("--lyfg-width", `${auxDevice.lyfg.width * scale}px`);
  scene.style.setProperty("--lyfg-duration", `${auxDevice.lyfg.duration}s`);
  scene.style.setProperty("--card-slot-x", `${auxDevice.cardSlot.x * scale}px`);
  scene.style.setProperty("--card-slot-y", `${auxDevice.cardSlot.y * scale}px`);
  scene.style.setProperty("--card-slot-width", `${auxDevice.cardSlot.width * scale}px`);
  scene.style.setProperty("--card-slot-height", `${auxDevice.cardSlot.height * scale}px`);
  scene.style.setProperty("--card-slot-card-x", `${auxDevice.cardSlot.cardX * scale}px`);
  scene.style.setProperty("--card-slot-card-y", `${auxDevice.cardSlot.cardY * scale}px`);
  scene.style.setProperty("--card-slot-card-width", `${auxDevice.cardSlot.cardWidth * scale}px`);
  scene.classList.toggle("show-card-slot-debug", Boolean(auxDevice.cardSlot.showDebug));
  scene.classList.toggle("show-lyfg-tuning", Boolean(auxDevice.lyfg.showForTuning));
  scene.style.setProperty("--aux-lq-blur", `${auxDevice.lqBlur}px`);
  scene.style.setProperty("--card-start-x", `${card.start.x * scale}px`);
  scene.style.setProperty("--card-start-y", `${card.start.y * scale}px`);
  scene.style.setProperty("--card-drag-x", `${cardDragPosition.x * scale}px`);
  scene.style.setProperty("--card-drag-y", `${cardDragPosition.y * scale}px`);
  // 内层卡盒在腰带上移后接棒；减去 move 可让接棒前后保持同一屏幕坐标。
  scene.style.setProperty("--card-nested-start-x", `${(card.start.x - move.x) * scale}px`);
  scene.style.setProperty("--card-nested-start-y", `${(card.start.y - move.y) * scale}px`);
  scene.style.setProperty("--card-insert-x", `${card.insert.x * scale}px`);
  scene.style.setProperty("--card-insert-y", `${card.insert.y * scale}px`);
  scene.style.setProperty("--card-width", `${card.width * scale}px`);
  scene.style.setProperty("--card-insert-duration", `${card.duration}s`);
  scene.style.setProperty("--kpc-x", `${card.layers.middle.x * scale}px`);
  scene.style.setProperty("--kpc-y", `${card.layers.middle.y * scale}px`);
  scene.style.setProperty("--kpc-pull-x", `${auxKpcPullX * scale}px`);
  scene.style.setProperty("--kpc-width", `${card.layers.middle.width * scale}px`);
  scene.style.setProperty("--card-extract-x", `${cardExtractPosition.x * scale}px`);
  scene.style.setProperty("--card-extract-y", `${cardExtractPosition.y * scale}px`);
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
  belt.style.setProperty("--stage-two-wave-duration", `${stageTwo.backHold}s`);
  belt.style.setProperty("--stage-two-flip-duration", `${stageTwo.flipDuration}s`);
  belt.style.setProperty("--move-x", `${move.x * scale}px`);
  belt.style.setProperty("--move-y", `${move.y * scale}px`);
  belt.style.setProperty("--move-duration", `${move.duration}s`);
  belt.style.setProperty("--up-x", `${beltLayers.up.x * scale}px`);
  belt.style.setProperty("--up-y", `${beltLayers.up.y * scale}px`);
  belt.style.setProperty("--down-x", `${beltLayers.down.x * scale}px`);
  belt.style.setProperty("--down-y", `${beltLayers.down.y * scale}px`);
}

function runWaterRipple(startTime) {
  const waterPhaseDuration = STAGE_TWO_WAVE_DURATION * 1000;
  lastRippleUpdate = 0;

  function update(now) {
    // iPhone 上将昂贵的 SVG 位移滤镜限制到约 30fps，腰带主体动画仍保持原帧率。
    if (lastRippleUpdate && now - lastRippleUpdate < 33) {
      rippleAnimationFrame = requestAnimationFrame(update);
      return;
    }
    lastRippleUpdate = now;

    const progress = Math.min(1, (now - startTime) / waterPhaseDuration);
    const fade = 1 - progress;
    const pulse = 0.72 + Math.sin(progress * Math.PI * 10) * 0.28;
    const strength = Math.max(0, WATER_MAX_DISPLACEMENT * fade * pulse);
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

function getSfxAudioContext() {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!sfxAudioContext) sfxAudioContext = new AudioContextCtor();
  return sfxAudioContext;
}

// 网络读取不需要用户手势，页面加载后就提前开始。
// 这里只保存原始字节，不提前创建/解锁 AudioContext，避免 iOS 首次状态混乱。
function preloadKacaBytes() {
  if (kacaBytesPromise) return kacaBytesPromise;

  kacaBytesPromise = fetch(AUDIO_CONFIG.kaca, { cache: "force-cache" })
    .then((response) => {
      if (!response.ok) throw new Error(`kaca fetch failed: ${response.status}`);
      return response.arrayBuffer();
    })
    .catch((error) => {
      console.warn("kaca 音频数据预加载失败：", error);
      kacaBytesPromise = null;
      return null;
    });

  return kacaBytesPromise;
}

// 必须从真实 click / pointerdown 中调用。
// resume() 在函数进入后立即发起，之后异步 decode 可以慢慢完成；
// 返回的 kacaReadyPromise 是第一次和后续插卡共同等待的唯一准备状态。
function prepareKacaFromUserGesture() {
  const context = getSfxAudioContext();
  if (!context) return Promise.resolve(false);

  let resumePromise = Promise.resolve();
  try {
    if (context.state !== "running") {
      // 这一句必须发生在当前真实用户手势的同步调用栈里。
      resumePromise = context.resume();
    }
  } catch (error) {
    console.warn("WebAudio resume 发起失败：", error);
    return Promise.resolve(false);
  }

  // 每次真实按下都把 resume 链接进 ready Promise，处理 PWA 从后台回来后再次 suspended 的情况。
  const decodePromise = kacaAudioBuffer
    ? Promise.resolve(kacaAudioBuffer)
    : preloadKacaBytes().then((bytes) => {
        if (!bytes) return null;
        if (kacaAudioBuffer) return kacaAudioBuffer;
        // Safari 的 decodeAudioData 可能接管 ArrayBuffer，复制一份最稳妥。
        return context.decodeAudioData(bytes.slice(0)).then((buffer) => {
          kacaAudioBuffer = buffer;
          return buffer;
        });
      });

  kacaReadyPromise = Promise.all([Promise.resolve(resumePromise), decodePromise])
    .then(([, buffer]) => Boolean(buffer && context.state === "running"))
    .catch((error) => {
      console.warn("kaca WebAudio 准备失败：", error);
      return false;
    });

  return kacaReadyPromise;
}

function unlockSfxAudio() {
  return prepareKacaFromUserGesture();
}

function stopKacaReliable() {
  if (activeKacaSource) {
    try {
      activeKacaSource.stop();
    } catch {
      // 已经结束的 AudioBufferSource 再 stop 会抛错，忽略即可。
    }
    activeKacaSource = null;
  }
  stopAudio(kacaAudio);
}

async function playKacaReliable() {
  const context = getSfxAudioContext();

  if (context) {
    // 正常情况下 ready Promise 已在首次 click / 本次拖动 pointerdown 中创建。
    // 这里绝不再依赖“命中瞬间刚好已经 running”这种竞态判断。
    const ready = kacaAudioBuffer && context.state === "running"
      ? true
      : await (kacaReadyPromise || Promise.resolve(false));

    if (ready && kacaAudioBuffer && context.state === "running") {
      if (activeKacaSource) {
        try { activeKacaSource.stop(); } catch {}
      }

      const source = context.createBufferSource();
      source.buffer = kacaAudioBuffer;
      source.connect(context.destination);
      source.onended = () => {
        if (activeKacaSource === source) activeKacaSource = null;
      };
      activeKacaSource = source;
      source.start(0);
      return true;
    }
  }

  // 只有 Web Audio 真正不可用/准备失败才兜底 HTMLAudio。
  // 现代 iPhone PWA 正常流程不会走到这里。
  try {
    await playAudio(kacaAudio);
    return true;
  } catch (error) {
    console.warn("kaca HTMLAudio 兜底播放失败：", error);
    return false;
  }
}

function cancelCharuBg4Sync() {
  if (charuBg4SyncFrame) {
    cancelAnimationFrame(charuBg4SyncFrame);
    charuBg4SyncFrame = 0;
  }
}

function getBg4CharuStartTime() {
  const { seconds, frames, fps } = ANIMATION_CONFIG.bg4.startTimecode;
  return seconds + frames / fps;
}

function startCharuBg4Sync() {
  cancelCharuBg4Sync();
  const triggerTime = getBg4CharuStartTime();

  const syncToCharu = () => {
    if (!flowStarted || bg4MergeStarted || charuAudio.ended) {
      charuBg4SyncFrame = 0;
      return;
    }

    // 直接读取 charu 的真实播放进度，避免 setTimeout 因音频启动延迟而导致画面抢跑。
    if (!charuAudio.paused && charuAudio.currentTime >= triggerTime) {
      charuBg4SyncFrame = 0;
      startBg4Merge();
      return;
    }

    charuBg4SyncFrame = requestAnimationFrame(syncToCharu);
  };

  charuBg4SyncFrame = requestAnimationFrame(syncToCharu);
}

function primeAudio(audio, isInUse) {
  audio.muted = true;
  const playPromise = audio.play();

  if (!(playPromise instanceof Promise)) {
    audio.pause();
    audio.currentTime = 0;
    audio.muted = false;
    return;
  }

  playPromise
    .then(() => {
      if (!isInUse()) {
        audio.pause();
        audio.currentTime = 0;
      }
      audio.muted = false;
    })
    .catch(() => {
      audio.muted = false;
    });
}

function setCardDragPosition(x, y) {
  cardDragPosition = { x, y };
  scene.style.setProperty("--card-drag-x", `${x * sceneScale}px`);
  scene.style.setProperty("--card-drag-y", `${y * sceneScale}px`);
}

function setCardExtractPosition(x, y) {
  cardExtractPosition = { x, y };
  scene.style.setProperty("--card-extract-x", `${x * sceneScale}px`);
  scene.style.setProperty("--card-extract-y", `${y * sceneScale}px`);
}

function parseShatterPolygon(polygon, rect) {
  const body = polygon.slice(polygon.indexOf("(") + 1, polygon.lastIndexOf(")"));
  return body.split(",").map((pair) => {
    const [x, y] = pair.trim().split(/\s+/);
    return {
      x: rect.x + (parseFloat(x) / 100) * rect.width,
      y: rect.y + (parseFloat(y) / 100) * rect.height,
    };
  });
}

function effectiveOpacity(element) {
  let opacity = 1;
  let node = element;
  while (node && node !== scene) {
    const style = getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") return 0;
    opacity *= Number.parseFloat(style.opacity || "1");
    node = node.parentElement;
  }
  return opacity;
}

function drawDomImageToCanvas(ctx, image, sceneRect) {
  if (!image?.complete || !image.naturalWidth || !image.naturalHeight) return;
  const rect = image.getBoundingClientRect();
  if (rect.width < 0.5 || rect.height < 0.5) return;
  const alpha = effectiveOpacity(image);
  if (alpha <= 0.001) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(
    image,
    rect.left - sceneRect.left,
    rect.top - sceneRect.top,
    rect.width,
    rect.height,
  );
  ctx.restore();
}

function buildShatterSnapshot() {
  const sceneRect = scene.getBoundingClientRect();
  const cssWidth = Math.max(1, sceneRect.width);
  const cssHeight = Math.max(1, sceneRect.height);
  // iPhone / PWA 优先：碎裂只有不到 1 秒，宁可牺牲一点 Retina 清晰度也不要触发 WebKit Canvas 内存回收。
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
  const dpr = (isIOS || isStandalone) ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);

  const source = document.createElement("canvas");
  source.width = Math.round(cssWidth * dpr);
  source.height = Math.round(cssHeight * dpr);
  const sourceCtx = source.getContext("2d", { alpha: true });
  if (!sourceCtx) return null;
  sourceCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  sourceCtx.clearRect(0, 0, cssWidth, cssHeight);

  const targets = [];

  if (scene.classList.contains("show-bg3")) {
    const bg3Image = characterReveal.querySelector(".character-image");
    const rect = characterReveal.getBoundingClientRect();
    drawDomImageToCanvas(sourceCtx, bg3Image, sceneRect);
    targets.push({
      kind: "bg3",
      rect: {
        x: rect.left - sceneRect.left,
        y: rect.top - sceneRect.top,
        width: rect.width,
        height: rect.height,
      },
    });
  }

  // 只绘制腰带本体图片，明确排除内部卡盒；卡盒拖出后留在最前景。
  const beltRect = beltArt.getBoundingClientRect();
  [...beltArt.querySelectorAll("img")]
    .filter((image) => !image.closest("#cardBox"))
    .forEach((image) => drawDomImageToCanvas(sourceCtx, image, sceneRect));
  targets.push({
    kind: "belt",
    rect: {
      x: beltRect.left - sceneRect.left,
      y: beltRect.top - sceneRect.top,
      width: beltRect.width,
      height: beltRect.height,
    },
  });

  return { source, sceneRect, cssWidth, cssHeight, dpr, targets };
}

function createCanvasShard(targetRect, polygon, motion, index) {
  const absolutePoints = parseShatterPolygon(polygon, targetRect);
  const centroid = absolutePoints.reduce(
    (acc, point) => ({
      x: acc.x + point.x / absolutePoints.length,
      y: acc.y + point.y / absolutePoints.length,
    }),
    { x: 0, y: 0 },
  );

  return {
    points: absolutePoints,
    cx: centroid.x,
    cy: centroid.y,
    dx: motion[0] * sceneScale,
    dy: motion[1] * sceneScale,
    rz: motion[2] * (Math.PI / 180),
    delay: index * 8,
  };
}

function drawCanvasCracks(ctx, targetRect, progress) {
  if (progress >= 0.34) return;
  const flash = progress < 0.1
    ? progress / 0.1
    : Math.max(0, 1 - (progress - 0.1) / 0.24);
  if (flash <= 0) return;

  const cx = targetRect.x + targetRect.width * 0.52;
  const cy = targetRect.y + targetRect.height * 0.5;
  const rays = [
    [-0.48, -0.36], [-0.2, -0.52], [0.16, -0.48], [0.46, -0.28],
    [0.5, 0.14], [0.27, 0.46], [-0.12, 0.5], [-0.43, 0.28],
  ];

  ctx.save();
  ctx.globalAlpha = flash * 0.92;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = Math.max(0.8, 1.25 * sceneScale);
  ctx.lineCap = "round";
  rays.forEach(([rx, ry], index) => {
    const ex = cx + targetRect.width * rx;
    const ey = cy + targetRect.height * ry;
    const mx = cx + (ex - cx) * 0.48 + (index % 2 ? 7 : -7) * sceneScale;
    const my = cy + (ey - cy) * 0.48 + (index % 3 - 1) * 8 * sceneScale;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(mx, my);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    if (index % 2 === 0) {
      ctx.globalAlpha = flash * 0.55;
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + (index < 4 ? 18 : -18) * sceneScale, my + 12 * sceneScale);
      ctx.stroke();
      ctx.globalAlpha = flash * 0.92;
    }
  });
  ctx.restore();
}

function clearMirrorShatter() {
  clearTimeout(shatterCleanupTimer);
  shatterCleanupTimer = 0;
  if (shatterAnimationFrame) {
    cancelAnimationFrame(shatterAnimationFrame);
    shatterAnimationFrame = 0;
  }
  shatterCanvas.classList.remove("is-active");
  const ctx = shatterCanvas.getContext("2d");
  ctx?.clearRect(0, 0, shatterCanvas.width, shatterCanvas.height);
  scene.classList.remove("is-shattering");
  belt.classList.remove("is-shatter-hidden");
}

function startMirrorShatter() {
  if (!flowStarted || scene.classList.contains("is-shattering")) return;

  const snapshot = buildShatterSnapshot();
  if (!snapshot) {
    // Canvas 真不可用时才退回普通隐藏，但不让流程卡死。
    scene.classList.remove("show-bg3", "show-final-background");
    belt.classList.add("is-shatter-hidden");
    return;
  }

  clearTimeout(shatterCleanupTimer);
  if (shatterAnimationFrame) cancelAnimationFrame(shatterAnimationFrame);

  const { source, cssWidth, cssHeight, dpr, targets } = snapshot;
  shatterCanvas.width = Math.max(1, Math.round(cssWidth * dpr));
  shatterCanvas.height = Math.max(1, Math.round(cssHeight * dpr));
  const ctx = shatterCanvas.getContext("2d", { alpha: true });
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // 关键修复：这里只保存几何数据，不再为 24 块碎片各创建一个离屏 Canvas。
  // iPhone PWA 运行时常驻仅 source + shatterCanvas 两块画布。
  const shards = targets.flatMap((target) =>
    SHATTER_POLYGONS.map((polygon, index) =>
      createCanvasShard(target.rect, polygon, SHATTER_MOTION[index], index),
    ),
  );

  const durationMs = ANIMATION_CONFIG.shatter.duration * 1000;
  scene.classList.add("is-shattering");
  shatterCanvas.classList.add("is-active");

  function drawFrame(elapsed) {
    const overall = Math.min(1, Math.max(0, elapsed / durationMs));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    shards.forEach((shard) => {
      const local = Math.max(0, Math.min(1, (elapsed - shard.delay) / durationMs));
      const eased = 1 - Math.pow(1 - local, 3);
      const alpha = 1 - Math.pow(local, 1.55);
      const scale = 1.015 - eased * 0.23;

      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.translate(shard.cx + shard.dx * eased, shard.cy + shard.dy * eased);
      ctx.rotate(shard.rz * eased);
      ctx.scale(scale, scale);
      ctx.translate(-shard.cx, -shard.cy);

      ctx.beginPath();
      shard.points.forEach((point, pointIndex) => {
        if (pointIndex === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(source, 0, 0, cssWidth, cssHeight);
      ctx.restore();
    });

    targets.forEach((target) => drawCanvasCracks(ctx, target.rect, overall));
  }

  // 先把完整快照画到 Canvas。此时真实 bg3/腰带还在，因此即使 WebKit 首帧延迟也不会出现“直接重置”的空窗。
  drawFrame(0);

  let startedAt = 0;
  const render = (now) => {
    if (!scene.classList.contains("is-shattering")) {
      shatterAnimationFrame = 0;
      return;
    }

    if (!startedAt) startedAt = now;
    const elapsed = now - startedAt;
    drawFrame(elapsed);

    if (elapsed < durationMs) {
      shatterAnimationFrame = requestAnimationFrame(render);
      return;
    }

    shatterAnimationFrame = 0;
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    shatterCanvas.classList.remove("is-active");
    scene.classList.remove("is-shattering");
  };

  // 下一帧才把真实对象隐藏并恢复默认背景。这样 Canvas 至少已经成功提交过一帧。
  shatterAnimationFrame = requestAnimationFrame(() => {
    scene.classList.remove("show-bg3", "show-final-background");
    belt.classList.add("is-shatter-hidden");
    shatterAnimationFrame = requestAnimationFrame(render);
  });

  shatterCleanupTimer = setTimeout(() => {
    if (shatterAnimationFrame) {
      cancelAnimationFrame(shatterAnimationFrame);
      shatterAnimationFrame = 0;
    }
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    shatterCanvas.classList.remove("is-active");
    scene.classList.remove("is-shattering");
    shatterCleanupTimer = 0;
  }, durationMs + 260);
}

function hideLqPanel() {
  scene.classList.remove("show-lq");
  lqButtons.forEach((button) => button.classList.remove("is-selected"));
  selectedLq = null;
  cardBox.classList.remove("is-kpc-ejected");
  if (auxOpen || auxArmed || auxCardInserted || auxKpcHasBeenPulled || auxKpcDragging) resetAuxDevice();
}

function showLqPanel() {
  if (!flowStarted) return;
  scene.classList.add("show-lq");
}

function enableCardExtraction() {
  if (!flowStarted || (!cardBox.classList.contains("is-inserted") && !cardBox.classList.contains("is-inserting"))) return;
  // 即使 charu 极短、刚好早于插卡 transition 的兜底计时结束，也直接把卡盒锁定到卡槽位置。
  cardBox.classList.remove("is-inserting", "is-handoff");
  cardBox.classList.add("is-inserted");
  extractReady = true;
  isExtracting = false;
  extractPointerId = null;
  setCardExtractPosition(0, 0);
  cardBox.classList.add("is-extractable");
}

function selectLqCard(event) {
  if (!flowStarted || !scene.classList.contains("show-lq")) return;
  const button = event.currentTarget;
  selectedLq = button.dataset.lq;
  lqButtons.forEach((item) => item.classList.toggle("is-selected", item === button));
  // v59：选卡只记录卡种，不再自动把腰带里的 KPC 向左推出。
  cardBox.classList.remove("is-kpc-ejected");
}

function getSelectedCardVoiceAudio() {
  return selectedLq ? cardVoiceAudios[selectedLq] || null : null;
}

function playSelectedCardVoice() {
  const audio = getSelectedCardVoiceAudio();
  if (!audio) return Promise.resolve(null);
  return playAudio(audio).catch((error) => {
    console.warn(`LQ${selectedLq} 对应卡片音效播放失败：`, error);
    return null;
  });
}

async function playSelectedCardVoiceWithLyfg() {
  const audio = getSelectedCardVoiceAudio();
  if (!audio) {
    lyfgImage?.classList.remove("is-active");
    return;
  }

  clearTimeout(lyfgTimer);
  lyfgTimer = 0;
  lyfgImage?.classList.remove("is-active");

  const hideLyfg = () => {
    lyfgImage?.classList.remove("is-active");
    audio.removeEventListener("ended", hideLyfg);
    audio.removeEventListener("error", hideLyfg);
  };

  audio.addEventListener("ended", hideLyfg, { once: true });
  audio.addEventListener("error", hideLyfg, { once: true });

  try {
    await playAudio(audio);
    // 只有卡片专属音效真正开始播放后才显示 lyfg。
    lyfgImage?.classList.add("is-active");
  } catch (error) {
    hideLyfg();
    console.warn(`LQ${selectedLq} 对应卡片音效播放失败：`, error);
  }
}

function setAuxKpcPosition(left, top) {
  auxKpcPosition = { left, top };
  if (!auxTransferCard) return;
  // PWA 优先：拖动只更新 transform，不再每帧修改 left/top 触发布局重排。
  auxTransferCard.style.setProperty("--aux-card-x", `${left}px`);
  auxTransferCard.style.setProperty("--aux-card-y", `${top}px`);
}

function setAuxKpcPullX(x) {
  auxKpcPullX = Math.min(0, x);
  scene.style.setProperty("--kpc-pull-x", `${auxKpcPullX * sceneScale}px`);
}

function stopAuxKpcDrag(pointerId = null) {
  if (!auxKpcDragging) return;
  if (pointerId !== null && auxKpcCaptureTarget?.hasPointerCapture?.(pointerId)) {
    auxKpcCaptureTarget.releasePointerCapture(pointerId);
  }
  auxKpcDragging = false;
  auxKpcPointerId = null;
  auxKpcCaptureTarget = null;
  auxTransferCard?.classList.remove("is-dragging");
}

function resetAuxDevice(options = {}) {
  clearTimeout(lyfgTimer);
  lyfgTimer = 0;
  stopAuxKpcDrag(auxKpcPointerId);
  auxOpen = false;
  auxArmed = false;
  auxCardInserted = false;
  auxKpcHasBeenPulled = false;
  auxKpcCaptureTarget = null;
  auxKpcFullyExtracted = false;
  auxKpcFlipped = false;
  auxKpcFlipInProgress = false;
  auxKpcExtractStartCenterY = 0;
  auxKpcInitialLeft = 0;
  auxKpcOriginalRect = null;
  auxKpcFullExtractDistance = 0;
  auxKpcSize = { width: 0, height: 0 };
  auxKpcAspectRatio = 1;
  auxDockViewportOrigin = { left: 0, top: 0 };
  auxKpcPullX = 0;
  auxKpcPullStartX = 0;
  setAuxKpcPullX(0);
  auxChoukaPlayed = false;
  auxResultPlayed = false;
  auxKpcPosition = { left: 0, top: 0 };
  scene.classList.remove("is-aux-open", "is-aux-armed", "is-aux-card-inserted", "is-aux-playing");
  auxDock?.classList.remove("is-open", "is-armed", "is-card-inserted", "is-playing");
  auxTransferCard?.classList.remove("is-visible", "is-dragging", "is-inserted", "is-fully-extracted", "is-flipping", "is-flipped", "is-consumed");
  hideInsertedCardInSlot();
  auxTransferCardImage?.classList.remove("is-flip-running");
  lzjButton?.classList.remove("is-result-ready");
  auxCardCoverMask?.classList.remove("is-visible");
  if (auxTransferCardImage) auxTransferCardImage.src = "./assets/images/kpc.png";
  lyfgImage?.classList.remove("is-active");
  if (auxTransferCard) {
    auxTransferCard.style.removeProperty("--aux-card-x");
    auxTransferCard.style.removeProperty("--aux-card-y");
    auxTransferCard.style.removeProperty("width");
    auxTransferCard.style.removeProperty("height");
    }
  if (auxCardCoverMask) {
    auxCardCoverMask.style.removeProperty("left");
    auxCardCoverMask.style.removeProperty("top");
    auxCardCoverMask.style.removeProperty("width");
    auxCardCoverMask.style.removeProperty("height");
  }
  if (!options.keepKpcHidden) cardBox.classList.remove("is-kpc-aux-hidden");
}

function toggleAuxDock(event) {
  event?.preventDefault();
  event?.stopPropagation();
  // 必须先选中一张下方卡，BS 才开启对应卡种的流程。
  if (!flowStarted || !scene.classList.contains("show-lq") || !selectedLq) return;

  if (auxOpen) {
    resetAuxDevice();
    return;
  }

  auxOpen = true;
  auxArmed = false;
  auxCardInserted = false;
  auxKpcHasBeenPulled = false;
  auxKpcFullyExtracted = false;
  auxKpcOriginalRect = null;
  setAuxKpcPullX(0);
  auxKpcFlipped = false;
  auxKpcFlipInProgress = false;
  auxChoukaPlayed = false;
  auxResultPlayed = false;
  scene.classList.remove("is-aux-playing");
  auxDock?.classList.remove("is-playing");
  scene.classList.add("is-aux-open");
  auxDock?.classList.add("is-open");
}

function handleLzjClick(event) {
  event?.preventDefault();
  event?.stopPropagation();
  if (!flowStarted || !auxOpen) return;

  // 龙召机允许空载开合：第一次下滑 huagai1，第二次上滑 huagai2。
  if (!auxArmed) {
    auxArmed = true;
    auxResultPlayed = false;
    scene.classList.remove("is-aux-playing");
    auxDock?.classList.remove("is-playing");
    scene.classList.add("is-aux-armed");
    auxDock?.classList.add("is-armed");
    playAudio(huagai1Audio).catch((error) => {
      console.warn("huagai1 音效播放失败：", error);
    });
    return;
  }

  const hadInsertedCard = auxCardInserted;
  auxArmed = false;
  auxCardInserted = false;
  scene.classList.remove("is-aux-armed", "is-aux-card-inserted");
  auxDock?.classList.remove("is-armed", "is-card-inserted");
  lzjButton?.classList.remove("is-result-ready");

  playAudio(huagai2Audio).catch((error) => {
    console.warn("huagai2 音效播放失败：", error);
  });

  // 有卡时，上滑同时读卡；没卡时只做 huagai2，不阻止继续反复开合。
  if (hadInsertedCard && selectedLq) {
    auxResultPlayed = true;
    scene.classList.add("is-aux-playing");
    auxDock?.classList.add("is-playing");
    playSelectedCardVoiceWithLyfg();
    auxTransferCard?.classList.add("is-consumed");
    auxTransferCard?.classList.remove("is-inserted");
    hideInsertedCardInSlot();
  } else {
    auxResultPlayed = false;
    scene.classList.remove("is-aux-playing");
    auxDock?.classList.remove("is-playing");
  }
}

function getSelectedLqImageSrc() {
  if (!selectedLq) return null;
  const button = lqButtons.find((item) => item.dataset.lq === String(selectedLq));
  return button?.querySelector("img")?.getAttribute("src") || null;
}

function handoffAuxKpcToFloatingCard(event) {
  if (!auxTransferCard || !auxDock || !kpcLayer || auxKpcFullyExtracted) return false;

  // 这里只读一次布局。抽卡 pointermove 阶段不再反复 getBoundingClientRect。
  const dockRect = auxDock.getBoundingClientRect();
  const cardRect = kpcLayer.getBoundingClientRect();
  auxDockViewportOrigin = { left: dockRect.left, top: dockRect.top };
  const left = cardRect.left - dockRect.left;
  const top = cardRect.top - dockRect.top;

  if (auxTransferCardImage) auxTransferCardImage.src = "./assets/images/kpc.png";
  auxTransferCard.classList.remove("is-flipping", "is-flipped", "is-consumed", "is-inserted");
  auxTransferCardImage?.classList.remove("is-flip-running");
  lzjButton?.classList.remove("is-result-ready");

  auxKpcSize = { width: cardRect.width, height: cardRect.height };
  auxKpcAspectRatio = cardRect.height > 0 ? cardRect.width / cardRect.height : 1;
  auxTransferCard.style.width = `${cardRect.width}px`;
  auxTransferCard.style.height = `${cardRect.height}px`;
  setAuxKpcPosition(left, top);
  auxTransferCard.classList.add("is-visible", "is-fully-extracted");

  cardBox.classList.add("is-kpc-aux-hidden");
  auxKpcFullyExtracted = true;

  // PWA / iPhone Safari 优先：同一根手指的拖动过程中绝不转移 pointer capture。
  // 当前手势继续由最初 pointerdown 的元素持有 capture；浮动卡只负责视觉显示。
  // 中途 release(old) -> set(new) 在 iOS PWA 上会偶发丢失后续 pointermove。
  auxKpcPointerStart = { x: event.clientX, y: event.clientY };
  auxKpcStartPosition = { ...auxKpcPosition };
  return true;
}
function updateAuxKpcExtractionState(event) {
  if (auxKpcFullyExtracted || auxKpcFullExtractDistance <= 0) return false;
  // auxKpcPullX 是场景源坐标，达到预先算好的完整抽出距离才交接。
  if (-auxKpcPullX >= auxKpcFullExtractDistance) {
    return handoffAuxKpcToFloatingCard(event);
  }
  return false;
}
function prepareAuxKpcCard() {
  if (!kpcLayer || !cardBox) return false;
  if (auxKpcHasBeenPulled) return true;

  // 只在开始抽卡时读一次尺寸，之后 pointermove 纯数学计算，避免 iPhone/PWA 强制重排。
  const startRect = kpcLayer.getBoundingClientRect();
  const boxRect = cardBox.getBoundingClientRect();
  auxKpcOriginalRect = {
    left: startRect.left,
    top: startRect.top,
    width: startRect.width,
    height: startRect.height,
  };
  auxKpcExtractStartCenterY = startRect.top + startRect.height / 2;
  auxKpcHasBeenPulled = true;
  auxKpcFullyExtracted = false;
  setAuxKpcPullX(0);

  const padding = (ANIMATION_CONFIG.auxDevice.kpcDrag?.fullExtractPadding || 0) * sceneScale;
  const clearDistancePx = Math.max(startRect.width, startRect.right - boxRect.left + padding);
  auxKpcFullExtractDistance = clearDistancePx / (sceneScale || 1);

  auxTransferCard?.classList.remove("is-visible", "is-fully-extracted", "is-consumed", "is-inserted");
  auxCardCoverMask?.classList.remove("is-visible");
  cardBox.classList.remove("is-kpc-aux-hidden");
  return true;
}
function beginAuxKpcDrag(event, fromTransferCard = false) {
  if (!flowStarted || !auxOpen || !auxArmed || auxCardInserted || auxKpcFlipInProgress) return;
  if (!cardBox.classList.contains("is-inserted")) return;
  if (fromTransferCard && !auxKpcFullyExtracted) return;

  if (!prepareAuxKpcCard()) return;

  event.preventDefault();
  event.stopPropagation();

  auxKpcDragging = true;
  auxKpcPointerId = event.pointerId;
  auxKpcPointerStart = { x: event.clientX, y: event.clientY };
  auxKpcStartPosition = { ...auxKpcPosition };
  auxKpcPullStartX = auxKpcPullX;
  auxTransferCard?.classList.add("is-dragging");

  const captureTarget = auxKpcFullyExtracted || fromTransferCard ? auxTransferCard : kpcLayer;
  auxKpcCaptureTarget = captureTarget || null;
  captureTarget?.setPointerCapture?.(event.pointerId);
}

function moveAuxKpcDrag(event) {
  if (!auxKpcDragging || auxKpcPointerId !== event.pointerId) return;
  event.preventDefault();
  event.stopPropagation();

  // 卡还在卡盒里：只能水平向左抽，Y 轴完全锁死。
  if (!auxKpcFullyExtracted) {
    const dx = (event.clientX - auxKpcPointerStart.x) / sceneScale;
    setAuxKpcPullX(Math.min(0, auxKpcPullStartX + dx));

    // chouka 与“完全抽出”分离：默认抽出到一半时就播放一次。
    const triggerRatio = Math.min(1, Math.max(0, ANIMATION_CONFIG.auxDevice.kpcDrag?.choukaTriggerRatio ?? 0.5));
    if (!auxChoukaPlayed && auxKpcFullExtractDistance > 0 && -auxKpcPullX >= auxKpcFullExtractDistance * triggerRatio) {
      auxChoukaPlayed = true;
      playAudio(choukaAudio).catch((error) => {
        console.warn("chouka 音效播放失败：", error);
      });
    }

    updateAuxKpcExtractionState(event);
    return;
  }

  // 完全离开卡盒后使用 compositor transform 跟手，不触发布局重排。
  const dx = event.clientX - auxKpcPointerStart.x;
  const dy = event.clientY - auxKpcPointerStart.y;
  setAuxKpcPosition(auxKpcStartPosition.left + dx, auxKpcStartPosition.top + dy);

  // 已翻成正面后，只要卡片进入红色槽位就立即 chaka，不再等 pointerup / 完全塞入。
  if (auxKpcFlipped) tryInsertAuxKpcIntoSlot(event);
}

function getAuxCardSlotRect() {
  if (!auxDock) return null;
  const { cardSlot: slot, container } = ANIMATION_CONFIG.auxDevice;
  const scale = sceneScale || 1;
  const width = slot.width * scale;
  const height = slot.height * scale;
  const centerX = auxDockViewportOrigin.left + ((container.x || 0) + (container.slideX || 0) + slot.x) * scale;
  const centerY = auxDockViewportOrigin.top + ((container.y || 0) + slot.y) * scale;
  return {
    left: centerX - width / 2,
    right: centerX + width / 2,
    top: centerY - height / 2,
    bottom: centerY + height / 2,
    width,
    height,
    centerX,
    centerY,
  };
}

function getAuxFloatingCardRect() {
  const left = auxDockViewportOrigin.left + auxKpcPosition.left;
  const top = auxDockViewportOrigin.top + auxKpcPosition.top;
  return {
    left,
    top,
    right: left + auxKpcSize.width,
    bottom: top + auxKpcSize.height,
    width: auxKpcSize.width,
    height: auxKpcSize.height,
    centerX: left + auxKpcSize.width / 2,
    centerY: top + auxKpcSize.height / 2,
  };
}

function isAuxKpcEnteringSlot() {
  if (!auxTransferCard || !auxKpcFullyExtracted) return false;
  const cardRect = getAuxFloatingCardRect();
  const targetRect = getAuxCardSlotRect();
  if (!targetRect) return false;
  const threshold = (ANIMATION_CONFIG.auxDevice.kpcDrag?.slotEnterThreshold || 0) * (sceneScale || 1);
  const overlapX = Math.min(cardRect.right, targetRect.right) - Math.max(cardRect.left, targetRect.left);
  const overlapY = Math.min(cardRect.bottom, targetRect.bottom) - Math.max(cardRect.top, targetRect.top);
  return overlapX >= threshold && overlapY >= threshold;
}

function showInsertedCardInSlot() {
  if (!lzjInsertedCard || !auxTransferCardImage) return;
  const slotRect = getAuxCardSlotRect();
  const cardRect = getAuxFloatingCardRect();
  if (!slotRect) return;

  lzjInsertedCard.src = auxTransferCardImage.currentSrc || auxTransferCardImage.src;
  // 让卡片切层时保持当前屏幕位置，只改变层级并由红框裁切，避免“吸进去”时跳一下。
  const localX = cardRect.centerX - slotRect.centerX;
  const localY = cardRect.centerY - slotRect.centerY;
  lzjInsertedCard.style.width = `${auxKpcSize.width}px`;
  lzjInsertedCard.style.transform = `translate(-50%, -50%) translate3d(${localX}px, ${localY}px, 0)`;
  lzjCardSlotMask?.classList.add("is-active");
  auxTransferCard?.classList.add("is-consumed");
}

function hideInsertedCardInSlot() {
  lzjCardSlotMask?.classList.remove("is-active");
  if (lzjInsertedCard) {
    lzjInsertedCard.src = "./assets/images/kpc.png";
    lzjInsertedCard.style.removeProperty("width");
    lzjInsertedCard.style.removeProperty("transform");
  }
}

function completeAuxCardInsertion(event) {
  if (auxCardInserted || !auxKpcFlipped || !auxArmed) return false;
  auxCardInserted = true;
  stopAuxKpcDrag(event?.pointerId ?? auxKpcPointerId);
  scene.classList.add("is-aux-card-inserted");
  auxDock?.classList.add("is-card-inserted");
  auxTransferCard?.classList.add("is-inserted");
  showInsertedCardInSlot();
  lzjButton?.classList.add("is-result-ready");
  playAudio(chakaAudio).catch((error) => {
    console.warn("chaka 音效播放失败：", error);
  });
  return true;
}

function tryInsertAuxKpcIntoSlot(event) {
  if (!auxKpcFlipped || auxCardInserted || !auxArmed) return false;
  if (!isAuxKpcEnteringSlot()) return false;
  return completeAuxCardInsertion(event);
}

function shouldFlipAuxKpcOnRelease() {
  // v63：整张卡完全从左侧抽出后，第一次松手就翻面。
  // 不再要求额外向下拖到某个 Y 阈值。
  return Boolean(auxTransferCard && auxKpcFullyExtracted && !auxKpcFlipped && !auxKpcFlipInProgress);
}

function flipAuxKpcToSelectedCard() {
  if (!auxTransferCard || !auxTransferCardImage || auxKpcFlipped || auxKpcFlipInProgress) return;
  const selectedSrc = getSelectedLqImageSrc();
  if (!selectedSrc) return;

  auxKpcFlipInProgress = true;
  auxTransferCard.classList.remove("is-flipped");
  auxTransferCardImage.classList.remove("is-flip-running");

  // 先切到用户设定的最终尺寸，再开始翻面。整个翻面过程中尺寸保持一致，不会先大后小。
  const flippedWidth = ANIMATION_CONFIG.auxDevice.kpcDrag?.flippedWidth;
  if (Number.isFinite(flippedWidth) && flippedWidth > 0) {
    const newWidth = flippedWidth * (sceneScale || 1);
    const newHeight = auxKpcAspectRatio > 0 ? newWidth / auxKpcAspectRatio : auxKpcSize.height;
    const centerX = auxKpcPosition.left + auxKpcSize.width / 2;
    const centerY = auxKpcPosition.top + auxKpcSize.height / 2;
    auxKpcSize = { width: newWidth, height: newHeight };
    auxTransferCard.style.width = `${newWidth}px`;
    auxTransferCard.style.height = `${newHeight}px`;
    setAuxKpcPosition(centerX - newWidth / 2, centerY - newHeight / 2);
  }

  // 只在松手这一次做一次同步刷新，随后动画全程走 compositor。
  void auxTransferCardImage.offsetWidth;
  auxTransferCardImage.classList.add("is-flip-running");
  const duration = (ANIMATION_CONFIG.auxDevice.kpcDrag?.flipDuration || 0.52) * 1000;

  setTimeout(() => {
    if (!auxKpcFlipInProgress || !auxTransferCardImage) return;
    auxTransferCardImage.src = selectedSrc;
  }, duration * 0.5);

  setTimeout(() => {
    if (!auxKpcFlipInProgress || !auxTransferCard || !auxTransferCardImage) return;
    auxKpcFlipInProgress = false;
    auxKpcFlipped = true;
    auxTransferCardImage.classList.remove("is-flip-running");
    auxTransferCard.classList.add("is-flipped");
  }, duration + 20);
}
function endAuxKpcDrag(event) {
  if (!auxKpcDragging || auxKpcPointerId !== event.pointerId) return;
  event.preventDefault();
  event.stopPropagation();

  if (!auxKpcFullyExtracted) updateAuxKpcExtractionState(event);
  if (auxCardInserted) return;
  stopAuxKpcDrag(event.pointerId);

  // 完全抽出后的第一次松手：先用最终尺寸，再只反转一次成所选正面。
  if (shouldFlipAuxKpcOnRelease()) {
    flipAuxKpcToSelectedCard();
    return;
  }

  // 若最后一帧刚好进入红框，也在 pointerup 再兜底检查一次。
  if (auxKpcFlipped) tryInsertAuxKpcIntoSlot(event);
}
function resetCardGesture() {
  clearTimeout(insertionTimer);
  insertionTimer = 0;
  dragReady = false;
  isDragging = false;
  parallelReached = false;
  activePointerId = null;
  cardTrigger.classList.remove("is-draggable", "is-dragging", "is-replay-waiting");
  cardTrigger.setAttribute("aria-label", "启动卡盒与腰带动画");
  setCardDragPosition(ANIMATION_CONFIG.card.start.x, ANIMATION_CONFIG.card.start.y);
}

function resetToCard() {
  clearSceneTimers();
  clearTimeout(stageTwoAudioFallback);
  stageTwoAudioFallback = 0;
  cancelAnimationFrame(stageTwoSyncFrame);
  stageTwoSyncFrame = 0;
  clearTimeout(stageTwoFlipFallback);
  stageTwoFlipFallback = 0;
  clearTimeout(stageTwoFinishFallback);
  stageTwoFinishFallback = 0;
  clearTimeout(insertionAudioFallback);
  insertionAudioFallback = 0;
  clearTimeout(bg5TransitionTimer);
  bg5TransitionTimer = 0;
  clearTimeout(shatterCleanupTimer);
  shatterCleanupTimer = 0;
  shatterCanvas.classList.remove("is-active");
  if (shatterAnimationFrame) {
    cancelAnimationFrame(shatterAnimationFrame);
    shatterAnimationFrame = 0;
  }
  shatterCanvas.getContext("2d")?.clearRect(0, 0, shatterCanvas.width, shatterCanvas.height);
  cancelAnimationFrame(rippleAnimationFrame);
  cancelCharuBg4Sync();
  waterDisplacement.setAttribute("scale", "0");
  stopAudio(kh1Audio);
  stopAudio(ydMusicAudio);
  stopKacaReliable();
  stopAudio(charuAudio);
  stopAudio(choukaAudio);
  stopAudio(guoAudio);
  stopAudio(huagai1Audio);
  stopAudio(chakaAudio);
  stopAudio(huagai2Audio);
  Object.values(cardVoiceAudios).forEach(stopAudio);
  resetAuxDevice();
  ydMusicInUse = false;
  insertionAudioInUse = false;
  charuFinished = true;
  bg4MergeStarted = false;
  selectedLq = null;
  extractReady = false;
  isExtracting = false;
  extractPointerId = null;
  cardWasExtracted = false;
  extractedStageTwoReplayActive = false;
  reinsertReady = false;
  suppressExtractedCardClick = false;
  setCardExtractPosition(0, 0);
  flowStarted = false;
  resetCardGesture();

  scene.classList.add("is-resetting");
  scene.classList.remove("show-final-background", "show-bg4", "show-bg5", "show-bg3", "show-lq", "is-shattering", "is-aux-open", "is-aux-armed", "is-aux-card-inserted");
  belt.classList.remove("is-ready", "is-stage-two", "is-stage-two-front", "is-moving", "is-card-powered", "is-shatter-hidden");
  cardBox.classList.remove("is-handoff", "is-inserting", "is-inserted", "is-card-powered", "is-extractable", "is-extracting", "is-detached", "is-kpc-ejected", "is-kpc-aux-hidden");
  lqButtons.forEach((button) => button.classList.remove("is-selected"));
  cardTrigger.classList.remove("is-waiting", "is-hidden", "is-replay-waiting");
  void scene.offsetWidth;
  scene.classList.remove("is-resetting");
  cardTrigger.classList.add("is-ready");
}

function completeCardInsertion(pointerId) {
  if (!dragReady || !isDragging || !parallelReached) return;

  dragReady = false;
  isDragging = false;
  cardWasExtracted = false;
  reinsertReady = false;
  extractedStageTwoReplayActive = false;
  bg4MergeStarted = false;
  insertionAudioInUse = false;
  cancelCharuBg4Sync();
  stopKacaReliable();
  stopAudio(charuAudio);
  clearTimeout(bg5TransitionTimer);
  bg5TransitionTimer = 0;
  charuFinished = false;

  if (pointerId !== null && cardTrigger.hasPointerCapture?.(pointerId)) {
    cardTrigger.releasePointerCapture(pointerId);
  }

  // 用当前拖动位置作为腰带内部卡盒的接棒起点，避免跳回旧位置。
  const handoffX = cardDragPosition.x - ANIMATION_CONFIG.move.x;
  const handoffY = cardDragPosition.y - ANIMATION_CONFIG.move.y;
  scene.style.setProperty("--card-handoff-x", `${handoffX * sceneScale}px`);
  scene.style.setProperty("--card-handoff-y", `${handoffY * sceneScale}px`);

  cardBox.classList.remove("is-inserting", "is-inserted", "is-card-powered", "is-extractable", "is-extracting", "is-detached", "is-kpc-ejected");
  setCardExtractPosition(0, 0);
  hideLqPanel();
  belt.classList.remove("is-card-powered");
  cardBox.classList.add("is-handoff");
  void cardBox.offsetWidth;

  cardTrigger.classList.remove("is-draggable", "is-dragging", "is-waiting");
  cardTrigger.classList.add("is-hidden");
  activePointerId = null;

  // iPhone/PWA：插槽命中发生在 pointermove；kaca 不再直接依赖该事件的媒体权限。
  // 首次真实手势已提前建立 WebAudio ready Promise，这里等待准备完成后稳定播放 kaca，再立刻启动 charu。
  playInsertionAudio();

  // 下一绘制帧启动“吸入卡槽”的位移。
  requestAnimationFrame(() => {
    if (!flowStarted) return;

    // 卡盒确认进入凹槽后，背景与插卡位移在同一绘制帧开始变化。
    scene.classList.add("show-final-background");
    cardBox.classList.remove("is-handoff");
    cardBox.classList.add("is-inserting");
    // 插入位移开始的同一帧立即显示 ydfg / khfg，不再等待插入动画完成。
    cardBox.classList.add("is-card-powered");
    belt.classList.add("is-card-powered");
    // bg4 不在插卡瞬间启动；等 charu 真正播放到 1.00 秒再进场。

    insertionTimer = setTimeout(() => {
      cardBox.classList.remove("is-inserting");
      cardBox.classList.add("is-inserted");
    }, ANIMATION_CONFIG.card.duration * 1000);
  });
}

function startBg4Merge() {
  if (!flowStarted || bg4MergeStarted) return;

  bg4MergeStarted = true;
  scene.classList.remove("show-bg3");
  scene.classList.add("show-bg4");

  // Safari 极少数情况下不派发 animationend，按同一时长保底完成换图。
  sceneTimers.push(
    setTimeout(finishBg4Merge, ANIMATION_CONFIG.bg4.duration * 1000 + 80),
  );
}

function finishBg5Transition() {
  if (!flowStarted || !scene.classList.contains("show-bg5")) return;
  scene.classList.remove("show-bg5");
  scene.classList.add("show-bg3");
}

function finishBg4Merge(event) {
  if (event && event.animationName !== "bg4-merge-center") return;
  if (!flowStarted || !bg4MergeStarted || scene.classList.contains("show-bg5") || scene.classList.contains("show-bg3")) return;

  // 四张 bg4 完成汇合后先显示腰带后方的 bg5，并带白色外发光 0.5 秒。
  scene.classList.remove("show-bg4", "show-bg3");
  scene.classList.add("show-bg5");
  clearTimeout(bg5TransitionTimer);
  bg5TransitionTimer = setTimeout(finishBg5Transition, ANIMATION_CONFIG.bg5.duration * 1000);
}

function hideInsertionGlows() {
  charuFinished = true;
  cardBox.classList.remove("is-card-powered");
  belt.classList.remove("is-card-powered");
}

function handleCharuEnded() {
  hideInsertionGlows();
  insertionAudioInUse = false;
  if (!flowStarted) return;
  // charu 真正结束后，左下方六张 lq 入场，同时允许把卡盒从腰带里拖出来。
  showLqPanel();
  enableCardExtraction();
}

function playInsertionAudio() {
  if (!flowStarted || insertionAudioInUse) return;

  clearTimeout(insertionAudioFallback);
  insertionAudioFallback = 0;
  insertionAudioInUse = true;

  stopKacaReliable();
  stopAudio(charuAudio);
  kacaAudio.muted = false;
  charuAudio.muted = false;
  kacaAudio.volume = 1;
  charuAudio.volume = 1;

  // PWA 首次插卡：先等待首次真实用户手势已经建立的 WebAudio ready Promise。
  // 一旦 kaca 的 BufferSource.start() 真正执行，立即启动 charu，保证顺序稳定：kaca -> charu。
  Promise.resolve(playKacaReliable())
    .catch((error) => {
      console.warn("kaca 音效播放失败：", error);
      return false;
    })
    .then(() => {
      if (!flowStarted || !insertionAudioInUse) return;

      let charuPromise;
      try {
        charuPromise = charuAudio.play();
      } catch (error) {
        console.warn("charu 音效播放失败：", error);
        hideInsertionGlows();
        return;
      }

      if (charuPromise instanceof Promise) {
        charuPromise
          .then(() => startCharuBg4Sync())
          .catch((error) => {
            console.warn("charu 音效播放失败：", error);
            hideInsertionGlows();
          });
      } else {
        startCharuBg4Sync();
      }
    });
}

function handleCardTransitionStart(event) {
  if (event.propertyName === "transform" && cardBox.classList.contains("is-inserting")) {
    // 浏览器确认卡盒位移真正开始的同一时刻启动 kaca，再立即启动 charu。
    playInsertionAudio();
  }
}

function enableCardDrag(options = {}) {
  const preservePosition = options.preservePosition ?? cardWasExtracted;
  dragReady = true;
  isDragging = false;
  parallelReached = false;
  if (!preservePosition) {
    setCardDragPosition(ANIMATION_CONFIG.card.start.x, ANIMATION_CONFIG.card.start.y);
  }
  cardTrigger.classList.remove("is-waiting", "is-replay-waiting");
  cardTrigger.classList.add("is-draggable");
  cardTrigger.setAttribute(
    "aria-label",
    reinsertReady
      ? "拖动卡盒至腰带右侧，再插入凹槽"
      : cardWasExtracted
        ? "点击卡盒重新启动第二阶段；也可继续拖动"
        : "按住并拖动卡盒至腰带右侧，再插入凹槽",
  );
}

function handleCardPointerDown(event) {
  if (!dragReady || !cardTrigger.classList.contains("is-draggable")) return;

  // 真实按下手势里再次 resume AudioContext。iOS PWA 从后台恢复后可能重新 suspend。
  unlockSfxAudio();

  event.preventDefault();
  event.stopPropagation();
  activePointerId = event.pointerId;
  pointerStart = { x: event.clientX, y: event.clientY };
  externalCardPointerTravel = 0;
  dragOrigin = { ...cardDragPosition };
  isDragging = true;
  cardTrigger.classList.add("is-dragging");
  cardTrigger.setPointerCapture?.(event.pointerId);
}

function handleCardPointerMove(event) {
  if (!dragReady || activePointerId !== event.pointerId) return;

  const deltaX = event.clientX - pointerStart.x;
  const deltaY = event.clientY - pointerStart.y;
  externalCardPointerTravel = Math.max(externalCardPointerTravel, Math.hypot(deltaX, deltaY));

  event.preventDefault();
  const nextX = Math.max(
    -SOURCE_SCENE.width / 2,
    Math.min(SOURCE_SCENE.width / 2, dragOrigin.x + deltaX / sceneScale),
  );
  const nextY = Math.max(
    -SOURCE_SCENE.height / 2,
    Math.min(SOURCE_SCENE.height / 2, dragOrigin.y + deltaY / sceneScale),
  );
  setCardDragPosition(nextX, nextY);

  const { parallel, slotTolerance } = ANIMATION_CONFIG.card.drag;
  if (
    nextX >= parallel.x - parallel.toleranceX &&
    Math.abs(nextY - parallel.y) <= parallel.toleranceY
  ) {
    parallelReached = true;
  }

  const slotX = ANIMATION_CONFIG.move.x + ANIMATION_CONFIG.card.insert.x;
  const slotY = ANIMATION_CONFIG.move.y + ANIMATION_CONFIG.card.insert.y;
  if (
    (!cardWasExtracted || reinsertReady) &&
    parallelReached &&
    Math.abs(nextX - slotX) <= slotTolerance.x &&
    Math.abs(nextY - slotY) <= slotTolerance.y
  ) {
    completeCardInsertion(event.pointerId);
  }
}

function handleCardPointerEnd(event) {
  if (activePointerId !== event.pointerId) return;

  if (cardTrigger.hasPointerCapture?.(event.pointerId)) {
    cardTrigger.releasePointerCapture(event.pointerId);
  }

  // 松手后保留卡盒当前位置；下次按住时从这里继续拖动。
  isDragging = false;
  activePointerId = null;
  cardTrigger.classList.remove("is-dragging");

  // 抽出后的卡盒既可拖又可点：明显拖动后抑制紧跟着产生的 click，避免误启动第二阶段。
  if (cardWasExtracted && externalCardPointerTravel > 8) {
    suppressExtractedCardClick = true;
    setTimeout(() => {
      suppressExtractedCardClick = false;
    }, 0);
  }
}

function handleExtractPointerDown(event) {
  if (!extractReady || !cardBox.classList.contains("is-extractable")) return;
  if (auxOpen) return;
  if (event.target === kpcLayer && (cardBox.classList.contains("is-kpc-ejected") || auxArmed)) return;

  event.preventDefault();
  event.stopPropagation();
  extractPointerId = event.pointerId;
  extractPointerStart = { x: event.clientX, y: event.clientY };
  extractOrigin = { ...cardExtractPosition };
  isExtracting = true;
  cardBox.classList.add("is-extracting");
  cardBox.setPointerCapture?.(event.pointerId);
}

function handleExtractPointerMove(event) {
  if (!extractReady || !isExtracting || extractPointerId !== event.pointerId) return;
  event.preventDefault();
  event.stopPropagation();

  const deltaX = (event.clientX - extractPointerStart.x) / sceneScale;
  // v61：卡盒插入腰带后只能沿水平方向向右抽出。
  // Y 轴永久锁在卡槽位置，向上/向下拖都不产生视觉位移，也不会再出现松手回弹。
  const nextX = Math.max(0, extractOrigin.x + deltaX);
  setCardExtractPosition(nextX, 0);
}

function completeCardExtraction(pointerId) {
  extractReady = false;
  isExtracting = false;
  cardWasExtracted = true;
  reinsertReady = false;
  extractedStageTwoReplayActive = false;

  if (pointerId !== null && cardBox.hasPointerCapture?.(pointerId)) {
    cardBox.releasePointerCapture(pointerId);
  }

  // 把腰带内部卡盒当前屏幕位置交接给外层 cardTrigger，避免抽出完成时跳位。
  const externalX = ANIMATION_CONFIG.move.x + ANIMATION_CONFIG.card.insert.x + cardExtractPosition.x;
  const externalY = ANIMATION_CONFIG.move.y + ANIMATION_CONFIG.card.insert.y + cardExtractPosition.y;
  setCardDragPosition(externalX, externalY);

  cardBox.classList.remove("is-extracting", "is-extractable", "is-kpc-ejected");
  cardBox.classList.add("is-detached");
  cardTrigger.classList.remove("is-hidden", "is-ready", "is-waiting", "is-dragging");
  cardTrigger.classList.add("is-draggable");
  cardTrigger.setAttribute("aria-label", "点击卡盒重新启动第二阶段；也可继续拖动");
  dragReady = true;
  activePointerId = null;
  parallelReached = false;
  hideLqPanel();

  // 卡盒向右抽出成功：bg3 + 腰带镜面碎裂消失，同时恢复开始时默认背景。
  startMirrorShatter();
}

function handleExtractPointerEnd(event) {
  if (extractPointerId !== event.pointerId) return;

  if (cardBox.hasPointerCapture?.(event.pointerId)) {
    cardBox.releasePointerCapture(event.pointerId);
  }

  const rightDistance = cardExtractPosition.x;
  cardBox.classList.remove("is-extracting");
  isExtracting = false;
  extractPointerId = null;

  // 只有向右拖够阈值才算成功，上下位移不参与抽出判定。
  if (rightDistance >= ANIMATION_CONFIG.card.extract.threshold) {
    completeCardExtraction(event.pointerId);
    return;
  }

  // 未拖够距离则回到腰带卡槽。
  setCardExtractPosition(0, 0);
}

function cancelStageTwoAudioSync() {
  if (stageTwoSyncFrame) {
    cancelAnimationFrame(stageTwoSyncFrame);
    stageTwoSyncFrame = 0;
  }
  clearTimeout(stageTwoFlipFallback);
  stageTwoFlipFallback = 0;
  clearTimeout(stageTwoFinishFallback);
  stageTwoFinishFallback = 0;
}

function showStageTwoFront() {
  if (!flowStarted || !belt.classList.contains("is-stage-two")) return;
  belt.classList.add("is-stage-two-front");
}

function finishStageTwo() {
  if (!flowStarted || !belt.classList.contains("is-stage-two") || belt.classList.contains("is-moving")) return;

  cancelStageTwoAudioSync();
  ydMusicInUse = false;
  belt.classList.add("is-moving");

  const replayWillUnlockReinsert = cardWasExtracted && extractedStageTwoReplayActive;
  const { move } = ANIMATION_CONFIG;
  sceneTimers.push(
    setTimeout(() => {
      // 抽出卡盒后点击重播第二阶段：腰带上移完成后，才解锁再次插入。
      if (replayWillUnlockReinsert) {
        reinsertReady = true;
      }
      enableCardDrag({ preservePosition: cardWasExtracted });
      extractedStageTwoReplayActive = false;
    }, move.duration * 1000),
  );
}

function startStageTwoAudioSync() {
  cancelStageTwoAudioSync();
  const flipAt = ANIMATION_CONFIG.stageTwo.backHold;

  const syncToYdMusic = () => {
    if (!flowStarted || !belt.classList.contains("is-stage-two") || ydMusicAudio.ended) {
      stageTwoSyncFrame = 0;
      return;
    }

    if (!ydMusicAudio.paused && ydMusicAudio.currentTime >= flipAt) {
      stageTwoSyncFrame = 0;
      showStageTwoFront();
      return;
    }

    stageTwoSyncFrame = requestAnimationFrame(syncToYdMusic);
  };

  stageTwoSyncFrame = requestAnimationFrame(syncToYdMusic);
}

function playStageTwoAudio() {
  if (!flowStarted || !belt.classList.contains("is-stage-two") || ydMusicInUse) return;

  clearTimeout(stageTwoAudioFallback);
  stageTwoAudioFallback = 0;
  ydMusicInUse = true;
  ydMusicAudio.muted = false;

  playAudio(ydMusicAudio)
    .then(() => {
      // 翻面时间不再读取 ydmusic.currentTime。
      // 视觉第二阶段从出现那一刻独立计时，避免音频预解锁造成 currentTime 竞态而提前翻面。
    })
    .catch((error) => {
      console.warn("ydmusic 音效播放失败：", error);
      ydMusicInUse = false;

      // 翻面计时已经由 startStageTwo() 启动；这里只保留流程结束兜底。
      stageTwoFinishFallback = setTimeout(finishStageTwo, ANIMATION_CONFIG.sequenceDuration * 1000);
    });
}

function startStageTwo() {
  if (!flowStarted) return;

  // PWA 循环关键修复：每次进入第二阶段都先真正移除 is-stage-two，强制重启
  // belt-materialize / energy-aura / water-roll。否则第二圈 class 没变化，Safari 不会重播波浪 CSS 动画。
  cancelStageTwoAudioSync();
  cancelAnimationFrame(rippleAnimationFrame);
  waterDisplacement.setAttribute("scale", "0");
  belt.classList.remove("is-stage-two", "is-stage-two-front", "is-moving");
  void belt.offsetWidth;
  belt.classList.add("is-ready", "is-stage-two");
  runWaterRipple(performance.now());

  stageTwoFlipFallback = setTimeout(
    showStageTwoFront,
    ANIMATION_CONFIG.stageTwo.backHold * 1000,
  );

  // 音效仍在第二阶段出现时启动，但只负责声音和结束点，不再决定翻面起点。
  playStageTwoAudio();

  // Safari 极端情况下 play 调用没有正常推进时的启动保底。
  stageTwoAudioFallback = setTimeout(playStageTwoAudio, 80);
}

function finishFirstStage() {
  if (!flowStarted || belt.classList.contains("is-stage-two")) return;

  stopAudio(kh1Audio);
  startStageTwo();
}

function replayStageTwoFromExtractedCard(event) {
  if (!flowStarted || !cardWasExtracted || extractedStageTwoReplayActive || reinsertReady) return;
  if (suppressExtractedCardClick) return;

  event?.preventDefault();
  event?.stopPropagation();
  extractedStageTwoReplayActive = true;
  reinsertReady = false;

  // 第二阶段播放期间锁住外部卡盒位置；音效结束 + 腰带上移完成后再允许拖动插入。
  dragReady = false;
  isDragging = false;
  activePointerId = null;
  cardTrigger.classList.remove("is-draggable", "is-dragging");
  cardTrigger.classList.add("is-replay-waiting");
  cardTrigger.setAttribute("aria-label", "第二阶段播放中，完成后可重新插入卡盒");

  clearMirrorShatter();
  hideLqPanel();
  scene.classList.remove("show-bg4", "show-bg5", "show-bg3", "show-final-background", "is-shattering");
  belt.classList.remove("is-moving", "is-card-powered", "is-stage-two-front", "is-shatter-hidden");
  cardBox.classList.remove("is-card-powered", "is-kpc-ejected");

  stopAudio(ydMusicAudio);
  ydMusicInUse = false;
  startStageTwo();
}

function startFromCard(event) {
  event?.stopPropagation();

  // 卡盒已经从腰带抽出后，再点击同一张卡盒，直接重新播放第二阶段。
  if (cardWasExtracted && !reinsertReady && cardTrigger.classList.contains("is-draggable")) {
    replayStageTwoFromExtractedCard(event);
    return;
  }

  if (flowStarted || !cardTrigger.classList.contains("is-ready")) {
    return;
  }

  flowStarted = true;
  cardTrigger.classList.remove("is-ready");
  cardTrigger.classList.add("is-waiting");

  // 在 iPhone 的真实点击手势中预解锁后续自动音效。
  ydMusicInUse = false;
  insertionAudioInUse = false;
  unlockSfxAudio();
  preloadKacaBytes();
  primeAudio(ydMusicAudio, () => ydMusicInUse);
  // kaca 不再对同一个 HTMLAudio 做异步 prime，避免和真正插卡播放发生竞态。
  primeAudio(charuAudio, () => insertionAudioInUse);

  playAudio(kh1Audio).catch((error) => {
    console.warn("kh1 音效播放失败：", error);
    // 音效无法播放时不让流程停顿，立即进入第二阶段。
    finishFirstStage();
  });

  sceneTimers.push(
    setTimeout(() => {
      // 仅作为最大等待时间与 Safari ended 事件异常时的保底。
      finishFirstStage();
    }, ANIMATION_CONFIG.firstStageDuration * 1000),
  );
}

async function waitForSceneImages() {
  await Promise.all(
    sceneImages.map((image) => {
      const loaded = image.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
        });

      return loaded.then(() => image.decode?.().catch(() => undefined));
    }),
  );
}

waitForSceneImages().then(() => {
  applyPhoneLayout();
  requestAnimationFrame(resetToCard);
});

cardTrigger.addEventListener("click", startFromCard);
cardTrigger.addEventListener("pointerdown", handleCardPointerDown);
cardTrigger.addEventListener("pointermove", handleCardPointerMove);
cardTrigger.addEventListener("pointerup", handleCardPointerEnd);
cardTrigger.addEventListener("pointercancel", handleCardPointerEnd);
cardTrigger.addEventListener("contextmenu", (event) => event.preventDefault());
kh1Audio.addEventListener("ended", finishFirstStage);
ydMusicAudio.addEventListener("ended", finishStageTwo);
charuAudio.addEventListener("ended", handleCharuEnded);
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
cardBox.addEventListener("transitionstart", handleCardTransitionStart);
cardBox.addEventListener("webkitTransitionStart", handleCardTransitionStart);
cardBox.addEventListener("pointerdown", handleExtractPointerDown);
cardBox.addEventListener("pointermove", handleExtractPointerMove);
cardBox.addEventListener("pointerup", handleExtractPointerEnd);
cardBox.addEventListener("pointercancel", handleExtractPointerEnd);
cardBox.addEventListener("contextmenu", (event) => event.preventDefault());
lqButtons.forEach((button) => button.addEventListener("click", selectLqCard));
kpcLayer.addEventListener("pointerdown", (event) => {
  if (auxOpen && auxArmed) {
    beginAuxKpcDrag(event, false);
    return;
  }
  if (cardBox.classList.contains("is-kpc-ejected")) event.stopPropagation();
});
auxTransferCard?.addEventListener("pointerdown", (event) => beginAuxKpcDrag(event, true));

// PWA / iPhone Safari 优先：拖动生命周期统一由 window 捕获。
// 这样卡片从卡盒内层切换为浮动层时，不依赖 DOM 中途转移 pointer capture。
// 只有 auxKpcDragging=true 时处理，所以不会干扰页面其他 pointer 交互。
window.addEventListener("pointermove", moveAuxKpcDrag, { capture: true, passive: false });
window.addEventListener("pointerup", endAuxKpcDrag, { capture: true, passive: false });
window.addEventListener("pointercancel", endAuxKpcDrag, { capture: true, passive: false });
sideButtons[0]?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  playAudio(guoAudio).catch((error) => {
    console.warn("guo 音效播放失败：", error);
  });
});
auxTransferCard?.addEventListener("contextmenu", (event) => event.preventDefault());
bsButton?.addEventListener("click", toggleAuxDock);
lzjButton?.addEventListener("click", handleLzjClick);
bg4Center.addEventListener("animationend", finishBg4Merge);
bg4Center.addEventListener("webkitAnimationEnd", finishBg4Merge);
applyPhoneLayout();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js?v=80", { updateViaCache: "none" })
      .catch((error) => {
        console.warn("PWA 离线服务注册失败：", error);
      });
  });
}
