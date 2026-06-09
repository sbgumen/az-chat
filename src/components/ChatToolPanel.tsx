import { motion } from 'framer-motion';
import { Image, FolderOpen } from 'lucide-react';

interface Props {
  onPickImage: () => void;
  onPickAlbum: () => void;
  isLv30?: boolean;
}

const PANEL_H = 280;

export function ChatToolPanel({ onPickImage, onPickAlbum, isLv30 }: Props) {
  const bg = isLv30 ? 'rgba(20,20,40,0.95)' : 'rgba(255,255,255,0.98)';

  const tools = [
    { icon: Image, label: '本地图片', onClick: onPickImage, color: '#6b8ba0' },
    { icon: FolderOpen, label: '从相册选择', onClick: onPickAlbum, color: '#d4a574' },
  ];

  return (
    <motion.div
      initial={{ height: 0 }} animate={{ height: PANEL_H }} exit={{ height: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      className="overflow-hidden flex-shrink-0"
      style={{ background: bg, backdropFilter: 'blur(20px)', borderTop: isLv30 ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}
    >
      <div className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[1.5px] mb-3" style={{ color: isLv30 ? 'rgba(255,255,255,0.3)' : '#c0b0a0' }}>
          工具
        </p>
        <div className="grid grid-cols-4 gap-3">
          {tools.map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.button key={i}
                onClick={t.onClick}
                className="flex flex-col items-center gap-2 py-3 rounded-2xl active:scale-95"
                style={{ background: isLv30 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                whileTap={{ scale: 0.95 }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: `${t.color}15` }}>
                  <Icon size={22} style={{ color: t.color }} />
                </div>
                <span className="text-[11px] font-medium" style={{ color: isLv30 ? 'rgba(255,255,255,0.5)' : '#a09080' }}>{t.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export default ChatToolPanel;
