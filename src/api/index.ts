import axios from 'axios';

// 自动适配：外网访问时使用当前域名 + 后端端口
export const API_BASE = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// 模块级 token 访问器（由 AuthContext 注入）
let _getAccessToken: () => string | null = () => null;
let _setAccessToken: (t: string) => void = () => {};
let _getRefreshToken: () => string | null = () => null;
let _clearTokens: () => void = () => {};
let _refreshPromise: Promise<any> | null = null;

export function setupAuthBridge(bridge: {
  getAccessToken: () => string | null;
  setAccessToken: (t: string) => void;
  getRefreshToken: () => string | null;
  clearTokens: () => void;
}) {
  _getAccessToken = bridge.getAccessToken;
  _setAccessToken = bridge.setAccessToken;
  _getRefreshToken = bridge.getRefreshToken;
  _clearTokens = bridge.clearTokens;
}

// 请求拦截器 — 自动附加 access token
api.interceptors.request.use((config) => {
  const token = _getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 — 处理 401 并自动刷新
api.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    const originalReq = err.config;
    if (err.response?.status === 401 && !originalReq._retry) {
      originalReq._retry = true;
      const refreshToken = _getRefreshToken();
      if (refreshToken) {
        try {
          // 防止并发刷新
          if (!_refreshPromise) {
            _refreshPromise = axios.post(`${API_BASE}/api/auth/refresh`, { refreshToken });
          }
          const res = await _refreshPromise;
          _refreshPromise = null;
          if (res.data?.code === 0) {
            const { accessToken, refreshToken: newRefresh } = res.data.data;
            _setAccessToken(accessToken);
            localStorage.setItem('az_refresh', newRefresh);
            originalReq.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalReq);
          }
        } catch (e) {
          _refreshPromise = null;
        }
      }
      // 刷新失败 → 清除状态 → 跳转登录
      _clearTokens();
      localStorage.removeItem('az_refresh');
      localStorage.removeItem('az_user');
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

export default api;
