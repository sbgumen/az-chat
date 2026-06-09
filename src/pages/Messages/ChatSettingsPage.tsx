import { RemoteImage } from '../../components/RemoteImage';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { getConversationSettings, updateConversationSettings } from '../../api/messages';
import { getMediaUrl } from '../../utils/mediaUrl';
import { SearchChatHistory } from './SearchChatHistory';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';
import { useAuth } from '../../context/AuthContext';
import { CHAT_STYLES, type ChatStyleKey } from '../../components/effects/chatStyles';
import { getFriends, deleteFriend, sendFriendRequest, getMyRequests } from '../../api/contacts';

function Card({ children }: { children: React.ReactNode }) {
  return <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: '#fdfaf6' }}>{children}</div>;
}

function Row({ label, value, right, onClick, danger }: {
  label: string;
  value?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3.5 text-left ${
        onClick ? 'active:bg-black/[0.02] transition-colors' : ''
      }`}
    >
      <span className={`text-[14px] ${danger ? 'text-red-500' : 'text-[#3d2e1f]'}`}>{label}</span>
      <div className="flex items-center gap-1.5">
        {value && <span className="text-[13px] text-[#a09080]">{value}</span>}
        {right}
        {onClick && !right && <ChevronRight size={16} className="text-[#c4b8a8]" />}
      </div>
    </Comp>
  );
}

function Divider() {
  return <div className="mx-4 h-[0.5px] bg-[#e8e0d6]" />;
}

function ToggleSwitch({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className={`relative w-11 h-[26px] rounded-[13px] transition-colors duration-200 ${
        active ? 'bg-[#d4a574]' : 'bg-[#d4c8b8]'
      }`}
    >
      <div className={`absolute top-[3px] w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${
        active ? 'left-[21px]' : 'left-[3px]'}`}
      />
    </button>
  );
}

export function ChatSettingsPage() {
  const navigate = useNavigate();
  const goBack = useSmartBack('/messages');
  const { userId: userIdParam } = useParams<{ userId: string }>();
  const location = useLocation();
  const userId = parseInt(userIdParam || '0');
  const { nickname = '', avatar = '' } = (location.state as any) || {};

  const { user } = useAuth();
  const currentChatStyle: ChatStyleKey = (user?.chat_style || 'latte') as ChatStyleKey;
  const chatStyleLabel = CHAT_STYLES[currentChatStyle]?.label || '温暖拿铁';

  const [isPinned, setIsPinned] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isFriend, setIsFriend] = useState<boolean | null>(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [friendActionLoading, setFriendActionLoading] = useState(false);
  const [showAddFriendDialog, setShowAddFriendDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [friendMessage, setFriendMessage] = useState('');
  const [toast, setToast] = useState('');
  const isSystemBot = userId === 9999;

  useEffect(() => {
    getConversationSettings(userId, 'private').then((res: any) => {
      if (res.code === 0) {
        setIsPinned(!!res.data.is_pinned);
        setIsMuted(!!res.data.is_muted);
      }
    }).catch(() => {});
    // Check friend status
    getFriends().then((res: any) => {
      if (res.code === 0) {
        const ids = new Set((res.data || res).map((f: any) => f.friend_id || f.id));
        setIsFriend(ids.has(userId));
      }
    }).catch(() => {});
    // Check pending sent requests
    getMyRequests().then((res: any) => {
      if (res.code === 0) {
        setHasPendingRequest((res.data || []).some((r: any) => r.to_user_id === userId && r.status === 0));
      }
    }).catch(() => {});
  }, [userId]);

  const togglePin = async () => {
    const v = !isPinned; setIsPinned(v);
    await updateConversationSettings(userId, { type: 'private', is_pinned: v ? 1 : 0, is_muted: isMuted ? 1 : 0 });
  };

  const toggleMute = async () => {
    const v = !isMuted; setIsMuted(v);
    await updateConversationSettings(userId, { type: 'private', is_pinned: isPinned ? 1 : 0, is_muted: v ? 1 : 0 });
  };

  const handleFriendAction = () => {
    if (isFriend) {
      setShowDeleteConfirm(true);
    } else {
      setShowAddFriendDialog(true);
    }
  };

  const handleDeleteFriend = async () => {
    setFriendActionLoading(true);
    try { await deleteFriend(userId); setIsFriend(false); setShowDeleteConfirm(false); showToast('已删除好友'); } catch {}
    setFriendActionLoading(false);
  };

  const handleSendRequest = async () => {
    if (friendActionLoading) return;
    setFriendActionLoading(true);
    try {
      await sendFriendRequest(userId, friendMessage || '你好，我想加你为好友');
      setHasPendingRequest(true);
      setShowAddFriendDialog(false);
      setFriendMessage('');
      showToast('好友申请已发送');
    } catch {}
    setFriendActionLoading(false);
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  return (
    <motion.div className="fixed inset-0 z-[200] flex flex-col bg-[#f5f1eb]"
      
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 340, damping: 32 }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 bg-[#faf7f3]/90 backdrop-blur-lg flex-shrink-0 relative">
        <button onClick={goBack} className="p-1.5 -ml-1 rounded-lg hover:bg-black/5 transition-colors">
          <ArrowLeft size={20} className="text-[#5c4330]" />
        </button>
        <h1 className="text-[17px] font-semibold text-[#3d2e1f]">聊天设置</h1>
      </div>
      <AnimatePresence>
        {toast && (
          <motion.div className="fixed top-[calc(var(--status-bar-height,0px)+60px)] left-1/2 -translate-x-1/2 z-[500] bg-gray-800/95 text-white text-[13px] px-5 py-2.5 rounded-full shadow-lg whitespace-nowrap"
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto">
        <div className="h-3" />

        {/* Card: User info */}
        <Card>
          <button
            className="w-full flex items-center gap-3 px-4 py-4 active:bg-black/[0.02] transition-colors"
            onClick={() => navigate(`/user/${userId}`)}
          >
            <RemoteImage src={getMediaUrl(avatar)} alt={nickname}
              className="w-12 h-12 rounded-full object-cover bg-[#f0eae0]" />
            <div className="flex-1 min-w-0">
              <h2 className="text-[15px] font-semibold text-[#3d2e1f] truncate">{nickname}</h2>
              <p className="text-[12px] text-[#a09080] mt-0.5">ID: {userId}</p>
            </div>
            <ChevronRight size={16} className="text-[#c4b8a8] flex-shrink-0" />
          </button>
        </Card>

        <div className="h-3" />

        {/* Card: Chat settings */}
        <Card>
          <Row label="查找聊天记录" onClick={() => setShowSearch(true)} />
          <Divider />
          <Row label="置顶聊天" right={<ToggleSwitch active={isPinned} onToggle={togglePin} />} />
          <Divider />
          <Row label="消息免打扰" right={<ToggleSwitch active={isMuted} onToggle={toggleMute} />} />
          <Divider />
          <Row
            label="聊天界面风格"
            value={chatStyleLabel}
            onClick={() => navigate('/profile/personalization/chat-style')}
          />
          {!isSystemBot && isFriend !== null && (
            <>
              <Divider />
              {hasPendingRequest ? (
                <Row label="添加好友" value="申请已发出" />
              ) : isFriend ? (
                <Row label="删除好友" danger onClick={() => setShowDeleteConfirm(true)} />
              ) : (
                <Row label="添加好友" onClick={handleFriendAction} />
              )}
            </>
          )}
        </Card>

        {isMuted && (
          <p className="mx-6 mt-2.5 text-[11px] text-[#b0a090]">开启后，收到该联系人的消息时不会有通知提醒</p>
        )}

        <div className="h-8" />
      </div>

      <AnimatePresence>
        {showSearch && (
          <SearchChatHistory
            targetId={userId} targetName={nickname} type="private"
            onClose={() => setShowSearch(false)}
            onSelect={(msgId) => {
              setShowSearch(false);
              navigate(`/messages/chat/${userId}`, { state: { jumpToMsgId: msgId }, replace: true });
            }}
            disableHistoryBack
          />
        )}
      </AnimatePresence>

      {/* Delete confirm dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowDeleteConfirm(false)}>
            <motion.div className="bg-white rounded-2xl mx-4 max-w-[300px] w-full p-5"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}>
              <h3 className="text-[15px] font-semibold text-cream-900 mb-2">删除好友</h3>
              <p className="text-[13px] text-cream-500 mb-4">确定要删除 {nickname} 吗？删除后将解除好友关系。</p>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-cream-200 text-sm text-cream-700">取消</button>
                <button onClick={handleDeleteFriend} disabled={friendActionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium disabled:opacity-50">
                  {friendActionLoading ? '删除中...' : '确认删除'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add friend dialog */}
      <AnimatePresence>
        {showAddFriendDialog && (
          <motion.div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAddFriendDialog(false)}>
            <motion.div className="bg-white rounded-2xl mx-4 max-w-[320px] w-full p-5"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}>
              <h3 className="text-[15px] font-semibold text-cream-900 mb-3">添加好友</h3>
              <p className="text-[12px] text-cream-500 mb-3">发送验证消息给 {nickname}</p>
              <textarea
                value={friendMessage} onChange={e => setFriendMessage(e.target.value)}
                placeholder="你好，我想加你为好友"
                rows={3}
                className="w-full border border-cream-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-warm-400 resize-none mb-3"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowAddFriendDialog(false)}
                  className="flex-1 py-2.5 rounded-xl border border-cream-200 text-sm text-cream-700">取消</button>
                <button onClick={handleSendRequest} disabled={friendActionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-warm-500 text-white text-sm font-medium disabled:opacity-50">
                  {friendActionLoading ? '发送中...' : '发送'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
