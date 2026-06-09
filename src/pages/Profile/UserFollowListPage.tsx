import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, UserCheck, UserPlus, Users, Lock } from 'lucide-react';
import { followUser, unfollowUser } from '../../api/user';
import { useNavigate, useParams } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';
import { useAuth } from '../../context/AuthContext';
import { RemoteImage } from '../../components/RemoteImage';
import api from '../../api/index';

interface UserItem {
  id: number;
  nickname: string;
  avatar: string;
  signature: string;
  is_followed: boolean;
  follows_me?: boolean;
}

const apiUrl = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getAvatar = (a: string) => a?.startsWith('http') ? a : `${apiUrl}${a}`;

export function UserFollowListPage() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { userId: userIdParam, mode } = useParams<{ userId: string; mode: string }>();
  const userId = parseInt(userIdParam || '0');
  const followMode = (mode === 'followers' ? 'followers' : 'following') as 'following' | 'followers';
  const goBack = useSmartBack(`/user/${userId}`);

  const [list, setList] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState('');
  const [pending, setPending] = useState<Set<number>>(new Set());
  const [userName, setUserName] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res: any = await api.get(`/api/user/${userId}/${followMode}`);
        if (res.code === 0) {
          setList(res.data);
        } else if (res.code === 403) {
          setBlocked(res.message || '对方设置了列表不可见');
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [userId, followMode]);

  useEffect(() => {
    // 获取目标用户名
    api.get(`/api/user/profile/${userId}`).then((res: any) => {
      if (res.code === 0) setUserName(res.data.nickname || '');
    }).catch(() => {});
  }, [userId]);

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
        
      
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 border-b border-cream-200">
        <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-200 transition-colors">
          <ChevronLeft size={22} className="text-cream-800" />
        </button>
        <h1 className="font-display text-lg font-semibold text-cream-900">
          {userName ? `${userName}的${followMode === 'following' ? '关注' : '粉丝'}` : followMode === 'following' ? 'TA 的关注' : 'TA 的粉丝'}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-cream-500 text-sm">加载中...</div>
        ) : blocked ? (
          <div className="flex flex-col items-center justify-center h-60 gap-3 text-cream-500">
            <Lock size={36} className="opacity-30" />
            <span className="text-sm">{blocked}</span>
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-cream-500">
            <Users size={32} className="opacity-30" />
            <span className="text-sm">{followMode === 'following' ? '暂无关注' : '暂无粉丝'}</span>
          </div>
        ) : (
          <div className="px-4 py-3 flex flex-col gap-0.5">
            {list.map((item, i) => {
              const isMe = item.id === authUser?.id;
              const isFollowed = item.is_followed;
              const isFollowBack = !isFollowed && item.follows_me;
              const isMutual = isFollowed && (item as any).follows_me;
              const isBusy = pending.has(item.id);

              return (
                <motion.div
                  key={item.id}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-cream-200/60 transition-colors"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
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
                    <p className="text-[11px] text-cream-600 truncate">{item.signature || '暂无签名'}</p>
                  </div>
                  {isMe ? (
                    <span className="shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold bg-cream-200 text-cream-500">我</span>
                  ) : (
                    <button
                      onClick={() => toggleFollow(item)}
                      disabled={isBusy}
                      className={`shrink-0 flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all disabled:opacity-60 ${
                        isMutual
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                          : isFollowed
                          ? 'bg-cream-200 text-cream-600 border border-cream-300 hover:bg-cream-300'
                          : 'bg-warm-500 text-white shadow-sm hover:bg-warm-600 active:bg-warm-700'
                      }`}
                    >
                      {isMutual ? <><UserCheck size={12} />互相关注</> : isFollowed ? <><UserCheck size={12} />已关注</> : <><UserPlus size={12} />{isFollowBack ? '回关' : '关注'}</>}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
