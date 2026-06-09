import { RemoteImage } from '../../components/RemoteImage';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Users, UserPlus, BellOff, Bell, MessageSquarePlus, LayoutGrid, Shield, Pin, Trash2 } from 'lucide-react';
import { getConversations, getGroupConversations, updateConversationSettings } from '../../api/messages';
import { clearGroupMention } from '../../api/groups';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';
import { useOnlineStatus } from '../../context/OnlineStatusContext';
import { OnlineStatusDot } from '../../components/OnlineStatusDot';
import type { Conversation } from '../../types';

const SYSTEM_BOT_ID = 9999;
const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getAvatar = (a: string) => a?.startsWith('http') ? a : `${apiBase}${a}`;

function getMentionKey(userId: number | string) {
  return `mentioned_groups_${userId}`;
}

function loadMentioned(userId: number | string): Set<number> {
  try {
    const raw = localStorage.getItem(getMentionKey(userId));
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveMentioned(userId: number | string, set: Set<number>) {
  localStorage.setItem(getMentionKey(userId), JSON.stringify([...set]));
}

export function MessageList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { on } = useSocket();
  const { user } = useAuth();
  const { isOnline, fetchStatuses } = useOnlineStatus();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = (searchParams.get('filter') as 'all' | 'unread' | 'group' | 'mention') || 'all';
  const [showActions, setShowActions] = useState(false);
  const [mentionedGroups, setMentionedGroups] = useState<Set<number>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const initialFetchDone = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (user?.id) setMentionedGroups(loadMentioned(user.id));
  }, [user?.id]);

  const fetchConversations = (showLoading = false, debounce = false) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    const doFetch = async () => {
      if (showLoading) setLoading(true);
      try {
        const [res1, res2]: any[] = await Promise.all([
          getConversations(),
          getGroupConversations(),
        ]);
        const privates = (res1.code === 0 ? res1.data : []).map((c: any) => ({ ...c, is_group: false }));
        const groups = res2.code === 0 ? res2.data : [];
        const privateIds = privates.map((c: any) => c.user_id).filter((id: number) => id !== SYSTEM_BOT_ID);
        if (privateIds.length > 0) fetchStatuses(privateIds);
        const all = [...privates, ...groups].sort((a, b) => {
          const pa = a.is_pinned ? 1 : 0;
          const pb = b.is_pinned ? 1 : 0;
          if (pa !== pb) return pb - pa;
          const ta = new Date(a.last_time || 0).getTime();
          const tb = new Date(b.last_time || 0).getTime();
          return tb - ta;
        });
        setConversations(all);
      } catch (e) { /* ignore */ }
      setLoading(false);
    };
    if (debounce) {
      debounceTimer.current = setTimeout(doFetch, 300);
    } else {
      doFetch();
    }
  };

  useEffect(() => { fetchConversations(true); }, []);

  useEffect(() => {
    if (loading || !listRef.current) return;
    const saved = sessionStorage.getItem('msg_list_scroll');
    if (saved) {
      requestAnimationFrame(() => {
        if (listRef.current) listRef.current.scrollTop = Number(saved);
        sessionStorage.removeItem('msg_list_scroll');
      });
    }
  }, [loading]);

  useEffect(() => {
    if (!initialFetchDone.current) { initialFetchDone.current = true; return; }
    if (location.pathname === '/messages') fetchConversations(true);
  }, [location.pathname]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchConversations(false, true);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    const unsub1 = on('message:receive', () => { fetchConversations(false, true); });
    const unsub2 = on('message:sent', () => { fetchConversations(false, true); });
    const unsub3 = on('message:read', () => { fetchConversations(false, true); });
    const unsub4 = on('group:message:receive', () => { fetchConversations(false, true); });
    const unsub5 = on('group:join', () => { fetchConversations(false, true); });
    const unsub6 = on('group:leave', () => { fetchConversations(false, true); });
    const unsub7 = on('group:mentioned', (data: { groupId: number }) => {
      setMentionedGroups(prev => {
        const s = new Set(prev).add(data.groupId);
        if (user?.id) saveMentioned(user.id, s);
        return s;
      });
    });
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); unsub7(); };
  }, [on]);

  const handleClick = (conv: any) => {
    if (listRef.current) {
      sessionStorage.setItem('msg_list_scroll', String(listRef.current.scrollTop));
    }
    if (conv.is_group) {
      setMentionedGroups(prev => {
        const s = new Set(prev);
        s.delete(conv.group_id);
        if (user?.id) saveMentioned(user.id, s);
        return s;
      });
      clearGroupMention(conv.group_id).catch(() => {});
      navigate(`/messages/group/${conv.group_id}`, {
        state: {
          groupName: conv.group_name,
          groupAvatar: conv.group_avatar,
          memberCount: conv.member_count,
        }
      });
    } else {
      const conversation: Conversation = {
        id: `c_${conv.user_id}`,
        user: {
          id: String(conv.user_id),
          name: conv.nickname,
          avatar: getAvatar(conv.avatar),
        },
        lastMessage: {
          id: 'last',
          senderId: String(conv.user_id),
          content: conv.last_message || '',
          timestamp: conv.last_time ? new Date(conv.last_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '',
          type: conv.last_message_type || 'text',
        },
        unreadCount: conv.unread_count || 0,
      };
      navigate(`/messages/chat/${conv.user_id}`, { state: { conversation } });
    }
  };

  const formatTime = (t: string) => {
    if (!t) return '';
    const d = new Date(t);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const cleanMentions = (text: string) => {
    if (!text) return '';
    return text.replace(/@\[\d+\]/g, (m) => m === '@[0]' ? '@全体成员' : '@成员');
  };

  const getLastMsgText = (conv: any) => {
    if (conv.last_is_recalled) return '[撤回了一条消息]';
    if (conv.last_message_type === 'image') return '[图片]';
    if (conv.last_message_type === 'audio') return '[语音]';
    if (conv.last_message_type === 'system') return cleanMentions(conv.last_message ?? '');
    if (conv.last_reply_to) return `[引用] ${cleanMentions(conv.last_message ?? '')}`;
    return cleanMentions(conv.last_message ?? '');
  };

  const filteredConversations = conversations.filter(conv => {
    if (filter === 'all') return true;
    if (filter === 'unread') return (conv.unread_count || 0) > 0;
    if (filter === 'group') return conv.is_group;
    if (filter === 'mention') return conv.is_group && mentionedGroups.has(conv.group_id);
    return true;
  });

  const pinned = filteredConversations.filter(c => c.is_pinned);
  const unpinned = filteredConversations.filter(c => !c.is_pinned);
  const unreadCount = conversations.filter(c => (c.unread_count || 0) > 0).length;

  const filters = [
    { key: 'all' as const, label: '全部' },
    { key: 'unread' as const, label: '未读' },
    { key: 'group' as const, label: '群聊' },
    { key: 'mention' as const, label: '@我' },
  ];

  // ── 左滑操作组件 (基于 framer-motion drag) ──
  const BUTTON_W = 62;
  const TOTAL_ACTION_W = BUTTON_W * 2;
  const SNAP_THRESHOLD = 50;

  function SwipeableRow({ conv, pinned, children }: { conv: any; pinned?: boolean; children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
    const swiped = useRef(false);
    const bg = pinned ? '#f7f3ee' : 'transparent';

    const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
      const shouldOpen = info.offset.x < -SNAP_THRESHOLD || (info.offset.x < -20 && info.velocity.x < -200);
      if (shouldOpen) { setOpen(true); swiped.current = true; }
      else { setOpen(false); swiped.current = false; }
    };

    const handleClick = (e: React.MouseEvent) => {
      if (swiped.current) { e.stopPropagation(); swiped.current = false; return; }
      if (open) { e.stopPropagation(); setOpen(false); return; }
      if (menu) { e.stopPropagation(); return; }
    };

    const handlePin = async (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setOpen(false); setMenu(null);
      const targetId = conv.is_group ? conv.group_id : conv.user_id;
      const typeStr = conv.is_group ? 'group' : 'private';
      await updateConversationSettings(targetId, { type: typeStr, is_pinned: conv.is_pinned ? 0 : 1 });
      fetchConversations(false, true);
    };

    // 页面滚动时关闭菜单
    useEffect(() => {
      if (!menu) return;
      const onScroll = () => setMenu(null);
      window.addEventListener('scroll', onScroll, true);
      return () => window.removeEventListener('scroll', onScroll, true);
    }, [menu]);

    const handleDelete = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setOpen(false); setMenu(null);
      setConversations(prev => prev.filter(c =>
        c.is_group === conv.is_group
          ? (c.is_group ? c.group_id !== conv.group_id : c.user_id !== conv.user_id)
          : true
      ));
    };

    const menuOpenTime = useRef(0);

    const showMenu = (x: number, y: number) => {
      const W = 160, H = 88;
      const mx = Math.min(x, window.innerWidth - W - 8);
      const my = Math.min(y, window.innerHeight - H - 8);
      menuOpenTime.current = Date.now();
      setMenu({ x: Math.max(8, mx), y: Math.max(8, my) });
    };

    const dismissMenu = () => {
      // 菜单打开 200ms 内忽略（防止长按松手触发 click 关闭）
      if (Date.now() - menuOpenTime.current < 200) return;
      setMenu(null);
    };

    return (
      <div className="relative w-full" style={{ overflow: 'hidden' }}>
        {/* 背后按钮 */}
        <div className="absolute top-0 right-0 h-full flex"
          style={{ width: TOTAL_ACTION_W, opacity: open ? 1 : 0, transition: 'opacity 0.2s' }}>
          <button onClick={handlePin}
            className="flex flex-col items-center justify-center gap-0.5 text-white text-[10px] font-medium select-none"
            style={{ width: BUTTON_W, background: conv.is_pinned ? '#d4a574' : '#c49464' }}>
            <Pin size={16} strokeWidth={2.2} />
            {conv.is_pinned ? '取消' : '置顶'}
          </button>
          <button onClick={handleDelete}
            className="flex flex-col items-center justify-center gap-0.5 text-white text-[10px] font-medium select-none"
            style={{ width: BUTTON_W, background: '#ef4444' }}>
            <Trash2 size={16} strokeWidth={2.2} />
            删除
          </button>
        </div>

        {/* 前景 — framer-motion drag */}
        <motion.div
          className="relative w-full"
          style={{ background: bg, touchAction: 'pan-y', zIndex: 1 }}
          drag="x"
          dragConstraints={{ left: -TOTAL_ACTION_W, right: 0 }}
          dragElastic={{ left: 0.2, right: 0 }}
          dragSnapToOrigin
          animate={{ x: open ? -TOTAL_ACTION_W : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          onDragStart={() => { swiped.current = false; }}
          onDragEnd={handleDragEnd}
          onClickCapture={handleClick}
          onContextMenu={(e) => { e.preventDefault(); showMenu(e.clientX, e.clientY); }}
        >
          {/* 长按触摸层 */}
          <TouchLayer onLongPress={showMenu}>
            {children}
          </TouchLayer>
        </motion.div>

        {/* 长按/右键浮动菜单 */}
        <AnimatePresence>
          {menu && (
            <>
              <motion.div className="fixed inset-0 z-[350]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={dismissMenu} onTouchMove={dismissMenu} onContextMenu={(e) => { e.preventDefault(); dismissMenu(); }} />
              <motion.div
                className="fixed z-[351] bg-white rounded-2xl shadow-2xl overflow-hidden py-1 min-w-[140px]"
                style={{ top: menu.y, left: menu.x, boxShadow: '0 12px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)' }}
                initial={{ opacity: 0, scale: 0.85, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: -8 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <button
                  onClick={() => handlePin()}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-cream-800 active:bg-cream-100 transition-colors"
                >
                  <Pin size={16} className={conv.is_pinned ? 'text-warm-500' : 'text-cream-500'} strokeWidth={2} />
                  {conv.is_pinned ? '取消置顶' : '置顶聊天'}
                </button>
                <button
                  onClick={() => handleDelete()}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-500 active:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} strokeWidth={2} />
                  删除聊天
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // 单条消息卡片
  // 长按检测包裹层
  function TouchLayer({ children, onLongPress }: { children: React.ReactNode; onLongPress: (x: number, y: number) => void }) {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    return (
      <div
        onTouchStart={(e) => {
          const t = e.touches[0];
          timer.current = setTimeout(() => onLongPress(t.clientX, t.clientY), 500);
        }}
        onTouchMove={() => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } }}
        onTouchEnd={() => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } }}
      >
        {children}
      </div>
    );
  }

  const ConversationCard = ({ conv }: { conv: any }) => (
    <div
      className="flex items-center gap-2.5 px-3 py-2.5 active:bg-cream-200/50 transition-colors cursor-pointer border-b border-cream-200/40"
      onClick={() => handleClick(conv)}
    >
      {/* Avatar */}
      <div className="relative w-[42px] h-[42px] flex-shrink-0">
        {conv.user_id === SYSTEM_BOT_ID ? (
          <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Bell size={19} className="text-white" />
          </div>
        ) : (
          <RemoteImage
            src={getAvatar(conv.is_group ? conv.group_avatar : conv.avatar)}
            alt={conv.is_group ? conv.group_name : conv.nickname}
            className={`w-full h-full object-cover bg-cream-200 ${conv.is_group ? 'rounded-lg' : 'rounded-full'} ${!conv.is_group && !isOnline(conv.user_id) ? 'opacity-70' : ''}`}
          />
        )}
        {conv.is_group && conv.user_id !== SYSTEM_BOT_ID && (
          <div className="absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] rounded-full bg-warm-500 flex items-center justify-center border border-white">
            <Users size={7} className="text-white" strokeWidth={3} />
          </div>
        )}
        {!conv.is_group && conv.user_id !== SYSTEM_BOT_ID && (
          <OnlineStatusDot userId={conv.user_id} size={10} borderWidth={2} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {conv.is_group && conv.is_system === 1 && (
              <span className="inline-flex items-center gap-0.5 mr-0.5 px-1 py-px rounded-sm text-[9px] font-semibold text-violet-600 bg-violet-50 flex-shrink-0">
                <Shield size={8} strokeWidth={2.5} />官方
              </span>
            )}
            <span className="text-[16px] truncate" style={{ color: '#3d3528' }}>
              {conv.is_group ? conv.group_name : conv.nickname}
            </span>
            {!!conv.is_muted && <BellOff size={11} className="text-cream-400 flex-shrink-0" />}
          </div>
          <span className="text-[11px] text-cream-500 ml-1.5 flex-shrink-0">{formatTime(conv.last_time)}</span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[12.5px] text-cream-600 truncate flex-1">
            {conv.is_group && mentionedGroups.has(conv.group_id)
              ? <span className="text-red-500 font-medium">[有人@我] {getLastMsgText(conv)}</span>
              : getLastMsgText(conv)}
          </span>
          {(conv.unread_count || 0) > 0 && !conv.is_muted && (
            <span className="min-w-[17px] h-[17px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center flex-shrink-0 ml-1.5">
              {conv.unread_count > 99 ? '99+' : conv.unread_count}
            </span>
          )}
          {(conv.unread_count || 0) > 0 && !!conv.is_muted && (
            <span className="w-[7px] h-[7px] rounded-full bg-cream-400 flex-shrink-0 ml-1.5" />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-cream-50">
      {/* ── Header ── */}
      <header className="px-4 pt-[calc(var(--status-bar-height,0px)+8px)] pb-2 flex-shrink-0 bg-cream-50">
        {/* Title row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-baseline gap-1.5">
            <h1 className="font-display text-2xl font-semibold text-cream-900">消息</h1>
            {unreadCount > 0 && <span className="text-[10px] text-cream-500">{unreadCount}条未读</span>}
          </div>
          <button
            onClick={() => setShowActions(!showActions)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${showActions ? 'bg-cream-800 text-white rotate-45' : 'bg-cream-200/70 text-cream-600'}`}
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Collapsible actions */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              className="flex justify-center gap-5 pb-2"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <button onClick={() => { setShowActions(false); navigate('/messages/create-group'); }} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-xl bg-warm-50 flex items-center justify-center active:scale-95 transition-transform">
                  <MessageSquarePlus size={18} className="text-warm-500" />
                </div>
                <span className="text-[10px] text-cream-500">创建群聊</span>
              </button>
              <button onClick={() => { setShowActions(false); navigate('/messages/add'); }} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center active:scale-95 transition-transform">
                  <UserPlus size={18} className="text-blue-500" />
                </div>
                <span className="text-[10px] text-cream-500">添加好友</span>
              </button>
              <button onClick={() => { setShowActions(false); navigate('/contacts/my-groups'); }} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center active:scale-95 transition-transform">
                  <LayoutGrid size={18} className="text-purple-500" />
                </div>
                <span className="text-[10px] text-cream-500">我的群聊</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer bg-white border border-cream-200 shadow-sm"
          onClick={() => navigate('/messages/search')}
        >
          <Search size={14} className="text-cream-400 flex-shrink-0" />
          <input type="text" placeholder="搜索" readOnly className="flex-1 text-[13px] text-cream-900 placeholder:text-cream-400 bg-transparent cursor-pointer outline-none" />
        </div>

        {/* Filter chips */}
        <div className="flex gap-1.5 mt-2">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setSearchParams(f.key === 'all' ? {} : { filter: f.key })}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                filter === f.key
                  ? 'bg-cream-800 text-white'
                  : 'bg-cream-200/70 text-cream-500'
              }`}
            >
              {f.label}
              {f.key === 'unread' && unreadCount > 0 && filter !== 'unread' && (
                <span className="ml-0.5 text-red-500">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* ── List ── */}
      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto pb-[120px]" onClick={() => showActions && setShowActions(false)}>
        {loading ? (
          <div className="px-3 pt-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 animate-pulse">
                <div className="w-[42px] h-[42px] rounded-full bg-cream-200 flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-3.5 bg-cream-200 rounded-full w-1/3" />
                  <div className="h-3 bg-cream-100 rounded-full w-2/3" />
                </div>
                <div className="h-3 bg-cream-200 rounded-full w-8 flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-cream-500">
            <p className="text-sm">暂无消息</p>
            <p className="text-xs mt-1">添加好友开始聊天吧</p>
          </div>
        ) : (
          <div className="px-2 pt-0.5">
            {/* Pinned section */}
            {pinned.length > 0 && (
              <div className="mb-2 -mx-2 px-2">
                <div className="flex items-center gap-1 px-3 py-1.5">
                  <Pin size={11} className="text-cream-400" />
                  <span className="text-[10px] font-medium text-cream-400">置顶 {pinned.length}</span>
                </div>
                {pinned.map((conv) => (
                  <SwipeableRow key={conv.is_group ? `g_${conv.group_id}` : `u_${conv.user_id}`} conv={conv} pinned>
                    <ConversationCard conv={conv} />
                  </SwipeableRow>
                ))}
              </div>
            )}

            {/* Regular list */}
            {unpinned.map((conv) => (
              <SwipeableRow key={conv.is_group ? `g_${conv.group_id}` : `u_${conv.user_id}`} conv={conv}>
                <ConversationCard conv={conv} />
              </SwipeableRow>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
