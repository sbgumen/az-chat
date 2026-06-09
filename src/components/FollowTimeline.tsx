import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, MapPin, Mic } from 'lucide-react';
import { toggleLike } from '../api/moments';
import { ImageViewer } from './ImageViewer';
import { renderMentionContent } from '../utils/mention';
import { SafeImg } from './SafeImg';
import type { Moment } from '../types';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getUrl = (s: string) => s?.startsWith('http') ? s : `${apiBase}${s}`;

interface FollowTimelineProps {
  moments: Moment[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

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
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function getDateLabel(ts: string): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return '今天';
  if (d.toDateString() === yesterday.toDateString()) return '昨天';
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function FollowTimeline({ moments, loading, hasMore, onLoadMore }: FollowTimelineProps) {
  const navigate = useNavigate();
  const [viewImage, setViewImage] = useState<string | null>(null);

  const handleLike = async (e: React.MouseEvent, moment: Moment) => {
    e.stopPropagation();
    try {
      await toggleLike(moment.id);
    } catch {}
  };

  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) onLoadMore();
    }, { rootMargin: '200px' });
    observer.observe(node);
  }, [hasMore, loading, onLoadMore]);

  if (loading && moments.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-[#FF6B6B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!loading && moments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#BBA0A0]">
        <p className="text-[13px]">关注的人还没有动态</p>
        <p className="text-[11px] mt-1">去看看推荐吧</p>
      </div>
    );
  }

  let lastDate = '';

  return (
    <div style={{ backgroundColor: '#F8F3F0', paddingBottom: '80px' }}>
      <div className="flex flex-col">
        {moments.map((moment) => {
          const dateLabel = getDateLabel(moment.created_at);
          const showDate = dateLabel !== lastDate;
          lastDate = dateLabel;
          const images = (Array.isArray(moment.images) ? moment.images : []).slice(0, 3);

          return (
            <div key={moment.id}>
              {showDate && (
                <div className="text-center py-3">
                  <span className="text-[11px]" style={{ color: '#B0B0B0' }}>{dateLabel}</span>
                </div>
              )}

              <div
                className="flex px-3.5 py-3 cursor-pointer"
                style={{ backgroundColor: '#F8F3F0' }}
                onClick={() => navigate(`/moments/${moment.id}`)}
              >
                {/* Avatar */}
                <SafeImg
                  src={getUrl(moment.user_avatar)}
                  alt=""
                  className="flex-shrink-0 bg-[#E0D8D8] object-cover"
                  style={{ width: '38px', height: '38px', borderRadius: '4px' }}
                  onClick={(e: any) => { e.stopPropagation(); navigate(`/user/${moment.user_id}/moments`); }}
                />

                {/* Content area */}
                <div className="flex-1 min-w-0 ml-2.5">
                  {/* Nickname */}
                  <div className="mb-1">
                    <span className="text-[14px] font-semibold" style={{ color: '#576B95' }}>
                      {moment.user_nickname}
                    </span>
                  </div>

                  {/* Text content */}
                  {moment.content && (
                    <div
                      className="text-[14px] mb-1.5 whitespace-pre-wrap break-words"
                      style={{ color: '#333', lineHeight: 1.5 }}
                    >
                      {renderMentionContent(moment.content)}
                    </div>
                  )}

                  {/* Topic tags */}
                  {moment.topic_name && (
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {moment.topic_name.split(/[,，\s]+/).filter(Boolean).map((tag, i) => {
                        const cleanTag = tag.startsWith('#') ? tag.slice(1) : tag;
                        return (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 text-[10px] font-medium"
                            style={{ backgroundColor: '#FFF0E5', color: '#FF6B6B', borderRadius: '2px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/topics/${encodeURIComponent(cleanTag)}`);
                            }}
                          >
                            {cleanTag}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Images grid */}
                  {images.length > 0 && (
                    <div
                      className="mb-1.5"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: images.length === 1
                          ? 'minmax(0, 200px)'
                          : images.length === 2
                          ? 'repeat(2, minmax(0, 110px))'
                          : 'repeat(3, minmax(0, 1fr))',
                        gap: '3px',
                      }}
                    >
                      {images.slice(0, 9).map((img, i) => (
                        <div
                          key={i}
                          className="aspect-square overflow-hidden cursor-pointer"
                          style={{ borderRadius: '2px' }}
                          onClick={(e) => { e.stopPropagation(); setViewImage(getUrl(img)); }}
                        >
                          <SafeImg src={getUrl(img)} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Audio bar */}
                  {moment.audio_url && (
                    <div
                      className="flex items-center gap-2 px-3 mb-1.5"
                      style={{ height: '32px', background: 'linear-gradient(90deg, #FF6B6B, #FFB347)', borderRadius: '4px' }}
                    >
                      <Mic size={12} color="#fff" />
                      <div className="flex-1 h-0.5 bg-white/30 rounded-full">
                        <div className="h-full w-[60%] bg-white rounded-full" />
                      </div>
                      <span className="text-[10px] text-white/70">
                        {moment.audio_duration ? `${Math.floor(moment.audio_duration / 60)}:${String(moment.audio_duration % 60).padStart(2, '0')}` : '0:00'}
                      </span>
                    </div>
                  )}

                  {/* Location */}
                  {moment.location && (
                    <div className="flex items-center gap-0.5 mb-1">
                      <MapPin size={11} color="#B0B0B0" />
                      <span className="text-[10px]" style={{ color: '#B0B0B0' }}>{moment.location}</span>
                    </div>
                  )}

                  {/* Bottom bar: time + actions */}
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px]" style={{ color: '#B0B0B0' }}>{formatTime(moment.created_at)}</span>
                    <div className="flex items-center gap-3">
                      <button
                        className="flex items-center gap-1"
                        onClick={(e) => handleLike(e, moment)}
                      >
                        <Heart
                          size={15}
                          fill={moment.is_liked ? '#FF6B6B' : 'none'}
                          color={moment.is_liked ? '#FF6B6B' : '#999'}
                        />
                        {moment.like_count > 0 && (
                          <span className="text-[11px]" style={{ color: moment.is_liked ? '#FF6B6B' : '#999' }}>
                            {moment.like_count}
                          </span>
                        )}
                      </button>
                      <button className="flex items-center gap-1">
                        <MessageCircle size={15} color="#999" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Load more */}
        {hasMore && (
          <div ref={loadMoreRef} className="flex items-center justify-center py-4" style={{ backgroundColor: '#F8F3F0' }}>
            {loading && <div className="w-5 h-5 border-2 border-[#FF6B6B] border-t-transparent rounded-full animate-spin" />}
          </div>
        )}
      </div>

      {viewImage && <ImageViewer images={[viewImage]} initialIndex={0} onClose={() => setViewImage(null)} />}
    </div>
  );
}
