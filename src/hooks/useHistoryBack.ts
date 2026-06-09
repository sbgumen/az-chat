import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Counter: incremented when a cleanup navigate(-1) fires, decremented when
// the resulting location change is processed. Any effect that sees counter > 0
// knows the key change was caused by a sibling/child cleanup, not a user swipe.
let cleanupPopCount = 0;

// React Router-aware overlay back-intercept.
//
// On mount  : pushes a sentinel history entry (same URL, new key).
// On swipe  : location.key returns to baseKey → calls onClose.
// On button : overlay unmounts → cleanup pops the orphaned sentinel.
export function useHistoryBack(onClose: (() => void) | null | undefined) {
  const navigate = useNavigate();
  const location = useLocation();

  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const baseKeyRef = useRef(location.key);
  const sentinelKeyRef = useRef<string | null>(null);
  const closedBySwipeRef = useRef(false);
  const enabledRef = useRef(!!onClose);

  // Push sentinel on mount
  useEffect(() => {
    if (!enabledRef.current) return;

    const state = typeof location.state === 'object' && location.state !== null
      ? { ...location.state as object, _overlay: true }
      : { _overlay: true };
    navigate(location.pathname + location.search, { replace: false, state });

    return () => {
      // Closed via button: sentinel is still in history — pop it
      if (!closedBySwipeRef.current && sentinelKeyRef.current !== null) {
        cleanupPopCount++;
        navigate(-1);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Detect swipe-back: location.key returns to baseKey
  useEffect(() => {
    if (!enabledRef.current) return;

    // If this key change was caused by a cleanup pop, consume it and skip
    if (cleanupPopCount > 0) {
      cleanupPopCount--;
      return;
    }

    if (location.key === baseKeyRef.current) {
      if (sentinelKeyRef.current !== null && !closedBySwipeRef.current) {
        closedBySwipeRef.current = true;
        closeRef.current?.();
      }
    } else {
      if (sentinelKeyRef.current === null) {
        sentinelKeyRef.current = location.key;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);
}
