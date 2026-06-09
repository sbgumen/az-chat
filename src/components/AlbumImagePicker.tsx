import { useState, useEffect } from 'react';
import { RemoteImage } from './RemoteImage';
import { motion } from 'framer-motion';
import { ChevronLeft, Camera, Images } from 'lucide-react';
import { getMyAlbums, getAlbumPhotos } from '../api/user';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getUrl = (u: string) => u?.startsWith('http') ? u : `${apiBase}${u}`;

interface Album { id: number; name: string; photo_count: number; preview_photos: string[]; }
interface Photo { id: number; url: string; }

interface Props { onSelect: (url: string) => void; onClose: () => void; }

export function AlbumImagePicker({ onSelect, onClose }: Props) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyAlbums().then((res: any) => {
      if (res.code === 0) setAlbums(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const openAlbum = async (album: Album) => {
    setCurrentAlbum(album);
    setLoading(true);
    try {
      const res: any = await getAlbumPhotos(album.id);
      if (res.code === 0) setPhotos(res.data.photos);
    } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <motion.div className="fixed inset-0 z-[350] flex flex-col bg-cream-100"
      
          
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
      <div className="flex items-center gap-2 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 border-b border-cream-200 bg-white/90 backdrop-blur-xl flex-shrink-0">
        <button onClick={currentAlbum ? () => { setCurrentAlbum(null); setPhotos([]); } : onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-200 transition-colors">
          <ChevronLeft size={22} className="text-cream-800" />
        </button>
        <h1 className="font-display text-base font-semibold text-cream-900 flex-1">
          {currentAlbum ? currentAlbum.name : '选择相册图片'}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div className="w-7 h-7 rounded-full border-2 border-warm-400 border-t-transparent"
              animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
          </div>
        ) : !currentAlbum ? (
          albums.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Images size={36} className="text-cream-300" />
              <p className="text-cream-500 text-sm">还没有相册</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {albums.map(album => (
                <div key={album.id} className="relative rounded-2xl overflow-hidden cursor-pointer bg-white border border-cream-200/60 shadow-soft"
                  onClick={() => openAlbum(album)}>
                  <div className="aspect-square bg-cream-100 relative overflow-hidden">
                    {album.preview_photos.length > 0
                      ? <RemoteImage src={getUrl(album.preview_photos[0])} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Camera size={24} className="text-cream-300" /></div>
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-2">
                    <p className="text-white text-[13px] font-semibold truncate drop-shadow">{album.name}</p>
                    <p className="text-white/70 text-[11px]">{album.photo_count} 张</p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Camera size={36} className="text-cream-300" />
              <p className="text-cream-500 text-sm">相册是空的</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {photos.map(p => (
                <div key={p.id} className="aspect-square rounded-xl overflow-hidden cursor-pointer active:opacity-70"
                  onClick={() => { onSelect(getUrl(p.url)); onClose(); }}>
                  <RemoteImage src={getUrl(p.url)} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </motion.div>
  );
}
