import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import { getCaptcha } from '../../api/auth';

export function AdminCaptchaPage() {
  const [cfg, setCfg] = useState({
    captcha_length: 4, captcha_include_alpha: false, captcha_type: 'text',
    sms_code_length: '6', sms_code_expire: '300',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [previewSvg, setPreviewSvg] = useState('');
  void saving;

  const fetchPreview = () => {
    getCaptcha().then((r: any) => {
      if (r.code === 0) setPreviewSvg(r.data.svg);
    }).catch(() => {});
  };

  useEffect(() => {
    Promise.all([
      adminApi.getCaptchaConfig(),
      adminApi.getSettings(),
    ]).then(([captchaRes, settingsRes]: any[]) => {
      const next: any = { ...cfg };
      if (captchaRes.code === 0) {
        next.captcha_length = captchaRes.data.captcha_length;
        next.captcha_include_alpha = captchaRes.data.captcha_include_alpha;
        next.captcha_type = captchaRes.data.captcha_type || 'text';
      }
      if (settingsRes.code === 0) {
        next.sms_code_length = settingsRes.data.sms_code_length || '6';
        next.sms_code_expire = settingsRes.data.sms_code_expire || '300';
      }
      setCfg(next);
    });
    fetchPreview();
  }, []);

  const showMsg = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 2000);
  };

  const saveCaptcha = async (data: Partial<typeof cfg>) => {
    setSaving(true);
    const r: any = await adminApi.updateCaptchaConfig(data);
    showMsg(r.code === 0 ? '保存成功' : r.message || '保存失败');
    setSaving(false);
    // 刷新预览
    if (r.code === 0) setTimeout(() => fetchPreview(), 300);
  };

  const saveSmsCode = async (key: string, val: string) => {
    setSaving(true);
    const r: any = await adminApi.updateSettings({ [key]: val });
    showMsg(r.code === 0 ? '保存成功' : r.message || '保存失败');
    setSaving(false);
  };

  const isMath = cfg.captcha_type === 'math';

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-8">
      <h2 className="text-base font-semibold text-cream-900 pt-2">验证码配置</h2>
      {msg && (
        <div className={`text-sm rounded-xl px-4 py-2 ${msg.includes('成功') ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>{msg}</div>
      )}

      {/* ===== 图形验证码 ===== */}
      <div className="bg-white rounded-2xl border border-cream-200/60 shadow-soft p-4 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-cream-800">图形验证码</span>
          <span className="text-[10px] text-cream-400">（人机验证）</span>
        </div>

        {/* 格式选择 */}
        <div>
          <label className="text-xs text-cream-600 mb-2 block">验证码格式</label>
          <div className="flex gap-2">
            <button
              onClick={() => { setCfg(c => ({ ...c, captcha_type: 'text' })); saveCaptcha({ captcha_length: cfg.captcha_length, captcha_include_alpha: cfg.captcha_include_alpha, captcha_type: 'text' }); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${!isMath ? 'bg-warm-500 text-white border-warm-500' : 'border-cream-200 text-cream-700 hover:bg-cream-50'}`}>
              文本字符
            </button>
            <button
              onClick={() => { setCfg(c => ({ ...c, captcha_type: 'math' })); saveCaptcha({ captcha_length: cfg.captcha_length, captcha_include_alpha: cfg.captcha_include_alpha, captcha_type: 'math' }); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${isMath ? 'bg-warm-500 text-white border-warm-500' : 'border-cream-200 text-cream-700 hover:bg-cream-50'}`}>
              算数运算
            </button>
          </div>
        </div>

        {/* 文本模式专属配置 */}
        {!isMath && (
          <>
            <div>
              <label className="text-xs text-cream-600 mb-2 block">验证码位数（3-6位）</label>
              <div className="flex gap-2">
                {[3, 4, 5, 6].map(n => (
                  <button key={n}
                    onClick={() => { setCfg(c => ({ ...c, captcha_length: n })); saveCaptcha({ captcha_length: n, captcha_include_alpha: cfg.captcha_include_alpha }); }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${cfg.captcha_length === n ? 'bg-warm-500 text-white border-warm-500' : 'border-cream-200 text-cream-700 hover:bg-cream-50'}`}>
                    {n}位
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-cream-900">包含英文字母</p>
                <p className="text-xs text-cream-500 mt-0.5">开启后验证码将包含大小写字母</p>
              </div>
              <button onClick={() => { const next = !cfg.captcha_include_alpha; setCfg(c => ({ ...c, captcha_include_alpha: next })); saveCaptcha({ captcha_length: cfg.captcha_length, captcha_include_alpha: next }); }}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${cfg.captcha_include_alpha ? 'bg-warm-500' : 'bg-cream-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${cfg.captcha_include_alpha ? 'translate-x-[22px]' : 'translate-x-0'}`} />
              </button>
            </div>
          </>
        )}

        {/* 实时预览 */}
        <div className="bg-cream-50 rounded-xl p-4">
          <p className="text-xs text-cream-500 mb-2">实时预览（点击刷新）</p>
          {previewSvg ? (
            <img
              src={previewSvg}
              alt="验证码预览"
              className="h-[50px] cursor-pointer"
              onClick={fetchPreview}
              title="点击刷新"
            />
          ) : (
            <div className="h-[50px] flex items-center text-xs text-cream-400">加载预览中...</div>
          )}
          <p className="text-[10px] text-cream-400 mt-2">
            当前：{isMath ? '算数运算' : `${cfg.captcha_length}位${cfg.captcha_include_alpha ? '含字母' : '纯数字'}`}
          </p>
        </div>
      </div>

      {/* ===== 短信/邮箱验证码 ===== */}
      <div className="bg-white rounded-2xl border border-cream-200/60 shadow-soft p-4 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-cream-800">短信/邮箱验证码</span>
          <span className="text-[10px] text-cream-400">（登录/注册验证）</span>
        </div>

        <div>
          <label className="text-xs text-cream-600 mb-2 block">验证码位数（纯数字，4-6位）</label>
          <div className="flex gap-2">
            {[4, 5, 6].map(n => (
              <button key={n}
                onClick={() => { setCfg(c => ({ ...c, sms_code_length: String(n) })); saveSmsCode('sms_code_length', String(n)); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${cfg.sms_code_length === String(n) ? 'bg-warm-500 text-white border-warm-500' : 'border-cream-200 text-cream-700 hover:bg-cream-50'}`}>
                {n}位
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-cream-600 mb-2 block">验证码有效期</label>
          <div className="flex gap-2 flex-wrap">
            {[{ sec: 30, label: '30秒' }, { sec: 60, label: '1分钟' }, { sec: 120, label: '2分钟' }, { sec: 300, label: '5分钟' }, { sec: 600, label: '10分钟' }].map(opt => (
              <button key={opt.sec}
                onClick={() => { setCfg(c => ({ ...c, sms_code_expire: String(opt.sec) })); saveSmsCode('sms_code_expire', String(opt.sec)); }}
                className={`py-2 px-4 rounded-xl text-sm font-medium border transition-colors ${cfg.sms_code_expire === String(opt.sec) ? 'bg-warm-500 text-white border-warm-500' : 'border-cream-200 text-cream-700 hover:bg-cream-50'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
