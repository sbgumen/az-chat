import { motion } from 'framer-motion';
import { RemoteImage } from './RemoteImage';
import { Star } from 'lucide-react';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getUrl = (u: string) => u?.startsWith('http') ? u : `${apiBase}${u}`;

export interface GridPhoto {
  id: number;
  url: string;
  caption?: string;
  isCarousel?: boolean;
  carouselOrder?: number;
}

interface Props {
  photos: GridPhoto[];
  isLv30: boolean;
  selectMode?: boolean;
  deleteMode?: boolean;
  carouselIds?: number[];
  selectedPhotoIds?: Set<number>;
  onPhotoClick: (photo: GridPhoto, index: number) => void;
}

export function AlbumGrid({ photos, isLv30, selectMode, deleteMode, carouselIds, selectedPhotoIds, onPhotoClick }: Props) {
  const isEmptyBg = isLv30 ? 'rgba(255,255,255,0.05)' : '#e8e0d5';

  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
      {photos.map((p, i) => {
        const isCarousel = carouselIds?.includes(p.id);
        const isSelectedForDelete = selectedPhotoIds?.has(p.id);

        return (
          <motion.div
            key={p.id}
            className="relative overflow-hidden cursor-pointer"
            style={{
              aspectRatio: '1/1',
              background: isEmptyBg,
              boxShadow: isSelectedForDelete ? 'inset 0 0 0 2px #ef4444' : undefined,
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ delay: (i % 8) * 0.03, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => onPhotoClick(p, i)}
          >
            <RemoteImage src={getUrl(p.url)} alt="" className="absolute inset-0 w-full h-full object-cover" />

            {/* LV30+ 扫光 */}
            {isLv30 && !selectMode && !deleteMode && (
              <motion.div
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{
                  left: '-60%', width: '50%',
                  background: 'linear-gradient(105deg, transparent 10%, rgba(255,255,255,0.2) 50%, transparent 90%)',
                  willChange: 'transform',
                }}
                animate={{ x: ['0%', '500%'] }}
                transition={{ delay: i * 0.25, duration: 1.4, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
              />
            )}

            {/* 精选标记 */}
            {!selectMode && !deleteMode && isCarousel && (
              <div className="absolute top-1 left-1 rounded-full px-1.5 py-0.5 flex items-center gap-0.5"
                style={{ background: 'rgba(251,191,36,0.85)' }}>
                <Star size={9} fill="white" className="text-white" />
                <span className="text-white text-[9px] font-medium">精选</span>
              </div>
            )}

            {/* 选择模式 */}
            {selectMode && (
              <div className={`absolute inset-0 flex items-center justify-center transition-all ${isCarousel ? 'bg-warm-500/35' : 'bg-transparent hover:bg-black/10'}`}>
                {isCarousel && (
                  <div className="w-6 h-6 rounded-full bg-warm-500 flex items-center justify-center shadow">
                    <span className="text-white text-[10px] font-bold">{(carouselIds?.indexOf(p.id) ?? 0) + 1}</span>
                  </div>
                )}
                {!isCarousel && (carouselIds?.length ?? 0) < 3 && (
                  <div className="w-6 h-6 rounded-full border-2 border-white/70 bg-black/15" />
                )}
              </div>
            )}

            {/* 删除模式 */}
            {deleteMode && (
              <div className={`absolute top-1 right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelectedForDelete ? 'bg-red-500 border-red-500' : 'bg-white/70 border-white/60'}`}>
                {isSelectedForDelete && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

export default AlbumGrid;
