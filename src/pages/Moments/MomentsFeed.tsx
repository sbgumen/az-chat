import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bell, Heart, MessageCircle, Share2, MoreHorizontal,
  ChevronLeft, ChevronRight, Plus, Hash, MapPin, Mic, Compass, Edit3, Trash2
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { ImageViewer } from '../../components/ImageViewer';
import { renderMentionContent } from '../../utils/mention';
import { FollowTimeline } from '../../components/FollowTimeline';
import { PublishButton } from '../../components/PublishButton';
import { SafeImg } from '../../components/SafeImg';
import { useScrollMemory } from '../../hooks/useScrollMemory';
import {
  getFeed, getHotTopics, getRecommendUsers,
  toggleLike, getUnreadNotificationCount, deleteMoment
} from '../../api/moments';
import { followUser, unfollowUser, getFollowing, getFollowFeedUnread, clearFollowFeedUnread } from '../../api/user';
import type { Moment, Topic } from '../../types';

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getAvatar = (a: string) => a?.startsWith('http') ? a : `${apiBase}${a}`;

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHr < 24) return `${diffHr}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

// ────────────────────────────────────────────
// Skeleton placeholder
// ────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-[#F5F0EB] rounded-[10px] animate-pulse overflow-hidden">
      <div className="w-full" style={{ paddingTop: '110%', position: 'relative' }}>
        <div className="absolute inset-0 flex flex-col justify-end p-2.5">
          <div className="flex flex-col gap-1.5 mb-3">
            <div className="h-2.5 bg-[#E8DDCC] rounded w-3/4" />
            <div className="h-2 bg-[#E8DDCC] rounded w-1/2" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-[#E8DDCC]" />
            <div className="h-2 bg-[#E8DDCC] rounded w-1/3" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Hot Topic Banner Carousel
// ────────────────────────────────────────────

function HotTopicBanner({ topics, navigate }: { topics: Topic[]; navigate: ReturnType<typeof useNavigate> }) {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  // 无热门时随机选取，每次刷新不同
  const shuffledRef = useRef<Topic[]>([]);
  if (shuffledRef.current.length === 0 && topics.length > 0) {
    shuffledRef.current = [...topics].sort(() => Math.random() - 0.5).slice(0, 4);
  }

  const displayTopics = topics.length > 0 ? shuffledRef.current : [];

  useEffect(() => {
    if (displayTopics.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActive(prev => (prev + 1) % displayTopics.length);
    }, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [displayTopics.length]);

  if (!displayTopics.length) return null;

  const topic = displayTopics[active];

  return (
    <div className="px-3 mb-4">
      <div
        className="relative rounded-[14px] overflow-hidden cursor-pointer"
        style={{
          height: '120px',
          boxShadow: '0 4px 16px rgba(255,107,107,0.2)',
        }}
        onClick={() => navigate(`/topics/${encodeURIComponent(topic.name)}`)}
      >
        {/* Animated banner content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={topic.id}
            className="absolute inset-0"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            {/* Cover image background */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${getAvatar(topic.cover_image)})` }}
            />
            {/* Gradient overlay for readability */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,107,107,0.75) 0%, rgba(255,179,71,0.65) 100%)' }} />
            {/* Content */}
            <div className="absolute inset-0 px-4 py-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Hash size={14} className="text-white/90" />
                  <span className="text-[15px] font-extrabold text-white leading-tight">
                    #{topic.name}
                  </span>
                </div>
                {topic.description && (
                  <p className="text-[11px] text-white/75 leading-tight line-clamp-1">
                    {topic.description}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {topic.active_users && topic.active_users.length > 0 && (
                    <div className="flex -space-x-2">
                      {topic.active_users.slice(0, 3).map((u, i) => (
                        <div
                          key={i}
                          className="w-5 h-5 rounded-full border-2 border-white/50 overflow-hidden bg-cream-300"
                        >
                          <SafeImg src={getAvatar(u.avatar)} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                  {topic.usage_count > 0 && (
                    <span className="text-[10px] text-white/70">{topic.usage_count}人参与</span>
                  )}
                  {topic.usage_count === 0 && (
                    <span className="text-[10px] text-white/70">来参与吧</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Arrows + Dots */}
      {displayTopics.length > 1 && (
        <div className="flex items-center justify-between mt-2.5 px-3">
          <div className="flex gap-2">
            {displayTopics.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActive(i); }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === active ? '16px' : '6px',
                  height: '6px',
                  backgroundColor: i === active ? '#FF6B6B' : 'rgba(187,160,160,0.4)',
                }}
                aria-label={`话题 ${i + 1}`}
              />
            ))}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); setActive(p => (p - 1 + displayTopics.length) % displayTopics.length); }}
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,107,107,0.1)' }}
              aria-label="上一个话题"
            >
              <ChevronLeft size={12} style={{ color: '#FF6B6B' }} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setActive(p => (p + 1) % displayTopics.length); }}
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,107,107,0.1)' }}
              aria-label="下一个话题"
            >
              <ChevronRight size={12} style={{ color: '#FF6B6B' }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// Mosaic Mixed Pool (Topics + Users + Publish)
// ────────────────────────────────────────────

interface RecommendUser {
  id: number;
  nickname: string;
  avatar: string;
  level?: number;
}

function MosaicPool({
  users, user, navigate,
}: {
  users: RecommendUser[];
  user: ReturnType<typeof useAuth>['user'];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    getFollowing().then((res: any) => {
      if (res.code === 0 && res.data) setFollowingIds(new Set((res.data || []).map((u: any) => u.id)));
    }).catch(() => {});
  }, []);

  const handleToggleFollow = async (e: React.MouseEvent, userId: number) => {
    e.stopPropagation();
    const isFollowed = followingIds.has(userId);
    setFollowingIds(prev => { const next = new Set(prev); isFollowed ? next.delete(userId) : next.add(userId); return next; });
    try { if (isFollowed) await unfollowUser(userId); else await followUser(userId); } catch {
      setFollowingIds(prev => { const next = new Set(prev); isFollowed ? next.add(userId) : next.delete(userId); return next; });
    }
  };

  return (
    <div className="mb-3">
      {/* 推荐好友 — 头像 + 昵称简洁横滚 */}
      {users.length > 0 && (
        <div className="px-2" style={{ display: 'flex', gap: '0', paddingTop: '4px', paddingBottom: '8px' }}>
          {/* 我的 — 固定在左侧 */}
          <div
            className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
            style={{ width: '52px', marginRight: '10px' }}
            onClick={() => navigate('/moments/mine')}
          >
            <div style={{ position: 'relative', width: '44px', height: '44px' }}>
              <SafeImg
                src={user ? getAvatar((user as any).avatar) : '/default-avatar.png'}
                alt=""
                style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute', bottom: '-2px', right: '-2px',
                width: '18px', height: '18px', borderRadius: '50%',
                background: '#FF6B6B', border: '2px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Plus size={10} color="#fff" strokeWidth={3} />
              </div>
            </div>
            <span style={{ fontSize: '10px', color: '#FF6B6B', fontWeight: 700 }}>我的</span>
          </div>

          {/* 推荐用户 — 横向滚动 */}
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', scrollbarWidth: 'none', flex: 1 }}>
            {users.slice(0, 10).map(u => (
              <div
                key={u.id}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                style={{ width: '52px' }}
                onClick={() => navigate(`/user/${u.id}/moments`)}
              >
                <div style={{ position: 'relative', width: '44px', height: '44px' }}>
                  <SafeImg
                    src={getAvatar(u.avatar)}
                    alt=""
                    style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <button
                    onClick={(e) => handleToggleFollow(e, u.id)}
                    style={{
                      position: 'absolute', bottom: '-3px', left: '50%', transform: 'translateX(-50%)',
                      fontSize: '8px', fontWeight: 700, padding: '1px 8px', borderRadius: '8px',
                      background: followingIds.has(u.id) ? '#E8E8E8' : '#FF6B6B',
                      color: followingIds.has(u.id) ? '#999' : '#fff',
                      border: '1px solid #fff', cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    {followingIds.has(u.id) ? '已关注' : '关注'}
                  </button>
                </div>
                <span style={{ fontSize: '10px', color: '#2D1B1B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '48px', textAlign: 'center' }}>
                  {u.nickname?.slice(0, 5)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

// ────────────────────────────────────────────
// Feed Card — 双列瀑布流
// ────────────────────────────────────────────

// 文字卡片配色方案（六种风格随机混合）
const textCardSchemes = [
  { // 暖米杂志风
    bg: 'linear-gradient(170deg, #F5F0EB, #EDE4D8)',
    title: '#3D2B1B', sub: '#8B7B6B', decoColor: '#C4B5A5',
    decoType: 'line' as const,
  },
  { // 淡紫留白风
    bg: 'linear-gradient(170deg, #F3EFFF, #EDE7F6)',
    title: '#4A3D6B', sub: '#8B7DC4', decoColor: '#9B8DC4',
    decoType: 'dot' as const,
  },
  { // 暗棕几何风
    bg: 'linear-gradient(170deg, #2D1B1B, #3D2B2B)',
    title: 'rgba(255,255,255,0.9)', sub: 'rgba(255,255,255,0.45)',
    decoColor: 'rgba(255,255,255,0.35)',
    decoType: 'dotGroup' as const,
  },
  { // 暖橙渐变风
    bg: 'linear-gradient(170deg, #FFF0E5, #FFE0D0)',
    title: '#8B4A3A', sub: '#B0705A', decoColor: '#C49585',
    decoType: 'ring' as const,
  },
  { // 青绿纯色风
    bg: '#4ECDC4',
    title: 'rgba(255,255,255,0.95)', sub: 'rgba(255,255,255,0.5)',
    decoColor: 'rgba(255,255,255,0.35)',
    decoType: 'line' as const,
  },
  { // 深绿暗色风
    bg: 'linear-gradient(170deg, #1B3A2D, #2D5A3D)',
    title: 'rgba(255,255,255,0.9)', sub: 'rgba(255,255,255,0.4)',
    decoColor: 'rgba(255,255,255,0.25)',
    decoType: 'dot' as const,
  },
];

// 估算卡片高度用于瀑布流分配
function estimateCardHeight(m: Moment): number {
  const contentLen = m.content?.length || 0;
  const images = Array.isArray(m.images) ? m.images : [];
  const hasAudio = !!m.audio_url;
  let h = 0;
  if (images.length > 0) {
    // 1图: 4/3 taller, 2图: 3/4 each, 3图: 3/4+3/4+2/1
    h += images.length === 1 ? 140 : images.length === 2 ? 120 : 130;
  } else {
    h += contentLen > 80 ? 170 : contentLen > 25 ? 145 : 120;
  }
  if (hasAudio) h += 20;
  return h;
}

// 将动态分配到左右两列（瀑布流算法）
function splitToWaterfall(moments: Moment[]): [Moment[], Moment[]] {
  const left: Moment[] = [];
  const right: Moment[] = [];
  let leftH = 0;
  let rightH = 0;
  for (const m of moments) {
    const h = estimateCardHeight(m);
    if (leftH <= rightH) {
      left.push(m);
      leftH += h;
    } else {
      right.push(m);
      rightH += h;
    }
  }
  return [left, right];
}

interface FeedCardProps {
  moment: Moment;
  navigate: ReturnType<typeof useNavigate>;
  onLike: (momentId: number) => void;
  onDelete: (momentId: number) => void;
  styleIndex: number;
}

function FeedCard({ moment, navigate, onLike, onDelete, styleIndex }: FeedCardProps) {
  const { user } = useAuth();
  const [likeAnim, setLikeAnim] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const images = Array.isArray(moment.images) ? moment.images : [];
  const isTextCard = images.length === 0 && !moment.audio_url;
  const scheme = textCardSchemes[styleIndex % textCardSchemes.length];

  useEffect(() => {
    if (!user || user.id === moment.user_id) return;
    getFollowing().then((res: any) => {
      if (res.code === 0) setIsFollowing((res.data || []).some((u: any) => u.id === moment.user_id));
    }).catch(() => {});
  }, [moment.user_id, user]);

  // Canvas 2D 艺术线条
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isTextCard) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const scheme = textCardSchemes[styleIndex % textCardSchemes.length];
    const textLen = (moment.content || '').length;
    const color = scheme.decoColor;
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 0.3;

    if (textLen <= 4) {
      // 极短文：底部波浪线 + 散落小圆
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      const baseY = h * 0.72;
      for (let x = w * 0.15; x < w * 0.85; x += 2) {
        const y = baseY + Math.sin(x * 0.06) * 6 + Math.sin(x * 0.15) * 3;
        x === w * 0.15 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      // 散落圆点
      for (let i = 0; i < 12; i++) {
        const cx = w * (0.1 + Math.random() * 0.8);
        const cy = h * (0.15 + Math.random() * 0.25);
        ctx.beginPath();
        ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    } else if (textLen <= 12) {
      // 短文：两条交错的贝塞尔曲线
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(w * 0.12, h * 0.22);
      ctx.bezierCurveTo(w * 0.35, h * 0.12, w * 0.65, h * 0.32, w * 0.88, h * 0.25);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w * 0.15, h * 0.78);
      ctx.bezierCurveTo(w * 0.4, h * 0.88, w * 0.6, h * 0.68, w * 0.85, h * 0.75);
      ctx.stroke();
    } else if (textLen <= 25) {
      // 中长文：四角短装饰线
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.8;
      const corners = [
        { x: w * 0.08, y: h * 0.12, dx: 16, dy: 0 },
        { x: w * 0.08, y: h * 0.12, dx: 0, dy: 16 },
        { x: w * 0.92, y: h * 0.12, dx: -16, dy: 0 },
        { x: w * 0.92, y: h * 0.12, dx: 0, dy: 16 },
        { x: w * 0.08, y: h * 0.88, dx: 16, dy: 0 },
        { x: w * 0.08, y: h * 0.88, dx: 0, dy: -16 },
        { x: w * 0.92, y: h * 0.88, dx: -16, dy: 0 },
        { x: w * 0.92, y: h * 0.88, dx: 0, dy: -16 },
      ];
      corners.forEach(c => {
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(c.x + c.dx, c.y + c.dy);
        ctx.stroke();
      });
    } else {
      // 长文：顶部装饰线 + 左下大圆弧
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.2, h * 0.08);
      ctx.lineTo(w * 0.8, h * 0.08);
      ctx.stroke();
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.arc(w * 0.12, h * 0.86, 20, 0, Math.PI / 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, [canvasRef, isTextCard, moment.content, styleIndex]);

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFollowing(!isFollowing);
    try {
      if (isFollowing) await unfollowUser(moment.user_id);
      else await followUser(moment.user_id);
    } catch { setIsFollowing(isFollowing); }
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 600);
    onLike(moment.id);
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try { await deleteMoment(moment.id); onDelete(moment.id); } catch {}
    setShowDeleteConfirm(false);
  };

  const deleteDialog = showDeleteConfirm ? (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}
      onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '18px 20px', width: '85%', maxWidth: '240px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <p style={{ fontSize: '14px', color: '#2D1B1B', fontWeight: 600, margin: '0 0 6px' }}>确认删除</p>
        <p style={{ fontSize: '11px', color: '#BBA0A0', margin: '0 0 14px' }}>删除后无法恢复</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }} style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '13px', background: '#F5F0F0', color: '#2D1B1B', border: 'none', cursor: 'pointer' }}>取消</button>
          <button onClick={handleDeleteConfirm} style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '13px', background: '#FF6B6B', color: '#fff', border: 'none', cursor: 'pointer' }}>删除</button>
        </div>
      </div>
    </div>
  ) : null;

  // 信息栏组件（文字卡片和图片卡片共用）
  const InfoBar = () => (
    <div style={{ padding: '10px 10px 12px', background: '#fff' }}>
      {/* 第一行：头像 + 昵称 + 时间 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <SafeImg
            src={getAvatar(moment.user_avatar)}
            alt=""
            style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            onClick={(e: any) => { e.stopPropagation(); navigate(`/user/${moment.user_id}/moments`); }}
          />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#2D1B1B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70px' }}>
            {moment.user_nickname}
          </span>
        </div>
        <span style={{ fontSize: '10px', color: '#BBA0A0', flexShrink: 0 }}>{formatRelativeTime(moment.created_at)}</span>
      </div>

      {/* 第二行：等级 + 关注 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        {moment.user_level && moment.user_level > 0 && (
          <span style={{ fontSize: '9px', color: '#FF6B6B', background: '#FFF0E5', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
            LV.{moment.user_level}
          </span>
        )}
        {user && user.id !== moment.user_id && (
          <button
            onClick={handleFollowToggle}
            style={{
              fontSize: '9px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
              background: isFollowing ? '#F0F0F0' : 'linear-gradient(135deg, #FF6B6B, #FFB347)',
              color: isFollowing ? '#BBA0A0' : '#fff', border: 'none', cursor: 'pointer',
            }}
          >
            {isFollowing ? '已关注' : '关注'}
          </button>
        )}
      </div>

      {/* 第三行：位置 */}
      {moment.location && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '6px' }}>
          <MapPin size={10} color="#C4B5A5" />
          <span style={{ fontSize: '10px', color: '#C4B5A5' }}>{moment.location}</span>
        </div>
      )}

      {/* 互动图标行 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: moment.location ? '0' : '4px' }}>
        <button onClick={handleLikeClick} style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, position: 'relative' as const }}>
          <Heart size={15} fill={moment.is_liked ? '#FF6B6B' : 'none'} color={moment.is_liked ? '#FF6B6B' : '#BBA0A0'} />
          <span style={{ fontSize: '11px', color: moment.is_liked ? '#FF6B6B' : '#BBA0A0', fontWeight: 500 }}>{moment.like_count || ''}</span>
          <AnimatePresence>
            {likeAnim && !moment.is_liked && Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={i}
                style={{ position: 'absolute', top: '50%', left: '50%', width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#FF6B6B', pointerEvents: 'none' }}
                initial={{ x: 0, y: 0, opacity: 0.8, scale: 0 }}
                animate={{ x: Math.cos(i * 90 * Math.PI / 180) * 10, y: Math.sin(i * 90 * Math.PI / 180) * 10, opacity: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            ))}
          </AnimatePresence>
        </button>
        <button onClick={() => navigate(`/moments/${moment.id}`)} style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <MessageCircle size={15} color="#BBA0A0" />
          <span style={{ fontSize: '11px', color: '#BBA0A0', fontWeight: 500 }}>{moment.comment_count || ''}</span>
        </button>
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            if (navigator.share) {
              navigator.share({ title: moment.content || '分享动态', url: `${window.location.origin}/moments/${moment.id}` }).catch(() => {});
            }
          }}
        >
          <Share2 size={15} color="#BBA0A0" />
        </button>
        {/* 更多操作（自己的动态） */}
        {user && user.id === moment.user_id && (
          <div style={{ position: 'relative', marginLeft: 'auto' }}>
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            >
              <MoreHorizontal size={15} color="#BBA0A0" />
            </button>
            {showMenu && (
              <div style={{ position: 'absolute', right: 0, bottom: '22px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', padding: '2px 0', zIndex: 10, minWidth: '80px' }}>
                <button
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', color: '#2D1B1B', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
                  onClick={(e) => { e.stopPropagation(); navigate(`/moments/publish?edit=${moment.id}`); setShowMenu(false); }}
                >
                  <Edit3 size={12} />编辑
                </button>
                <button
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', color: '#FF6B6B', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
                  onClick={handleDeleteClick}
                >
                  <Trash2 size={12} />删除
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // ── 纯文字卡片（按文本长度自适应）──
  if (isTextCard) {
    const content = moment.content || '';
    const textLen = content.length;

    type TextGrade = 'micro' | 'short' | 'medium' | 'long';
    const grade: TextGrade = textLen <= 4 ? 'micro' : textLen <= 12 ? 'short' : textLen <= 25 ? 'medium' : 'long';

    const gradeConfig = {
      micro:   { size: '26px', aspect: '110%', weight: 800, lsp: '5px',  lh: 1.3, font: "'ZCOOL XiaoWei', serif" },
      short:   { size: '20px', aspect: '125%', weight: 700, lsp: '3px',  lh: 1.5, font: "'ZCOOL XiaoWei', 'Noto Sans SC', sans-serif" },
      medium:  { size: '16px', aspect: '145%', weight: 700, lsp: '1.5px', lh: 1.6, font: "'Noto Sans SC', sans-serif" },
      long:    { size: '14px', aspect: '170%', weight: 600, lsp: '1px',   lh: 1.7, font: "'Noto Sans SC', sans-serif" },
    }[grade];

    const renderDeco = () => {
      switch (scheme.decoType) {
        case 'line':
          return <div style={{ width: '32px', height: '1px', background: scheme.decoColor, marginBottom: '14px' }} />;
        case 'dot':
          return <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: scheme.decoColor, marginBottom: '14px' }} />;
        case 'ring':
          return <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: `1px solid ${scheme.decoColor}`, marginBottom: '14px' }} />;
        case 'dotGroup':
          return (
            <div style={{ display: 'flex', gap: '5px', marginBottom: '14px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: scheme.decoColor }} />
              ))}
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <article
        className="cursor-pointer"
        style={{ borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.025)' }}
        onClick={() => navigate(`/moments/${moment.id}`)}
      >
        {/* 文字内容区 */}
        <div style={{
          position: 'relative', width: '100%', paddingTop: gradeConfig.aspect,
          background: scheme.bg, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Canvas 2D 艺术线条层 */}
          <canvas
            ref={canvasRef}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: grade === 'micro' ? '30px 22px' : grade === 'long' ? '18px 16px' : '22px 16px',
          }}>
            {renderDeco()}
            <div style={{
              fontSize: gradeConfig.size, fontWeight: gradeConfig.weight,
              color: scheme.title, lineHeight: gradeConfig.lh,
              letterSpacing: gradeConfig.lsp, fontFamily: gradeConfig.font,
              textAlign: 'center', wordBreak: 'break-word',
            }}>
              {content}
            </div>
          </div>
        </div>

        {/* 信息分隔区 */}
        <InfoBar />
        {deleteDialog}
      </article>
    );
  }

  // ── 图片卡片 ──
  const displayImages = images.slice(0, 3);
  const imgCount = displayImages.length;

  return (
    <article
      className="cursor-pointer"
      style={{ borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.025)' }}
      onClick={() => navigate(`/moments/${moment.id}`)}
    >
      {/* 图片区 */}
      {imgCount > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: imgCount === 1 ? '1fr' : '1fr 1fr',
          gap: '2px',
          overflow: 'hidden',
        }}>
          {displayImages.map((img, i) => {
            const isThirdOf3 = imgCount === 3 && i === 2;
            const isSingle = imgCount === 1;
            const aspect = isThirdOf3 ? '2 / 1' : isSingle ? '4 / 3' : '3 / 4';
            return (
              <div
                key={i}
                className="overflow-hidden"
                style={{
                  gridColumn: isThirdOf3 ? 'span 2' : undefined,
                  aspectRatio: aspect,
                }}
              >
                <SafeImg src={img.startsWith('http') ? img : `${apiBase}${img}`} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            );
          })}
        </div>
      )}

      {/* 语音条（无图时） */}
      {moment.audio_url && imgCount === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 12px', background: 'linear-gradient(90deg, #FF6B6B, #FFB347)' }}>
          <Mic size={16} color="#fff" />
          <div style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px' }}>
            <div style={{ width: '60%', height: '100%', background: '#fff', borderRadius: '2px' }} />
          </div>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
            {moment.audio_duration ? `${Math.floor(moment.audio_duration / 60)}:${String(moment.audio_duration % 60).padStart(2, '0')}` : '0:00'}
          </span>
        </div>
      )}

      {/* 分隔线 */}
      <div style={{ height: '1px', background: '#F0E6E6', margin: '0 10px' }} />

      {/* 文字内容 */}
      <div style={{ padding: '8px 10px 2px' }}>
        {/* 话题标签 */}
        {moment.topic_name && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
            {moment.topic_name.split(/[,，\s]+/).filter(Boolean).slice(0, 2).map((tag, i) => {
              const cleanTag = tag.startsWith('#') ? tag.slice(1) : tag;
              return (
                <span
                  key={i}
                  style={{ fontSize: '9px', color: '#FF6B6B', background: '#FFF0E5', padding: '2px 6px', borderRadius: '4px', fontWeight: 500, cursor: 'pointer' }}
                  onClick={(e) => { e.stopPropagation(); navigate(`/topics/${encodeURIComponent(cleanTag)}`); }}
                >
                  {cleanTag}
                </span>
              );
            })}
          </div>
        )}

        {/* 文本 */}
        {moment.content && (
          <div style={{ fontSize: '12px', color: '#3D2B2B', lineHeight: 1.5, overflow: 'hidden', maxHeight: '36px', position: 'relative' }}>
            <span style={{ wordBreak: 'break-word' }}>
              {renderMentionContent(moment.content)}
            </span>
            {(moment.content || '').length > 40 && (
              <div style={{ position: 'absolute', top: 0, right: 0, width: '40px', height: '100%', background: 'linear-gradient(to right, transparent, #fff)' }} />
            )}
          </div>
        )}

        {/* 语音条（有图时） */}
        {moment.audio_url && imgCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', background: 'linear-gradient(90deg, #FF6B6B, #FFB347)', borderRadius: '4px', marginBottom: '4px' }}>
            <Mic size={12} color="#fff" />
            <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.3)', borderRadius: '1px' }}><div style={{ width: '60%', height: '100%', background: '#fff', borderRadius: '1px' }} /></div>
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.8)' }}>{moment.audio_duration ? `${Math.floor(moment.audio_duration / 60)}:${String(moment.audio_duration % 60).padStart(2, '0')}` : '0:00'}</span>
          </div>
        )}
      </div>

      {/* 信息栏 */}
      <InfoBar />
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '18px 20px', width: '85%', maxWidth: '240px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <p style={{ fontSize: '14px', color: '#2D1B1B', fontWeight: 600, marginBottom: '6px' }}>确认删除</p>
            <p style={{ fontSize: '11px', color: '#BBA0A0', marginBottom: '14px' }}>删除后无法恢复</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }} style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '13px', background: '#F5F0F0', color: '#2D1B1B', border: 'none', cursor: 'pointer' }}>取消</button>
              <button onClick={handleDeleteConfirm} style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '13px', background: '#FF6B6B', color: '#fff', border: 'none', cursor: 'pointer' }}>删除</button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

// ────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────

export function MomentsFeed() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { on } = useSocket();

  // Tab state（从 sessionStorage 恢复，URL params 优先）
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<'recommend' | 'follow'>(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab === 'follow' || urlTab === 'recommend') return urlTab;
    return (sessionStorage.getItem('moments_tab') as 'recommend' | 'follow') || 'recommend';
  });

  // 切换 tab 时持久化到 URL + sessionStorage
  const switchTab = (t: 'recommend' | 'follow') => {
    sessionStorage.setItem('moments_tab', t);
    setSearchParams(t === 'follow' ? { tab: 'follow' } : {});
    setTab(t);
  };

  // Data
  const [moments, setMoments] = useState<Moment[]>([]);
  const [hotTopics, setHotTopics] = useState<Topic[]>([]);
  const [recommendUsers, setRecommendUsers] = useState<RecommendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // ImageViewer
  const [imageViewerSrc, setImageViewerSrc] = useState<string | null>(null);
  const [notifUnread, setNotifUnread] = useState(0);
  const [followUnread, setFollowUnread] = useState(0);

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // 滚动位置保持
  useScrollMemory(`moments_${tab}`, scrollRef, !loading);

  // ── Data Fetching ──

  const fetchInitialData = useCallback(async (currentTab: string) => {
    setLoading(true);
    try {
      const [feedRes, topicsRes, usersRes]: any[] = await Promise.all([
        getFeed(currentTab, 1),
        getHotTopics(),
        getRecommendUsers(),
      ]);
      const feedData = feedRes?.code === 0 ? feedRes.data : { list: [], pagination: { hasMore: false } };
      setMoments(feedData.list || []);
      setPage(1);
      setHasMore(feedData.pagination?.hasMore ?? false);

      setHotTopics(topicsRes?.code === 0 ? (topicsRes.data || []) : []);
      setRecommendUsers(usersRes?.code === 0 ? (usersRes.data || []) : []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    fetchInitialData(tab);
  }, [tab, fetchInitialData]);

  // ── Socket ──

  // 初始加载未读数
  useEffect(() => {
    getUnreadNotificationCount().then((res: any) => {
      if (res.code === 0) setNotifUnread(res.data?.total || 0);
    }).catch(() => {});
    getFollowFeedUnread().then((res: any) => {
      if (res.code === 0) setFollowUnread(res.data?.count || 0);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const unsub = on('moment:new', (moment: Moment) => {
      setMoments(prev => [moment, ...prev]);
    });
    return unsub;
  }, [on]);

  useEffect(() => {
    const unsub1 = on('moment:notification', () => {
      setNotifUnread(prev => prev + 1);
    });
    const unsub2 = on('moment:likeUpdate', (data: { momentId: number; likeCount: number; isLiked: boolean }) => {
      setMoments(prev =>
        prev.map(m =>
          m.id === data.momentId
            ? { ...m, like_count: data.likeCount, is_liked: data.isLiked }
            : m
        )
      );
    });
    const unsub3 = on('follow_feed_unread_update', (data: any) => {
      if (typeof data?.count === 'number') setFollowUnread(data.count);
    });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [on]);


  // Pulse re-fetch on focus
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
          fetchInitialData(tab);
        }, 300);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [tab, fetchInitialData]);

  // ── Load More ──

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res: any = await getFeed(tab, nextPage);
      const data = res?.code === 0 ? res.data : { list: [], pagination: { hasMore: false } };
      setMoments(prev => [...prev, ...(data.list || [])]);
      setPage(nextPage);
      setHasMore(data.pagination?.hasMore ?? false);
    } catch {
      /* ignore */
    }
    setLoadingMore(false);
  }, [tab, page, loadingMore, hasMore]);

  // Scroll handler for infinite loading
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

  // ── Interaction Handlers ──

  const handleLike = async (momentId: number) => {
    // Optimistic update
    const moment = moments.find(m => m.id === momentId);
    if (!moment) return;

    const wasLiked = moment.is_liked;
    setMoments(prev =>
      prev.map(m =>
        m.id === momentId
          ? {
              ...m,
              is_liked: !wasLiked,
              like_count: wasLiked ? m.like_count - 1 : m.like_count + 1,
            }
          : m
      )
    );

    try {
      await toggleLike(momentId);
    } catch {
      // Rollback
      setMoments(prev =>
        prev.map(m =>
          m.id === momentId
            ? { ...m, is_liked: wasLiked, like_count: moment.like_count }
            : m
        )
      );
    }
  };

  const handlePublish = () => {
    navigate('/moments/publish');
  };

  // ── Render ──

  return (
    <div
      ref={scrollRef}
      className="absolute inset-0 overflow-y-auto pb-[120px]" style={{ backgroundColor: '#FFFBFA' }}
    >
      {/* ── Top Navigation ── */}
      <header className="sticky z-40 px-4 pb-2" style={{ top: '0px', paddingTop: 'calc(var(--status-bar-height, 0px) + 6px)', backgroundColor: 'rgba(255,251,250,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
        <div className="flex items-center justify-between mb-2">
          {/* Title */}
          <h1 className="text-[15px] font-extrabold flex-shrink-0" style={{ color: '#2D1B1B' }}>
            动态
          </h1>

          {/* Center Tabs */}
          <div className="flex items-center gap-5">
            <button
              onClick={() => {
                if (tab === 'recommend') {
                  scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                  fetchInitialData('recommend');
                } else {
                  switchTab('recommend');
                }
              }}
              className="relative pb-2 text-[13px] font-bold transition-colors"
              style={{ color: tab === 'recommend' ? '#FF6B6B' : '#BBA0A0' }}
            >
              推荐
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full"
                style={{ backgroundColor: '#FF6B6B' }}
                initial={false}
                animate={{ opacity: tab === 'recommend' ? 1 : 0, scaleX: tab === 'recommend' ? 1 : 0.6 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            </button>
            <button
              onClick={() => {
                setFollowUnread(0);
                clearFollowFeedUnread().catch(() => {});
                window.dispatchEvent(new CustomEvent('follow_unread_clear'));
                if (tab === 'follow') {
                  scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                  fetchInitialData('follow');
                } else {
                  switchTab('follow');
                }
              }}
              className="relative pb-2 text-[13px] font-bold transition-colors"
              style={{ color: tab === 'follow' ? '#FF6B6B' : '#BBA0A0' }}
            >
              关注
              {followUnread > 0 && (
                <span className="absolute -top-1 -right-2.5 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {followUnread > 99 ? '99+' : followUnread}
                </span>
              )}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full"
                style={{ backgroundColor: '#FF6B6B' }}
                initial={false}
                animate={{ opacity: tab === 'follow' ? 1 : 0, scaleX: tab === 'follow' ? 1 : 0.6 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            </button>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button onClick={() => navigate('/moments/search')} aria-label="搜索">
              <Search size={20} style={{ color: '#BBA0A0' }} />
            </button>
            <button onClick={() => { setNotifUnread(0); window.dispatchEvent(new CustomEvent('moments_unread_update')); navigate('/moments/notifications'); }} aria-label="通知" className="relative">
              <Bell size={20} style={{ color: '#BBA0A0' }} />
              {notifUnread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {notifUnread > 99 ? '99+' : notifUnread}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      {loading ? (
        <div className="px-2 pt-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={`l-${i}`} />)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={`r-${i}`} />)}
          </div>
        </div>
      ) : (
        <div>
          {/* Feed Cards */}
          {tab === 'follow' ? (
            <FollowTimeline
              moments={moments}
              loading={loading}
              hasMore={hasMore}
              onLoadMore={loadMore}
            />
          ) : moments.length === 0 ? (
            <>
              {/* Hot Topic Banner */}
              <HotTopicBanner topics={hotTopics} navigate={navigate} />
              <MosaicPool users={recommendUsers} user={user} navigate={navigate} />
              <div className="flex flex-col items-center justify-center py-16" style={{ color: '#BBA0A0' }}>
                <Compass size={40} className="mb-3" style={{ color: '#D4C4C4' }} />
                <p className="text-sm">暂无动态</p>
                <p className="text-xs mt-1">去发布第一条动态吧</p>
              </div>
            </>
          ) : (
            <>
              {/* Hot Topic Banner */}
              <HotTopicBanner topics={hotTopics} navigate={navigate} />
              <MosaicPool users={recommendUsers} user={user} navigate={navigate} />
              {/* 瀑布流双列布局 */}
              {(() => {
                const [leftCol, rightCol] = splitToWaterfall(moments);
                return (
                  <div className="px-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {/* 左列 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                      {leftCol.map((moment, idx) => (
                        <FeedCard
                          key={moment.id}
                          moment={moment}
                          navigate={navigate}
                          onLike={handleLike}
                          onDelete={(id) => setMoments(prev => prev.filter(m => m.id !== id))}
                          styleIndex={idx}
                        />
                      ))}
                    </div>
                    {/* 右列 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                      {rightCol.map((moment, idx) => (
                        <FeedCard
                          key={moment.id}
                          moment={moment}
                          navigate={navigate}
                          onLike={handleLike}
                          onDelete={(id) => setMoments(prev => prev.filter(m => m.id !== id))}
                          styleIndex={idx + leftCol.length}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Load More */}
              {loadingMore && (
                <div className="px-2 py-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              )}
              {!hasMore && moments.length > 0 && (
                <div className="py-6 text-center">
                  <span className="text-[11px]" style={{ color: '#BBA0A0' }}>没有更多了</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Floating Publish Button ── */}
      <PublishButton onClick={handlePublish} />

      {/* ── Image Viewer ── */}
      <AnimatePresence>
        {imageViewerSrc && (
          <ImageViewer
            images={[imageViewerSrc]}
            initialIndex={0}
            onClose={() => setImageViewerSrc(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
