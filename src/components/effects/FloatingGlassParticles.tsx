import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  duration: number;
  delay: number;
  color: string;
  opacity: number;
  clipPath: string;
}

const SHARD_PATHS = [
  'polygon(50% 0%, 80% 30%, 100% 60%, 80% 100%, 30% 90%, 0% 60%, 20% 20%)',
  'polygon(30% 0%, 90% 10%, 100% 50%, 70% 100%, 10% 90%, 0% 40%)',
  'polygon(20% 5%, 75% 0%, 95% 35%, 85% 80%, 40% 100%, 5% 70%)',
  'polygon(0% 15%, 60% 0%, 100% 20%, 100% 70%, 55% 100%, 0% 80%)',
  'polygon(15% 0%, 100% 10%, 85% 50%, 100% 90%, 50% 100%, 0% 70%, 0% 30%)',
];

const COLORS = [
  'rgba(139,92,246,0.35)',
  'rgba(236,72,153,0.3)',
  'rgba(245,158,11,0.25)',
  'rgba(59,130,246,0.25)',
  'rgba(16,185,129,0.2)',
  'rgba(255,255,255,0.2)',
];

function generateParticles(count: number, colors?: string[]): Particle[] {
  const palette = colors || COLORS;
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 20 + Math.random() * 35,
    rotation: Math.random() * 360,
    duration: 6 + Math.random() * 6,
    delay: Math.random() * 5,
    color: palette[Math.floor(Math.random() * palette.length)],
    opacity: 0.4 + Math.random() * 0.5,
    clipPath: SHARD_PATHS[Math.floor(Math.random() * SHARD_PATHS.length)],
  }));
}

/**
 * LV30 浮动玻璃碎片粒子 — 5-8片，慢速漂移 + 旋转，随机轨迹
 */
export function FloatingGlassParticles({ count = 7, colors }: { count?: number; colors?: string[] }) {
  const particles = useMemo(() => generateParticles(count, colors), [count, colors]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <FloatingShard key={p.id} particle={p} />
      ))}
    </div>
  );
}

function FloatingShard({ particle: p }: { particle: Particle }) {
  return (
    <motion.div
      className="absolute will-change-transform"
      style={{
        left: `${p.x}%`,
        top: `${p.y}%`,
        width: p.size,
        height: p.size,
        clipPath: p.clipPath,
        background: `linear-gradient(180deg, rgba(255,255,255,0.25) 0%, ${p.color} 30%, ${p.color} 100%)`,
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        opacity: p.opacity,
        boxShadow: [
          `inset 0 1px 0 rgba(255,255,255,0.3)`,
          `0 0 ${p.size * 0.4}px ${p.color.replace(/[\d.]+\)$/, '0.2)')}`,
        ].join(', '),
      }}
      animate={{
        x: [0, 20 + Math.random() * 30, -15 - Math.random() * 25, 10 + Math.random() * 20, 0],
        y: [0, -15 - Math.random() * 20, 10 + Math.random() * 30, -5 - Math.random() * 25, 0],
        rotate: [p.rotation, p.rotation + 40, p.rotation - 20, p.rotation + 60, p.rotation],
        opacity: [p.opacity, p.opacity * 0.6, p.opacity, p.opacity * 0.7, p.opacity],
      }}
      transition={{
        duration: p.duration,
        delay: p.delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}
