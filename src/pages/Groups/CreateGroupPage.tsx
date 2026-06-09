import { RemoteImage } from '../../components/RemoteImage';
import { CardDecoration } from '../../components/CardDecoration';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, X, Shield, Globe, Users } from 'lucide-react';
import { getFriends } from '../../api/contacts';
import { createGroup, createSystemGroup } from '../../api/groups';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';

interface Friend { id: number; nickname: string; avatar: string; }

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getAvatar = (a: string) => a?.startsWith('http') ? a : `${apiBase}${a}`;

export function CreateGroupPage() {
  const navigate = useNavigate();
  const goBack = useSmartBack('/contacts');
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'normal' | 'system'>('normal');
  const [systemMode, setSystemMode] = useState<'all' | 'selected'>('all');

  const isAdmin = user?.role === 'admin';
  const isSystem = tab === 'system';
  const showMemberPicker = !isSystem || systemMode === 'selected';

  const SYSTEM_BOT_ID = 9999;
  useEffect(() => {
    getFriends().then((res: any) => {
      const list: Friend[] = res.data ?? res;
      setFriends(list.filter(f => f.id !== SYSTEM_BOT_ID));
    });
  }, []);

  const filtered = useMemo(() =>
    search.trim() ? friends.filter(f => f.nickname.toLowerCase().includes(search.toLowerCase())) : friends,
    [friends, search]
  );

  const toggle = (id: number) =>
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleCreate = async () => {
    if (!groupName.trim()) return;
    if (!isSystem && selected.length < 1) return;
    setLoading(true);
    try {
      if (isSystem) {
        const res = await createSystemGroup(
          groupName.trim(),
          systemMode,
          systemMode === 'selected' ? selected : undefined
        );
        const groupId = res?.groupId ?? res?.id;
        navigate(`/messages/group/${groupId}`, { replace: true });
      } else {
        const res = await createGroup(groupName.trim(), selected);
        const groupId = res?.groupId ?? res?.id;
        navigate(`/messages/group/${groupId}`, { replace: true });
      }
    } catch { setLoading(false); }
  };

  const selectedFriends = friends.filter(f => selected.includes(f.id));
  const canCreate = isSystem
    ? groupName.trim().length > 0 && (systemMode === 'all' || selected.length > 0)
    : selected.length >= 1 && groupName.trim().length > 0;

  const btnText = loading
    ? '创建中...'
    : !isSystem
      ? `创建群聊${selected.length > 0 ? ` (${selected.length}人)` : ''}`
      : systemMode === 'all'
        ? '创建系统全员群'
        : `创建系统群聊 (${selected.length}人)`;

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col bg-cream-100"
        
      
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
    >
      {/* Header */}
      <header className="flex items-center gap-2 px-3 pt-[calc(var(--status-bar-height,0px)+10px)] pb-2.5 flex-shrink-0">
        <button onClick={goBack} className="p-2 rounded-lg text-cream-700 hover:bg-cream-200 transition-all">
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 text-[16px] font-semibold text-cream-900">创建群聊</h1>
      </header>

      {/* Tab Bar — admin only */}
      {isAdmin && (
        <div className="mx-4 mt-1 flex-shrink-0">
          <div className="flex rounded-xl p-1 relative" style={{ background: 'rgba(0,0,0,0.04)' }}>
            <button
              onClick={() => { setTab('normal'); setSystemMode('all'); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[13px] font-medium transition-colors relative z-10"
              style={{ color: tab === 'normal' ? '#6b5e4a' : '#b0a090' }}
            >
              <Users size={15} strokeWidth={2} />
              普通群聊
            </button>
            <button
              onClick={() => setTab('system')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[13px] font-medium transition-colors relative z-10"
              style={{ color: tab === 'system' ? '#5b21b6' : '#b0a090' }}
            >
              <Shield size={15} strokeWidth={2.5} />
              系统群聊
            </button>
            {/* sliding bg pill */}
            <div
              className="absolute top-1 bottom-1 rounded-lg bg-white transition-all duration-300 z-0"
              style={{
                left: tab === 'normal' ? '4px' : 'calc(50%)',
                width: 'calc(50% - 4px)',
                boxShadow: tab === 'system'
                  ? '0 2px 8px rgba(139,92,246,0.12)'
                  : '0 2px 8px rgba(0,0,0,0.06)',
              }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0 pb-6">
        {/* System config cards */}
        {isSystem && (
          <div className="mx-4 mt-3">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Shield size={13} color="#7c3aed" strokeWidth={2.5} />
              <span className="text-[11px] font-medium text-violet-600/70 tracking-wide">系统群聊成员不可自行退出</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setSystemMode('all')}
                className="rounded-xl p-3 text-left transition-all relative"
                style={{
                  background: systemMode === 'all' ? 'rgba(139, 92, 246, 0.06)' : 'white',
                  border: systemMode === 'all' ? '1.5px solid rgba(139, 92, 246, 0.4)' : '1.5px solid rgba(0,0,0,0.06)',
                  boxShadow: systemMode === 'all' ? '0 4px 16px rgba(139,92,246,0.1)' : 'none',
                }}
              >
                {systemMode === 'all' && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
                <Globe size={20} color={systemMode === 'all' ? '#7c3aed' : '#c0b0a0'} strokeWidth={1.8} />
                <div className="mt-1.5 text-[13px] font-semibold" style={{ color: systemMode === 'all' ? '#5b21b6' : '#6b5e4a' }}>全员群</div>
                <div className="mt-0.5 text-[10px] leading-relaxed" style={{ color: systemMode === 'all' ? 'rgba(139,92,246,0.6)' : '#c0b0a0' }}>所有用户自动加入，不可退出</div>
              </button>
              <button
                onClick={() => setSystemMode('selected')}
                className="rounded-xl p-3 text-left transition-all relative"
                style={{
                  background: systemMode === 'selected' ? 'rgba(99, 102, 241, 0.06)' : 'white',
                  border: systemMode === 'selected' ? '1.5px solid rgba(99, 102, 241, 0.4)' : '1.5px solid rgba(0,0,0,0.06)',
                  boxShadow: systemMode === 'selected' ? '0 4px 16px rgba(99,102,241,0.1)' : 'none',
                }}
              >
                {systemMode === 'selected' && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
                <Users size={20} color={systemMode === 'selected' ? '#6366f1' : '#c0b0a0'} strokeWidth={1.8} />
                <div className="mt-1.5 text-[13px] font-semibold" style={{ color: systemMode === 'selected' ? '#4338ca' : '#6b5e4a' }}>指定用户</div>
                <div className="mt-0.5 text-[10px] leading-relaxed" style={{ color: systemMode === 'selected' ? 'rgba(99,102,241,0.6)' : '#c0b0a0' }}>仅指定用户加入，不可退出</div>
              </button>
            </div>
          </div>
        )}

        {/* Preview Card */}
        <div
          className="mx-4 mt-4 relative rounded-2xl shadow-md"
          style={{
            background: isSystem
              ? 'linear-gradient(135deg, #f8f5ff 0%, #ede4ff 30%, #e0d5f5 60%, #f5f0ff 100%)'
              : 'linear-gradient(135deg, #fef9f0 0%, #fdf3e0 30%, #fef0d5 60%, #fff8ed 100%)',
          }}
        >
          <CardDecoration pattern="dots" color={isSystem ? '#a855f7' : '#d4a574'} />
          {/* system badge */}
          {isSystem && (
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(139, 92, 246, 0.12)' }}>
              <Shield size={11} color="#7c3aed" strokeWidth={2.5} />
              <span className="text-[10px] font-semibold text-violet-700">系统群</span>
            </div>
          )}
          <div className="relative z-10 p-5 text-center">
            <div className="flex justify-center gap-1.5 mb-3">
              {selectedFriends.length > 0 ? (
                <>
                  {selectedFriends.slice(0, 5).map(f => (
                    <RemoteImage key={f.id} src={getAvatar(f.avatar)} alt={f.nickname}
                      className="w-9 h-9 rounded-xl object-cover bg-white/60 shadow-sm" />
                  ))}
                  {selectedFriends.length > 5 && (
                    <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center text-xs font-bold" style={{ color: isSystem ? '#7c3aed' : '#a855f7' }}>
                      +{selectedFriends.length - 5}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-9 h-9 rounded-xl bg-white/40" />
                  ))}
                </div>
              )}
            </div>
            <input
              type="text" value={groupName} onChange={e => setGroupName(e.target.value)}
              placeholder="输入群聊名称..."
              maxLength={20}
              className="w-full py-2 text-center text-[16px] font-bold bg-white/60 rounded-xl outline-none transition-all focus:bg-white/80"
              style={{ color: isSystem ? '#5b21b6' : '#6b5e4a', caretColor: isSystem ? '#7c3aed' : '#d4a574' }}
            />
            <div className="mt-1 text-[10px] text-cream-400 text-right">{groupName.length}/20</div>
            <div className="mt-2 text-[11px] font-medium" style={{ color: isSystem ? 'rgba(139,92,246,0.6)' : '#a855f7' }}>
              {selected.length > 0
                ? `${selected.length} 位成员`
                : isSystem && systemMode === 'all'
                  ? '所有用户'
                  : '选择成员加入群聊'}
            </div>
          </div>
        </div>

        {/* Friend picker */}
        {showMemberPicker && (
          <div className="mt-4">
            <div className="flex items-center justify-between px-4 mb-3">
              <div className="flex items-center gap-2">
                <span className="block w-[3px] h-4 rounded-sm" style={{ background: isSystem ? 'linear-gradient(to bottom, #7c3aed, #6366f1)' : 'linear-gradient(to bottom, #a855f7, #8b5cf6)' }} />
                <span className="text-[14px] font-semibold text-cream-900">选择成员</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm">
                <Search size={13} className="text-cream-400" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="搜索好友"
                  className="w-24 text-xs text-cream-900 placeholder:text-cream-400 bg-transparent outline-none"
                />
                {search && (
                  <button onClick={() => setSearch('')}>
                    <X size={12} className="text-cream-400" />
                  </button>
                )}
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-cream-400">
                <p className="text-sm">{search ? '未找到匹配好友' : '暂无好友'}</p>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto px-4 py-2 scrollbar-hide">
                {filtered.map(friend => {
                  const isSelected = selected.includes(friend.id);
                  return (
                    <button
                      key={friend.id}
                      onClick={() => toggle(friend.id)}
                      className={`flex flex-col items-center gap-1.5 flex-shrink-0 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 transition-all ${
                        isSelected ? 'scale-105' : 'opacity-70 hover:opacity-90'
                      }`}
                      style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
                    >
                      <div className={`relative w-[54px] h-[54px] rounded-2xl transition-all duration-200 ${
                        isSelected ? 'scale-105 shadow-lg' : ''
                      }`} style={{ boxShadow: isSelected ? (isSystem ? '0 4px 12px rgba(139,92,246,0.2)' : '0 4px 12px rgba(168,85,247,0.2)') : 'none' }}>
                        <RemoteImage src={getAvatar(friend.avatar)} alt={friend.nickname}
                          className="w-full h-full rounded-2xl object-cover" />
                        {isSelected && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-cream-100 flex items-center justify-center shadow-sm"
                            style={{ background: isSystem ? '#7c3aed' : '#a855f7' }}>
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        )}
                      </div>
                      <span className={`text-[10px] font-medium truncate max-w-[54px] ${
                        isSelected ? 'text-violet-700' : 'text-cream-600'
                      }`}>
                        {friend.nickname}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create button */}
      <div className="px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] flex-shrink-0">
        <button
          onClick={handleCreate}
          disabled={!canCreate || loading}
          className="w-full py-3.5 rounded-2xl text-white text-[15px] font-semibold transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
          style={{
            background: canCreate
              ? (isSystem
                  ? 'linear-gradient(135deg, #7c3aed, #6366f1)'
                  : 'linear-gradient(135deg, #8b5cf6, #7c3aed)')
              : '#e8ddd0',
            boxShadow: canCreate
              ? (isSystem
                  ? '0 4px 20px rgba(124,58,237,0.35)'
                  : '0 4px 20px rgba(139,92,246,0.35)')
              : 'none',
          }}
        >
          {isSystem && <Shield size={17} strokeWidth={2.5} />}
          {btnText}
        </button>
      </div>
    </motion.div>
  );
}
