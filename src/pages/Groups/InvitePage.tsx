import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';
import { motion } from 'framer-motion';
import { RemoteImage } from '../../components/RemoteImage';
import { ChevronLeft, Search, Check } from 'lucide-react';
import { getFriends } from '../../api/contacts';
import { getGroupDetail, inviteMembers } from '../../api/groups';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getUrl = (u: string) => u?.startsWith('http') ? u : `${apiBase}${u}`;

interface Friend { id: number; nickname: string; avatar: string; }

export function InvitePage() {
  const { groupId } = useParams<{ groupId: string }>();
  const gid = parseInt(groupId || '0');
  const goBack = useSmartBack(`/messages/group/${groupId}`);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [existingIds, setExistingIds] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [fRes, gRes]: any[] = await Promise.all([getFriends(), getGroupDetail(gid)]);
        if (fRes.code === 0 && Array.isArray(fRes.data)) {
          const filtered = fRes.data.filter((f: any) => f.id !== 9999);
          setFriends(filtered);
        }
        if ((gRes.code === 0 || gRes.data) && (gRes.data?.members || gRes.data?.data?.members)) {
          const members = (gRes.data?.members || gRes.data?.data?.members || []).map((m: any) => m.id);
          setExistingIds(new Set(members));
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [gid]);

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleInvite = async () => {
    if (selected.size === 0 || inviting) return;
    setInviting(true);
    try {
      await inviteMembers(gid, Array.from(selected));
      goBack();
    } catch { /* ignore */ }
    setInviting(false);
  };

  const filtered = friends.filter(f => {
    if (existingIds.has(f.id)) return false;
    if (query.trim() && !f.nickname.includes(query.trim()) && !String(f.id).includes(query.trim())) return false;
    return true;
  });

  return (
    <motion.div className="fixed inset-0 z-[250] flex flex-col overflow-hidden"
      style={{ background: '#f5f0eb' }}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}>

      {/* Header with confirm */}
      <div className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)' }}>
        <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-200">
          <ChevronLeft size={22} className="text-cream-800" /></button>
        <div className="flex-1"><span className="font-display text-lg font-semibold text-cream-900">邀请好友</span></div>
        <button onClick={handleInvite} disabled={selected.size === 0 || inviting}
          className="px-4 py-2 rounded-full text-[13px] font-semibold text-white disabled:opacity-50 transition-all"
          style={{ background: '#d4a574', boxShadow: '0 2px 10px rgba(212,165,116,0.35)' }}>
          {inviting ? '邀请中...' : `确定 (${selected.size})`}
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pt-2 pb-3" style={{ background: 'rgba(255,255,255,0.6)' }}>
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(0,0,0,0.04)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)' }}>
          <Search size={14} className="text-cream-400 flex-shrink-0" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="搜索好友..." className="flex-1 bg-transparent text-[13px] text-cream-900 outline-none" />
        </div>
      </div>

      {/* Selected strip */}
      {selected.size > 0 && (
        <div className="flex gap-2 px-4 py-2.5 overflow-x-auto"
          style={{ background: 'rgba(255,255,255,0.3)' }}>
          {Array.from(selected).map(id => {
            const f = friends.find(x => x.id === id);
            if (!f) return null;
            return (
              <div key={id} className="relative flex-shrink-0">
                <RemoteImage src={getUrl(f.avatar)} alt="" className="w-9 h-9 rounded-full object-cover"
                  style={{ background: 'rgba(0,0,0,0.06)' }} />
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: '#d4a574' }}>
                  <Check size={8} className="text-white" /></div>
              </div>
            );
          })}
        </div>
      )}

      {/* Friend list */}
      <div className="flex-1 overflow-y-auto px-3">
        {loading ? (
          <div className="py-8 flex justify-center"><div className="w-6 h-6 rounded-full border-2 border-warm-400 border-t-transparent animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-cream-400 text-sm">没有可邀请的好友</div>
        ) : (
          <div className="flex flex-col gap-0.5 py-2">
            {filtered.map((f, i) => {
              const isSel = selected.has(f.id);
              return (
                <motion.button key={f.id} onClick={() => toggleSelect(f.id)}
                  className="flex items-center gap-3 w-full p-3 rounded-2xl text-left"
                  style={{ background: isSel ? 'rgba(212,165,116,0.06)' : 'transparent' }}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <RemoteImage src={getUrl(f.avatar)} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                    style={{ background: 'rgba(0,0,0,0.06)' }} />
                  <span className="flex-1 text-[14px] font-semibold text-cream-900">{f.nickname}</span>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: isSel ? '#d4a574' : 'transparent', boxShadow: isSel ? 'none' : 'inset 0 0 0 2px #d0c8b8' }}>
                    {isSel && <Check size={12} className="text-white" />}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default InvitePage;
