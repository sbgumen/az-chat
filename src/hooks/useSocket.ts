import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { Capacitor } from '@capacitor/core';
import { saveFcmToken } from '../api/user';
import { API_BASE } from '../api/index';

let globalSocket: Socket | null = null;

export function useSocket() {
  const { token } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  // 初始化 Socket（token 变化时重建）
  useEffect(() => {
    if (!token) {
      globalSocket?.disconnect();
      globalSocket = null;
      return;
    }

    if (!globalSocket) {
      globalSocket = io(API_BASE, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        timeout: 20000,
      });
    }

    socketRef.current = globalSocket;

    // 连接成功后发送认证
    const sendAuth = () => globalSocket?.emit('user:online', token);
    if (globalSocket.connected) sendAuth();
    globalSocket.on('connect', sendAuth);
    return () => { globalSocket?.off('connect', sendAuth); };

    // 极光推送注册（仅原生 Android）
    if (Capacitor.isNativePlatform()) {
      const upload = (regId: string) => { if (regId) saveFcmToken(regId).catch(() => {}); };
      const handler = (e: Event) => upload((e as CustomEvent).detail);
      window.addEventListener('jpush-registration', handler);
      let tries = 0;
      const poll = setInterval(() => {
        const regId = (window as any).jpushRegId;
        if (regId) { upload(regId); clearInterval(poll); }
        if (++tries >= 15) clearInterval(poll);
      }, 1000);
      return () => {
        window.removeEventListener('jpush-registration', handler);
        clearInterval(poll);
      };
    }
  }, [token]);

  const sendMessage = useCallback((receiverId: number, content: string, type = 'text', replyTo?: number) => {
    globalSocket?.emit('message:send', { receiverId, content, type, replyTo });
  }, []);

  const sendGroupMessage = useCallback((groupId: number, content: string, type = 'text', replyTo?: number) => {
    globalSocket?.emit('group:message:send', { groupId, content, type, replyTo });
  }, []);

  const markRead = useCallback((fromUserId: number) => {
    globalSocket?.emit('message:read', { fromUserId });
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    globalSocket?.on(event, handler);
    return () => { globalSocket?.off(event, handler); };
  }, []);

  const reconnect = useCallback(() => {
    if (!token || !globalSocket) return;
    if (!globalSocket.connected) {
      globalSocket.connect();
    }
  }, [token]);

  const disconnect = useCallback(() => {
    globalSocket?.disconnect();
  }, []);

  return { socket: socketRef.current, sendMessage, sendGroupMessage, markRead, on, disconnect, reconnect };
}
