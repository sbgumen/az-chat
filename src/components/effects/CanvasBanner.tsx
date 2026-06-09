import { useRef, useEffect } from 'react';

type PresetKey = 'sunrise' | 'mountain' | 'flow' | 'starry' | 'sakura' | 'forest';

interface Props { preset: PresetKey; }

export const PRESET_META: Record<PresetKey, { name: string }> = {
  sunrise: { name: '暖色晨曦' }, mountain: { name: '晨雾山影' },
  flow: { name: '暖沐流光' }, starry: { name: '星夜幕色' },
  sakura: { name: '樱吹雪' }, forest: { name: '林间晨光' },
};

// ── Util ──
function drawSunrise(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Clean vertical gradient - no black artifacts
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#fef3e4');
  grad.addColorStop(0.35, '#fbe8cf');
  grad.addColorStop(0.7, '#f0c898');
  grad.addColorStop(1, '#e8b880');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Sun glow - large soft
  const sx = w * 0.5 + Math.sin(t * 0.25) * 10;
  const sy = h * 0.55;
  const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, w * 0.45);
  sg.addColorStop(0, 'rgba(255,240,210,0.7)');
  sg.addColorStop(0.25, 'rgba(255,220,170,0.35)');
  sg.addColorStop(0.55, 'rgba(255,200,140,0.08)');
  sg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, w, h);

  // Soft rays - very subtle
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + t * 0.15;
    const len = w * 0.25 + Math.sin(t * 0.6 + i) * 8;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len * 0.3);
    ctx.strokeStyle = 'rgba(255,220,160,0.15)';
    ctx.lineWidth = 3.5; ctx.stroke();
  }
}

function drawMountain(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#f0f5fa');
  grad.addColorStop(0.35, '#dce8f2');
  grad.addColorStop(0.65, '#c8d8e8');
  grad.addColorStop(1, '#b8ccd8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // More visible mountain layers
  const layers = [
    { y: 0.4, color: 'rgba(155,175,195,0.45)', peaks: [0.05, 0.28, 0.55, 0.8, 0.15] },
    { y: 0.55, color: 'rgba(135,155,175,0.4)', peaks: [0, 0.22, 0.42, 0.62, 0.85, 0.3] },
    { y: 0.7, color: 'rgba(115,135,155,0.35)', peaks: [0.08, 0.2, 0.38, 0.55, 0.72, 0.92, 0.48] },
  ];
  layers.forEach(l => {
    ctx.beginPath();
    ctx.moveTo(0, h);
    l.peaks.forEach((px, i) => {
      const ph = 0.2 + (i % 3) * 0.1 + Math.sin(t * 0.3 + i) * 0.02;
      ctx.lineTo(px * w, l.y * h - ph * h);
    });
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = l.color;
    ctx.fill();
  });

  // White mist between layers
  for (let i = 0; i < 6; i++) {
    const mx = ((i * 130 + t * 4) % (w * 1.2)) - w * 0.1;
    const my = h * 0.3 + (i * 35) % (h * 0.3);
    const mr = 30 + (i % 3) * 15;
    const mg = ctx.createRadialGradient(mx, my, 0, mx, my, mr);
    mg.addColorStop(0, 'rgba(255,255,255,0.35)');
    mg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();
  }
}

function drawFlow(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Warm base
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#f2dfc8');
  grad.addColorStop(0.5, '#e8cfb0');
  grad.addColorStop(1, '#dbc09c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Large soft light pools
  const spots = [
    { x: 0.2, y: 0.3, r: 0.25, c: 'rgba(255,255,255,0.25)' },
    { x: 0.65, y: 0.5, r: 0.2, c: 'rgba(255,255,255,0.2)' },
    { x: 0.45, y: 0.7, r: 0.18, c: 'rgba(255,248,240,0.18)' },
  ];
  spots.forEach(s => {
    const sx = s.x * w + Math.sin(t * 0.4 + s.x * 8) * 10;
    const sy = s.y * h + Math.cos(t * 0.35 + s.y * 6) * 8;
    const sr = s.r * w;
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    sg.addColorStop(0, s.c);
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
  });
  for (let c = 0; c < 3; c++) {
    ctx.beginPath();
    for (let x = 0; x <= w; x += 4) {
      const y = h * (0.35 + c * 0.22) + Math.sin(x * 0.006 + t * 0.5 + c * 2) * 12 + Math.sin(x * 0.015 - t * 0.35 + c) * 6;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = [`rgba(255,255,255,0.28)`,`rgba(255,255,255,0.22)`,`rgba(255,255,255,0.16)`][c];
    ctx.lineWidth = 2.5 - c * 0.8; ctx.stroke();
  }
}

function drawStarry(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Deep but clean sky - no black artifacts
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#1a1a38');
  grad.addColorStop(0.5, '#252545');
  grad.addColorStop(1, '#302848');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Nebula - very soft, fully transparent at edges
  const nebulas = [
    { x: 0.3, y: 0.3, r: 0.35, c: 'rgba(120,100,180,0.06)' },
    { x: 0.65, y: 0.45, r: 0.3, c: 'rgba(80,120,200,0.05)' },
    { x: 0.5, y: 0.25, r: 0.4, c: 'rgba(100,80,160,0.04)' },
  ];
  nebulas.forEach(n => {
    const nx = n.x * w + Math.sin(t * 0.2 + n.x * 5) * 15;
    const ny = n.y * h + Math.cos(t * 0.15 + n.y * 4) * 10;
    const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, n.r * w);
    ng.addColorStop(0, n.c);
    ng.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ng; ctx.fillRect(0, 0, w, h);
  });

  // Stars - pure white only, no dark halos
  for (let i = 0; i < 50; i++) {
    const sx = (i * 137.5) % w;
    const sy = (i * 79.3) % (h * 0.7);
    const pulse = 0.3 + 0.5 * Math.abs(Math.sin(t * 3 + i * 2.5));
    ctx.beginPath(); ctx.arc(sx, sy, 0.8 + pulse * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${pulse * 0.9})`;
    ctx.fill();
  }

  // Shooting star - clean white gradient, no dark trail
  const phase = (t % 7) / 7;
  if (phase < 0.25) {
    const p = phase * 4;
    const sx = w * (0.25 + p * 1.0);
    const sy = h * (0.05 + p * 0.35);
    const trailGrad = ctx.createLinearGradient(sx, sy, sx - 35, sy - 15);
    trailGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
    trailGrad.addColorStop(0.3, 'rgba(255,255,255,0.4)');
    trailGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - 35, sy - 15);
    ctx.strokeStyle = trailGrad; ctx.lineWidth = 1.8; ctx.stroke();
  }
}

function drawSakuraBanner(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Soft pink sky - brighter, cleaner
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#fff5f8');
  grad.addColorStop(0.4, '#ffe8f0');
  grad.addColorStop(0.7, '#fcd8e6');
  grad.addColorStop(1, '#f0c8d8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Petals only - no bokeh (caused dark artifacts)
  for (let i = 0; i < 16; i++) {
    const seed = i * 83.7;
    const px = ((seed * 0.6 + Math.sin(t * 0.35 + i) * 0.3) % 1.1) * w;
    const py = ((t * 10 + seed * 0.05) % (h * 1.2)) - h * 0.1;
    const rotation = t * 1.5 + i;
    const size = 3.5 + (i % 3) * 1.5;

    ctx.save();
    ctx.translate(px, py); ctx.rotate(rotation); ctx.globalAlpha = 0.4 + 0.25 * Math.sin(t * 2 + i);
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo(size * 0.4, -size * 0.2, size * 0.5, size * 0.4, 0, size * 1.2);
    ctx.bezierCurveTo(-size * 0.5, size * 0.4, -size * 0.4, -size * 0.2, 0, -size);
    ctx.fillStyle = '#f9a8d4'; ctx.fill();
    ctx.restore();
  }
}

function drawForest(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#f0f7e8');
  grad.addColorStop(0.5, '#e0eccf');
  grad.addColorStop(1, '#c8d8b0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // God rays - brighter, more visible
  for (let r = 0; r < 4; r++) {
    const rx = w * (0.15 + r * 0.22) + Math.sin(t * 0.2 + r) * 12;
    const rg = ctx.createLinearGradient(rx, 0, rx + 20, h);
    rg.addColorStop(0, 'rgba(255,250,230,0.4)');
    rg.addColorStop(0.5, 'rgba(255,250,230,0.12)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(rx - 10, 0);
    ctx.lineTo(rx + 30, h);
    ctx.lineTo(rx - 6, h);
    ctx.closePath(); ctx.fill();
  }

  // Clearer tree silhouettes
  const trees = [
    [0.06, 0.07, 0.35], [0.16, 0.06, 0.3], [0.27, 0.09, 0.42],
    [0.42, 0.07, 0.33], [0.56, 0.08, 0.38], [0.7, 0.06, 0.3],
    [0.8, 0.08, 0.36], [0.92, 0.07, 0.33],
  ];
  trees.forEach(([tx, tw, th]) => {
    const x = tx * w; const bw = tw * w; const bh = th * h;
    ctx.beginPath();
    ctx.moveTo(x - bw / 2, h);
    ctx.lineTo(x, h - bh);
    ctx.lineTo(x + bw / 2, h);
    ctx.closePath();
    ctx.fillStyle = 'rgba(85,120,75,0.35)'; ctx.fill();
    // Highlight
    ctx.beginPath();
    ctx.moveTo(x - bw * 0.28, h);
    ctx.lineTo(x, h - bh * 0.75);
    ctx.lineTo(x + bw * 0.28, h);
    ctx.closePath();
    ctx.fillStyle = 'rgba(130,155,105,0.25)'; ctx.fill();
  });

  // Dappled light - brighter
  for (let i = 0; i < 10; i++) {
    const dx = ((i * 89.3 + t * 4) % (w * 1.1)) - w * 0.05;
    const dy = h * 0.15 + (i * 43) % (h * 0.5);
    const dg = ctx.createRadialGradient(dx, dy, 0, dx, dy, 8);
    dg.addColorStop(0, 'rgba(255,250,230,0.45)');
    dg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(dx, dy, 8, 0, Math.PI * 2); ctx.fill();
  }
}

// ── Component ──

const DRAW_FN: Record<PresetKey, (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void> = {
  sunrise: drawSunrise, mountain: drawMountain, flow: drawFlow,
  starry: drawStarry, sakura: drawSakuraBanner, forest: drawForest,
};

export function CanvasBanner({ preset }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const drawFn = DRAW_FN[preset];

    const frame = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) { rafRef.current = requestAnimationFrame(frame); return; }
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      ctx.clearRect(0, 0, w, h);
      drawFn(ctx, w, h, (Date.now() - startRef.current) / 1000);
      rafRef.current = requestAnimationFrame(frame);
    };

    startRef.current = Date.now();
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [preset]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ display: 'block' }} />;
}
