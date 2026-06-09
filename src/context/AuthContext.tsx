import { createContext, useContext, useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { setupAuthBridge, API_BASE } from '../api';

interface AuthUser {
  id: number;
  nickname: string;
  avatar: string;
  gender: number;
  coins: number;
  followers: number;
  following: number;
  level: number;
  role?: string;
  banner_type?: string;
  banner_preset?: string;
  banner_image?: string;
  lv30_style?: string;
  chat_style?: string;
}

interface LoginPayload {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  token?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  ready: boolean;
  login: (tokenOrPayload: any, user?: any) => void;
  logout: () => void;
  updateUser: (data: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  ready: false,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('az_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  useEffect(() => {
    // 初始化 auth bridge
    setupAuthBridge({
      getAccessToken: () => tokenRef.current,
      setAccessToken: (t: string) => { tokenRef.current = t; setToken(t); },
      getRefreshToken: () => localStorage.getItem('az_refresh'),
      clearTokens: () => { tokenRef.current = null; setToken(null); },
    });

    // 尝试用 refreshToken 恢复登录状态
    const refreshToken = localStorage.getItem('az_refresh');
    if (refreshToken) {
      fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).then(r => r.json()).then(data => {
        if (data.code === 0) {
          tokenRef.current = data.data.accessToken;
          setToken(data.data.accessToken);
          if (data.data.refreshToken) localStorage.setItem('az_refresh', data.data.refreshToken);
          if (data.data.user) {
            const u = data.data.user;
            const stored = (() => { try { return JSON.parse(localStorage.getItem('az_user') || '{}'); } catch { return {}; } })();
            const clean = { id: u.id, nickname: u.nickname, avatar: u.avatar, gender: u.gender, coins: u.coins, followers: u.followers, following: u.following, level: u.level, role: u.role, banner_type: u.banner_type, banner_preset: u.banner_preset, banner_image: u.banner_image, lv30_style: u.lv30_style || stored.lv30_style, chat_style: u.chat_style || stored.chat_style || 'latte' };
            setUser(clean);
            localStorage.setItem('az_user', JSON.stringify(clean));
          }
        }
      }).catch(() => {}).finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  const login = (newTokenOrPayload: string | LoginPayload, userData?: any) => {
    let accessToken: string;
    let refreshToken: string;
    let user: AuthUser;

    if (typeof newTokenOrPayload === 'object' && 'accessToken' in newTokenOrPayload) {
      const p = newTokenOrPayload as LoginPayload;
      accessToken = p.accessToken || p.token || '';
      refreshToken = p.refreshToken;
      user = p.user;
    } else {
      accessToken = newTokenOrPayload as string;
      refreshToken = '';
      user = userData;
    }

    tokenRef.current = accessToken;
    setToken(accessToken);
    setUser(user);

    if (refreshToken) {
      localStorage.setItem('az_refresh', refreshToken);
    }
    localStorage.removeItem('az_token');
    const stored = (() => { try { return JSON.parse(localStorage.getItem('az_user') || '{}'); } catch { return {}; } })();
    const clean = { id: user.id, nickname: user.nickname, avatar: user.avatar, gender: user.gender, coins: user.coins, followers: user.followers, following: user.following, level: user.level, role: user.role, banner_type: user.banner_type, banner_preset: user.banner_preset, banner_image: user.banner_image, lv30_style: user.lv30_style || stored.lv30_style, chat_style: user.chat_style || stored.chat_style || 'latte' };
    localStorage.setItem('az_user', JSON.stringify(clean));
  };

  const logout = async () => {
    try {
      const { default: api } = await import('../api');
      await api.post('/api/auth/logout');
    } catch {}
    tokenRef.current = null;
    setToken(null);
    setUser(null);
    localStorage.removeItem('az_token');
    localStorage.removeItem('az_refresh');
    localStorage.removeItem('az_user');
  };

  const updateUser = (data: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem('az_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, ready, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
