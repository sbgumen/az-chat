import { useRef, useEffect } from 'react';
import type { HomeStyle } from './lv30Styles';

interface Props {
  style: HomeStyle;
}

function noise(x: number, y: number, t: number): number {
  const n = Math.sin(x * 0.7 + t) * Math.cos(y * 0.8 - t * 0.6) +
            Math.sin((x + y) * 0.5 + t * 0.4) * Math.cos(x * 0.9 - t * 0.3) +
            Math.sin(y * 0.6 - t * 0.5) * Math.cos(x * 0.4 + t * 0.7);
  return n / 3;
}

// ──────────────── Draw functions for each style ────────────────

function drawGolden(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Rising gold particles influenced by noise
  for (let i = 0; i < 25; i++) {
    const seed = i * 137.5;
    const nx = noise(seed, t * 0.3, 0) * 0.5 + 0.5;
    const x = (nx * 0.8 + 0.1) * w;
    const y = ((1 - (t * 0.15 + seed * 0.07) % 1.3) * h);
    const alpha = 0.15 + 0.35 * Math.sin(t * 2 + i);
    const size = 1.5 + noise(i, t * 0.5, 1) * 2;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(251,191,36,${Math.max(0, alpha)})`;
    ctx.fill();
    // Glow
    ctx.beginPath();
    ctx.arc(x, y, size * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(245,158,11,${Math.max(0, alpha * 0.3)})`;
    ctx.fill();
  }
  // Sun glow top-right
  const glowX = w * 0.78 + Math.sin(t * 0.4) * 10;
  const glowY = h * 0.12 + Math.cos(t * 0.5) * 8;
  const gradient = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, w * 0.4);
  gradient.addColorStop(0, `rgba(251,191,36,${0.12 + Math.sin(t * 0.8) * 0.04})`);
  gradient.addColorStop(0.4, `rgba(245,158,11,0.04)`);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

function drawSakura(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const petals = 12;
  for (let i = 0; i < petals; i++) {
    const seed = i * 97.3;
    const windX = Math.sin(t * 0.3 + i) * 0.5 + Math.cos(t * 0.7 + i * 1.3) * 0.3;
    const x = ((noise(seed, t * 0.2, 0) * 0.6 + 0.2 + windX * 0.3) % 1.1) * w;
    const fallSpeed = 0.08 + i * 0.005;
    const y = ((t * fallSpeed + seed * 0.1) % 1.3 - 0.15) * h;
    const rotation = t * 1.5 + i * 1.2;
    const size = 4 + (i % 3) * 2;
    const alpha = 0.3 + 0.3 * Math.sin(t * 2.5 + i);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    // Petal shape
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo(size * 0.5, -size * 0.3, size * 0.5, size * 0.3, 0, size);
    ctx.bezierCurveTo(-size * 0.5, size * 0.3, -size * 0.5, -size * 0.3, 0, -size);
    ctx.fillStyle = `rgba(244,114,182,${alpha})`;
    ctx.fill();
    ctx.restore();
  }
  // Bokeh spots
  for (let i = 0; i < 8; i++) {
    const bx = ((i * 89.7) % 100) / 100 * w;
    const by = ((i * 53.1) % 100) / 100 * h;
    const bs = 8 + (i % 3) * 6;
    const ba = 0.04 + 0.04 * Math.sin(t * 1.5 + i * 2);
    const gradient = ctx.createRadialGradient(bx, by, 0, bx, by, bs);
    gradient.addColorStop(0, `rgba(244,114,182,${ba})`);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.arc(bx, by, bs, 0, Math.PI * 2); ctx.fill();
  }
}

function drawCrystal(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Floating crystal shards
  const shards = 8;
  for (let i = 0; i < shards; i++) {
    const cx = w * (0.15 + (i * 0.4) % 0.7) + Math.sin(t * 0.3 + i) * 20;
    const cy = h * (0.1 + i * 0.09) + Math.cos(t * 0.4 + i * 1.5) * 15;
    const rotation = t * 0.8 + i * 0.8;
    const size = 8 + (i % 3) * 4;
    const alpha = 0.2 + 0.15 * Math.sin(t * 1.8 + i);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    // Diamond shard shape
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.4, -size * 0.1);
    ctx.lineTo(size * 0.5, size * 0.5);
    ctx.lineTo(0, size * 0.8);
    ctx.lineTo(-size * 0.5, size * 0.5);
    ctx.lineTo(-size * 0.4, -size * 0.1);
    ctx.closePath();
    ctx.fillStyle = `rgba(167,139,250,${alpha})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(221,214,254,${alpha * 0.6})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.restore();
  }
  // Spectral light lines
  const colors = ['rgba(167,139,250,0.08)', 'rgba(139,92,246,0.06)', 'rgba(236,72,153,0.05)'];
  for (let i = 0; i < 3; i++) {
    const amplitude = h * 0.3;
    ctx.beginPath();
    for (let x = 0; x < w; x += 3) {
      const ny = h * 0.5 + Math.sin(x * 0.015 + t * 0.6 + i) * amplitude * 0.3 + Math.sin(x * 0.03 - t * 0.4 + i * 2) * amplitude * 0.15;
      if (x === 0) ctx.moveTo(x, ny); else ctx.lineTo(x, ny);
    }
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawAurora(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Aurora ribbon using multiple sine waves
  for (let band = 0; band < 3; band++) {
    const baseY = h * (0.15 + band * 0.12);
    ctx.beginPath();
    for (let x = 0; x < w; x += 2) {
      const y = baseY +
        Math.sin(x * 0.008 + t * 0.5 + band * 2) * h * 0.08 +
        Math.sin(x * 0.02 - t * 0.7 + band) * h * 0.05 +
        Math.sin(x * 0.004 + t * 0.3 + band * 3) * h * 0.06;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    const colors = ['rgba(52,211,153,0.15)', 'rgba(6,182,212,0.12)', 'rgba(167,243,208,0.1)'];
    ctx.strokeStyle = colors[band];
    ctx.lineWidth = 2 + band;
    ctx.stroke();
  }
  // Twinkling stars
  for (let i = 0; i < 30; i++) {
    const sx = (i * 71.3 + t * 10) % w;
    const sy = (i * 47.9 + Math.sin(t + i) * 30) % h;
    const twinkle = 0.3 + 0.5 * Math.abs(Math.sin(t * 3 + i * 2.7));
    const size = 0.5 + twinkle * 1.5;
    ctx.beginPath(); ctx.arc(sx, sy, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${twinkle * 0.7})`;
    ctx.fill();
  }
  // Shooting star (every ~8s)
  const shootPhase = (t % 8) / 8;
  if (shootPhase < 0.25) {
    const progress = shootPhase * 4;
    const sx = w * (0.7 + progress * 0.4);
    const sy = h * (0.1 + progress * 0.3);
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - 30 * progress, sy - 15 * progress);
    ctx.strokeStyle = `rgba(255,255,255,${0.6 * (1 - progress)})`;
    ctx.lineWidth = 1.5; ctx.stroke();
  }
}

function drawNeon(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Neon data streams — horizontal flowing lines at different speeds
  const streamColors = ['rgba(236,72,153,0.2)', 'rgba(6,182,212,0.18)', 'rgba(168,85,247,0.15)'];
  for (let s = 0; s < 5; s++) {
    const sy = h * 0.12 + s * h * 0.08;
    const flowX = ((t * 15 + s * 40) % (w + 200)) - 100;
    const len = 60 + (s % 3) * 40;
    ctx.beginPath();
    ctx.moveTo(flowX, sy);
    ctx.lineTo(flowX + len, sy);
    ctx.strokeStyle = streamColors[s % 3];
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // Glow
    ctx.beginPath();
    ctx.moveTo(flowX, sy);
    ctx.lineTo(flowX + len, sy);
    ctx.strokeStyle = streamColors[s % 3].replace('0.2', '0.06').replace('0.18', '0.05').replace('0.15', '0.04');
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Geometric neon accents — small diamond shapes scattered
  for (let g = 0; g < 6; g++) {
    const gx = w * (0.1 + g * 0.15) + Math.sin(t * 0.6 + g) * 8;
    const gy = h * 0.75 + Math.cos(t * 0.5 + g) * 6;
    const gs = 4 + (g % 2) * 3;
    const ga = 0.15 + 0.2 * Math.abs(Math.sin(t * 2.5 + g));
    ctx.save();
    ctx.translate(gx, gy);
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = (g % 2 === 0) ? `rgba(236,72,153,${ga})` : `rgba(6,182,212,${ga})`;
    ctx.lineWidth = 0.6;
    ctx.strokeRect(-gs / 2, -gs / 2, gs, gs);
    ctx.restore();
  }

  // Drifting neon particles
  for (let i = 0; i < 20; i++) {
    const seed = i * 73.1;
    const px = ((seed * 0.7 + Math.sin(t * 0.4 + i) * 0.3) % 1) * w;
    const py = ((seed * 0.3 + Math.cos(t * 0.35 + i) * 0.2) % 1) * h;
    const colors = ['rgba(236,72,153,0.5)', 'rgba(6,182,212,0.5)', 'rgba(168,85,247,0.4)'];
    const color = colors[i % 3];
    const pulse = 0.4 + 0.5 * Math.abs(Math.sin(t * 3.5 + i * 1.7));
    const size = 1 + (i % 3);

    ctx.beginPath(); ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fillStyle = color.replace('0.5', String(pulse * 0.7)).replace('0.4', String(pulse * 0.6));
    ctx.fill();
    // Glow
    ctx.beginPath(); ctx.arc(px, py, size * 3, 0, Math.PI * 2);
    ctx.fillStyle = color.replace('0.5', String(pulse * 0.12)).replace('0.4', String(pulse * 0.1));
    ctx.fill();
  }

  // Sweeping light bar from top to bottom
  const sweepY = ((t * 80) % (h + 200)) - 100;
  const sweepGrad = ctx.createLinearGradient(0, sweepY - 15, 0, sweepY + 15);
  sweepGrad.addColorStop(0, 'transparent');
  sweepGrad.addColorStop(0.45, 'rgba(236,72,153,0.03)');
  sweepGrad.addColorStop(0.5, 'rgba(6,182,212,0.04)');
  sweepGrad.addColorStop(0.55, 'rgba(236,72,153,0.03)');
  sweepGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = sweepGrad;
  ctx.fillRect(0, sweepY - 15, w, 30);

  // Corner neon accents
  const cornerLen = 30;
  const cornerGap = 14;
  const colors = ['rgba(236,72,153,0.25)', 'rgba(6,182,212,0.2)', 'rgba(168,85,247,0.18)', 'rgba(236,72,153,0.2)'];
  const corners: [number, number, number, number][] = [
    [cornerGap, cornerGap, cornerGap + cornerLen, cornerGap],
    [cornerGap, cornerGap, cornerGap, cornerGap + cornerLen],
    [w - cornerGap, cornerGap, w - cornerGap - cornerLen, cornerGap],
    [w - cornerGap, cornerGap, w - cornerGap, cornerGap + cornerLen],
  ];
  corners.forEach(([x1, y1, x2, y2], i) => {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = colors[i]; ctx.lineWidth = 1;
    ctx.stroke();
  });
}

// ──────────────── Component ────────────────

export function StyleCanvasDecor({ style }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startTime = useRef(Date.now());

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }
    ctx.clearRect(0, 0, w, h);

    const t = (Date.now() - startTime.current) / 1000;

    switch (style) {
      case 'golden': drawGolden(ctx, w, h, t); break;
      case 'sakura': drawSakura(ctx, w, h, t); break;
      case 'crystal': drawCrystal(ctx, w, h, t); break;
      case 'aurora': drawAurora(ctx, w, h, t); break;
      case 'neon': drawNeon(ctx, w, h, t); break;
    }

    rafRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
