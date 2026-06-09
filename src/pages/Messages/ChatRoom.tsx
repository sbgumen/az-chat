import { RemoteImage } from '../../components/RemoteImage';
import { ChatImage } from '../../components/ChatImage';
import { LinkifyText } from '../../components/LinkifyText';
import { EmojiPicker } from '../../components/EmojiPicker';
import { ChatToolPanel } from '../../components/ChatToolPanel';
import { copyText } from '../../utils/clipboard';
import { getMediaUrl } from '../../utils/mediaUrl';
import { Capacitor } from '@capacitor/core';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone, MoreHorizontal, Smile, Plus, Mic, Loader2, Keyboard, Play, Pause, Copy, Quote, RotateCcw, X, Bookmark } from 'lucide-react';
import { getMessages, uploadImage, uploadAudio, recallMessage } from '../../api/messages';
import { getUserProfile } from '../../api/user';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { useSmartBack } from '../../hooks/useSmartBack';
import { useOnlineStatus } from '../../context/OnlineStatusContext';
import { OnlineStatusDot } from '../../components/OnlineStatusDot';
import { ImageViewer } from '../../components/ImageViewer';
import { AlbumImagePicker } from '../../components/AlbumImagePicker';
import { CHAT_STYLES, type ChatStyleKey } from '../../components/effects/chatStyles';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import type { Conversation } from '../../types';

interface ChatRoomProps {}

interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  type: string;
  is_read: number;
  is_recalled?: number;
  reply_to?: number | null;
  created_at: string;
  // 乐观上传占位字段
  _localUrl?: string;
  _uploading?: boolean;
  _uploadProgress?: number;
  _compressDone?: boolean;
  _uploadError?: boolean;
  _retryFile?: File;
}

const SYSTEM_BOT_ID = 9999;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_RECORD_SECONDS = 20;

function AudioBubble({ src, isSelf }: { src: string; isSelf: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const pipeIdx = src.lastIndexOf('|');
  const audioSrc = pipeIdx > 0 ? src.slice(0, pipeIdx) : src;
  const knownDuration = pipeIdx > 0 ? parseInt(src.slice(pipeIdx + 1)) || 0 : 0;
  const [loadedDuration, setLoadedDuration] = useState(0);
  const duration = knownDuration || loadedDuration;
  const toggle = () => { const a = audioRef.current; if (!a) return; playing ? a.pause() : a.play(); };
  const bars = [3, 5, 8, 6, 9, 7, 4, 6, 8, 5, 3];
  const progress = duration > 0 ? current / duration : 0;
  return (
    <div className={`flex items-center gap-2 min-w-[140px] max-w-[200px] ${isSelf ? 'flex-row-reverse' : ''}`}>
      <audio ref={audioRef} src={getMediaUrl(audioSrc)}
        onLoadedMetadata={() => setLoadedDuration(audioRef.current?.duration || 0)}
        onTimeUpdate={() => setCurrent(audioRef.current?.currentTime || 0)}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrent(0); }} />
      <button onClick={toggle} className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${isSelf ? 'bg-white/25 hover:bg-white/35' : 'bg-warm-100 hover:bg-warm-200'}`}>
        {playing ? <Pause size={14} className={isSelf ? 'text-white' : 'text-warm-600'} /> : <Play size={14} className={isSelf ? 'text-white' : 'text-warm-600'} />}
      </button>
      <div className={`flex items-center gap-[2px] flex-1 ${isSelf ? 'flex-row-reverse' : ''}`}>
        {bars.map((h, i) => (
          <div key={i} className={`rounded-full flex-shrink-0 transition-colors ${progress > 0 && i / bars.length < progress ? (isSelf ? 'bg-white' : 'bg-warm-500') : (isSelf ? 'bg-white/40' : 'bg-warm-300')}`} style={{ width: 3, height: h * 2 }} />
        ))}
      </div>
      <span className={`text-[11px] flex-shrink-0 ${isSelf ? 'text-white/70' : 'text-cream-500'}`}>{duration > 0 ? `${Math.ceil(duration)}″` : '…'}</span>
    </div>
  );
}

interface FloatingToolbarProps {
  msg: ChatMessage;
  pos: { top: number; left: number; isSelf: boolean };
  canRecall: boolean;
  isFavorited: boolean;
  onCopy: () => void;
  onSelectText: () => void;
  onQuote: () => void;
  onRecall: () => void;
  onFavorite: () => void;
}

function FloatingToolbar({ msg, pos, canRecall, isFavorited, onCopy, onSelectText, onQuote, onRecall, onFavorite }: FloatingToolbarProps) {
  const isText = msg.type === 'text';
  const items = [
    ...(isText ? [{ label: '复制', icon: <Copy size={16} />, action: onCopy, red: false }] : []),
    ...(isText ? [{ label: '选择', icon: <span className="text-[13px] font-bold">A</span>, action: onSelectText, red: false }] : []),
    { label: '引用', icon: <Quote size={16} />, action: onQuote, red: false },
    { label: isFavorited ? '取消收藏' : '收藏', icon: <Bookmark size={16} className={isFavorited ? 'fill-amber-400 text-amber-400' : ''} />, action: onFavorite, red: false },
    ...(canRecall ? [{ label: '撤回', icon: <RotateCcw size={16} />, action: onRecall, red: true }] : []),
  ];

  // toolbar width estimate: items * 56px
  const toolbarW = items.length * 56;
  const screenW = window.innerWidth;
  // position: above the bubble, aligned to bubble edge
  let left = pos.isSelf ? pos.left - toolbarW : pos.left;
  left = Math.max(8, Math.min(left, screenW - toolbarW - 8));
  const top = Math.max(60, pos.top - 56);

  return (
    <motion.div
      className="fixed z-[301] flex items-center bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
      style={{ top, left }}
      initial={{ opacity: 0, scale: 0.85, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 8 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          className={`flex flex-col items-center justify-center gap-0.5 px-3.5 py-2.5 transition-colors active:bg-gray-700 ${item.red ? 'text-red-400' : 'text-white'} ${i < items.length - 1 ? 'border-r border-gray-700' : ''}`}
          onClick={item.action}
        >
          {item.icon}
          <span className="text-[10px] leading-none">{item.label}</span>
        </button>
      ))}
    </motion.div>
  );
}

export function ChatRoom({}: ChatRoomProps) {
  const navigate = useNavigate();
  const goBack = useSmartBack('/messages');
  const { userId: userIdParam } = useParams<{ userId: string }>();
  const location = useLocation();
  const stateConv = (location.state as any)?.conversation as Conversation | undefined;
  const chatUserId = parseInt(userIdParam || '0');

  const [chatUser, setChatUser] = useState<{ id: string; name: string; avatar: string }>(() => {
    if (stateConv?.user) return stateConv.user;
    return { id: String(chatUserId), name: '...', avatar: '' };
  });
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewImageIndex, setViewImageIndex] = useState<number | null>(null);
  const chatImages = messages.filter(m => m.type === 'image' && !m.is_recalled).map(m => getMediaUrl(m.content));
  const [isFriend, setIsFriend] = useState(true);
  const [voiceMode, setVoiceMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  // Long-press toolbar
  const [selectedMsg, setSelectedMsg] = useState<ChatMessage | null>(null);
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number; isSelf: boolean } | null>(null);
  const [favoritedMsgIds, setFavoritedMsgIds] = useState<Set<number>>(new Set());
  const [selectingText, setSelectingText] = useState<ChatMessage | null>(null);
  // Reply
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  // Highlight message on jump
  const [highlightMsgId, setHighlightMsgId] = useState<number | null>(() => (location.state as any)?.jumpToMsgId ?? null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimerRef = useRef<number>(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { user } = useAuth();
  const chatStyle = CHAT_STYLES[(user?.chat_style || 'latte') as ChatStyleKey] || CHAT_STYLES.latte;
  const { sendMessage, markRead, on } = useSocket();
  const { getLastSeenText } = useOnlineStatus();

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => { if (!loadingMoreRef.current) scrollRef.current?.scrollTo({ top: 999999, behavior: 'instant' }); };
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const myAvatar = getMediaUrl(user?.avatar || '/default-avatar.png');
  const [kbOffset, setKbOffset] = useState(0);
  const [bottomBarH, setBottomBarH] = useState(60);
  const [inputFocused, setInputFocused] = useState(false);
  const bottomBarRef = useRef<HTMLDivElement>(null);
  const isTouchScrolling = useRef(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      // 额外加50px覆盖输入法扩展栏
      setKbOffset(offset > 0 ? offset + 50 : 0);
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update); };
  }, []);

  // 测量底部栏高度，给消息列表留出空间
  useEffect(() => {
    if (!bottomBarRef.current) return;
    const ro = new ResizeObserver(() => {
      if (bottomBarRef.current) setBottomBarH(bottomBarRef.current.offsetHeight);
    });
    ro.observe(bottomBarRef.current);
    return () => ro.disconnect();
  }, []);

  // Load chat user info if not provided via state
  useEffect(() => {
    if (!stateConv?.user && chatUserId) {
      getUserProfile(chatUserId).then((res: any) => {
        if (res.code === 0) {
          setChatUser({
            id: String(chatUserId),
            name: res.data.nickname || '',
            avatar: res.data.avatar ? getMediaUrl(res.data.avatar) : '',
          });
        }
      }).catch(() => {});
    }
  }, [chatUserId]);

  useEffect(() => {
    const load = async () => {
      pageRef.current = 1; hasMoreRef.current = true;
      try {
        const res: any = await getMessages(chatUserId, 1, 50);
        if (res.code === 0) {
          setMessages(res.data || []);
          if ((res.data || []).length < 50) hasMoreRef.current = false;
        }
        if (res.is_friend !== undefined) setIsFriend(res.is_friend);
      } catch { /* ignore */ }
      try {
        const favRes: any = await import('../../api/index').then(m => m.default.get('/api/favorites'));
        if (favRes.code === 0) {
          const ids = new Set<number>(favRes.data.filter((f: any) => f.msg_type === 'private').map((f: any) => Number(f.msg_id)));
          setFavoritedMsgIds(ids);
        }
      } catch { /* ignore */ }
    };
    load(); markRead(chatUserId);
  }, [chatUserId]);

  // --- Scroll to bottom logic (unified) ---
  const dataLoadedRef = useRef(false);
  const shouldScrollToBottomRef = useRef(true);
  const prevMsgCountRef = useRef(0);

  // Reset flags when switching chat
  useEffect(() => {
    dataLoadedRef.current = false;
    shouldScrollToBottomRef.current = true;
    prevMsgCountRef.current = 0;
  }, [chatUserId]);

  // 刚进入聊天时强制滚底，等用户真正滑动后才允许不滚底
  const autoScrollRef = useRef(true);
  useEffect(() => { autoScrollRef.current = true; }, [chatUserId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (!el) return;
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      autoScrollRef.current = dist < 120;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [chatUserId]);

  // 图片加载撑高 → 自动滚底
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (autoScrollRef.current && !loadingMoreRef.current && el) {
        el.scrollTo({ top: 999999, behavior: 'instant' });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [chatUserId]);

  // After initial load completes, scroll to bottom
  useEffect(() => {
    const jumpToMsgId = (location.state as any)?.jumpToMsgId;
    if (jumpToMsgId) return;
    if (messages.length === 0) return;

    if (!dataLoadedRef.current) {
      dataLoadedRef.current = true;
      prevMsgCountRef.current = messages.length;
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ top: 999999, behavior: 'instant' });
        }
      });
    } else if (messages.length > prevMsgCountRef.current) {
      prevMsgCountRef.current = messages.length;
      if (!loadingMoreRef.current) {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: 999999, behavior: 'smooth' });
          }
        });
      }
    } else {
      prevMsgCountRef.current = messages.length;
    }
  }, [messages.length, chatUserId]);

  useEffect(() => {
    const unsub = on('message:receive', (msg: ChatMessage) => {
      if (msg.sender_id === chatUserId) { setMessages(prev => [...prev, msg]); markRead(chatUserId); }
    });
    return unsub;
  }, [on, chatUserId]);

  useEffect(() => {
    const unsub = on('message:sent', (msg: ChatMessage) => {
      if (msg.receiver_id === chatUserId) {
        setMessages(prev => {
          // 替换已完成的临时占位消息（内容 URL 匹配）
          const tmpIdx = prev.findIndex(m => (m.id ?? 0) < 0 && !m._uploading && m.type === 'image' && m.content === msg.content);
          if (tmpIdx !== -1) {
            const copy = [...prev];
            copy[tmpIdx] = { ...msg };
            return copy;
          }
          return [...prev, msg];
        });
      }
    });
    return unsub;
  }, [on, chatUserId]);

  useEffect(() => {
    const unsub = on('message:error', (data: { message: string }) => { alert(data.message); });
    return unsub;
  }, [on]);

  // Listen for recall events
  useEffect(() => {
    const unsub = on('message:recalled', (data: { msgId: number }) => {
      setMessages(prev => prev.map(m => m.id === data.msgId ? { ...m, is_recalled: 1 } : m));
    });
    return unsub;
  }, [on]);

  const loadMoreMessages = async () => {
    if (!hasMoreRef.current || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    const container = scrollRef.current;
    const prevHeight = container?.scrollHeight ?? 0;
    try {
      const nextPage = pageRef.current + 1;
      const res: any = await getMessages(chatUserId, nextPage, 50);
      if (res.code === 0 && res.data?.length > 0) {
        pageRef.current = nextPage;
        setMessages(prev => [...res.data, ...prev]);
        if (res.data.length < 50) hasMoreRef.current = false;
        // restore scroll position
        requestAnimationFrame(() => {
          if (container) container.scrollTop = container.scrollHeight - prevHeight;
        });
      } else {
        hasMoreRef.current = false;
      }
    } catch { /* ignore */ }
    // 延迟清除标记，防止新图片 onLoad 触发滚底
    setTimeout(() => { loadingMoreRef.current = false; }, 800);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop < 60) loadMoreMessages();
    if (isTouchScrolling.current) inputRef.current?.blur();
  };

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage(chatUserId, message.trim(), 'text', replyTo?.id);
    setMessage('');
    setReplyTo(null);
    if (inputRef.current) { inputRef.current.style.height = 'auto'; }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (e.key === 'Enter' && !e.shiftKey && !isMobile) { e.preventDefault(); handleSend(); }
  };

  const startRecording = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        try { await navigator.mediaDevices.getUserMedia({ audio: true }).then(s => s.getTracks().forEach(t => t.stop())); } catch { /* pre-request */ }
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ['audio/webm', 'audio/mp4', 'audio/ogg', ''].find(t => !t || MediaRecorder.isTypeSupported(t)) || '';
      const mr = new MediaRecorder(stream, { audioBitsPerSecond: 32000, ...(mimeType ? { mimeType } : {}) });
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true); setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds(prev => { if (prev + 1 >= MAX_RECORD_SECONDS) { stopRecording(true); return prev + 1; } return prev + 1; });
      }, 1000);
    } catch { showToast('麦克风权限被拒绝'); }
  };

  const stopRecording = (send = false) => {
    if (!mediaRecorderRef.current) return;
    const mr = mediaRecorderRef.current;
    const duration = recordSeconds + 1;
    const mimeType = mr.mimeType || 'audio/webm';
    if (recordTimerRef.current) { clearInterval(recordTimerRef.current); recordTimerRef.current = null; }
    mr.onstop = async () => {
      mr.stream.getTracks().forEach(t => t.stop());
      if (send && audioChunksRef.current.length > 0) {
        await handleAudioUpload(new Blob(audioChunksRef.current, { type: mimeType }), duration);
      }
    };
    mr.stop(); mediaRecorderRef.current = null;
    setRecording(false); setRecordSeconds(0);
  };

  const handleAudioUpload = async (blob: Blob, duration: number) => {
    setUploading(true); setUploadProgress(0);
    const interval = setInterval(() => { setUploadProgress(prev => { if (prev >= 85) { clearInterval(interval); return 85; } return prev + 15; }); }, 80);
    try {
      const res: any = await uploadAudio(new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' }));
      clearInterval(interval); setUploadProgress(100);
      if (res.code === 0) sendMessage(chatUserId, `${res.data.url}|${duration}`, 'audio');
    } catch { clearInterval(interval); }
    setTimeout(() => { setUploading(false); setUploadProgress(0); }, 400);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) { showToast('图片大小不能超过5MB'); e.target.value = ''; return; }

    const tempId = -Date.now();
    const localUrl = URL.createObjectURL(file);
    // 从 localUrl 获取预览尺寸（立即显示）
    const probeImg = new Image();
    probeImg.onload = () => {
      let w = probeImg.naturalWidth, h = probeImg.naturalHeight;
      if (w > 210) { h = (h * 210) / w; w = 210; }
      if (h > 280) { w = (w * 280) / h; h = 280; }
    };
    probeImg.src = localUrl;

    // 选图后立即插入占位消息
    const tempMsg: ChatMessage = {
      id: tempId,
      sender_id: user!.id,
      receiver_id: chatUserId,
      content: localUrl,
      type: 'image',
      is_read: 1,
      created_at: new Date().toISOString(),
      _localUrl: localUrl,
      _uploading: true,
      _uploadProgress: 0,
      _retryFile: file,
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res: any = await uploadImage(file, (pct) => {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, _uploadProgress: pct } : m));
      });
      if (res.code === 0) {
        setMessages(prev => prev.map(m => {
          if (m.id === tempId) return { ...m, content: res.data.url, _uploading: false, _compressDone: true };
          return m;
        }));
        setTimeout(() => {
          setMessages(prev => prev.map(m => m.id === tempId ? { ...m, _compressDone: false } : m));
        }, 600);
        sendMessage(chatUserId, res.data.url, 'image', replyTo?.id);
      } else {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, _uploading: false, _uploadError: true } : m));
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, _uploading: false, _uploadError: true } : m));
    }
    e.target.value = '';
  };

  const retryImageUpload = async (msg: ChatMessage) => {
    if (!msg._retryFile) return;
    const tempId = msg.id;
    setMessages(prev => prev.map(m => m.id === tempId ? { ...m, _uploading: true, _uploadProgress: 0, _uploadError: false } : m));
    try {
      const res: any = await uploadImage(msg._retryFile, (pct) => {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, _uploadProgress: pct } : m));
      });
      if (res.code === 0) {
        setMessages(prev => prev.map(m => {
          if (m.id === tempId) return { ...m, content: res.data.url, _uploading: false, _compressDone: true };
          return m;
        }));
        setTimeout(() => {
          setMessages(prev => prev.map(m => m.id === tempId ? { ...m, _compressDone: false } : m));
        }, 600);
        sendMessage(chatUserId, res.data.url, 'image', replyTo?.id);
      } else {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, _uploading: false, _uploadError: true } : m));
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, _uploading: false, _uploadError: true } : m));
    }
  };

  const handleAlbumImageSelect = (url: string) => {
    sendMessage(chatUserId, url, 'image');
  };

  const handleRecall = async (msg: ChatMessage) => {
    setSelectedMsg(null); setToolbarPos(null);
    const res: any = await recallMessage(msg.id);
    if (res.code === 0) setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_recalled: 1 } : m));
    else alert(res.message || '撤回失败');
  };

  const handleFavorite = async (msg: ChatMessage) => {
    closeToolbar();
    try {
      const res: any = await import('../../api/index').then(m => m.default.post('/api/favorites/toggle', { msgId: msg.id, msgType: 'private' }));
      if (res.code === 0) {
        setFavoritedMsgIds(prev => {
          const next = new Set(prev);
          res.data.favorited ? next.add(msg.id) : next.delete(msg.id);
          return next;
        });
      }
    } catch { /* ignore */ }
  };

  const openToolbar = (msg: ChatMessage, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const isSelf = msg.sender_id === user?.id;
    setSelectedMsg(msg);
    setToolbarPos({ top: rect.top, left: isSelf ? rect.right : rect.left, isSelf });
  };

  const closeToolbar = () => { setSelectedMsg(null); setToolbarPos(null); };

  const canRecall = (msg: ChatMessage) => {
    if (msg.sender_id !== user?.id) return false;
    return (Date.now() - new Date(msg.created_at).getTime()) < 120000;
  };

  const getPreview = (msg: ChatMessage) => {
    if (msg.is_recalled) return '[已撤回]';
    if (msg.type === 'image') return '[图片]';
    if (msg.type === 'audio') return '[语音]';
    const text = msg.content.slice(0, 30);
    return msg.content.length > 30 ? text + '…' : text;
  };

  const jumpToMessage = (msgId: number) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightMsgId(msgId);
      setTimeout(() => setHighlightMsgId(null), 1500);
    }
  };

  // Jump to message — load more pages until found or exhausted
  const jumpSearchRef = useRef(false);
  useEffect(() => {
    const msgId = (location.state as any)?.jumpToMsgId;
    if (!msgId || messages.length === 0) return;
    const found = messages.some(m => m.id === msgId);
    if (found) {
      jumpSearchRef.current = false;
      requestAnimationFrame(() => jumpToMessage(msgId));
      // Clear the state so return visits don't re-trigger
      window.history.replaceState({ ...window.history.state, jumpToMsgId: undefined }, '');
    } else if (hasMoreRef.current && !loadingMoreRef.current && !jumpSearchRef.current) {
      jumpSearchRef.current = true;
      loadMoreMessages().then(() => { jumpSearchRef.current = false; });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(location.state as any)?.jumpToMsgId, messages.length]);

  const shouldShowTime = (current: ChatMessage, prev: ChatMessage | null) => {
    if (!prev) return true;
    return new Date(current.created_at).getTime() - new Date(prev.created_at).getTime() > 10 * 60 * 1000;
  };

  const formatTimeSeparator = (t: string) => {
    const d = new Date(t); const now = new Date();
    const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === now.toDateString()) return time;
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return `昨天 ${time}`;
    return `${d.getMonth() + 1}/${d.getDate()} ${time}`;
  };

  const hasText = message.trim().length > 0;

  // Find a message by id for reply preview
  const findMsg = (id: number | null | undefined) => id ? messages.find(m => m.id === id) : null;

  return (
    <>
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col md:relative md:inset-auto md:z-auto"
      style={{ backgroundColor: chatStyle.bg }}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <AnimatePresence>
        {toast && (
          <motion.div className="fixed top-[calc(var(--status-bar-height,0px)+8px)] left-1/2 -translate-x-1/2 z-[400] px-4 py-2 rounded-full bg-gray-800/90 text-white text-sm whitespace-nowrap"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <header className="flex items-center gap-2 px-3 pt-[calc(var(--status-bar-height,0px)+10px)] pb-2.5 backdrop-blur-xl border-b flex-shrink-0"
        style={{ background: chatStyle.headerBg, borderColor: chatStyle.otherBubbleBorder }}>
        <button className="p-2 rounded-lg hover:bg-black/5 transition-all" style={{ color: chatStyle.iconColor }} onClick={goBack}><ArrowLeft size={20} /></button>
        <div className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/user/${chatUserId}`)}>
          <div className="relative flex-shrink-0">
            <RemoteImage src={chatUser.avatar} alt={chatUser.name} className="w-9 h-9 rounded-full bg-cream-300" />
            <OnlineStatusDot userId={chatUserId} size={11} borderWidth={2} className="-bottom-[1px] -right-[1px]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[15px] font-medium text-cream-900 truncate">{chatUser.name}</span>
            <span className="text-[11px] text-sage-500">{getLastSeenText(chatUserId) || '在线'}</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button className="p-2 rounded-lg hover:bg-black/5 transition-all" style={{ color: chatStyle.iconColor }}><Phone size={18} /></button>
          <button className="p-2 rounded-lg hover:bg-black/5 transition-all" style={{ color: chatStyle.iconColor }} onClick={() => navigate(`/messages/chat/${chatUserId}/settings`, { state: { nickname: chatUser.name, avatar: chatUser.avatar } })}><MoreHorizontal size={18} /></button>
        </div>
      </header>

      {!isFriend && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center justify-center">
          <span className="text-xs text-amber-700">你还未添加对方为好友</span>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 pt-3" onClick={closeToolbar} onScroll={handleScroll}
        onTouchStart={() => { isTouchScrolling.current = true; }}
        onTouchEnd={() => { isTouchScrolling.current = false; }}
        style={{ paddingBottom: bottomBarH + kbOffset + 16 }}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-cream-600 text-xs">暂无消息，发送第一条吧</div>
        ) : messages.map((msg, index) => {
          const isSelf = msg.sender_id === user?.id;
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const replyMsg = findMsg(msg.reply_to);

          return (
            <div key={msg.id} id={`msg-${msg.id}`}>
              {shouldShowTime(msg, prevMsg) && (
                <div className="flex justify-center my-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px]" style={{ background: chatStyle.timeLabelBg, color: chatStyle.timeLabelText }}>{formatTimeSeparator(msg.created_at)}</span>
                </div>
              )}

              {/* Recalled message */}
              {msg.is_recalled ? (
                <div className="flex justify-center my-1">
                  <span className="text-[12px] text-cream-500 italic">
                    {isSelf ? '你撤回了一条消息' : `${chatUser.name}撤回了一条消息`}
                  </span>
                </div>
              ) : (
                <motion.div
                  className={`flex items-start gap-2.5 mb-3 max-w-[78%] ${isSelf ? 'self-end flex-row-reverse ml-auto' : 'self-start mr-auto'} ${highlightMsgId === msg.id ? 'ring-2 ring-warm-400 ring-offset-2 rounded-2xl bg-warm-50/50 transition-all duration-300' : ''}`}
                  initial={false} animate={{ opacity: 1, y: 0 }}
                >
                  <RemoteImage src={isSelf ? myAvatar : chatUser.avatar} alt=""
                    onClick={!isSelf ? () => navigate(`/user/${chatUserId}`) : undefined}
                    className={`w-8 h-8 rounded-full flex-shrink-0 bg-cream-300 ${!isSelf ? 'cursor-pointer active:opacity-70' : ''}`}
                  />
                  {msg.type === 'image' ? (
                    <ChatImage
                      src={msg._localUrl || getMediaUrl(msg.content)}
                      maxWidth={210}
                      maxHeight={280}
                      uploading={msg._uploading}
                      uploadProgress={msg._uploadProgress}
                      compressDone={msg._compressDone}
                      uploadError={msg._uploadError}
                      onRetry={msg._uploadError ? () => retryImageUpload(msg) : undefined}
                      onClick={() => { if (!msg._uploading && !msg._uploadError) setViewImageIndex(chatImages.indexOf(getMediaUrl(msg.content))); }}
                      onLoad={scrollToBottom}
                    />
                  ) : (
                  <div
                    className="rounded-[10px] overflow-hidden"
                    style={isSelf ? { background: chatStyle.selfBubbleGradient, color: chatStyle.selfText } : { background: chatStyle.otherBubble, color: chatStyle.otherText }}
                    onTouchStart={(e) => {
                      const el = e.currentTarget;
                      longPressTimerRef.current = setTimeout(() => {
                        window.getSelection()?.removeAllRanges();
                        openToolbar(msg, el);
                      }, 500);
                    }}
                    onTouchEnd={() => { if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; } }}
                    onTouchMove={() => { if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; } }}
                    onContextMenu={(e) => { e.preventDefault(); openToolbar(msg, e.currentTarget); }}
                  >
                    {/* Reply preview */}
                    {replyMsg && (
                      <div className={`px-3 pt-2 pb-1 border-b ${isSelf ? 'border-white/20' : ''}`} style={isSelf ? {} : { borderColor: chatStyle.otherBubbleBorder }}>
                        <div className={`text-[11px] truncate ${isSelf ? 'text-white/60' : ''}`} style={isSelf ? {} : { color: chatStyle.iconColor }}>
                          {replyMsg.sender_id === user?.id ? '你' : chatUser.name}：{getPreview(replyMsg)}
                        </div>
                      </div>
                    )}
                    <div className="px-3 py-2.5">
                      {msg.type === 'audio' ? (
                        <AudioBubble src={msg.content} isSelf={isSelf} />
                      ) : (
                        <LinkifyText text={msg.content} linkColor={isSelf ? chatStyle.selfText : chatStyle.selfBubble} className="text-[14px] leading-relaxed break-words whitespace-pre-wrap" />
                      )}
                    </div>
                  </div>
                  )}
                </motion.div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} style={{ height: 1, flexShrink: 0 }} />
      </div>

      {/* Bottom bar — fixed, follows visualViewport to stay above keyboard/toolbar */}
      <div ref={bottomBarRef} className="fixed left-0 right-0 z-[100] border-t"
        style={{ background: chatStyle.tabBarBg, borderColor: chatStyle.tabBarBorder, bottom: kbOffset }}>
        {/* Upload progress */}
        {uploading && (
          <div className="px-4 py-2 bg-cream-100 border-b border-cream-200 flex items-center gap-2">
            <Loader2 size={16} className="animate-spin text-warm-500" />
            <div className="flex-1 h-1.5 bg-cream-300 rounded-full overflow-hidden">
              <div className="h-full bg-warm-500 rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
            </div>
            <span className="text-xs text-cream-700">{uploadProgress}%</span>
          </div>
        )}

        {/* Reply bar */}
        {replyTo && (
          <div className="px-3 py-2 bg-cream-50 border-b border-cream-200 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-warm-600 font-medium">{replyTo.sender_id === user?.id ? '回复自己' : `回复 ${chatUser.name}`}</p>
              <p className="text-[12px] text-cream-600 truncate">{getPreview(replyTo)}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="p-1 text-cream-500 hover:text-cream-700"><X size={16} /></button>
          </div>
        )}

        {/* Input */}
        {chatUserId === SYSTEM_BOT_ID ? (
          <div className="px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] flex items-center justify-center">
            <span className="text-xs text-cream-500">系统通知，无法回复</span>
          </div>
        ) : (
        <div className="px-2.5 py-2 pb-[calc(8px+env(safe-area-inset-bottom))]">
          <div className="flex items-end gap-1.5">
            <button className="p-2 transition-colors flex-shrink-0"
              style={{ color: chatStyle.iconColor }}
              onClick={async () => {
                if (!voiceMode) { try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getTracks().forEach(t => t.stop()); } catch { /* denied */ } }
                setVoiceMode(v => !v);
              }}>
              {voiceMode ? <Keyboard size={22} /> : <Mic size={22} />}
            </button>

            {voiceMode ? (
              <button
                className={`flex-1 h-10 rounded-xl text-sm font-semibold select-none transition-all ${recording ? 'bg-red-500 text-white scale-[0.97]' : ''}`}
                style={recording ? {} : { background: chatStyle.inputBg, color: chatStyle.iconColor }}
                onTouchStart={(e) => { e.preventDefault(); holdTimerRef.current = Date.now() as any; if (!recording) startRecording(); }}
                onTouchEnd={(e) => { e.preventDefault(); const held = Date.now() - (holdTimerRef.current as any || Date.now()); if (held >= 300) stopRecording(true); }}
                onTouchCancel={(e) => { e.preventDefault(); stopRecording(false); }}
                onClick={() => { if (recording) stopRecording(true); else startRecording(); }}
                onMouseLeave={() => { if (recording) stopRecording(false); }}
              >
                {recording ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span className="w-2 h-2 rounded-full bg-white" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                    {MAX_RECORD_SECONDS - recordSeconds}s
                  </span>
                ) : '按住 说话'}
              </button>
            ) : (
              <div className="flex-1 min-w-0 flex items-end gap-1.5 px-3 py-2 rounded-xl transition-all"
                style={{ background: chatStyle.inputBg }}>
                <textarea ref={inputRef} rows={1} className="flex-1 min-w-0 text-sm py-0.5 bg-transparent leading-5 resize-none overflow-hidden"
                  style={{ color: chatStyle.otherText }}
                  placeholder="输入消息..." value={message}
                  onFocus={() => { setInputFocused(true); setShowEmoji(false); setShowTools(false); }}
                  onBlur={() => setInputFocused(false)}
                  onChange={(e) => { setMessage(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }} onKeyDown={handleKeyDown} />
                {hasText && (
                  <button className="flex-shrink-0 px-4 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95" style={{ background: chatStyle.sendBtnGradient, color: chatStyle.sendBtnText, boxShadow: chatStyle.sendBtnShadow }} onMouseDown={e => e.preventDefault()} onClick={handleSend}>发送</button>
                )}
              </div>
            )}

            {!voiceMode && (
              <>
                <button className="p-2 transition-colors flex-shrink-0"
                  style={{ color: chatStyle.iconColor }}
                  onClick={() => { setShowEmoji(v => !v); setShowTools(false); }}>
                  <Smile size={22} />
                </button>
                <button className="p-2 transition-colors flex-shrink-0"
                  style={{ color: chatStyle.iconColor }}
                  onClick={() => { setShowTools(v => !v); setShowEmoji(false); }}>
                  <Plus size={22} style={{ transform: showTools ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </button>
              </>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload}
              style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }} />
          </div>
        </div>
        )}
        {/* 扩展栏垫块：输入框聚焦时插入白板，撑开底部栏覆盖输入法扩展栏 */}
        {inputFocused && <div className="h-[45px]" style={{ background: chatStyle.tabBarBg }} />}

        {/* Emoji / Tool panels — below input, push bottom bar upward */}
        <AnimatePresence>
          {showEmoji && <EmojiPicker onSelect={e => setMessage(prev => prev + e)} />}
        </AnimatePresence>
        <AnimatePresence>
          {showTools && (
            <ChatToolPanel
              onPickImage={() => { setShowTools(false); fileInputRef.current?.click(); }}
              onPickAlbum={() => { setShowTools(false); setShowAlbumPicker(true); }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Floating toolbar */}
      <AnimatePresence>
        {selectedMsg && toolbarPos && (
          <>
            <motion.div className="fixed inset-0 z-[300]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ background: 'rgba(0,0,0,0.15)' }} onClick={closeToolbar} />
            <FloatingToolbar
              msg={selectedMsg}
              pos={toolbarPos}
              canRecall={canRecall(selectedMsg)}
              isFavorited={favoritedMsgIds.has(selectedMsg.id)}
              onCopy={() => { copyText(selectedMsg.content); showToast('已复制'); closeToolbar(); }}
              onSelectText={() => { setSelectingText(selectedMsg); closeToolbar(); }}
              onQuote={() => { setReplyTo(selectedMsg); closeToolbar(); }}
              onRecall={() => handleRecall(selectedMsg)}
              onFavorite={() => handleFavorite(selectedMsg)}
            />
          </>
        )}
      </AnimatePresence>

      {/* Select text modal */}
      <AnimatePresence>
        {selectingText && (
          <>
            <motion.div className="fixed inset-0 z-[300] bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectingText(null)} />
            <motion.div className="fixed inset-x-6 z-[301] bg-white rounded-2xl shadow-xl p-4 flex flex-col gap-3"
              style={{ top: '30%', maxHeight: '50vh' }}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
              <p className="text-xs text-cream-500 font-medium">选择文本</p>
              <p className="text-sm text-cream-900 leading-relaxed select-text overflow-y-auto break-words" style={{ userSelect: 'text', WebkitUserSelect: 'text' }}>{selectingText.content}</p>
              <button className="self-end px-4 py-1.5 rounded-full bg-warm-500 text-white text-xs" onClick={() => setSelectingText(null)}>完成</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewImageIndex !== null && <ImageViewer images={chatImages} initialIndex={viewImageIndex} onClose={() => setViewImageIndex(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showAlbumPicker && (
          <AlbumImagePicker onSelect={handleAlbumImageSelect} onClose={() => setShowAlbumPicker(false)} />
        )}
      </AnimatePresence>
    </motion.div>
    </>
  );
}
