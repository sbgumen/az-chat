import { RemoteImage } from '../../components/RemoteImage';
import { ImageViewer } from '../../components/ImageViewer';
import { Carousel3D } from '../../components/Carousel3D';
import { AlbumComments, type Comment } from '../../components/AlbumComments';
import { DaySection } from '../../components/MonthSection';
import { AlbumGrid } from '../../components/AlbumGrid';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Camera, Heart, Star } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';
import { getUserAlbums, getAlbumPhotos, toggleAlbumFavorite, checkAlbumFavorite, getUserProfile, getAlbumComments, addAlbumComment } from '../../api/user';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getUrl = (u: string) => u?.startsWith('http') ? u : `${apiBase}${u}`;
const PAGE_SIZE = 40;

interface Album { id: number; name: string; cover: string | null; photo_count: number; preview_photos: string[]; visibility?: string; favorite_count?: number; date_from?: string; date_to?: string; }
interface Photo { id: number; url: string; caption: string; created_at: string; }

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function formatDayLabel(dateStr: string) {
  const d = new Date(dateStr);
  return { label: `${d.getMonth() + 1}月${d.getDate()}日`, weekday: WEEKDAYS[d.getDay()] };
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
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg,#0d0d1a 0%,#0f0a1e 40%,#0a0d1f 100%)' }} />
      <div className="absolute -top-20 -left-10 w-[130%] h-72 opacity-35"
        style={{ background: 'radial-gradient(ellipse 55% 45% at 38% 50%, rgba(139,92,246,0.7) 0%, rgba(59,130,246,0.3) 50%, transparent 70%)', filter: 'blur(40px)', animation: 'uaA1 9s ease-in-out infinite' }} />
      <div className="absolute top-[30%] -right-10 w-[70%] h-52 opacity-30"
        style={{ background: 'radial-gradient(ellipse 65% 50% at 65% 50%, rgba(236,72,153,0.6) 0%, rgba(245,158,11,0.2) 55%, transparent 70%)', filter: 'blur(32px)', animation: 'uaA2 11s ease-in-out infinite' }} />
      <div className="absolute bottom-0 left-[20%] w-[60%] h-40 opacity-20"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(251,191,36,0.5) 0%, transparent 70%)', filter: 'blur(30px)' }} />
      <div className="absolute top-0 bottom-0" style={{ left: '-40%', width: '35%', background: 'linear-gradient(105deg, transparent 15%, rgba(255,255,255,0.04) 50%, transparent 85%)', animation: 'uaSw 5s linear infinite' }} />
      <style>{`
        @keyframes uaA1 { 0%,100%{transform:translate(0,0) scaleX(1)} 40%{transform:translate(24px,-16px) scaleX(1.1)} 70%{transform:translate(-14px,10px) scaleX(0.94)} }
        @keyframes uaA2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-22px,16px)} }
        @keyframes uaSw { 0%{transform:translateX(0)} 100%{transform:translateX(400%)} }
      `}</style>
    </div>
  );
}

// ======================== List

export function UserAlbumPage({ overlayUserId, onClose, zIndex, ownerLevel }: { overlayUserId?: number; onClose?: () => void; zIndex?: number; ownerLevel?: number } = {}) {
  const navigate = useNavigate();
  const goBack = useSmartBack('/profile');
  const { userId: userIdParam } = useParams<{ userId: string }>();
  const userId = overlayUserId ?? Number(userIdParam);
  const isOverlay = !!onClose;
  const location = useLocation();

  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [overlayAlbumId, setOverlayAlbumId] = useState<number | null>(null);
  const [userLevel, setUserLevel] = useState(ownerLevel ?? (location.state as any)?.ownerLevel ?? 1);

  useEffect(() => { (async () => {
    setLoading(true);
    try { const [aR, pR]: any[] = await Promise.all([getUserAlbums(userId), ownerLevel == null ? getUserProfile(userId) : Promise.resolve({ code: -1 })]); if (aR.code === 0) setAlbums(aR.data); if (pR.code === 0) setUserLevel(pR.data.level ?? 1); } catch {}
    setLoading(false);
  })(); }, [userId]);

  const isLv30 = userLevel >= 30;
  const pageBg = isLv30 ? '#0d0d1a' : '#f5f0eb';
  const sectionLabel = isLv30 ? 'text-white/40' : 'text-cream-500';

  return (
    <motion.div className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ zIndex: zIndex ?? 250, background: pageBg }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
      {isLv30 && <AuroraBg />}
      <div className="relative z-10 flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3"
        style={{ background: isLv30 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)' }}>
        <button onClick={() => isOverlay ? onClose!() : goBack()}
          className={`w-9 h-9 flex items-center justify-center rounded-full ${isLv30 ? 'hover:bg-white/10' : 'hover:bg-cream-200'}`}>
          <ChevronLeft size={22} className={isLv30 ? 'text-white' : 'text-cream-800'} />
        </button>
        <h1 className={`font-display text-lg font-semibold ${isLv30 ? 'text-white' : 'text-cream-900'}`}>TA的相册</h1>
      </div>
      <div className="relative z-10 flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="pt-4 px-5 flex gap-3 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => <motion.div key={i} className="rounded-3xl flex-shrink-0" style={{ width: 'min(200px, 55vw)', height: 260, background: isLv30 ? 'rgba(255,255,255,0.06)' : '#fff' }} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }} />)}
          </div>
        ) : albums.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: isLv30 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
              <Camera size={36} className={isLv30 ? 'text-white/20' : 'text-cream-400'} />
            </div>
            <p className={isLv30 ? 'text-white/30 text-sm' : 'text-cream-500 text-sm'}>TA还没有相册</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8 pt-4 pb-8">
            {albums.slice(0, 5).length > 0 && (
              <div>
                <div className="px-5 mb-3.5"><span className={`text-[11px] font-semibold uppercase tracking-[1.5px] ${sectionLabel}`}>最近更新</span></div>
                <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
                  {albums.slice(0, 5).map(album => {
                    const p = album.preview_photos || [];
                    return (
                      <motion.div key={album.id} className="relative flex-shrink-0 rounded-3xl overflow-hidden cursor-pointer"
                        style={{ width: 'min(200px, 55vw)', height: 260, scrollSnapAlign: 'center', background: isLv30 ? 'rgba(255,255,255,0.06)' : '#fff', boxShadow: isLv30 ? '0 8px 32px rgba(0,0,0,0.4)' : '0 1px 12px rgba(0,0,0,0.06)' }}
                        onClick={() => isOverlay ? setOverlayAlbumId(album.id) : navigate(`/user/${userId}/album/${album.id}`, { state: { ownerLevel: userLevel } })}>
                        {p.length === 0 ? <div className="absolute inset-0 flex items-center justify-center" style={{ background: isLv30 ? 'rgba(255,255,255,0.04)' : '#f0ece4' }}><Camera size={28} className={isLv30 ? 'text-white/15' : 'text-cream-300'} /></div>
                          : p.length === 1 ? <RemoteImage src={getUrl(p[0])} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          : p.length === 2 ? <div className="absolute inset-0 grid grid-cols-2">{p.map((u, j) => <RemoteImage key={j} src={getUrl(u)} alt="" className="w-full h-full object-cover" />)}</div>
                          : <div className="absolute inset-0 grid grid-cols-2" style={{ gridTemplateColumns: '2fr 1fr' }}><RemoteImage src={getUrl(p[0])} alt="" className="w-full h-full object-cover row-span-2" /><RemoteImage src={getUrl(p[1])} alt="" className="w-full h-full object-cover" /><RemoteImage src={getUrl(p[2])} alt="" className="w-full h-full object-cover" /></div>}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4"><p className="text-white/55 text-xs tracking-[1px] mb-1">{formatDateRange(album.date_from, album.date_to)}</p><p className="text-white text-lg font-extrabold tracking-[0.5px] leading-tight">{album.name}</p><div className="flex gap-3 mt-1.5"><span className="text-white/50 text-[10px]">{album.photo_count} 张</span>{album.favorite_count ? <span className="text-white/50 text-[10px]">{album.favorite_count} 收藏</span> : null}</div></div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
            <div>
              <div className="px-5 mb-3.5"><span className={`text-[11px] font-semibold uppercase tracking-[1.5px] ${sectionLabel}`}>全部相册</span></div>
              <div className="flex gap-2.5 px-5 overflow-x-auto scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
                {albums.map(album => {
                  const p = album.preview_photos || [];
                  return (
                    <motion.div key={album.id} className="relative flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer"
                      style={{ width: 120, height: 120, background: isLv30 ? 'rgba(255,255,255,0.04)' : '#fff', boxShadow: isLv30 ? 'none' : '0 1px 6px rgba(0,0,0,0.06)' }}
                      onClick={() => isOverlay ? setOverlayAlbumId(album.id) : navigate(`/user/${userId}/album/${album.id}`, { state: { ownerLevel: userLevel } })}>
                      {p.length === 0 ? <div className="absolute inset-0 flex items-center justify-center"><Camera size={20} className={isLv30 ? 'text-white/20' : 'text-cream-300'} /></div>
                        : p.length === 1 ? <RemoteImage src={getUrl(p[0])} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        : p.length === 2 ? <div className="absolute inset-0 grid grid-cols-2">{p.map((u, j) => <RemoteImage key={j} src={getUrl(u)} alt="" className="w-full h-full object-cover" />)}</div>
                        : <div className="absolute inset-0" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr' }}><RemoteImage src={getUrl(p[0])} alt="" className="w-full h-full object-cover" style={{ gridRow: 'span 2' }} /><RemoteImage src={getUrl(p[1])} alt="" className="w-full h-full object-cover" /><RemoteImage src={getUrl(p[2])} alt="" className="w-full h-full object-cover" /></div>}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2.5"><p className="text-white text-[11px] font-bold truncate">{album.name}</p><p className="text-white/50 text-[9px]">{album.photo_count} 张</p></div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      <AnimatePresence>{isOverlay && overlayAlbumId != null && <UserAlbumDetailPage overlayAlbumId={overlayAlbumId} onClose={() => setOverlayAlbumId(null)} zIndex={(zIndex ?? 250) + 10} ownerLevel={userLevel} />}</AnimatePresence>
    </motion.div>
  );
}

// ======================== Detail

export function UserAlbumDetailPage({ overlayAlbumId, onClose, zIndex, ownerLevel }: { overlayAlbumId?: number; onClose?: () => void; zIndex?: number; ownerLevel?: number } = {}) {
  const { albumId: albumIdParam } = useParams<{ albumId: string }>();
  const location = useLocation();
  const albumId = overlayAlbumId ?? Number(albumIdParam);
  const isOverlay = !!onClose;
  const resolvedLevel = ownerLevel ?? (location.state as any)?.ownerLevel ?? 1;
  const goBack = useSmartBack('/profile');

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [carouselPhotos, setCarouselPhotos] = useState<Photo[]>([]);
  const [carouselIds, setCarouselIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [viewPhotoId, setViewPhotoId] = useState<number | null>(null);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => { if (!albumId) return; (async () => {
    setLoading(true); setCommentsLoading(true); setPhotos([]); setCurrentPage(1);
    try { const [pr, fr]: any[] = await Promise.all([getAlbumPhotos(albumId, 1, PAGE_SIZE), checkAlbumFavorite(albumId)]);
      if (pr.code === 0) { const all = pr.data.photos as Photo[]; setPhotos(all); setAlbumName(pr.data.album.name || ''); const ids: number[] = pr.data.album.carousel_photos || []; setCarouselIds(ids); setCarouselPhotos(ids.length >= 2 ? all.filter(p => ids.includes(p.id)) : []); setFavoriteCount(pr.data.album.favorite_count || 0); setHasMore(pr.data.pagination?.hasMore ?? false); }
      if (fr.code === 0) setIsFav(fr.data.favorited);
    } catch {}
    setLoading(false);
    try { const cr: any = await getAlbumComments(albumId); if (cr.code === 0) setComments(cr.data); } catch {}
    setCommentsLoading(false);
  })(); }, [albumId]);

  const loadMore = useCallback(async () => { if (!albumId || !hasMore || loadingMore) return; const np = currentPage + 1; setLoadingMore(true);
    try { const r: any = await getAlbumPhotos(albumId, np, PAGE_SIZE);
      if (r.code === 0) { setPhotos(prev => { const n = [...prev, ...r.data.photos]; if (carouselIds.length >= 2) setCarouselPhotos(n.filter((p: Photo) => carouselIds.includes(p.id))); return n; }); setHasMore(r.data.pagination?.hasMore ?? false); setCurrentPage(np); }
    } catch {} setLoadingMore(false);
  }, [albumId, hasMore, loadingMore, currentPage, carouselIds]);

  const handleToggleFav = async () => { if (!albumId || favLoading) return; setFavLoading(true); try { const r: any = await toggleAlbumFavorite(albumId); if (r.code === 0) { setIsFav(r.data.favorited); setFavoriteCount(p => r.data.favorited ? p + 1 : Math.max(0, p - 1)); } } catch {} setFavLoading(false); };
  const handleSendComment = async (content: string, replyTo?: number) => { if (!albumId) return; const r: any = await addAlbumComment(albumId, content, replyTo); if (r.code === 0) setComments(prev => [...prev, r.data]); };

  const [groupMode, setGroupMode] = useState<'day' | 'month'>('day');
  const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  const groupedPhotos = useCallback(() => {
    const map = new Map<string, Photo[]>();
    if (groupMode === 'day') {
      for (const p of photos) { const k = p.created_at.slice(0, 10); if (!map.has(k)) map.set(k, []); map.get(k)!.push(p); }
      const g: { key: string; label: string; subtitle: string; photos: Photo[] }[] = [];
      for (const [k, list] of map) { const { label, weekday } = formatDayLabel(k); g.push({ key: k, label, subtitle: weekday, photos: list }); }
      return g;
    } else {
      for (const p of photos) { const k = p.created_at.slice(0, 7); if (!map.has(k)) map.set(k, []); map.get(k)!.push(p); }
      const g: { key: string; label: string; subtitle: string; photos: Photo[] }[] = [];
      for (const [k, list] of map) { const [y, m] = k.split('-'); g.push({ key: k, label: MONTHS[parseInt(m) - 1], subtitle: `${y}年`, photos: list }); }
      return g;
    }
  }, [photos, groupMode]);

  const isLv30 = resolvedLevel >= 30;
  const pageBg = isLv30 ? '#0d0d1a' : '#f5f0eb';
  const groups = groupedPhotos();

  return (
    <motion.div className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ zIndex: zIndex ?? 250, background: pageBg }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
      {isLv30 && <AuroraBg />}
      <div className="relative z-10 flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3"
        style={{ background: isLv30 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)' }}>
        <button onClick={() => isOverlay ? onClose!() : goBack()}
          className={`w-9 h-9 flex items-center justify-center rounded-full ${isLv30 ? 'hover:bg-white/10' : 'hover:bg-cream-200'}`}>
          <ChevronLeft size={22} className={isLv30 ? 'text-white' : 'text-cream-800'} />
        </button>
        <div className="flex-1"><h1 className={`font-display text-lg font-semibold leading-tight ${isLv30 ? 'text-white' : 'text-cream-900'}`}>{albumName || '相册'}</h1><p className={`text-[11px] ${isLv30 ? 'text-white/40' : 'text-cream-500'}`}>{photos.length} 张</p></div>
        <div className="flex rounded-full p-0.5 mr-1" style={{ background: isLv30 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
          <button onClick={() => setGroupMode('day')} className="px-2 py-1 rounded-full text-[10px] font-medium transition-all"
            style={groupMode === 'day' ? { background: isLv30 ? 'rgba(255,255,255,0.15)' : '#fff', color: isLv30 ? 'white' : '#4a3728', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: isLv30 ? 'rgba(255,255,255,0.4)' : '#a09080' }}>按天</button>
          <button onClick={() => setGroupMode('month')} className="px-2 py-1 rounded-full text-[10px] font-medium transition-all"
            style={groupMode === 'month' ? { background: isLv30 ? 'rgba(255,255,255,0.15)' : '#fff', color: isLv30 ? 'white' : '#4a3728', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: isLv30 ? 'rgba(255,255,255,0.4)' : '#a09080' }}>按月</button>
        </div>
        <button onClick={handleToggleFav} disabled={favLoading}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: isFav ? 'rgba(239,68,68,0.2)' : isLv30 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}>
          <Heart size={16} className={isFav ? 'text-red-400 fill-red-400' : isLv30 ? 'text-white/50' : 'text-cream-500'} />
        </button>
      </div>
      <div className="relative z-10 flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="p-3 grid grid-cols-4 gap-0.5">{Array.from({ length: 8 }).map((_, i) => <motion.div key={i} className="aspect-square" style={{ background: isLv30 ? 'rgba(255,255,255,0.05)' : '#e8e0d5' }} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.08 }} />)}</div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3"><Camera size={32} className={isLv30 ? 'text-white/20' : 'text-cream-400'} /><p className={isLv30 ? 'text-white/30 text-sm' : 'text-cream-500 text-sm'}>相册还是空的</p></div>
        ) : (
          <div className="flex flex-col gap-4 p-3">
            {carouselPhotos.length >= 2 && (
              <div className="py-2">
                <div className="flex items-center gap-2 mb-2 px-1"><Star size={13} fill="#fbbf24" className="text-amber-400" /><span className={`text-[11px] font-semibold uppercase tracking-wider ${isLv30 ? 'text-white/40' : 'text-cream-500'}`}>精选照片</span></div>
                <Carousel3D photos={carouselPhotos.map(p => ({ id: p.id, url: p.url }))} showControls={false} containerHeight={200} cardWidth={160} />
              </div>
            )}
            {groups.map((group, gi) => (
              <div key={group.key} className="mx-1">
                <DaySection label={group.label} subtitle={group.subtitle} photoCount={group.photos.length} isLv30={isLv30} opacity={1 - gi * 0.04} />
                <AlbumGrid photos={group.photos.map(p => ({ id: p.id, url: p.url, caption: p.caption }))} isLv30={isLv30} onPhotoClick={(photo) => setViewPhotoId(photo.id)} />
              </div>
            ))}
            {hasMore && (
              <div className="flex justify-center py-4 mb-12">
                <button onClick={loadMore} disabled={loadingMore} className={`px-4 py-2 rounded-full text-[12px] ${isLv30 ? 'text-white/50 bg-white/6' : 'text-cream-600 bg-cream-100'}`}>{loadingMore ? '加载中...' : '加载更多'}</button>
              </div>
            )}
            <div className="mx-1 mb-16">
              <AlbumComments comments={comments} loading={commentsLoading} favoriteCount={favoriteCount} isFav={isFav} isLv30={isLv30} canDelete={false} onSend={handleSendComment} onToggleFav={handleToggleFav} />
            </div>
          </div>
        )}
      </div>
      <AnimatePresence>{viewPhotoId !== null && <ImageViewer images={photos.map((p: any) => getUrl(p.url))} initialIndex={photos.findIndex((p: any) => p.id === viewPhotoId)} onClose={() => setViewPhotoId(null)} />}</AnimatePresence>
    </motion.div>
  );
}
