import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { RemoteImage } from '../RemoteImage';

gsap.registerPlugin(useGSAP);

interface Props {
  avatar: string;
  nickname: string;
  level: number;
  onDone: () => void;
}

/**
 * LV20 GSAP 入场动画 — 二向色光谱扫入 (~1.8s)
 *
 * Timeline:
 * 0-0.1s:  背景淡入
 * 0.05-0.7s: 双层光谱扫过
 * 0.3-0.9s: 环旋转 + 中心弹性入场
 * 0.9-1.3s: 扩散柔光
 * 1.3-1.8s: 渐隐
 */
export function Lv20EntranceAnimation({ avatar, nickname, level, onDone }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sweep1Ref = useRef<HTMLDivElement>(null);
  const sweep2Ref = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      onComplete: onDone,
    });

    // 背景淡入
    tl.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0);

    // 光谱1 — 宽色带从左到右
    tl.fromTo(
      sweep1Ref.current,
      { left: '-40%', opacity: 0 },
      { left: '120%', opacity: 1, duration: 0.65, ease: 'power2.inOut' },
      0.05
    );

    // 光谱2 — 窄色带延迟跟随
    tl.fromTo(
      sweep2Ref.current,
      { left: '-30%', opacity: 0 },
      { left: '120%', opacity: 1, duration: 0.65, ease: 'power2.inOut' },
      '<0.1'
    );

    // 中心内容弹性入场
    tl.fromTo(
      centerRef.current,
      { scale: 0.5, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.4)' },
      '>-=0.3'
    );

    // 二向色环旋转
    tl.to('.lv20-dichroic-ring', {
      rotation: 360,
      scale: 1.15,
      duration: 0.7,
      ease: 'power3.inOut',
    }, '<');

    // 扩散柔光
    tl.fromTo(
      glowRef.current,
      { scale: 0.3, opacity: 0 },
      { keyframes: [{ scale: 1.2, opacity: 0.5, duration: 0.25 }, { scale: 2, opacity: 0, duration: 0.25 }], ease: 'power2.out' },
      '>+=0.15'
    );

    // 全层渐隐
    tl.to(containerRef.current, { opacity: 0, duration: 0.4, ease: 'power3.in' }, '>+=0.1');

    return () => tl.kill();
  }, { scope: containerRef });

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center"
      style={{
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        background: 'rgba(15,12,30,0.6)',
      }}
    >
      {/* 光谱扫入1 — 宽色带 */}
      <div
        ref={sweep1Ref}
        className="absolute inset-y-0 pointer-events-none"
        style={{
          width: '35%',
          background: 'linear-gradient(90deg, transparent 0%, rgba(236,72,153,0.3) 30%, rgba(139,92,246,0.35) 50%, rgba(59,130,246,0.25) 70%, transparent 100%)',
          filter: 'blur(20px)',
          left: '-40%',
        }}
      />

      {/* 光谱扫入2 — 窄色带，延迟跟随 */}
      <div
        ref={sweep2Ref}
        className="absolute inset-y-0 pointer-events-none"
        style={{
          width: '20%',
          background: 'linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.4) 30%, rgba(245,158,11,0.3) 50%, rgba(236,72,153,0.25) 70%, transparent 100%)',
          filter: 'blur(15px)',
          left: '-30%',
        }}
      />

      {/* 扩散柔光 */}
      <div
        ref={glowRef}
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(236,72,153,0.15) 50%, transparent 70%)',
        }}
      />

      {/* 中心内容 */}
      <div ref={centerRef} className="relative z-10 flex flex-col items-center gap-4" style={{ opacity: 0 }}>
        <div className="relative">
          {/* 二向色旋转光环 */}
          <div
            className="lv20-dichroic-ring absolute -inset-[8px] rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, #f59e0b, #ec4899, #8b5cf6, #3b82f6, #10b981, #f59e0b)',
              filter: 'blur(3px)',
            }}
          />
          <RemoteImage
            src={avatar}
            alt=""
            className="relative z-10 w-20 h-20 rounded-full object-cover"
            style={{ boxShadow: '0 0 30px rgba(139,92,246,0.3)' }}
          />
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-lg font-bold text-white">{nickname}</span>
          <span
            className="px-3 py-1 rounded-full text-xs font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, rgba(236,72,153,0.6), rgba(139,92,246,0.6))',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            LV{level}
          </span>
        </div>
      </div>
    </div>
  );
}
