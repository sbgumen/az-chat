import { RemoteImage } from '../../components/RemoteImage';
import { CardDecoration } from '../../components/CardDecoration';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Play, Pause, Trash2, CheckCircle2, Circle, Camera, ImageIcon } from 'lucide-react';
import { useSmartBack } from '../../hooks/useSmartBack';
import { ImageViewer } from '../../components/ImageViewer';
import { getAlbumFavorites, toggleAlbumFavorite } from '../../api/user';
import { UserAlbumPage } from './UserAlbumPage';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getUrl = (s: string) => s?.startsWith('http') ? s : `${apiBase}${s}`;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('az_token')}` });

interface FavoriteItem {
  id: number; msg_id: number; msg_type: 'private' | 'group';
  sender_id: number; sender_nickname: string; sender_avatar: string;
  content: string; content_type: string; msg_created_at: string;
  source_name: string; created_at: string;
}

interface FavAlbum {
  id: number; album_id: number; album_name: string; created_at: string;
  owner_id: number; owner_nickname: string; owner_avatar: string;
  photo_count: number; preview_photos: string[];
}

function AudioPreview({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const pipeIdx = src.lastIndexOf('|');
  const audioSrc = pipeIdx > 0 ? src.slice(0, pipeIdx) : src;
  const knownDur = pipeIdx > 0 ? parseInt(src.slice(pipeIdx + 1)) || 0 : 0;
  const toggle = () => { const a = audioRef.current; if (!a) return; playing ? a.pause() : a.play(); };
  return (
    <div className="flex items-center gap-2.5 mt-1.5">
      <audio ref={audioRef} src={getUrl(audioSrc)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
      <button onClick={toggle} className="w-8 h-8 rounded-full bg-purple-300/40 flex items-center justify-center flex-shrink-0 active:scale-90 transition-all">
        {playing ? <Pause size={14} className="text-purple-700" /> : <Play size={14} className="text-purple-700" />}
      </button>
      <div className="flex items-center gap-[2px]">
        {[3,5,8,6,9,7,4,6,8,5,3].map((h, i) => (
          <div key={i} className="rounded-full bg-purple-300/60" style={{ width: 3, height: h * 2 }} />
        ))}
      </div>
      <span className="text-[11px] text-purple-500/70">{(knownDur || duration) > 0 ? `${Math.ceil(knownDur || duration)}″` : '…'}</span>
    </div>
  );
}

export function FavoritesPage() {
  const goBack = useSmartBack('/profile');
  const [tab, setTab] = useState<'messages' | 'albums'>('messages');
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [msgLoading, setMsgLoading] = useState(true);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [managing, setManaging] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [removing, setRemoving] = useState(false);
  const [favAlbums, setFavAlbums] = useState<FavAlbum[]>([]);
  const [albumsLoading, setAlbumsLoading] = useState(false);
  const [albumsLoaded, setAlbumsLoaded] = useState(false);
  const [openAlbumUserId, setOpenAlbumUserId] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${apiBase}/api/favorites`, { headers: authHeaders() })
      .then(r => r.json())
      .then(res => { if (res.code === 0) setItems(res.data); })
      .catch(() => {})
      .finally(() => setMsgLoading(false));
  }, []);

  useEffect(() => {
    if (tab !== 'albums' || albumsLoaded) return;
    setAlbumsLoading(true);
    getAlbumFavorites().then((res: any) => {
      if (res.code === 0) setFavAlbums(res.data);
      setAlbumsLoaded(true);
    }).catch(() => {}).finally(() => setAlbumsLoading(false));
  }, [tab]);

  const shortTime = (t: string) => {
    const d = new Date(t);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const handleRemoveMsgs = async () => {
    if (selected.size === 0 || removing) return;
    setRemoving(true);
    const toRemove = items.filter(it => selected.has(it.id));
    await Promise.all(toRemove.map(it =>
      fetch(`${apiBase}/api/favorites/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ msgId: it.msg_id, msgType: it.msg_type }),
      }).catch(() => {})
    ));
    setItems(prev => prev.filter(it => !selected.has(it.id)));
    setSelected(new Set()); setManaging(false); setRemoving(false);
  };

  const handleUnfavAlbum = async (fav: FavAlbum) => {
    try {
      const res: any = await toggleAlbumFavorite(fav.album_id);
      if (res.code === 0 && !res.data.favorited) {
        setFavAlbums(prev => prev.filter(a => a.id !== fav.id));
      }
    } catch { /* ignore */ }
  };

  const exitManage = () => { setManaging(false); setSelected(new Set()); };

  return (
    <motion.div className="fixed inset-0 z-[200] flex flex-col bg-cream-100"
      
      
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 flex-shrink-0">
        <button onClick={managing ? exitManage : goBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-200 transition-colors">
          <ChevronLeft size={22} className="text-cream-800" />
        </button>
        <h1 className="font-display text-lg font-semibold text-cream-900 flex-1">我的收藏</h1>
        {tab === 'messages' && items.length > 0 && (
          managing
            ? <button onClick={exitManage} className="text-sm text-cream-600 font-medium px-2">取消</button>
            : <button onClick={() => setManaging(true)} className="text-sm text-indigo-600 font-medium px-2">管理</button>
        )}
      </div>

      {/* Tab pills */}
      <div className="flex justify-center gap-2 pb-3 flex-shrink-0">
        {(['messages', 'albums'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); exitManage(); }}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              tab === t ? 'bg-cream-800 text-white shadow-sm' : 'bg-cream-200 text-cream-500 hover:bg-cream-300'
            }`}>
            {t === 'messages' ? '消息收藏' : '相册收藏'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {tab === 'messages' ? (
          msgLoading ? (
            <div className="px-4 py-4 columns-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="break-inside-avoid mb-3 rounded-2xl bg-cream-200 animate-pulse" style={{ height: 100 + i * 40 }} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-cream-200 flex items-center justify-center">
                <ImageIcon size={28} className="text-cream-300" />
              </div>
              <p className="text-cream-500 text-sm">暂无收藏内容</p>
              <p className="text-cream-400 text-xs">长按消息可以收藏</p>
            </div>
          ) : (
            <div className="px-4 py-2 columns-2 gap-3">
              {items.map((item, i) => {
                const isImg = item.content_type === 'image';
                const isAudio = item.content_type === 'audio';
                return (
                  <motion.div key={item.id}
                    className={`break-inside-avoid mb-3 relative ${isImg ? '' : 'p-4'} ${
                      managing && selected.has(item.id) ? 'ring-2 ring-indigo-400' : ''
                    }`}
                    style={!isImg ? {
                      background: isAudio
                        ? 'linear-gradient(135deg, #f5f0ff, #ede0ff)'
                        : 'linear-gradient(135deg, #fff8f0, #fef3c7)',
                      borderRadius: 18,
                      boxShadow: selected.has(item.id) ? '0 4px 16px rgba(99,102,241,0.2)' : '0 2px 10px rgba(0,0,0,0.04)',
                    } : { borderRadius: 18, overflow: 'hidden', boxShadow: '0 3px 14px rgba(0,0,0,0.07)' }}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={managing ? () => toggleSelect(item.id) : undefined}>

                    {!isImg && !isAudio && <CardDecoration pattern="circles" color="#f59e0b" />}
                    {isAudio && <CardDecoration pattern="dots" color="#a855f7" />}

                    {isImg ? (
                      <>
                        <RemoteImage src={getUrl(item.content)} alt=""
                          className="w-full object-cover"
                          style={{ minHeight: 100, maxHeight: 200 }}
                          onClick={managing ? undefined : () => setViewImage(getUrl(item.content))} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none">
                          <div className="flex items-center gap-1.5 mb-1">
                            <RemoteImage src={getUrl(item.sender_avatar)} alt=""
                              className="w-5 h-5 rounded-md object-cover bg-cream-300"
                              onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.sender_id}`; }} />
                            <span className="text-white text-xs font-semibold truncate">{item.sender_nickname}</span>
                          </div>
                          <div className="text-white/65 text-[10px]">{shortTime(item.msg_created_at)}{item.msg_type === 'group' ? ` · ${item.source_name}` : ''}</div>
                        </div>
                        {managing && (
                          <div className="absolute top-2 right-2 pointer-events-none">
                            {selected.has(item.id) ? <CheckCircle2 size={20} className="text-indigo-400 drop-shadow" /> : <Circle size={20} className="text-white/60 drop-shadow" />}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2.5">
                          <RemoteImage src={getUrl(item.sender_avatar)} alt=""
                            className="w-6 h-6 rounded-lg object-cover bg-cream-300 flex-shrink-0"
                            onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.sender_id}`; }} />
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] font-semibold text-cream-900 truncate block leading-tight">{item.sender_nickname}</span>
                            <span className="text-[9px] text-cream-500/70">{shortTime(item.msg_created_at)}{item.msg_type === 'group' ? ` · ${item.source_name}` : ''}</span>
                          </div>
                          {managing && (
                            <div className="flex-shrink-0">
                              {selected.has(item.id) ? <CheckCircle2 size={18} className="text-indigo-400" /> : <Circle size={18} className="text-cream-300" />}
                            </div>
                          )}
                        </div>
                        {isAudio ? (
                          <AudioPreview src={item.content} />
                        ) : (
                          <p className="text-[13px] text-cream-800 leading-relaxed">"{item.content}"</p>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )
        ) : (
          albumsLoading ? (
            <div className="px-4 py-4 grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-cream-200 animate-pulse" />
              ))}
            </div>
          ) : favAlbums.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-cream-200 flex items-center justify-center">
                <Camera size={28} className="text-cream-300" />
              </div>
              <p className="text-cream-500 text-sm">还没有收藏的相册</p>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-2 gap-3">
              {favAlbums.map((fav, i) => (
                <motion.div key={fav.id}
                  className="relative rounded-2xl overflow-hidden cursor-pointer bg-white shadow-sm"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => setOpenAlbumUserId(fav.owner_id)}>
                  <div className="aspect-square relative overflow-hidden bg-cream-100">
                    {fav.preview_photos.length === 0 ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera size={28} className="text-cream-300" />
                      </div>
                    ) : (
                      <RemoteImage src={getUrl(fav.preview_photos[0])} alt="" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <button
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/30 flex items-center justify-center active:scale-90"
                      onClick={e => { e.stopPropagation(); handleUnfavAlbum(fav); }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="white"><path d="M2 2L12 12M12 2L2 12" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5">
                    <p className="text-white text-[13px] font-semibold truncate drop-shadow">{fav.album_name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <RemoteImage src={getUrl(fav.owner_avatar)} alt=""
                        className="w-4 h-4 rounded-full object-cover bg-cream-300"
                        onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${fav.owner_id}`; }} />
                      <p className="text-white/80 text-[11px] truncate">{fav.owner_nickname} · {fav.photo_count} 张</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>

      {/* 管理底栏 */}
      <AnimatePresence>
        {managing && (
          <motion.div className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 pb-[calc(12px+env(safe-area-inset-bottom))] bg-white/90 backdrop-blur-xl border-t border-cream-200 flex-shrink-0"
            initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}>
            <button onClick={() => { if (selected.size === items.length) setSelected(new Set()); else setSelected(new Set(items.map(it => it.id))); }}
              className="flex-1 py-2.5 rounded-xl border border-cream-300 text-sm font-medium text-cream-700">
              {selected.size === items.length ? '取消全选' : '全选'}
            </button>
            <button onClick={handleRemoveMsgs} disabled={selected.size === 0 || removing}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40">
              <Trash2 size={15} />
              {removing ? '删除中...' : `取消收藏${selected.size > 0 ? ` (${selected.size})` : ''}`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewImage && <ImageViewer images={[viewImage]} initialIndex={0} onClose={() => setViewImage(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {openAlbumUserId !== null && (
          <UserAlbumPage overlayUserId={openAlbumUserId} onClose={() => setOpenAlbumUserId(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
