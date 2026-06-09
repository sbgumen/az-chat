import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';
import { motion, AnimatePresence } from 'framer-motion';
import { RemoteImage } from '../../components/RemoteImage';
import {
  Search, X, MessageCircle, Users, Hash, Calendar, ArrowUpRight
} from 'lucide-react';
import { getFriends } from '../../api/contacts';
import { getConversations, searchMessages, getGroupConversations, searchGroupMessages } from '../../api/messages';
import { getMediaUrl } from '../../utils/mediaUrl';

// Time filter options
type TimeFilter = 'all' | 'week' | 'month' | '3months' | 'year';
const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: '3months', label: '近三月' },
  { key: 'year', label: '近一年' },
];

function timeFilterCutoff(filter: TimeFilter): number {
  const now = Date.now();
  switch (filter) {
    case 'week': return now - 7 * 86400000;
    case 'month': return now - 30 * 86400000;
    case '3months': return now - 90 * 86400000;
    case 'year': return now - 365 * 86400000;
    default: return 0;
  }
}

function formatTime(t: string) {
  const d = new Date(t);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return '昨天';
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if (y === now.getFullYear()) return `${m}/${day}`;
  return `${y}/${m}/${day}`;
}

interface ContactResult { id: number; nickname: string; avatar: string; is_group?: boolean; member_count?: number; }
interface MessageResult { id: number; content: string; sender_id: number; created_at: string; type: string; source: { type: 'private' | 'group'; id: number; name: string; }; }

export function SearchPage() {
  const navigate = useNavigate();
  const goBack = useSmartBack('/messages');
  const [query, setQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [contacts, setContacts] = useState<ContactResult[]>([]);
  const [groups, setGroups] = useState<ContactResult[]>([]);
  const [messages, setMessages] = useState<MessageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const friendIdsRef = useRef<Set<number>>(new Set());

  // Load friend IDs on mount
  useEffect(() => {
    getFriends().then((res: any) => {
      if (res.code === 0) {
        friendIdsRef.current = new Set((res.data || []).map((f: any) => f.friend_id || f.id));
      }
    }).catch(() => {});
  }, []);

  // Auto-focus
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setContacts([]); setGroups([]); setMessages([]); setSearched(false); return; }
    setLoading(true); setSearched(true);
    const cutoff = timeFilterCutoff(timeFilter);
    const keyword = q.trim();

    try {
      // 搜索好友（仅搜索已添加的好友，本地过滤）
      const [convRes, gConvRes]: any[] = await Promise.all([
        getConversations().catch(() => ({ code: -1, data: [] })),
        getGroupConversations().catch(() => ({ code: -1, data: [] })),
      ]);

      // 私聊联系人（仅好友）
      const contactResults: ContactResult[] = [];
      if (convRes.code === 0) {
        for (const c of convRes.data || []) {
          if (!friendIdsRef.current.has(c.user_id)) continue;
          if (c.nickname?.toLowerCase().includes(keyword.toLowerCase())) {
            contactResults.push({ id: c.user_id, nickname: c.nickname, avatar: c.avatar });
          }
        }
      }
      setContacts(contactResults.slice(0, 8));

      // 搜索群聊
      const groupResults: ContactResult[] = [];
      if (gConvRes.code === 0) {
        for (const g of gConvRes.data || []) {
          const name = g.group_name || g.name || '';
          if (name.toLowerCase().includes(keyword.toLowerCase())) {
            groupResults.push({ id: g.group_id || g.id, nickname: name, avatar: g.group_avatar || g.avatar, is_group: true, member_count: g.member_count });
          }
        }
      }
      setGroups(groupResults.slice(0, 8));

      // Search private conversations
      const msgResults: MessageResult[] = [];
      if (convRes.code === 0) {
        for (const conv of (convRes.data || []).slice(0, 10)) {
          try {
            const sRes: any = await searchMessages(conv.user_id, keyword);
            if (sRes.code === 0 && Array.isArray(sRes.data)) {
              for (const m of sRes.data) {
                if (cutoff && new Date(m.created_at).getTime() < cutoff) continue;
                msgResults.push({ ...m, source: { type: 'private', id: conv.user_id, name: conv.nickname } });
              }
            }
          } catch { /* skip */ }
        }
      }

      // Search group conversations
      if (gConvRes.code === 0) {
        for (const conv of (gConvRes.data || []).slice(0, 10)) {
          try {
            const sRes: any = await searchGroupMessages(conv.group_id || conv.id, keyword);
            if (sRes.code === 0 && Array.isArray(sRes.data)) {
              for (const m of sRes.data) {
                if (cutoff && new Date(m.created_at).getTime() < cutoff) continue;
                msgResults.push({ ...m, source: { type: 'group', id: conv.group_id || conv.id, name: conv.group_name || conv.name } });
              }
            }
          } catch { /* skip */ }
        }
      }

      // Sort by time desc, cap at 20
      msgResults.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setMessages(msgResults.slice(0, 20));
    } catch { /* ignore */ }
    setLoading(false);
  }, [timeFilter]);

  // Debounced search on query or filter change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, timeFilter, doSearch]);

  const handleJumpToMessage = (msg: MessageResult) => {
    if (msg.source.type === 'private') {
      navigate(`/messages/chat/${msg.source.id}`, { state: { jumpToMsgId: msg.id } });
    } else {
      navigate(`/messages/group/${msg.source.id}`, { state: { jumpToMsgId: msg.id } });
    }
  };

  const highlightText = (text: string, keyword: string) => {
    if (!keyword.trim()) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((p, i) =>
          p.toLowerCase() === keyword.toLowerCase()
            ? <mark key={i} className="bg-transparent" style={{ color: '#d4a574', fontWeight: 600 }}>{p}</mark>
            : <span key={i}>{p}</span>
        )}
      </span>
    );
  };

  const hasResults = contacts.length > 0 || groups.length > 0 || messages.length > 0;

  return (
    <motion.div className="fixed inset-0 z-[220] flex flex-col overflow-hidden"
      style={{ background: '#f5f0eb' }}
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 350, damping: 32 }}
    >
      {/* Search header */}
      <div className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+10px)] pb-3"
        style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)' }}>
        {/* Search field */}
        <div className="flex-1 flex items-center gap-2.5 rounded-2xl px-4 py-2.5"
          style={{ background: 'rgba(0,0,0,0.04)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)' }}>
          <Search size={16} className="text-cream-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索联系人或群聊或消息..."
            className="flex-1 text-[15px] bg-transparent outline-none text-cream-900 placeholder:text-cream-400"
          />
          {query && (
            <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }}
              onClick={() => setQuery('')} className="flex-shrink-0">
              <X size={16} className="text-cream-400" />
            </motion.button>
          )}
        </div>
        <button onClick={goBack}
          className="text-[14px] font-medium text-cream-600 flex-shrink-0 px-1">
          取消
        </button>
      </div>

      {/* Time filter chips */}
      <div className="flex gap-2 px-4 py-2.5 overflow-x-auto scrollbar-hide"
        style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)' }}>
        {TIME_FILTERS.map(f => (
          <button key={f.key} onClick={() => setTimeFilter(f.key)}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all"
            style={{
              background: timeFilter === f.key ? '#d4a574' : 'rgba(0,0,0,0.04)',
              color: timeFilter === f.key ? 'white' : '#a09080',
              boxShadow: timeFilter === f.key ? '0 2px 8px rgba(212,165,116,0.35)' : 'none',
            }}
          >
            {f.key !== 'all' && <Calendar size={10} className="inline mr-1" />}
            {f.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" className="flex flex-col items-center justify-center py-20 gap-3"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="w-8 h-8 rounded-full border-2 border-warm-400 border-t-transparent"
                animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
              <p className="text-cream-400 text-[13px]">搜索中...</p>
            </motion.div>
          ) : !query.trim() ? (
            <motion.div key="empty-query" className="flex flex-col items-center justify-center py-20 gap-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.04)' }}>
                <Search size={32} className="text-cream-300" />
              </div>
              <p className="text-cream-400 text-[14px]">输入关键词搜索联系人或消息</p>
            </motion.div>
          ) : searched && !hasResults ? (
            <motion.div key="no-results" className="flex flex-col items-center justify-center py-20 gap-3"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-cream-500 text-[15px] font-semibold">未找到结果</p>
              <p className="text-cream-400 text-[13px]">尝试其他关键词或调整筛选条件</p>
            </motion.div>
          ) : (
            <motion.div key="results" className="py-3"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              {/* Contacts section */}
              {contacts.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 px-4 mb-2.5">
                    <Users size={14} className="text-cream-500" />
                    <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-cream-500">联系人</span>
                    <span className="text-[10px] text-cream-400">{contacts.length}</span>
                  </div>
                  <div className="flex flex-col">
                    {contacts.map((c, i) => (
                      <motion.button
                        key={c.id}
                        className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 text-left transition-colors"
                        style={{ background: 'transparent' }}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => navigate(`/messages/chat/${c.id}`)}
                      >
                        <RemoteImage src={getMediaUrl(c.avatar)} alt=""
                          className="w-11 h-11 rounded-full flex-shrink-0 object-cover"
                          style={{ background: 'rgba(0,0,0,0.06)' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-cream-900">
                            {highlightText(c.nickname, query)}
                          </p>
                        </div>
                        <ArrowUpRight size={15} className="text-cream-400 flex-shrink-0" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Groups section */}
              {groups.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 px-4 mb-2.5">
                    <Hash size={14} className="text-cream-500" />
                    <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-cream-500">群聊</span>
                    <span className="text-[10px] text-cream-400">{groups.length}</span>
                  </div>
                  <div className="flex flex-col">
                    {groups.map((g, i) => (
                      <motion.button
                        key={`g_${g.id}`}
                        className="flex items-center gap-3 px-4 py-3 text-left transition-colors"
                        style={{ background: 'transparent' }}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => navigate(`/messages/group/${g.id}`)}
                      >
                        <RemoteImage src={getMediaUrl(g.avatar)} alt=""
                          className="w-11 h-11 rounded-xl flex-shrink-0 object-cover"
                          style={{ background: 'rgba(0,0,0,0.06)' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-cream-900">
                            {highlightText(g.nickname, query)}
                          </p>
                          <p className="text-[11px] text-cream-500 mt-0.5">群聊 · {g.member_count || 0}人</p>
                        </div>
                        <ArrowUpRight size={15} className="text-cream-400 flex-shrink-0" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages section */}
              {messages.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-4 mb-2.5">
                    <MessageCircle size={14} className="text-cream-500" />
                    <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-cream-500">消息</span>
                    <span className="text-[10px] text-cream-400">{messages.length}</span>
                  </div>
                  <div className="flex flex-col">
                    {messages.map((m, i) => (
                      <motion.button
                        key={`msg_${m.source.type}_${m.id}`}
                        className="flex items-start gap-3 px-4 py-3 text-left transition-colors"
                        style={{ background: 'transparent' }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => handleJumpToMessage(m)}
                      >
                        {/* Source indicator */}
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: m.source.type === 'group' ? 'rgba(139,160,180,0.15)' : 'rgba(212,165,116,0.12)' }}>
                          {m.source.type === 'group'
                            ? <Hash size={16} className="text-blue-400" />
                            : <MessageCircle size={15} style={{ color: '#d4a574' }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[13px] font-semibold text-cream-900">
                              {m.source.name}
                            </span>
                            <span className="text-[10px] text-cream-400">{formatTime(m.created_at)}</span>
                          </div>
                          <p className="text-[13px] text-cream-600 leading-relaxed break-words line-clamp-2">
                            {highlightText(m.content || '[图片]', query)}
                          </p>
                        </div>
                        <ArrowUpRight size={14} className="text-cream-400 flex-shrink-0 mt-1.5" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default SearchPage;
