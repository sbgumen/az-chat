import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from './AuthContext';
import { fetchOnlineStatus } from '../api/user';

export interface OnlineStatus {
  online: boolean;
  lastSeen?: string;
  isHidden?: boolean;
}

interface OnlineStatusContextType {
  statusMap: Map<number, OnlineStatus>;
  getStatus: (userId: number) => OnlineStatus | undefined;
  isOnline: (userId: number) => boolean;
  getLastSeenText: (userId: number) => string;
  fetchStatuses: (userIds: number[]) => Promise<void>;
}

const OnlineStatusContext = createContext<OnlineStatusContextType>({
  statusMap: new Map(),
  getStatus: () => undefined,
  isOnline: () => false,
  getLastSeenText: () => '',
  fetchStatuses: async () => {},
});

export function useOnlineStatus() {
  return useContext(OnlineStatusContext);
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return '刚刚';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function OnlineStatusProvider({ children }: { children: ReactNode }) {
  const [statusMap, setStatusMap] = useState<Map<number, OnlineStatus>>(new Map());
  const { on } = useSocket();
  const { user } = useAuth();
  const selfId = user?.id;
  const statusMapRef = useRef(statusMap);
  statusMapRef.current = statusMap;

  // 监听实时在线状态变更
  useEffect(() => {
    const unsub = on('user:status', ({ userId, status }: { userId: number; status: 'online' | 'offline' }) => {
      setStatusMap(prev => {
        const next = new Map(prev);
        if (status === 'online') {
          next.set(userId, { online: true });
        } else {
          next.set(userId, { online: false });
        }
        return next;
      });
    });
    return unsub;
  }, [on]);

  // 批量查询初始状态
  const fetchStatuses = useCallback(async (userIds: number[]) => {
    if (userIds.length === 0) return;
    try {
      const res: any = await fetchOnlineStatus(userIds);
      if (res.code === 0 && res.data) {
        setStatusMap(prev => {
          const next = new Map(prev);
          for (const [id, status] of Object.entries(res.data)) {
            next.set(Number(id), status as OnlineStatus);
          }
          return next;
        });
      }
    } catch { /* ignore */ }
  }, []);

  const getStatus = useCallback((userId: number) => {
    if (selfId && userId === selfId) return { online: true };
    return statusMap.get(userId);
  }, [statusMap, selfId]);

  const isOnline = useCallback((userId: number) => {
    if (selfId && userId === selfId) return true;
    const s = statusMap.get(userId);
    return s?.online ?? false;
  }, [statusMap, selfId]);

  const getLastSeenText = useCallback((userId: number) => {
    if (selfId && userId === selfId) return '';
    const s = statusMap.get(userId);
    if (!s) return '离线';
    if (s.online) return '';
    if (s.lastSeen) return `离线 · ${getRelativeTime(s.lastSeen)}`;
    return '离线';
  }, [statusMap, selfId]);

  return (
    <OnlineStatusContext.Provider value={{ statusMap, getStatus, isOnline, getLastSeenText, fetchStatuses }}>
      {children}
    </OnlineStatusContext.Provider>
  );
}
