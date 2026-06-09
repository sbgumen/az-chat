import { RemoteImage } from '../../components/RemoteImage';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, X } from 'lucide-react';
import { searchMessages, searchGroupMessages } from '../../api/messages';
import { getMediaUrl } from '../../utils/mediaUrl';
import { useAuth } from '../../context/AuthContext';
import { useHistoryBack } from '../../hooks/useHistoryBack';

interface SearchResult {
  id: number;
  sender_id: number;
  content: string;
  created_at: string;
  sender_nickname?: string;
  sender_avatar?: string;
}

interface SearchChatHistoryProps {
  targetId: number;
  targetName: string;
  type: 'private' | 'group';
  onClose: () => void;
  onSelect: (msgId: number) => void;
  disableHistoryBack?: boolean;
}

export function SearchChatHistory({ targetId, targetName, type, onClose, onSelect, disableHistoryBack }: SearchChatHistoryProps) {
  const { user } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useHistoryBack(disableHistoryBack ? null : onClose);

  const doSearch = async (kw: string) => {
    if (!kw.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const res: any = type === 'private'
        ? await searchMessages(targetId, kw)
        : await searchGroupMessages(targetId, kw);
      if (res.code === 0) setResults(res.data || []);
    } catch {}
    setLoading(false);
  };

  const handleInput = (val: string) => {
    setKeyword(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(val), 400);
  };

  const formatTime = (t: string) => {
    const d = new Date(t);
    const now = new Date();
    const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === now.toDateString()) return `今天 ${time}`;
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return `昨天 ${time}`;
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${time}`;
  };

  const highlightText = (text: string, kw: string) => {
    if (!kw.trim()) return text;
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === kw.toLowerCase()
        ? <span key={i} className="text-warm-500 font-semibold">{part}</span>
        : part
    );
  };

  return (
    <motion.div
      className="fixed inset-0 z-[270] flex flex-col bg-[#f5f2ed]"
        
      
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 340, damping: 32 }}
    >
      {/* Header with search */}
      <header className="px-3 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 bg-white/95 backdrop-blur-xl border-b border-cream-200/60 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg text-cream-700 hover:bg-cream-100 transition-all flex-shrink-0" onClick={onClose}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-cream-100 border border-cream-200/60 rounded-full">
            <Search size={15} className="text-cream-500 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={keyword}
              onChange={e => handleInput(e.target.value)}
              placeholder={`搜索与 ${targetName} 的聊天记录`}
              className="flex-1 text-sm text-cream-900 placeholder:text-cream-500 bg-transparent outline-none"
              autoFocus
            />
            {keyword && (
              <button onClick={() => { setKeyword(''); setResults([]); setSearched(false); }} className="text-cream-400 hover:text-cream-600">
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-cream-500 text-sm">搜索中...</div>
        ) : !searched ? (
          <div className="flex flex-col items-center justify-center py-20 text-cream-500">
            <Search size={40} className="text-cream-300 mb-3" />
            <p className="text-sm">输入关键词搜索聊天记录</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-cream-500">
            <p className="text-sm">未找到相关记录</p>
          </div>
        ) : (
          <div className="py-2">
            <p className="px-5 py-2 text-xs text-cream-500">找到 {results.length} 条相关记录</p>
            {results.map((msg) => {
              const isSelf = msg.sender_id === user?.id;
              const senderName = isSelf ? '我' : (msg.sender_nickname || targetName);
              return (
                <button
                  key={msg.id}
                  className="w-full flex items-start gap-3 px-5 py-3.5 hover:bg-cream-100/80 active:bg-cream-200 transition-colors text-left"
                  onClick={() => onSelect(msg.id)}
                >
                  <div className="w-9 h-9 rounded-full bg-cream-200 flex-shrink-0 overflow-hidden mt-0.5">
                    {msg.sender_avatar ? (
                      <RemoteImage src={getMediaUrl(msg.sender_avatar)} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full bg-warm-100 flex items-center justify-center text-warm-500 text-xs font-bold">
                        {senderName[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-medium text-cream-800">{senderName}</span>
                      <span className="text-[11px] text-cream-500 flex-shrink-0">{formatTime(msg.created_at)}</span>
                    </div>
                    <p className="text-[13px] text-cream-700 leading-relaxed line-clamp-2">
                      {highlightText(msg.content, keyword)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
