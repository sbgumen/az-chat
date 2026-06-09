import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';
import { motion, AnimatePresence } from 'framer-motion';
import { RemoteImage } from '../../components/RemoteImage';
import { ArrowLeft, User, Star, VolumeX, UserX, ChevronRight } from 'lucide-react';
import { getGroupDetail, setGroupAdmin, kickMember, muteMember, unmuteMember } from '../../api/groups';
import { MuteDurationPicker } from '../../components/MuteDurationPicker';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getUrl = (u: string) => u?.startsWith('http') ? u : `${apiBase}${u}`;

interface MemberInfo {
  id: number; nickname: string; avatar: string; role: 'owner' | 'admin' | 'member'; level: number; joined_at: string;
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="mx-4 rounded-2xl overflow-hidden" style={{ background: '#fdfaf6' }}>{children}</div>;
}

function ActionRow({ icon, label, desc, danger, onClick }: {
  icon: React.ReactNode;
  label: string;
  desc?: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${
        onClick ? 'active:bg-black/[0.02] transition-colors' : ''
      }`}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: danger ? 'rgba(239,68,68,0.06)' : 'rgba(212,165,116,0.08)' }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-[14px] font-medium ${danger ? 'text-red-500' : 'text-[#3d2e1f]'}`}>{label}</div>
        {desc && <div className="text-[11px] text-[#a09080] mt-0.5">{desc}</div>}
      </div>
      {onClick && <ChevronRight size={16} className="text-[#c4b8a8] flex-shrink-0" />}
    </Comp>
  );
}

function Divider() {
  return <div className="mx-4 h-[0.5px] bg-[#e8e0d6]" />;
}

export function MemberManagePage() {
  const navigate = useNavigate();
  const { groupId, userId } = useParams<{ groupId: string; userId: string }>();
  const gid = parseInt(groupId || '0');
  const uid = parseInt(userId || '0');
  const goBack = useSmartBack(`/messages/group/${groupId}/members`);

  const [member, setMember] = useState<MemberInfo | null>(null);
  const [myRole, setMyRole] = useState<string>('');
  const [muteDuration, setMuteDuration] = useState<number | null>(null);
  const [mutedUntil, setMutedUntil] = useState<string | null>(null);
  const [showMutePicker, setShowMutePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await getGroupDetail(gid);
        if (res.code === 0 || res.data) {
          const data = res.data || res;
          const members: MemberInfo[] = data.members || [];
          const found = members.find(m => m.id === uid);
          if (found) setMember(found);
          const me = members.find(m => m.id === (JSON.parse(localStorage.getItem('az_user') || '{}').id || 0));
          if (me) setMyRole(me.role);
          if (data.mutes) {
            const mute = data.mutes.find((m: any) => m.user_id === uid);
            if (mute) setMutedUntil(mute.muted_until);
          }
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [gid, uid]);

  const isOwner = myRole === 'owner';
  const isAdmin = myRole === 'admin';
  const canManage = isOwner || (isAdmin && member?.role === 'member');
  const canToggleAdmin = isOwner && member?.role !== 'owner';

  const handleSetAdmin = async (set: boolean) => {
    if (acting) return; setActing(true);
    try {
      await setGroupAdmin(gid, uid, set);
      setMember(prev => prev ? { ...prev, role: set ? 'admin' : 'member' } : prev);
    } catch { /* ignore */ }
    setActing(false);
  };

  const handleMute = async () => {
    if (acting) return;
    if (muteDuration === null) return;
    setActing(true);
    try {
      await muteMember(gid, uid, muteDuration);
      const until = muteDuration === 0 ? null : new Date(Date.now() + muteDuration * 60000).toISOString();
      setMutedUntil(until);
    } catch { /* ignore */ }
    setActing(false);
  };

  const handleUnmute = async () => {
    if (acting) return; setActing(true);
    try {
      await unmuteMember(gid, uid);
      setMutedUntil(null);
    } catch { /* ignore */ }
    setActing(false);
  };

  const handleKick = async () => {
    if (acting) return;
    if (!confirm(`确定将 ${member?.nickname} 移出群聊？`)) return;
    setActing(true);
    try {
      await kickMember(gid, uid);
      goBack();
    } catch { /* ignore */ }
    setActing(false);
  };

  if (loading) return (
    <motion.div className="fixed inset-0 z-[250] bg-[#f5f1eb] flex items-center justify-center"
      
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}>
      <div className="w-6 h-6 rounded-full border-2 border-[#d4a574] border-t-transparent animate-spin" />
    </motion.div>
  );

  if (!member) return (
    <motion.div className="fixed inset-0 z-[250] bg-[#f5f1eb] flex items-center justify-center"
      
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}>
      <p className="text-[#a09080] text-sm">成员不存在</p>
    </motion.div>
  );

  const roleLabel = { owner: '群主', admin: '管理员', member: '成员' }[member.role];
  const roleColor = { owner: '#b8860b', admin: '#6b8ba0', member: '#a09080' }[member.role];

  return (
    <motion.div className="fixed inset-0 z-[250] flex flex-col bg-[#f5f1eb]"
      
      
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 bg-[#faf7f3]/90 backdrop-blur-lg flex-shrink-0">
        <button onClick={goBack} className="p-1.5 -ml-1 rounded-lg hover:bg-black/5 transition-colors">
          <ArrowLeft size={20} className="text-[#5c4330]" />
        </button>
        <span className="text-[17px] font-semibold text-[#3d2e1f]">成员管理</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="h-3" />

        {/* Profile card */}
        <Card>
          <div className="flex flex-col items-center py-6 px-4">
            <RemoteImage src={getUrl(member.avatar)} alt=""
              className="w-18 h-18 rounded-full object-cover bg-[#f0eae0]" style={{ width: 72, height: 72 }} />
            <h2 className="text-lg font-bold text-[#3d2e1f] mt-3">{member.nickname}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                style={{ background: 'rgba(212,165,116,0.1)', color: roleColor }}>
                {roleLabel}
              </span>
              <span className="text-[12px] text-[#a09080]">ID: {member.id} · LV.{member.level || 1}</span>
            </div>
          </div>
        </Card>

        <div className="h-3" />

        {/* Actions */}
        <Card>
          <ActionRow
            icon={<User size={17} style={{ color: '#d4a574' }} />}
            label="查看主页"
            onClick={() => navigate(`/user/${uid}`)}
          />

          {canToggleAdmin && (
            <>
              <Divider />
              <ActionRow
                icon={<Star size={17} style={{ color: '#6b8ba0' }} />}
                label={member.role === 'admin' ? '取消管理员' : '设为管理员'}
                onClick={() => handleSetAdmin(member.role !== 'admin')}
              />
            </>
          )}

          {canManage && (
            <>
              <Divider />
              {mutedUntil ? (
                <ActionRow
                  icon={<VolumeX size={17} style={{ color: '#22c55e' }} />}
                  label="解除禁言"
                  desc={mutedUntil === null ? '永久禁言中' : `禁言至 ${new Date(mutedUntil).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                  onClick={handleUnmute}
                />
              ) : (
                <ActionRow
                  icon={<VolumeX size={17} style={{ color: '#d97706' }} />}
                  label="禁言"
                  desc="选择禁言时长"
                  onClick={() => setShowMutePicker(true)}
                />
              )}
            </>
          )}

          {canManage && (
            <>
              <Divider />
              <ActionRow
                icon={<UserX size={17} style={{ color: '#ef4444' }} />}
                label="移出群聊"
                danger
                onClick={handleKick}
              />
            </>
          )}
        </Card>

        <div className="h-8" />
      </div>

      {/* Mute duration picker overlay */}
      <AnimatePresence>
        {showMutePicker && (
          <motion.div className="fixed inset-0 z-[350] flex flex-col bg-[#f5f1eb]"
            
            
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
            <div className="flex items-center gap-3 px-4 py-3 bg-[#faf7f3]/90 backdrop-blur-lg flex-shrink-0">
              <button onClick={() => setShowMutePicker(false)}
                className="p-1.5 -ml-1 rounded-lg hover:bg-black/5 transition-colors">
                <ArrowLeft size={20} className="text-[#5c4330]" />
              </button>
              <span className="text-[17px] font-semibold text-[#3d2e1f]">选择禁言时长</span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pt-6">
              <MuteDurationPicker selected={muteDuration} onSelect={(mins) => setMuteDuration(mins)} />
            </div>
            <div className="px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
              <button onClick={() => { handleMute(); setShowMutePicker(false); }}
                disabled={muteDuration === null || acting}
                className="w-full py-3.5 rounded-2xl text-[15px] font-semibold text-white disabled:opacity-50"
                style={{ background: '#d4a574' }}>
                {muteDuration === null ? '请选择禁言时长' : `确认禁言${muteDuration === 0 ? '（永久）' : ''}`}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default MemberManagePage;
