// 图片本地缓存: 将远程图片 URL 转换为 blob URL
// 解决 Capacitor APK WebView 中远程图片无法加载的问题

import { Capacitor } from '@capacitor/core';

const BLOB_CACHE = new Map<string, string>();
const PENDING = new Map<string, Promise<string>>();
const MAX_CACHE_SIZE = 300;

export function isNativePlatform(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch (_) {
    return false;
  }
}

export async function fetchImageAsBlobUrl(url: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;

  const cached = BLOB_CACHE.get(url);
  if (cached) return cached;

  const pending = PENDING.get(url);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      // opaque 响应（CORS 未配）blob 为空，回退用原 URL
      if (resp.type === 'opaque') return url;
      const blob = await resp.blob();
      if (blob.size === 0) return url;
      const blobUrl = URL.createObjectURL(blob);

      if (BLOB_CACHE.size >= MAX_CACHE_SIZE) {
        const first = BLOB_CACHE.keys().next().value;
        if (first) {
          URL.revokeObjectURL(BLOB_CACHE.get(first)!);
          BLOB_CACHE.delete(first);
        }
      }

      BLOB_CACHE.set(url, blobUrl);
      return blobUrl;
    } finally {
      PENDING.delete(url);
    }
  })();

  PENDING.set(url, promise);
  return promise;
}

// 同步获取已缓存的 blob URL（未缓存时返回原始 URL）
export function getCachedBlobUrl(url: string): string {
  if (!url || url.startsWith('blob:') || url.startsWith('data:')) return url;
  return BLOB_CACHE.get(url) || url;
}

// 预加载图片列表（异步触发，不阻塞）
export function preloadImages(urls: (string | undefined | null)[]): void {
  urls.forEach(u => {
    if (u && !u.startsWith('blob:') && !u.startsWith('data:') && !BLOB_CACHE.has(u) && !PENDING.has(u)) {
      fetchImageAsBlobUrl(u);
    }
  });
}
