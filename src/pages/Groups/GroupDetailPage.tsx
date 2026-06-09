import { RemoteImage } from '../../components/RemoteImage';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Crown, Shield, Calendar, UserPlus, MessageCircle, X, ChevronRight } from 'lucide-react';
import { getGroupDetail, requestJoinGroup, getMyGroupRequests } from '../../api/groups';
import { useNavigate, useParams } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';
import { useAuth } from '../../context/AuthContext';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getAvatar = (a: string) => a?.startsWith('http') ? a : `${apiBase}${a}`;

function Card({ children }: { children: React.ReactNode }) {
  return <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: '#fdfaf6' }}>{children}</div>;
}

function Divider() {
  return <div className="mx-4 h-[0.5px] bg-[#e8e0d6]" />;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center py-3 px-4">
      <span className="text-[14px] text-[#a09080] w-16 flex-shrink-0">{label}</span>
      <span className="text-[14px] text-[#3d2e1f] flex-1">{value}</span>
    </div>
  );
}

type ButtonState = 'join-direct' | 'join-approval' | 'pending' | 'is-member' | 'group-banned' | 'user-banned';

export function GroupDetailPage() {
  const navigate = useNavigate();
  const { groupId: groupIdParam } = useParams<{ groupId: string }>();
  const groupId = parseInt(groupIdParam || '0');
  const goBack = useSmartBack(`/messages/group/${groupId}`);
  const { user } = useAuth();

  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joinMsg, setJoinMsg] = useState('');
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [joining, setJoining] = useState(false);
  const [toast, setToast] = useState('');
  const [pendingRequest, setPendingRequest] = useState(false);
  const [checkingRequest, setCheckingRequest] = useState(true);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res: any = await getGroupDetail(groupId);
        if (res.code === 0 || res.data) setGroup(res.data ?? res);
      } catch { }
      setLoading(false);
    };
    load();
  }, [groupId]);

  useEffect(() => {
    const checkPending = async () => {
      try {
        const res: any = await getMyGroupRequests();
        if (res.code === 0) {
          const requests = res.data || [];
          const found = requests.find((r: any) => r.group_id === groupId && r.status === 0);
          setPendingRequest(!!found);
        }
      } catch { }
      setCheckingRequest(false);
    };
    checkPending();
  }, [groupId]);

  const members: any[] = group?.members || [];
  const isMember = group?.my_role != null;

  const isSelfBanned = members.some(
    (m: any) => m.id === user?.id && (m.is_banned === 1 || m.is_banned === true)
  );

  let buttonState: ButtonState = 'join-approval';
  if (group?.is_banned) {
    buttonState = 'group-banned';
  } else if (isSelfBanned) {
    buttonState = 'user-banned';
  } else if (isMember) {
    buttonState = 'is-member';
  } else if (pendingRequest && !checkingRequest) {
    buttonState = 'pending';
  } else if (group?.join_type === 0) {
    buttonState = 'join-direct';
  }

  const maleCount = members.filter((m: any) => m.gender === 1).length;
  const femaleCount = members.filter((m: any) => m.gender === 2).length;
  const totalGender = maleCount + femaleCount;
  const maleRatio = totalGender > 0 ? Math.round((maleCount / totalGender) * 100) : 50;

  const handleJoin = async () => {
    if (joining) return;
    setJoining(true);
    try {
      const res: any = await requestJoinGroup(groupId, joinMsg);
      if (res.code === 0) {
        setShowJoinDialog(false);
        if (res.data?.joined) {
          showToast('已成功加入群聊');
          setTimeout(() => navigate(`/messages/group/${groupId}`), 800);
        } else {
          showToast('申请已发送，等待审核');
          setPendingRequest(true);
        }
      } else {
        showToast(res.message || '申请失败');
        setShowJoinDialog(false);
      }
    } catch { showToast('操作失败'); }
    setJoining(false);
  };

  const tags: string[] = (() => { try { return JSON.parse(group?.tags || '[]'); } catch { return []; } })();

  return (
    <motion.div
      className="fixed inset-0 flex flex-col bg-[#f5f1eb]"
        
      
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <AnimatePresence>
        {toast && (
          <motion.div className="fixed top-20 left-1/2 -translate-x-1/2 z-[500] px-5 py-3 rounded-xl bg-[#3d2e1f]/90 text-white text-sm font-medium shadow-lg whitespace-nowrap"
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto min-h-0 pb-28">
        {loading || checkingRequest ? (
          <div className="p-4 flex flex-col gap-4 animate-pulse">
            <div className="h-48 rounded-2xl bg-[#e8e0d6]" />
            <div className="h-6 w-1/2 rounded-full bg-[#e8e0d6]" />
            <div className="h-4 w-3/4 rounded-full bg-[#e8e0d6]" />
          </div>
        ) : !group ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2">
            <p className="text-[#a09080] text-sm">无法加载群聊信息</p>
            <button onClick={goBack} className="text-[#d4a574] text-sm font-medium">返回</button>
          </div>
        ) : (
          <>
            {/* Hero section — clean avatar + name */}
            <div className="relative pt-3 pb-4">
              <div className="px-3 pb-2">
                <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors">
                  <ArrowLeft size={20} className="text-[#5c4330]" />
                </button>
              </div>
              <div className="flex flex-col items-center px-5">
                <RemoteImage
                  src={group.avatar ? getAvatar(group.avatar) : `https://api.dicebear.com/7.x/shapes/svg?seed=${group.id}`}
                  alt={group.name}
                  className="w-[80px] h-[80px] rounded-2xl object-cover bg-[#f0eae0] shadow-lg"
                  style={{ boxShadow: '0 8px 30px rgba(160,120,80,0.2)' }}
                  onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${group.id}`; }}
                />
                <h2 className="mt-3 text-[20px] font-bold text-[#2a1a0a]">{group.name}</h2>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[12px] text-[#a09080]">群号 {group.id}</span>
                </div>
                {group.created_at && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Calendar size={11} className="text-[#a09080]" />
                    <span className="text-[11px] text-[#a09080]">
                      {new Date(group.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })} 创建
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="h-3" />

            {/* Members card */}
            <Card>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[13px] text-[#8b7b6b] font-medium">群成员 · {members.length}人</span>
                {isMember && (
                  <button onClick={() => navigate(`/messages/group/${groupId}/members`)}
                    className="text-[12px] text-[#d4a574] font-medium flex items-center gap-0.5">
                    查看全部 <ChevronRight size={13} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-5 gap-x-1 gap-y-3 px-3 pb-3">
                {members.slice(0, 15).map((m: any) => (
                  <div key={m.id} className="flex flex-col items-center">
                    <div className="relative">
                      <RemoteImage src={getAvatar(m.avatar)} alt={m.nickname}
                        className="w-10 h-10 rounded-full object-cover bg-[#f0eae0]"
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
                ))}
              </div>
            </Card>

            <div className="h-3" />

            {/* Info card */}
            <Card>
              <InfoRow label="简介" value={group.description || '该群聊暂无简介'} />
              {tags.length > 0 && (
                <>
                  <Divider />
                  <div className="flex items-center py-3 px-4">
                    <span className="text-[14px] text-[#a09080] w-16 flex-shrink-0">标签</span>
                    <div className="flex flex-wrap gap-1.5 flex-1">
                      {tags.map((t) => (
                        <span key={t} className="px-2.5 py-1 rounded-md text-[11px] font-medium"
                          style={{ background: 'rgba(212,165,116,0.1)', color: '#8b6f50' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <Divider />
              <InfoRow label="加群方式" value={group.join_type === 1 ? '需要管理员审批' : '直接加入'} />
              {(maleCount > 0 || femaleCount > 0) && (
                <>
                  <Divider />
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] text-[#a09080] w-9">男</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-[#e8e0d6]">
                        <div className="h-full rounded-full" style={{
                          width: `${maleRatio}%`,
                          background: 'linear-gradient(90deg, #d4a574, #c9958b)'
                        }} />
                      </div>
                      <span className="text-[12px] text-[#a09080] w-9 text-right">{maleRatio}%</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[12px] text-[#a09080] w-9">女</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-[#e8e0d6]">
                        <div className="h-full rounded-full" style={{
                          width: `${100 - maleRatio}%`,
                          background: 'linear-gradient(90deg, #d4a0a0, #c9958b)'
                        }} />
                      </div>
                      <span className="text-[12px] text-[#a09080] w-9 text-right">{100 - maleRatio}%</span>
                    </div>
                  </div>
                </>
              )}
            </Card>

            <div className="h-8" />
          </>
        )}
      </div>

      {/* Bottom action button */}
      {!loading && group && (
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-[max(env(safe-area-inset-bottom),20px)] pt-3"
          style={{ background: 'linear-gradient(to top, #f5f1eb 0%, rgba(245,241,235,0.95) 60%, transparent 100%)' }}>
          {buttonState === 'group-banned' && (
            <div className="w-full py-3.5 rounded-2xl text-center text-[14px] font-semibold"
              style={{ background: 'rgba(192,57,43,0.08)', color: '#c0392b' }}>
              该群已被封禁
            </div>
          )}
          {buttonState === 'pending' && (
            <div className="w-full py-3.5 rounded-2xl text-center text-[14px] font-medium"
              style={{ background: 'rgba(160,144,128,0.08)', color: '#a09080' }}>
              等待审核中
            </div>
          )}
          {buttonState === 'is-member' && (
            <button onClick={() => navigate(`/messages/group/${groupId}`, {
              state: { groupName: group?.name, groupAvatar: group?.avatar }
            })}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white text-[15px] font-bold active:scale-[0.98] transition-all"
              style={{
                background: 'linear-gradient(135deg, #d4a574, #c49563)',
                boxShadow: '0 4px 20px rgba(200,149,107,0.4)'
              }}>
              <MessageCircle size={17} />发消息
            </button>
          )}
          {(buttonState === 'join-direct' || buttonState === 'join-approval') && (
            <button onClick={() => {
              if (buttonState === 'join-direct') {
                handleJoin();
              } else {
                setJoinMsg('');
                setShowJoinDialog(true);
              }
            }}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white text-[15px] font-bold active:scale-[0.98] transition-all"
              style={{
                background: 'linear-gradient(135deg, #d4a574, #c49563)',
                boxShadow: '0 4px 20px rgba(200,149,107,0.4)'
              }}>
              <UserPlus size={17} />
              {buttonState === 'join-direct' ? '加入群聊' : '申请加入'}
            </button>
          )}
        </div>
      )}

      {/* Join dialog */}
      <AnimatePresence>
        {showJoinDialog && (
          <motion.div className="fixed inset-0 z-[400] flex items-center justify-center px-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowJoinDialog(false)} />
            <motion.div className="relative rounded-2xl w-full max-w-sm shadow-xl bg-white overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h3 className="text-base font-bold text-[#3d2e1f]">申请加入群聊</h3>
                <button onClick={() => setShowJoinDialog(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f0eae0] transition-colors">
                  <X size={18} className="text-[#a09080]" />
                </button>
              </div>
              <div className="px-5 pb-3">
                <p className="text-sm text-[#5c4330] mb-3">申请加入 <span className="font-bold text-[#3d2e1f]">{group?.name}</span>，需要群主审批</p>
                <textarea value={joinMsg} onChange={e => setJoinMsg(e.target.value)}
                  placeholder="请输入验证消息（可选）"
                  className="w-full h-20 px-3 py-2.5 rounded-xl text-sm text-[#3d2e1f] placeholder:text-[#a09080] resize-none focus:outline-none transition-all bg-[#f5efe6] border border-[#e8e0d6] focus:border-[#d4a574]"
                />
              </div>
              <div className="flex gap-3 px-5 pb-5">
                <button onClick={() => setShowJoinDialog(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-[#5c4330] bg-[#f0eae0]">取消</button>
                <button onClick={handleJoin} disabled={joining}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50"
                  style={{ background: '#d4a574' }}>
                  {joining ? '发送中...' : '发送申请'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
