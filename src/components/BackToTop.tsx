import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

interface BackToTopProps {
  scrollRef: React.RefObject<HTMLElement | null>;
  threshold?: number;
}

export function BackToTop({ scrollRef, threshold = 600 }: BackToTopProps) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const top = el.scrollTop;
      setVisible(top > threshold);
      // Progress ring: 0 at threshold, 1 at scrollHeight
      const max = el.scrollHeight - el.clientHeight;
      if (max > 0) setProgress(Math.min(top / max, 1));
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [scrollRef, threshold]);

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const r = 18;
  const circ = 2 * Math.PI * r;

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          onClick={scrollToTop}
          className="fixed z-50 flex items-center justify-center"
          style={{
            right: '16px',
            bottom: 'calc(68px + env(safe-area-inset-bottom, 0px) + 80px)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          whileTap={{ scale: 0.85 }}
        >
          {/* Progress ring background */}
          <svg width="44" height="44" viewBox="0 0 44 44" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
            <circle cx="22" cy="22" r={r} fill="none" stroke="#F0E6E6" strokeWidth="2.5" />
            <motion.circle
              cx="22" cy="22" r={r} fill="none"
              stroke="url(#topGrad)" strokeWidth="2.5"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - progress)}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="topGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6B6B" />
                <stop offset="100%" stopColor="#FFB347" />
              </linearGradient>
            </defs>
          </svg>
          {/* Inner button */}
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF6B6B, #FFB347)',
            boxShadow: '0 3px 16px rgba(255,107,107,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ChevronUp size={18} color="#fff" strokeWidth={2.5} />
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
