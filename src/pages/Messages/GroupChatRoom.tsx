import { RemoteImage } from '../../components/RemoteImage';
import { ChatImage } from '../../components/ChatImage';
import { LinkifyText } from '../../components/LinkifyText';
import { EmojiPicker } from '../../components/EmojiPicker';
import { ChatToolPanel } from '../../components/ChatToolPanel';
import { BroadcastPopup } from '../../components/BroadcastPopup';
import { copyText } from '../../utils/clipboard';
import { getMediaUrl } from '../../utils/mediaUrl';
import { Capacitor } from '@capacitor/core';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Menu, Smile, Plus, Loader2, Copy, Quote, RotateCcw, X, Mic, Keyboard, Play, Pause, Crown, Shield, Bookmark } from 'lucide-react';
import { getGroupMessages, uploadGroupImage, uploadGroupAudio, markGroupRead, recallGroupMessage, getBroadcastNotice, getGroupDetail, getGroupMutes } from '../../api/groups';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { useSmartBack } from '../../hooks/useSmartBack';
import { ImageViewer } from '../../components/ImageViewer';
import { AlbumImagePicker } from '../../components/AlbumImagePicker';
import { CHAT_STYLES, type ChatStyleKey } from '../../components/effects/chatStyles';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

interface GroupChatRoomProps {}

interface GroupInfo {
  name: string;
  avatar: string;
  member_count?: number;
}

interface GMessage {
  id: number;
  group_id: number;
  sender_id: number;
  content: string;
  type: string;
  is_read?: number;
  is_recalled?: number;
  reply_to?: number | null;
  created_at: string;
  sender_nickname?: string;
  sender_avatar?: string;
  // 乐观上传占位字段
  _localUrl?: string;
  _uploading?: boolean;
  _uploadProgress?: number;
  _compressDone?: boolean;
  _uploadError?: boolean;
  _retryFile?: File;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_RECORD_SECONDS = 20;

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <motion.div
      className={`fixed top-16 left-1/2 -translate-x-1/2 z-[400] px-4 py-2 rounded-full text-white text-sm font-medium shadow-lg ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}
      initial={{ opacity: 0, y: -8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.9 }}
    >
      {msg}
    </motion.div>
  );
}

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

interface GroupMemberBasic {
  id: number;
  nickname: string;
  avatar: string;
  role?: 'owner' | 'admin' | 'member';
  level?: number;
}

// 将消息内容中的 @[id] 渲染为 @昵称，支持点击跳转用户主页
function renderMentions(content: string, members: GroupMemberBasic[], nav: (path: string) => void, linkColor?: string, mentionColor?: string) {
  const mc = mentionColor || linkColor || '#2563eb';
  const lc = linkColor || '#2563eb';
  const parts = content.split(/(@\[\d+\])/g);
  return parts.map((part, i) => {
    const m = part.match(/^@\[(\d+)\]$/);
    if (m) {
      const id = parseInt(m[1]);
      if (id === 0) return <span key={i} className="font-medium" style={{ color: mc }}>@全体成员</span>;
      const member = members.find(mb => mb.id === id);
      return (
        <span
          key={i}
          className="font-medium cursor-pointer active:opacity-70 underline decoration-dotted underline-offset-2"
          style={{ color: mc }}
          onClick={(e) => { e.stopPropagation(); nav(`/user/${id}`); }}
        >
          @{member?.nickname || id}
        </span>
      );
    }
    return <LinkifyText key={i} text={part} inline linkColor={lc} />;
  });
}

export function GroupChatRoom({}: GroupChatRoomProps) {
  const navigate = useNavigate();
  const goBack = useSmartBack('/messages');
  const { groupId: groupIdParam } = useParams<{ groupId: string }>();
  const location = useLocation();
  const groupId = parseInt(groupIdParam || '0');
  const stateInfo = location.state as { groupName?: string; groupAvatar?: string; memberCount?: number; jumpToMsgId?: number } | undefined;

  const [groupInfo, setGroupInfo] = useState<GroupInfo>({
    name: stateInfo?.groupName || '...',
    avatar: stateInfo?.groupAvatar || '',
    member_count: stateInfo?.memberCount,
  });
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<GMessage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewImageIndex, setViewImageIndex] = useState<number | null>(null);
  const chatImages = messages.filter(m => m.type === 'image' && !m.is_recalled).map(m => getMediaUrl(m.content));
  const [replyTo, setReplyTo] = useState<GMessage | null>(null);
  const [selectedMsg, setSelectedMsg] = useState<GMessage | null>(null);
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number; isSelf: boolean } | null>(null);
  const [favoritedMsgIds, setFavoritedMsgIds] = useState<Set<number>>(new Set());
  const [selectingText, setSelectingText] = useState<GMessage | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [broadcastNotice, setBroadcastNotice] = useState<{ id: number; title: string; content: string; author_name: string; author_avatar: string; created_at: string; images?: string } | null>(null);
  const [showBroadcast, setShowBroadcast] = useState(false);

  // Check if broadcast should re-prompt (5 min cooldown)
  const broadcastKey = `az_broadcast_${groupId}`;
  const shouldShowBroadcast = (notice: typeof broadcastNotice) => {
    if (!notice) return false;
    try {
      const stored = JSON.parse(localStorage.getItem(broadcastKey) || '{}');
      // If already read, never show
      if (stored.readNoticeId === notice.id) return false;
      // If dismissed within 5 minutes, don't show
      if (stored.dismissedNoticeId === notice.id && stored.dismissedAt) {
        const elapsed = Date.now() - stored.dismissedAt;
        if (elapsed < 5 * 60 * 1000) return false;
      }
    } catch { }
    return true;
  };
  const [members, setMembers] = useState<GroupMemberBasic[]>([]);
  const [mentionList, setMentionList] = useState<GroupMemberBasic[]>([]);
  const [showMention, setShowMention] = useState(false);
  const [highlightMsgId, setHighlightMsgId] = useState<number | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [banConfirm, setBanConfirm] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimerRef = useRef<number>(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => { if (!loadingMoreRef.current) scrollRef.current?.scrollTo({ top: 999999, behavior: 'instant' }); };
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isTouchScrolling = useRef(false);

  const { user } = useAuth();
  const chatStyle = CHAT_STYLES[(user?.chat_style || 'latte') as ChatStyleKey] || CHAT_STYLES.latte;
  const { sendGroupMessage, on } = useSocket();
  const [kbOffset, setKbOffset] = useState(0);
  const [bottomBarH, setBottomBarH] = useState(60);
  const [inputFocused, setInputFocused] = useState(false);
  const bottomBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKbOffset(offset > 0 ? offset + 50 : 0);
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update); };
  }, []);

  useEffect(() => {
    if (!bottomBarRef.current) return;
    const ro = new ResizeObserver(() => {
      if (bottomBarRef.current) setBottomBarH(bottomBarRef.current.offsetHeight);
    });
    ro.observe(bottomBarRef.current);
    return () => ro.disconnect();
  }, []);

  // 刚进入聊天时强制滚底，等用户真正滑动后才允许不滚底
  const autoScrollRef = useRef(true);
  useEffect(() => { autoScrollRef.current = true; }, [groupId]);

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
  }, [groupId]);

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
  }, [groupId]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2000);
  };

  const jumpToMessage = (msgId: number) => {
    const el = document.getElementById(`gmsg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightMsgId(msgId);
      setTimeout(() => setHighlightMsgId(null), 1500);
    }
  };

  useEffect(() => {
    const load = async () => {
      pageRef.current = 1; hasMoreRef.current = true;
      try {
        const [msgRes, groupRes, noticeRes]: any[] = await Promise.all([
          getGroupMessages(groupId, 1, 50),
          getGroupDetail(groupId),
          getBroadcastNotice(groupId),
        ]);
        if (msgRes.code === 0) {
          setMessages(msgRes.data || []);
          if ((msgRes.data || []).length < 50) hasMoreRef.current = false;
        }
        // 加载收藏状态
        try {
          const favRes: any = await import('../../api/index').then(m => m.default.get('/api/favorites'));
          if (favRes.code === 0) {
            const ids = new Set<number>(favRes.data.filter((f: any) => f.msg_type === 'group').map((f: any) => Number(f.msg_id)));
            setFavoritedMsgIds(ids);
          }
        } catch { /* ignore */ }
        if (groupRes.data) {
          setGroupInfo({
            name: groupRes.data.name || groupInfo.name,
            avatar: groupRes.data.avatar || groupInfo.avatar,
            member_count: groupRes.data.members?.length ?? groupRes.data.member_count,
          });
          if (groupRes.data.is_banned) setIsBanned(true);
          setMyRole(groupRes.data.my_role || null);
        }
        if (groupRes.data?.members) {
          setMembers(groupRes.data.members.map((m: any) => ({ id: m.id, nickname: m.nickname, avatar: m.avatar, role: m.role, level: m.level })));
        }
        // 检查当前用户是否被禁言
        try {
          const uid = (JSON.parse(localStorage.getItem('az_user') || '{}').id || 0);
          const muteRes: any = await getGroupMutes(groupId);
          if (muteRes.code === 0 || muteRes.data) {
            const myMute = (muteRes.data || []).find((m: any) => m.user_id === uid);
            if (myMute) { setIsMuted(true); setMutedUntil(myMute.muted_until); }
          }
        } catch { /* ignore */ }
        await markGroupRead(groupId);
        window.dispatchEvent(new CustomEvent('messages_unread_update'));
        if (noticeRes.code === 0 && noticeRes.data) {
          setBroadcastNotice(noticeRes.data);
          if (shouldShowBroadcast(noticeRes.data)) setShowBroadcast(true);
        }
      } catch { }
    };
    load();
  }, [groupId]);

  useEffect(() => {
    const unsub = on('group:message:receive', (msg: GMessage) => {
      if (msg.group_id === groupId) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          // 替换已完成的临时占位消息（内容 URL 匹配）
          const tmpIdx = prev.findIndex(m => (m.id ?? 0) < 0 && !m._uploading && m.type === 'image' && m.content === msg.content);
          if (tmpIdx !== -1) {
            const copy = [...prev];
            copy[tmpIdx] = { ...msg };
            return copy;
          }
          return [...prev, msg];
        });
        markGroupRead(groupId).then(() => {
          window.dispatchEvent(new CustomEvent('messages_unread_update'));
        }).catch(() => {});
      }
    });
    return unsub;
  }, [on, groupId]);

  useEffect(() => {
    const unsub = on('group:message:recalled', (data: { msgId: number; groupId: number }) => {
      if (data.groupId === groupId) {
        setMessages(prev => prev.map(m => m.id === data.msgId ? { ...m, is_recalled: 1 } : m));
      }
    });
    return unsub;
  }, [on, groupId]);

  // 实时禁言/解禁通知
  const [isMuted, setIsMuted] = useState(false);
  const [mutedUntil, setMutedUntil] = useState<string | null>(null);
  useEffect(() => {
    const uid = (JSON.parse(localStorage.getItem('az_user') || '{}').id || 0);
    const unsub1 = on('group:member_muted', (data: { groupId: number; userId: number; mutedUntil: string | null }) => {
      if (data.groupId === groupId && data.userId === uid) {
        setIsMuted(true);
        setMutedUntil(data.mutedUntil);
      }
    });
    const unsub2 = on('group:member_unmuted', (data: { groupId: number; userId: number }) => {
      if (data.groupId === groupId && data.userId === uid) {
        setIsMuted(false);
        setMutedUntil(null);
      }
    });
    return () => { unsub1(); unsub2(); };
  }, [on, groupId]);

  // 实时广播通知
  useEffect(() => {
    const unsub = on('group:broadcast', (data: any) => {
      if (data.groupId !== groupId) return;
      if (data.notice === null) {
        // Broadcast cleared
        setBroadcastNotice(null);
        setShowBroadcast(false);
        localStorage.removeItem(broadcastKey);
      } else if (data.notice) {
        setBroadcastNotice(data.notice);
        // New broadcast - always show immediately
        try {
          const stored = JSON.parse(localStorage.getItem(broadcastKey) || '{}');
          if (stored.readNoticeId === data.notice.id) {
            // Already read, don't show
          } else {
            setShowBroadcast(true);
          }
        } catch { setShowBroadcast(true); }
      }
    });
    return unsub;
  }, [on, groupId, broadcastKey]);

  // --- Unified scroll-to-bottom logic ---
  const dataLoadedRef = useRef(false);
  const prevGroupMsgCountRef = useRef(0);

  useEffect(() => {
    dataLoadedRef.current = false;
    prevGroupMsgCountRef.current = 0;
  }, [groupId]);

  useEffect(() => {
    if (stateInfo?.jumpToMsgId) return; // jump target handles its own scroll
    if (messages.length === 0) return;

    if (!dataLoadedRef.current) {
      dataLoadedRef.current = true;
      prevGroupMsgCountRef.current = messages.length;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        });
      });
    } else if (messages.length > prevGroupMsgCountRef.current) {
      prevGroupMsgCountRef.current = messages.length;
      if (!loadingMoreRef.current) {
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        });
      }
    } else {
      prevGroupMsgCountRef.current = messages.length;
    }
  }, [messages.length, groupId]);

  const loadMoreMessages = async () => {
    if (!hasMoreRef.current || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    const container = scrollRef.current;
    const prevHeight = container?.scrollHeight ?? 0;
    try {
      const nextPage = pageRef.current + 1;
      const res: any = await getGroupMessages(groupId, nextPage, 50);
      if (res.code === 0 && res.data?.length > 0) {
        pageRef.current = nextPage;
        setMessages(prev => [...res.data, ...prev]);
        if (res.data.length < 50) hasMoreRef.current = false;
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

  // 从群信息页搜索跳转回来时，跳转到指定消息
  const groupJumpSearchRef = useRef(false);
  useEffect(() => {
    const msgId = stateInfo?.jumpToMsgId;
    if (!msgId || messages.length === 0) return;
    const found = messages.some(m => m.id === msgId);
    if (found) {
      groupJumpSearchRef.current = false;
      requestAnimationFrame(() => jumpToMessage(msgId));
      window.history.replaceState({ ...window.history.state, jumpToMsgId: undefined }, '');
    } else if (hasMoreRef.current && !loadingMoreRef.current && !groupJumpSearchRef.current) {
      groupJumpSearchRef.current = true;
      loadMoreMessages().then(() => { groupJumpSearchRef.current = false; });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateInfo?.jumpToMsgId, messages.length]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendGroupMessage(groupId, resolveMentions(message.trim()), 'text', replyTo?.id);
    setMessage('');
    setReplyTo(null);
    setShowMention(false);
    if (inputRef.current) { inputRef.current.style.height = 'auto'; };
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (e.key === 'Enter' && !e.shiftKey && !isMobile) { e.preventDefault(); handleSend(); }
    if (e.key === 'Escape') setShowMention(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMessage(val);
    // 检测最后一个@后的内容
    const cursor = e.target.selectionStart ?? val.length;
    const before = val.slice(0, cursor);
    const atIdx = before.lastIndexOf('@');
    if (atIdx !== -1 && (atIdx === 0 || !/\w/.test(before[atIdx - 1]))) {
      const query = before.slice(atIdx + 1);
      if (!query.includes(' ')) {
        const filtered = members.filter(m => m.id !== user?.id && m.nickname.toLowerCase().includes(query.toLowerCase()));
        const allMatch = '全体成员'.includes(query);
        setMentionList(allMatch ? [{ id: 0, nickname: '全体成员', avatar: '', role: 'member' as const } as GroupMemberBasic, ...filtered] : filtered);
        setShowMention(allMatch || filtered.length > 0);
        return;
      }
    }
    setShowMention(false);
  };

  const mentionMapRef = useRef<Map<string, number>>(new Map());

  const insertMention = (member: GroupMemberBasic) => {
    const cursor = inputRef.current?.selectionStart ?? message.length;
    const before = message.slice(0, cursor);
    const atIdx = before.lastIndexOf('@');
    mentionMapRef.current.set(member.nickname, member.id);
    const newMsg = message.slice(0, atIdx) + `@${member.nickname}` + ' ' + message.slice(cursor);
    setMessage(newMsg);
    setShowMention(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const insertMentionAll = () => {
    const cursor = inputRef.current?.selectionStart ?? message.length;
    const before = message.slice(0, cursor);
    const atIdx = before.lastIndexOf('@');
    mentionMapRef.current.set('全体成员', 0);
    const newMsg = message.slice(0, atIdx) + '@全体成员' + ' ' + message.slice(cursor);
    setMessage(newMsg);
    setShowMention(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const triggerMentionFromAvatar = (member: GroupMemberBasic) => {
    mentionMapRef.current.set(member.nickname, member.id);
    const newMsg = message + `@${member.nickname}` + ' ';
    setMessage(newMsg);
    setShowMention(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Resolve @nickname → @[id] before sending
  const resolveMentions = (text: string): string => {
    let result = text;
    mentionMapRef.current.forEach((id, nickname) => {
      result = result.replace(new RegExp(`@${nickname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), `@[${id}]`);
    });
    mentionMapRef.current.clear();
    return result;
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
        setRecordSeconds(prev => {
          if (prev + 1 >= MAX_RECORD_SECONDS) { stopRecording(true); return prev + 1; }
          return prev + 1;
        });
      }, 1000);
    } catch { showToast('麦克风权限被拒绝', 'error'); }
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
      const res: any = await uploadGroupAudio(new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' }));
      clearInterval(interval); setUploadProgress(100);
      if (res.code === 0) sendGroupMessage(groupId, `${res.data.url}|${duration}`, 'audio');
    } catch { clearInterval(interval); showToast('语音发送失败', 'error'); }
    setTimeout(() => { setUploading(false); setUploadProgress(0); }, 400);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) { showToast('图片大小不能超过5MB', 'error'); e.target.value = ''; return; }

    const tempId = -Date.now();
    const localUrl = URL.createObjectURL(file);

    const tempMsg: GMessage = {
      id: tempId,
      group_id: groupId,
      sender_id: user!.id,
      content: localUrl,
      type: 'image',
      is_read: 1,
      created_at: new Date().toISOString(),
      sender_nickname: user?.nickname,
      sender_avatar: user?.avatar,
      _localUrl: localUrl,
      _uploading: true,
      _uploadProgress: 0,
      _retryFile: file,
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res: any = await uploadGroupImage(file, (pct) => {
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
        sendGroupMessage(groupId, res.data.url, 'image', replyTo?.id);
      } else {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, _uploading: false, _uploadError: true } : m));
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, _uploading: false, _uploadError: true } : m));
    }
    e.target.value = '';
  };

  const retryGroupImageUpload = async (msg: GMessage) => {
    if (!msg._retryFile) return;
    const tempId = msg.id;
    setMessages(prev => prev.map(m => m.id === tempId ? { ...m, _uploading: true, _uploadProgress: 0, _uploadError: false } : m));
    try {
      const res: any = await uploadGroupImage(msg._retryFile, (pct) => {
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
        sendGroupMessage(groupId, res.data.url, 'image', replyTo?.id);
      } else {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, _uploading: false, _uploadError: true } : m));
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, _uploading: false, _uploadError: true } : m));
    }
  };

  const handleAlbumImageSelect = (url: string) => {
    sendGroupMessage(groupId, url, 'image');
  };

  const openToolbar = (msg: GMessage, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const isSelf = msg.sender_id === user?.id;
    setSelectedMsg(msg);
    setToolbarPos({ top: rect.top, left: isSelf ? rect.right : rect.left, isSelf });
  };

  const closeToolbar = () => { setSelectedMsg(null); setToolbarPos(null); };

  const handleGroupFavorite = async (msg: GMessage) => {
    closeToolbar();
    try {
      const res: any = await import('../../api/index').then(m => m.default.post('/api/favorites/toggle', { msgId: msg.id, msgType: 'group' }));
      if (res.code === 0) {
        setFavoritedMsgIds(prev => {
          const next = new Set(prev);
          res.data.favorited ? next.add(msg.id) : next.delete(msg.id);
          return next;
        });
        showToast(res.data.favorited ? '已收藏' : '已取消收藏');
      }
    } catch { /* ignore */ }
  };

  const getPreview = (msg: GMessage) => {
    if (msg.is_recalled) return '[已撤回]';
    if (msg.type === 'image') return '[图片]';
    if (msg.type === 'audio') return '[语音]';
    const text = msg.content.slice(0, 30);
    return msg.content.length > 30 ? text + '…' : text;
  };

  const shouldShowTime = (current: GMessage, prev: GMessage | null) => {
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

  const findMsg = (id: number | null | undefined) => id ? messages.find(m => m.id === id) : null;
  const hasText = message.trim().length > 0;

  return (
    <>
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col md:relative md:inset-auto md:z-auto"
      style={{ backgroundColor: chatStyle.bg }}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </AnimatePresence>

      {/* 群聊封禁弹窗 */}
      {isBanned && !banConfirm && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-5 mx-4 max-w-xs w-full space-y-3">
            <div className="flex flex-col items-center gap-2 pb-1">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Shield size={22} className="text-red-500" />
              </div>
              <p className="text-sm font-semibold text-cream-900">该群聊已被封禁</p>
              <p className="text-xs text-cream-500 text-center">此群聊已被管理员封禁，无法发送消息，请联系管理员</p>
            </div>
            <div className="flex gap-2">
              <button onClick={goBack}
                className="flex-1 py-2.5 rounded-xl border border-cream-200 text-sm text-cream-700">取消</button>
              <button onClick={() => setBanConfirm(true)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium">
                {myRole === 'owner' ? '解散群聊' : '退出群聊'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 二次确认弹窗 */}
      {isBanned && banConfirm && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-5 mx-4 max-w-xs w-full space-y-3">
            <p className="text-sm font-semibold text-cream-900">
              {myRole === 'owner' ? '确认解散该群聊？此操作不可恢复。' : '确认退出该群聊？'}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setBanConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-cream-200 text-sm text-cream-700">返回</button>
              <button onClick={async () => {
                try {
                  if (myRole === 'owner') {
                    const { dismissGroup } = await import('../../api/groups');
                    await dismissGroup(groupId);
                  } else {
                    const { leaveGroup } = await import('../../api/groups');
                    await leaveGroup(groupId);
                  }
                } catch { /* ignore */ }
                goBack();
              }} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium">
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast popup */}
      <AnimatePresence>
        {broadcastNotice && showBroadcast && (
          <BroadcastPopup
            groupId={groupId}
            notice={broadcastNotice}
            onDismiss={() => {
              setShowBroadcast(false);
              // Record dismissal for 5-min cooldown
              const stored = JSON.parse(localStorage.getItem(broadcastKey) || '{}');
              localStorage.setItem(broadcastKey, JSON.stringify({
                ...stored,
                dismissedNoticeId: broadcastNotice.id,
                dismissedAt: Date.now(),
              }));
            }}
            onViewDetail={() => {
              setShowBroadcast(false);
              // Mark as read in localStorage
              localStorage.setItem(broadcastKey, JSON.stringify({ readNoticeId: broadcastNotice.id }));
            }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex items-center gap-2 px-3 pt-[calc(var(--status-bar-height,0px)+10px)] pb-2.5 backdrop-blur-xl border-b flex-shrink-0"
        style={{ background: chatStyle.headerBg, borderColor: chatStyle.otherBubbleBorder }}>
        <button className="p-2 rounded-lg hover:bg-black/5 transition-all" style={{ color: chatStyle.iconColor }} onClick={goBack}><ArrowLeft size={20} /></button>
        <div className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/messages/group/${groupId}/info`)}>
          <RemoteImage src={getMediaUrl(groupInfo.avatar)} alt={groupInfo.name} className="w-9 h-9 rounded-xl bg-cream-300 flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[15px] font-medium text-cream-900 truncate">{groupInfo.name}</span>
            <span className="text-[11px] text-cream-500">{groupInfo.member_count != null ? `${groupInfo.member_count}人` : ''}</span>
          </div>
        </div>
        <button className="p-2 rounded-lg hover:bg-black/5 transition-all" style={{ color: chatStyle.iconColor }} onClick={() => navigate(`/messages/group/${groupId}/info`)}>
          <Menu size={18} />
        </button>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0"
        style={{ overscrollBehaviorY: 'contain', paddingBottom: bottomBarH + kbOffset + 16 }}
        onClick={closeToolbar}
        onTouchStart={() => { isTouchScrolling.current = true; }}
        onTouchEnd={() => { isTouchScrolling.current = false; }}
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-cream-600 text-xs">暂无消息</div>
        ) : messages.map((msg, index) => {
          const isSelf = msg.sender_id === user?.id;
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const replyMsg = findMsg(msg.reply_to);

          return (
            <div key={msg.id} id={`gmsg-${msg.id}`}>
              {shouldShowTime(msg, prevMsg) && (
                <div className="flex justify-center my-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px]" style={{ background: chatStyle.timeLabelBg, color: chatStyle.timeLabelText }}>{formatTimeSeparator(msg.created_at)}</span>
                </div>
              )}
              {msg.type === 'system' ? (
                <div className="flex justify-center my-1">
                  <span className="text-[12px] text-cream-500">{msg.content}</span>
                </div>
              ) : msg.is_recalled ? (
                <div className="flex justify-center my-1">
                  <span className="text-[12px] text-cream-500 italic">
                    {isSelf ? '你撤回了一条消息' : `${msg.sender_nickname || '成员'}撤回了一条消息`}
                  </span>
                </div>
              ) : (
                <div className={`flex items-start gap-2.5 mb-3 max-w-[78%] ${isSelf ? 'self-end flex-row-reverse ml-auto' : 'self-start mr-auto'} ${highlightMsgId === msg.id ? 'ring-2 ring-warm-400 ring-offset-2 rounded-2xl bg-warm-50/50 transition-all duration-300' : ''}`}>
                  <div className="flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); if (!isSelf) navigate(`/user/${msg.sender_id}`); }}
                    onTouchStart={() => {
                      if (isSelf) return;
                      longPressTimerRef.current = setTimeout(() => {
                        const member = members.find(m => m.id === msg.sender_id);
                        if (member) triggerMentionFromAvatar(member);
                      }, 500);
                    }}
                    onTouchEnd={() => { if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; } }}
                    onTouchMove={() => { if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; } }}
                  >
                    <RemoteImage
                      src={getMediaUrl(msg.sender_avatar || '/default-avatar.png')} alt=""
                      className="w-9 h-9 rounded-full bg-cream-300 cursor-pointer active:opacity-70"
                    />
                  </div>
                  {msg.type === 'image' ? (
                    <div className="flex flex-col">
                      {!isSelf && (
                        <div className="flex items-center gap-1.5 mb-1 ml-1">
                          <span className="text-[12px] text-cream-600 font-medium">{msg.sender_nickname || '成员'}</span>
                          {(() => {
                            const member = members.find(m => m.id === msg.sender_id);
                            return member?.role === 'owner' ? (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 text-[9px] font-bold">
                                <Crown size={9} />群主
                              </span>
                            ) : member?.role === 'admin' ? (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 text-[9px] font-bold">
                                <Shield size={9} />管理
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-cream-200 text-cream-600 text-[9px] font-bold">
                                LV{member?.level || 1}
                              </span>
                            );
                          })()}
                        </div>
                      )}
                      <ChatImage
                        src={msg._localUrl || getMediaUrl(msg.content)}
                        maxWidth={210}
                        maxHeight={280}
                        uploading={msg._uploading}
                        uploadProgress={msg._uploadProgress}
                        compressDone={msg._compressDone}
                        uploadError={msg._uploadError}
                        onRetry={msg._uploadError ? () => retryGroupImageUpload(msg) : undefined}
                        onClick={() => { if (!msg._uploading && !msg._uploadError) setViewImageIndex(chatImages.indexOf(getMediaUrl(msg.content))); }}
                        onLoad={scrollToBottom}
                      />
                    </div>
                  ) : (
                  <div className="flex flex-col flex-1 min-w-0">
                    {!isSelf && (
                      <div className="flex items-center gap-1.5 mb-1 ml-1">
                        <span className="text-[12px] text-cream-600 font-medium">{msg.sender_nickname || '成员'}</span>
                        {(() => {
                          const member = members.find(m => m.id === msg.sender_id);
                          return member?.role === 'owner' ? (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 text-[9px] font-bold">
                              <Crown size={9} />群主
                            </span>
                          ) : member?.role === 'admin' ? (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 text-[9px] font-bold">
                              <Shield size={9} />管理
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-cream-200 text-cream-600 text-[9px] font-bold">
                              LV{member?.level || 1}
                            </span>
                          );
                        })()}
                      </div>
                    )}
                    <div
                      className={`rounded-[10px] overflow-hidden max-w-full ${isSelf ? 'self-end' : 'self-start'}`}
                      style={isSelf ? { background: chatStyle.selfBubbleGradient, color: chatStyle.selfText } : { background: chatStyle.otherBubble, color: chatStyle.otherText }}
                      onTouchStart={(e) => { const el = e.currentTarget; longPressTimerRef.current = setTimeout(() => { window.getSelection()?.removeAllRanges(); openToolbar(msg, el); }, 500); }}
                      onTouchEnd={() => { if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; } }}
                      onTouchMove={() => { if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; } }}
                      onContextMenu={(e) => { e.preventDefault(); openToolbar(msg, e.currentTarget); }}
                    >
                      {replyMsg && (
                        <div className={`px-3 pt-2 pb-1 border-b ${isSelf ? 'border-white/20' : ''}`} style={isSelf ? {} : { borderColor: chatStyle.otherBubbleBorder }}>
                          <div className={`text-[11px] truncate ${isSelf ? 'text-white/60' : ''}`} style={isSelf ? {} : { color: chatStyle.iconColor }}>
                            {replyMsg.sender_id === user?.id ? '你' : replyMsg.sender_nickname}：{getPreview(replyMsg)}
                          </div>
                        </div>
                      )}
                      <div className="px-3 py-2.5">
                        {msg.type === 'audio' ? (
                          <AudioBubble src={msg.content} isSelf={isSelf} />
                        ) : (
                          <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">{renderMentions(msg.content, members, navigate, isSelf ? chatStyle.selfText : chatStyle.selfBubble)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom bar — fixed, follows visualViewport */}
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
              <p className="text-[11px] text-warm-600 font-medium">回复 {replyTo.sender_id === user?.id ? '自己' : replyTo.sender_nickname}</p>
              <p className="text-[12px] text-cream-600 truncate">{getPreview(replyTo)}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="p-1 text-cream-500 hover:text-cream-700"><X size={16} /></button>
          </div>
        )}

        {/* Input */}
        <div className="px-2.5 py-2 pb-[calc(8px+env(safe-area-inset-bottom))]">
          <div className="flex items-end gap-1.5">
            <button className="p-2 transition-colors flex-shrink-0 disabled:opacity-30"
              style={{ color: isMuted ? '#d0c0b0' : chatStyle.iconColor }}
              disabled={isMuted}
              onClick={async () => {
                if (!voiceMode) { try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getTracks().forEach(t => t.stop()); } catch { } }
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
              <div className="flex-1 min-w-0 flex items-end gap-1.5 px-3 py-2 rounded-xl transition-all relative"
                style={{ background: chatStyle.inputBg }}>
                <AnimatePresence>
                  {showMention && (
                    <motion.div
                      className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-2xl shadow-xl border border-cream-200/60 overflow-hidden max-h-48 overflow-y-auto z-10"
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                    >
                      {mentionList.map(m => (
                        <button key={m.id} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-cream-50 active:bg-cream-100 transition-colors"
                          onMouseDown={(e) => { e.preventDefault(); m.id === 0 ? insertMentionAll() : insertMention(m); }}>
                          <RemoteImage src={getMediaUrl(m.avatar)} alt="" className="w-7 h-7 rounded-full bg-cream-200 flex-shrink-0" />
                          <span className="text-[13px] text-cream-900 font-medium">@{m.nickname}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                <textarea ref={inputRef} rows={1} className="flex-1 min-w-0 text-sm py-0.5 bg-transparent leading-5 resize-none overflow-hidden"
                    style={{ color: isMuted ? '#d97706' : chatStyle.otherText }}
                    placeholder={isMuted
                      ? (mutedUntil ? `禁言至 ${new Date(mutedUntil).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : '你已被永久禁言')
                      : '输入消息...'} value={message} disabled={isMuted} onFocus={() => { setInputFocused(true); setShowEmoji(false); setShowTools(false); }} onBlur={() => setInputFocused(false)} onChange={(e) => { handleInputChange(e); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }} onKeyDown={handleKeyDown} />
                  {hasText && !isMuted && (
                    <button className="flex-shrink-0 px-4 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95" style={{ background: chatStyle.sendBtnGradient, color: chatStyle.sendBtnText, boxShadow: chatStyle.sendBtnShadow }} onMouseDown={e => e.preventDefault()} onClick={handleSend}>发送</button>
                  )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload}
              style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }} />
          </div>
        )}
        {!voiceMode && !isMuted && (
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
      </div>
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
      </div>

      {/* Floating toolbar */}
      <AnimatePresence>
        {selectedMsg && toolbarPos && (
          <>
            <motion.div className="fixed inset-0 z-[300]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ background: 'rgba(0,0,0,0.15)' }} onClick={closeToolbar} />
            <motion.div
              className="fixed z-[301] flex items-center bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
              style={{ top: Math.max(60, toolbarPos.top - 56), left: Math.max(8, Math.min(toolbarPos.isSelf ? toolbarPos.left - 224 : toolbarPos.left, window.innerWidth - 232)) }}
              initial={{ opacity: 0, scale: 0.85, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85, y: 8 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              {selectedMsg.type === 'text' && (
                <button className="flex flex-col items-center justify-center gap-0.5 px-3.5 py-2.5 text-white active:bg-gray-700 border-r border-gray-700"
                  onClick={() => { copyText(selectedMsg.content); showToast('已复制'); closeToolbar(); }}>
                  <Copy size={16} /><span className="text-[10px]">复制</span>
                </button>
              )}
              {selectedMsg.type === 'text' && (
                <button className="flex flex-col items-center justify-center gap-0.5 px-3.5 py-2.5 text-white active:bg-gray-700 border-r border-gray-700"
                  onClick={() => { setSelectingText(selectedMsg); closeToolbar(); }}>
                  <span className="text-[13px] font-bold">A</span><span className="text-[10px]">选择</span>
                </button>
              )}
              <button className="flex flex-col items-center justify-center gap-0.5 px-3.5 py-2.5 text-white active:bg-gray-700 border-r border-gray-700"
                onClick={() => { setReplyTo(selectedMsg); closeToolbar(); }}>
                <Quote size={16} /><span className="text-[10px]">引用</span>
              </button>
              {(selectedMsg.sender_id !== user?.id || true) && (
                <button className="flex flex-col items-center justify-center gap-0.5 px-3.5 py-2.5 text-white active:bg-gray-700 border-r border-gray-700"
                  onClick={() => handleGroupFavorite(selectedMsg)}>
                  <Bookmark size={16} className={favoritedMsgIds.has(selectedMsg.id) ? 'fill-amber-400 text-amber-400' : ''} />
                  <span className="text-[10px]">{favoritedMsgIds.has(selectedMsg.id) ? '取消收藏' : '收藏'}</span>
                </button>
              )}
              {(() => {
                const isOwn = selectedMsg.sender_id === user?.id;
                const within2Min = (Date.now() - new Date(selectedMsg.created_at).getTime()) < 120000;
                const senderRole = members.find(m => m.id === selectedMsg.sender_id)?.role;
                const canRecall = isOwn ? (within2Min || myRole === 'owner') : (myRole === 'owner' || (myRole === 'admin' && senderRole === 'member'));
                return canRecall;
              })() && (
                <button className="flex flex-col items-center justify-center gap-0.5 px-3.5 py-2.5 text-red-400 active:bg-gray-700"
                  onClick={async () => {
                    closeToolbar();
                    const res: any = await recallGroupMessage(selectedMsg.id);
                    if (res.code === 0) showToast(selectedMsg.sender_id === user?.id ? '消息已撤回' : '已撤回该成员消息');
                    else showToast(res.message || '撤回失败', 'error');
                  }}>
                  <RotateCcw size={16} /><span className="text-[10px]">撤回</span>
                </button>
              )}
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
    </motion.div>
    </>
  );
}
