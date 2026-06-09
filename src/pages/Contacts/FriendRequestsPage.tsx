import { RemoteImage } from '../../components/RemoteImage';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, X } from 'lucide-react';
import { getFriendRequests, getMyRequests, acceptFriendRequest, rejectFriendRequest } from '../../api/contacts';
import { getGroupRequests, getMyGroupRequests, acceptGroupRequest, rejectGroupRequest } from '../../api/groups';
import { useSocket } from '../../hooks/useSocket';
import { useSmartBack } from '../../hooks/useSmartBack';
import { useNavigate } from 'react-router-dom';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getAvatar = (a: string) => a?.startsWith('http') ? a : `${apiBase}${a}`;
const formatDate = (s: string) => new Date(s).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
const relativeTime = (s: string) => {
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '刚刚';
  if (m < 60) return `${m}分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}小时前`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}天前`;
  return formatDate(s);
};

interface PendingItem {
  id: number;
  type: 'friend' | 'group';
  name: string;
  avatar: string;
  message: string;
  time: string;
  sub?: string;  // e.g. "申请加入 技术讨论组"
  raw: any;
}

interface ProcessedItem {
  id: number;
  type: 'friend' | 'group';
  name: string;
  avatar: string;
  time: string;
  status: 'accepted' | 'rejected' | 'sent';
  sub?: string;
  raw: any;
}

export function FriendRequestsPage() {
  const navigate = useNavigate();
  const goBack = useSmartBack('/contacts');
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [processedItems, setProcessedItems] = useState<ProcessedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { on } = useSocket();

  const buildLists = useCallback((friendReqs: any[], myFriendReqs: any[], groupReqs: any[], myGroupReqs: any[]) => {
    const pending: PendingItem[] = [];
    const processed: ProcessedItem[] = [];

    // Incoming friend requests
    for (const r of friendReqs) {
      if (r.status === 0) {
        pending.push({ id: r.id, type: 'friend', name: r.nickname, avatar: r.avatar, message: r.message || '请求添加你为好友', time: relativeTime(r.created_at), raw: r });
      } else {
        processed.push({ id: r.id, type: 'friend', name: r.nickname, avatar: r.avatar, time: relativeTime(r.created_at), status: r.status === 1 ? 'accepted' : 'rejected', raw: r });
      }
    }
    // Incoming group requests
    for (const r of groupReqs) {
      if (r.status === 0) {
        pending.push({ id: r.id, type: 'group', name: r.nickname, avatar: r.user_avatar, message: r.message || '', time: relativeTime(r.created_at), sub: `申请加入 ${r.group_name}`, raw: r });
      } else {
        processed.push({ id: r.id, type: 'group', name: r.nickname, avatar: r.user_avatar, time: relativeTime(r.created_at), status: r.status === 1 ? 'accepted' : 'rejected', sub: `加入 ${r.group_name}`, raw: r });
      }
    }
    // My sent friend requests
    for (const r of myFriendReqs) {
      processed.push({ id: r.id, type: 'friend', name: r.nickname || `用户${r.to_user_id}`, avatar: r.avatar, time: relativeTime(r.created_at), status: 'sent', sub: '我发送的好友申请', raw: r });
    }
    // My sent group requests
    for (const r of myGroupReqs) {
      processed.push({ id: r.id, type: 'group', name: r.group_name, avatar: r.group_avatar, time: relativeTime(r.created_at), status: 'sent', sub: '我申请的群聊', raw: r });
    }

    processed.sort((a, b) => new Date(b.raw.created_at).getTime() - new Date(a.raw.created_at).getTime());
    setPendingItems(pending);
    setProcessedItems(processed);
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [r1, r2, r3, r4]: any[] = await Promise.all([
        getFriendRequests(), getMyRequests(), getGroupRequests(), getMyGroupRequests()
      ]);
      const fr = r1.code === 0 ? r1.data || [] : [];
      const mf = r2.code === 0 ? r2.data || [] : [];
      const gr = r3.code === 0 ? r3.data || [] : [];
      const mg = r4.code === 0 ? r4.data || [] : [];
      buildLists(fr, mf, gr, mg);
    } catch { /* ignore */ }
    setLoading(false);
  }, [buildLists]);

  useEffect(() => { fetchAll(); window.dispatchEvent(new CustomEvent('contacts_unread_clear')); }, [fetchAll]);

  useEffect(() => {
    const u1 = on('friend:request', () => fetchAll());
    const u2 = on('friend:accepted', () => fetchAll());
    const u3 = on('group:request', () => fetchAll());
    const u4 = on('group:join', () => fetchAll());
    return () => { u1(); u2(); u3(); u4(); };
  }, [on, fetchAll]);

  const handleAccept = async (item: PendingItem) => {
    if (item.type === 'friend') {
      const r: any = await acceptFriendRequest(item.id);
      if (r.code === 0) fetchAll();
    } else {
      const r: any = await acceptGroupRequest(item.id);
      if (r.code === 0) fetchAll();
    }
  };

  const handleReject = async (item: PendingItem) => {
    if (item.type === 'friend') {
      const r: any = await rejectFriendRequest(item.id);
      if (r.code === 0) fetchAll();
    } else {
      const r: any = await rejectGroupRequest(item.id);
      if (r.code === 0) fetchAll();
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'accepted') return 'bg-emerald-50 text-emerald-600';
    if (status === 'rejected') return 'bg-cream-100 text-cream-500';
    return 'bg-amber-50 text-amber-600';
  };
  const statusText = (status: string) => status === 'accepted' ? '已同意' : status === 'rejected' ? '已拒绝' : '已发送';

  return (
    <motion.div className="fixed inset-0 z-[200] flex flex-col bg-cream-100"
      
      
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
      {/* Header */}
      <header className="flex items-center gap-2 px-3 pt-[calc(var(--status-bar-height,0px)+10px)] pb-2.5 flex-shrink-0">
        <button className="p-2 rounded-lg text-cream-700 hover:bg-cream-200 transition-all" onClick={goBack}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 text-[16px] font-semibold text-cream-900">申请列表</h1>
      </header>

      <div className="flex-1 overflow-y-auto min-h-0 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-cream-500 text-sm">加载中...</div>
        ) : (
          <>
            {/* 待处理 zone — prominent */}
            <div className="pt-3 pb-2">
              <div className="flex items-center justify-between px-4 mb-3">
                <div className="flex items-center gap-2">
                  <span className="block w-[3px] h-4 rounded-sm bg-gradient-to-b from-red-400 to-warm-500" />
                  <span className="text-[14px] font-semibold text-cream-900">待处理</span>
                  {pendingItems.length > 0 && (
                    <span className="min-w-[20px] h-[20px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {pendingItems.length}
                    </span>
                  )}
                </div>
                {pendingItems.length > 0 && (
                  <span className="text-[10px] text-cream-500">
                    {pendingItems.filter(i => i.type === 'friend').length} 好友 · {pendingItems.filter(i => i.type === 'group').length} 群聊
                  </span>
                )}
              </div>

              {pendingItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-cream-400">
                  <Check size={32} className="mb-2 opacity-30" />
                  <p className="text-sm">暂无待处理申请</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 px-4">
                  {pendingItems.map((item) => (
                    <div key={`${item.type}_${item.id}`}
                      className="bg-white rounded-2xl p-3.5 shadow-sm flex items-center gap-3">
                      <RemoteImage src={getAvatar(item.avatar)} alt={item.name}
                        onClick={() => item.type === 'friend' ? navigate(`/user/${item.raw.from_user_id}`) : navigate(`/user/${item.raw.user_id}`)}
                        className="w-11 h-11 rounded-xl object-cover bg-cream-200 flex-shrink-0 cursor-pointer active:opacity-70" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-cream-900 truncate">{item.name}</span>
                          <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${item.type === 'friend' ? 'bg-warm-50 text-warm-600' : 'bg-purple-50 text-purple-600'}`}>
                            {item.type === 'friend' ? '好友' : '群聊'}
                          </span>
                        </div>
                        {item.sub ? (
                          <div className="text-xs text-cream-600 truncate">{item.sub}</div>
                        ) : (
                          <div className="text-xs text-cream-600 truncate">{item.message}</div>
                        )}
                        <div className="text-[10px] text-cream-400 mt-0.5">{item.time}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleAccept(item)}
                          className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center active:scale-95 transition-transform shadow-sm shadow-emerald-200"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => handleReject(item)}
                          className="w-9 h-9 rounded-xl bg-cream-200 text-cream-500 flex items-center justify-center active:scale-95 transition-transform"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 已处理 zone — compact */}
            {processedItems.length > 0 && (
              <div className="pt-4 pb-4">
                <div className="flex items-center gap-2 px-4 mb-2">
                  <span className="block w-[3px] h-3.5 rounded-sm bg-gradient-to-b from-cream-400 to-cream-500" />
                  <span className="text-[13px] font-semibold text-cream-600">已处理</span>
                </div>
                <div className="px-4 flex flex-col">
                  {processedItems.map((item) => (
                    <div key={`${item.type}_${item.id}`}
                      className="flex items-center gap-3 py-2.5 border-b border-cream-100 last:border-0">
                      <RemoteImage src={getAvatar(item.avatar)} alt={item.name}
                        className="w-9 h-9 rounded-lg object-cover bg-cream-200 flex-shrink-0 opacity-60" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-cream-600 truncate">{item.name}</div>
                        <div className="text-[10px] text-cream-400">
                          {item.sub && <span className="mr-2">{item.sub}</span>}
                          {item.time}
                        </div>
                      </div>
                      <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusBadge(item.status)}`}>
                        {statusText(item.status)}
                      </span>
                    </div>
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
