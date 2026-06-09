import { useState, useEffect, useRef } from 'react';
import { fetchImageAsBlobUrl, getCachedBlobUrl } from '../utils/imageBlobCache';

const loadedCache = new Set<string>();
const MAX_CACHE = 500;

interface RemoteImageProps {
  src: string;
  alt?: string;
  className?: string;
  onClick?: (e?: any) => void;
  onError?: (e: any) => void;
  onLoad?: () => void;
  style?: React.CSSProperties;
}

export function RemoteImage({ src, alt, className, onClick, onError, onLoad, style }: RemoteImageProps) {
  const [displaySrc, setDisplaySrc] = useState(() => {
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) return src || '';
    const cached = getCachedBlobUrl(src);
    return cached !== src ? cached : src;
  });
  const [loaded, setLoaded] = useState(() => {
    if (!src) return false;
    if (loadedCache.has(src)) return true;
    const cached = getCachedBlobUrl(src);
    if (cached !== src) { loadedCache.add(src); return true; }
    return false;
  });
  const [err, setErr] = useState(false);
  const retryRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) {
      setDisplaySrc(src || '');
      setLoaded(true);
      setErr(false);
      return;
    }

    // 先查 blob 缓存
    const cached = getCachedBlobUrl(src);
    if (cached !== src) {
      setDisplaySrc(cached);
      setLoaded(true);
      setErr(false);
      if (loadedCache.size >= MAX_CACHE) loadedCache.clear();
      loadedCache.add(src);
      return;
    }

    // 首次加载使用原始 URL（由 onError 触发重试）
    setDisplaySrc(src);
    setLoaded(loadedCache.has(src));
    setErr(false);
    retryRef.current = false;
  }, [src]);

  const handleError = () => {
    if (retryRef.current) {
      setErr(true);
      onError?.({} as any);
      return;
    }

    // 图片加载失败 → 尝试用 fetch + blob URL 重试（绕过 WebView 限制）
    retryRef.current = true;
    fetchImageAsBlobUrl(src)
      .then(blobUrl => {
        if (!mountedRef.current) return;
        if (blobUrl && blobUrl !== src) {
          setDisplaySrc(blobUrl);
          setLoaded(true);
          setErr(false);
          if (loadedCache.size >= MAX_CACHE) loadedCache.clear();
          loadedCache.add(src);
          onLoad?.();
        } else {
          setErr(true);
          onError?.({} as any);
        }
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setErr(true);
        onError?.({} as any);
      });
  };

  const handleLoad = () => {
    setLoaded(true);
    if (loadedCache.size >= MAX_CACHE) loadedCache.clear();
    loadedCache.add(src);
    onLoad?.();
  };

  if (err || !src) {
    return <div className={className} style={{ ...style, background: '#e8e0d5' }} />;
  }

  if (!loaded) {
    return (
      <>
        <div
          className={className}
          style={{
            ...style,
            background: 'linear-gradient(90deg, #e8e0d5 0%, #f0ece5 40%, #e8e0d5 80%)',
            backgroundSize: '300% 100%',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
        <img
          src={displaySrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          style={{ display: 'none' }}
        />
        <style>{`@keyframes shimmer { 0% { background-position: -300% 0; } 100% { background-position: 300% 0; } }`}</style>
      </>
    );
  }

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      onClick={onClick}
      onError={handleError}
      onLoad={onLoad}
      style={style}
    />
  );
}

export default RemoteImage;
