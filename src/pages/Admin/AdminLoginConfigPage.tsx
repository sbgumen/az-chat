import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { Mail, Smartphone, KeyRound, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';

export function AdminLoginConfigPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState(true);
  const [saving, setSaving] = useState(false);

  const [testPhone, setTestPhone] = useState('');
  const [testingSms, setTestingSms] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);

  const fetchConfig = async () => {
    const r: any = await adminApi.getSettings();
    if (r.code === 0) setConfig(r.data);
  };

  useEffect(() => { fetchConfig(); }, []);

  const showMsg = (text: string, ok: boolean) => {
    setMsg(text); setMsgOk(ok);
    setTimeout(() => setMsg(''), 3000);
  };

  const save = async (data: Record<string, string>) => {
    setSaving(true);
    const r: any = await adminApi.updateSettings(data);
    showMsg(r.code === 0 ? '保存成功' : r.message || '保存失败', r.code === 0);
    if (r.code === 0) fetchConfig();
    setSaving(false);
  };

  const toggleMethod = (key: string) => {
    const current = config[key] !== '0';
    const newVal = current ? '0' : '1';
    const checkConfig = { ...config, [key]: newVal };
    const pwd = checkConfig.login_method_password !== '0';
    const phone = checkConfig.login_method_phone !== '0';
    const email = checkConfig.login_method_email !== '0';
    if (!pwd && !phone && !email) {
      showMsg('至少需开启一种登录方式', false);
      return;
    }
    save({ [key]: newVal });
  };

  const handleTestSms = async () => {
    if (!testPhone || !/^1\d{10}$/.test(testPhone)) { showMsg('请输入正确的测试手机号', false); return; }
    if (!config.sms_template_id && config.sms_template_id_set !== '1') { showMsg('请先填写模板ID并保存', false); return; }
    setTestingSms(true);
    try {
      // 优先用输入框值，空则后端回退已存储
      const r: any = await adminApi.testSms(testPhone, config.sms_template_id || '');
      showMsg(r.message || (r.code === 0 ? '发送成功' : '发送失败'), r.code === 0);
    } catch { showMsg('网络错误', false); }
    setTestingSms(false);
  };

  const handleTestEmail = async () => {
    if (!testEmail) { showMsg('请输入测试邮箱地址', false); return; }
    // 检查是否有已存储配置
    if (!config.smtp_host && config.smtp_pass_set !== '1') { showMsg('请先配置 SMTP 信息并保存', false); return; }
    setTestingEmail(true);
    try {
      // 优先用输入框值，空则后端回退已存储
      const r: any = await adminApi.testEmail(testEmail, {
        smtp_host: config.smtp_host || '',
        smtp_port: config.smtp_port || '',
        smtp_user: config.smtp_user || '',
        smtp_pass: config.smtp_pass || '',
        smtp_from: '',
      });
      showMsg(r.message || (r.code === 0 ? '发送成功' : '发送失败'), r.code === 0);
    } catch { showMsg('网络错误', false); }
    setTestingEmail(false);
  };

  const on = (k: string) => config[k] !== '0';

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4 pb-8">
      <div>
        <h2 className="text-base font-semibold text-cream-900 pt-2">登录与注册管理</h2>
        <p className="text-xs text-cream-500 mt-1">配置系统支持的登录方式，至少需开启一项</p>
      </div>

      {msg && (
        <div className={`text-sm rounded-xl px-4 py-2 flex items-center gap-2 ${
          msgOk ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'
        }`}>
          {!msgOk && <AlertCircle size={14} />}
          {msg}
        </div>
      )}

      {/* 账号密码登录 */}
      <div className="bg-white rounded-2xl border border-cream-200/60 shadow-soft p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-cream-100 flex items-center justify-center flex-shrink-0">
              <KeyRound size={18} className="text-warm-500" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-medium text-cream-800 block truncate">账号密码登录</span>
              <p className="text-xs text-cream-400 truncate">使用系统分配的 ID + 密码登录</p>
            </div>
          </div>
          <button onClick={() => toggleMethod('login_method_password')}
            className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-3 ${on('login_method_password') ? 'bg-warm-500' : 'bg-cream-300'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${on('login_method_password') ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* 手机号验证码登录 */}
      <div className="bg-white rounded-2xl border border-cream-200/60 shadow-soft p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-cream-100 flex items-center justify-center flex-shrink-0">
              <Smartphone size={18} className="text-warm-500" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-medium text-cream-800 block truncate">手机号验证码登录</span>
              <p className="text-xs text-cream-400 truncate">短信验证码一键登录/注册</p>
            </div>
          </div>
          <button onClick={() => toggleMethod('login_method_phone')}
            className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-3 ${on('login_method_phone') ? 'bg-warm-500' : 'bg-cream-300'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${on('login_method_phone') ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {on('login_method_phone') && (
          <div className="mt-4 pt-4 border-t border-cream-100 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="text-xs font-medium text-cream-600">推送助手短信模板</span>
              <a href="https://push.spug.cc/guide/sms-code" target="_blank" rel="noopener noreferrer"
                className="text-xs text-warm-500 hover:text-warm-600 flex items-center gap-1 flex-shrink-0">
                配置教程 <ExternalLink size={11} />
              </a>
            </div>
            <p className="text-xs text-cream-400">填入 send/ 后的模板 ID，系统自动拼装 code、number、targets 参数</p>

            {/* 模板 ID */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-xs text-cream-500">模板 ID</label>
                {config.sms_template_id_set === '1' && (
                  <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">已配置</span>
                )}
                <span className="text-[10px] text-cream-400">（已保存不回显，输入时展示）</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-cream-700 font-medium flex-shrink-0">push.spug.cc/send/</span>
                <div className="flex items-center gap-2 flex-1 min-w-[120px]">
                  <input value={config.sms_template_id || ''}
                    onChange={e => setConfig(c => ({ ...c, sms_template_id: e.target.value }))}
                    placeholder={config.sms_template_id_set === '1' ? '已配置（输入覆盖）' : '模板ID'}
                    className="flex-1 border border-cream-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-warm-400 min-w-[80px]" />
                  <button onClick={() => save({ sms_template_id: config.sms_template_id || '' })}
                    disabled={saving || !config.sms_template_id}
                    className="px-3 py-2 rounded-lg bg-warm-500 text-white text-xs font-medium disabled:opacity-50 flex-shrink-0">保存</button>
                </div>
              </div>
            </div>

            {/* 测试发送 — 响应式 */}
            <div className="pt-2 border-t border-cream-100">
              <label className="text-xs text-cream-500 block mb-1.5">测试发送</label>
              <div className="flex items-center gap-2 flex-wrap">
                <input value={testPhone}
                  onChange={e => setTestPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="测试手机号" maxLength={11}
                  className="flex-1 min-w-[120px] border border-cream-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-warm-400" />
                <button onClick={handleTestSms} disabled={testingSms || !testPhone}
                  className="px-4 py-2 rounded-lg bg-warm-500 text-white text-xs font-medium disabled:opacity-50 flex items-center gap-1 flex-shrink-0">
                  {testingSms && <Loader2 size={12} className="animate-spin" />}
                  测试发送
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 邮箱验证码登录 */}
      <div className="bg-white rounded-2xl border border-cream-200/60 shadow-soft p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-cream-100 flex items-center justify-center flex-shrink-0">
              <Mail size={18} className="text-warm-500" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-medium text-cream-800 block truncate">邮箱验证码登录</span>
              <p className="text-xs text-cream-400 truncate">邮件验证码登录/注册</p>
            </div>
          </div>
          <button onClick={() => toggleMethod('login_method_email')}
            className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-3 ${on('login_method_email') ? 'bg-warm-500' : 'bg-cream-300'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${on('login_method_email') ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {on('login_method_email') && (
          <div className="mt-4 pt-4 border-t border-cream-100 space-y-3">
            <span className="text-xs font-medium text-cream-600">SMTP 邮箱配置</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-cream-400 block mb-1">SMTP 地址</label>
                <input value={config.smtp_host || ''}
                  onChange={e => setConfig(c => ({ ...c, smtp_host: e.target.value }))}
                  placeholder="smtp.example.com"
                  className="w-full border border-cream-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-warm-400" />
              </div>
              <div>
                <label className="text-xs text-cream-400 block mb-1">端口</label>
                <input value={config.smtp_port || ''}
                  onChange={e => setConfig(c => ({ ...c, smtp_port: e.target.value }))}
                  placeholder="587"
                  className="w-full border border-cream-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-warm-400" />
              </div>
              <div>
                <label className="text-xs text-cream-400 block mb-1">发件邮箱</label>
                <input value={config.smtp_user || ''}
                  onChange={e => setConfig(c => ({ ...c, smtp_user: e.target.value }))}
                  placeholder="noreply@example.com"
                  className="w-full border border-cream-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-warm-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-xs text-cream-400">授权码</label>
                  {config.smtp_pass_set === '1' && (
                    <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">已配置</span>
                  )}
                  <span className="text-[10px] text-cream-400">（已保存不回显）</span>
                </div>
                <input type="password" value={config.smtp_pass || ''}
                  onChange={e => setConfig(c => ({ ...c, smtp_pass: e.target.value }))}
                  placeholder={config.smtp_pass_set === '1' ? '已配置（输入覆盖）' : '授权码'}
                  className="w-full border border-cream-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-warm-400" />
              </div>
            </div>
            <div>
              <label className="text-xs text-cream-400 block mb-1">发件人名称</label>
              <input value={config.smtp_from || ''}
                onChange={e => setConfig(c => ({ ...c, smtp_from: e.target.value }))}
                placeholder="AZ-Chat <noreply@example.com>"
                className="w-full border border-cream-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-warm-400" />
            </div>
            <button
              onClick={() => {
                const data: Record<string, string> = {
                  smtp_host: config.smtp_host || '',
                  smtp_port: config.smtp_port || '587',
                  smtp_user: config.smtp_user || '',
                  smtp_from: config.smtp_from || '',
                };
                if (config.smtp_pass) data.smtp_pass = config.smtp_pass;
                save(data);
              }}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-warm-500 text-white text-xs font-medium disabled:opacity-50">保存 SMTP</button>

            {/* 测试发送 */}
            <div className="pt-2 border-t border-cream-100">
              <label className="text-xs text-cream-500 block mb-1.5">测试发送</label>
              <div className="flex items-center gap-2 flex-wrap">
                <input value={testEmail} onChange={e => setTestEmail(e.target.value)}
                  type="email" placeholder="测试邮箱"
                  className="flex-1 min-w-[120px] border border-cream-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-warm-400" />
                <button onClick={handleTestEmail} disabled={testingEmail || !testEmail}
                  className="px-4 py-2 rounded-lg bg-warm-500 text-white text-xs font-medium disabled:opacity-50 flex items-center gap-1 flex-shrink-0">
                  {testingEmail && <Loader2 size={12} className="animate-spin" />}
                  测试发送
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
