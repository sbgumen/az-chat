import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Pencil, Trash2 } from 'lucide-react';
import { ImageViewer } from '../../components/ImageViewer';
import { SafeImg } from '../../components/SafeImg';
import { LinkifyText } from '../../components/LinkifyText';
import { getGroupNotices, markNoticeRead, deleteGroupNotice, getGroupDetail } from '../../api/groups';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;

interface Notice {
  id: number;
  title: string;
  content: string;
  author_id: number;
  author_name: string;
  author_avatar: string;
  created_at: string;
  is_broadcast: number;
  read_count: number;
  member_count: number;
  is_read: number;
  images?: string;
}

function ConfirmSheet({ title, desc, confirmLabel, onConfirm, onCancel }: {
  title: string; desc: string; confirmLabel: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <motion.div className="fixed inset-0 z-[420] bg-black/40 flex items-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onCancel}>
      <motion.div className="w-full bg-white rounded-t-3xl pb-[env(safe-area-inset-bottom)]"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-4" />
        <div className="px-6 pb-2">
          <h3 className="text-[17px] font-semibold text-gray-900 text-center">{title}</h3>
          <p className="text-[13px] text-gray-500 text-center mt-1.5 leading-relaxed">{desc}</p>
        </div>
        <div className="px-4 py-4 flex flex-col gap-2.5">
          <button onClick={onConfirm}
            className="w-full py-3.5 rounded-2xl font-semibold text-[15px] bg-red-500 text-white transition-all active:scale-[0.98]">
            {confirmLabel}
          </button>
          <button onClick={onCancel}
            className="w-full py-3.5 rounded-2xl font-medium text-[15px] bg-gray-100 text-gray-700 transition-all active:scale-[0.98]">
            取消
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function NoticeDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const groupId = parseInt(params.groupId || '0');
  const noticeId = parseInt(params.noticeId || '0');
  const goBack = useSmartBack(`/messages/group/${groupId}/info/notices`);

  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const readMarkedRef = useRef(false);

  const load = async () => {
    try {
      const [nRes, gRes]: any[] = await Promise.all([getGroupNotices(groupId), getGroupDetail(groupId)]);
      if (nRes.code === 0 || nRes.data) {
        const list = nRes.data || nRes || [];
        const found = list.find((x: Notice) => x.id === noticeId);
        if (found) setNotice(found);
      }
      if (gRes.data?.my_role) setMyRole(gRes.data.my_role);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { load(); }, [groupId, noticeId]);

  // Auto mark as read on entering detail
  useEffect(() => {
    if (!notice || readMarkedRef.current) return;
    readMarkedRef.current = true;
    markNoticeRead(groupId, noticeId).then(() => {
      setNotice(prev => prev ? { ...prev, is_read: 1, read_count: prev.read_count + 1 } : null);
    }).catch(() => { });
  }, [notice]);

  const isAdmin = myRole === 'owner' || myRole === 'admin';

  const fmtDate = (t: string) => {
    const d = new Date(t);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const parseImages = (n: Notice): string[] => {
    if (!n.images) return [];
    try { return JSON.parse(n.images); } catch { return []; }
  };

  const handleDelete = async () => {
    const res: any = await deleteGroupNotice(groupId, noticeId);
    setConfirmDelete(false);
    if (res.code === 0) {
      navigate(`/messages/group/${groupId}/info/notices`, { replace: true });
    }
  };

  if (loading) {
    return (
      <motion.div className="fixed inset-0 z-[270] flex items-center justify-center"
        style={{ background: '#f5f0eb' }}
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
        <div className="w-6 h-6 rounded-full border-2 border-warm-400 border-t-transparent animate-spin" />
      </motion.div>
    );
  }

  if (!notice) {
    return (
      <motion.div className="fixed inset-0 z-[270] flex flex-col items-center justify-center gap-4"
        style={{ background: '#f5f0eb' }}
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
        <p className="text-cream-400 text-sm">公告不存在或已被删除</p>
        <button onClick={goBack}
          className="px-4 py-2 rounded-full text-[13px] font-medium transition-all active:scale-95"
          style={{ background: 'rgba(212,165,116,0.12)', color: '#d4a574' }}>
          返回
        </button>
      </motion.div>
    );
  }

  const imgs = parseImages(notice);

  return (
    <motion.div className="fixed inset-0 z-[270] flex flex-col overflow-hidden"
      style={{ background: '#f5f0eb' }}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 flex-shrink-0 relative z-10"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)' }}>
        <button onClick={goBack}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-200">
          <ChevronLeft size={22} className="text-cream-800" />
        </button>
        <span className="font-display text-lg font-semibold text-cream-900">公告详情</span>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Hero Banner */}
        <div className="px-4 pt-2 pb-0">
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #d4a574 0%, #c4956a 40%, #b8864e 100%)' }}>
            <div className="px-5 pt-7 pb-6">
              <div className="text-[10px] tracking-[3px] uppercase mb-2"
                style={{ color: 'rgba(255,255,255,0.65)' }}>
                群公告
              </div>
              <h1 className="text-[22px] font-extrabold text-white leading-tight tracking-tight"
                style={{ fontFamily: 'var(--font-display, "Noto Sans SC", sans-serif)' }}>
                {notice.title || '无标题'}
              </h1>
              <div className="flex items-center gap-2.5 mt-4">
                <SafeImg
                  src={notice.author_avatar
                    ? (notice.author_avatar.startsWith('http') ? notice.author_avatar : `${apiBase}${notice.author_avatar}`)
                    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${notice.author_id}`}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-white/20"
                />
                <div>
                  <span className="text-[13px] font-semibold text-white">{notice.author_name}</span>
                  <p className="text-[10px] text-white/50">{fmtDate(notice.created_at)}</p>
                </div>
              </div>
              {notice.is_broadcast === 1 && (
                <div className="flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full inline-flex"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                  <span className="text-[10px] font-semibold text-amber-200">播报中</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Card - overlaps hero */}
        <div className="px-4 -mt-3 relative z-10">
          <div className="rounded-2xl px-5 py-5"
            style={{ background: '#fff', boxShadow: '0 -2px 20px rgba(139,115,85,0.06)' }}>
            <LinkifyText
              text={notice.content}
              className="text-[15px] text-cream-800 leading-relaxed whitespace-pre-wrap"
              linkColor="#C4956A"
            />

            {/* Images */}
            {imgs.length > 0 && (
              <div className="grid gap-2 mt-4"
                style={{ gridTemplateColumns: imgs.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(100px, 1fr))' }}>
                {imgs.map((url, i) => (
                  <div key={i} className={`rounded-xl overflow-hidden cursor-pointer active:opacity-90 ${imgs.length === 1 ? '' : 'aspect-square'}`}
                    style={{ background: 'rgba(212,165,116,0.06)' }}
                    onClick={() => setViewImage(url.startsWith('http') ? url : `${apiBase}${url}`)}>
                    <SafeImg src={url.startsWith('http') ? url : `${apiBase}${url}`}
                      alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Read stats */}
            <div className="flex items-center gap-3 mt-5 pt-4"
              style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <div className="flex items-center gap-1.5 text-[13px] text-cream-600">
                <div className={`w-1.5 h-1.5 rounded-full ${notice.is_read ? 'bg-emerald-400' : 'bg-cream-300'}`} />
                {notice.read_count}/{notice.member_count} 已读
              </div>
              {notice.is_read && (
                <span className="text-[12px] text-emerald-500 font-medium ml-auto">已读</span>
              )}
            </div>
          </div>

          {/* Admin actions */}
          {isAdmin && (
            <div className="flex gap-3 mt-3 mb-8">
              <button onClick={() => navigate(`/messages/group/${groupId}/info/notices/compose/${noticeId}`)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-[14px] font-semibold transition-all active:scale-[0.98]"
                style={{ background: 'rgba(212,165,116,0.1)', color: '#d4a574' }}>
                <Pencil size={15} />编辑公告
              </button>
              <button onClick={() => setConfirmDelete(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-[14px] font-semibold transition-all active:scale-[0.98]"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
                <Trash2 size={15} />删除公告
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image viewer */}
      <AnimatePresence>
        {viewImage && <ImageViewer images={[viewImage]} initialIndex={0} onClose={() => setViewImage(null)} />}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <ConfirmSheet
            title="删除公告"
            desc="删除后无法恢复，确定要删除这条公告吗？"
            confirmLabel="确定删除"
            onConfirm={handleDelete}
            onCancel={() => setConfirmDelete(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default NoticeDetailPage;
