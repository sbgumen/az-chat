import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';
import { useAuth } from '../../context/AuthContext';
import {
  ChevronLeft, Search, Image as ImageIcon, Star, Heart,
  Globe, Users, MoreHorizontal, Loader2, MessageCircle, Trash2, Edit3
} from 'lucide-react';
import { getMyMoments, deleteMoment, toggleLike, toggleFavorite } from '../../api/moments';
import { ProfileStats } from '../../components/ProfileStats';
import { SafeImg } from '../../components/SafeImg';
import { PublishButton } from '../../components/PublishButton';
import { BackToTop } from '../../components/BackToTop';
import { useScrollMemory } from '../../hooks/useScrollMemory';
import { ImageViewer } from '../../components/ImageViewer';
import { renderMentionContent } from '../../utils/mention';
import type { Moment } from '../../types';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getUrl = (s: string) => s?.startsWith('http') ? s : `${apiBase}${s}`;

type MyTab = 'published' | 'favorited' | 'liked';

export function MyMoments() {
  const navigate = useNavigate();
  const goBack = useSmartBack('/moments');
  const { user } = useAuth();

  const [tab, setTab] = useState<MyTab>('published');
  const [moments, setMoments] = useState<Moment[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [, setTotalCount] = useState(0); // 当前 tab 的总数（分页用）
  const [publishedCount, setPublishedCount] = useState(0); // 已发布总数（固定）
  const [likeCount, setLikeCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [likedCount, setLikedCount] = useState(0);
  const [actionMenuId, setActionMenuId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  useScrollMemory('my_moments', scrollRef, !initialLoading);

  const loadMoments = useCallback(async (pageNum: number, currentTab: string, append: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res: any = await getMyMoments(currentTab, pageNum, 15);
      const responseData = res.code === 0 ? res.data : { list: [], pagination: { hasMore: false } };
      const items: Moment[] = responseData?.list || [];

      if (append) {
        setMoments(prev => [...prev, ...items]);
      } else {
        setMoments(items);
      }

      if (currentTab === 'published') {
        // 已发布总数固定，不随分页变化
        if (responseData.published_count !== undefined) setPublishedCount(responseData.published_count);
        if (responseData.like_received !== undefined) setLikeCount(responseData.like_received);
        if (responseData.favorite_count !== undefined) setFavoriteCount(responseData.favorite_count);
        if (responseData.liked_count !== undefined) setLikedCount(responseData.liked_count);
      }
      // 当前 tab 的分页总数
      if (responseData.pagination?.total !== undefined) {
        setTotalCount(responseData.pagination.total);
      } else if (!append) {
        setTotalCount(items.length);
      }

      setHasMore(responseData.pagination?.hasMore ?? false);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
      setInitialLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    setPage(1);
    setMoments([]);
    setHasMore(true);
    setInitialLoading(true);
    loadMoments(1, tab, false);
  }, [tab, loadMoments]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    const next = page + 1;
    setPage(next);
    loadMoments(next, tab, true);
  }, [loading, hasMore, page, tab, loadMoments]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) loadMore();
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  const handleLike = async (momentId: number, index: number) => {
    try {
      await toggleLike(momentId);
      setMoments(prev => prev.map((m, i) => {
        if (i !== index) return m;
        return {
          ...m,
          is_liked: !m.is_liked,
          like_count: m.is_liked ? m.like_count - 1 : m.like_count + 1,
        };
      }));
    } catch {}
  };

  const handleToggleFavorite = async (momentId: number, index: number) => {
    try {
      await toggleFavorite(momentId);
      setMoments(prev => prev.map((m, i) => {
        if (i !== index) return m;
        return { ...m, is_favorited: !m.is_favorited };
      }));
    } catch {}
  };

  const handleDelete = async (momentId: number) => {
    setDeleting(true);
    try {
      await deleteMoment(momentId);
      setMoments(prev => prev.filter(m => m.id !== momentId));
      setTotalCount(prev => prev - 1);
    } catch {} finally {
      setDeleting(false);
      setDeleteConfirmId(null);
      setActionMenuId(null);
    }
  };

  const handleMomentClick = (id: number) => {
    navigate(`/moments/${id}`);
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
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const VisibilityBadge = ({ visibility }: { visibility: string }) => {
    if (visibility === 'public') {
      return (
        <span className="flex items-center gap-0.5 text-[10px] text-green-600">
          <Globe size={10} />
          公开
        </span>
      );
    }
    if (visibility === 'friends') {
      return (
        <span className="flex items-center gap-0.5 text-[10px] text-[#A18CD1]">
          <Users size={10} />
          好友可见
        </span>
      );
    }
    return (
      <span className="text-[10px] text-[#BBA0A0]">私密</span>
    );
  };

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: '#FFFBFA' }}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Fixed top bar */}
      <div className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 flex-shrink-0">
        <button onClick={goBack} className="p-0.5">
          <ChevronLeft size={22} color="#2D1B1B" />
        </button>
        <h1 className="text-[15px] font-extrabold text-[#2D1B1B] flex-1">我的动态</h1>
        <button className="p-1.5" onClick={() => navigate('/moments/search')}>
          <Search size={18} color="#2D1B1B" />
        </button>
      </div>

      {/* 抖音风资料统计区 */}
      {user && (
        <ProfileStats
          avatar={user.avatar || '/default-avatar.png'}
          nickname={user.nickname || '我'}
          level={user.level || 1}
          signature={(user as any).signature || ''}
          stats={{
            momentCount: 0,
            followers: user.followers || 0,
            following: user.following || 0,
            likesReceived: likeCount,
          }}
          isOwn
          hideMomentCount
          onEditProfile={() => navigate('/profile/edit')}
          onPublish={() => navigate('/moments/publish')}
        />
      )}

      {/* Three-section tabs */}
      <div className="flex-shrink-0 flex px-2 pt-1">
        <button
          onClick={() => setTab('published')}
          className={`flex-1 flex flex-col items-center gap-1 py-2.5 relative ${
            tab === 'published' ? 'text-[#FF6B6B]' : 'text-[#BBA0A0]'
          }`}
        >
          <div className="flex items-center gap-1 text-[13px] font-semibold">
            <ImageIcon size={14} />
            动态
            <span className={`text-[11px] ${tab === 'published' ? 'text-[#FF6B6B]' : 'text-[#BBA0A0]'}`}>{publishedCount}</span>
          </div>
          {tab === 'published' && (
            <motion.div
              layoutId="my-moment-tab"
              className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full"
              style={{ background: '#FF6B6B' }}
            />
          )}
        </button>
        <button
          onClick={() => setTab('favorited')}
          className={`flex-1 flex flex-col items-center gap-1 py-2.5 relative ${
            tab === 'favorited' ? 'text-[#FF6B6B]' : 'text-[#BBA0A0]'
          }`}
        >
          <div className="flex items-center gap-1 text-[13px] font-semibold">
            <Star size={14} />
            收藏
            <span className={`text-[11px] ${tab === 'favorited' ? 'text-[#FF6B6B]' : 'text-[#BBA0A0]'}`}>{favoriteCount}</span>
          </div>
          {tab === 'favorited' && (
            <motion.div
              layoutId="my-moment-tab"
              className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full"
              style={{ background: '#FF6B6B' }}
            />
          )}
        </button>
        <button
          onClick={() => setTab('liked')}
          className={`flex-1 flex flex-col items-center gap-1 py-2.5 relative ${
            tab === 'liked' ? 'text-[#FF6B6B]' : 'text-[#BBA0A0]'
          }`}
        >
          <div className="flex items-center gap-1 text-[13px] font-semibold">
            <Heart size={14} />
            赞过
            <span className={`text-[11px] ${tab === 'liked' ? 'text-[#FF6B6B]' : 'text-[#BBA0A0]'}`}>{likedCount}</span>
          </div>
          {tab === 'liked' && (
            <motion.div
              layoutId="my-moment-tab"
              className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full"
              style={{ background: '#FF6B6B' }}
            />
          )}
        </button>
      </div>

      {/* Scrollable moment list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        {initialLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#BBA0A0]" />
          </div>
        ) : moments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#BBA0A0]">
            <p className="text-[13px]">
              {tab === 'published' ? '还没有发布过动态' : tab === 'favorited' ? '还没有收藏的动态' : '还没有赞过的动态'}
            </p>
          </div>
        ) : (
          <div className="pb-20 flex flex-col">
            <AnimatePresence>
              {moments.map((moment, idx) => {
                const images = (Array.isArray(moment.images) ? moment.images : []).slice(0, 3);
                const showAuthor = tab !== 'published' && moment.user_nickname;
                return (
                  <motion.div
                    key={moment.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.15) }}
                    className="flex px-3.5 py-3 cursor-pointer"
                    onClick={() => handleMomentClick(moment.id)}
                  >
                    <SafeImg
                      src={getUrl(showAuthor ? moment.user_avatar : (user?.avatar || ''))}
                      alt=""
                      className="flex-shrink-0 bg-[#E0D8D8] object-cover"
                      style={{ width: '38px', height: '38px', borderRadius: '4px' }}
                    />
                    <div className="flex-1 min-w-0 ml-2.5">
                      {/* Nickname + visibility + action menu */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold" style={{ color: '#576B95' }}>
                            {showAuthor ? moment.user_nickname : (user?.nickname || '我')}
                          </span>
                          {tab === 'published' && <VisibilityBadge visibility={moment.visibility} />}
                        </div>
                        {tab === 'published' && (
                          <div className="relative">
                            <button
                              onClick={(e) => { e.stopPropagation(); setActionMenuId(actionMenuId === moment.id ? null : moment.id); }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                            >
                              <MoreHorizontal size={14} color="#999" />
                            </button>
                            {actionMenuId === moment.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute right-0 top-6 bg-white rounded-lg shadow-lg py-1 z-10 min-w-[80px]"
                              >
                                <button
                                  onClick={(e) => { e.stopPropagation(); setActionMenuId(null); navigate(`/moments/publish?edit=${moment.id}`); }}
                                  className="flex items-center gap-2 px-3 py-2 text-[12px] text-[#2D1B1B] hover:bg-[#F8F5F2] w-full"
                                >
                                  <Edit3 size={12} />编辑
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setActionMenuId(null); setDeleteConfirmId(moment.id); }}
                                  className="flex items-center gap-2 px-3 py-2 text-[12px] text-[#FF6B6B] hover:bg-[#FFF0E5] w-full"
                                >
                                  <Trash2 size={12} />删除
                                </button>
                              </motion.div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      {moment.content && (
                        <div className="text-[14px] mb-1.5 whitespace-pre-wrap break-words" style={{ color: '#333', lineHeight: 1.5 }}>
                          {renderMentionContent(moment.content)}
                        </div>
                      )}

                      {/* Images */}
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

                      {/* Audio bar */}
                      {moment.audio_url && (
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="flex items-center gap-[2px] flex-1">
                            {[3, 5, 8, 6, 9, 7, 4, 6, 8, 5, 3].map((h, i) => (
                              <div key={i} className="rounded-full bg-[#A18CD1]/40" style={{ width: 3, height: h * 2 }} />
                            ))}
                          </div>
                          <span className="text-[10px]" style={{ color: '#B0B0B0' }}>
                            {moment.audio_duration ? `${Math.ceil(moment.audio_duration)}″` : ''}
                          </span>
                        </div>
                      )}

                      {/* Topic */}
                      {moment.topic_name && (
                        <span className="text-[11px] inline-block mb-1" style={{ color: '#A18CD1' }}
                          onClick={(e) => e.stopPropagation()}>
                          {moment.topic_name}
                        </span>
                      )}

                      {/* Bottom: time + actions */}
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[11px]" style={{ color: '#B0B0B0' }}>{formatTime(moment.created_at)}</span>
                        <div className="flex items-center gap-3">
                          <button className="flex items-center gap-1" onClick={(e) => { e.stopPropagation(); handleLike(moment.id, idx); }}>
                            <Heart size={15} fill={moment.is_liked ? '#FF6B6B' : 'none'} color={moment.is_liked ? '#FF6B6B' : '#999'} />
                            {moment.like_count > 0 && <span className="text-[11px]" style={{ color: moment.is_liked ? '#FF6B6B' : '#999' }}>{moment.like_count}</span>}
                          </button>
                          <button className="flex items-center gap-1" onClick={(e) => { e.stopPropagation(); handleMomentClick(moment.id); }}>
                            <MessageCircle size={15} color="#999" />
                            {moment.comment_count > 0 && <span className="text-[11px]" style={{ color: '#999' }}>{moment.comment_count}</span>}
                          </button>
                          {tab === 'favorited' && (
                            <button className="p-0.5" onClick={(e) => { e.stopPropagation(); handleToggleFavorite(moment.id, idx); }}>
                              <Star size={15} fill={moment.is_favorited ? '#FFB347' : 'none'} color={moment.is_favorited ? '#FFB347' : '#999'} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={20} className="animate-spin text-[#BBA0A0]" />
              </div>
            )}
          </div>
        )}
      </div>

      <BackToTop scrollRef={scrollRef} />
      <PublishButton onClick={() => navigate('/moments/publish')} />

      {/* Delete confirmation dialog */}
      {deleteConfirmId !== null && (
        <motion.div
          className="absolute inset-0 z-[300] flex items-center justify-center bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setDeleteConfirmId(null)}
        >
          <motion.div
            className="bg-white rounded-2xl p-6 mx-8 max-w-[300px] w-full shadow-lg"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[15px] font-semibold text-[#2D1B1B] mb-1">确认删除</p>
            <p className="text-[12px] text-[#BBA0A0] mb-5">删除后无法恢复，确定要删除这条动态吗？</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold bg-[#F8F5F2] text-[#2D1B1B]"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold bg-[#FF6B6B] text-white flex items-center justify-center gap-1"
              >
                {deleting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : null}
                删除
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {viewImage && <ImageViewer images={[viewImage]} initialIndex={0} onClose={() => setViewImage(null)} />}
    </motion.div>
  );
}
