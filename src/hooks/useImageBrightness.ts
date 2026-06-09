import { useState, useEffect } from 'react';

// 预设横幅基色
const PRESET_COLORS: Record<string, { r: number; g: number; b: number }> = {
  sunrise: { r: 180, g: 80,  b: 40  },
  mountain: { r: 180, g: 200, b: 210 },
  flow:     { r: 240, g: 220, b: 195 },
  starry:   { r: 15,  g: 20,  b: 40  },
  sakura:   { r: 245, g: 180, b: 200 },
  forest:   { r: 30,  g: 80,  b: 50  },
};

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h: number, s: number, l: number) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

// WCAG 对比度
function contrastRatio(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) {
  const l1 = relativeLum(r1, g1, b1);
  const l2 = relativeLum(r2, g2, b2);
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
function relativeLum(r: number, g: number, b: number) {
  const [rs, gs, bs] = [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// 计算最佳协调图标色
function computeIdealColor(bgR: number, bgG: number, bgB: number) {
  const bgHsl = rgbToHsl(bgR, bgG, bgB);
  const isDarkBg = bgHsl.l < 40;

  // 从背景色出发，色调偏移找协调方向
  // 天蓝/蓝紫 → 互补暖橙；暖橙/红 → 互补青蓝；中性色 → 同色系深/浅
  const bgHue = bgHsl.h;
  let targetHue: number;
  let targetSat: number;

  if (bgHsl.s < 15) {
    // 低饱和度（灰/白/黑）→ 保持原色调，只调整明度
    targetHue = bgHue || 200;
    targetSat = 10;
  } else if (bgHue >= 160 && bgHue <= 260) {
    // 蓝紫区域 → 暖橙互补
    targetHue = (bgHue + 150) % 360;
    targetSat = Math.min(bgHsl.s * 0.7, 50);
  } else if (bgHue >= 0 && bgHue <= 40 || bgHue >= 320) {
    // 红橙区域 → 青蓝互补
    targetHue = (bgHue + 170) % 360;
    targetSat = Math.min(bgHsl.s * 0.7, 50);
  } else if (bgHue >= 80 && bgHue <= 150) {
    // 绿区域 → 紫红互补
    targetHue = (bgHue + 140) % 360;
    targetSat = Math.min(bgHsl.s * 0.6, 45);
  } else {
    // 中性色 → 小角度偏移同色系
    targetHue = (bgHue + 30) % 360;
    targetSat = Math.min(bgHsl.s * 0.5, 40);
  }

  // 明度：暗背景 → 高亮；亮背景 → 低暗
  const targetLight = isDarkBg ? 85 : 20;

  // 迭代微调确保对比度 >= 4.5
  let bestR = 0, bestG = 0, bestB = 0, bestRatio = 0;
  for (let dl = -5; dl <= 5; dl++) {
    for (let ds = -10; ds <= 10; ds += 5) {
      const l = Math.max(5, Math.min(95, targetLight + dl));
      const s = Math.max(5, Math.min(80, targetSat + ds));
      const c = hslToRgb(targetHue, s, l);
      const ratio = contrastRatio(c.r, c.g, c.b, bgR, bgG, bgB);
      if (ratio > bestRatio && ratio >= 4.0) {
        bestRatio = ratio;
        bestR = c.r; bestG = c.g; bestB = c.b;
      }
    }
  }

  // 回退：确保至少有这个色
  if (bestRatio < 3.0) {
    if (isDarkBg) { bestR = 240; bestG = 240; bestB = 245; }
    else { bestR = 30; bestG = 30; bestB = 35; }
  }

  return {
    iconColor: `rgb(${bestR},${bestG},${bestB})`,
    isDarkBg,
  };
}

export function useImageBrightness(imageUrl: string | null | undefined, preset?: string | null) {
  const [iconStyle, setIconStyle] = useState(() => {
    const c = preset && PRESET_COLORS[preset] ? PRESET_COLORS[preset] : { r: 200, g: 180, b: 160 };
    return computeIdealColor(c.r, c.g, c.b);
  });

  useEffect(() => {
    if (preset) {
      const c = PRESET_COLORS[preset];
      if (c) { setIconStyle(computeIdealColor(c.r, c.g, c.b)); return; }
    }
    if (!imageUrl) {
      setIconStyle(computeIdealColor(200, 180, 160));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const s = 40; canvas.width = s; canvas.height = s;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      let tr = 0, tg = 0, tb = 0, n = 0;
      try {
        ctx.drawImage(img, 0, 0, s, s, 0, 0, s, s);
        const d = ctx.getImageData(0, 0, s, s).data;
        for (let i = 0; i < d.length; i += 20) {
          tr += d[i]; tg += d[i + 1]; tb += d[i + 2]; n++;
        }
      } catch {}
      if (n > 0) setIconStyle(computeIdealColor(Math.round(tr/n), Math.round(tg/n), Math.round(tb/n)));
    };
    img.src = imageUrl;
    return () => { img.onload = null; };
  }, [imageUrl, preset]);

  return iconStyle;
}
