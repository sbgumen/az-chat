import { RemoteImage } from '../../components/RemoteImage';
import { SafeImg } from '../../components/SafeImg';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Crown, Shield, UserPlus, Settings, ChevronRight, Copy, Check } from 'lucide-react';
import { getGroupDetail, leaveGroup, dismissGroup, getGroupNotices } from '../../api/groups';
import { getConversationSettings, updateConversationSettings } from '../../api/messages';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';
import { CHAT_STYLES, type ChatStyleKey } from '../../components/effects/chatStyles';
import { useNavigate, useParams } from 'react-router-dom';
import { SearchChatHistory } from '../Messages/SearchChatHistory';
import { useSmartBack } from '../../hooks/useSmartBack';

interface Member {
  id: number;
  nickname: string;
  avatar: string;
  role: 'owner' | 'admin' | 'member';
}

interface GroupDetail {
  id: number;
  name: string;
  avatar: string;
  owner_id: number;
  notice: string;
  description?: string;
  tags?: string;
  join_type?: number;
  is_system?: number;
  system_mode?: string;
  members: Member[];
  my_role: 'owner' | 'admin' | 'member';
}

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getAvatar = (a: string) => a?.startsWith('http') ? a : `${apiBase}${a}`;

// 白色卡片容器
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mx-4 rounded-2xl overflow-hidden ${className}`} style={{ background: '#fdfaf6' }}>
      {children}
    </div>
  );
}

// 卡片内的每一行
function Row({ label, value, right, onClick, danger }: {
  label: string;
  value?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3.5 text-left ${
        onClick ? 'active:bg-[#f5efe6] transition-colors' : ''
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

// 行间分割线
function Divider() {
  return <div className="mx-4 h-[0.5px] bg-[#e8e0d6]" />;
}

// 开关
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

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <motion.div
      className={`fixed top-16 left-1/2 -translate-x-1/2 z-[400] px-4 py-2 rounded-full text-white text-sm font-medium shadow-lg whitespace-nowrap ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}
      initial={{ opacity: 0, y: -8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.9 }}
    >
      {msg}
    </motion.div>
  );
}

function ConfirmSheet({ title, desc, confirmLabel, danger, onConfirm, onCancel }: {
  title: string; desc: string; confirmLabel: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <motion.div className="fixed inset-0 z-[350] bg-black/40 flex items-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onCancel}>
      <motion.div className="w-full bg-white rounded-t-3xl pb-[env(safe-area-inset-bottom)]"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-[#d4c8b8] rounded-full mx-auto mt-3 mb-4" />
        <div className="px-6 pb-2">
          <h3 className="text-[17px] font-semibold text-gray-900 text-center">{title}</h3>
          <p className="text-[13px] text-gray-500 text-center mt-1.5 leading-relaxed">{desc}</p>
        </div>
        <div className="px-4 py-4 flex flex-col gap-2.5">
          <button onClick={onConfirm}
            className={`w-full py-3.5 rounded-2xl font-semibold text-[15px] transition-all active:scale-[0.98] ${danger ? 'bg-red-500 text-white' : 'bg-gray-900 text-white'}`}>
            {confirmLabel}
          </button>
          <button onClick={onCancel}
            className="w-full py-3.5 rounded-2xl font-medium text-[15px] bg-[#f0eae0] text-gray-700 transition-all active:scale-[0.98]">
            取消
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function GroupInfoPage() {
  const navigate = useNavigate();
  const { groupId: groupIdParam } = useParams<{ groupId: string }>();
  const groupId = parseInt(groupIdParam || '0');
  const goBack = useSmartBack(`/messages/group/${groupId}`);
  const { on } = useSocket();
  const { user } = useAuth();
  const currentChatStyle: ChatStyleKey = (user?.chat_style || 'latte') as ChatStyleKey;
  const chatStyleLabel = CHAT_STYLES[currentChatStyle]?.label || '温暖拿铁';

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [latestNotice, setLatestNotice] = useState<{ content: string; images?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirm, setConfirm] = useState<'leave' | 'dismiss' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2000);
  };

  const loadGroup = async () => {
    setLoading(true);
    try {
      const res: any = await getGroupDetail(groupId);
      setGroup(res.data ?? res);
      const nr: any = await getGroupNotices(groupId);
      if (nr.code === 0 && nr.data?.length > 0) setLatestNotice({ content: nr.data[0].content, images: nr.data[0].images });
      const sr: any = await getConversationSettings(groupId, 'group');
      if (sr.code === 0) {
        setIsPinned(!!sr.data.is_pinned);
        setIsMuted(!!sr.data.is_muted);
      }
    } catch { }
    setLoading(false);
  };

  useEffect(() => { loadGroup(); }, [groupId]);

  useEffect(() => {
    const unsub = on('group:info:update', (data: { groupId: number }) => {
      if (data.groupId === groupId) loadGroup();
    });
    return unsub;
  }, [on, groupId]);

  const handleLeave = async () => {
    setActionLoading(true);
    const res: any = await leaveGroup(groupId);
    setActionLoading(false);
    setConfirm(null);
    if (res.code === 0) {
      showToast('已退出群聊');
      setTimeout(() => navigate('/messages', { replace: true }), 800);
    } else showToast(res.message || '退出失败', 'error');
  };

  const handleDismiss = async () => {
    setActionLoading(true);
    const res: any = await dismissGroup(groupId);
    setActionLoading(false);
    setConfirm(null);
    if (res.code === 0) {
      showToast('群聊已解散');
      setTimeout(() => navigate('/messages', { replace: true }), 800);
    } else showToast(res.message || '解散失败', 'error');
  };

  const copyGroupId = () => {
    navigator.clipboard?.writeText(String(group?.id));
    setCopied(true);
    showToast('群号已复制');
    setTimeout(() => setCopied(false), 1500);
  };

  const togglePin = async () => {
    const newVal = !isPinned;
    setIsPinned(newVal);
    await updateConversationSettings(groupId, { type: 'group', is_pinned: newVal ? 1 : 0, is_muted: isMuted ? 1 : 0 });
  };

  const toggleMute = async () => {
    const newVal = !isMuted;
    setIsMuted(newVal);
    await updateConversationSettings(groupId, { type: 'group', is_pinned: isPinned ? 1 : 0, is_muted: newVal ? 1 : 0 });
  };

  if (loading) return (
    <motion.div className="fixed inset-0 z-[250] flex flex-col" style={{ background: '#f5f1eb' }}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
      <div className="p-4 flex flex-col gap-4 animate-pulse pt-16">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#e8e0d6]" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-5 w-32 rounded bg-[#e8e0d6]" />
            <div className="h-3 w-20 rounded bg-[#ebe4da]" />
          </div>
        </div>
        <div className="h-48 rounded-2xl bg-[#fdfaf6]" />
      </div>
    </motion.div>
  );

  if (!group) return null;

  const isOwnerOrAdmin = group.my_role === 'owner' || group.my_role === 'admin';
  const displayedMembers = showAllMembers ? group.members : group.members.slice(0, 15);
  const tags: string[] = (() => { try { return JSON.parse(group.tags || '[]'); } catch { return []; } })();

  return (
    <>
      <motion.div className="fixed inset-0 z-[250] flex flex-col bg-[#f5f1eb]"
        
        
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}>

        <AnimatePresence>
          {toast && <Toast msg={toast.msg} type={toast.type} />}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 bg-[#faf7f3]/90 backdrop-blur-lg flex-shrink-0">
          <button onClick={goBack} className="p-1.5 -ml-1 rounded-lg hover:bg-black/5 transition-colors">
            <ArrowLeft size={20} className="text-[#5c4330]" />
          </button>
          <h1 className="text-[17px] font-semibold text-[#3d2e1f]">群聊设置</h1>
          {isOwnerOrAdmin ? (
            <button onClick={() => navigate(`/messages/group/${groupId}/info/manage`)}
              className="p-1.5 -mr-1 rounded-lg hover:bg-[#ebe4da] transition-colors">
              <Settings size={20} className="text-[#5c4330]" />
            </button>
          ) : <div className="w-8" />}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="h-3" />

          {/* Card 1: Group Header — avatar + name + id + description + tags */}
          <Card>
            <button
              className="w-full flex items-center gap-3 px-4 py-4 active:bg-[#f5efe6] transition-colors"
              onClick={() => navigate(`/messages/group/${groupId}/detail`)}
            >
              <div className="relative flex-shrink-0">
                <RemoteImage
                  src={group.avatar ? getAvatar(group.avatar) : `https://api.dicebear.com/7.x/shapes/svg?seed=${group.id}`}
                  alt={group.name}
                  className="w-12 h-12 rounded-full object-cover bg-[#f0eae0]"
                  onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${group.id}`; }}
                />
                <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {group.members.length}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[15px] font-semibold text-[#3d2e1f] truncate">{group.name}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[12px] text-[#a09080]">群号 {group.id}</span>
                  <span onClick={(e) => { e.stopPropagation(); copyGroupId(); }} className="p-0.5 cursor-pointer">
                    {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} className="text-gray-400" />}
                  </span>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {tags.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-md text-[10px] font-medium text-gray-500 bg-[#f0eae0]">{t}</span>
                    ))}
                  </div>
                )}
                {group.description && (
                  <p className="text-[12px] text-[#8b7b6b] mt-1.5 leading-relaxed text-left">{group.description}</p>
                )}
              </div>
              <ChevronRight size={16} className="text-[#c4b8a8] flex-shrink-0" />
            </button>
          </Card>

          <div className="h-3" />

          {/* Card 2: Members */}
          <Card>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[13px] text-[#8b7b6b]">群成员 · {group.members.length}人</span>
              <button onClick={() => navigate(`/messages/group/${groupId}/members`)} className="text-[12px] text-warm-500 font-medium flex items-center gap-0.5">
                查看全部 <ChevronRight size={13} />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-x-1 gap-y-3 px-3 pb-3">
              {displayedMembers.map(m => {
                const isSelf = m.id === (JSON.parse(localStorage.getItem('az_user') || '{}').id || 0);
                const canManage = isOwnerOrAdmin && !isSelf && m.role !== 'owner' && (group.my_role === 'owner' || m.role === 'member');
                const handleAvatarClick = () => {
                  if (canManage) navigate(`/messages/group/${groupId}/member/${m.id}`);
                  else navigate(`/user/${m.id}`);
                };
                return (
                  <div key={m.id} className="flex flex-col items-center">
                    <div className="relative">
                      <RemoteImage src={getAvatar(m.avatar)} alt={m.nickname}
                        className="w-10 h-10 rounded-full object-cover bg-[#f0eae0] cursor-pointer active:opacity-70"
                        onClick={handleAvatarClick}
                        onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.id}`; }} />
                      {m.role === 'owner' && (
                        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                          <Crown size={9} className="text-white" />
                        </div>
                      )}
                      {m.role === 'admin' && (
                        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <Shield size={9} className="text-white" />
                        </div>
                      )}
                    </div>
                    <span className="mt-1 text-[10px] text-[#8b7b6b] truncate w-full text-center leading-tight">{m.nickname}</span>
                  </div>
                );
              })}
              {group.members.length > 15 && !showAllMembers ? (
                <div className="flex flex-col items-center">
                  <button onClick={() => setShowAllMembers(true)}
                    className="w-10 h-10 rounded-full bg-[#f0eae0] flex items-center justify-center cursor-pointer active:opacity-70">
                    <span className="text-gray-400 text-[18px] font-semibold">+{group.members.length - 15}</span>
                  </button>
                  <span className="mt-1 text-[10px] text-gray-400 truncate w-full text-center">更多</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <button onClick={() => navigate(`/messages/group/${groupId}/invite`)}
                    className="w-10 h-10 rounded-full bg-[#f0eae0] flex items-center justify-center cursor-pointer active:opacity-70">
                    <UserPlus size={16} className="text-gray-500" />
                  </button>
                  <span className="mt-1 text-[10px] text-gray-400 truncate w-full text-center">邀请</span>
                </div>
              )}
            </div>
          </Card>

          <div className="h-3" />

          {/* Card 3: Chat Tools */}
          <Card>
            <Row
              label="查找聊天记录"
              onClick={() => setShowSearch(true)}
            />
            <Divider />
            <Row
              label="置顶聊天"
              right={<ToggleSwitch active={isPinned} onToggle={togglePin} />}
            />
            <Divider />
            <Row
              label="消息免打扰"
              right={<ToggleSwitch active={isMuted} onToggle={toggleMute} />}
            />
            <Divider />
            <Row
              label="聊天界面风格"
              value={chatStyleLabel}
              onClick={() => navigate('/profile/personalization/chat-style')}
            />
          </Card>

          <div className="h-3" />

          {/* Card 4: Group Info — name + id + notice + join type */}
          <Card>
            <Row label="群聊名称" value={group.name} />
            <Divider />
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-[14px] text-[#3d2e1f]">群号</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] text-[#a09080]">{group.id}</span>
                <span onClick={copyGroupId} className="p-0.5 cursor-pointer">
                  {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-[#c4b8a8]" />}
                </span>
              </div>
            </div>
            <Divider />
            <button
              className="w-full flex items-start justify-between px-4 py-3.5 text-left active:bg-[#f5efe6] transition-colors"
              onClick={() => navigate(`/messages/group/${groupId}/info/notices`)}
            >
              <span className="text-[14px] text-[#3d2e1f] flex-shrink-0 mr-3">群公告</span>
              <div className="flex-1 min-w-0">
                {latestNotice ? (
                  <>
                    <p className="text-[13px] text-[#a09080] line-clamp-2 leading-relaxed">{latestNotice.content}</p>
                    {(() => {
                      try {
                        const imgs: string[] = JSON.parse(latestNotice.images || '[]');
                        if (imgs.length > 0) {
                          return (
                            <div className="flex gap-1.5 mt-2">
                              {imgs.slice(0, 3).map((url, i) => (
                                <div key={i} className="w-14 h-14 rounded-lg overflow-hidden bg-[#f0eae0] flex-shrink-0 relative">
                                  <SafeImg src={url.startsWith('http') ? url : `${apiBase}${url}`} alt=""
                                    className="w-full h-full object-cover"
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                  {i === 2 && imgs.length > 3 && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                      <span className="text-white text-[11px] font-semibold">+{imgs.length - 3}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        }
                      } catch { return null; }
                      return null;
                    })()}
                  </>
                ) : (
                  <span className="text-[13px] text-[#a09080]">暂无</span>
                )}
              </div>
              <ChevronRight size={16} className="text-[#c4b8a8] flex-shrink-0 ml-2" />
            </button>
            <Divider />
            <Row
              label="加群方式"
              value={group.join_type === 1 ? '需要管理员审批' : '直接加入'}
            />
          </Card>

          {/* Card 4: Admin management */}
          {isOwnerOrAdmin && (
            <>
              <div className="h-3" />
              <Card>
                <Row
                  label="群管理"
                  value="编辑资料 · 成员管理"
                  onClick={() => navigate(`/messages/group/${groupId}/info/manage`)}
                />
              </Card>
            </>
          )}

          <div className="h-3" />

          {/* Card 5: Leave / Dismiss */}
          {group.is_system ? (
            <Card>
              <Row label="系统群聊" value="成员不可自行退出" />
            </Card>
          ) : (
            <Card>
              {group.my_role === 'owner' ? (
                <Row label="解散群聊" danger onClick={() => setConfirm('dismiss')} />
              ) : (
                <Row label="退出群聊" danger onClick={() => setConfirm('leave')} />
              )}
            </Card>
          )}

          <div className="h-8" />
        </div>

        {/* Confirm Sheets */}
        <AnimatePresence>
          {confirm === 'leave' && (
            <ConfirmSheet
              title="退出群聊"
              desc="退出后将不再收到该群消息，确定要退出吗？"
              confirmLabel={actionLoading ? '退出中...' : '确定退出'}
              danger
              onConfirm={handleLeave}
              onCancel={() => setConfirm(null)}
            />
          )}
          {confirm === 'dismiss' && (
            <ConfirmSheet
              title="解散群聊"
              desc="解散后所有成员将被移出群聊，此操作不可撤销。"
              confirmLabel={actionLoading ? '解散中...' : '确定解散'}
              danger
              onConfirm={handleDismiss}
              onCancel={() => setConfirm(null)}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Search Chat History Overlay */}
      <AnimatePresence>
        {showSearch && (
          <SearchChatHistory
            targetId={groupId}
            targetName={group?.name || ''}
            type="group"
            onClose={() => setShowSearch(false)}
            onSelect={(msgId) => {
              setShowSearch(false);
              navigate(`/messages/group/${groupId}`, { state: { jumpToMsgId: msgId }, replace: true });
            }}
            disableHistoryBack
          />
        )}
      </AnimatePresence>
    </>
  );
}
