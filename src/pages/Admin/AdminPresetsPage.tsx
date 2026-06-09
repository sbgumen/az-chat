import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, Loader2, X, Save } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { getMediaUrl } from '../../utils/mediaUrl';
import { SafeImg } from '../../components/SafeImg';

export function AdminPresetsPage() {
  const [presets, setPresets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState('');
  const [animType, setAnimType] = useState('default');
  const [sortOrder, setSortOrder] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetch = async () => {
    setLoading(true);
    try { const res: any = await adminApi.getPresets(); if (res.code === 0) setPresets(res.data); } catch { }
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditing(null); setName(''); setAnimType('default'); setSortOrder(0); setFile(null); setShowModal(true); };
  const openEdit = (p: any) => { setEditing(p); setName(p.name); setAnimType(p.animation_type || 'default'); setSortOrder(p.sort_order || 0); setFile(null); setShowModal(true); };

  const handleSave = async () => {
    if (!name.trim()) return setMsg('请输入名称');
    setSaving(true); setMsg('');
    try {
      let res: any;
      if (editing) {
        res = await adminApi.updatePreset(editing.id, { name: name.trim(), animation_type: animType, sort_order: sortOrder });
      } else {
        const fd = new FormData();
        fd.append('name', name.trim());
        fd.append('animation_type', animType);
        fd.append('sort_order', String(sortOrder));
        if (file) fd.append('image', file);
        res = await adminApi.createPreset(fd);
      }
      if (res.code === 0) { setShowModal(false); fetch(); setMsg(''); }
    } catch { }
    setSaving(false);
  };

  const handleToggle = async (p: any) => { try { await adminApi.updatePreset(p.id, { is_active: p.is_active ? 0 : 1 }); fetch(); } catch { } };
  const handleDelete = async (id: number) => { if (!confirm('确定删除？')) return; try { await adminApi.deletePreset(id); fetch(); } catch { } };
  const animTypes = ['default','sunrise','mountain','flow','starry','sakura','forest'];

  if (loading) return <div className="p-6"><div className="animate-pulse grid grid-cols-3 gap-4">{[1,2,3].map(i=><div key={i} className="h-40 bg-cream-200 rounded-xl" />)}</div></div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-cream-900">预设背景管理</h2>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-warm-500 text-white rounded-lg text-sm font-medium hover:bg-warm-600"><Plus size={16} /> 新增预设</button>
      </div>
      {presets.length === 0 ? <p className="text-center text-cream-400 py-16">暂无预设</p> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {presets.map(p => (
            <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`bg-white rounded-xl shadow-sm overflow-hidden ${!p.is_active ? 'opacity-50' : ''}`}>
              <div className="h-32 bg-cream-200 flex items-center justify-center">
                {p.image_url ? <SafeImg src={getMediaUrl(p.image_url)} alt={p.name} className="w-full h-full object-cover" /> : <span className="text-cream-400 text-sm">无图片</span>}
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-2"><span className="font-medium text-sm">{p.name}</span><span className="text-[11px] px-2 py-0.5 rounded-full bg-cream-100 text-cream-500">{p.animation_type}</span></div>
                <div className="flex items-center justify-between">
                  <button onClick={() => handleToggle(p)} className={`text-xs px-2 py-0.5 rounded ${p.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-cream-100 text-cream-400'}`}>{p.is_active ? '启用' : '禁用'}</button>
                  <div className="flex gap-1"><button onClick={() => openEdit(p)} className="p-1 text-cream-500 hover:text-warm-600"><Edit3 size={14} /></button><button onClick={() => handleDelete(p.id)} className="p-1 text-cream-500 hover:text-red-500"><Trash2 size={14} /></button></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4"><h3 className="font-semibold">{editing ? '编辑' : '新增'}预设</h3><button onClick={() => setShowModal(false)}><X size={18} /></button></div>
              <div className="space-y-3">
                <div><label className="text-xs text-cream-500 mb-1 block">名称</label><input value={name} onChange={e => setName(e.target.value)} maxLength={30} className="w-full px-3 py-2 border border-cream-200 rounded-lg text-sm" /></div>
                <div><label className="text-xs text-cream-500 mb-1 block">动画类型</label><select value={animType} onChange={e => setAnimType(e.target.value)} className="w-full px-3 py-2 border border-cream-200 rounded-lg text-sm">{animTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div><label className="text-xs text-cream-500 mb-1 block">排序</label><input type="number" value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value)||0)} className="w-full px-3 py-2 border border-cream-200 rounded-lg text-sm" /></div>
                <div><label className="text-xs text-cream-500 mb-1 block">图片</label><input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="text-sm" /></div>
              </div>
              {msg && <p className="text-sm text-red-500 mt-2">{msg}</p>}
              <div className="flex gap-3 mt-5"><button onClick={() => setShowModal(false)} className="flex-1 py-2 text-sm border border-cream-200 rounded-lg">取消</button><button onClick={handleSave} disabled={saving} className="flex-1 py-2 text-sm bg-warm-500 text-white rounded-lg hover:bg-warm-600 disabled:opacity-50">{saving ? <Loader2 size={14} className="animate-spin inline mr-1" /> : <Save size={14} className="inline mr-1" />}保存</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
