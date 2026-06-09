import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, TrendingUp, Gift, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { adminApi } from '../../api/admin';

export function AdminSigninPage() {
  const [stats, setStats] = useState<any>(null);
  const [config, setConfig] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [sRes, cRes] = await Promise.all([
          adminApi.getSigninStats() as any,
          adminApi.getSigninConfig() as any,
        ]);
        if (sRes.code === 0) setStats(sRes.data);
        if (cRes.code === 0) setConfig(cRes.data || []);
      } catch { setMsg('加载失败'); }
      setLoading(false);
    })();
  }, []);

  const addRow = () => setConfig([...config, { streak_days: 0, bonus_coins: 0 }]);
  const removeRow = (i: number) => setConfig(config.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: string, val: number) => {
    setConfig(config.map((r, idx) => idx === i ? { ...r, [field]: Math.max(0, Math.min(365, val)) } : r));
  };

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      const res: any = await adminApi.updateSigninConfig(config);
      setMsg(res.code === 0 ? '保存成功' : res.message || '保存失败');
    } catch { setMsg('网络错误'); }
    setSaving(false);
  };

  if (loading) return <div className="p-6"><div className="animate-pulse space-y-4"><div className="h-24 bg-cream-200 rounded-xl" /><div className="h-48 bg-cream-200 rounded-xl" /></div></div>;

  const statCards = [
    { label: '今日签到', value: stats?.today || 0, icon: CalendarCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '昨日签到', value: stats?.yesterday || 0, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '本周签到', value: stats?.week || 0, icon: Gift, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h2 className="text-lg font-semibold text-cream-900">签到管理</h2>
      <div className="grid grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className={`${bg} rounded-xl p-4 flex flex-col items-center gap-2`}>
            <Icon size={24} className={color} />
            <span className="text-2xl font-bold text-cream-900">{value}</span>
            <span className="text-xs text-cream-500">{label}</span>
          </motion.div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-cream-800">连续签到奖励配置</h3>
          <button onClick={addRow} className="flex items-center gap-1 text-sm text-warm-600 hover:text-warm-700"><Plus size={14} /> 添加规则</button>
        </div>
        {config.length === 0 ? (
          <p className="text-sm text-cream-400 text-center py-8">暂无规则</p>
        ) : (
          <div className="space-y-2">
            {config.map((r, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-cream-500 w-12">连续</span>
                <input type="number" value={r.streak_days} onChange={e => updateRow(i, 'streak_days', parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1.5 border border-cream-200 rounded-lg text-center text-sm" />
                <span className="text-cream-500">天→</span>
                <input type="number" value={r.bonus_coins} onChange={e => updateRow(i, 'bonus_coins', parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1.5 border border-cream-200 rounded-lg text-center text-sm" />
                <span className="text-cream-500">金币</span>
                <button onClick={() => removeRow(i)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
        <button onClick={handleSave} disabled={saving}
          className="mt-4 flex items-center gap-2 px-5 py-2 bg-warm-500 text-white rounded-lg text-sm font-medium hover:bg-warm-600 disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 保存配置
        </button>
      </div>
      {msg && <p className={`text-sm text-center ${msg.includes('成功') ? 'text-emerald-600' : 'text-red-500'}`}>{msg}</p>}
    </div>
  );
}
