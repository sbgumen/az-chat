import { useState, useEffect } from 'react';
import { Save, Loader2, Star, Moon, Sun, Crown, TrendingUp } from 'lucide-react';
import { adminApi } from '../../api/admin';

type Tab = 'config' | 'rules' | 'dist';

export function AdminLevelPage() {
  const [tab, setTab] = useState<Tab>('config');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [expCfg, setExpCfg] = useState<Record<string, number>>({});
  const expFields = [
    { key: 'exp_signin', label: '签到', daily: false },
    { key: 'exp_message', label: '发消息(私聊+群聊)', daily: true, dailyKey: 'exp_message_daily_limit' },
    { key: 'exp_moment', label: '发动态', daily: false },
    { key: 'exp_comment', label: '发评论', daily: false },
    { key: 'exp_follow', label: '关注他人', daily: false },
    { key: 'exp_add_friend', label: '加好友', daily: false },
  ];

  const [rules, setRules] = useState<any[]>([]);
  const [editRule, setEditRule] = useState<any>(null);
  const [distData, setDistData] = useState<{ range: string; count: number }[]>([]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [cfgRes, rulesRes] = await Promise.all([adminApi.getLevelConfig() as any, adminApi.getLevelRules() as any]);
      if (cfgRes.code === 0 && cfgRes.data) { const c: any = {}; Object.entries(cfgRes.data).forEach(([k, v]) => { c[k] = parseInt(v as string) || 0; }); setExpCfg(c); }
      if (rulesRes.code === 0) setRules(rulesRes.data || []);
      if (rulesRes.code === 0 && rulesRes.data?.length) {
        const g: Record<string, number> = {};
        rulesRes.data.forEach((r: any) => { const s = r.level <= 10 ? '1-10' : r.level <= 20 ? '11-20' : r.level <= 30 ? '21-30' : r.level <= 50 ? '31-50' : '51-99'; g[s] = (g[s] || 0) + 1; });
        setDistData(Object.entries(g).map(([range, count]) => ({ range, count })));
      }
    } catch { }
    setLoading(false);
  };
  useEffect(() => { loadAll(); }, []);

  const updateCfgToggle = (key: string) => setExpCfg({ ...expCfg, [key + '_enabled']: expCfg[key + '_enabled'] ? 0 : 1 });
  const updateCfg = (key: string, val: number) => setExpCfg({ ...expCfg, [key]: Math.max(0, Math.min(999, val)) });

  const saveConfig = async () => { setSaving(true); setMsg(''); try { const p: any = {}; Object.entries(expCfg).forEach(([k, v]) => { p[k] = String(v); }); const res: any = await adminApi.updateLevelConfig(p); if (res.code === 0) { setMsg('保存成功'); loadAll(); } else { setMsg(res.message || '失败'); } } catch { setMsg('网络错误'); } setSaving(false); };
  const saveRule = async () => { if (!editRule) return; setSaving(true); setMsg(''); try { const res: any = await adminApi.updateLevelRule(editRule.level, { name: editRule.name, exp_required: Number(editRule.exp_required), coin_reward: Number(editRule.coin_reward) }); if (res.code === 0) { setEditRule(null); loadAll(); } else { setMsg(res.message || '失败'); } } catch { setMsg('网络错误'); } setSaving(false); };
  const batchFill = async () => { setSaving(true); setMsg(''); try { const res: any = await adminApi.batchFillLevelRules({ exp_required: 100, coin_reward: 2 }); if (res.code === 0) { loadAll(); setMsg('批量填充成功'); } else { setMsg(res.message || '失败'); } } catch { setMsg('网络错误'); } setSaving(false); };

  if (loading) return <div className="p-6"><div className="animate-pulse space-y-4"><div className="h-12 bg-cream-200 rounded-lg w-64" /><div className="h-96 bg-cream-200 rounded-xl" /></div></div>;
  const tabs: { key: Tab; label: string }[] = [{ key: 'config', label: '经验值配置' }, { key: 'rules', label: '等级规则表' }, { key: 'dist', label: '等级分布' }];

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h2 className="text-lg font-semibold text-cream-900">等级管理</h2>
      <div className="flex gap-1 bg-cream-200 rounded-xl p-1 w-fit">
        {tabs.map(t => <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${tab === t.key ? 'bg-white text-warm-600 shadow-sm' : 'text-cream-500'}`}>{t.label}</button>)}
      </div>
      {tab === 'config' && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-cream-500 border-b border-cream-100"><th className="pb-2 font-medium">行为</th><th className="pb-2 font-medium w-16 text-center">启用</th><th className="pb-2 font-medium w-24 text-center">经验值</th><th className="pb-2 font-medium w-24 text-center">每日上限</th></tr></thead>
              <tbody>{expFields.map(f => (
                <tr key={f.key} className="border-b border-cream-50">
                  <td className="py-2.5 text-cream-800">{f.label}</td>
                  <td className="py-2.5 text-center">
                    <button onClick={() => updateCfgToggle(f.key)} className={`w-10 h-5 rounded-full transition-colors ${expCfg[f.key + '_enabled'] ? 'bg-warm-500' : 'bg-cream-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${expCfg[f.key + '_enabled'] ? 'translate-x-5' : 'translate-x-0.5'}`} /></button>
                  </td>
                  <td className="py-2.5"><input type="number" value={expCfg[f.key] || 0} onChange={e => updateCfg(f.key, parseInt(e.target.value) || 0)} className="w-20 px-2 py-1 border border-cream-200 rounded-lg text-center text-sm" /></td>
                  <td className="py-2.5">{f.daily ? <input type="number" value={expCfg[f.dailyKey!] || 0} onChange={e => updateCfg(f.dailyKey!, parseInt(e.target.value) || 0)} className="w-20 px-2 py-1 border border-cream-200 rounded-lg text-center text-sm" /> : <span className="text-cream-300">—</span>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <button onClick={saveConfig} disabled={saving} className="mt-4 flex items-center gap-2 px-5 py-2 bg-warm-500 text-white rounded-lg text-sm font-medium hover:bg-warm-600 disabled:opacity-50">{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 保存配置</button>
        </div>
      )}
      {tab === 'rules' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-amber-50 to-indigo-50 rounded-xl p-4 border border-amber-100">
            <h3 className="text-sm font-medium text-cream-800 mb-2">QQ 四级体系换算</h3>
            <div className="flex flex-wrap items-center gap-3 text-sm text-cream-600">
              <span className="flex items-center gap-1"><Star size={14} fill="#fbbf24" className="text-amber-500" />星星=1级</span><span className="text-cream-300">→</span>
              <span className="flex items-center gap-1">3星→<Moon size={14} fill="#818cf8" className="text-indigo-500" />月亮=3级</span><span className="text-cream-300">→</span>
              <span className="flex items-center gap-1">3月→<Sun size={14} fill="#f97316" className="text-orange-500" />太阳=9级</span><span className="text-cream-300">→</span>
              <span className="flex items-center gap-1">3日→<Crown size={14} fill="#eab308" className="text-yellow-600" />皇冠=27级</span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 border-b border-cream-100"><span className="text-sm font-medium text-cream-800">等级规则 (共 {rules.length} 级)</span><button onClick={batchFill} className="text-xs px-3 py-1.5 bg-cream-100 rounded-lg text-cream-600 hover:bg-cream-200">批量填充默认值</button></div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm"><thead className="sticky top-0 bg-cream-50"><tr className="text-left text-cream-500"><th className="px-4 py-2 w-16">等级</th><th className="px-4 py-2">名称</th><th className="px-4 py-2 w-24">所需经验</th><th className="px-4 py-2 w-24">奖励金币</th><th className="px-4 py-2 w-16"></th></tr></thead>
                <tbody>{rules.slice(0, 99).map((r: any) => (<tr key={r.level} className="border-b border-cream-50 hover:bg-cream-50"><td className="px-4 py-1.5 font-mono text-xs">{r.level}</td><td className="px-4 py-1.5">{r.name || '-'}</td><td className="px-4 py-1.5">{r.exp_required}</td><td className="px-4 py-1.5">{r.coin_reward}</td><td className="px-4 py-1.5"><button onClick={() => setEditRule({ ...r })} className="text-xs text-warm-500 hover:underline">编辑</button></td></tr>))}</tbody>
              </table>
            </div>
          </div>
          {editRule && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setEditRule(null)}>
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}><h3 className="font-semibold mb-4">编辑 Lv{editRule.level} 等级规则</h3>
                <div className="space-y-3">
                  <div><label className="text-xs text-cream-500">名称</label><input value={editRule.name || ''} onChange={e => setEditRule({...editRule, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm mt-1" /></div>
                  <div><label className="text-xs text-cream-500">所需经验</label><input type="number" value={editRule.exp_required || 100} onChange={e => setEditRule({...editRule, exp_required: parseInt(e.target.value)||0})} className="w-full px-3 py-2 border rounded-lg text-sm mt-1" /></div>
                  <div><label className="text-xs text-cream-500">奖励金币</label><input type="number" value={editRule.coin_reward || 2} onChange={e => setEditRule({...editRule, coin_reward: parseInt(e.target.value)||0})} className="w-full px-3 py-2 border rounded-lg text-sm mt-1" /></div>
                </div>
                <div className="flex gap-3 mt-5"><button onClick={()=>setEditRule(null)} className="flex-1 py-2 border rounded-lg text-sm">取消</button><button onClick={saveRule} disabled={saving} className="flex-1 py-2 bg-warm-500 text-white rounded-lg text-sm">{saving?<Loader2 size={14} className="animate-spin inline mr-1"/>:'保存'}</button></div>
              </div>
            </div>
          )}
        </div>
      )}
      {tab === 'dist' && (
        <div className="bg-white rounded-xl shadow-sm p-6"><h3 className="text-sm font-medium text-cream-800 mb-4 flex items-center gap-2"><TrendingUp size={16} /> 等级分布</h3><div className="space-y-3">{distData.map(d => (<div key={d.range} className="flex items-center gap-3"><span className="text-xs text-cream-500 w-14">{d.range}级</span><div className="flex-1 h-6 bg-cream-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-warm-400 to-warm-500 rounded-full" style={{ width: `${Math.min(100, (d.count / Math.max(1, rules.length)) * 100)}%` }} /></div><span className="text-xs text-cream-600 w-8 text-right">{d.count}</span></div>))}</div></div>
      )}
      {msg && <p className={`text-sm text-center ${msg.includes('成功') ? 'text-emerald-600' : 'text-red-500'}`}>{msg}</p>}
    </div>
  );
}
