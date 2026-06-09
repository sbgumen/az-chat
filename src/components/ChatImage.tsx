import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';
import { fetchImageAsBlobUrl, getCachedBlobUrl } from '../utils/imageBlobCache';

interface ChatImageProps {
  src: string;
  maxWidth?: number;
  maxHeight?: number;
  onClick?: () => void;
  onLoad?: () => void;
  uploading?: boolean;
  uploadProgress?: number;
  compressDone?: boolean;
  uploadError?: boolean;
  onRetry?: () => void;
}

const dimCache = new Map<string, { w: number; h: number }>();

export function ChatImage({ src, maxWidth = 210, maxHeight = 280, onClick, onLoad: onLoadProp, uploading, uploadProgress = 0, compressDone, uploadError, onRetry }: ChatImageProps) {
  const cached = dimCache.get(src);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(cached || null);
  const [showImg, setShowImg] = useState(!!cached || !!uploading);
  const [showCompressDoneAnim, setShowCompressDoneAnim] = useState(false);
  const [displaySrc, setDisplaySrc] = useState(() => {
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) return src;
    const cachedBlob = getCachedBlobUrl(src);
    return cachedBlob !== src ? cachedBlob : src;
  });
  const [blobLoading, setBlobLoading] = useState(() => {
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) return false;
    const cachedBlob = getCachedBlobUrl(src);
    return cachedBlob === src && !!src; // no cache → loading
  });
  const probedRef = useRef(false);
  const retryRef = useRef(false);

  const probe = useCallback((imgSrc: string) => {
    if (probedRef.current) return;
    probedRef.current = true;
    const img = new Image();
    img.onload = () => {
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      if (nw > 0 && nh > 0) {
        let w = nw, h = nh;
        if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth; }
        if (h > maxHeight) { w = (w * maxHeight) / h; h = maxHeight; }
        const result = { w: Math.round(w), h: Math.round(h) };
        dimCache.set(src, result);
        setDims(result);
      }
    };
    img.onerror = () => {
      const fallback = { w: maxWidth, h: Math.round(maxWidth * 0.45) };
      dimCache.set(src, fallback);
      setDims(fallback);
    };
    img.src = imgSrc;
  }, [src, maxWidth, maxHeight]);

  // 预加载 blob URL + 维度探测
  useEffect(() => {
    if (uploading) return;
    if (!src || src.startsWith('blob:') || src.startsWith('data:')) {
      setBlobLoading(false);
      if (src && !cached) probe(src);
      return;
    }

    const cachedBlob = getCachedBlobUrl(src);
    if (cachedBlob !== src && cachedBlob) {
      // 已有 blob 缓存 → 直接用
      setDisplaySrc(cachedBlob);
      setBlobLoading(false);
      if (!cached) probe(cachedBlob);
      return;
    }

    // 先探测原始 URL（网页端可直接加载）
    setBlobLoading(false);
    if (!cached) probe(src);

    // 同时预加载 blob URL（原生端备用）
    fetchImageAsBlobUrl(src).then(blobUrl => {
      if (blobUrl && blobUrl !== src) {
        setDisplaySrc(blobUrl);
        // 重新探测（用 blob URL 获得正确尺寸）
        probedRef.current = false;
        probe(blobUrl);
      }
    }).catch(() => {});
  }, [src, uploading]);

  // compressDone
  useEffect(() => {
    if (compressDone) {
      setShowCompressDoneAnim(true);
      const t = setTimeout(() => setShowCompressDoneAnim(false), 600);
      return () => clearTimeout(t);
    }
  }, [compressDone]);

  const handleImgError = () => {
    if (retryRef.current) {
      setShowImg(true);
      return;
    }
    retryRef.current = true;
    fetchImageAsBlobUrl(src).then(blobUrl => {
      if (blobUrl && blobUrl !== src) {
        setDisplaySrc(blobUrl);
        setShowImg(true);
        onLoadProp?.();
      } else {
        setShowImg(true);
      }
    }).catch(() => setShowImg(true));
  };

  const dw = dims?.w ?? maxWidth * 0.55;
  const dh = dims?.h ?? maxWidth * 0.4;

  if (uploadError) {
    return (
      <div className="rounded-lg overflow-hidden flex-shrink-0 relative cursor-pointer bg-red-50"
        style={{ width: dw, height: dh, display: 'inline-block' }} onClick={onRetry}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-red-400">
          <AlertCircle size={22} />
          <span className="text-[11px]">发送失败，点击重试</span>
        </div>
      </div>
    );
  }

  if (uploading) {
    return (
      <div className="rounded-lg overflow-hidden flex-shrink-0 relative"
        style={{ width: dw, height: dh, display: 'inline-block' }}>
        <img src={src} alt="" className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 gap-1.5">
          <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36"><circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" /><circle cx="18" cy="18" r="14" fill="none" stroke="white" strokeWidth="3" strokeDasharray={`${(uploadProgress / 100) * 88} 88`} strokeLinecap="round" className="transition-all duration-300" /></svg>
          <span className="text-white text-[11px] font-medium">{Math.round(uploadProgress)}%</span>
        </div>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.12) 55%, transparent 100%)', backgroundSize: '200% 100%', animation: 'shimmer-scan 1.4s ease-in-out infinite' }} />
      </div>
    );
  }

  return (
    <motion.div
      className="cursor-pointer active:opacity-80 rounded-lg overflow-hidden flex-shrink-0"
      style={{ width: dw, height: dh, display: 'inline-block' }}
      animate={showCompressDoneAnim ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={onClick}
    >
      <AnimatePresence>
        {showCompressDoneAnim && (
          <motion.div className="absolute flex items-center justify-center bg-emerald-500 rounded-full z-10"
            style={{ width: 28, height: 28, top: '50%', left: '50%', marginLeft: -14, marginTop: -14 }}
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}><Check size={16} className="text-white" strokeWidth={3} /></motion.div>
        )}
      </AnimatePresence>

      {/* 骨架屏：等 blob URL 就绪 */}
      {(blobLoading || !showImg) && (
        <div className="w-full h-full"
          style={{ background: 'linear-gradient(90deg, #e8e0d5 0%, #f0ece5 40%, #e8e0d5 80%)', backgroundSize: '300% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
      )}

      <img
        src={displaySrc}
        alt="" className="w-full h-full object-cover"
        style={{ display: (showImg && !blobLoading) ? 'block' : 'none' }}
        onLoad={() => { setShowImg(true); onLoadProp?.(); }}
        onError={handleImgError}
      />

      <style>{`@keyframes shimmer { 0% { background-position: -300% 0; } 100% { background-position: 300% 0; } } @keyframes shimmer-scan { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
    </motion.div>
  );
}
