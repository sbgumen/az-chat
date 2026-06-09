import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, MoreHorizontal, MapPin, Mic, Edit3, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { renderMentionContent } from '../utils/mention';
import { SafeImg } from './SafeImg';
import { getFollowing, followUser, unfollowUser } from '../api/user';
import { deleteMoment } from '../api/moments';
import type { Moment } from '../types';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
export const getAvatar = (a: string) => a?.startsWith('http') ? a : `${apiBase}${a}`;

export const textCardSchemes = [
  { bg: 'linear-gradient(170deg, #F5F0EB, #EDE4D8)', title: '#3D2B1B', sub: '#8B7B6B', decoColor: '#C4B5A5', decoType: 'line' as const },
  { bg: 'linear-gradient(170deg, #F3EFFF, #EDE7F6)', title: '#4A3D6B', sub: '#8B7DC4', decoColor: '#9B8DC4', decoType: 'dot' as const },
  { bg: 'linear-gradient(170deg, #2D1B1B, #3D2B2B)', title: 'rgba(255,255,255,0.9)', sub: 'rgba(255,255,255,0.45)', decoColor: 'rgba(255,255,255,0.35)', decoType: 'dotGroup' as const },
  { bg: 'linear-gradient(170deg, #FFF0E5, #FFE0D0)', title: '#8B4A3A', sub: '#B0705A', decoColor: '#C49585', decoType: 'ring' as const },
  { bg: '#4ECDC4', title: 'rgba(255,255,255,0.95)', sub: 'rgba(255,255,255,0.5)', decoColor: 'rgba(255,255,255,0.35)', decoType: 'line' as const },
  { bg: 'linear-gradient(170deg, #1B3A2D, #2D5A3D)', title: 'rgba(255,255,255,0.9)', sub: 'rgba(255,255,255,0.4)', decoColor: 'rgba(255,255,255,0.25)', decoType: 'dot' as const },
];

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHr < 24) return `${diffHr}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function estimateCardHeight(m: Moment): number {
  const contentLen = m.content?.length || 0;
  const images = Array.isArray(m.images) ? m.images : [];
  const hasAudio = !!m.audio_url;
  let h = 0;
  if (images.length > 0) {
    h += images.length === 1 ? 140 : images.length === 2 ? 120 : 130;
  } else {
    h += contentLen > 80 ? 170 : contentLen > 25 ? 145 : 120;
  }
  if (hasAudio) h += 20;
  return h;
}

export function splitToWaterfall(moments: Moment[]): [Moment[], Moment[]] {
  const left: Moment[] = [];
  const right: Moment[] = [];
  let leftH = 0;
  let rightH = 0;
  for (const m of moments) {
    const h = estimateCardHeight(m);
    if (leftH <= rightH) { left.push(m); leftH += h; }
    else { right.push(m); rightH += h; }
  }
  return [left, right];
}

interface WaterfallMomentCardProps {
  moment: Moment;
  styleIndex: number;
  onLike?: (momentId: number) => void;
  onImageView?: (src: string) => void;
  onDelete?: () => void;
}

export function WaterfallMomentCard({ moment, styleIndex, onLike, onDelete }: WaterfallMomentCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [likeAnim, setLikeAnim] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const images = Array.isArray(moment.images) ? moment.images : [];
  const isTextCard = images.length === 0 && !moment.audio_url;
  const scheme = textCardSchemes[styleIndex % textCardSchemes.length];
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!user || user.id === moment.user_id) return;
    getFollowing().then((res: any) => {
      if (res.code === 0) setIsFollowing((res.data || []).some((u: any) => u.id === moment.user_id));
    }).catch(() => {});
  }, [moment.user_id, user]);

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
    const color = scheme.decoColor;
    const textLen = (moment.content || '').length;
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 0.3;

    if (textLen <= 4) {
      ctx.strokeStyle = color; ctx.lineWidth = 0.8;
      ctx.beginPath(); const baseY = h * 0.72;
      for (let x = w * 0.15; x < w * 0.85; x += 2) {
        const y = baseY + Math.sin(x * 0.06) * 6 + Math.sin(x * 0.15) * 3;
        x === w * 0.15 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      for (let i = 0; i < 12; i++) {
        ctx.beginPath(); ctx.arc(w * (0.1 + Math.random() * 0.8), h * (0.15 + Math.random() * 0.25), 1.5, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
      }
    } else if (textLen <= 12) {
      ctx.strokeStyle = color; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(w * 0.12, h * 0.22); ctx.bezierCurveTo(w * 0.35, h * 0.12, w * 0.65, h * 0.32, w * 0.88, h * 0.25); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w * 0.15, h * 0.78); ctx.bezierCurveTo(w * 0.4, h * 0.88, w * 0.6, h * 0.68, w * 0.85, h * 0.75); ctx.stroke();
    } else if (textLen <= 25) {
      ctx.strokeStyle = color; ctx.lineWidth = 0.8;
      const corners = [{ x: w * 0.08, y: h * 0.12, dx: 16, dy: 0 }, { x: w * 0.08, y: h * 0.12, dx: 0, dy: 16 }, { x: w * 0.92, y: h * 0.12, dx: -16, dy: 0 }, { x: w * 0.92, y: h * 0.12, dx: 0, dy: 16 }, { x: w * 0.08, y: h * 0.88, dx: 16, dy: 0 }, { x: w * 0.08, y: h * 0.88, dx: 0, dy: -16 }, { x: w * 0.92, y: h * 0.88, dx: -16, dy: 0 }, { x: w * 0.92, y: h * 0.88, dx: 0, dy: -16 }];
      corners.forEach(c => { ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + c.dx, c.y + c.dy); ctx.stroke(); });
    } else {
      ctx.strokeStyle = color; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(w * 0.2, h * 0.08); ctx.lineTo(w * 0.8, h * 0.08); ctx.stroke();
      ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(w * 0.12, h * 0.86, 20, 0, Math.PI / 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, [canvasRef, isTextCard, moment.content, styleIndex, scheme.decoColor]);

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFollowing(!isFollowing);
    try { if (isFollowing) await unfollowUser(moment.user_id); else await followUser(moment.user_id); }
    catch { setIsFollowing(isFollowing); }
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 600);
    onLike?.(moment.id);
  };

  const handleDelete = () => {
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try { await deleteMoment(moment.id); onDelete?.(); } catch {}
    setShowDeleteConfirm(false);
  };

  const resolveImg = (img: string) => img?.startsWith('http') ? img : `${apiBase}${img}`;

  const InfoBar = () => (
    <div style={{ padding: '10px 10px 12px', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <SafeImg src={getAvatar(moment.user_avatar)} alt="" style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            onClick={(e: any) => { e.stopPropagation(); navigate(`/user/${moment.user_id}/moments`); }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#2D1B1B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70px' }}>{moment.user_nickname}</span>
        </div>
        <span style={{ fontSize: '10px', color: '#BBA0A0', flexShrink: 0 }}>{formatRelativeTime(moment.created_at)}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        {moment.user_level && moment.user_level > 0 && (
          <span style={{ fontSize: '9px', color: '#FF6B6B', background: '#FFF0E5', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>LV.{moment.user_level}</span>
        )}
        {user && user.id !== moment.user_id && (
          <button onClick={handleFollowToggle}
            style={{ fontSize: '9px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: isFollowing ? '#F0F0F0' : 'linear-gradient(135deg, #FF6B6B, #FFB347)', color: isFollowing ? '#BBA0A0' : '#fff', border: 'none', cursor: 'pointer' }}>
            {isFollowing ? '已关注' : '关注'}
          </button>
        )}
      </div>
      {moment.location && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '6px' }}>
          <MapPin size={10} color="#C4B5A5" />
          <span style={{ fontSize: '10px', color: '#C4B5A5' }}>{moment.location}</span>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: moment.location ? '0' : '4px' }}>
        <button onClick={handleLikeClick} style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, position: 'relative' as const }}>
          <Heart size={15} fill={moment.is_liked ? '#FF6B6B' : 'none'} color={moment.is_liked ? '#FF6B6B' : '#BBA0A0'} />
          <span style={{ fontSize: '11px', color: moment.is_liked ? '#FF6B6B' : '#BBA0A0', fontWeight: 500 }}>{moment.like_count || ''}</span>
          <AnimatePresence>
            {likeAnim && !moment.is_liked && Array.from({ length: 4 }).map((_, i) => (
              <motion.div key={i} style={{ position: 'absolute', top: '50%', left: '50%', width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#FF6B6B', pointerEvents: 'none' }}
                initial={{ x: 0, y: 0, opacity: 0.8, scale: 0 }}
                animate={{ x: Math.cos(i * 90 * Math.PI / 180) * 10, y: Math.sin(i * 90 * Math.PI / 180) * 10, opacity: 0, scale: 1 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }} />
            ))}
          </AnimatePresence>
        </button>
        <button onClick={() => navigate(`/moments/${moment.id}`)} style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <MessageCircle size={15} color="#BBA0A0" />
          <span style={{ fontSize: '11px', color: '#BBA0A0', fontWeight: 500 }}>{moment.comment_count || ''}</span>
        </button>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          onClick={(e) => { e.stopPropagation(); }}>
          <Share2 size={15} color="#BBA0A0" />
        </button>
        {user && user.id === moment.user_id && (
          <div style={{ position: 'relative', marginLeft: 'auto' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}>
              <MoreHorizontal size={15} color="#BBA0A0" />
            </button>
            {showMenu && (
              <div style={{ position: 'absolute', right: 0, bottom: '22px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', padding: '2px 0', zIndex: 10, minWidth: '80px' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', color: '#2D1B1B', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
                  onClick={(e) => { e.stopPropagation(); navigate(`/moments/publish?edit=${moment.id}`); setShowMenu(false); }}>
                  <Edit3 size={12} />编辑
                </button>
                <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', color: '#FF6B6B', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
                  onClick={(e) => { e.stopPropagation(); handleDelete(); }}>
                  <Trash2 size={12} />删除
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const deleteDialog = showDeleteConfirm ? (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}
      onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '18px 20px', width: '85%', maxWidth: '240px', textAlign: 'center' }}
        onClick={(e) => e.stopPropagation()}>
        <p style={{ fontSize: '14px', color: '#2D1B1B', fontWeight: 600, margin: '0 0 6px' }}>确认删除</p>
        <p style={{ fontSize: '11px', color: '#BBA0A0', margin: '0 0 14px' }}>删除后无法恢复</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
            style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '13px', background: '#F5F0F0', color: '#2D1B1B', border: 'none', cursor: 'pointer' }}>取消</button>
          <button onClick={confirmDelete}
            style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '13px', background: '#FF6B6B', color: '#fff', border: 'none', cursor: 'pointer' }}>删除</button>
        </div>
      </div>
    </div>
  ) : null;

  if (isTextCard) {
    const content = moment.content || '';
    const textLen = content.length;
    type TextGrade = 'micro' | 'short' | 'medium' | 'long';
    const grade: TextGrade = textLen <= 4 ? 'micro' : textLen <= 12 ? 'short' : textLen <= 25 ? 'medium' : 'long';
    const gc = {
      micro:   { size: '26px', aspect: '110%', weight: 800, lsp: '5px',  lh: 1.3, font: "'ZCOOL XiaoWei', serif" },
      short:   { size: '20px', aspect: '125%', weight: 700, lsp: '3px',  lh: 1.5, font: "'ZCOOL XiaoWei', 'Noto Sans SC', sans-serif" },
      medium:  { size: '16px', aspect: '145%', weight: 700, lsp: '1.5px', lh: 1.6, font: "'Noto Sans SC', sans-serif" },
      long:    { size: '14px', aspect: '170%', weight: 600, lsp: '1px',   lh: 1.7, font: "'Noto Sans SC', sans-serif" },
    }[grade];

    const renderDeco = () => {
      switch (scheme.decoType) {
        case 'line': return <div style={{ width: '32px', height: '1px', background: scheme.decoColor, marginBottom: '14px' }} />;
        case 'dot': return <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: scheme.decoColor, marginBottom: '14px' }} />;
        case 'ring': return <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: `1px solid ${scheme.decoColor}`, marginBottom: '14px' }} />;
        case 'dotGroup': return <div style={{ display: 'flex', gap: '5px', marginBottom: '14px' }}>{[0, 1, 2].map(i => <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: scheme.decoColor }} />)}</div>;
        default: return null;
      }
    };

    return (
      <article className="cursor-pointer" style={{ borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.025)' }} onClick={() => navigate(`/moments/${moment.id}`)}>
        <div style={{ position: 'relative', width: '100%', paddingTop: gc.aspect, background: scheme.bg, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: grade === 'micro' ? '30px 22px' : grade === 'long' ? '18px 16px' : '22px 16px' }}>
            {renderDeco()}
            <div style={{ fontSize: gc.size, fontWeight: gc.weight, color: scheme.title, lineHeight: gc.lh, letterSpacing: gc.lsp, fontFamily: gc.font, textAlign: 'center', wordBreak: 'break-word' }}>{content}</div>
          </div>
        </div>
        <InfoBar />
        {deleteDialog}
      </article>
    );
  }

  const displayImages = images.slice(0, 3);
  const imgCount = displayImages.length;

  return (
    <article className="cursor-pointer" style={{ borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.025)' }} onClick={() => navigate(`/moments/${moment.id}`)}>
      {imgCount > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: imgCount === 1 ? '1fr' : '1fr 1fr', gap: '2px', overflow: 'hidden' }}>
          {displayImages.map((img, i) => {
            const isThirdOf3 = imgCount === 3 && i === 2;
            const aspect = isThirdOf3 ? '2 / 1' : imgCount === 1 ? '4 / 3' : '3 / 4';
            return (
              <div key={i} className="overflow-hidden" style={{ gridColumn: isThirdOf3 ? 'span 2' : undefined, aspectRatio: aspect }}>
                <SafeImg src={resolveImg(img)} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            );
          })}
        </div>
      )}
      {moment.audio_url && imgCount === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 12px', background: 'linear-gradient(90deg, #FF6B6B, #FFB347)' }}>
          <Mic size={16} color="#fff" />
          <div style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px' }}><div style={{ width: '60%', height: '100%', background: '#fff', borderRadius: '2px' }} /></div>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>{moment.audio_duration ? `${Math.floor(moment.audio_duration / 60)}:${String(moment.audio_duration % 60).padStart(2, '0')}` : '0:00'}</span>
        </div>
      )}
      <div style={{ height: '1px', background: '#F0E6E6', margin: '0 10px' }} />
      <div style={{ padding: '8px 10px 2px' }}>
        {moment.topic_name && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
            {moment.topic_name.split(/[,，\s]+/).filter(Boolean).slice(0, 2).map((tag, i) => {
              const cleanTag = tag.startsWith('#') ? tag.slice(1) : tag;
              return <span key={i} style={{ fontSize: '9px', color: '#FF6B6B', background: '#FFF0E5', padding: '2px 6px', borderRadius: '4px', fontWeight: 500, cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); navigate(`/topics/${encodeURIComponent(cleanTag)}`); }}>{cleanTag}</span>;
            })}
          </div>
        )}
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
        {moment.audio_url && imgCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', background: 'linear-gradient(90deg, #FF6B6B, #FFB347)', borderRadius: '4px', marginBottom: '4px' }}>
            <Mic size={12} color="#fff" />
            <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.3)', borderRadius: '1px' }}><div style={{ width: '60%', height: '100%', background: '#fff', borderRadius: '1px' }} /></div>
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.8)' }}>{moment.audio_duration ? `${Math.floor(moment.audio_duration / 60)}:${String(moment.audio_duration % 60).padStart(2, '0')}` : '0:00'}</span>
          </div>
        )}
      </div>
      <InfoBar />
      {deleteDialog}
    </article>
  );
}
