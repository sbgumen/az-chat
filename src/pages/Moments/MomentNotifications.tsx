import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';
import { ChevronLeft, Heart, MessageCircle, UserPlus, AtSign, Loader2 } from 'lucide-react';
import { getNotifications, getUnreadNotificationCount, markNotificationsReadByType } from '../../api/moments';
import { followUser, getFollowing } from '../../api/user';
import { SafeImg } from '../../components/SafeImg';
import { useSocket } from '../../hooks/useSocket';
import type { MomentNotification } from '../../types';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getUrl = (s: string) => s?.startsWith('http') ? s : `${apiBase}${s}`;

const categories = [
  { key: 'like' as const, label: '赞', icon: Heart,
    colors: { bg: '#FFF0F0', activeBg: '#FF6B6B', shadow: 'rgba(255,107,107,0.3)' } },
  { key: 'comment' as const, label: '评论', icon: MessageCircle,
    colors: { bg: '#F0F4FF', activeBg: '#6B9FFF', shadow: 'rgba(107,159,255,0.3)' } },
  { key: 'follow' as const, label: '关注', icon: UserPlus,
    colors: { bg: '#F3FFF0', activeBg: '#4ECDC4', shadow: 'rgba(78,205,196,0.3)' } },
  { key: 'mention' as const, label: '@ 我', icon: AtSign,
    colors: { bg: '#FFF8F0', activeBg: '#FFB347', shadow: 'rgba(255,179,71,0.3)' } },
];

type CatKey = typeof categories[number]['key'];

export function MomentNotifications() {
  const navigate = useNavigate();
  const goBack = useSmartBack('/moments');
  const [category, setCategory] = useState<CatKey>('like');
  const [notifications, setNotifications] = useState<MomentNotification[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set());
  // 每类未读计数
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const { on } = useSocket();

  const fetchUnreadCounts = useCallback(() => {
    getUnreadNotificationCount().then((res: any) => {
      if (res.code === 0 && res.data) {
        setUnreadCounts(res.data);
      }
    }).catch(() => {});
  }, []);

  const loadNotifications = useCallback(async (pageNum: number, cat: string, append: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res: any = await getNotifications(cat, pageNum, 20);
      const data = res.code === 0 ? res.data : { list: [], pagination: { hasMore: false } };
      const items: MomentNotification[] = data?.list || [];
      if (append) {
        setNotifications(prev => [...prev, ...items]);
      } else {
        setNotifications(items);
      }
      setHasMore(data.pagination?.hasMore ?? false);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
      setInitialLoading(false);
      loadingRef.current = false;
    }
  }, []);

  // 初始加载 + 自动清除点赞角标 + 加载已关注列表
  useEffect(() => {
    fetchUnreadCounts();
    markNotificationsReadByType('like').catch(() => {});
    getFollowing().then((res: any) => {
      if (res.code === 0 && res.data) {
        setFollowingIds(new Set((res.data || []).map((u: any) => u.id)));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
    setNotifications([]);
    setHasMore(true);
    setInitialLoading(true);
    loadNotifications(1, category, false);
  }, [category, loadNotifications]);

  // Socket 实时刷新
  useEffect(() => {
    const unsub = on('moment:notification', () => { fetchUnreadCounts(); });
    return unsub;
  }, [on, fetchUnreadCounts]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    const next = page + 1;
    setPage(next);
    loadNotifications(next, category, true);
  }, [loading, hasMore, page, category, loadNotifications]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) loadMore();
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  const handleCategoryChange = async (cat: CatKey) => {
    const prevUnread = unreadCounts[cat] || 0;
    setCategory(cat);
    if (prevUnread > 0) {
      setUnreadCounts(prev => ({ ...prev, [cat]: 0 }));
      try { await markNotificationsReadByType(cat); } catch {}
      // 触发全局刷新（Layout / TabBar 角标）
      window.dispatchEvent(new CustomEvent('moments_unread_update'));
    }
  };

  const handleFollowBack = async (e: React.MouseEvent, userId: number) => {
    e.stopPropagation();
    try { await followUser(userId); setFollowingIds(prev => new Set(prev).add(userId)); } catch {}
  };

  const handleItemClick = (notif: MomentNotification) => {
    if (notif.moment?.id) navigate(`/moments/${notif.moment.id}`);
  };

  const formatTime = (ts: string) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}天前`;
    return `${d.getMonth() + 1}-${d.getDate()}`;
  };

  const getActionText = (type: string) => {
    switch (type) {
      case 'like': return '赞了你的动态';
      case 'favorite': return '收藏了你的动态';
      case 'comment': return '评论了你的动态';
      case 'follow': return '关注了你';
      case 'mention': return '@ 了你';
      default: return '互动了';
    }
  };

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: '#FFFBFA' }}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 flex-shrink-0">
        <button onClick={goBack} className="p-0.5"><ChevronLeft size={22} color="#2D1B1B" /></button>
        <h1 className="text-[15px] font-extrabold text-[#2D1B1B] flex-1">消息通知</h1>
        {totalUnread > 0 && (
          <span className="text-[11px] text-[#BBA0A0]">{totalUnread} 条未读</span>
        )}
      </div>

      {/* Creative category buttons */}
      <div className="flex-shrink-0 flex justify-around items-start px-4 py-3 mb-1">
        {categories.map(({ key, label, icon: Icon, colors }) => {
          const active = category === key;
          const badge = unreadCounts[key] || 0;
          return (
            <button
              key={key}
              onClick={() => handleCategoryChange(key)}
              className="flex flex-col items-center gap-1.5 relative group"
            >
              {/* 涟漪背景 */}
              <div
                className="absolute inset-0 rounded-2xl transition-all duration-300 -z-10"
                style={{
                  width: '56px', height: '56px', top: '-4px', left: '50%', transform: 'translateX(-50%)',
                  background: active ? `radial-gradient(circle, ${colors.activeBg}22, transparent)` : 'transparent',
                }}
              />
              {/* 图标容器 */}
              <div
                className="w-[44px] h-[44px] rounded-2xl flex items-center justify-center transition-all duration-300 relative"
                style={{
                  background: active
                    ? `linear-gradient(135deg, ${colors.activeBg}, ${colors.activeBg}dd)`
                    : colors.bg,
                  boxShadow: active ? `0 4px 14px ${colors.shadow}` : 'none',
                  transform: active ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <Icon size={19} color={active ? '#fff' : '#BBA0A0'} strokeWidth={active ? 2.2 : 1.8} />
                {/* 激活态内圈光泽 */}
                {active && (
                  <div
                    className="absolute inset-[3px] rounded-xl opacity-30"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 60%)' }}
                  />
                )}
                {/* 未读角标 */}
                {badge > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full text-white text-[8px] font-bold flex items-center justify-center shadow-sm"
                    style={{ background: active ? '#fff' : '#FF4444', color: active ? colors.activeBg : '#fff' }}
                  >
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              {/* 标签文字 */}
              <span
                className="text-[10px] font-bold transition-colors duration-300"
                style={{ color: active ? colors.activeBg : '#BBA0A0' }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notification list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        {initialLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#BBA0A0]" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#BBA0A0]">
            <p className="text-[13px]">暂无通知</p>
          </div>
        ) : (
          <div>
            {notifications.map((notif, idx) => (
              <div key={notif.id}>
                <div
                  className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 cursor-pointer active:bg-[#F8F5F2] transition-colors"
                  onClick={() => handleItemClick(notif)}
                >
                  <SafeImg src={getUrl(notif.from_user.avatar)} alt="" className="w-10 h-10 rounded-full object-cover bg-[#F8F5F2] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-[#2D1B1B] leading-relaxed line-clamp-2">
                      <span className="font-semibold">{notif.from_user.nickname}</span>
                      {' '}{getActionText(notif.type)}
                      {notif.type === 'comment' && notif.comment_content && (
                        <span className="text-[#BBA0A0]">：{notif.comment_content.slice(0, 40)}{notif.comment_content.length > 40 ? '...' : ''}</span>
                      )}
                      {notif.type !== 'comment' && notif.type !== 'follow' && notif.moment?.content && (
                        <span className="text-[#BBA0A0]">：{notif.moment.content.slice(0, 30)}{notif.moment.content.length > 30 ? '...' : ''}</span>
                      )}
                    </p>
                    <span className="text-[9px] text-[#BBA0A0]">{formatTime(notif.created_at)}</span>
                  </div>
                  {notif.moment?.image && notif.type !== 'follow' && (
                    <SafeImg src={getUrl(notif.moment.image)} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0 bg-[#F8F5F2]" />
                  )}
                  {notif.type === 'follow' && (
                    <button
                      onClick={(e) => handleFollowBack(e, notif.from_user.id)}
                      disabled={followingIds.has(notif.from_user.id)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                        followingIds.has(notif.from_user.id)
                          ? 'bg-[#F8F5F2] text-[#BBA0A0]'
                          : 'bg-[#FF6B6B] text-white active:scale-95'
                      }`}
                    >
                      {followingIds.has(notif.from_user.id) ? '已关注' : '回关'}
                    </button>
                  )}
                </div>
                {idx < notifications.length - 1 && <div className="mx-4 border-b border-[#F8F5F2]" />}
              </div>
            ))}
            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={20} className="animate-spin text-[#BBA0A0]" />
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
