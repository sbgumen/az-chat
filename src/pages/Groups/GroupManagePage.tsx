import { RemoteImage } from '../../components/RemoteImage';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, ChevronRight, Shield, UserMinus, Crown, Check, X, Megaphone, VolumeX, Loader2 } from 'lucide-react';
import { updateGroup, setGroupAdmin, kickMember, uploadGroupAvatar, getGroupDetail, unmuteMember, getGroupMutes } from '../../api/groups';
import { NoticeListPage } from './NoticeListPage';
import { useParams } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';
import { UserProfilePage } from '../Profile/UserProfilePage';

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
  notice: string;
  description?: string;
  tags?: string;
  join_type?: number;
  members: Member[];
  my_role: 'owner' | 'admin' | 'member';
}

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getAvatar = (a: string) => a?.startsWith('http') ? a : `${apiBase}${a}`;

type SubPage = null | 'profile' | 'members' | 'admins' | 'join_type' | 'notices' | 'mutes';

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

function ConfirmSheet({ title, desc, confirmLabel, onConfirm, onCancel }: {
  title: string; desc: string; confirmLabel: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <motion.div className="fixed inset-0 z-[420] bg-black/40 flex items-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onCancel}>
      <motion.div className="w-full bg-white rounded-t-3xl pb-[env(safe-area-inset-bottom)]"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-4" />
        <div className="px-6 pb-2">
          <h3 className="text-[17px] font-semibold text-gray-900 text-center">{title}</h3>
          <p className="text-[13px] text-gray-500 text-center mt-1.5 leading-relaxed">{desc}</p>
        </div>
        <div className="px-4 py-4 flex flex-col gap-2.5">
          <button onClick={onConfirm}
            className="w-full py-3.5 rounded-2xl font-semibold text-[15px] bg-red-500 text-white transition-all active:scale-[0.98]">
            {confirmLabel}
          </button>
          <button onClick={onCancel}
            className="w-full py-3.5 rounded-2xl font-medium text-[15px] bg-gray-100 text-gray-700 transition-all active:scale-[0.98]">
            取消
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function GroupManagePage() {
  const { groupId: groupIdParam } = useParams<{ groupId: string }>();
  const groupId = parseInt(groupIdParam || '0');
  const goBack = useSmartBack(`/messages/group/${groupId}`);
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [subPage, setSubPage] = useState<SubPage>(null);
  const subPageRef = useRef<SubPage>(null);
  subPageRef.current = subPage;

  useEffect(() => {
    getGroupDetail(groupId).then((res: any) => {
      setGroup(res.data ?? res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [groupId]);

  if (loading || !group) return (
    <motion.div className="fixed inset-0 z-[300] bg-cream-100 flex items-center justify-center"
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
      <div className="w-8 h-8 rounded-full border-2 border-warm-400 border-t-transparent animate-spin" />
    </motion.div>
  );

  if (subPage === 'profile') return <GroupProfileEdit group={group} onClose={() => setSubPage(null)} onUpdated={() => { getGroupDetail(groupId).then((r: any) => setGroup(r.data ?? r)); }} />;
  if (subPage === 'members') return <GroupMembersManage group={group} onClose={() => setSubPage(null)} onUpdated={() => { getGroupDetail(groupId).then((r: any) => setGroup(r.data ?? r)); }} />;
  if (subPage === 'admins') return <GroupAdminManage group={group} onClose={() => setSubPage(null)} onUpdated={() => { getGroupDetail(groupId).then((r: any) => setGroup(r.data ?? r)); }} />;
  if (subPage === 'join_type') return <GroupJoinType group={group} onClose={() => setSubPage(null)} onUpdated={() => { getGroupDetail(groupId).then((r: any) => setGroup(r.data ?? r)); }} />;
  if (subPage === 'notices') return <NoticeListPage isManageView onClose={() => setSubPage(null)} />;
  if (subPage === 'mutes') return <GroupMutesManage groupId={groupId} onClose={() => setSubPage(null)} />;

  const isOwner = group.my_role === 'owner';

  const menuItems = [
    { key: 'profile' as SubPage, icon: <Camera className="w-4 h-4" />, label: '群资料', desc: '群名称、简介、标签、头像' },
    { key: 'notices' as SubPage, icon: <Megaphone className="w-4 h-4" />, label: '群公告', desc: '发布公告、设置播报' },
    { key: 'members' as SubPage, icon: <UserMinus className="w-4 h-4" />, label: '群成员管理', desc: '移除成员' },
    { key: 'mutes' as SubPage, icon: <VolumeX className="w-4 h-4" />, label: '禁言管理', desc: '查看/解除禁言成员' },
    ...(isOwner ? [{ key: 'admins' as SubPage, icon: <Shield className="w-4 h-4" />, label: '管理员设置', desc: '设置/取消管理员' }] : []),
    { key: 'join_type' as SubPage, icon: <Crown className="w-4 h-4" />, label: '加群方式', desc: group.join_type === 1 ? '当前：需要审批' : '当前：直接加入' },
  ];

  return (
    <motion.div className="fixed inset-0 z-[300] flex flex-col bg-cream-100"
      
          
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}>

      <header className="flex items-center px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 bg-white border-b border-black/5">
        <button onClick={goBack} className="p-1.5 -ml-1 rounded-xl hover:bg-black/5 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="ml-3 text-[17px] font-semibold text-gray-900">群管理</h1>
      </header>

      <div className="flex-1 overflow-y-auto py-4 px-4 space-y-3">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {menuItems.map((item, i) => (
            <button key={item.key} onClick={() => setSubPage(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors ${i < menuItems.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <div className="w-8 h-8 bg-warm-50 rounded-xl flex items-center justify-center text-warm-600 flex-shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 text-left">
                <div className="text-[15px] font-medium text-gray-900">{item.label}</div>
                <div className="text-[12px] text-gray-400 mt-0.5">{item.desc}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function GroupProfileEdit({ group, onClose, onUpdated }: { group: GroupDetail; onClose: () => void; onUpdated: () => void }) {
  const [name, setName] = useState(group.name);
  const [desc, setDesc] = useState(group.description || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(() => {
    try { return JSON.parse(group.tags || '[]'); } catch { return []; }
  });
  const [avatar, setAvatar] = useState(group.avatar);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2000);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const res: any = await uploadGroupAvatar(file);
    if (res.code === 0) { setAvatar(res.data.url); showToast('头像已更新'); }
    else showToast(res.message || '上传失败', 'error');
    e.target.value = '';
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 5) { setTags([...tags, t]); setTagInput(''); }
  };

  const handleSave = async () => {
    if (!name.trim()) { showToast('群名称不能为空', 'error'); return; }
    setSaving(true);
    try {
      const res: any = await updateGroup(group.id, { name: name.trim(), description: desc.trim(), tags, avatar });
      if (res.code === 0 || !res.code) { showToast('保存成功'); onUpdated(); setTimeout(onClose, 800); }
      else showToast(res.message || '保存失败', 'error');
    } finally { setSaving(false); }
  };

  return (
    <motion.div className="fixed inset-0 z-[310] flex flex-col bg-cream-100"
      
            
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}>

      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </AnimatePresence>

      <header className="flex items-center justify-between px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 bg-white border-b border-black/5">
        <button onClick={onClose} className="p-1.5 -ml-1 rounded-xl hover:bg-black/5 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-[17px] font-semibold text-gray-900">群资料</h1>
        <button onClick={handleSave} disabled={saving}
          className="text-[15px] font-semibold text-warm-500 disabled:opacity-40 px-1">
          {saving ? '保存中' : '保存'}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto py-4 px-4 space-y-3">
        {/* 头像 */}
        <div className="flex flex-col items-center py-4">
          <div className="relative cursor-pointer" onClick={() => fileRef.current?.click()}>
            <RemoteImage src={getAvatar(avatar)} alt="" className="w-20 h-20 rounded-2xl object-cover bg-gray-100 shadow-md" />
            <div className="absolute inset-0 rounded-2xl bg-black/35 flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <p className="text-xs text-gray-400 mt-2">点击更换群头像</p>
        </div>

        {/* 群名称 + 简介 */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-3.5 border-b border-gray-50">
            <label className="text-[11px] text-gray-400 font-medium uppercase tracking-wide block mb-1.5">群名称</label>
            <input value={name} onChange={e => setName(e.target.value)} maxLength={30}
              className="w-full text-[15px] text-gray-900 outline-none bg-transparent" placeholder="请输入群名称" />
          </div>
          <div className="px-4 py-3.5">
            <label className="text-[11px] text-gray-400 font-medium uppercase tracking-wide block mb-1.5">群简介</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} maxLength={200} rows={3}
              className="w-full text-[14px] text-gray-700 outline-none resize-none bg-transparent leading-relaxed" placeholder="介绍一下这个群..." />
          </div>
        </div>

        {/* 标签 */}
        <div className="bg-white rounded-2xl px-4 py-3.5 shadow-sm">
          <label className="text-[11px] text-gray-400 font-medium uppercase tracking-wide block mb-2.5">群标签（最多5个）</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map(t => (
              <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-warm-50 text-warm-600 rounded-full text-[12px] font-medium border border-warm-200/60">
                {t}
                <button onClick={() => setTags(tags.filter(x => x !== t))} className="text-warm-400 hover:text-warm-600 ml-0.5">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          {tags.length < 5 && (
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()}
                className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-warm-400 transition-colors" placeholder="输入标签后回车" maxLength={10} />
              <button onClick={addTag} className="px-4 py-2 bg-warm-500 text-white rounded-xl text-sm font-medium active:scale-95 transition-all">添加</button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function GroupMembersManage({ group, onClose, onUpdated }: { group: GroupDetail; onClose: () => void; onUpdated: () => void }) {
  const [members, setMembers] = useState(group.members.filter(m => m.role !== 'owner'));
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirm, setConfirm] = useState<{ id: number; nickname: string } | null>(null);
  const [viewUserId, setViewUserId] = useState<number | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2000);
  };

  const handleKick = async () => {
    if (!confirm) return;
    const res: any = await kickMember(group.id, confirm.id);
    setConfirm(null);
    if (res.code === 0) { setMembers(prev => prev.filter(m => m.id !== confirm.id)); showToast(`已移除 ${confirm.nickname}`); onUpdated(); }
    else showToast(res.message || '移除失败', 'error');
  };

  return (
    <motion.div className="fixed inset-0 z-[310] flex flex-col bg-cream-100"
      
            
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}>

      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </AnimatePresence>

      <header className="flex items-center px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 bg-white border-b border-black/5">
        <button onClick={onClose} className="p-1.5 -ml-1 rounded-xl hover:bg-black/5 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="ml-3 text-[17px] font-semibold text-gray-900">群成员管理</h1>
        <span className="ml-2 text-[13px] text-gray-400">{members.length}人</span>
      </header>

      <div className="flex-1 overflow-y-auto py-3 px-4">
        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-4xl mb-3">👥</span>
            <p className="text-sm">暂无可管理的成员</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {members.map((m, i) => (
              <div key={m.id} className={`flex items-center px-4 py-3 ${i < members.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <RemoteImage src={getAvatar(m.avatar)} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-100 cursor-pointer active:opacity-70"
                  onClick={() => setViewUserId(m.id)} />
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[15px] text-gray-900 truncate font-medium">{m.nickname}</span>
                    {m.role === 'admin' && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded-full text-[10px] font-medium">
                        <Shield className="w-2.5 h-2.5" />管理员
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400">ID: {m.id}</span>
                </div>
                <button onClick={() => setConfirm({ id: m.id, nickname: m.nickname })}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 text-red-500 text-[13px] font-medium active:scale-95 transition-all">
                  <UserMinus className="w-3.5 h-3.5" />移除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {confirm && (
          <ConfirmSheet
            title={`移除 ${confirm.nickname}`}
            desc="移除后该成员将退出群聊，确定要移除吗？"
            confirmLabel="确定移除"
            onConfirm={handleKick}
            onCancel={() => setConfirm(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {viewUserId !== null && <UserProfilePage userId={viewUserId} onClose={() => setViewUserId(null)} zIndex={420} />}
      </AnimatePresence>
    </motion.div>
  );
}

function GroupAdminManage({ group, onClose, onUpdated }: { group: GroupDetail; onClose: () => void; onUpdated: () => void }) {
  const [members, setMembers] = useState(group.members.filter(m => m.role !== 'owner'));
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [viewUserId, setViewUserId] = useState<number | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2000);
  };

  const handleToggle = async (m: Member) => {
    const isAdmin = m.role !== 'admin';
    const res: any = await setGroupAdmin(group.id, m.id, isAdmin);
    if (res.code === 0) {
      setMembers(prev => prev.map(x => x.id === m.id ? { ...x, role: isAdmin ? 'admin' : 'member' } : x));
      showToast(isAdmin ? `已设置 ${m.nickname} 为管理员` : `已取消 ${m.nickname} 的管理员`);
      onUpdated();
    } else showToast(res.message || '操作失败', 'error');
  };

  return (
    <motion.div className="fixed inset-0 z-[310] flex flex-col bg-cream-100"
      
            
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}>

      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </AnimatePresence>

      <header className="flex items-center px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 bg-white border-b border-black/5">
        <button onClick={onClose} className="p-1.5 -ml-1 rounded-xl hover:bg-black/5 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="ml-3 text-[17px] font-semibold text-gray-900">管理员设置</h1>
      </header>

      <p className="text-[12px] text-gray-400 px-4 py-2.5">管理员可以踢人、审批入群申请</p>

      <div className="flex-1 overflow-y-auto px-4">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {members.map((m, i) => (
            <div key={m.id} className={`flex items-center px-4 py-3 ${i < members.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <RemoteImage src={getAvatar(m.avatar)} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-100 cursor-pointer active:opacity-70"
                onClick={() => setViewUserId(m.id)} />
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[15px] font-medium text-gray-900 truncate">{m.nickname}</span>
                  {m.role === 'admin' && <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                </div>
              </div>
              <button onClick={() => handleToggle(m)}
                className={`px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-all active:scale-95 ${m.role === 'admin' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {m.role === 'admin' ? '取消管理员' : '设为管理员'}
              </button>
            </div>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {viewUserId !== null && <UserProfilePage userId={viewUserId} onClose={() => setViewUserId(null)} zIndex={420} />}
      </AnimatePresence>
    </motion.div>
  );
}

function GroupJoinType({ group, onClose, onUpdated }: { group: GroupDetail; onClose: () => void; onUpdated: () => void }) {
  const [joinType, setJoinType] = useState(group.join_type ?? 0);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res: any = await updateGroup(group.id, { join_type: joinType });
      if (res.code === 0 || !res.code) { showToast('设置已保存'); onUpdated(); setTimeout(onClose, 800); }
      else showToast(res.message || '保存失败', 'error');
    } finally { setSaving(false); }
  };

  const options = [
    { value: 0, label: '直接加入', desc: '任何人搜索到群后可直接加入', icon: <Check className="w-4 h-4" /> },
    { value: 1, label: '需要审批', desc: '申请需群主或管理员审批后才能加入', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <motion.div className="fixed inset-0 z-[310] flex flex-col bg-cream-100"
      
            
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}>

      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </AnimatePresence>

      <header className="flex items-center justify-between px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 bg-white border-b border-black/5">
        <button onClick={onClose} className="p-1.5 -ml-1 rounded-xl hover:bg-black/5 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-[17px] font-semibold text-gray-900">加群方式</h1>
        <button onClick={handleSave} disabled={saving}
          className="text-[15px] font-semibold text-warm-500 disabled:opacity-40 px-1">
          {saving ? '保存中' : '保存'}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto py-4 px-4">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {options.map((opt, i) => (
            <button key={opt.value} onClick={() => setJoinType(opt.value)}
              className={`w-full flex items-center gap-3 px-4 py-4 transition-colors active:bg-gray-50 ${i < options.length - 1 ? 'border-b border-gray-50' : ''} ${joinType === opt.value ? 'bg-warm-50/50' : ''}`}>
              <div className="w-8 h-8 bg-warm-50 rounded-xl flex items-center justify-center text-warm-600 flex-shrink-0">
                {opt.icon}
              </div>
              <div className="flex-1 text-left">
                <div className="text-[15px] font-medium text-gray-900">{opt.label}</div>
                <div className="text-[12px] text-gray-400 mt-0.5">{opt.desc}</div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${joinType === opt.value ? 'border-warm-500 bg-warm-500' : 'border-gray-300'}`}>
                {joinType === opt.value && <Check className="w-3 h-3 text-white" />}
              </div>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ===== 禁言管理 =====
function GroupMutesManage({ groupId, onClose }: { groupId: number; onClose: () => void }) {
  const [mutes, setMutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const load = async () => {
    try {
      const res: any = await getGroupMutes(groupId);
      if (res.code === 0 || res.data) setMutes(res.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [groupId]);

  const handleUnmute = async (userId: number) => {
    if (acting) return; setActing(true);
    try {
      await unmuteMember(groupId, userId);
      setMutes(prev => prev.filter(m => m.user_id !== userId));
    } catch {}
    setActing(false);
  };

  const base = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;

  return (
    <motion.div className="fixed inset-0 z-[300] flex flex-col bg-cream-100 overflow-hidden"
      
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
      <div className="flex items-center gap-3 px-4 py-3"
        style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)' }}>
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-200">
          <ArrowLeft size={22} className="text-cream-800" /></button>
        <h1 className="text-[17px] font-semibold text-gray-900">禁言管理</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={22} className="text-cream-400 animate-spin" /></div>
        ) : mutes.length === 0 ? (
          <div className="text-center py-16 text-cream-400 text-sm">暂无禁言成员</div>
        ) : (
          <div className="flex flex-col gap-2">
            {mutes.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm">
                <img src={m.avatar ? `${base}${m.avatar}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user_id}`}
                  className="w-10 h-10 rounded-full object-cover bg-gray-100 flex-shrink-0" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-gray-900">{m.nickname}</p>
                  <p className="text-[11px] text-gray-400">
                    {m.muted_until
                      ? <>禁言至 {new Date(m.muted_until).toLocaleString('zh-CN')}</>
                      : '永久禁言'}
                  </p>
                </div>
                <button onClick={() => handleUnmute(m.user_id)} disabled={acting}
                  className="px-3 py-1.5 rounded-full text-[12px] font-medium text-green-600 bg-green-50 disabled:opacity-50">
                  解除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
