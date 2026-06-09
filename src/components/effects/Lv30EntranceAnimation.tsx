import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

interface Props {
  avatar: string;
  nickname: string;
  level: number;
  onDone: () => void;
}

/**
 * LV30 入场动画 — 名字淡入淡出 (~2.5s)
 */
export function Lv30EntranceAnimation({ avatar: _a, nickname: _n, level: _l, onDone }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ onComplete: onDone });

    tl.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0);
    tl.to(containerRef.current, { opacity: 0, duration: 0.4, ease: 'power3.in' }, '>+=1.6');

    return () => tl.kill();
  }, { scope: containerRef });

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center"
      style={{ background: '#0a0814', opacity: 0 }}
    >
      <span
        className="text-2xl font-bold"
        style={{
          background: 'linear-gradient(90deg, #c4b5fd, #e2e8f0, #fde68a, #c4b5fd)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {_n}
      </span>
    </div>
  );
}
