import { useState, useEffect, useCallback } from 'react';

interface GyroState {
  x: number;
  y: number;
}

export function useGyroscope(): GyroState {
  const [state, setState] = useState<GyroState>({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    setState({ x, y });
  }, []);

  const handleDeviceOrientation = useCallback((e: DeviceOrientationEvent) => {
    const gamma = e.gamma ?? 0;
    const beta = e.beta ?? 0;
    const x = Math.max(-1, Math.min(1, gamma / 45));
    const y = Math.max(-1, Math.min(1, beta / 45));
    setState({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setState({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    // Mobile: device orientation
    if ('ondeviceorientation' in globalThis) {
      const w = window;
      w.addEventListener('deviceorientation', handleDeviceOrientation);
      return () => w.removeEventListener('deviceorientation', handleDeviceOrientation);
    }

    // Desktop: mouse tracking
    const w = window;
    w.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      w.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave, handleDeviceOrientation]);

  return state;
}
