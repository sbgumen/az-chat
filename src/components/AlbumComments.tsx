import { useState, useRef, useEffect } from 'react';
import { RemoteImage } from './RemoteImage';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, Heart, CornerDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface Comment {
  id: number;
  user_id: number;
  content: string;
  reply_to: number | null;
  created_at: string;
  nickname: string;
  avatar: string;
  reply_nickname?: string;
}

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getUrl = (u: string) => u?.startsWith('http') ? u : `${apiBase}${u}`;

function formatTime(t: string) {
  const d = new Date(t);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const dayBefore = new Date(now); dayBefore.setDate(dayBefore.getDate() - 2);
  if (d.toDateString() === yesterday.toDateString()) return '昨天';
  if (d.toDateString() === dayBefore.toDateString()) return '前天';
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

interface Props {
  comments: Comment[];
  loading: boolean;
  favoriteCount: number;
  isFav?: boolean;
  isLv30: boolean;
  canDelete?: boolean;
  onSend: (content: string, replyTo?: number) => Promise<void>;
  onDelete?: (id: number) => void;
  onToggleFav?: () => void;
}

const theme = (lv30: boolean) => ({
  bg: lv30 ? 'rgba(255,255,255,0.04)' : 'rgba(245,240,235,0.6)',
  bgHover: lv30 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
  text: lv30 ? 'rgba(255,255,255,0.85)' : '#4a3728',
  textSecondary: lv30 ? 'rgba(255,255,255,0.45)' : '#a09080',
  textMuted: lv30 ? 'rgba(255,255,255,0.28)' : '#c0b0a0',
  accent: '#d4a574',
  accentBg: lv30 ? 'rgba(212,165,116,0.15)' : 'rgba(212,165,116,0.12)',
  replyLine: lv30 ? 'rgba(212,165,116,0.35)' : 'rgba(212,165,116,0.25)',
  replyBg: lv30 ? 'rgba(255,255,255,0.025)' : 'rgba(245,240,235,0.5)',
  inputSurface: lv30 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.85)',
  inputInner: lv30 ? 'rgba(15,10,30,0.7)' : 'rgba(245,240,235,0.9)',
  inputText: lv30 ? 'rgba(255,255,255,0.85)' : '#4a3728',
  danger: '#ef4444',
  dangerBg: lv30 ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)',
});

const PREVIEW_COUNT = 3; // show latest 3 top-level comments collapsed

export function AlbumComments({ comments, loading, favoriteCount, isFav, isLv30, canDelete, onSend, onDelete, onToggleFav }: Props) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const t = theme(isLv30);

  const topLevel = [...comments].filter(c => !c.reply_to).reverse();
  const getReplies = (id: number) => comments.filter(c => c.reply_to === id);
  const visibleTopLevel = expanded ? topLevel : topLevel.slice(0, PREVIEW_COUNT);
  const hiddenCount = topLevel.length - PREVIEW_COUNT;

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    await onSend(input.trim(), replyTo?.id);
    setInput('');
    setReplyTo(null);
    setSending(false);
  };

  const triggerReply = (c: Comment) => {
    setReplyTo(c);
    setExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  useEffect(() => {
    if (replyTo) setTimeout(() => inputRef.current?.focus(), 80);
  }, [replyTo]);

  if (comments.length === 0 && !loading) {
    return (
      <div className="mt-3">
        {/* Minimal empty state + input always visible */}
        <div className="flex items-center gap-2 mb-3 px-1">
          <MessageCircle size={14} style={{ color: t.textMuted }} />
          <span className="text-[12px]" style={{ color: t.textMuted }}>暂无评论</span>
        </div>
        <CommentInput
          input={input} setInput={setInput} replyTo={replyTo} setReplyTo={setReplyTo}
          sending={sending} handleSend={handleSend} isLv30={isLv30} t={t}
          inputRef={inputRef} placeholder="写下第一条评论..."
        />
      </div>
    );
  }

  return (
    <div className="mt-3">
      {/* --- Preview list (always visible) --- */}
      <div className="flex flex-col gap-1 mb-2">
        {loading ? (
          <div className="py-6 flex justify-center">
            <motion.div className="w-5 h-5 rounded-full border-2"
              style={{ borderColor: t.accent, borderTopColor: 'transparent' }}
              animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
          </div>
        ) : (
          visibleTopLevel.map((c, idx) => {
            const replies = getReplies(c.id);
            const showAllReplies = expandedReplies.has(c.id);
            const visibleReplies = showAllReplies ? replies : replies.slice(0, 1);

            return (
              <div key={c.id}>
                <motion.div
                  className="group rounded-2xl px-3.5 py-3 transition-colors cursor-default"
                  style={{ background: t.bg }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.25 }}
                >
                  <div className="flex items-start gap-3">
                    <RemoteImage src={getUrl(c.avatar)} alt="" onClick={() => navigate(`/user/${c.user_id}`)}
                      className="w-8 h-8 rounded-full flex-shrink-0 object-cover cursor-pointer mt-0.5"
                      style={{ background: isLv30 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[13px] font-semibold cursor-pointer hover:underline" style={{ color: t.text }}
                          onClick={() => navigate(`/user/${c.user_id}`)}>{c.nickname}</span>
                        <span className="text-[10px]" style={{ color: t.textMuted }}>{formatTime(c.created_at)}</span>
                      </div>
                      <p className="text-[13px] leading-relaxed break-words" style={{ color: t.textSecondary }}>{c.content}</p>
                    </div>
                    <button onClick={() => triggerReply(c)}
                      className="opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 px-2 py-1 rounded-full"
                      style={{ background: t.accentBg, color: t.accent, fontSize: 11 }}>回复</button>
                    {canDelete && onDelete && (
                      <button onClick={() => onDelete(c.id)}
                        className="opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 px-2 py-1 rounded-full text-[11px]"
                        style={{ background: t.dangerBg, color: t.danger }}>删除</button>
                    )}
                  </div>
                </motion.div>

                {visibleReplies.length > 0 && (
                  <div className="ml-10 mt-0.5 relative">
                    <div className="absolute left-0 top-0 bottom-0 rounded-full"
                      style={{ width: 2, background: t.replyLine, left: -12 }} />
                    <div className="flex flex-col gap-0.5 rounded-xl py-1.5 px-3" style={{ background: t.replyBg }}>
                      {visibleReplies.map(r => (
                        <div key={r.id} className="group/r flex items-start gap-2.5 py-1.5">
                          <RemoteImage src={getUrl(r.avatar)} alt="" onClick={() => navigate(`/user/${r.user_id}`)}
                            className="w-6 h-6 rounded-full flex-shrink-0 object-cover cursor-pointer"
                            style={{ background: isLv30 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
                          <div className="flex-1 min-w-0">
                            <span className="text-[11px] font-semibold mr-1" style={{ color: t.text }}>{r.nickname}</span>
                            {r.reply_nickname && (
                              <span className="text-[11px] mr-1" style={{ color: t.textMuted }}>
                                <CornerDownRight size={10} className="inline mr-0.5" style={{ color: t.accent }} />回复 {r.reply_nickname}
                              </span>
                            )}
                            <span className="text-[12px] break-words" style={{ color: t.textSecondary }}> {r.content}</span>
                            <span className="text-[10px] ml-1.5" style={{ color: t.textMuted }}>{formatTime(r.created_at)}</span>
                          </div>
                          <button onClick={() => triggerReply(r)}
                            className="opacity-0 group-hover/r:opacity-100 transition-all flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px]"
                            style={{ background: t.accentBg, color: t.accent }}>回复</button>
                        </div>
                      ))}
                      {replies.length > 1 && (
                        <button onClick={() => setExpandedReplies(prev => { const s = new Set(prev); showAllReplies ? s.delete(c.id) : s.add(c.id); return s; })}
                          className="text-[11px] flex items-center gap-1 py-0.5 transition-colors" style={{ color: t.accent }}>
                          {showAllReplies ? '收起' : `查看全部 ${replies.length} 条回复`}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* --- Expand toggle + input bar --- */}
      <div className="flex items-center gap-3 mb-2">
        {hiddenCount > 0 && !expanded && (
          <button onClick={() => setExpanded(true)}
            className="text-[12px] font-medium transition-colors hover:opacity-80"
            style={{ color: t.accent }}>
            展开全部 {topLevel.length} 条评论
          </button>
        )}
        {expanded && topLevel.length > PREVIEW_COUNT && (
          <button onClick={() => setExpanded(false)}
            className="text-[12px] transition-colors hover:opacity-80"
            style={{ color: t.textMuted }}>
            收起评论
          </button>
        )}
        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-1">
            <Heart size={13} style={{ color: isFav ? '#ef4444' : t.textMuted }} fill={isFav ? '#ef4444' : 'none'}
              onClick={(e) => { e.stopPropagation(); onToggleFav?.(); }} />
            <span className="text-[11px] font-medium" style={{ color: t.textMuted }}>{favoriteCount || ''}</span>
          </div>
        </div>
      </div>

      {/* --- Input: sculpted 3D design --- */}
      <CommentInput
        input={input} setInput={setInput} replyTo={replyTo} setReplyTo={setReplyTo}
        sending={sending} handleSend={handleSend} isLv30={isLv30} t={t}
        inputRef={inputRef}
      />
    </div>
  );
}

// ====== Sculpted 3D comment input ======

function CommentInput({ input, setInput, replyTo, setReplyTo, sending, handleSend, isLv30, t, inputRef, placeholder }: {
  input: string; setInput: (v: string) => void;
  replyTo: Comment | null; setReplyTo: (v: Comment | null) => void;
  sending: boolean; handleSend: () => void;
  isLv30: boolean; t: ReturnType<typeof theme>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  placeholder?: string;
}) {
  return (
    <div className="rounded-2xl px-3.5 pt-2.5 pb-3"
      style={{
        background: isLv30 ? 'rgba(15,10,30,0.85)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(16px)',
        boxShadow: isLv30
          ? '0 -4px 16px rgba(0,0,0,0.4)'
          : '0 -2px 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* Reply context chip */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ y: 8, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 8, opacity: 0, scale: 0.95 }}
            className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-xl"
            style={{ background: t.accentBg }}
          >
            <CornerDownRight size={12} style={{ color: t.accent }} />
            <span className="text-[11px] flex-1 truncate" style={{ color: t.accent }}>回复 {replyTo.nickname}</span>
            <button onClick={() => setReplyTo(null)}><X size={12} style={{ color: t.accent }} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input field with inner depth */}
      <div className="flex items-center gap-2 rounded-xl px-3 py-2"
        style={{
          background: t.inputInner,
          boxShadow: isLv30
            ? 'inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.06)'
            : 'inset 0 1px 3px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.9)',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={placeholder || (replyTo ? `回复 ${replyTo.nickname}...` : '写评论...')}
          maxLength={200}
          className="flex-1 text-[13px] bg-transparent outline-none"
          style={{ color: t.inputText }}
        />
        <AnimatePresence>
          {input.trim() && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={handleSend}
              disabled={sending}
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: t.accent }}
            >
              {sending ? (
                <motion.div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent"
                  animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
              ) : (
                <Send size={13} className="text-white" />
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default AlbumComments;
