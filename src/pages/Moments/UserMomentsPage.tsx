import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';
import { ChevronLeft, Heart, MessageCircle, MapPin, Search } from 'lucide-react';
import { getUserMoments, toggleLike } from '../../api/moments';
import { getUserProfile } from '../../api/user';
import { followUser, unfollowUser } from '../../api/user';
import { useAuth } from '../../context/AuthContext';
import { ProfileStats } from '../../components/ProfileStats';
import { BackToTop } from '../../components/BackToTop';
import { useScrollMemory } from '../../hooks/useScrollMemory';
import { ImageViewer } from '../../components/ImageViewer';
import { SafeImg } from '../../components/SafeImg';
import { renderMentionContent } from '../../utils/mention';
import type { Moment } from '../../types';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getUrl = (s: string) => s?.startsWith('http') ? s : `${apiBase}${s}`;

function formatTime(ts: string) {
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
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function UserMomentsPage() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const goBack = useSmartBack('/moments');
  const isOwn = currentUser && userId ? currentUser.id === Number(userId) : false;

  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);

  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ momentCount: 0, followers: 0, following: 0, likesReceived: 0 });
  const [isFollowing, setIsFollowing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  useScrollMemory(`user_moments_${userId}`, scrollRef, !loading);

  useEffect(() => {
    if (!userId) return;
    const uid = Number(userId);
    Promise.all([
      getUserMoments(uid, 1),
      getUserProfile(uid),
    ]).then(([momentsRes, profileRes]: any[]) => {
      if (momentsRes?.code === 0) {
        const data = momentsRes.data;
        setMoments(data.list || []);
        setPage(1);
        setHasMore(data.pagination?.hasMore ?? false);
        if (data.stats) setStats({
          momentCount: 0,
          followers: data.stats.followers || 0,
          following: data.stats.following || 0,
          likesReceived: data.stats.likes_received || 0,
        });
      }
      if (profileRes?.code === 0) {
        setProfile(profileRes.data);
        setIsFollowing(profileRes.data.is_followed || false);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [userId]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    const next = page + 1;
    try {
      const res: any = await getUserMoments(Number(userId), next);
      if (res.code === 0) {
        setMoments(prev => [...prev, ...(res.data.list || [])]);
        setPage(next);
        setHasMore(res.data.pagination?.hasMore ?? false);
      }
    } catch {} finally { loadingRef.current = false; }
  }, [hasMore, page, userId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 300) loadMore();
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  const handleFollow = async () => {
    if (!userId) return;
    setIsFollowing(!isFollowing);
    try {
      if (isFollowing) await unfollowUser(Number(userId));
      else await followUser(Number(userId));
    } catch { setIsFollowing(isFollowing); }
  };

  const handleLike = async (id: number, idx: number) => {
    const moment = moments[idx];
    if (!moment) return;
    setMoments(prev => prev.map((m, i) => i === idx ? { ...m, is_liked: !m.is_liked, like_count: m.is_liked ? m.like_count - 1 : m.like_count + 1 } : m));
    try { await toggleLike(id); } catch {
      setMoments(prev => prev.map((m, i) => i === idx ? { ...m, is_liked: moment.is_liked, like_count: moment.like_count } : m));
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: '#FFFBFA' }}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center gap-2 px-3 pt-[calc(var(--status-bar-height,0px)+10px)] pb-2">
        <button onClick={goBack} className="p-0.5"><ChevronLeft size={22} color="#2D1B1B" /></button>
        <span className="text-[15px] font-extrabold text-[#2D1B1B] flex-1">{profile?.nickname || ''}的动态</span>
        {!isOwn && userId && (
          <button className="p-1.5" onClick={() => navigate(`/moments/search?userId=${userId}&nickname=${encodeURIComponent(profile?.nickname || '')}`)}>
            <Search size={18} color="#2D1B1B" />
          </button>
        )}
      </div>

      {profile && (
        <ProfileStats
          avatar={profile.avatar}
          nickname={profile.nickname}
          level={profile.level || 1}
          signature={profile.signature || ''}
          stats={stats}
          isOwn={isOwn}
          isFollowing={isFollowing}
          onFollow={handleFollow}
          onMore={() => navigate(`/user/${userId}`)}
          onEditProfile={() => navigate('/profile/edit')}
          onPublish={() => navigate('/moments/publish')}
          hideMomentCount
          targetUserId={userId ? parseInt(userId) : undefined}
        />
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto pt-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#FF6B6B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : moments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#BBA0A0]">
            <p className="text-[13px]">ta还没有发布过动态</p>
          </div>
        ) : (
          <div className="flex flex-col pb-20">
            {moments.map((moment, idx) => {
              const images = (Array.isArray(moment.images) ? moment.images : []).slice(0, 3);
              return (
                <div
                  key={moment.id}
                  className="flex px-3.5 py-3 cursor-pointer"
                  onClick={() => navigate(`/moments/${moment.id}`)}
                >
                  <SafeImg
                    src={getUrl(moment.user_avatar || profile?.avatar || '')}
                    alt=""
                    className="flex-shrink-0 bg-[#E0D8D8] object-cover"
                    style={{ width: '38px', height: '38px', borderRadius: '4px' }}
                  />
                  <div className="flex-1 min-w-0 ml-2.5">
                    <div className="mb-1">
                      <span className="text-[14px] font-semibold" style={{ color: '#576B95' }}>
                        {moment.user_nickname || profile?.nickname || ''}
                      </span>
                    </div>
                    {moment.topic_name && (
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {moment.topic_name.split(/[,，\s]+/).filter(Boolean).map((tag, i) => {
                          const cleanTag = tag.startsWith('#') ? tag.slice(1) : tag;
                          return (
                            <span key={i} className="px-1.5 py-0.5 text-[10px] font-medium"
                              style={{ backgroundColor: '#FFF0E5', color: '#FF6B6B', borderRadius: '2px', cursor: 'pointer' }}
                              onClick={(e) => { e.stopPropagation(); navigate(`/topics/${encodeURIComponent(cleanTag)}`); }}>
                              {cleanTag}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {moment.content && (
                      <div className="text-[14px] mb-1.5 whitespace-pre-wrap break-words" style={{ color: '#333', lineHeight: 1.5 }}>
                        {renderMentionContent(moment.content)}
                      </div>
                    )}
                    {images.length > 0 && (
                      <div className="mb-1.5" style={{
                        display: 'grid',
                        gridTemplateColumns: images.length === 1 ? 'minmax(0, 200px)' : images.length === 2 ? 'repeat(2, minmax(0, 110px))' : 'repeat(3, minmax(0, 1fr))',
                        gap: '3px',
                      }}>
                        {images.map((img, i) => (
                          <div key={i} className="aspect-square overflow-hidden cursor-pointer" style={{ borderRadius: '2px' }}
                            onClick={(e) => { e.stopPropagation(); setViewImage(getUrl(img)); }}>
                            <SafeImg src={getUrl(img)} alt="" className="w-full h-full object-cover" loading="lazy" />
                          </div>
                        ))}
                      </div>
                    )}
                    {moment.location && (
                      <div className="flex items-center gap-0.5 mb-1">
                        <MapPin size={11} color="#B0B0B0" />
                        <span className="text-[10px]" style={{ color: '#B0B0B0' }}>{moment.location}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[11px]" style={{ color: '#B0B0B0' }}>{formatTime(moment.created_at)}</span>
                      <div className="flex items-center gap-3">
                        <button className="flex items-center gap-1" onClick={(e) => { e.stopPropagation(); handleLike(moment.id, idx); }}>
                          <Heart size={15} fill={moment.is_liked ? '#FF6B6B' : 'none'} color={moment.is_liked ? '#FF6B6B' : '#999'} />
                          {moment.like_count > 0 && <span className="text-[11px]" style={{ color: moment.is_liked ? '#FF6B6B' : '#999' }}>{moment.like_count}</span>}
                        </button>
                        <button className="flex items-center gap-1">
                          <MessageCircle size={15} color="#999" />
                          {moment.comment_count > 0 && <span className="text-[11px]" style={{ color: '#999' }}>{moment.comment_count}</span>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BackToTop scrollRef={scrollRef} />
      <AnimatePresence>
        {viewImage && <ImageViewer images={[viewImage]} initialIndex={0} onClose={() => setViewImage(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}
