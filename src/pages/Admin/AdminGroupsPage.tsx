import { RemoteImage } from '../../components/RemoteImage';
import { useState, useEffect, useRef } from 'react';
import { Search, Edit2, Ban, Trash2, X, Check, Shield, UserPlus } from 'lucide-react';
import { adminApi } from '../../api/admin';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getAvatar = (a: string) => a?.startsWith('http') ? a : `${apiBase}${a}`;

interface Group { id: number; name: string; avatar: string; owner_id: number; owner_name: string; notice: string; max_members: number; member_count: number; is_banned: number; is_system?: number; system_mode?: string; created_at: string; }

function EditGroupModal({ group, onClose, onSaved }: { group: Group; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: group.name, notice: group.notice, max_members: group.max_members });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    await adminApi.updateGroup(group.id, form);
    setSaving(false);
    onSaved(); onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-t-3xl md:rounded-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-cream-900">编辑群聊 #{group.id}</span>
          <button onClick={onClose}><X size={18} className="text-cream-500" /></button>
        </div>
        {[
          { label: '群名称', key: 'name', type: 'text' },
          { label: '最大成员数', key: 'max_members', type: 'number' },
        ].map(({ label, key, type }) => (
          <div key={key}>
            <label className="text-xs text-cream-600 mb-1 block">{label}</label>
            <input type={type} value={(form as any)[key]} onChange={e => set(key, type === 'number' ? Number(e.target.value) : e.target.value)}
              className="w-full border border-cream-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-warm-400" />
          </div>
        ))}
        <div>
          <label className="text-xs text-cream-600 mb-1 block">群公告</label>
          <textarea value={form.notice} onChange={e => set('notice', e.target.value)} rows={3}
            className="w-full border border-cream-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-warm-400 resize-none" />
        </div>
        <button onClick={save} disabled={saving}
          className="w-full py-3 rounded-xl bg-warm-500 text-white text-sm font-medium disabled:opacity-50">
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}

// Manage members modal for system groups
function ManageMembersModal({ group, onClose, onSaved }: { group: Group; onClose: () => void; onSaved: () => void }) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addId, setAddId] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [group.id]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const { default: api } = await import('../../api/index');
      const r: any = await api.get(`/api/groups/${group.id}`);
      if (r.code === 0 && r.data?.members) {
        setMembers(r.data.members);
      }
    } catch {}
    setLoading(false);
  };

  const handleAdd = async () => {
    const ids = addId.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
    if (!ids.length) return;
    setAdding(true);
    await adminApi.addSystemGroupMembers(group.id, ids);
    setAddId('');
    setAdding(false);
    loadMembers();
    onSaved();
  };

  const handleRemove = async (userId: number) => {
    await adminApi.removeSystemGroupMember(group.id, userId);
    loadMembers();
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-t-3xl md:rounded-2xl p-5 space-y-3 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-cream-900">管理成员 — {group.name}</span>
          <button onClick={onClose}><X size={18} className="text-cream-500" /></button>
        </div>
        {/* Add members */}
        <div className="flex gap-2">
          <input
            type="text" value={addId} onChange={e => setAddId(e.target.value)}
            placeholder="输入用户 ID，多个用逗号分隔"
            className="flex-1 border border-cream-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-400"
          />
          <button
            onClick={handleAdd} disabled={adding || !addId.trim()}
            className="px-3 py-2 rounded-xl bg-violet-500 text-white text-sm disabled:opacity-50"
          >
            {adding ? '...' : '添加'}
          </button>
        </div>
        {/* Member list */}
        {loading ? (
          <div className="text-center py-4 text-cream-400 text-sm">加载中...</div>
        ) : (
          <div className="space-y-1">
            {members.map((m: any) => (
              <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-cream-50">
                <span className="flex-1 text-sm text-cream-900 truncate">{m.nickname || `用户#${m.id}`}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cream-100 text-cream-500">{m.role}</span>
                {m.role !== 'owner' && (
                  <button
                    onClick={() => handleRemove(m.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminGroupsPage() {
  const [list, setList] = useState<Group[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [systemType, setSystemType] = useState<string>(''); // '' | 'system' | 'normal'
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [confirm, setConfirm] = useState<{ type: 'ban' | 'delete'; group: Group } | null>(null);
  const [manageMembers, setManageMembers] = useState<Group | null>(null);
  const searchRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const load = async (p = page, kw = keyword, st = systemType) => {
    setLoading(true);
    const r: any = await adminApi.getGroups({
      page: p, limit: 20,
      keyword: kw || undefined,
      systemType: st || undefined,
    });
    if (r.code === 0) { setList(r.data.list); setTotal(r.data.total); }
    setLoading(false);
  };

  useEffect(() => { load(1, '', ''); }, []);

  const onSearch = (v: string) => {
    setKeyword(v);
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => { setPage(1); load(1, v, systemType); }, 400);
  };

  const onSystemTypeChange = (v: string) => {
    setSystemType(v);
    setPage(1);
    load(1, keyword, v);
  };

  const toggleBan = async (g: Group) => {
    await adminApi.banGroup(g.id, !g.is_banned);
    load(page, keyword, systemType); setConfirm(null);
  };

  const deleteGroup = async (g: Group) => {
    await adminApi.deleteGroup(g.id);
    load(page, keyword, systemType); setConfirm(null);
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2 pt-2">
        <h2 className="text-base font-semibold text-cream-900 flex-1">群聊管理</h2>
        <span className="text-xs text-cream-500">共 {total} 个</span>
      </div>

      {/* Filter row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream-400" />
          <input value={keyword} onChange={e => onSearch(e.target.value)} placeholder="搜索群名称"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-cream-200 text-sm outline-none focus:border-warm-400 bg-white" />
        </div>
        <select
          value={systemType}
          onChange={e => onSystemTypeChange(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-cream-200 text-sm bg-white text-cream-700 outline-none"
        >
          <option value="">全部群聊</option>
          <option value="system">系统群聊</option>
          <option value="normal">普通群聊</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-2xl bg-cream-200 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {list.map(g => (
            <div key={g.id} className="bg-white rounded-2xl border border-cream-200/60 px-4 py-3 flex items-center gap-3">
              <RemoteImage src={getAvatar(g.avatar)} alt="" className="w-10 h-10 rounded-xl object-cover bg-cream-200 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {g.is_system === 1 && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold text-violet-600 bg-violet-50 shrink-0">
                      <Shield size={10} strokeWidth={2.5} />官方
                    </span>
                  )}
                  <span className="text-sm font-medium text-cream-900 truncate">{g.name}</span>
                  {g.is_banned === 1 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-500 shrink-0">已封禁</span>}
                </div>
                <div className="text-[11px] text-cream-500">
                  ID:{g.id} · {g.member_count}/{g.max_members}人 · 群主:{g.owner_name}
                  {g.is_system === 1 && g.system_mode && (
                    <span className={`ml-1 px-1 py-0.5 rounded text-[9px] font-medium ${g.system_mode === 'all' ? 'bg-blue-50 text-blue-600' : 'bg-violet-50 text-violet-600'}`}>
                      {g.system_mode === 'all' ? '全员群' : '指定用户'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {g.is_system === 1 && g.system_mode === 'selected' && (
                  <button
                    onClick={() => setManageMembers(g)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-violet-50 text-violet-500"
                  >
                    <UserPlus size={14} />
                  </button>
                )}
                <button onClick={() => setEditing(g)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-cream-100 text-cream-500">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => setConfirm({ type: 'ban', group: g })}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-cream-100 ${g.is_banned ? 'text-green-500' : 'text-orange-400'}`}>
                  {g.is_banned ? <Check size={14} /> : <Ban size={14} />}
                </button>
                <button onClick={() => setConfirm({ type: 'delete', group: g })} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2 pt-1">
          <button disabled={page <= 1} onClick={() => { setPage(p => p - 1); load(page - 1, keyword, systemType); }}
            className="px-3 py-1.5 rounded-lg border border-cream-200 text-sm disabled:opacity-40">上一页</button>
          <span className="px-3 py-1.5 text-sm text-cream-600">{page} / {Math.ceil(total / 20)}</span>
          <button disabled={page >= Math.ceil(total / 20)} onClick={() => { setPage(p => p + 1); load(page + 1, keyword, systemType); }}
            className="px-3 py-1.5 rounded-lg border border-cream-200 text-sm disabled:opacity-40">下一页</button>
        </div>
      )}

      {editing && <EditGroupModal group={editing} onClose={() => setEditing(null)} onSaved={() => load(page, keyword, systemType)} />}
      {manageMembers && <ManageMembersModal group={manageMembers} onClose={() => setManageMembers(null)} onSaved={() => load(page, keyword, systemType)} />}

      {confirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40" onClick={() => setConfirm(null)}>
          <div className="bg-white rounded-2xl p-5 mx-4 max-w-xs w-full space-y-3" onClick={e => e.stopPropagation()}>
            <p className="text-sm text-cream-900 font-medium">
              {confirm.type === 'ban'
                ? `确认${confirm.group.is_banned ? '解封' : '封禁'}群聊「${confirm.group.name}」？`
                : confirm.group.is_system
                  ? `确认删除系统群聊「${confirm.group.name}」？删除后所有成员将退出。`
                  : `确认删除群聊「${confirm.group.name}」？此操作不可恢复。`}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-cream-200 text-sm text-cream-700">取消</button>
              <button onClick={() => confirm.type === 'ban' ? toggleBan(confirm.group) : deleteGroup(confirm.group)}
                className={`flex-1 py-2.5 rounded-xl text-sm text-white font-medium ${confirm.type === 'delete' ? 'bg-red-500' : 'bg-orange-500'}`}>
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
