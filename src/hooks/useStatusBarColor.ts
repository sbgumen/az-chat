import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

// 相对亮度算法: 判断颜色是浅色还是深色
function isLightColor(hex: string): boolean {
  try {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
    return luminance > 140; // 亮色阈值
  } catch { return true; }
}

// 适配状态栏: 背景色 + 自动明暗图标
export function useStatusBarColor(bgColor: string) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const light = isLightColor(bgColor);
    try {
      StatusBar.setBackgroundColor({ color: bgColor });
      StatusBar.setStyle({ style: light ? Style.Light : Style.Dark });
    } catch {}
  }, [bgColor]);
}

// 从 CSS 变量 --page-top-color 自动读取并适配
export function useAutoStatusBar() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const color = getComputedStyle(document.documentElement).getPropertyValue('--page-top-color').trim();
    if (color) {
      const light = isLightColor(color);
      try {
        StatusBar.setBackgroundColor({ color });
        StatusBar.setStyle({ style: light ? Style.Light : Style.Dark });
      } catch {}
    }
  });
}
