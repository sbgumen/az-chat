import { RemoteImage } from '../../components/RemoteImage';
import { ImageViewer } from '../../components/ImageViewer';
import { Carousel3D } from '../../components/Carousel3D';
import { AlbumComments, type Comment as AlbumComment } from '../../components/AlbumComments';
import { DaySection } from '../../components/MonthSection';
import { AlbumGrid, type GridPhoto } from '../../components/AlbumGrid';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Plus, Upload, Trash2, Images, Camera,
  Settings2, Globe, Users, Lock, Pencil, Check, Star
} from 'lucide-react';
import { useSmartBack } from '../../hooks/useSmartBack';
import {
  getMyAlbums, getAlbumPhotos, createAlbum, uploadAlbumPhoto,
  deleteAlbumPhoto, deleteAlbum, setAlbumCarousel, renameAlbum, getLevelInfo,
  setAlbumVisibility as apiSetAlbumVisibility, getAlbumComments, addAlbumComment, deleteAlbumComment,
  clearAlbumUnread
} from '../../api/user';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getUrl = (u: string) => u?.startsWith('http') ? u : `${apiBase}${u}`;
const PAGE_SIZE = 30;

interface Album { id: number; name: string; cover: string | null; photo_count: number; preview_photos: string[]; visibility?: string; favorite_count?: number; date_from?: string; date_to?: string; }
interface Photo { id: number; url: string; caption: string; created_at: string; }

const VISIBILITY_OPTIONS = [
  { value: 'public', label: '所有人可见', icon: Globe, color: 'text-emerald-500' },
  { value: 'friends', label: '好友可见', icon: Users, color: 'text-blue-500' },
  { value: 'private', label: '仅自己可见', icon: Lock, color: 'text-cream-500' },
] as const;

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function formatDayLabel(dateStr: string) {
  if (!dateStr) return { label: '未知', weekday: '' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { label: '未知', weekday: '' };
  return {
    label: `${d.getMonth() + 1}月${d.getDate()}日`,
    weekday: WEEKDAYS[d.getDay()],
  };
}

function formatDateRange(from?: string, to?: string) {
  if (!from && !to) return '';
  const fmt = (s?: string) => s ? `${s.slice(0, 4)}.${s.slice(5, 7)}` : '';
  if (from && to && from.slice(0, 7) === to.slice(0, 7)) return fmt(from);
  if (from && to) return `${fmt(from)} — ${fmt(to)}`;
  return fmt(from || to);
}

function AuroraBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg,#0d0d1a 0%,#0f0a1e 40%,#0a0d1f 100%)' }} />
      <div className="absolute -top-32 -left-20 w-[120%] h-64 opacity-35"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 40% 50%, rgba(139,92,246,0.7) 0%, rgba(59,130,246,0.3) 40%, transparent 70%)', animation: 'maA1 9s ease-in-out infinite', filter: 'blur(36px)' }} />
      <div className="absolute top-[20%] -right-20 w-[80%] h-48 opacity-30"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 60% 50%, rgba(236,72,153,0.6) 0%, rgba(245,158,11,0.2) 50%, transparent 70%)', animation: 'maA2 11s ease-in-out infinite', filter: 'blur(28px)' }} />
      <div className="absolute bottom-0 left-[20%] w-[60%] h-40 opacity-20"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(251,191,36,0.5) 0%, transparent 70%)', filter: 'blur(30px)' }} />
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(112deg, transparent 35%, rgba(255,255,255,0.04) 50%, transparent 65%)', animation: 'maSw 5s linear infinite' }} />
      <style>{`
        @keyframes maA1 { 0%,100%{transform:translate(0,0) scaleX(1)} 33%{transform:translate(30px,-20px) scaleX(1.1)} 66%{transform:translate(-20px,10px) scaleX(0.95)} }
        @keyframes maA2 { 0%,100%{transform:translate(0,0) scaleY(1)} 50%{transform:translate(-25px,15px) scaleY(1.2)} }
        @keyframes maSw { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
      `}</style>
    </div>
  );
}

function CoverStoryCard({ album, isLv30, manageMode, isSelected, onClick, onLongPress, onCancelLongPress }: {
  album: Album; isLv30: boolean; manageMode: boolean; isSelected: boolean;
  onClick: () => void; onLongPress: () => void; onCancelLongPress: () => void;
}) {
  const previews = album.preview_photos || [];

  return (
    <motion.div
      className="relative flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer"
      style={{
        width: 'min(200px, 55vw)', height: 260, scrollSnapAlign: 'center',
        background: isLv30 ? 'rgba(255,255,255,0.06)' : '#fff',
        boxShadow: isLv30
          ? '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
          : '0 1px 12px rgba(0,0,0,0.06)',
      }}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      onTouchStart={onLongPress} onTouchEnd={onCancelLongPress}
      onTouchMove={onCancelLongPress}
    >
      {/* Split photo preview */}
      {previews.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: isLv30 ? 'rgba(255,255,255,0.04)' : '#f0ece4' }}>
          <Camera size={28} className={isLv30 ? 'text-white/15' : 'text-cream-300'} />
        </div>
      ) : previews.length === 1 ? (
        <RemoteImage src={getUrl(previews[0])} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : previews.length === 2 ? (
        <div className="absolute inset-0 grid grid-cols-2">
          <RemoteImage src={getUrl(previews[0])} alt="" className="w-full h-full object-cover" />
          <RemoteImage src={getUrl(previews[1])} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="absolute inset-0 grid grid-cols-2" style={{ gridTemplateColumns: '2fr 1fr' }}>
          <RemoteImage src={getUrl(previews[0])} alt="" className="w-full h-full object-cover row-span-2" />
          <RemoteImage src={getUrl(previews[1])} alt="" className="w-full h-full object-cover" />
          <RemoteImage src={getUrl(previews[2])} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute inset-0 opacity-30"
        style={{ background: 'linear-gradient(135deg, rgba(200,160,120,0.3) 0%, rgba(120,160,200,0.2) 50%, rgba(160,120,180,0.2) 100%)' }} />

      {isLv30 && !manageMode && (
        <motion.div className="absolute top-0 bottom-0 pointer-events-none"
          style={{ left: '-60%', width: '50%', background: 'linear-gradient(105deg, transparent 10%, rgba(255,255,255,0.12) 50%, transparent 90%)' }}
          animate={{ x: ['0%', '500%'] }}
          transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }} />
      )}

      {manageMode && (
        <div className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 ${isSelected ? 'bg-warm-500 border-warm-500' : 'bg-white/20 border-white/40'}`}>
          {isSelected && <Check size={13} className="text-white" />}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <p className="text-white/55 text-xs font-normal tracking-[1px] mb-1">{formatDateRange(album.date_from, album.date_to)}</p>
        <p className="text-white text-lg font-extrabold tracking-[0.5px] leading-tight">{album.name}</p>
        <div className="flex gap-3 mt-1.5">
          <span className="text-white/50 text-[10px]">{album.photo_count} 张</span>
          {album.favorite_count ? <span className="text-white/50 text-[10px]">{album.favorite_count} 收藏</span> : null}
        </div>
      </div>
    </motion.div>
  );
}

export function MyAlbumPage() {
  const goBack = useSmartBack('/profile');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [manageMode, setManageMode] = useState(false);
  const [selectedAlbumIds, setSelectedAlbumIds] = useState<Set<number>>(new Set());

  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [carouselIds, setCarouselIds] = useState<number[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectMode, setSelectMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<number>>(new Set());
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const [userLevel, setUserLevel] = useState(1);

  const [showEditBar, setShowEditBar] = useState(false);
  const [groupMode, setGroupMode] = useState<'day' | 'month'>('day');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState<Album | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [comments, setComments] = useState<AlbumComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLv30 = userLevel >= 30;

  useEffect(() => {
    loadAlbums();
    getLevelInfo().then((res: any) => { if (res.code === 0) setUserLevel(res.data.level ?? 1); }).catch(() => {});
  }, []);

  const loadAlbums = async () => {
    setLoading(true);
    try { const res: any = await getMyAlbums(); if (res.code === 0) setAlbums(res.data); } catch { /* */ }
    setLoading(false);
  };

  const openAlbum = async (album: Album) => {
    if (manageMode) return;
    setSelectedAlbum(album); setShowEditBar(false); setPhotosLoading(true); setCommentsLoading(true);
    setPhotos([]); setCurrentPage(1);
    clearAlbumUnread(album.id).catch(() => {});
    try {
      const res: any = await getAlbumPhotos(album.id, 1, PAGE_SIZE);
      if (res.code === 0) {
        setPhotos(res.data.photos);
        setCarouselIds(res.data.album.carousel_photos || []);
        setFavoriteCount(res.data.album.favorite_count || 0);
        setHasMore(res.data.pagination?.hasMore ?? false);
      }
    } catch { /* */ }
    setPhotosLoading(false);
    try { const cRes: any = await getAlbumComments(album.id); if (cRes.code === 0) setComments(cRes.data); } catch { /* */ }
    setCommentsLoading(false);
  };

  const loadMorePhotos = useCallback(async () => {
    if (!selectedAlbum || !hasMore || photosLoading) return;
    const nextPage = currentPage + 1; setPhotosLoading(true);
    try {
      const res: any = await getAlbumPhotos(selectedAlbum.id, nextPage, PAGE_SIZE);
      if (res.code === 0) { setPhotos(prev => [...prev, ...res.data.photos]); setHasMore(res.data.pagination?.hasMore ?? false); setCurrentPage(nextPage); }
    } catch { /* */ }
    setPhotosLoading(false);
  }, [selectedAlbum, hasMore, photosLoading, currentPage]);

  const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  const groupedPhotos = useCallback(() => {
    const map = new Map<string, Photo[]>();
    if (groupMode === 'day') {
      for (const p of photos) {
        const key = (p.created_at || '').slice(0, 10);
        if (!key) continue;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(p);
      }
      const groups: { key: string; label: string; subtitle: string; photos: Photo[] }[] = [];
      for (const [key, list] of map) {
        const { label, weekday } = formatDayLabel(key);
        groups.push({ key, label, subtitle: weekday, photos: list });
      }
      return groups;
    } else {
      for (const p of photos) {
        const key = (p.created_at || '').slice(0, 7);
        if (!key) continue;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(p);
      }
      const groups: { key: string; label: string; subtitle: string; photos: Photo[] }[] = [];
      for (const [key, list] of map) {
        const [y, m] = key.split('-');
        groups.push({ key, label: MONTHS[parseInt(m) - 1], subtitle: `${y}年`, photos: list });
      }
      return groups;
    }
  }, [photos, groupMode]);

  const handleCreateAlbum = async () => { if (!newAlbumName.trim() || creating) return; setCreating(true); try { const res: any = await createAlbum(newAlbumName.trim()); if (res.code === 0) { setShowCreateModal(false); setNewAlbumName(''); await loadAlbums(); } } catch { /* */ } setCreating(false); };
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !selectedAlbum || uploading) return;
    if (file.size > 20 * 1024 * 1024) { alert('图片大小不能超过20MB'); e.target.value = ''; return; }
    setUploading(true);
    try {
      const res: any = await uploadAlbumPhoto(selectedAlbum.id, file);
      if (res.code === 0) {
        // Reload photos from server to get complete data (including created_at)
        const r: any = await getAlbumPhotos(selectedAlbum.id, 1, PAGE_SIZE);
        if (r.code === 0) setPhotos(r.data.photos);
        setAlbums(prev => prev.map(a => a.id === selectedAlbum.id ? { ...a, photo_count: a.photo_count + 1 } : a));
      }
    } catch { /* */ }
    setUploading(false); e.target.value = '';
  };
  const handleDeleteSelectedPhotos = async () => {
    if (selectedPhotoIds.size === 0) return; if (!confirm(`确定删除选中的 ${selectedPhotoIds.size} 张照片？`)) return;
    for (const id of selectedPhotoIds) { try { const res: any = await deleteAlbumPhoto(id); if (res.code === 0) { setPhotos(prev => prev.filter(p => p.id !== id)); setCarouselIds(prev => prev.filter(cid => cid !== id)); if (selectedAlbum) setAlbums(prev => prev.map(a => a.id === selectedAlbum.id ? { ...a, photo_count: Math.max(0, a.photo_count - 1) } : a)); } } catch { /* */ } }
    setSelectedPhotoIds(new Set()); setDeleteMode(false);
  };
  const handleDeleteSelectedAlbums = async () => { if (selectedAlbumIds.size === 0) return; if (!confirm(`确定删除选中的 ${selectedAlbumIds.size} 个相册？`)) return; for (const id of selectedAlbumIds) { try { await deleteAlbum(id); } catch { /* */ } } setAlbums(prev => prev.filter(a => !selectedAlbumIds.has(a.id))); setSelectedAlbumIds(new Set()); setManageMode(false); };
  const handleRename = async () => { if (!showRenameModal || !renameValue.trim()) return; try { const res: any = await renameAlbum(showRenameModal.id, renameValue.trim()); if (res.code === 0) { setAlbums(prev => prev.map(a => a.id === showRenameModal.id ? { ...a, name: renameValue.trim() } : a)); setShowRenameModal(null); } } catch { /* */ } };
  const toggleCarousel = async (photoId: number) => { if (!selectedAlbum) return; let next: number[]; if (carouselIds.includes(photoId)) { next = carouselIds.filter(id => id !== photoId); } else { if (carouselIds.length >= 3) return; next = [...carouselIds, photoId]; } setCarouselIds(next); await setAlbumCarousel(selectedAlbum.id, next).catch(() => {}); };
  const togglePhotoSelect = (id: number) => setSelectedPhotoIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAlbumSelect = (id: number) => setSelectedAlbumIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const startLongPress = (album: Album) => { longPressTimer.current = setTimeout(() => { setManageMode(true); setSelectedAlbumIds(new Set([album.id])); }, 500); };
  const cancelLongPress = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };
  const exitPhotoView = () => { setSelectedAlbum(null); setSelectMode(false); setDeleteMode(false); setSelectedPhotoIds(new Set()); setShowEditBar(false); setComments([]); };
  const handleSetVisibility = async (v: string) => { if (!selectedAlbum) return; setShowVisibilityModal(false); try { await apiSetAlbumVisibility(selectedAlbum.id, v as any); setAlbums(prev => prev.map(a => a.id === selectedAlbum.id ? { ...a, visibility: v } : a)); setSelectedAlbum(prev => prev ? { ...prev, visibility: v } : prev); } catch { /* */ } };
  const handleSendComment = async (content: string, replyTo?: number) => { if (!selectedAlbum) return; const res: any = await addAlbumComment(selectedAlbum.id, content, replyTo); if (res.code === 0) setComments(prev => [...prev, res.data]); };
  const handleDeleteComment = async (commentId: number) => { const res: any = await deleteAlbumComment(commentId); if (res.code === 0) setComments(prev => prev.filter(c => c.id !== commentId && c.reply_to !== commentId)); };
  const handlePhotoClick = (photo: GridPhoto, index: number) => { if (selectMode) { toggleCarousel(photo.id); return; } if (deleteMode) { togglePhotoSelect(photo.id); return; } setViewIndex(index); };

  const carouselPhotos = photos.filter(p => carouselIds.includes(p.id));
  const groups = groupedPhotos();

  // Theme helpers
  const pageBg = isLv30 ? '#0d0d1a' : '#f5f0eb';
  const headerBg = isLv30 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)';
  const headerBorder = isLv30 ? 'rgba(255,255,255,0.08)' : 'rgba(203,193,182,0.5)';
  const textColor = isLv30 ? 'text-white' : 'text-cream-900';
  const textSub = isLv30 ? 'text-white/40' : 'text-cream-500';
  const btnBg = isLv30 ? 'bg-white/10 hover:bg-white/20' : 'bg-cream-200 hover:bg-cream-300';
  const btnIcon = isLv30 ? 'text-white/60' : 'text-cream-700';
  const sectionLabel = isLv30 ? 'text-white/40' : 'text-cream-500';

  return (
    <motion.div className="fixed inset-0 z-[200] flex flex-col overflow-hidden"
      style={{ background: pageBg }}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}>

      {isLv30 && <AuroraBg />}

      {/* Header */}
      <div className="relative z-10 flex items-center gap-2 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3"
        style={{ background: headerBg, backdropFilter: 'blur(20px)', borderBottom: `1px solid ${headerBorder}` }}>
        <button onClick={() => {
          if (deleteMode) { setDeleteMode(false); setSelectedPhotoIds(new Set()); return; }
          if (selectMode) { setSelectMode(false); return; }
          if (manageMode) { setManageMode(false); setSelectedAlbumIds(new Set()); return; }
          if (selectedAlbum) { exitPhotoView(); return; }
          goBack();
        }} className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${isLv30 ? 'hover:bg-white/10' : 'hover:bg-cream-200'}`}>
          <ChevronLeft size={22} className={isLv30 ? 'text-white' : 'text-cream-800'} />
        </button>
        <div className="flex-1">
          <h1 className={`font-display text-lg font-semibold leading-tight ${textColor}`}>
            {selectedAlbum ? selectedAlbum.name : '我的相册'}
          </h1>
          {selectedAlbum && <p className={`text-[11px] ${textSub}`}>{photos.length} 张</p>}
        </div>

        {!selectedAlbum && (manageMode ? (
          <div className="flex items-center gap-2">
            <button onClick={() => { if (selectedAlbumIds.size === 1) { const a = albums.find(x => selectedAlbumIds.has(x.id)); if (a) { setShowRenameModal(a); setRenameValue(a.name); } } }} disabled={selectedAlbumIds.size !== 1}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[12px] font-medium disabled:opacity-40 ${isLv30 ? 'bg-white/10 text-white' : 'bg-cream-200 text-cream-700'}`}><Pencil size={12} />改名</button>
            <button onClick={handleDeleteSelectedAlbums} disabled={selectedAlbumIds.size === 0} className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-red-500/20 text-red-400 text-[12px] font-medium disabled:opacity-40"><Trash2 size={12} />删除</button>
            <button onClick={() => { setManageMode(false); setSelectedAlbumIds(new Set()); }} className={`px-2.5 py-1.5 rounded-full text-[12px] font-medium ${isLv30 ? 'bg-white/10 text-white' : 'bg-cream-200 text-cream-700'}`}>完成</button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button onClick={() => setManageMode(true)} className={`w-8 h-8 rounded-full flex items-center justify-center ${btnBg}`}><Pencil size={15} className={btnIcon} /></button>
            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warm-500 text-white text-[12px] font-semibold shadow-sm"><Plus size={14} />新建</button>
          </div>
        ))}

        {selectedAlbum && !deleteMode && !selectMode && (
          <div className="flex items-center gap-1.5">
            {/* Group toggle: day / month */}
            <div className="flex rounded-full p-0.5" style={{ background: isLv30 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
              <button onClick={() => setGroupMode('day')}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
                style={groupMode === 'day' ? { background: isLv30 ? 'rgba(255,255,255,0.15)' : '#fff', color: isLv30 ? 'white' : '#4a3728', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: isLv30 ? 'rgba(255,255,255,0.4)' : '#a09080' }}>
                按天
              </button>
              <button onClick={() => setGroupMode('month')}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
                style={groupMode === 'month' ? { background: isLv30 ? 'rgba(255,255,255,0.15)' : '#fff', color: isLv30 ? 'white' : '#4a3728', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: isLv30 ? 'rgba(255,255,255,0.4)' : '#a09080' }}>
                按月
              </button>
            </div>
            <button onClick={() => setShowEditBar(v => !v)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[12px] font-medium ${showEditBar ? (isLv30 ? 'bg-white/20 text-white' : 'bg-warm-100 text-warm-600') : (isLv30 ? 'bg-white/10 text-white' : 'bg-cream-200 text-cream-700')}`}><Settings2 size={12} />编辑</button>
          </div>
        )}
        {selectedAlbum && selectMode && <button onClick={() => setSelectMode(false)} className={`px-3 py-1.5 rounded-full text-[12px] font-medium ${isLv30 ? 'bg-white/10 text-white' : 'bg-cream-200 text-cream-700'}`}>完成</button>}
        {selectedAlbum && deleteMode && (
          <button onClick={handleDeleteSelectedPhotos} disabled={selectedPhotoIds.size === 0} className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-red-500 text-white text-[12px] font-semibold disabled:opacity-40"><Trash2 size={12} />删除{selectedPhotoIds.size > 0 ? `(${selectedPhotoIds.size})` : ''}</button>
        )}
      </div>

      {/* Edit toolbar */}
      <AnimatePresence>
        {selectedAlbum && showEditBar && !deleteMode && !selectMode && (
          <motion.div className="relative z-10 flex items-center gap-2 px-4 py-2.5 overflow-x-auto"
            style={{ background: isLv30 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)' }}
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}>
            <button onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap flex-shrink-0 ${isLv30 ? 'bg-white/10 text-white' : 'bg-cream-100 text-cream-700'}`}>
              {uploading ? <motion.div className="w-3 h-3 rounded-full border-2 border-warm-400 border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} /> : <Upload size={12} />}上传照片
            </button>
            <button onClick={() => { setSelectMode(true); setShowEditBar(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap flex-shrink-0 ${isLv30 ? 'bg-white/10 text-white' : 'bg-cream-100 text-cream-700'}`}>
              <Star size={12} />设置精选{carouselIds.length > 0 ? ` (${carouselIds.length}/3)` : ''}
            </button>
            <button onClick={() => setShowVisibilityModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap flex-shrink-0 ${isLv30 ? 'bg-white/10 text-white' : 'bg-cream-100 text-cream-700'}`}>
              {selectedAlbum?.visibility === 'public' ? <Globe size={12} className="text-emerald-500" /> : selectedAlbum?.visibility === 'friends' ? <Users size={12} className="text-blue-500" /> : <Lock size={12} />}权限设置
            </button>
            <button onClick={() => { setDeleteMode(true); setShowEditBar(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/15 text-red-400 text-[12px] font-medium whitespace-nowrap flex-shrink-0">删除照片</button>
          </motion.div>
        )}
      </AnimatePresence>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto min-h-0">
        <AnimatePresence mode="wait">
          {!selectedAlbum ? (
            <motion.div key="albums" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {loading ? (
                <div className="pt-4 px-5 flex gap-3 overflow-hidden">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <motion.div key={i} className="rounded-3xl flex-shrink-0" style={{ width: 'min(200px, 55vw)', height: 260, background: isLv30 ? 'rgba(255,255,255,0.06)' : '#fff' }}
                      animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </div>
              ) : albums.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: isLv30 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
                    <Images size={36} className={isLv30 ? 'text-white/20' : 'text-cream-400'} />
                  </div>
                  <p className={isLv30 ? 'text-white/30 text-sm' : 'text-cream-500 text-sm'}>还没有相册，创建第一个吧</p>
                  <button onClick={() => setShowCreateModal(true)} className="px-5 py-2.5 rounded-full bg-warm-500 text-white text-sm font-semibold">创建相册</button>
                </div>
              ) : (
                <div className="flex flex-col gap-8 pt-4 pb-8">
                  {/* 最近更新 */}
                  {albums.slice(0, 5).length > 0 && (
                    <div>
                      <div className="px-5 mb-3.5"><span className={`text-[11px] font-semibold uppercase tracking-[1.5px] ${sectionLabel}`}>最近更新</span></div>
                      <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide" style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
                        {albums.slice(0, 5).map(album => (
                          <CoverStoryCard key={album.id} album={album} isLv30={isLv30} manageMode={manageMode}
                            isSelected={selectedAlbumIds.has(album.id)}
                            onClick={() => manageMode ? toggleAlbumSelect(album.id) : openAlbum(album)}
                            onLongPress={() => startLongPress(album)} onCancelLongPress={cancelLongPress} />
                        ))}
                      </div>
                    </div>
                  )}
                  {/* 全部相册 */}
                  <div>
                    <div className="px-5 mb-3.5"><span className={`text-[11px] font-semibold uppercase tracking-[1.5px] ${sectionLabel}`}>全部相册</span></div>
                    <div className="flex gap-2.5 px-5 overflow-x-auto scrollbar-hide" style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
                      <motion.button className="flex-shrink-0 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer"
                        style={{ width: 120, height: 120, background: isLv30 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
                        onClick={() => setShowCreateModal(true)}>
                        <Plus size={22} className={isLv30 ? 'text-white/25' : 'text-cream-500'} />
                        <span className={isLv30 ? 'text-white/25 text-[11px]' : 'text-cream-500 text-[11px]'}>新建</span>
                      </motion.button>
                      {albums.map(album => {
                        const p = album.preview_photos || [];
                        return (
                          <motion.div key={album.id} className="relative flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer"
                            style={{ width: 120, height: 120, background: isLv30 ? 'rgba(255,255,255,0.04)' : '#fff', boxShadow: isLv30 ? 'none' : '0 1px 6px rgba(0,0,0,0.06)' }}
                            onClick={() => manageMode ? toggleAlbumSelect(album.id) : openAlbum(album)}>
                            {p.length === 0 ? <div className="absolute inset-0 flex items-center justify-center"><Camera size={20} className={isLv30 ? 'text-white/20' : 'text-cream-300'} /></div>
                              : p.length === 1 ? <RemoteImage src={getUrl(p[0])} alt="" className="absolute inset-0 w-full h-full object-cover" />
                              : p.length === 2 ? <div className="absolute inset-0 grid grid-cols-2">{p.map((u, j) => <RemoteImage key={j} src={getUrl(u)} alt="" className="w-full h-full object-cover" />)}</div>
                              : <div className="absolute inset-0" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr' }}><RemoteImage src={getUrl(p[0])} alt="" className="w-full h-full object-cover" style={{ gridRow: 'span 2' }} /><RemoteImage src={getUrl(p[1])} alt="" className="w-full h-full object-cover" /><RemoteImage src={getUrl(p[2])} alt="" className="w-full h-full object-cover" /></div>}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-2.5"><p className="text-white text-[11px] font-bold truncate">{album.name}</p><p className="text-white/50 text-[9px]">{album.photo_count} 张</p></div>
                            {manageMode && <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedAlbumIds.has(album.id) ? 'bg-warm-500 border-warm-500' : 'bg-white/20 border-white/40'}`}>{selectedAlbumIds.has(album.id) && <Check size={10} className="text-white" />}</div>}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="photos" className="flex flex-col gap-4 p-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {photosLoading && photos.length === 0 ? (
                <div className="grid grid-cols-4 gap-0.5">{Array.from({ length: 8 }).map((_, i) => <motion.div key={i} className="aspect-square" style={{ background: isLv30 ? 'rgba(255,255,255,0.05)' : '#e8e0d5' }} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.08 }} />)}</div>
              ) : photos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4"><Camera size={28} className={isLv30 ? 'text-white/20' : 'text-cream-400'} /><p className={isLv30 ? 'text-white/30 text-sm' : 'text-cream-500 text-sm'}>相册还是空的</p></div>
              ) : (
                <>
                  {/* Featured carousel */}
                  {!selectMode && !deleteMode && carouselPhotos.length >= 2 && (
                    <div className="py-2">
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <Star size={13} fill="#fbbf24" className="text-amber-400" />
                        <span className={`text-[11px] font-semibold uppercase tracking-wider ${isLv30 ? 'text-white/40' : 'text-cream-500'}`}>精选照片</span>
                      </div>
                      <Carousel3D photos={carouselPhotos.map(p => ({ id: p.id, url: p.url }))} showControls={true} containerHeight={180} cardWidth={140} />
                    </div>
                  )}

                  {selectMode && <div className="rounded-xl px-4 py-2.5 flex items-center gap-2 mx-1" style={{ background: isLv30 ? 'rgba(251,191,36,0.1)' : '#fef3c7' }}><Star size={14} fill="#f59e0b" className="text-amber-500" /><p className={`text-[12px] flex-1 ${isLv30 ? 'text-amber-300' : 'text-amber-700'}`}>点击照片设为精选（最多3张）</p><span className={`text-[12px] font-bold ${isLv30 ? 'text-amber-300' : 'text-amber-600'}`}>{carouselIds.length}/3</span></div>}
                  {deleteMode && <div className="rounded-xl px-4 py-2.5 flex items-center gap-2 mx-1" style={{ background: isLv30 ? 'rgba(239,68,68,0.1)' : '#fee2e2' }}><Trash2 size={14} className="text-red-400" /><p className={`text-[12px] flex-1 ${isLv30 ? 'text-red-300' : 'text-red-600'}`}>点击选择要删除的照片</p><span className={`text-[12px] font-bold ${isLv30 ? 'text-red-400' : 'text-red-500'}`}>{selectedPhotoIds.size} 张</span></div>}

                  {/* Day-grouped 4-column grid */}
                  {groups.map((group, gi) => (
                    <div key={group.key} className="mx-1">
                      <DaySection label={group.label} subtitle={group.subtitle} photoCount={group.photos.length} isLv30={isLv30} opacity={1 - gi * 0.04} />
                      <AlbumGrid photos={group.photos.map(p => ({ id: p.id, url: p.url, caption: p.caption, isCarousel: carouselIds.includes(p.id), carouselOrder: carouselIds.indexOf(p.id) }))}
                        isLv30={isLv30} selectMode={selectMode} deleteMode={deleteMode} carouselIds={carouselIds} selectedPhotoIds={selectedPhotoIds} onPhotoClick={handlePhotoClick} />
                    </div>
                  ))}

                  {hasMore && (
                    <div className="flex justify-center py-4 mb-12">
                      <button onClick={loadMorePhotos} disabled={photosLoading}
                        className={`px-4 py-2 rounded-full text-[12px] ${isLv30 ? 'text-white/50 bg-white/6' : 'text-cream-600 bg-cream-100'}`}>{photosLoading ? '加载中...' : '加载更多'}</button>
                    </div>
                  )}

                  {/* Comments — persistent at bottom */}
                  {!selectMode && !deleteMode && (
                    <div className="mx-1 mb-16">
                      <AlbumComments comments={comments} loading={commentsLoading} favoriteCount={favoriteCount} isLv30={isLv30} canDelete={true} onSend={handleSendComment} onDelete={handleDeleteComment} />
                    </div>
                  )}
                </>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showVisibilityModal && (
          <motion.div className="fixed inset-0 bg-black/50 z-[300] flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowVisibilityModal(false)}>
            <motion.div className="w-full max-w-md rounded-t-3xl p-6 mx-4" style={{ background: isLv30 ? '#1a1a2e' : '#fff' }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: 0.18 }} onClick={e => e.stopPropagation()}>
              <h3 className={`text-base font-semibold mb-4 ${isLv30 ? 'text-white' : 'text-cream-900'}`}>相册权限设置</h3>
              {VISIBILITY_OPTIONS.map(opt => { const Icon = opt.icon; return (
                <button key={opt.value} onClick={() => handleSetVisibility(opt.value)} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl w-full mb-2 transition-all"
                  style={{ background: selectedAlbum?.visibility === opt.value ? (isLv30 ? 'rgba(212,165,116,0.15)' : 'rgba(212,165,116,0.1)') : (isLv30 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)') }}>
                  <Icon size={18} className={opt.color} /><span className={`text-sm font-medium flex-1 text-left ${isLv30 ? 'text-white/80' : 'text-cream-800'}`}>{opt.label}</span>
                  {selectedAlbum?.visibility === opt.value && <Check size={16} className="text-warm-500" />}
                </button>
              );})}
              <button onClick={() => setShowVisibilityModal(false)} className="w-full mt-2 py-2.5 rounded-xl text-sm" style={{ background: isLv30 ? 'rgba(255,255,255,0.05)' : '#f5f0eb', color: isLv30 ? 'rgba(255,255,255,0.5)' : '#a09080' }}>取消</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div className="fixed inset-0 bg-black/50 z-[300] flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)}>
            <motion.div className="w-full max-w-md rounded-t-3xl p-6 mx-4" style={{ background: isLv30 ? '#1a1a2e' : '#fff' }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: 0.18 }} onClick={e => e.stopPropagation()}>
              <h3 className={`text-base font-semibold mb-4 ${isLv30 ? 'text-white' : 'text-cream-900'}`}>新建相册</h3>
              <input type="text" value={newAlbumName} onChange={e => setNewAlbumName(e.target.value)} placeholder="请输入相册名称" maxLength={30} autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreateAlbum()}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ background: isLv30 ? 'rgba(255,255,255,0.06)' : '#f5f0eb', color: isLv30 ? 'white' : '#4a3728' }} />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ background: isLv30 ? 'rgba(255,255,255,0.05)' : '#f5f0eb', color: isLv30 ? 'rgba(255,255,255,0.5)' : '#a09080' }}>取消</button>
                <button onClick={handleCreateAlbum} disabled={creating || !newAlbumName.trim()} className="flex-1 py-2.5 rounded-xl bg-warm-500 text-white text-sm font-medium disabled:opacity-40">{creating ? '创建中...' : '创建'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRenameModal && (
          <motion.div className="fixed inset-0 bg-black/50 z-[300] flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRenameModal(null)}>
            <motion.div className="w-full max-w-md rounded-t-3xl p-6 mx-4" style={{ background: isLv30 ? '#1a1a2e' : '#fff' }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: 0.18 }} onClick={e => e.stopPropagation()}>
              <h3 className={`text-base font-semibold mb-4 ${isLv30 ? 'text-white' : 'text-cream-900'}`}>重命名相册</h3>
              <input type="text" value={renameValue} onChange={e => setRenameValue(e.target.value)} maxLength={30} autoFocus
                onKeyDown={e => e.key === 'Enter' && handleRename()}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ background: isLv30 ? 'rgba(255,255,255,0.06)' : '#f5f0eb', color: isLv30 ? 'white' : '#4a3728' }} />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowRenameModal(null)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ background: isLv30 ? 'rgba(255,255,255,0.05)' : '#f5f0eb', color: isLv30 ? 'rgba(255,255,255,0.5)' : '#a09080' }}>取消</button>
                <button onClick={handleRename} disabled={!renameValue.trim()} className="flex-1 py-2.5 rounded-xl bg-warm-500 text-white text-sm font-medium disabled:opacity-40">保存</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewIndex !== null && <ImageViewer images={photos.map(p => getUrl(p.url))} initialIndex={viewIndex} onClose={() => setViewIndex(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}

export default MyAlbumPage;
