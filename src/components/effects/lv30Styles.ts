export type HomeStyle = 'original' | 'golden' | 'sakura' | 'crystal' | 'aurora' | 'neon';

export interface StylePalette {
  name: string;
  label: string;
  desc: string;
  unlockLevel: number;
  isDark: boolean;
  bgBase: string;
  bgGradient: string;
  // 极光背景层
  aurora1: string;
  aurora2: string;
  aurora3: string;
  aurora4: string;
  // 头像环
  ringOuter: string;
  ringMiddle: string;
  ringInner: string;
  // 粒子颜色
  particleColors: string[];
  // 预览用纯色
  previewPrimary: string;
  previewSecondary: string;
  previewText: string;
  // 卡片强调色
  cardAccent: string;
  // 按钮
  btnBg: string;
  btnText: string;
  btnMsgGradient: string;
  btnDelBg: string;
  btnDelText: string;
  // 底部栏
  bottomBarBg: string;
  // 标签
  tagBg: string;
  tagText: string;
  // 昵称渐变
  nameGradient: string;
  nameShadow: string;
}

export const HOME_STYLES: Record<HomeStyle, StylePalette> = {
  original: {
    name: 'original',
    label: '原版经典',
    desc: '温暖奶油色主题',
    unlockLevel: 1,
    isDark: false,
    bgBase: '#f5efe4',
    bgGradient: '#f5efe4',
    aurora1: 'radial-gradient(ellipse 60% 50% at 35% 45%, rgba(200,149,108,0.10) 0%, transparent 70%)',
    aurora2: 'radial-gradient(ellipse 65% 55% at 60% 50%, rgba(232,184,154,0.08) 0%, transparent 70%)',
    aurora3: 'transparent',
    aurora4: 'transparent',
    ringOuter: 'conic-gradient(from 0deg, rgba(200,149,108,0.5), rgba(232,184,154,0.4), rgba(200,149,108,0.5))',
    ringMiddle: 'conic-gradient(from 180deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1), rgba(255,255,255,0.4))',
    ringInner: 'conic-gradient(from 90deg, rgba(200,149,108,0.4), rgba(255,255,255,0.3), rgba(200,149,108,0.4))',
    particleColors: ['rgba(200,149,108,0.15)', 'rgba(232,184,154,0.12)', 'rgba(200,149,108,0.1)'],
    previewPrimary: '#c8956c',
    previewSecondary: '#e8b89a',
    previewText: '#5c4330',
    cardAccent: '#c8956c',
    btnBg: 'bg-white text-cream-900 hover:bg-cream-100',
    btnText: '#3d2b1a',
    btnMsgGradient: 'bg-gradient-to-r from-warm-500 to-warm-600 text-white shadow-medium',
    btnDelBg: 'bg-white text-red-500 hover:bg-red-50',
    btnDelText: '#ef4444',
    bottomBarBg: 'rgba(245,240,235,0.9)',
    tagBg: 'rgba(200,149,108,0.08)',
    tagText: '#8b6f50',
    nameGradient: '#3d2b1a',
    nameShadow: 'none',
  },

  golden: {
    name: 'golden',
    label: '鎏金暖阳',
    desc: '落日余晖，奢华金质光泽',
    unlockLevel: 20,
    isDark: true,
    bgBase: '#2a1a06',
    bgGradient: 'linear-gradient(160deg, #2a1a06 0%, #3d2810 50%, #1f1204 100%)',
    aurora1: 'radial-gradient(ellipse 55% 50% at 30% 40%, rgba(251,191,36,0.75) 0%, rgba(245,158,11,0.45) 45%, transparent 70%)',
    aurora2: 'radial-gradient(ellipse 55% 50% at 65% 50%, rgba(249,115,22,0.6) 0%, rgba(251,191,36,0.35) 50%, transparent 70%)',
    aurora3: 'radial-gradient(ellipse 40% 40% at 50% 50%, rgba(245,158,11,0.45) 0%, transparent 65%)',
    aurora4: 'radial-gradient(ellipse 40% 40% at 50% 55%, rgba(252,211,77,0.4) 0%, transparent 60%)',
    ringOuter: 'conic-gradient(from 0deg, rgba(251,191,36,0.85), rgba(245,158,11,0.6), rgba(251,191,36,0.85))',
    ringMiddle: 'conic-gradient(from 180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.1), rgba(253,224,170,0.4), rgba(255,255,255,0.1), rgba(255,255,255,0.55))',
    ringInner: 'conic-gradient(from 90deg, rgba(251,191,36,0.6), rgba(255,255,255,0.4), rgba(251,191,36,0.6), rgba(255,255,255,0.2), rgba(251,191,36,0.6))',
    particleColors: ['rgba(251,191,36,0.3)', 'rgba(245,158,11,0.25)', 'rgba(252,211,77,0.2)'],
    previewPrimary: '#fbbf24',
    previewSecondary: '#f97316',
    previewText: '#fef3c7',
    cardAccent: '#fbbf24',
    btnBg: 'bg-amber-500/80 text-white hover:bg-amber-500',
    btnText: '#ffffff',
    btnMsgGradient: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg',
    btnDelBg: 'bg-white/10 text-red-300 hover:bg-red-500/20',
    btnDelText: '#fca5a5',
    bottomBarBg: 'rgba(42,26,6,0.85)',
    tagBg: 'rgba(251,191,36,0.15)',
    tagText: 'rgba(253,230,138,0.9)',
    nameGradient: 'linear-gradient(90deg, #fef3c7, #fcd34d, #f59e0b, #fef3c7)',
    nameShadow: 'drop-shadow(0 0 10px rgba(251,191,36,0.45))',
  },

  sakura: {
    name: 'sakura',
    label: '樱吹雪',
    desc: '樱花飘落，梦幻柔粉诗意',
    unlockLevel: 25,
    isDark: true,
    bgBase: '#2a1018',
    bgGradient: 'linear-gradient(160deg, #2a1018 0%, #381a24 50%, #200e14 100%)',
    aurora1: 'radial-gradient(ellipse 55% 50% at 30% 40%, rgba(244,114,182,0.75) 0%, rgba(251,207,232,0.4) 45%, transparent 70%)',
    aurora2: 'radial-gradient(ellipse 55% 50% at 65% 50%, rgba(236,72,153,0.6) 0%, rgba(244,114,182,0.35) 50%, transparent 70%)',
    aurora3: 'radial-gradient(ellipse 40% 40% at 50% 50%, rgba(251,207,232,0.45) 0%, transparent 65%)',
    aurora4: 'radial-gradient(ellipse 40% 40% at 50% 55%, rgba(244,114,182,0.35) 0%, transparent 60%)',
    ringOuter: 'conic-gradient(from 0deg, rgba(244,114,182,0.85), rgba(236,72,153,0.6), rgba(244,114,182,0.85))',
    ringMiddle: 'conic-gradient(from 180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.1), rgba(251,207,232,0.4), rgba(255,255,255,0.1), rgba(255,255,255,0.55))',
    ringInner: 'conic-gradient(from 90deg, rgba(251,207,232,0.6), rgba(255,255,255,0.4), rgba(251,207,232,0.6), rgba(255,255,255,0.2), rgba(251,207,232,0.6))',
    particleColors: ['rgba(244,114,182,0.3)', 'rgba(251,207,232,0.25)', 'rgba(236,72,153,0.2)'],
    previewPrimary: '#f472b6',
    previewSecondary: '#ec4899',
    previewText: '#fce7f3',
    cardAccent: '#f472b6',
    btnBg: 'bg-pink-500/80 text-white hover:bg-pink-500',
    btnText: '#ffffff',
    btnMsgGradient: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg',
    btnDelBg: 'bg-white/10 text-red-300 hover:bg-red-500/20',
    btnDelText: '#fca5a5',
    bottomBarBg: 'rgba(42,16,24,0.85)',
    tagBg: 'rgba(244,114,182,0.15)',
    tagText: 'rgba(251,207,232,0.9)',
    nameGradient: 'linear-gradient(90deg, #fce7f3, #f9a8d4, #f472b6, #fce7f3)',
    nameShadow: 'drop-shadow(0 0 10px rgba(244,114,182,0.45))',
  },

  crystal: {
    name: 'crystal',
    label: '水晶棱镜',
    desc: '紫晶折射，深邃优雅',
    unlockLevel: 30,
    isDark: true,
    bgBase: '#160a2e',
    bgGradient: 'linear-gradient(160deg, #160a2e 0%, #201440 50%, #120820 100%)',
    aurora1: 'radial-gradient(ellipse 55% 50% at 30% 40%, rgba(139,92,246,0.8) 0%, rgba(167,139,250,0.45) 45%, transparent 70%)',
    aurora2: 'radial-gradient(ellipse 55% 50% at 65% 55%, rgba(236,72,153,0.6) 0%, rgba(245,158,11,0.35) 50%, transparent 70%)',
    aurora3: 'radial-gradient(ellipse 45% 40% at 50% 50%, rgba(167,139,250,0.5) 0%, transparent 65%)',
    aurora4: 'radial-gradient(ellipse 40% 40% at 45% 60%, rgba(59,130,246,0.45) 0%, transparent 55%)',
    ringOuter: 'conic-gradient(from 0deg, rgba(167,139,250,0.85), rgba(139,92,246,0.6), rgba(167,139,250,0.85))',
    ringMiddle: 'conic-gradient(from 180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.1), rgba(221,214,254,0.4), rgba(255,255,255,0.1), rgba(255,255,255,0.55))',
    ringInner: 'conic-gradient(from 90deg, rgba(196,181,253,0.55), rgba(255,255,255,0.4), rgba(196,181,253,0.55), rgba(255,255,255,0.2), rgba(196,181,253,0.55))',
    particleColors: ['rgba(167,139,250,0.3)', 'rgba(221,214,254,0.25)', 'rgba(139,92,246,0.2)'],
    previewPrimary: '#8b5cf6',
    previewSecondary: '#a78bfa',
    previewText: '#ddd6fe',
    cardAccent: '#8b5cf6',
    btnBg: 'bg-violet-500/80 text-white hover:bg-violet-500',
    btnText: '#ffffff',
    btnMsgGradient: 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg',
    btnDelBg: 'bg-white/10 text-red-300 hover:bg-red-500/20',
    btnDelText: '#fca5a5',
    bottomBarBg: 'rgba(22,10,46,0.85)',
    tagBg: 'rgba(167,139,250,0.15)',
    tagText: 'rgba(221,214,254,0.9)',
    nameGradient: 'linear-gradient(90deg, #ddd6fe, #c4b5fd, #fde68a, #ddd6fe)',
    nameShadow: 'drop-shadow(0 0 10px rgba(139,92,246,0.4))',
  },

  aurora: {
    name: 'aurora',
    label: '极光幻境',
    desc: '北极流光，空灵静谧',
    unlockLevel: 30,
    isDark: true,
    bgBase: '#0a1a18',
    bgGradient: 'linear-gradient(160deg, #0a1a18 0%, #0f2824 50%, #081412 100%)',
    aurora1: 'radial-gradient(ellipse 55% 50% at 30% 40%, rgba(52,211,153,0.7) 0%, rgba(16,185,129,0.4) 45%, transparent 70%)',
    aurora2: 'radial-gradient(ellipse 55% 50% at 65% 50%, rgba(6,182,212,0.6) 0%, rgba(34,211,238,0.35) 50%, transparent 70%)',
    aurora3: 'radial-gradient(ellipse 45% 45% at 50% 50%, rgba(167,243,208,0.45) 0%, transparent 60%)',
    aurora4: 'radial-gradient(ellipse 40% 40% at 55% 55%, rgba(56,189,248,0.4) 0%, transparent 55%)',
    ringOuter: 'conic-gradient(from 0deg, rgba(52,211,153,0.8), rgba(16,185,129,0.55), rgba(6,182,212,0.6), rgba(52,211,153,0.8))',
    ringMiddle: 'conic-gradient(from 180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.1), rgba(167,243,208,0.4), rgba(255,255,255,0.1), rgba(255,255,255,0.55))',
    ringInner: 'conic-gradient(from 90deg, rgba(110,231,183,0.5), rgba(255,255,255,0.4), rgba(110,231,183,0.5), rgba(255,255,255,0.2), rgba(110,231,183,0.5))',
    particleColors: ['rgba(52,211,153,0.3)', 'rgba(167,243,208,0.25)', 'rgba(6,182,212,0.2)'],
    previewPrimary: '#10b981',
    previewSecondary: '#06b6d4',
    previewText: '#a7f3d0',
    cardAccent: '#10b981',
    btnBg: 'bg-emerald-500/80 text-white hover:bg-emerald-500',
    btnText: '#ffffff',
    btnMsgGradient: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg',
    btnDelBg: 'bg-white/10 text-red-300 hover:bg-red-500/20',
    btnDelText: '#fca5a5',
    bottomBarBg: 'rgba(10,26,24,0.85)',
    tagBg: 'rgba(52,211,153,0.15)',
    tagText: 'rgba(167,243,208,0.9)',
    nameGradient: 'linear-gradient(90deg, #a7f3d0, #6ee7b7, #67e8f9, #a7f3d0)',
    nameShadow: 'drop-shadow(0 0 10px rgba(52,211,153,0.4))',
  },

  neon: {
    name: 'neon',
    label: '暗夜霓虹',
    desc: '赛博都市，暗夜流光',
    unlockLevel: 30,
    isDark: true,
    bgBase: '#1a0a2e',
    bgGradient: 'linear-gradient(160deg, #1a0a2e 0%, #241440 50%, #140820 100%)',
    aurora1: 'radial-gradient(ellipse 50% 45% at 30% 40%, rgba(236,72,153,0.75) 0%, rgba(168,85,247,0.45) 50%, transparent 65%)',
    aurora2: 'radial-gradient(ellipse 50% 45% at 65% 50%, rgba(6,182,212,0.65) 0%, rgba(34,211,238,0.35) 50%, transparent 65%)',
    aurora3: 'radial-gradient(ellipse 40% 40% at 50% 50%, rgba(168,85,247,0.5) 0%, transparent 60%)',
    aurora4: 'radial-gradient(ellipse 40% 40% at 50% 55%, rgba(236,72,153,0.45) 0%, transparent 55%)',
    ringOuter: 'conic-gradient(from 0deg, rgba(236,72,153,0.85), rgba(6,182,212,0.7), rgba(236,72,153,0.85))',
    ringMiddle: 'conic-gradient(from 180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.1), rgba(249,168,212,0.45), rgba(255,255,255,0.1), rgba(255,255,255,0.6))',
    ringInner: 'conic-gradient(from 90deg, rgba(236,72,153,0.6), rgba(255,255,255,0.4), rgba(6,182,212,0.5), rgba(255,255,255,0.2), rgba(236,72,153,0.6))',
    particleColors: ['rgba(236,72,153,0.3)', 'rgba(6,182,212,0.25)', 'rgba(168,85,247,0.2)'],
    previewPrimary: '#ec4899',
    previewSecondary: '#06b6d4',
    previewText: '#fce7f3',
    cardAccent: '#ec4899',
    btnBg: 'bg-fuchsia-500/80 text-white hover:bg-fuchsia-500',
    btnText: '#ffffff',
    btnMsgGradient: 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white shadow-lg',
    btnDelBg: 'bg-white/10 text-red-300 hover:bg-red-500/20',
    btnDelText: '#fca5a5',
    bottomBarBg: 'rgba(26,10,46,0.85)',
    tagBg: 'rgba(236,72,153,0.15)',
    tagText: 'rgba(249,168,212,0.9)',
    nameGradient: 'linear-gradient(90deg, #f9a8d4, #e879f9, #67e8f9, #f9a8d4)',
    nameShadow: 'drop-shadow(0 0 10px rgba(236,72,153,0.45))',
  },
};
