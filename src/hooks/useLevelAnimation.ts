import { useState, useEffect } from 'react';

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Manages entrance animation playback with a 5-minute cooldown per user.
 * After the cooldown expires, the animation will play again on next visit.
 */
export function useLevelAnimation(userId: number, level: number, enabled: boolean) {
  const KEY = `az_lv_anim_ts_${userId}_${level}`;
  const [shouldPlayEntrance, setShouldPlay] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setShouldPlay(false);
      return;
    }

    const lastPlayed = localStorage.getItem(KEY);
    const now = Date.now();

    if (!lastPlayed || now - parseInt(lastPlayed) > COOLDOWN_MS) {
      setShouldPlay(true);
      localStorage.setItem(KEY, String(now));
    }
  }, [userId, level, enabled, KEY]);

  const handleAnimationDone = () => {
    setShouldPlay(false);
    setAnimationDone(true);
  };

  return {
    shouldPlayEntrance,
    animationDone,
    handleAnimationDone,
  };
}
