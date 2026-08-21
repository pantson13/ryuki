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
  global: 0.9,     // 总缩放：一次控制下面所有项目

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
