import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';
import { motion } from 'framer-motion';
import { RemoteImage } from '../../components/RemoteImage';
import { ChevronLeft, Plus, Search } from 'lucide-react';
import { getGroupDetail } from '../../api/groups';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getUrl = (u: string) => u?.startsWith('http') ? u : `${apiBase}${u}`;

interface MemberInfo {
  id: number; nickname: string; avatar: string; role: 'owner' | 'admin' | 'member'; level: number;
}

const ROLE_WEIGHT: Record<string, number> = { owner: 0, admin: 1, member: 2 };

export function MemberListPage() {
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const gid = parseInt(groupId || '0');
  const goBack = useSmartBack(`/messages/group/${groupId}`);

  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [myRole, setMyRole] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await getGroupDetail(gid);
        if (res.code === 0 || res.data) {
          const data = res.data || res;
          const m: MemberInfo[] = data.members || [];
          const me = m.find(x => x.id === (JSON.parse(localStorage.getItem('az_user') || '{}').id || 0));
          if (me) setMyRole(me.role);
          // Sort: owner first, admins, then members A-Z
          m.sort((a, b) => {
            const w = ROLE_WEIGHT[a.role] - ROLE_WEIGHT[b.role];
            if (w !== 0) return w;
            return (a.nickname || '').localeCompare(b.nickname || '', 'zh');
          });
          setMembers(m);
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [gid]);

  const filtered = members.filter(m => {
    if (filterRole !== 'all' && m.role !== filterRole) return false;
    if (query.trim() && !m.nickname.includes(query.trim()) && !String(m.id).includes(query.trim())) return false;
    return true;
  });

  const isAdmin = myRole === 'admin' || myRole === 'owner';

  const handleClick = (m: MemberInfo) => {
    const me = members.find(x => x.id === (JSON.parse(localStorage.getItem('az_user') || '{}').id || 0));
    if (me && m.id === me.id) return; // can't manage self
    if (isAdmin && m.role !== 'owner') {
      navigate(`/messages/group/${gid}/member/${m.id}`);
    } else {
      navigate(`/user/${m.id}`);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-[250] flex flex-col overflow-hidden"
      style={{ background: '#f5f0eb' }}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}>

      <div className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)' }}>
        <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-200">
          <ChevronLeft size={22} className="text-cream-800" /></button>
        <div className="flex-1"><span className="font-display text-lg font-semibold text-cream-900">群成员</span><span className="text-[12px] text-cream-500 ml-2">{members.length}人</span></div>
        <button onClick={() => navigate(`/messages/group/${gid}/invite`)}
          className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(212,165,116,0.12)' }}>
          <Plus size={16} style={{ color: '#d4a574' }} /></button>
      </div>

      {/* Search + filter */}
      <div className="px-4 pt-2 pb-3" style={{ background: 'rgba(255,255,255,0.6)' }}>
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-2.5"
          style={{ background: 'rgba(0,0,0,0.04)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)' }}>
          <Search size={14} className="text-cream-400 flex-shrink-0" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="搜索成员昵称或ID" className="flex-1 bg-transparent text-[13px] text-cream-900 outline-none" />
        </div>
        <div className="flex gap-2">
          {['all', 'owner', 'admin', 'member'].map(r => {
            const labels: Record<string, string> = { all: '全部', owner: '群主', admin: '管理员', member: '成员' };
            const count = r === 'all' ? members.length : members.filter(m => m.role === r).length;
            return (
              <button key={r} onClick={() => setFilterRole(r)}
                className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all"
                style={{
                  background: filterRole === r ? '#d4a574' : 'rgba(0,0,0,0.04)',
                  color: filterRole === r ? 'white' : '#a09080',
                }}>
                {labels[r]} {count}
              </button>
            );
          })}
        </div>
      </div>

      {/* Member list */}
      <div className="flex-1 overflow-y-auto px-3">
        {loading ? (
          <div className="py-8 flex justify-center"><div className="w-6 h-6 rounded-full border-2 border-warm-400 border-t-transparent animate-spin" /></div>
        ) : (
          <div className="flex flex-col gap-0.5 py-2">
            {filtered.map((m, i) => {
              const isMe = m.id === (JSON.parse(localStorage.getItem('az_user') || '{}').id || 0);
              const roleBadge = m.role === 'owner'
                ? { color: '#b8860b', bg: 'rgba(251,191,36,0.12)', icon: 'crown' }
                : m.role === 'admin'
                  ? { color: '#6b8ba0', bg: 'rgba(107,139,160,0.12)', icon: 'star' }
                  : null;
              const canClick = isAdmin && !isMe && m.role !== 'owner';

              return (
                <motion.button key={m.id}
                  className="flex items-center gap-3 w-full p-3 rounded-2xl text-left transition-colors"
                  style={{ background: 'transparent' }}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => handleClick(m)}
                >
                  <div className="relative flex-shrink-0">
                    <RemoteImage src={getUrl(m.avatar)} alt="" className="w-11 h-11 rounded-full object-cover"
                      style={{ background: 'rgba(0,0,0,0.06)' }} />
                    {roleBadge && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: roleBadge.color, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                        {m.role === 'owner'
                          ? <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z"/></svg>
                          : <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-cream-900 truncate">{m.nickname}</span>
                      {roleBadge && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: roleBadge.bg, color: roleBadge.color }}>{m.role === 'owner' ? '群主' : '管理员'}</span>}
                      {isMe && <span className="text-[10px] text-cream-500">我</span>}
                    </div>
                    <span className="text-[11px] text-cream-500">LV.{m.level || 1} · ID: {m.id}</span>
                  </div>
                  {canClick && <ChevronLeft size={14} className="text-cream-400 rotate-180 flex-shrink-0" />}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default MemberListPage;
