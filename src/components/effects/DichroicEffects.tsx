import { motion } from 'framer-motion';

/**
 * LV20 二向色光晕背景 — 3层径向渐变光斑缓慢漂移，颜色随时间变化
 */
export function DichroicBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* 基底 — 保持原有的浅色主题 */}

      {/* 光斑1 — 粉紫色，左上 */}
      <motion.div
        className="absolute -top-12 -left-8 w-[70%] h-[50%] opacity-25"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 40% 50%, rgba(236,72,153,0.5) 0%, rgba(139,92,246,0.2) 55%, transparent 70%)',
          filter: 'blur(40px)',
          willChange: 'transform',
        }}
        animate={{ x: [0, 18, 0, -10, 0], y: [0, -10, 0, 8, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* 光斑2 — 蓝色，右下 */}
      <motion.div
        className="absolute -bottom-8 -right-10 w-[55%] h-[40%] opacity-20"
        style={{
          background: 'radial-gradient(ellipse 65% 55% at 60% 50%, rgba(59,130,246,0.4) 0%, rgba(16,185,129,0.15) 60%, transparent 70%)',
          filter: 'blur(35px)',
          willChange: 'transform',
        }}
        animate={{ x: [0, -14, 0, 12, 0], y: [0, 10, 0, -6, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* 光斑3 — 琥珀色，中间偏上 */}
      <motion.div
        className="absolute top-[20%] left-[20%] w-[40%] h-[30%] opacity-15"
        style={{
          background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(245,158,11,0.3) 0%, rgba(236,72,153,0.1) 60%, transparent 70%)',
          filter: 'blur(30px)',
          willChange: 'transform',
        }}
        animate={{ x: [0, 10, 0, -8, 0], y: [0, -6, 0, 10, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
    </div>
  );
}

/**
 * LV20 二向色等级徽章 — 全息镭射质感 + 玻璃磨砂 + 微光滑过
 */
export function DichroicBadge({ level }: { level: number }) {
  return (
    <span className="relative inline-flex items-center overflow-hidden">
      {/* 全息镭射背景层 */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 25%, #8b5cf6 50%, #3b82f6 75%, #10b981 100%)',
          backgroundSize: '200% 100%',
          animation: 'dichroicFlow 4s linear infinite',
        }}
      />
      <style>{`
        @keyframes dichroicFlow {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
      {/* 玻璃磨砂覆盖层 */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />
      {/* 微光滑过 */}
      <motion.span
        className="absolute top-0 bottom-0 rounded-full pointer-events-none"
        style={{
          left: '-50%',
          width: '40%',
          background: 'linear-gradient(105deg, transparent 10%, rgba(255,255,255,0.4) 50%, transparent 90%)',
          willChange: 'transform',
        }}
        animate={{ x: ['0%', '500%'] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
      />
      {/* 文字 */}
      <span className="relative z-10 px-2.5 py-0.5 text-[10px] font-bold text-white">LV{level}</span>
    </span>
  );
}

/**
 * LV20 二向色玻璃资料标签 — 无边框，内发光边缘
 */
export function DichroicTag({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{
        background: active
          ? 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(139,92,246,0.1))'
          : 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 0 8px rgba(139,92,246,0.06)',
        color: active ? '#c4b5fd' : 'rgba(255,255,255,0.6)',
      }}
    >
      {children}
    </span>
  );
}
