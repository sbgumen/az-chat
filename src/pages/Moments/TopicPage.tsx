import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';
import {
  ChevronLeft, Search, Share2, Plus,
  Flame, Clock, Loader2
} from 'lucide-react';
import { getTopicDetail, getTopicFeed, toggleLike } from '../../api/moments';
import { ImageViewer } from '../../components/ImageViewer';
import { SafeImg } from '../../components/SafeImg';
import { WaterfallMomentCard, splitToWaterfall } from '../../components/WaterfallMomentCard';
import { BackToTop } from '../../components/BackToTop';
import { useScrollMemory } from '../../hooks/useScrollMemory';
import type { Moment } from '../../types';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getUrl = (s: string) => s?.startsWith('http') ? s : `${apiBase}${s}`;

interface TopicDetail {
  id: number;
  name: string;
  cover_image: string;
  description: string;
  usage_count: number;
  status: string;
  active_users: { nickname: string; avatar: string }[];
  moment_count: number;
}

export function TopicPage() {
  const navigate = useNavigate();
  const goBack = useSmartBack('/moments');
  const { topicName } = useParams<{ topicName: string }>();
  const decodedName = decodeURIComponent(topicName || '');

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [tab, setTab] = useState<'hot' | 'latest'>('hot');
  const [feed, setFeed] = useState<Moment[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  useScrollMemory(`topic_${topicName}`, scrollRef, !initialLoading);

  useEffect(() => {
    if (!topicName) return;
    getTopicDetail(topicName).then((res: any) => {
      if (res.code === 0) setTopic(res.data);
    }).catch(() => {});
  }, [topicName]);

  const loadFeed = useCallback(async (pageNum: number, sort: string, append: boolean) => {
    if (!topicName || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res: any = await getTopicFeed(topicName, sort, pageNum, 15);
      const data = res.code === 0 ? res.data : { list: [], pagination: { hasMore: false } };
      const newItems: Moment[] = data?.list || [];
      if (append) {
        setFeed(prev => [...prev, ...newItems]);
      } else {
        setFeed(newItems);
      }
      setHasMore(data.pagination?.hasMore ?? false);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
      setInitialLoading(false);
      loadingRef.current = false;
    }
  }, [topicName]);

  useEffect(() => {
    setPage(1);
    setFeed([]);
    setHasMore(true);
    setInitialLoading(true);
    loadFeed(1, tab, false);
  }, [tab, loadFeed]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadFeed(nextPage, tab, true);
  }, [loading, hasMore, page, tab, loadFeed]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
        loadMore();
      }
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  const handleLike = async (momentId: number, index: number) => {
    try {
      await toggleLike(momentId);
      setFeed(prev => prev.map((m, i) => {
        if (i !== index) return m;
        return {
          ...m,
          is_liked: !m.is_liked,
          like_count: m.is_liked ? m.like_count - 1 : m.like_count + 1,
        };
      }));
    } catch {}
  };

  const handleParticipate = () => {
    navigate(`/moments/publish?topic=${encodeURIComponent(decodedName)}`);
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
        <h1 className="text-[15px] font-extrabold text-[#2D1B1B] flex-1">#{decodedName}</h1>
        <button className="p-1.5">
          <Search size={18} color="#2D1B1B" />
        </button>
        <button className="p-1.5">
          <Share2 size={18} color="#2D1B1B" />
        </button>
      </div>

      {/* Topic Banner */}
      {topic && (
        <div
          className="flex-shrink-0 mx-[14px] rounded-[14px] px-4 py-5 relative overflow-hidden"
          style={{ minHeight: '130px' }}
        >
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${getUrl(topic.cover_image)})` }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,107,107,0.8) 0%, rgba(255,179,71,0.7) 100%)' }} />
          <h2 className="relative text-[20px] font-extrabold text-white mb-1">{topic.name}</h2>
          <p className="relative text-[10px] text-white/85 mb-4 leading-relaxed">{topic.description}</p>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {topic.active_users && topic.active_users.length > 0 && (
                <div className="flex -space-x-2">
                  {topic.active_users.slice(0, 3).map((u, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border-[1.5px] border-white/50 overflow-hidden bg-white/20"
                      style={{ zIndex: 3 - i }}
                    >
                      <SafeImg src={getUrl(u.avatar)} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
              {topic.usage_count > 0 ? (
                <span className="text-[11px] text-white/90">{topic.usage_count}人参与</span>
              ) : (
                <span className="text-[11px] text-white/90">来参与吧</span>
              )}
            </div>
            <button
              onClick={handleParticipate}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/20 text-white text-[13px] font-medium active:scale-95 transition-transform"
            >
              <Plus size={14} />
              <span>参与</span>
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex-shrink-0 flex items-center gap-6 px-4 py-3">
        <button
          onClick={() => setTab('hot')}
          className={`flex items-center gap-1.5 text-[13px] font-semibold pb-1.5 relative ${
            tab === 'hot' ? 'text-[#FF6B6B]' : 'text-[#BBA0A0]'
          }`}
        >
          <Flame size={14} />
          最热
          {tab === 'hot' && (
            <motion.div
              layoutId="topic-tab"
              className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
              style={{ background: '#FF6B6B' }}
            />
          )}
        </button>
        <button
          onClick={() => setTab('latest')}
          className={`flex items-center gap-1.5 text-[13px] font-semibold pb-1.5 relative ${
            tab === 'latest' ? 'text-[#FF6B6B]' : 'text-[#BBA0A0]'
          }`}
        >
          <Clock size={14} />
          最新
          {tab === 'latest' && (
            <motion.div
              layoutId="topic-tab"
              className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
              style={{ background: '#FF6B6B' }}
            />
          )}
        </button>
      </div>

      {/* Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        {initialLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#BBA0A0]" />
          </div>
        ) : feed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#BBA0A0]">
            <p className="text-[13px]">暂无动态，快来第一个参与吧</p>
          </div>
        ) : (
          <div className="pb-6">
            {(() => {
              const [leftCol, rightCol] = splitToWaterfall(feed);
              return (
                <div className="px-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {leftCol.map((moment, idx) => (
                      <WaterfallMomentCard key={moment.id} moment={moment} styleIndex={idx}
                        onLike={(id) => handleLike(id, feed.findIndex(m => m.id === id))}
                        onImageView={setViewImage}
                        onDelete={() => setFeed(prev => prev.filter(m => m.id !== moment.id))} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {rightCol.map((moment, idx) => (
                      <WaterfallMomentCard key={moment.id} moment={moment} styleIndex={idx + leftCol.length}
                        onLike={(id) => handleLike(id, feed.findIndex(m => m.id === id))}
                        onImageView={setViewImage} />
                    ))}
                  </div>
                </div>
              );
            })()}

            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={20} className="animate-spin text-[#BBA0A0]" />
              </div>
            )}
          </div>
        )}
      </div>

      <BackToTop scrollRef={scrollRef} />
      {viewImage && <ImageViewer images={[viewImage]} initialIndex={0} onClose={() => setViewImage(null)} />}
    </motion.div>
  );
}
