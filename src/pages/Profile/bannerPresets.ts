export interface BannerPreset {
  name: string;
  style: React.CSSProperties;
}

export const BANNER_PRESETS: Record<string, BannerPreset> = {
  sunrise: {
    name: '暖色晨曦',
    style: {
      backgroundImage: `
        radial-gradient(circle 180px at 50% 120%, rgba(255,200,140,0.6) 0%, rgba(245,180,130,0.3) 30%, transparent 60%),
        radial-gradient(circle 60px at 50% 70%, rgba(255,220,160,0.9) 0%, rgba(255,200,140,0.4) 40%, transparent 70%),
        linear-gradient(180deg, #fce4c8 0%, #f5d5b0 25%, #e8c8a0 55%, #d4a574 100%)
      `.replace(/\n\s*/g, ' ') as any,
    },
  },
  mountain: {
    name: '晨雾山影',
    style: {
      backgroundImage: `
        linear-gradient(180deg, #dce8f0 0%, #c8d8e0 20%, #d8e4ec 45%, #b0c8d8 65%, #a0b8c8 100%)
      `.replace(/\n\s*/g, ' ') as any,
    },
  },
  flow: {
    name: '暖沐流光',
    style: {
      backgroundImage: `
        radial-gradient(circle at 15% 25%, rgba(255,255,255,0.35) 0%, transparent 28%),
        radial-gradient(circle at 70% 55%, rgba(255,255,255,0.25) 0%, transparent 22%),
        radial-gradient(circle at 45% 70%, rgba(255,255,255,0.2) 0%, transparent 18%),
        radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 12%),
        linear-gradient(135deg, #e8d0b8 0%, #dcc4a8 30%, #d4b898 60%, #c8a880 100%)
      `.replace(/\n\s*/g, ' ') as any,
    },
  },
  starry: {
    name: '星夜幕色',
    style: {
      backgroundImage: `
        radial-gradient(1.5px 1.5px at 10% 15%, rgba(255,255,255,0.9) 0%, transparent 100%),
        radial-gradient(1px 1px at 25% 28%, rgba(255,255,255,0.7) 0%, transparent 100%),
        radial-gradient(1.5px 1.5px at 42% 10%, rgba(255,255,255,0.8) 0%, transparent 100%),
        radial-gradient(1px 1px at 58% 35%, rgba(255,255,255,0.5) 0%, transparent 100%),
        radial-gradient(2px 2px at 72% 18%, rgba(255,255,255,0.9) 0%, transparent 100%),
        radial-gradient(1px 1px at 85% 30%, rgba(255,255,255,0.6) 0%, transparent 100%),
        radial-gradient(1.5px 1.5px at 15% 50%, rgba(255,255,255,0.4) 0%, transparent 100%),
        radial-gradient(1px 1px at 65% 55%, rgba(255,255,255,0.5) 0%, transparent 100%),
        radial-gradient(2px 2px at 90% 60%, rgba(255,255,255,0.7) 0%, transparent 100%),
        linear-gradient(180deg, #0f0f2a 0%, #1a1a3a 30%, #252040 55%, #2d1f3d 75%, #3d2e4a 100%)
      `.replace(/\n\s*/g, ' ') as any,
    },
  },
  sakura: {
    name: '樱吹雪',
    style: {
      backgroundImage: `
        radial-gradient(circle at 15% 20%, rgba(255,200,210,0.5) 0%, transparent 14%),
        radial-gradient(circle at 55% 35%, rgba(255,200,210,0.4) 0%, transparent 11%),
        radial-gradient(circle at 78% 15%, rgba(255,200,210,0.45) 0%, transparent 10%),
        radial-gradient(circle at 30% 55%, rgba(255,200,210,0.3) 0%, transparent 16%),
        radial-gradient(circle at 65% 60%, rgba(255,200,210,0.35) 0%, transparent 13%),
        radial-gradient(circle at 88% 50%, rgba(255,200,210,0.25) 0%, transparent 12%),
        linear-gradient(135deg, #fdf0f4 0%, #f5e0e8 25%, #f0d0dc 55%, #e8c8d4 100%)
      `.replace(/\n\s*/g, ' ') as any,
    },
  },
  forest: {
    name: '林间晨光',
    style: {
      backgroundImage: `
        radial-gradient(ellipse 60% 30% at 50% 20%, rgba(255,245,210,0.5) 0%, transparent 60%),
        radial-gradient(ellipse 40% 20% at 30% 25%, rgba(255,245,210,0.3) 0%, transparent 50%),
        linear-gradient(180deg, #e8f0e0 0%, #dce8d4 20%, #d4e0c8 45%, #c8d8b8 65%, #bcd0a8 85%, #b0c89c 100%)
      `.replace(/\n\s*/g, ' ') as any,
    },
  },
};
