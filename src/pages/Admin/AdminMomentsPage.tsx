import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { adminApi } from '../../api/admin';

export function AdminMomentsPage() {
  const [moments, setMoments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [userId, setUserId] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const limit = 20;

  const fetch = async (p = 1) => {
    setLoading(true);
    try {
      const params: any = { page: p, limit };
      if (keyword.trim()) params.keyword = keyword.trim();
      if (userId.trim()) params.userId = parseInt(userId.trim());
      const res: any = await adminApi.getAdminMoments(params);
      if (res.code === 0) { setMoments(res.data.list || []); setTotal(res.data.total || 0); setPage(p); }
    } catch { setMsg('加载失败'); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res: any = await adminApi.deleteAdminMoment(deleteId);
      if (res.code === 0) { setMsg('删除成功'); fetch(page); } else { setMsg(res.message || '删除失败'); }
    } catch { setMsg('网络错误'); }
    setDeleteId(null);
  };

  const formatTime = (t: string) => {
    const d = new Date(t);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    return d.toLocaleDateString('zh-CN');
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h2 className="text-lg font-semibold text-cream-900">动态管理</h2>
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-cream-200 flex-1 min-w-[200px]">
          <Search size={16} className="text-cream-400" />
          <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="搜索关键词"
            className="bg-transparent text-sm outline-none flex-1" onKeyDown={e => e.key === 'Enter' && fetch()} />
        </div>
        <input value={userId} onChange={e => setUserId(e.target.value)} placeholder="用户ID"
          className="w-24 px-3 py-2 border border-cream-200 rounded-lg text-sm bg-white" />
        <button onClick={() => fetch()} className="px-4 py-2 bg-warm-500 text-white rounded-lg text-sm font-medium hover:bg-warm-600">搜索</button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-cream-200 rounded-lg" />)}</div>
      ) : moments.length === 0 ? (
        <p className="text-center text-cream-400 py-16">暂无动态</p>
      ) : (
        <>
          <div className="space-y-2">
            {moments.map(m => (
              <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-cream-800">{m.user_nickname || `ID:${m.user_id}`}</span>
                    <span className="text-xs text-cream-400">{formatTime(m.created_at)}</span>
                  </div>
                  <p className="text-sm text-cream-600 truncate">{m.content || '[无文字]'}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {m.images?.length > 0 && <Eye size={14} className="text-cream-400" />}
                  <button onClick={() => setDeleteId(m.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 size={16} /></button>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4">
            <button disabled={page <= 1} onClick={() => fetch(page - 1)}
              className="px-3 py-1 text-sm rounded-lg border border-cream-200 disabled:opacity-30">上一页</button>
            <span className="text-sm text-cream-500">{page} / {Math.ceil(total / limit) || 1}</span>
            <button disabled={page * limit >= total} onClick={() => fetch(page + 1)}
              className="px-3 py-1 text-sm rounded-lg border border-cream-200 disabled:opacity-30">下一页</button>
          </div>
        </>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4"><AlertTriangle size={24} className="text-red-500" /><span className="font-semibold text-cream-900">确认删除</span></div>
            <p className="text-sm text-cream-600 mb-6">确定要删除这条动态吗？此操作不可撤销。</p>
            <div className="flex gap-3"><button onClick={() => setDeleteId(null)} className="flex-1 py-2 text-sm border border-cream-200 rounded-lg">取消</button>
              <button onClick={handleDelete} className="flex-1 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">确认删除</button></div>
          </div>
        </div>
      )}
      {msg && <p className={`text-sm text-center ${msg.includes('成功') ? 'text-emerald-600' : 'text-red-500'}`}>{msg}</p>}
    </div>
  );
}
