import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Edit3, Trash2, Hash, Save, X, Loader2 } from 'lucide-react';
import { adminApi } from '../../api/admin';

export function AdminTopicsPage() {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState<any>(null);
  const [eName, setEName] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [eStatus, setEStatus] = useState('active');
  const [eCover, setECover] = useState('');
  const [saving, setSaving] = useState(false);
  const limit = 20;

  const fetch = async (p = 1) => {
    setLoading(true);
    try {
      const params: any = { page: p, limit };
      if (keyword.trim()) params.keyword = keyword.trim();
      const res: any = await adminApi.getAdminTopics(params);
      if (res.code === 0) { setTopics(res.data.list || []); setTotal(res.data.total || 0); setPage(p); }
    } catch { }
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const openEdit = (t: any) => { setEditing(t); setEName(t.name || ''); setEDesc(t.description || ''); setEStatus(t.status || 'active'); setECover(t.cover_image || ''); };
  const handleSave = async () => {
    setSaving(true);
    try {
      const res: any = await adminApi.updateAdminTopic(editing.id, { name: eName.trim(), description: eDesc.trim(), status: eStatus, cover_image: eCover.trim() });
      if (res.code === 0) { setEditing(null); fetch(); }
    } catch { }
    setSaving(false);
  };
  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该话题？关联动态的话题标签将被清空')) return;
    try { await adminApi.deleteAdminTopic(id); fetch(); } catch { }
  };
  const sc: Record<string, string> = { hot: 'bg-red-50 text-red-600', active: 'bg-emerald-50 text-emerald-600', new: 'bg-blue-50 text-blue-600' };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-cream-900">话题管理</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-cream-200">
            <Search size={16} className="text-cream-400" />
            <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="搜索话题" className="bg-transparent text-sm outline-none w-40" onKeyDown={e => e.key === 'Enter' && fetch()} />
          </div>
          <button onClick={() => fetch()} className="px-3 py-2 bg-warm-500 text-white rounded-lg text-sm hover:bg-warm-600">搜索</button>
        </div>
      </div>
      {loading ? <div className="animate-pulse space-y-2">{[1,2,3].map(i=><div key={i} className="h-12 bg-cream-200 rounded-lg" />)}</div>
        : topics.length === 0 ? <p className="text-center text-cream-400 py-16">暂无话题</p>
          : <>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {topics.map(t => (
                <div key={t.id} className="flex items-center gap-4 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 border-b border-cream-100 last:border-0">
                  <Hash size={18} className="text-warm-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="font-medium text-sm">#{t.name}</span><span className={`text-[10px] px-1.5 py-0.5 rounded-full ${sc[t.status]||''}`}>{t.status}</span><span className="text-xs text-cream-400">{t.usage_count||0}条</span></div>
                    <p className="text-xs text-cream-500 truncate">{t.description||''}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={()=>openEdit(t)} className="p-1.5 text-cream-500 hover:text-warm-600"><Edit3 size={15}/></button>
                    <button onClick={()=>handleDelete(t.id)} className="p-1.5 text-cream-500 hover:text-red-500"><Trash2 size={15}/></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4">
              <button disabled={page<=1} onClick={()=>fetch(page-1)} className="px-3 py-1 text-sm border border-cream-200 rounded-lg disabled:opacity-30">上一页</button>
              <span className="text-sm text-cream-500">{page}/{Math.ceil(total/limit)||1}</span>
              <button disabled={page*limit>=total} onClick={()=>fetch(page+1)} className="px-3 py-1 text-sm border border-cream-200 rounded-lg disabled:opacity-30">下一页</button>
            </div>
          </>
      }
      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={()=>setEditing(null)}>
            <motion.div initial={{scale:.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.9,opacity:0}} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4"><h3 className="font-semibold">编辑话题</h3><button onClick={()=>setEditing(null)}><X size={18}/></button></div>
              <div className="space-y-3">
                <div><label className="text-xs text-cream-500 mb-1 block">名称</label><input value={eName} onChange={e=>setEName(e.target.value)} maxLength={50} className="w-full px-3 py-2 border border-cream-200 rounded-lg text-sm"/></div>
                <div><label className="text-xs text-cream-500 mb-1 block">描述</label><textarea value={eDesc} onChange={e=>setEDesc(e.target.value)} maxLength={500} rows={2} className="w-full px-3 py-2 border border-cream-200 rounded-lg text-sm"/></div>
                <div><label className="text-xs text-cream-500 mb-1 block">状态</label><select value={eStatus} onChange={e=>setEStatus(e.target.value)} className="w-full px-3 py-2 border border-cream-200 rounded-lg text-sm"><option value="new">新话题</option><option value="active">活跃</option><option value="hot">热门</option></select></div>
                <div><label className="text-xs text-cream-500 mb-1 block">封面URL</label><input value={eCover} onChange={e=>setECover(e.target.value)} maxLength={500} className="w-full px-3 py-2 border border-cream-200 rounded-lg text-sm"/></div>
              </div>
              <div className="flex gap-3 mt-5"><button onClick={()=>setEditing(null)} className="flex-1 py-2 text-sm border border-cream-200 rounded-lg">取消</button><button onClick={handleSave} disabled={saving} className="flex-1 py-2 text-sm bg-warm-500 text-white rounded-lg hover:bg-warm-600 disabled:opacity-50">{saving?<Loader2 size={14} className="animate-spin inline mr-1"/>:<Save size={14} className="inline mr-1"/>}保存</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
