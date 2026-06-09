import { useState, useEffect, useCallback, useRef } from 'react';
import { RemoteImage } from './RemoteImage';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Users, UserPlus, Bell, ChevronRight } from 'lucide-react';

const SYSTEM_BOT_ID = 9999;
const MAX_TOASTS = 3;
const DURATION = 4000;

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getAvatar = (a: string) => a?.startsWith('http') ? a : `${apiBase}${a}`;

type ToastType = 'private' | 'group' | 'group_mention' | 'friend_request' | 'friend_accepted' | 'group_request' | 'system';

interface ToastMessage {
  id: number;
  type: ToastType;
  title: string;
  body: string;
  avatar?: string;
  navigateTo?: string;
  data?: any;
}

let audioInstance: HTMLAudioElement | null = null;

export function NotificationToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const { on } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const playSound = useCallback(() => {
    try {
      if (!audioInstance) {
        audioInstance = new Audio('/sounds/notify.mp3');
        audioInstance.volume = 0.6;
      }
      audioInstance.currentTime = 0;
      audioInstance.play().catch(() => {});
    } catch {}
  }, []);

  const addToast = useCallback((toast: ToastMessage) => {
    setToasts(prev => {
      const next = [...prev, toast];
      if (next.length > MAX_TOASTS) next.shift();
      return next;
    });
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
      timersRef.current.delete(timer);
    }, DURATION);
    timersRef.current.add(timer);
  }, []);

  useEffect(() => () => { timersRef.current.forEach(clearTimeout); }, []);

  useEffect(() => {
    const unsubs = [
      // 私聊消息
      on('message:receive', (msg: any) => {
        if (msg.sender_id === user?.id) return;
        const isSystem = msg.sender_id === SYSTEM_BOT_ID;
        const preview = msg.type === 'image' ? '[图片]' : msg.type === 'audio' ? '[语音]' : (msg.content?.slice(0, 40) || '');
        addToast({
          id: Date.now() + Math.random(),
          type: isSystem ? 'system' : 'private',
          title: isSystem ? '系统通知' : (msg.sender_nickname || '新消息'),
          body: preview,
          avatar: msg.sender_avatar,
          navigateTo: isSystem ? undefined : `/messages/${msg.sender_id}`,
        });
        if (!isSystem) playSound();
      }),

      // 群聊消息
      on('group:message:receive', (msg: any) => {
        if (msg.sender_id === user?.id) return;
        const preview = msg.type === 'image' ? '[图片]' : msg.type === 'audio' ? '[语音]' : (msg.content?.slice(0, 40) || '');
        addToast({
          id: Date.now() + Math.random(),
          type: 'group',
          title: msg.group_name || '群消息',
          body: `${msg.sender_nickname || ''}: ${preview}`,
          avatar: msg.sender_avatar,
          navigateTo: `/messages/group/${msg.group_id}`,
          data: { groupId: msg.group_id },
        });
        playSound();
      }),

      // @提及
      on('group:mentioned', (data: any) => {
        addToast({
          id: Date.now() + Math.random(),
          type: 'group_mention',
          title: '群聊@提醒',
          body: data.senderNickname ? `${data.senderNickname} @了你` : '有人@了你',
          navigateTo: `/messages/group/${data.groupId}`,
        });
        playSound();
      }),

      // 好友请求
      on('friend:request', (data: any) => {
        addToast({
          id: Date.now() + Math.random(),
          type: 'friend_request',
          title: '新的好友申请',
          body: data.nickname ? `${data.nickname} 请求添加你为好友` : '收到一条好友申请',
          avatar: data.avatar,
          navigateTo: '/contacts/friend-requests',
        });
        playSound();
      }),

      // 好友接受
      on('friend:accepted', (data: any) => {
        addToast({
          id: Date.now() + Math.random(),
          type: 'friend_accepted',
          title: '好友请求通过',
          body: data.nickname ? `${data.nickname} 已成为你的好友` : '好友请求已通过',
          avatar: data.avatar,
          navigateTo: '/contacts',
        });
        playSound();
      }),

      // 群组请求
      on('group:request', (data: any) => {
        addToast({
          id: Date.now() + Math.random(),
          type: 'group_request',
          title: '群组申请',
          body: data.nickname ? `${data.nickname} 申请加入群聊` : '收到入群申请',
          avatar: data.avatar,
          navigateTo: '/contacts',
        });
      }),
    ];
    return () => unsubs.forEach(fn => fn());
  }, [on, user?.id, addToast, playSound]);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'private': return <MessageCircle size={16} />;
      case 'group': case 'group_mention': return <Users size={16} />;
      case 'friend_request': case 'friend_accepted': return <UserPlus size={16} />;
      case 'group_request': return <Users size={16} />;
      default: return <Bell size={16} />;
    }
  };

  const getAccent = (type: ToastType) => {
    switch (type) {
      case 'private': return '#C4956A';
      case 'group': case 'group_mention': return '#6A9CC4';
      case 'friend_request': case 'friend_accepted': return '#6AC47A';
      case 'group_request': return '#C49A6A';
      default: return '#9A9A9A';
    }
  };

  return (
    <div className="fixed left-0 right-0 z-[9999] flex flex-col items-center pointer-events-none"
      style={{ top: 'calc(var(--status-bar-height, 0px) + 4px)' }}>
      <AnimatePresence>
        {toasts.map((toast, i) => {
          const accent = getAccent(toast.type);
          return (
            <motion.div
              key={toast.id}
              className="mx-3 mb-2 pointer-events-auto cursor-pointer active:scale-[0.98] transition-transform"
              style={{ width: 'calc(100vw - 32px)', maxWidth: 320, zIndex: 9999 - i }}
              initial={{ opacity: 0, y: -40, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              onClick={() => { if (toast.navigateTo) navigate(toast.navigateTo); }}
            >
              <div className="relative overflow-hidden rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
                }}>
                {/* 左侧颜色条 */}
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: accent }} />

                <div className="flex items-center gap-3 px-3 py-2.5">
                  {/* 头像/图标 */}
                  <div className="relative flex-shrink-0">
                    {toast.avatar ? (
                      <RemoteImage src={getAvatar(toast.avatar)} alt="" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                        style={{ background: `${accent}18`, color: accent }}>
                        {getIcon(toast.type)}
                      </div>
                    )}
                    {toast.type !== 'system' && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white"
                        style={{ background: accent }}>
                        {getIcon(toast.type)}
                      </div>
                    )}
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-cream-900 truncate leading-tight">{toast.title}</p>
                    <p className="text-[11px] text-cream-500 truncate leading-tight mt-0.5">{toast.body}</p>
                  </div>

                  {/* 箭头 */}
                  {toast.navigateTo && (
                    <ChevronRight size={16} className="text-cream-300 flex-shrink-0" />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
