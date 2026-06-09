import { useEffect, useRef } from 'react';

interface MomentsCanvasDecorProps {
  variant?: 'background' | 'empty' | 'subtle';
  density?: number;
}

// 暖色调色板
const PALETTE = [
  'rgba(255,107,107,0.06)',
  'rgba(255,179,71,0.05)',
  'rgba(161,140,209,0.04)',
  'rgba(78,205,196,0.04)',
  'rgba(255,140,140,0.03)',
];

/**
 * 动态页面艺术装饰 Canvas 组件
 * - background: 页面背景流动粒子
 * - empty: 空状态的艺术插画
 * - subtle: 卡片角落微装饰
 */
export function MomentsCanvasDecor({ variant = 'background', density = 1 }: MomentsCanvasDecorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: Array<{
      x: number; y: number; r: number; vx: number; vy: number;
      color: string; opacity: number; pulse: number; pulseSpeed: number;
    }> = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.parentElement?.clientWidth || canvas.clientWidth;
      const h = canvas.parentElement?.clientHeight || canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles(w, h);
    };

    const initParticles = (w: number, h: number) => {
      const count = variant === 'empty' ? Math.floor(25 * density) : Math.floor(40 * density);
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: variant === 'subtle' ? Math.random() * 1.5 + 0.5 : Math.random() * 3 + 1,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3 - 0.1,
          color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
          opacity: Math.random() * 0.8 + 0.2,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.02 + 0.005,
        });
      }
    };

    const drawParticle = (p: typeof particles[0]) => {
      if (!ctx) return;
      // 呼吸效果
      p.pulse += p.pulseSpeed;
      const scale = 1 + Math.sin(p.pulse) * 0.4;
      const r = p.r * scale;

      // 光晕
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
      gradient.addColorStop(0, p.color.replace(/[\d.]+\)$/, `${p.opacity})`));
      gradient.addColorStop(0.4, p.color.replace(/[\d.]+\)$/, `${p.opacity * 0.3})`));
      gradient.addColorStop(1, 'rgba(255,251,250,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
      ctx.fill();

      // 核心粒子
      ctx.fillStyle = p.color.replace(/[\d.]+\)$/, `${p.opacity * 0.7})`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    // 空状态额外绘制装饰形状
    const drawEmptyDecor = () => {
      if (variant !== 'empty' || !ctx || !canvas) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const cx = w / 2;
      const cy = h / 2 - 30;
      const t = Date.now() * 0.0005;

      // 浮动环
      for (let i = 0; i < 3; i++) {
        const ringR = 50 + i * 22 + Math.sin(t + i) * 8;
        ctx.strokeStyle = PALETTE[i].replace(/[\d.]+\)$/, `${0.15 + Math.sin(t * 2 + i) * 0.05})`);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(t * 0.7 + i * 2) * 15, cy + Math.sin(t * 1.3 + i) * 10, ringR, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const animate = () => {
      if (!ctx || !canvas) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
        drawParticle(p);
      });

      if (variant === 'empty') drawEmptyDecor();

      // background variant: flowing lines between nearby particles
      if (variant === 'background') {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
              ctx.strokeStyle = `rgba(255,107,107,${0.02 * (1 - dist / 100)})`;
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
      }

      animId = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener('resize', resize);
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [variant, density]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
