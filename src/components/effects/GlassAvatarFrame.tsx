import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { HOME_STYLES, type HomeStyle } from './lv30Styles';

interface Props {
  level: number;
  children: ReactNode;
  gyroX?: number;
  gyroY?: number;
  lv30Style?: HomeStyle;
}

/**
 * LV20: 二向色玻璃头像框 — 多层 conic-gradient + 非线性变速旋转
 * LV30: 厚重水晶棱镜头像框 — 3层嵌套玻璃环，各自独立旋转 + 棱镜折射边缘
 * LV10: 简单渐变边框（保持兼容）
 */
export function GlassAvatarFrame({ level, children, gyroX = 0, gyroY = 0, lv30Style = 'crystal' }: Props) {
  if (level >= 30) {
    const p = HOME_STYLES[lv30Style] || HOME_STYLES.crystal;
    return (
      <div className="relative shrink-0 will-change-transform" style={{ perspective: '600px' }}>
        <motion.div
          className="absolute -inset-[16px] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${p.aurora1.match(/rgba\([^)]+\)/)?.[0] || 'rgba(139,92,246,0.5)'} 0%, transparent 70%)`,
            willChange: 'opacity, transform',
          }}
          animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -inset-[12px] rounded-full pointer-events-none"
          style={{
            background: p.ringOuter,
            boxShadow: `0 0 20px ${p.particleColors[0]}, 0 0 40px ${p.particleColors[1]}`,
            padding: '4px',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))',
            willChange: 'transform',
          }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute -inset-[7px] rounded-full pointer-events-none"
          style={{
            background: p.ringMiddle,
            padding: '3px',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))',
            willChange: 'transform',
          }}
          animate={{ rotate: [360, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute -inset-[3px] rounded-full pointer-events-none"
          style={{
            background: p.ringInner,
            padding: '2px',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px))',
            willChange: 'transform',
          }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
        <div
          className="absolute -inset-[2px] rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.6) 0%, rgba(236,72,153,0.5) 25%, rgba(245,158,11,0.4) 50%, rgba(59,130,246,0.4) 75%, rgba(139,92,246,0.6) 100%)',
            filter: 'blur(2px)', opacity: 0.7,
          }}
        />
        <div
          className="absolute -inset-[4px] rounded-full pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 30%, transparent 50%, transparent 70%, rgba(255,255,255,0.04) 100%)' }}
        />
        <div
          className="absolute top-[6px] right-[20%] w-2 h-2 rounded-full pointer-events-none z-20"
          style={{ background: 'rgba(255,255,255,0.7)', boxShadow: '0 0 6px rgba(255,255,255,0.6), 0 0 12px rgba(255,255,255,0.3)', filter: 'blur(0.5px)' }}
        />
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  if (level >= 20) {
    // Gyro-influenced hue rotation offset
    const hueShift = gyroX * 30 + gyroY * 20;
    return (
      <div className="relative shrink-0 will-change-transform" style={{ perspective: '500px' }}>
        {/* 二向色外层光晕 */}
        <motion.div
          className="absolute -inset-[10px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(236,72,153,0.2) 0%, rgba(139,92,246,0.15) 50%, transparent 70%)',
            willChange: 'opacity',
          }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* 二向色 conic-gradient 环 — 非线性变速旋转 */}
        <motion.div
          className="absolute -inset-[5px] rounded-full pointer-events-none"
          style={{
            background: 'conic-gradient(from 0deg, #f59e0b, #ec4899, #8b5cf6, #3b82f6, #10b981, #f59e0b)',
            padding: '2.5px',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 1px))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 1px))',
            filter: `hue-rotate(${hueShift}deg)`,
            willChange: 'transform, filter',
          }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 14, repeat: Infinity, ease: [0.42, 0, 0.58, 1] }}
        />
        {/* 内层半透明玻璃环 */}
        <motion.div
          className="absolute -inset-[2px] rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.05), rgba(255,255,255,0.15))',
            padding: '1px',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 1px), #000 calc(100% - 0.5px))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 1px), #000 calc(100% - 0.5px))',
            willChange: 'transform',
          }}
          animate={{ rotate: [360, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: [0.42, 0, 0.58, 1] }}
        />
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  // LV10: 简单渐变边框
  if (level >= 10) {
    return (
      <div className="relative shrink-0">
        <div className="absolute -inset-[3px] rounded-full bg-gradient-to-br from-amber-400 via-pink-400 to-purple-500 z-0" />
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  return <div className="relative shrink-0">{children}</div>;
}
