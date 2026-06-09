import { RemoteImage } from '../../components/RemoteImage';
import { CardDecoration } from '../../components/CardDecoration';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Shield, Users } from 'lucide-react';
import { getMyGroups } from '../../api/groups';
import { useNavigate } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';
import { useAuth } from '../../context/AuthContext';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getAvatar = (a: string) => a?.startsWith('http') ? a : `${apiBase}${a}`;

export function MyGroupsPage() {
  const navigate = useNavigate();
  const goBack = useSmartBack('/contacts');
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyGroups().then((res: any) => {
      if (res.code === 0) setGroups(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const created = groups.filter(g => g.owner_id === user?.id);
  const managed = groups.filter(g => g.role === 'admin' && g.owner_id !== user?.id);
  const joined = groups.filter(g => g.role === 'member');

  const enterGroup = (g: any) => {
    navigate(`/messages/group/${g.id}`, {
      state: { groupName: g.name, groupAvatar: g.avatar, memberCount: g.member_count }
    });
  };

  const colors = [
    'from-amber-100 to-amber-200 text-amber-800',
    'from-blue-100 to-blue-200 text-blue-800',
    'from-purple-100 to-purple-200 text-purple-800',
    'from-emerald-100 to-emerald-200 text-emerald-800',
    'from-rose-100 to-rose-200 text-rose-800',
    'from-cyan-100 to-cyan-200 text-cyan-800',
    'from-orange-100 to-orange-200 text-orange-800',
    'from-indigo-100 to-indigo-200 text-indigo-800',
  ];
  const cardColor = (i: number) => colors[i % colors.length];

  return (
    <motion.div className="fixed inset-0 z-[200] flex flex-col bg-cream-100"
      
      
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
      {/* Header */}
      <header className="flex items-center gap-2 px-3 pt-[calc(var(--status-bar-height,0px)+10px)] pb-2.5 flex-shrink-0">
        <button className="p-2 rounded-lg text-cream-700 hover:bg-cream-200 transition-all" onClick={goBack}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 text-[16px] font-semibold text-cream-900">我的群聊</h1>
        <span className="text-xs text-cream-500">{groups.length} 个群</span>
      </header>

      <div className="flex-1 overflow-y-auto min-h-0 pb-6">
        {loading ? (
          <div className="flex flex-col gap-3 px-4 pt-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-cream-200 animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-cream-500">
            <Users size={40} className="text-cream-300 mb-3" />
            <p className="text-sm">暂无群聊</p>
            <p className="text-xs mt-1">去创建一个群聊吧</p>
          </div>
        ) : (
          <>
            {/* 我创建的 — 横滑大卡片 */}
            {created.length > 0 && (
              <div className="pt-3 pb-2">
                <div className="flex items-center gap-2 px-4 mb-3">
                  <span className="block w-[3px] h-4 rounded-sm bg-gradient-to-b from-warm-500 to-warm-600" />
                  <span className="text-[14px] font-semibold text-cream-900">我创建的</span>
                  <span className="text-[11px] text-cream-500">{created.length}</span>
                </div>
                <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
                  {created.map((g, i) => (
                    <button
                      key={g.id}
                      className={`min-w-[190px] p-4 rounded-2xl bg-gradient-to-br ${cardColor(i)} shadow-sm active:scale-[0.98] transition-transform text-left flex-shrink-0 relative overflow-hidden`}
                      onClick={() => enterGroup(g)}>
                      <CardDecoration pattern="circles" color="#f59e0b" />
                      <RemoteImage
                        src={getAvatar(g.avatar || '')}
                        alt={g.name}
                        className="w-11 h-11 rounded-xl object-cover bg-white/60 mb-3"
                      />
                      <div className="text-[15px] font-bold truncate">{g.name}</div>
                      <div className="flex items-center gap-2 mt-2 text-[11px] opacity-70">
                        <Users size={11} />
                        <span>{g.member_count} 人</span>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <Crown size={11} className="text-amber-500" />
                        <span className="text-[10px] font-semibold text-amber-600">群主</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 我管理的 — 横滑中卡片 */}
            {managed.length > 0 && (
              <div className="pt-2 pb-2">
                <div className="flex items-center gap-2 px-4 mb-3">
                  <span className="block w-[3px] h-4 rounded-sm bg-gradient-to-b from-blue-400 to-blue-500" />
                  <span className="text-[14px] font-semibold text-cream-900">我管理的</span>
                  <span className="text-[11px] text-cream-500">{managed.length}</span>
                </div>
                <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
                  {managed.map((g, i) => (
                    <button
                      key={g.id}
                      className={`min-w-[150px] p-3.5 rounded-2xl bg-gradient-to-br ${cardColor(i)} shadow-sm active:scale-[0.98] transition-transform text-left flex-shrink-0 relative overflow-hidden`}
                      onClick={() => enterGroup(g)}
                    >
                      <CardDecoration pattern="waves" color="#6366f1" />
                      <RemoteImage
                        src={getAvatar(g.avatar || '')}
                        alt={g.name}
                        className="w-10 h-10 rounded-xl object-cover bg-white/60 mb-2.5"
                      />
                      <div className="text-[14px] font-bold truncate">{g.name}</div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Users size={11} className="opacity-60" />
                        <span className="text-[11px] opacity-70">{g.member_count} 人</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Shield size={11} className="text-blue-500" />
                        <span className="text-[10px] font-semibold text-blue-600">管理员</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 我加入的 — 竖列表 */}
            {joined.length > 0 && (
              <div className="pt-2 pb-4">
                <div className="flex items-center gap-2 px-4 mb-3">
                  <span className="block w-[3px] h-4 rounded-sm bg-gradient-to-b from-cream-400 to-cream-500" />
                  <span className="text-[14px] font-semibold text-cream-900">我加入的</span>
                  <span className="text-[11px] text-cream-500">{joined.length}</span>
                </div>
                <div className="mx-4 bg-white rounded-2xl shadow-sm overflow-hidden">
                  {joined.map((g, i) => (
                    <motion.button
                      key={g.id}
                      className="w-full flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 border-b border-cream-100 last:border-0 hover:bg-cream-50 active:bg-cream-100 transition-colors text-left"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => enterGroup(g)}
                    >
                      <RemoteImage
                        src={getAvatar(g.avatar || '')}
                        alt={g.name}
                        className={`w-10 h-10 rounded-xl object-cover flex-shrink-0 bg-gradient-to-br ${cardColor(i)}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-cream-900 truncate">{g.name}</div>
                        <div className="flex items-center gap-1 text-[11px] text-cream-500 mt-0.5">
                          <Users size={10} />
                          <span>{g.member_count} 人</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-cream-100 text-[10px] text-cream-600 font-medium">成员</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
