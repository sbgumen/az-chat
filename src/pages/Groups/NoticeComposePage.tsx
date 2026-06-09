import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, X, Plus } from 'lucide-react';
import { SafeImg } from '../../components/SafeImg';
import { createGroupNotice, editGroupNotice, uploadNoticeImage, getGroupNotices } from '../../api/groups';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const MAX_IMAGES = 9;

interface Notice {
  id: number; title: string; content: string; images?: string;
}

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <motion.div
      className="fixed top-16 left-1/2 -translate-x-1/2 z-[400] px-4 py-2 rounded-full text-white text-sm font-medium shadow-lg whitespace-nowrap"
      style={{ background: type === 'success' ? '#10b981' : '#ef4444' }}
      initial={{ opacity: 0, y: -8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.9 }}>
      {msg}
    </motion.div>
  );
}

export function NoticeComposePage() {
  const params = useParams();
  const groupId = parseInt(params.groupId || '0');
  const editingNoticeId = params.noticeId ? parseInt(params.noticeId) : null;
  const goBack = useSmartBack(`/messages/group/${groupId}/info/notices`);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(!!editingNoticeId);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2000);
  };

  // Load existing notice for editing
  useEffect(() => {
    if (!editingNoticeId) return;
    (async () => {
      try {
        const res: any = await getGroupNotices(groupId);
        if (res.code === 0 || res.data) {
          const list = res.data || res || [];
          const found = list.find((x: Notice) => x.id === editingNoticeId);
          if (found) {
            setTitle(found.title || '');
            setContent(found.content || '');
            try { setImages(found.images ? JSON.parse(found.images) : []); } catch { }
          }
        }
      } catch { }
      setLoading(false);
    })();
  }, [editingNoticeId, groupId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (images.length >= MAX_IMAGES) {
      showToast('最多上传9张图片', 'error');
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('图片不能超过10MB', 'error');
      e.target.value = '';
      return;
    }
    setUploadingImg(true);
    try {
      const res: any = await uploadNoticeImage(groupId, file);
      const url = (res.data || res)?.url;
      if (url) {
        setImages(prev => [...prev, url]);
      }
    } catch {
      showToast('图片上传失败', 'error');
    }
    setUploadingImg(false);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      showToast('请输入公告内容', 'error');
      return;
    }
    setPublishing(true);
    try {
      if (editingNoticeId) {
        const res: any = await editGroupNotice(groupId, editingNoticeId, title.trim(), content.trim(), images);
        if (res.code === 0) {
          showToast('公告已更新');
          setTimeout(() => goBack(), 600);
        } else {
          showToast(res.message || '编辑失败', 'error');
        }
      } else {
        const res: any = await createGroupNotice(groupId, title.trim(), content.trim(), images);
        if (res.code === 0) {
          showToast('公告已发布');
          setTimeout(() => goBack(), 600);
        } else {
          showToast(res.message || '发布失败', 'error');
        }
      }
    } catch {
      showToast('操作失败，请重试', 'error');
    }
    setPublishing(false);
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

  return (
    <motion.div className="fixed inset-0 z-[270] flex flex-col overflow-hidden"
      style={{ background: '#f5f0eb' }}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)' }}>
        <button onClick={goBack}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-200">
          <ChevronLeft size={22} className="text-cream-800" />
        </button>
        <span className="font-display text-lg font-semibold text-cream-900">
          {editingNoticeId ? '编辑公告' : '编写公告'}
        </span>
        <button onClick={handleSubmit} disabled={publishing || !content.trim()}
          className="px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'rgba(212,165,116,0.12)', color: '#d4a574' }}>
          {publishing ? '发布中...' : '发布'}
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-8">
        {/* Title input */}
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={200}
          placeholder="公告标题（必填）"
          className="w-full text-[17px] font-bold text-cream-900 placeholder-gray-400 outline-none bg-transparent mb-3 px-1"
        />

        {/* Content textarea */}
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          maxLength={500}
          placeholder="输入公告正文..."
          rows={6}
          className="w-full text-[14px] text-cream-700 placeholder-gray-400 outline-none resize-none bg-transparent leading-relaxed px-1"
          style={{ minHeight: 120 }}
        />

        {/* Image thumbnails */}
        {images.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {images.map((url, i) => (
              <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden"
                style={{ background: 'rgba(212,165,116,0.08)' }}>
                <SafeImg src={url.startsWith('http') ? url : `${apiBase}${url}`}
                  alt="" className="w-full h-full object-cover" />
                <button onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/30 flex items-center justify-center">
                  <X size={9} className="text-white" />
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <button onClick={() => fileRef.current?.click()} disabled={uploadingImg}
                className="w-16 h-16 rounded-xl flex items-center justify-center border-2 border-dashed border-cream-400 transition-colors hover:border-cream-500">
                {uploadingImg
                  ? <div className="w-4 h-4 rounded-full border-2 border-warm-400 border-t-transparent animate-spin" />
                  : <Plus size={20} className="text-cream-500" />}
              </button>
            )}
          </div>
        )}

        {/* No images yet - show add button */}
        {images.length === 0 && (
          <button onClick={() => fileRef.current?.click()} disabled={uploadingImg}
            className="flex items-center gap-2 mt-3 px-4 py-2.5 rounded-xl text-[13px] text-cream-600 transition-all active:scale-95"
            style={{ background: 'rgba(212,165,116,0.06)' }}>
            <Plus size={14} />
            {uploadingImg ? '上传中...' : '添加图片（最多9张）'}
          </button>
        )}

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

        {/* Char count */}
        <div className="flex justify-end mt-3">
          <span className="text-[11px] text-cream-300">{content.length}/500</span>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2">
        <button onClick={handleSubmit} disabled={publishing || !content.trim()}
          className="w-full py-3.5 rounded-2xl text-[15px] font-bold text-white transition-all active:scale-[0.98] disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #d4a574, #c4956a)' }}>
          {editingNoticeId ? '保存修改' : '发布公告'}
        </button>
      </div>
    </motion.div>
  );
}

export default NoticeComposePage;
