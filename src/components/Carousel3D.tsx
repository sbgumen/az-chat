import { RemoteImage } from './RemoteImage';
import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getUrl = (u: string) => u?.startsWith('http') ? u : `${apiBase}${u}`;

interface Photo { id: number; url: string; caption?: string; }

interface Props {
  photos: Photo[];
  showControls?: boolean;
  containerHeight?: number;
  cardWidth?: number;
}

export function Carousel3D({ photos, showControls = true, containerHeight = 208, cardWidth = 160 }: Props) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (playing && photos.length > 1) {
      timer.current = setInterval(() => setIdx(i => (i + 1) % photos.length), 3000);
    } else {
      if (timer.current) clearInterval(timer.current);
    }
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [playing, photos.length]);

  if (photos.length === 0) return null;

  const getCardStyle = (i: number): React.CSSProperties => {
    const total = photos.length;
    const raw = (i - idx + total) % total;
    const norm = raw > total / 2 ? raw - total : raw;
    const abs = Math.abs(norm);
    if (abs > 1) return { display: 'none' };
    const scale = abs === 0 ? 1 : 0.62;
    const translateX = norm * 82;
    const translateZ = abs === 0 ? 0 : -140;
    return {
      position: 'absolute', left: '50%', top: '50%',
      transform: `translate(-50%,-50%) translateX(${translateX}%) translateZ(${translateZ}px) rotateY(${norm * -28}deg) scale(${scale})`,
      opacity: abs === 0 ? 1 : 0.45, zIndex: 10 - abs,
      transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
    };
  };

  return (
    <div className="w-full">
      <div className="relative flex items-center justify-center" style={{ height: containerHeight, perspective: '500px' }}>
        {photos.map((p, i) => (
          <div key={p.id} className="cursor-pointer" style={{ ...getCardStyle(i), width: cardWidth }}
            onClick={() => i !== idx && setIdx(i)}>
            <div className="rounded-2xl overflow-hidden shadow-xl border border-cream-200/60" style={{ aspectRatio: '1/1' }}>
              <RemoteImage src={getUrl(p.url)} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        ))}
      </div>
      {showControls && photos.length > 1 && (
        <div className="flex items-center justify-center gap-3 mt-3">
          <button onClick={() => setIdx(i => (i - 1 + photos.length) % photos.length)}
            className="w-7 h-7 rounded-full bg-cream-200 flex items-center justify-center hover:bg-cream-300 transition-colors">
            <ChevronLeft size={14} className="text-cream-700" />
          </button>
          <button onClick={() => setPlaying(p => !p)}
            className="w-7 h-7 rounded-full bg-cream-200 flex items-center justify-center hover:bg-cream-300 transition-colors">
            {playing ? <Pause size={12} className="text-cream-700" /> : <Play size={12} className="text-cream-700" />}
          </button>
          <button onClick={() => setIdx(i => (i + 1) % photos.length)}
            className="w-7 h-7 rounded-full bg-cream-200 flex items-center justify-center hover:bg-cream-300 transition-colors">
            <ChevronRight size={14} className="text-cream-700" />
          </button>
        </div>
      )}
      <div className="flex justify-center gap-1.5 mt-2">
        {photos.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className={`rounded-full transition-all ${i === idx ? 'w-4 h-1.5 bg-warm-500' : 'w-1.5 h-1.5 bg-cream-300'}`} />
        ))}
      </div>
    </div>
  );
}

export default Carousel3D;
