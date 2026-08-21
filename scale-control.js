/*
 * Ryuki 独立缩放参数
 *
 * 1.0 = 当前尺寸
 * 0.9 = 当前尺寸的 90%
 * 1.1 = 当前尺寸的 110%
 *
 * 只改下面这 6 个数字即可。
 * 默认全部 1.0，所以上传后不会改变你现在已经调好的大小与位置。
 */
const RYUKI_SCALE_CONFIG = {
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

  const mapping = {
    belt: "--ryuki-belt-scale",
    cardBox: "--ryuki-card-box-scale",
    bg3: "--ryuki-bg3-scale",
    bg4: "--ryuki-bg4-scale",
    bg5: "--ryuki-bg5-scale",
    auxDevice: "--ryuki-aux-device-scale",
  };

  for (const [key, cssVariable] of Object.entries(mapping)) {
    scene.style.setProperty(cssVariable, String(clampScale(RYUKI_SCALE_CONFIG[key])));
  }
}

/*
 * 保留一个全局入口，方便临时在 Safari/Chrome 控制台调尺寸：
 *
 * applyRyukiScaleConfig({ belt: 0.9, bg4: 1.08 });
 *
 * 刷新页面后仍以文件顶部的 RYUKI_SCALE_CONFIG 为准。
 */
window.RYUKI_SCALE_CONFIG = RYUKI_SCALE_CONFIG;
window.applyRyukiScaleConfig = applyRyukiScaleConfig;

applyRyukiScaleConfig();
