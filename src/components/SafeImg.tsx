import { useState, useEffect, useRef } from 'react';
import { fetchImageAsBlobUrl, getCachedBlobUrl } from '../utils/imageBlobCache';

interface SafeImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

export function SafeImg({ src, onError: onErrorProp, onLoad: onLoadProp, style, className, ...props }: SafeImgProps) {
  const [displaySrc, setDisplaySrc] = useState(() => {
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) return src || '';
    const cached = getCachedBlobUrl(src);
    return cached !== src ? cached : src;
  });
  const [showSkeleton, setShowSkeleton] = useState(() => {
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) return false;
    const cached = getCachedBlobUrl(src);
    return cached === src; // no cache → need skeleton
  });
  const [errored, setErrored] = useState(false);
  const retryRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) {
      setDisplaySrc(src || '');
      setShowSkeleton(false);
      setErrored(false);
      retryRef.current = false;
      return;
    }

    const cached = getCachedBlobUrl(src);
    if (cached !== src && cached) {
      setDisplaySrc(cached);
      setShowSkeleton(false);
      setErrored(false);
      retryRef.current = false;
      return;
    }

    // 预加载 blob URL
    setDisplaySrc(src);
    setShowSkeleton(true);
    setErrored(false);
    retryRef.current = false;

    fetchImageAsBlobUrl(src).then(blobUrl => {
      if (!mountedRef.current) return;
      if (blobUrl && blobUrl !== src) {
        setDisplaySrc(blobUrl);
      }
      // 预加载完成，隐藏骨架（即使 blob URL 和原 URL 相同）
      setShowSkeleton(false);
    }).catch(() => {
      if (mountedRef.current) setShowSkeleton(false);
    });
  }, [src]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setShowSkeleton(false);
    setErrored(false);
    onLoadProp?.(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (retryRef.current) {
      setShowSkeleton(false);
      setErrored(true);
      onErrorProp?.(e);
      return;
    }
    retryRef.current = true;
    fetchImageAsBlobUrl(src).then(blobUrl => {
      if (!mountedRef.current) return;
      if (blobUrl && blobUrl !== src) {
        setDisplaySrc(blobUrl);
        setErrored(false);
      } else {
        setShowSkeleton(false);
        setErrored(true);
        onErrorProp?.(e as any);
      }
    }).catch(() => {
      if (!mountedRef.current) return;
      setShowSkeleton(false);
      setErrored(true);
      onErrorProp?.(e as any);
    });
  };

  // 错误状态 → 灰色占位
  if (errored) {
    return (
      <div
        className={className}
        style={{ ...style, background: '#e8e0d5' }}
      />
    );
  }

  return (
    <>
      {/* 骨架屏：仅在加载未缓存图片时显示 */}
      {showSkeleton && (
        <div
          className={className}
          style={{
            ...style,
            background: 'linear-gradient(90deg, #e8e0d5 0%, #f0ece5 40%, #e8e0d5 80%)',
            backgroundSize: '300% 100%',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
      )}
      <img
        src={displaySrc}
        onLoad={handleLoad}
        onError={handleError}
        className={className}
        style={{ ...style, display: showSkeleton ? 'none' : undefined }}
        alt={props.alt || ''}
        {...props}
      />
    </>
  );
}

// Hook: 用于需要单独获取 src 的场景
export function useBlobSrc(url: string | undefined | null): string {
  const [blobUrl, setBlobUrl] = useState(url || '');
  const fetchingRef = useRef<string | null>(null);

  useEffect(() => {
    if (!url || url.startsWith('blob:') || url.startsWith('data:')) {
      setBlobUrl(url || '');
      return;
    }

    const cached = getCachedBlobUrl(url);
    if (cached !== url) {
      setBlobUrl(cached);
      return;
    }

    if (fetchingRef.current === url) return;
    fetchingRef.current = url;

    fetchImageAsBlobUrl(url)
      .then(blob => { if (fetchingRef.current === url) setBlobUrl(blob); })
      .catch(() => { if (fetchingRef.current === url) setBlobUrl(url || ''); })
      .finally(() => { if (fetchingRef.current === url) fetchingRef.current = null; });
  }, [url]);

  return blobUrl;
}

export default SafeImg;
