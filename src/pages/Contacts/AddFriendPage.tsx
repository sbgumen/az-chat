import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, UserPlus, X } from 'lucide-react';
import { searchUser } from '../../api/user';
import { sendFriendRequest } from '../../api/contacts';
import { UserProfilePage } from '../Profile/UserProfilePage';
import { useSmartBack } from '../../hooks/useSmartBack';

interface AddFriendPageProps {}

interface SearchResult {
  id: number;
  nickname: string;
  avatar: string;
  gender: number;
}

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getAvatar = (avatar: string) => avatar?.startsWith('http') ? avatar : `${apiBase}${avatar}`;

export function AddFriendPage({}: AddFriendPageProps) {
  const goBack = useSmartBack('/contacts');
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sentIds, setSentIds] = useState<Set<number>>(new Set());
  const [feedback, setFeedback] = useState<{ id: number; msg: string } | null>(null);
  const [addDialog, setAddDialog] = useState<{ userId: number; nickname: string } | null>(null);
  const [addMessage, setAddMessage] = useState('你好，我想添加你为好友');
  const [viewUserId, setViewUserId] = useState<number | null>(null);

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setSearched(false);
    try {
      const res: any = await searchUser(keyword.trim());
      if (res.code === 0) setResults(res.data || []);
      else setResults([]);
    } catch (e) {
      setResults([]);
    }
    setSearched(true);
    setLoading(false);
  };

  const handleOpenAddDialog = (userId: number, nickname: string) => {
    setAddMessage('你好，我想添加你为好友');
    setAddDialog({ userId, nickname });
  };

  const handleConfirmAdd = async () => {
    if (!addDialog) return;
    const res: any = await sendFriendRequest(addDialog.userId, addMessage);
    if (res.code === 0) {
      setSentIds(prev => new Set(prev).add(addDialog.userId));
      setFeedback({ id: addDialog.userId, msg: '申请已发送' });
      setTimeout(() => setFeedback(null), 2000);
    } else {
      setFeedback({ id: addDialog.userId, msg: res.message || '发送失败' });
      setTimeout(() => setFeedback(null), 2000);
    }
    setAddDialog(null);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col bg-cream-100 md:relative md:inset-auto md:z-auto"
            
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-2.5 bg-white/90 backdrop-blur-xl border-b border-cream-300/60 flex-shrink-0">
        <button
          className="p-2 rounded-lg text-cream-700 hover:text-cream-900 hover:bg-cream-200 transition-all"
          onClick={goBack}
          aria-label="返回"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 text-[16px] font-semibold text-cream-900">添加好友</h1>
      </header>

      {/* Search bar */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-cream-300/60 rounded-2xl shadow-sm transition-all focus-within:border-warm-400 focus-within:ring-2 focus-within:ring-warm-400/10">
            <Search size={16} className="text-cream-600 flex-shrink-0" />
            <input
              type="text"
              className="flex-1 text-sm text-cream-900 placeholder:text-cream-500 bg-transparent outline-none"
              placeholder="输入用户ID、手机号或昵称"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              autoFocus
            />
          </div>
          <button
            className="px-4 py-2.5 rounded-2xl bg-warm-500 text-white text-sm font-medium active:bg-warm-600 transition-colors disabled:opacity-50"
            onClick={handleSearch}
            disabled={loading || !keyword.trim()}
          >
            搜索
          </button>
        </div>
        <p className="mt-2 text-[11px] text-cream-600 px-1">支持通过用户ID、手机号或昵称搜索</p>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {loading && (
          <div className="flex items-center justify-center py-16 text-cream-600 text-sm">搜索中...</div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-cream-600">
            <div className="w-14 h-14 rounded-full bg-cream-200 flex items-center justify-center mb-3">
              <UserPlus size={24} className="text-cream-500" />
            </div>
            <p className="text-sm font-medium">未找到用户</p>
            <p className="text-xs mt-1 text-cream-500">请检查输入是否正确</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="bg-white rounded-2xl shadow-soft border border-cream-300/40 overflow-hidden">
            {results.map((user, index) => (
              <motion.div
                key={user.id}
                className="flex items-center gap-3 px-4 py-3.5 border-b border-cream-100 last:border-0"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
              >
                <img
                  src={getAvatar(user.avatar)}
                  alt={user.nickname}
                  className="w-11 h-11 rounded-full object-cover bg-cream-200 flex-shrink-0 cursor-pointer active:opacity-80"
                  onClick={() => setViewUserId(user.id)}
                />
                <div className="flex-1 min-w-0" onClick={() => setViewUserId(user.id)}>
                  <span className="text-sm font-medium text-cream-900 block truncate">{user.nickname}</span>
                  <span className="text-xs text-cream-600">ID: {user.id}</span>
                </div>
                <div className="flex-shrink-0 relative">
                  {feedback?.id === user.id ? (
                    <span className="text-xs text-warm-600 font-medium">{feedback.msg}</span>
                  ) : sentIds.has(user.id) ? (
                    <span className="px-3 py-1.5 rounded-full bg-cream-200 text-cream-600 text-xs font-medium">已发送</span>
                  ) : (
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warm-500 text-white text-xs font-medium active:bg-warm-600 transition-colors"
                      onClick={() => handleOpenAddDialog(user.id, user.nickname)}
                    >
                      <UserPlus size={13} />
                      添加
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && !searched && (
          <div className="flex flex-col items-center justify-center py-20 text-cream-500">
            <div className="w-16 h-16 rounded-full bg-cream-200 flex items-center justify-center mb-4">
              <Search size={28} className="text-cream-400" />
            </div>
            <p className="text-sm">搜索你想添加的好友</p>
          </div>
        )}
      </div>

      {/* Add Friend Dialog */}
      <AnimatePresence>
        {addDialog && (
          <motion.div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAddDialog(null)}
          >
            <motion.div
              className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-5"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-semibold text-cream-900">添加 {addDialog.nickname}</h3>
                <button onClick={() => setAddDialog(null)} className="p-1 rounded-full hover:bg-cream-100">
                  <X size={18} className="text-cream-600" />
                </button>
              </div>
              <label className="block text-xs text-cream-700 mb-1.5 font-medium">验证消息</label>
              <textarea
                className="w-full px-3 py-2.5 bg-cream-100 border border-cream-300/60 rounded-xl text-sm text-cream-900 placeholder:text-cream-500 resize-none focus:border-warm-400 focus:ring-2 focus:ring-warm-400/10 transition-all"
                rows={3}
                maxLength={100}
                value={addMessage}
                onChange={e => setAddMessage(e.target.value)}
                placeholder="输入验证消息..."
              />
              <p className="text-[11px] text-cream-500 mt-1 text-right">{addMessage.length}/100</p>
              <button
                className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-warm-500 to-warm-400 text-white text-sm font-medium active:scale-[0.98] transition-all"
                onClick={handleConfirmAdd}
              >
                发送申请
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Profile Page */}
      <AnimatePresence>
        {viewUserId && (
          <UserProfilePage
            userId={viewUserId}
            onClose={() => setViewUserId(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
