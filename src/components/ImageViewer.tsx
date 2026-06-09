import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SafeImg } from './SafeImg';

interface ImageViewerProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export function ImageViewer({ images, initialIndex = 0, onClose }: ImageViewerProps) {
  const safeIndex = Math.max(0, Math.min(images.length - 1, initialIndex || 0));
  const [currentIndex, setCurrentIndex] = useState(safeIndex);

  const scrollRef = useRef<HTMLDivElement>(null);
  const touchedRef = useRef(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 拦截侧滑返回：先 push 一个历史记录，pop 时关闭
  useEffect(() => {
    try { window.history.pushState({ imgViewer: 1 }, ''); } catch {}
    const h = () => onClose();
    window.addEventListener('popstate', h);
    return () => {
      window.removeEventListener('popstate', h);
      try { if (window.history.state?.imgViewer) window.history.back(); } catch {}
    };
  }, [onClose]);

  // 键盘
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && currentIndex > 0) setCurrentIndex(i => i - 1);
      else if (e.key === 'ArrowRight' && currentIndex < images.length - 1) setCurrentIndex(i => i + 1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [currentIndex, images.length, onClose]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    touchedRef.current = true;
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      if (idx !== currentIndex && idx >= 0 && idx < images.length) {
        setCurrentIndex(idx);
      }
    }, 50);
  }, [currentIndex, images.length]);

  const goTo = useCallback((index: number) => {
    const el = scrollRef.current;
    if (!el || index < 0 || index >= images.length) return;
    el.style.scrollBehavior = 'auto';
    el.scrollLeft = index * el.clientWidth;
    setCurrentIndex(index);
    requestAnimationFrame(() => { if (el) el.style.scrollBehavior = 'smooth'; });
  }, [images.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.style.scrollBehavior = 'auto';
    el.scrollLeft = safeIndex * el.clientWidth;
  }, [safeIndex]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (touchedRef.current) { touchedRef.current = false; return; }
    const el = e.target as HTMLElement;
    if (el.closest('button') || el.closest('img')) return;
    onClose();
  }, [onClose]);

  if (!images.length) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[9000] flex flex-col bg-black"
      style={{ top: '0' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={handleClick}
    >
      {/* 顶部栏 — 加状态栏安全间距 */}
      <div className="relative z-20 flex items-center justify-between px-4 pb-2" style={{ paddingTop: 'calc(var(--status-bar-height, 0px) + 12px)' }}>
        <button className="w-9 h-9 rounded-full bg-white/12 backdrop-blur flex items-center justify-center text-white active:scale-90 transition-transform" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        {images.length > 1 && (
          <span className="text-white/85 text-[14px] font-medium">{currentIndex + 1}<span className="text-white/35"> / {images.length}</span></span>
        )}
        <div className="w-9" />
      </div>

      {/* CSS scroll-snap 原生滚动 */}
      <div
        ref={scrollRef}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory overscroll-x-contain"
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', scrollBehavior: 'smooth' }}
        onScroll={handleScroll}
      >
        {images.map((src, i) => (
          <div key={i} className="h-full flex items-center justify-center flex-shrink-0 snap-center" style={{ width: '100vw', scrollSnapStop: 'always' }}>
            <SafeImg src={src} alt="" className="max-w-[94vw] max-h-[80vh] object-contain select-none pointer-events-none" style={{ borderRadius: 4 }} draggable={false} />
          </div>
        ))}
      </div>

      {/* 桌面箭头 */}
      {images.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur hidden md:flex items-center justify-center text-white/80 hover:bg-white/20 transition-all active:scale-90"
              onClick={(e) => { e.stopPropagation(); goTo(currentIndex - 1); }}><ChevronLeft size={22} /></button>
          )}
          {currentIndex < images.length - 1 && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur hidden md:flex items-center justify-center text-white/80 hover:bg-white/20 transition-all active:scale-90"
              onClick={(e) => { e.stopPropagation(); goTo(currentIndex + 1); }}><ChevronRight size={22} /></button>
          )}
        </>
      )}

      {/* 底部指示器 */}
      {images.length > 1 && (
        <div className="relative z-20 flex items-center justify-center gap-2 pb-[calc(env(safe-area-inset-bottom,0px)+22px)] pt-2">
          {images.map((_, i) => (
            <motion.button
              key={i}
              onClick={(e) => { e.stopPropagation(); goTo(i); }}
              className="active:scale-90"
              animate={{
                width: i === currentIndex ? 22 : 6,
                background: i === currentIndex ? '#ffffff' : 'rgba(255,255,255,0.3)',
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{ height: 6, borderRadius: 3, border: 'none', padding: 0 }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
