import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

export function useScrollMemory(key: string, scrollRef: RefObject<HTMLElement | null>, ready: boolean = true) {
  const restoredRef = useRef(false);

  useEffect(() => {
    if (!ready || restoredRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const saved = sessionStorage.getItem(`scroll_${key}`);
    if (saved) {
      const pos = parseInt(saved, 10);
      let attempts = 0;
      const tryRestore = () => {
        if (el.scrollHeight > pos) {
          el.scrollTop = pos;
          restoredRef.current = true;
          return;
        }
        if (attempts++ < 10) requestAnimationFrame(tryRestore);
      };
      requestAnimationFrame(tryRestore);
    }
  }, [key, scrollRef, ready]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleSave = () => sessionStorage.setItem(`scroll_${key}`, String(el.scrollTop));
    el.addEventListener('scroll', handleSave, { passive: true });
    return () => el.removeEventListener('scroll', handleSave);
  }, [key, scrollRef]);
}
