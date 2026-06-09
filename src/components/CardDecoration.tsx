import { useEffect, useRef } from 'react';

type Pattern = 'circles' | 'waves' | 'dots' | 'crosshatch';

interface Props {
  pattern: Pattern;
  color: string;  // tailwind color e.g. '#f59e0b'
  className?: string;
}

const patterns: Record<Pattern, (ctx: CanvasRenderingContext2D, w: number, h: number, color: string) => void> = {
  circles: (ctx, w, _h, color) => {
    ctx.strokeStyle = color;
    for (let i = 0; i < 5; i++) {
      const r = 20 + i * 28;
      ctx.globalAlpha = 0.12 - i * 0.02;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(w, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  },
  waves: (ctx, w, h, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    for (let row = 0; row < 4; row++) {
      const y = h * 0.2 + row * (h * 0.22);
      ctx.globalAlpha = 0.08 + row * 0.015;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const dy = Math.sin(x * 0.03 + row) * 6;
        x === 0 ? ctx.moveTo(x, y + dy) : ctx.lineTo(x, y + dy);
      }
      ctx.stroke();
    }
  },
  dots: (ctx, w, h, color) => {
    ctx.fillStyle = color;
    const size = 2;
    const gap = 16;
    for (let x = gap; x < w; x += gap) {
      for (let y = gap; y < h; y += gap) {
        const dx = x - w / 2, dy = y - h / 2;
        const dist = Math.sqrt(dx * dx + dy * dy) / Math.sqrt(w * w + h * h) * 2;
        ctx.globalAlpha = Math.max(0.02, 0.1 - dist * 0.08);
        ctx.beginPath();
        ctx.arc(x, y, size * (1 - dist * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },
  crosshatch: (ctx, w, h, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    const spacing = 14;
    ctx.globalAlpha = 0.06;
    for (let i = -h; i < w + h; i += spacing) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i - h, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h, h);
      ctx.stroke();
    }
  },
};

export function CardDecoration({ pattern, color, className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);
    patterns[pattern](ctx, rect.width, rect.height, color);
  }, [pattern, color]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  );
}
