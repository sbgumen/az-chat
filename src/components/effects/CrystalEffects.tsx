import { motion } from 'framer-motion';
import { FloatingGlassParticles } from './FloatingGlassParticles';
import { HOME_STYLES, type HomeStyle } from './lv30Styles';

export function CrystalBackground({ style = 'crystal' }: { children?: React.ReactNode; style?: HomeStyle }) {
  const p = HOME_STYLES[style] || HOME_STYLES.crystal;
  if (!p.isDark) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* 渐变流动光扫 — 对角线缓慢扫过 */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, transparent 35%, ${p.previewPrimary}08 48%, ${p.previewSecondary}12 50%, ${p.previewPrimary}08 52%, transparent 65%)`,
          backgroundSize: '300% 300%',
        }}
        animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute -top-20 -left-10 w-[85%] h-[60%]"
        style={{ background: p.aurora1, filter: 'blur(50px)', willChange: 'transform', opacity: 0.6 }}
        animate={{ x: [0, 25, 0, -18, 0], y: [0, -15, 0, 12, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-12 -right-8 w-[70%] h-[50%]"
        style={{ background: p.aurora2, filter: 'blur(45px)', willChange: 'transform', opacity: 0.5 }}
        animate={{ x: [0, -20, 0, 16, 0], y: [0, 18, 0, -12, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      />
      <motion.div
        className="absolute top-[10%] left-[35%] w-[55%] h-[40%]"
        style={{ background: p.aurora3, filter: 'blur(40px)', willChange: 'transform', opacity: 0.4 }}
        animate={{ x: [0, 15, 0, -12, 0], y: [0, -10, 0, 14, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />
      <motion.div
        className="absolute bottom-[5%] right-[10%] w-[45%] h-[35%]"
        style={{ background: p.aurora4, filter: 'blur(38px)', willChange: 'transform', opacity: 0.35 }}
        animate={{ x: [0, -12, 0, 14, 0], y: [0, -10, 0, 8, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
      />
    </div>
  );
}

export function CrystalTheme({ children, style = 'crystal' }: { children: React.ReactNode; style?: HomeStyle }) {
  const p = HOME_STYLES[style] || HOME_STYLES.crystal;
  return (
    <div className="relative flex flex-col flex-1" style={{ background: p.bgGradient }}>
      {p.isDark && <CrystalBackground style={style} />}
      {p.isDark && <FloatingGlassParticles count={6} colors={p.particleColors} />}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function CrystalTag({ children, style = 'crystal' }: { children: React.ReactNode; style?: HomeStyle }) {
  const p = HOME_STYLES[style] || HOME_STYLES.crystal;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{
        background: p.tagBg,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: p.isDark ? 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.2)' : 'inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 6px rgba(0,0,0,0.06)',
        color: p.tagText,
      }}
    >
      {children}
    </span>
  );
}

export function CrystalNickname({ name, style = 'crystal' }: { name: string; style?: HomeStyle }) {
  const p = HOME_STYLES[style] || HOME_STYLES.crystal;
  return (
    <span
      className="font-display text-xl font-bold"
      style={{
        background: p.nameGradient,
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        filter: p.nameShadow !== 'none' ? p.nameShadow : undefined,
      }}
    >
      {name}
    </span>
  );
}
