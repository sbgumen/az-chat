import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SafeImg } from './SafeImg';
import { LinkifyText } from './LinkifyText';
import { markNoticeRead } from '../api/groups';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;

interface BroadcastNotice {
  id: number;
  title: string;
  content: string;
  author_name: string;
  author_avatar: string;
  created_at: string;
  images?: string;
}

interface BroadcastPopupProps {
  groupId: number;
  notice: BroadcastNotice | null;
  onDismiss: () => void;
  onViewDetail: () => void;
}

export function BroadcastPopup({ groupId, notice, onDismiss, onViewDetail }: BroadcastPopupProps) {
  const navigate = useNavigate();

  if (!notice) return null;

  let imgs: string[] = [];
  try {
    imgs = notice.images ? JSON.parse(notice.images) : [];
  } catch { }

  const handleViewDetail = async () => {
    try {
      await markNoticeRead(groupId, notice.id);
    } catch { }
    onViewDetail();
    navigate(`/messages/group/${groupId}/info/notices/${notice.id}`);
  };

  const fmtDate = (t: string) => {
    const d = new Date(t);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}`;
  };

  return (
    <motion.div className="fixed inset-0 z-[350] flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.08)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-[340px] flex flex-col items-center text-center bg-white rounded-3xl shadow-2xl overflow-hidden"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 10 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        onClick={e => e.stopPropagation()}
      >
        {/* 公告标签 */}
        <div className="text-[11px] tracking-[4px] uppercase font-bold mt-5 mb-2" style={{ color: '#F5A623' }}>
          <span className="inline-block px-4 py-1 rounded-full" style={{ background: '#FFF8E7' }}>群公告</span>
        </div>

        {/* 标题 */}
        <h1 className="text-[20px] font-extrabold text-[#1a1a1a] leading-snug px-5 mb-3"
          style={{ fontFamily: 'var(--font-display, "Noto Sans SC", sans-serif)' }}>
          {notice.title || notice.content.slice(0, 30)}
        </h1>

        {/* 分隔线 */}
        <div className="w-16 h-[1.5px] mb-4 mx-auto" style={{ background: '#E8DDD0' }} />

        {/* 内容 */}
        <div className="px-6 mb-4 max-h-[140px] overflow-y-auto text-left w-full">
          <LinkifyText
            text={notice.title
              ? notice.content.slice(0, 200) + (notice.content.length > 200 ? '...' : '')
              : notice.content.slice(30, 200) + (notice.content.length > 200 ? '...' : '')
            }
            className="text-[14px] leading-relaxed"
            linkColor="#C4956A"
          />
        </div>

        {/* 图片 */}
        {imgs.length > 0 && (
          <div className="flex justify-center gap-2 px-6 mb-4">
            {imgs.slice(0, 3).map((url, i) => (
              <div key={i} className="w-[68px] h-[68px] rounded-xl overflow-hidden bg-cream-100">
                <SafeImg src={url.startsWith('http') ? url : `${apiBase}${url}`}
                  alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            {imgs.length > 3 && (
              <div className="w-[68px] h-[68px] rounded-xl flex items-center justify-center bg-cream-100">
                <span className="text-[12px] text-cream-500">+{imgs.length - 3}</span>
              </div>
            )}
          </div>
        )}

        {/* 作者 */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <SafeImg
            src={notice.author_avatar
              ? (notice.author_avatar.startsWith('http') ? notice.author_avatar : `${apiBase}${notice.author_avatar}`)
              : `https://api.dicebear.com/7.x/avataaars/svg?seed=${notice.id}`}
            alt=""
            className="w-5 h-5 rounded-full object-cover"
          />
          <span className="text-[12px] text-cream-600">{notice.author_name}</span>
        </div>
        <span className="text-[10px] text-cream-400 mb-4">{fmtDate(notice.created_at)}</span>

        {/* 按钮 */}
        <div className="flex w-full border-t border-cream-100">
          <button onClick={onDismiss}
            className="flex-1 py-3.5 text-[14px] font-medium text-cream-600 active:bg-cream-50">
            我知道了
          </button>
          <div className="w-px bg-cream-100" />
          <button onClick={handleViewDetail}
            className="flex-1 py-3.5 text-[14px] font-semibold active:bg-cream-50"
            style={{ color: '#F5A623' }}>
            查看详情
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default BroadcastPopup;
