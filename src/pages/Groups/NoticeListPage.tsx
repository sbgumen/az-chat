import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Plus, Pencil, Trash2, RadioTower } from 'lucide-react';
import { SafeImg } from '../../components/SafeImg';
import { getGroupNotices, setBroadcastNotice, deleteGroupNotice, getGroupDetail } from '../../api/groups';

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

export function NoticeListPage({ onClose, isManageView }: { onClose?: () => void; isManageView?: boolean }) {
  const navigate = useNavigate();
  const params = useParams();
  const groupId = parseInt(params.groupId || '0');
  const gid = groupId;

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Notice | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

  const load = async () => {
    try {
      const [nRes, gRes]: any[] = await Promise.all([getGroupNotices(gid), getGroupDetail(gid)]);
      if (nRes.code === 0 || nRes.data) setNotices(nRes.data || nRes || []);
      if (gRes.data?.my_role) setMyRole(gRes.data.my_role);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { load(); }, [gid]);

  const isAdmin = myRole === 'owner' || myRole === 'admin';
  const showManage = isManageView !== false && isAdmin;

  const fmtDate = (t: string) => {
    const d = new Date(t); const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const parseImages = (n: Notice): string[] => {
    if (!n.images) return [];
    try { return JSON.parse(n.images); } catch { return []; }
  };

  const handleToggleBroadcast = async (n: Notice) => {
    setActingId(n.id);
    const newVal = n.is_broadcast !== 1;
    const res: any = await setBroadcastNotice(gid, n.id, newVal);
    setActingId(null);
    if (res.code === 0) {
      setNotices(prev => prev.map(x => ({
        ...x,
        is_broadcast: x.id === n.id ? (newVal ? 1 : 0) : (newVal ? 0 : x.is_broadcast),
      })));
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const res: any = await deleteGroupNotice(gid, confirmDelete.id);
    setConfirmDelete(null);
    if (res.code === 0) {
      setNotices(prev => prev.filter(x => x.id !== confirmDelete.id));
    }
  };

  const handleItemClick = (n: Notice) => {
    navigate(`/messages/group/${gid}/info/notices/${n.id}`);
  };

  const handleCompose = () => {
    navigate(`/messages/group/${gid}/info/notices/compose`);
  };

  return (
    <motion.div className="fixed inset-0 z-[260] flex flex-col overflow-hidden"
      style={{ background: '#f5f0eb' }}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)' }}>
        <button onClick={() => onClose ? onClose() : navigate(`/messages/group/${gid}/info`, { replace: true })}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-200">
          <ChevronLeft size={22} className="text-cream-800" />
        </button>
        <div className="flex-1">
          <span className="font-display text-lg font-semibold text-cream-900">群公告</span>
          {!loading && <span className="text-[12px] text-cream-500 ml-2">{notices.length} 条</span>}
        </div>
        {showManage && (
          <button onClick={handleCompose}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-all active:scale-95"
            style={{ background: 'rgba(212,165,116,0.12)', color: '#d4a574' }}>
            <Plus size={14} />发布
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-8">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 rounded-full border-2 border-warm-400 border-t-transparent animate-spin" />
          </div>
        ) : notices.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(212,165,116,0.08)' }}>
              <RadioTower size={28} style={{ color: '#c9a87c' }} />
            </div>
            <p className="text-cream-600 text-sm">暂无群公告</p>
            {showManage && (
              <button onClick={handleCompose}
                className="mt-2 px-5 py-2 rounded-full text-[13px] font-semibold transition-all active:scale-95"
                style={{ background: 'rgba(212,165,116,0.12)', color: '#d4a574' }}>
                发布第一条公告
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line - positioned at 11px */}
            <div className="absolute left-[11px] top-1 bottom-4 w-[1.5px]"
              style={{ background: 'linear-gradient(180deg, #d4a574 0%, rgba(212,165,116,0.15) 100%)' }} />

            {notices.map((n, i) => {
              const imgs = parseImages(n);
              return (
                <motion.div key={n.id} className="relative pl-7 pb-8 last:pb-0"
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}>
                  {/* Timeline dot - centered on line at 11px (8px dot left[7]→center 7+4=11, 12px dot left[5]→center 5+6=11) */}
                  <div className="absolute top-[5px]"
                    style={{
                      left: n.is_broadcast === 1 ? 5 : 7,
                      width: n.is_broadcast === 1 ? 12 : 8,
                      height: n.is_broadcast === 1 ? 12 : 8,
                      borderRadius: '50%',
                      background: n.is_broadcast === 1 ? '#d4a574' : 'rgba(212,165,116,0.35)',
                      boxShadow: n.is_broadcast === 1
                        ? '0 0 0 4px #f5f0eb, 0 0 0 6px rgba(212,165,116,0.15)'
                        : '0 0 0 4px #f5f0eb',
                    }}
                  />
                  {/* Unread dot — right side, bigger */}
                  {!n.is_read && (
                    <div className="absolute right-1 top-[5px] w-2 h-2 rounded-full bg-red-500 z-10" />
                  )}

                  {/* Content */}
                  <div className="cursor-pointer active:opacity-80" onClick={() => handleItemClick(n)}>
                    <h3 className="text-[14px] font-bold leading-snug mb-1.5 text-cream-900">
                      {n.title || n.content.slice(0, 30)}
                    </h3>
                    {n.title && (
                      <p className="text-[12px] text-gray-600 leading-relaxed line-clamp-2 mb-2">
                        {n.content}
                      </p>
                    )}
                    {/* Image thumbnails */}
                    {imgs.length > 0 && (
                      <div className="flex gap-1.5 mb-2 flex-wrap">
                        {imgs.slice(0, 3).map((url, j) => (
                          <div key={j} className="w-12 h-12 rounded-lg overflow-hidden"
                            style={{ background: 'rgba(212,165,116,0.08)' }}>
                            <SafeImg src={url.startsWith('http') ? url : `${apiBase}${url}`}
                              alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {imgs.length > 3 && (
                          <span className="text-[11px] text-gray-500 self-end pb-1">+{imgs.length - 3}</span>
                        )}
                      </div>
                    )}
                    {/* Meta */}
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="font-medium text-gray-700">{n.author_name}</span>
                      <span className="text-gray-500">{fmtDate(n.created_at)}</span>
                      <span className="text-emerald-600">{n.read_count}</span>
                      <span className="text-gray-500">/ {n.member_count} 已读</span>
                    </div>
                    {/* Admin actions */}
                    {showManage && (
                      <div className="flex items-center gap-1 mt-2">
                        <button onClick={(e) => { e.stopPropagation(); handleToggleBroadcast(n); }}
                          disabled={actingId === n.id}
                          className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all active:scale-95 disabled:opacity-50"
                          style={{
                            background: n.is_broadcast === 1 ? 'rgba(245,158,11,0.12)' : 'rgba(0,0,0,0.04)',
                            color: n.is_broadcast === 1 ? '#f59e0b' : '#8b7355',
                          }}>
                          <RadioTower size={10} className="inline mr-1" />
                          {n.is_broadcast === 1 ? '播报中' : '设为播报'}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/messages/group/${gid}/info/notices/compose/${n.id}`); }}
                          className="px-2 py-1 rounded-full text-[11px] transition-all active:scale-95"
                          style={{ color: '#8b7355' }}>
                          <Pencil size={10} className="inline mr-0.5" />编辑
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(n); }}
                          className="px-2 py-1 rounded-full text-[11px] text-red-400 transition-all active:scale-95">
                          <Trash2 size={10} className="inline mr-0.5" />删除
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <ConfirmSheet
            title="删除公告"
            desc="删除后无法恢复，确定要删除这条公告吗？"
            confirmLabel="确定删除"
            onConfirm={handleDelete}
            onCancel={() => setConfirmDelete(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default NoticeListPage;
