import { RemoteImage } from '../../components/RemoteImage';
import { useState, useEffect, useRef } from 'react';
import { Search, Edit2, Ban, Trash2, X, Check, UserPlus } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getAvatar = (a: string) => a?.startsWith('http') ? a : `${apiBase}${a}`;

interface User { id: number; phone: string; email: string; nickname: string; avatar: string; gender: number; level: number; exp: number; coins: number; role: string; is_banned: number; created_at: string; }

function EditModal({ user, currentUserId, onClose, onSaved }: { user: User; currentUserId: number; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ nickname: user.nickname, phone: user.phone || '', gender: user.gender, level: user.level, coins: user.coins, role: user.role, email: user.email || '', password: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const isSelf = user.id === currentUserId;
  const save = async () => {
    setSaving(true); setErr('');
    const payload: any = { ...form };
    if (!payload.password) delete payload.password;
    if (isSelf) delete payload.role; // 自己不能改身份
    const r: any = await adminApi.updateUser(user.id, payload);
    setSaving(false);
    if (r.code !== 0) { setErr(r.message); return; }
    onSaved(); onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-t-3xl md:rounded-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-cream-900">编辑用户 #{user.id}</span>
          <button onClick={onClose}><X size={18} className="text-cream-500" /></button>
        </div>
        {isSelf && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2">不能修改自己的身份</p>
        )}
        {[
          { label: '昵称', key: 'nickname', type: 'text' },
          { label: '手机号', key: 'phone', type: 'tel' },
          { label: '邮箱', key: 'email', type: 'email' },
          { label: '等级', key: 'level', type: 'number' },
          { label: '金币', key: 'coins', type: 'number' },
        ].map(({ label, key, type }) => (
          <div key={key}>
            <label className="text-xs text-cream-600 mb-1 block">{label}</label>
            <input type={type} value={(form as any)[key]}
              onChange={e => set(key, type === 'number' ? Number(e.target.value) : e.target.value)}
              className="w-full border border-cream-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-warm-400" />
          </div>
        ))}
        <div>
          <label className="text-xs text-cream-600 mb-1 block">性别</label>
          <select value={form.gender} onChange={e => set('gender', Number(e.target.value))}
            className="w-full border border-cream-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-warm-400">
            <option value={0}>未知</option><option value={1}>男</option><option value={2}>女</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-cream-600 mb-1 block">身份</label>
          <select value={form.role} disabled={isSelf} onChange={e => set('role', e.target.value)}
            className="w-full border border-cream-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-warm-400 disabled:opacity-50 disabled:bg-cream-50">
            <option value="user">普通用户</option>
            <option value="admin">系统管理员</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-cream-600 mb-1 block">修改密码（留空不修改）</label>
          <input type="password" value={form.password} placeholder="至少6位"
            onChange={e => set('password', e.target.value)}
            className="w-full border border-cream-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-warm-400" />
        </div>
        {err && <p className="text-xs text-red-500">{err}</p>}
        <button onClick={save} disabled={saving}
          className="w-full py-3 rounded-xl bg-warm-500 text-white text-sm font-medium disabled:opacity-50">
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.id ?? 0;

  const [list, setList] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [confirm, setConfirm] = useState<{ type: 'ban' | 'delete'; user: User } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createNickname, setCreateNickname] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState('');
  const searchRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const load = async (p = page, kw = keyword) => {
    setLoading(true);
    const r: any = await adminApi.getUsers({ page: p, limit: 20, keyword: kw || undefined });
    if (r.code === 0) { setList(r.data.list); setTotal(r.data.total); }
    setLoading(false);
  };

  useEffect(() => { load(1, keyword); setPage(1); }, []);

  const onSearch = (v: string) => {
    setKeyword(v);
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => { setPage(1); load(1, v); }, 400);
  };

  const toggleBan = async (u: User) => {
    await adminApi.banUser(u.id, !u.is_banned);
    load(page, keyword); setConfirm(null);
  };

  const deleteUser = async (u: User) => {
    await adminApi.deleteUser(u.id);
    load(page, keyword); setConfirm(null);
  };

  const canOperate = (u: User) => u.id !== currentUserId;

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2 pt-2">
        <h2 className="text-base font-semibold text-cream-900 flex-1">用户管理</h2>
        <span className="text-xs text-cream-500">共 {total} 人</span>
        <button onClick={() => { setShowCreate(true); setCreateNickname(''); setCreatePhone(''); setCreatePassword(''); setCreateMsg(''); }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-warm-500 text-white text-xs font-medium">
          <UserPlus size={13} />添加
        </button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream-400" />
        <input value={keyword} onChange={e => onSearch(e.target.value)} placeholder="搜索昵称/手机号"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-cream-200 text-sm outline-none focus:border-warm-400 bg-white" />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-2xl bg-cream-200 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {list.map(u => (
            <div key={u.id} className="bg-white rounded-2xl border border-cream-200/60 px-4 py-3 flex items-center gap-3">
              <RemoteImage src={getAvatar(u.avatar)} alt="" className="w-10 h-10 rounded-full object-cover bg-cream-200 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-cream-900 truncate">{u.nickname}</span>
                  {u.is_banned === 1 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-500 shrink-0">已封禁</span>}
                  {u.role === 'admin' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 shrink-0">管理员</span>}
                  {u.id === currentUserId && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 shrink-0">我</span>}
                </div>
                <div className="text-[11px] text-cream-500">ID:{u.id} · LV{u.level}{u.phone ? ` · ${u.phone}` : ''}{u.email ? ` · ${u.email}` : ''}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setEditing(u)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-cream-100 text-cream-500">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => canOperate(u) && setConfirm({ type: 'ban', user: u })}
                  disabled={!canOperate(u)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-cream-100 disabled:opacity-30 ${u.is_banned ? 'text-green-500' : 'text-orange-400'}`}>
                  {u.is_banned ? <Check size={14} /> : <Ban size={14} />}
                </button>
                <button onClick={() => canOperate(u) && setConfirm({ type: 'delete', user: u })}
                  disabled={!canOperate(u)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400 disabled:opacity-30">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2 pt-1">
          <button disabled={page <= 1} onClick={() => { setPage(p => p - 1); load(page - 1, keyword); }}
            className="px-3 py-1.5 rounded-lg border border-cream-200 text-sm disabled:opacity-40">上一页</button>
          <span className="px-3 py-1.5 text-sm text-cream-600">{page} / {Math.ceil(total / 20)}</span>
          <button disabled={page >= Math.ceil(total / 20)} onClick={() => { setPage(p => p + 1); load(page + 1, keyword); }}
            className="px-3 py-1.5 rounded-lg border border-cream-200 text-sm disabled:opacity-40">下一页</button>
        </div>
      )}

      {editing && <EditModal user={editing} currentUserId={currentUserId} onClose={() => setEditing(null)} onSaved={() => load(page, keyword)} />}

      {showCreate && (
        <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center bg-black/40" onClick={() => setShowCreate(false)}>
          <div className="bg-white w-full max-w-sm rounded-t-3xl md:rounded-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-cream-900">添加用户</span>
              <button onClick={() => setShowCreate(false)}><X size={18} className="text-cream-500" /></button>
            </div>
            <div>
              <label className="text-xs text-cream-600 mb-1 block">昵称</label>
              <input type="text" value={createNickname} onChange={e => setCreateNickname(e.target.value)} placeholder="输入昵称自动生成ID"
                className="w-full border border-cream-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-warm-400" />
            </div>
            <div>
              <label className="text-xs text-cream-600 mb-1 block">密码</label>
              <input type="password" value={createPassword} onChange={e => setCreatePassword(e.target.value)} placeholder="至少6位"
                className="w-full border border-cream-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-warm-400" />
            </div>
            <div>
              <label className="text-xs text-cream-600 mb-1 block">手机号（可选）</label>
              <input type="tel" value={createPhone} onChange={e => setCreatePhone(e.target.value)} placeholder="可选，11位"
                className="w-full border border-cream-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-warm-400" />
            </div>
            {createMsg && <p className={`text-xs ${createMsg.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>{createMsg}</p>}
            <button disabled={creating || (!createNickname.trim() && !createPhone)} onClick={async () => {
              setCreating(true); setCreateMsg('');
              const r: any = await adminApi.createUser(createNickname, createPassword, createPhone);
              setCreateMsg(r.code === 0 ? `创建成功：${r.data.nickname}（ID:${r.data.id}）` : r.message);
              if (r.code === 0) { load(1, keyword); setPage(1); }
              setCreating(false);
            }} className="w-full py-3 rounded-xl bg-warm-500 text-white text-sm font-medium disabled:opacity-50">
              {creating ? '创建中...' : '创建账号'}
            </button>
          </div>
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40" onClick={() => setConfirm(null)}>
          <div className="bg-white rounded-2xl p-5 mx-4 max-w-xs w-full space-y-3" onClick={e => e.stopPropagation()}>
            <p className="text-sm text-cream-900 font-medium">
              {confirm.type === 'ban'
                ? `确认${confirm.user.is_banned ? '解封' : '封禁'}用户「${confirm.user.nickname}」？`
                : `确认删除用户「${confirm.user.nickname}」？此操作不可恢复。`}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-cream-200 text-sm text-cream-700">取消</button>
              <button onClick={() => confirm.type === 'ban' ? toggleBan(confirm.user) : deleteUser(confirm.user)}
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
