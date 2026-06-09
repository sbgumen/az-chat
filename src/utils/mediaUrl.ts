import { API_BASE } from '../api/index';

export function getMediaUrl(path: string | undefined | null): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // 新私有文件 → 通过签名 API 访问
  if (path.startsWith('/uploads/private/')) {
    return `${API_BASE}/api/media?path=${encodeURIComponent(path)}`;
  }
  // 公开资源 + 旧路径兼容
  return `${API_BASE}${path}`;
}
