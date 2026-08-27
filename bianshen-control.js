/*
 * Ryuki 初始腰带卡盒轻点音效。
 *
 * 交互直接沿用 OUJA 的“腰带上移完成后，下一次轻点卡盒只播放一次音效”逻辑：
 * - 只有初始流程第二阶段结束、腰带上移完成并进入 CARD_DRAG 后才开放。
 * - 真正轻点卡盒播放一次 bianshen。
 * - 手指移动超过 8px 视为拖动，不播放，也不消耗这次轻点机会。
 * - 初始这一轮只触发一次；卡盒已经抽出后的后续循环不触发。
 */
const bianshenCardTrigger = document.getElementById("cardTrigger");
const bianshenAudio = new Audio("./assets/audio/bianshen.mp3");
bianshenAudio.preload = "auto";
bianshenAudio.load();

const BIANSHEN_TAP_MAX_TRAVEL = 8;
let postMoveBianshenReady = false;
let postMoveBianshenPlayed = false;
let bianshenPointerId = null;
let bianshenPointerStart = null;
let bianshenPointerTravel = 0;

function resetPostMoveBianshenState() {
  postMoveBianshenReady = false;
  postMoveBianshenPlayed = false;
  bianshenPointerId = null;
  bianshenPointerStart = null;
  bianshenPointerTravel = 0;
  if (typeof stopAudio === "function") stopAudio(bianshenAudio);
}

function syncPostMoveBianshenState() {
  if (!bianshenCardTrigger) return;

  // App 回到最初卡盒状态时，下一整轮重新允许一次 bianshen。
  if (
    typeof isFlowPhase === "function" &&
    typeof FLOW_PHASE !== "undefined" &&
    isFlowPhase(FLOW_PHASE.IDLE) &&
    bianshenCardTrigger.classList.contains("is-ready")
  ) {
    if (postMoveBianshenReady || postMoveBianshenPlayed) {
      resetPostMoveBianshenState();
    }
    return;
  }

  // 与 OUJA 相同：要等第二阶段结束、腰带上移停止、外部卡盒正式可拖动以后，
  // 下一次轻点才有资格播放。这里只允许最开始这一轮，抽出卡盒后的循环不重复播放。
  if (
    !postMoveBianshenPlayed &&
    typeof isFlowPhase === "function" &&
    typeof FLOW_PHASE !== "undefined" &&
    isFlowPhase(FLOW_PHASE.CARD_DRAG) &&
    bianshenCardTrigger.classList.contains("is-draggable") &&
    (typeof cardWasExtracted === "undefined" || !cardWasExtracted)
  ) {
    postMoveBianshenReady = true;
  }
}

function playPostMoveBianshen() {
  postMoveBianshenReady = false;
  postMoveBianshenPlayed = true;

  if (typeof playAudio === "function") {
    playAudio(bianshenAudio).catch((error) => {
      console.warn("腰带出现后 bianshen 音效播放失败：", error);
    });
    return;
  }

  try {
    bianshenAudio.currentTime = 0;
  } catch {}
  bianshenAudio.play().catch((error) => {
    console.warn("腰带出现后 bianshen 音效播放失败：", error);
  });
}

bianshenCardTrigger?.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  syncPostMoveBianshenState();
  if (!postMoveBianshenReady || postMoveBianshenPlayed) return;

  bianshenPointerId = event.pointerId;
  bianshenPointerStart = { x: event.clientX, y: event.clientY };
  bianshenPointerTravel = 0;
});

bianshenCardTrigger?.addEventListener("pointermove", (event) => {
  if (event.pointerId !== bianshenPointerId || !bianshenPointerStart) return;

  const dx = event.clientX - bianshenPointerStart.x;
  const dy = event.clientY - bianshenPointerStart.y;
  bianshenPointerTravel = Math.max(bianshenPointerTravel, Math.hypot(dx, dy));
});

bianshenCardTrigger?.addEventListener("pointerup", (event) => {
  if (event.pointerId !== bianshenPointerId) return;

  const wasLightTap = bianshenPointerTravel <= BIANSHEN_TAP_MAX_TRAVEL;
  bianshenPointerId = null;
  bianshenPointerStart = null;

  if (
    wasLightTap &&
    postMoveBianshenReady &&
    !postMoveBianshenPlayed &&
    typeof isFlowPhase === "function" &&
    typeof FLOW_PHASE !== "undefined" &&
    isFlowPhase(FLOW_PHASE.CARD_DRAG) &&
    (typeof cardWasExtracted === "undefined" || !cardWasExtracted)
  ) {
    playPostMoveBianshen();
  }
});

bianshenCardTrigger?.addEventListener("pointercancel", (event) => {
  if (event.pointerId !== bianshenPointerId) return;
  bianshenPointerId = null;
  bianshenPointerStart = null;
  bianshenPointerTravel = 0;
});

// flowPhase 会写进 scene.dataset，卡盒可拖状态也通过 class 更新。
// 监听这两个 DOM 状态即可精准复用 OUJA 的“移动完成后才开放一次轻点”时机，
// 不额外改 Ryuki 主流程，也不会干扰现有拖动、插卡和音效链路。
const bianshenScene = document.getElementById("scene");
const bianshenStateObserver = new MutationObserver(syncPostMoveBianshenState);
if (bianshenScene) {
  bianshenStateObserver.observe(bianshenScene, {
    attributes: true,
    attributeFilter: ["data-flow-phase"],
  });
}
if (bianshenCardTrigger) {
  bianshenStateObserver.observe(bianshenCardTrigger, {
    attributes: true,
    attributeFilter: ["class"],
  });
}

syncPostMoveBianshenState();
