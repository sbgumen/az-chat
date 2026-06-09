import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, UserCheck, UserPlus } from 'lucide-react';
import { getFollowing, getFollowers, followUser, unfollowUser } from '../../api/user';
import { useNavigate, useParams } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';
import { RemoteImage } from '../../components/RemoteImage';

interface UserItem {
  id: number;
  nickname: string;
  avatar: string;
  signature: string;
  is_followed: boolean;
  follows_me?: boolean;
}

interface Props {}

export function FollowListPage({}: Props) {
  const navigate = useNavigate();
  const goBack = useSmartBack('/profile');
  const { mode } = useParams<{ mode: string }>();
  const followMode = (mode === 'followers' ? 'followers' : 'following') as 'following' | 'followers';
  const [list, setList] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Set<number>>(new Set());

  const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
  const getAvatar = (a: string) => a?.startsWith('http') ? a : `${apiBase}${a}`;

  useEffect(() => {
    const load = async () => {
      try {
        const res: any = await (followMode === 'following' ? getFollowing() : getFollowers());
        if (res.code === 0) setList(res.data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, [followMode]);

  const toggleFollow = async (item: UserItem) => {
    if (pending.has(item.id)) return;
    setPending(prev => new Set(prev).add(item.id));
    try {
      if (item.is_followed) {
        await unfollowUser(item.id);
        setList(prev => prev.map(u => u.id === item.id ? { ...u, is_followed: false } : u));
      } else {
        await followUser(item.id);
        setList(prev => prev.map(u => u.id === item.id ? { ...u, is_followed: true } : u));
      }
    } catch { /* ignore */ }
    finally { setPending(prev => { const s = new Set(prev); s.delete(item.id); return s; }); }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col bg-cream-100"
        
      
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 border-b border-cream-200">
        <button
          onClick={goBack}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-200 transition-colors"
        >
          <ChevronLeft size={22} className="text-cream-800" />
        </button>
        <h1 className="font-display text-lg font-semibold text-cream-900">
          {followMode === 'following' ? '我的关注' : '我的粉丝'}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-cream-500 text-sm">加载中...</div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-cream-500">
            <UserCheck size={32} className="opacity-30" />
            <span className="text-sm">{followMode === 'following' ? '还没有关注任何人' : '还没有粉丝'}</span>
          </div>
        ) : (
          <div className="px-4 py-3 flex flex-col gap-0.5">
            {list.map((item, i) => {
              const isFollowed = item.is_followed;
              const isFollowBack = followMode === 'followers' && !isFollowed;
              const isMutual = isFollowed && (item as any).follows_me;
              const isBusy = pending.has(item.id);

              return (
                <motion.div
                  key={item.id}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-cream-200/60 transition-colors"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                >
                  <RemoteImage
                    src={item.avatar ? getAvatar(item.avatar) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.id}`}
                    alt={item.nickname}
                    onClick={() => navigate(`/user/${item.id}`)}
                    className="w-12 h-12 rounded-full object-cover bg-cream-300 shrink-0 border-2 border-cream-200 cursor-pointer active:opacity-70"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-cream-900 truncate">{item.nickname}</p>
                    {item.signature ? (
                      <p className="text-[11px] text-cream-600 truncate">{item.signature}</p>
                    ) : (
                      <p className="text-[11px] text-cream-400">暂无签名</p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleFollow(item)}
                    disabled={isBusy}
                    className={`shrink-0 flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                      isMutual
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                        : isFollowed
                        ? 'bg-cream-200 text-cream-600 border border-cream-300 hover:bg-cream-300'
                        : isFollowBack
                        ? 'bg-warm-500 text-white shadow-sm hover:bg-warm-600 active:bg-warm-700'
                        : 'bg-warm-500 text-white shadow-sm hover:bg-warm-600 active:bg-warm-700'
                    } disabled:opacity-60`}
                  >
                    {isMutual ? (
                      <><UserCheck size={12} />互相关注</>
                    ) : isFollowed ? (
                      <><UserCheck size={12} />已关注</>
                    ) : (
                      <><UserPlus size={12} />{isFollowBack ? '回关' : '关注'}</>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
