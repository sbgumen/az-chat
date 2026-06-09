import { RemoteImage } from '../../components/RemoteImage';
import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { compressImage } from '../../utils/compress';

export function AdminSettingsPage() {
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [regEnabled, setRegEnabled] = useState(true);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');
  const [defaultAvatar, setDefaultAvatar] = useState('');
  const [defaultGroupAvatar, setDefaultGroupAvatar] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [appConfig, setAppConfig] = useState<any>(null);
  const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;

  useEffect(() => {
    adminApi.getAppConfig?.().then((r: any) => {
      if (r?.code === 0) setAppConfig(r.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    adminApi.getSettings().then((r: any) => {
      if (r.code === 0) {
        setName(r.data.system_name || '');
        setLogo(r.data.system_logo || '');
        setRegEnabled(r.data.reg_enabled !== '0');
        setMaintenanceMsg(r.data.maintenance_msg || '');
        setDefaultAvatar(r.data.default_avatar || '');
        setDefaultGroupAvatar(r.data.default_group_avatar || '');
      }
    });
  }, []);

  const save = async (data: object) => {
    setSaving(true);
    const r: any = await adminApi.updateSettings(data);
    setMsg(r.code === 0 ? '保存成功' : r.message || '保存失败');
    setSaving(false);
    setTimeout(() => setMsg(''), 2000);
  };

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setMsg('压缩中...');
    const compressed = await compressImage(file);
    const r: any = await adminApi.uploadLogo(compressed);
    if (r.code === 0) {
      setLogo(r.data.logo);
      localStorage.setItem('az_syslogo', r.data.logo);
      // 同步刷新浏览器标签页图标
      const fullUrl = r.data.logo.startsWith('http') ? r.data.logo : `${apiBase}${r.data.logo}`;
      const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (link) link.href = fullUrl + '?t=' + Date.now();
      setMsg('Logo 已更新');
    } else {
      setMsg(r.message || '上传失败');
    }
    setTimeout(() => setMsg(''), 2000);
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h2 className="text-base font-semibold text-cream-900 pt-2">应用配置概览</h2>
      {appConfig && (
        <div className="bg-white rounded-2xl border border-cream-200/60 shadow-soft p-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-cream-500">应用名称</span>
            <p className="font-semibold text-cream-900">{appConfig.appName}</p>
          </div>
          <div>
            <span className="text-cream-500">后端版本</span>
            <p className="font-semibold text-cream-900">v{appConfig.version}</p>
          </div>
          <div>
            <span className="text-cream-500">注册状态</span>
            <p className={`font-semibold ${appConfig.regEnabled ? 'text-emerald-600' : 'text-red-500'}`}>
              {appConfig.regEnabled ? '开放注册' : '关闭注册'}
            </p>
          </div>
          <div className="col-span-2 text-[11px] text-cream-400 mt-1">
            完整配置文件: <code className="bg-cream-100 px-1 rounded">app.config.json</code>  → 运行 <code className="bg-cream-100 px-1 rounded">npm run sync-config</code> 同步到各端
          </div>
        </div>
      )}

      <h2 className="text-base font-semibold text-cream-900 pt-2">基础设置</h2>
      {msg && <div className={`text-sm rounded-xl px-4 py-2 ${msg.includes('成功') ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>{msg}</div>}

      <div className="bg-white rounded-2xl border border-cream-200/60 shadow-soft p-4 space-y-4">
        {/* System Name */}
        <div>
          <label className="text-xs text-cream-600 mb-1 block">系统名称</label>
          <div className="flex gap-2">
            <input value={name} onChange={e => setName(e.target.value)} maxLength={30} className="flex-1 border border-cream-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-warm-400" />
            <button onClick={() => save({ system_name: name })} disabled={saving} className="px-4 py-2 rounded-xl bg-warm-500 text-white text-sm font-medium disabled:opacity-50">保存</button>
          </div>
        </div>

        {/* Logo */}
        <div>
          <label className="text-xs text-cream-600 mb-2 block">系统 Logo</label>
          <div className="flex items-center gap-3">
            <RemoteImage key={logo} src={logo.startsWith('http') ? logo : `${apiBase}${logo}`} alt="logo" className="w-14 h-14 rounded-xl object-contain border border-cream-200 bg-cream-50" />
            <label className="px-4 py-2 rounded-xl border border-cream-300 text-sm text-cream-700 cursor-pointer hover:bg-cream-50">更换 Logo<input type="file" accept="image/*" className="hidden" onChange={uploadLogo} /></label>
          </div>
        </div>

        {/* Registration Toggle */}
        <div className="flex items-center justify-between py-1">
          <div><span className="text-sm text-cream-800">开放注册</span><p className="text-xs text-cream-400 mt-0.5">关闭后新用户无法注册</p></div>
          <button onClick={() => { setRegEnabled(!regEnabled); save({ reg_enabled: !regEnabled }); }}
            className={`w-12 h-6 rounded-full transition-colors ${regEnabled ? 'bg-warm-500' : 'bg-cream-300'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${regEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Maintenance Message */}
        <div>
          <label className="text-xs text-cream-600 mb-1 block">维护公告（为空时正常模式）</label>
          <div className="flex gap-2">
            <textarea value={maintenanceMsg} onChange={e => setMaintenanceMsg(e.target.value)} maxLength={200} rows={2}
              className="flex-1 border border-cream-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-warm-400" placeholder="例如：系统维护中，预计 22:00 恢复" />
            <button onClick={() => save({ maintenance_msg: maintenanceMsg })} disabled={saving} className="px-4 py-2 rounded-xl bg-warm-500 text-white text-sm font-medium disabled:opacity-50">保存</button>
          </div>
        </div>

        {/* Default Avatars */}
        <div>
          <label className="text-xs text-cream-600 mb-2 block">默认头像设置</label>
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <span className="text-xs text-cream-500 w-20">用户默认头像</span>
              <input value={defaultAvatar} onChange={e => setDefaultAvatar(e.target.value)} maxLength={500}
                className="flex-1 border border-cream-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-warm-400" />
              <button onClick={() => save({ default_avatar: defaultAvatar })} disabled={saving} className="px-3 py-1.5 rounded-lg bg-cream-100 text-sm">保存</button>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-cream-500 w-20">群默认头像</span>
              <input value={defaultGroupAvatar} onChange={e => setDefaultGroupAvatar(e.target.value)} maxLength={500}
                className="flex-1 border border-cream-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-warm-400" />
              <button onClick={() => save({ default_group_avatar: defaultGroupAvatar })} disabled={saving} className="px-3 py-1.5 rounded-lg bg-cream-100 text-sm">保存</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
