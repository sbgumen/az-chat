import { RemoteImage } from '../../components/RemoteImage';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Search, UserPlus, X } from 'lucide-react';
import { searchUser, getRecommendUsers, getRecommendGroups } from '../../api/user';
import { searchGroup } from '../../api/groups';
import { sendFriendRequest, getFriends, getMyRequests } from '../../api/contacts';
import { useNavigate } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';
import { CardDecoration } from '../../components/CardDecoration';
import { UserProfilePage } from '../Profile/UserProfilePage';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getAvatar = (a: string) => a?.startsWith('http') ? a : `${apiBase}${a}`;

export function AddPage() {
  const navigate = useNavigate();
  const goBack = useSmartBack('/messages');
  const [keyword, setKeyword] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const [recommendUsers, setRecommendUsers] = useState<any[]>([]);
  const [recommendGroups, setRecommendGroups] = useState<any[]>([]);
  const [loadingRecommend, setLoadingRecommend] = useState(true);

  const [friendTarget, setFriendTarget] = useState<any>(null);
  const [friendMsg, setFriendMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [sentIds, setSentIds] = useState<Set<number>>(new Set());
  const [friendIds, setFriendIds] = useState<Set<number>>(new Set());

  const [viewUserId, setViewUserId] = useState<number | null>(null);

  const [toast, setToast] = useState('');
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    const load = async () => {
      try {
        const [uRes, gRes]: any[] = await Promise.all([
          getRecommendUsers().catch(() => ({ code: -1, data: [] })),
          getRecommendGroups().catch(() => ({ code: -1, data: [] })),
        ]);
        setRecommendUsers(uRes.code === 0 ? uRes.data || [] : []);
        setRecommendGroups(gRes.code === 0 ? gRes.data || [] : []);
      } catch { /* ignore */ }
      setLoadingRecommend(false);
    };
    load();
    // 加载好友列表和待处理申请
    Promise.all([
      getFriends().catch(() => ({ code: -1, data: [] })),
      getMyRequests().catch(() => ({ code: -1, data: [] })),
    ]).then(([fRes, rRes]: any[]) => {
      if (fRes.code === 0) setFriendIds(new Set((fRes.data || []).map((f: any) => f.friend_id || f.id)));
      if (rRes.code === 0) setSentIds(new Set((rRes.data || []).filter((r: any) => r.status === 0).map((r: any) => r.to_user_id)));
    });
  }, []);

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setSearching(true);
    setSearched(false);
    try {
      const [userRes, groupRes]: any[] = await Promise.all([
        searchUser(keyword.trim()).catch(() => ({ code: -1, data: [] })),
        searchGroup(keyword.trim()).catch(() => ({ code: -1, data: [] })),
      ]);
      setUsers(userRes.code === 0 ? userRes.data || [] : []);
      setGroups((groupRes.code === 0 ? groupRes.data || [] : []).filter((g: any) => !g.is_system));
    } catch { setUsers([]); setGroups([]); }
    setSearched(true);
    setSearching(false);
  };

  const handleAddFriend = async () => {
    if (sending) return;
    setSending(true);
    try {
      const res: any = await sendFriendRequest(friendTarget.id, friendMsg || '你好，我想加你为好友');
      if (res.code === 0) {
        setSentIds(prev => new Set(prev).add(friendTarget.id));
        setFriendTarget(null); setFriendMsg('');
        showToast('好友申请已发送');
      } else showToast(res.message || '发送失败');
    } catch { /* ignore */ }
    setSending(false);
  };

  const clearSearch = () => {
    setKeyword('');
    setUsers([]);
    setGroups([]);
    setSearched(false);
  };

  const colors = ['from-amber-100 to-amber-200','from-blue-100 to-blue-200','from-purple-100 to-purple-200','from-emerald-100 to-emerald-200','from-rose-100 to-rose-200','from-cyan-100 to-cyan-200'];
  const cardBg = (i: number) => colors[i % colors.length];
  const hasResults = users.length > 0 || groups.length > 0;
  const showRecommend = !searched && !searching;

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col bg-cream-100"
        
      
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3">
        <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-200 transition-colors">
          <ChevronLeft size={22} className="text-cream-800" />
        </button>
        <h1 className="font-display text-lg font-semibold text-cream-900">发现</h1>
      </div>

      {/* 搜索框 */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-2xl shadow-md transition-shadow focus-within:shadow-lg">
          <Search size={16} className="text-cream-400 flex-shrink-0" />
          <input
            type="text" value={keyword} onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="搜索用户ID或群聊名称..."
            className="flex-1 text-sm text-cream-900 placeholder:text-cream-400 bg-transparent outline-none"
            autoFocus
          />
          {keyword && (
            <button onClick={clearSearch} className="w-5 h-5 rounded-full bg-cream-200 flex items-center justify-center flex-shrink-0">
              <X size={12} className="text-cream-500" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pb-6">
        {searching && (
          <div className="flex items-center justify-center py-16 text-cream-400 text-sm">搜索中...</div>
        )}

        {/* 搜索无结果 */}
        {!searching && searched && !hasResults && (
          <div className="flex flex-col items-center justify-center py-16 text-cream-400">
            <div className="w-14 h-14 rounded-full bg-cream-200 flex items-center justify-center mb-3">
              <Search size={24} className="text-cream-300" />
            </div>
            <p className="text-sm">未找到相关用户或群聊</p>
          </div>
        )}

        {/* 搜索结果：用户 */}
        {!searching && users.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="block w-[3px] h-3.5 rounded-sm bg-gradient-to-b from-warm-500 to-warm-600" />
                <span className="text-[13px] font-semibold text-cream-900">用户</span>
                <span className="text-[10px] text-cream-500">{users.length}个结果</span>
              </div>
            </div>
            <div className="px-4 flex flex-col gap-2">
              {users.map((u: any, i: number) => (
                <motion.div key={u.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br ${cardBg(i)} shadow-sm relative overflow-hidden`}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}>
                  <CardDecoration pattern="circles" color="#f59e0b" />
                  <RemoteImage src={getAvatar(u.avatar)} alt=""
                    className="w-11 h-11 rounded-xl object-cover bg-white/50 flex-shrink-0 cursor-pointer active:opacity-80"
                    onClick={() => setViewUserId(u.id)} />
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setViewUserId(u.id)}>
                    <div className="text-sm font-semibold text-cream-900 truncate">{u.nickname}</div>
                    <div className="text-[10px] text-cream-600/80">ID: {u.id}{u.level ? ` · LV ${u.level}` : ''}</div>
                  </div>
                  {friendIds.has(u.id) ? (
                    <button onClick={() => navigate(`/messages/chat/${u.id}`)}
                      className="px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-medium active:scale-95 transition-transform shadow-sm shadow-emerald-200">
                      去聊天
                    </button>
                  ) : sentIds.has(u.id) ? (
                    <span className="px-3 py-1.5 rounded-full bg-white/60 text-cream-600 text-xs font-medium">已申请</span>
                  ) : (
                    <button onClick={() => { setFriendMsg(''); setFriendTarget(u); }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-medium active:scale-95 transition-transform shadow-sm shadow-emerald-200">
                      <UserPlus size={11} />添加
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* 搜索结果：群聊 */}
        {!searching && groups.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="block w-[3px] h-3.5 rounded-sm bg-gradient-to-b from-blue-400 to-blue-500" />
                <span className="text-[13px] font-semibold text-cream-900">群聊</span>
                <span className="text-[10px] text-cream-500">{groups.length}个结果</span>
              </div>
            </div>
            <div className="px-4 grid grid-cols-2 gap-2">
              {groups.map((g: any, i: number) => (
                <motion.button key={g.id}
                  className={`text-left p-3.5 rounded-2xl bg-gradient-to-br ${cardBg(i)} shadow-sm active:scale-[0.98] transition-transform relative overflow-hidden`}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => navigate(`/messages/group/${g.id}/detail`)}>
                  <CardDecoration pattern="waves" color="#6366f1" />
                  <RemoteImage src={getAvatar(g.avatar)} alt=""
                    className="w-10 h-10 rounded-xl object-cover bg-white/50 mb-2.5"
                    onError={(e: any) => { e.target.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${g.id}`; }} />
                  <div className="text-[13px] font-bold text-cream-900 truncate">{g.name}</div>
                  <div className="text-[10px] text-cream-600/80 mt-1">{g.member_count || 0}人</div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* 推荐区域（未搜索时） */}
        {showRecommend && !loadingRecommend && (
          <>
            {recommendUsers.length > 0 && (
              <div className="pt-2 pb-2">
                <div className="flex items-center justify-between px-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="block w-[3px] h-4 rounded-sm bg-gradient-to-b from-warm-500 to-warm-600" />
                    <span className="text-[13px] font-semibold text-cream-900">推荐用户</span>
                  </div>
                </div>
                <div className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide">
                  {recommendUsers.map((u: any) => (
                    <button key={u.id}
                      className="flex flex-col items-center gap-1.5 flex-shrink-0 focus:outline-none"
                      onClick={() => setViewUserId(u.id)}>
                      <div className="relative w-[60px] h-[60px] rounded-2xl bg-gradient-to-br from-warm-100 to-warm-200 shadow-md flex items-center justify-center">
                        <RemoteImage src={getAvatar(u.avatar)} alt=""
                          className="w-[56px] h-[56px] rounded-2xl object-cover" />
                        {friendIds.has(u.id) ? (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-cream-100 flex items-center justify-center shadow-sm">
                            <span className="text-[9px] text-white font-bold">&#x2714;</span>
                          </div>
                        ) : sentIds.has(u.id) ? (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-cream-100 flex items-center justify-center shadow-sm">
                            <span className="text-[9px] text-cream-500">&#x2714;</span>
                          </div>
                        ) : (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-cream-100 flex items-center justify-center shadow-sm">
                            <UserPlus size={10} className="text-white" />
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-cream-900 max-w-[60px] truncate">{u.nickname}</span>
                      {u.level > 0 && <span className="text-[9px] text-cream-500">LV {u.level}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {recommendGroups.length > 0 && (
              <div className="pt-2 pb-4">
                <div className="flex items-center justify-between px-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="block w-[3px] h-4 rounded-sm bg-gradient-to-b from-blue-400 to-blue-500" />
                    <span className="text-[13px] font-semibold text-cream-900">推荐群聊</span>
                  </div>
                </div>
                <div className="px-4 grid grid-cols-2 gap-2">
                  {recommendGroups.map((g: any, i: number) => (
                    <motion.button key={g.id}
                      className={`text-left p-3.5 rounded-2xl bg-gradient-to-br ${cardBg(i)} shadow-sm active:scale-[0.98] transition-transform relative overflow-hidden`}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => navigate(`/messages/group/${g.id}/detail`)}>
                      <CardDecoration pattern="dots" color="#a855f7" />
                      <RemoteImage src={getAvatar(g.avatar)} alt=""
                        className="w-10 h-10 rounded-xl object-cover bg-white/50 mb-2.5"
                        onError={(e: any) => { e.target.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${g.id}`; }} />
                      <div className="text-[13px] font-bold text-cream-900 truncate">{g.name}</div>
                      <div className="text-[10px] text-cream-600/80 mt-1">{g.member_count || 0}人</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {recommendUsers.length === 0 && recommendGroups.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-cream-400">
                <div className="w-16 h-16 rounded-full bg-cream-200 flex items-center justify-center mb-4">
                  <Search size={28} className="text-cream-300" />
                </div>
                <p className="text-sm">搜索你想添加的好友或群聊</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add friend dialog */}
      <AnimatePresence>
        {friendTarget && (
          <motion.div className="fixed inset-0 z-[300] flex items-center justify-center px-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setFriendTarget(null)} />
            <motion.div className="relative bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h3 className="text-base font-semibold text-cream-900">添加好友</h3>
                <button onClick={() => setFriendTarget(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream-100">
                  <X size={18} className="text-cream-500" />
                </button>
              </div>
              <div className="px-5 pb-3">
                <p className="text-sm text-cream-600 mb-3">发送验证消息给 {friendTarget.nickname}</p>
                <textarea value={friendMsg} onChange={e => setFriendMsg(e.target.value)} placeholder="你好，我想加你为好友"
                  className="w-full h-20 px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 text-sm text-cream-800 placeholder:text-cream-400 resize-none focus:outline-none focus:border-warm-400 transition-all" />
              </div>
              <div className="flex gap-3 px-5 pb-5">
                <button onClick={() => setFriendTarget(null)} className="flex-1 py-2.5 rounded-xl border border-cream-200 text-sm font-medium text-cream-700">取消</button>
                <button onClick={handleAddFriend} disabled={sending}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium disabled:opacity-50">
                  {sending ? '发送中...' : '发送'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div className="fixed top-20 left-1/2 -translate-x-1/2 z-[400] px-5 py-3 rounded-xl bg-cream-900/90 text-white text-sm font-medium shadow-lg"
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewUserId !== null && (
          <UserProfilePage userId={viewUserId} onClose={() => setViewUserId(null)} zIndex={300} disableHistoryBack />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
