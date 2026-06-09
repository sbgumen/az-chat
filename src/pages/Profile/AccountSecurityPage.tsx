import { useState, useEffect, useRef } from 'react';
import { useSmartBack } from '../../hooks/useSmartBack';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Shield, Smartphone, Lock, Eye, EyeOff, Check, X, ArrowRight, Loader2, Mail } from 'lucide-react';
import { getProfile, setPassword, rebindPhone, bindPhone, bindEmail } from '../../api/user';
import { checkPhone, getCaptcha, sendCode, checkEmail, sendEmailCode } from '../../api/auth';
import { adminApi } from '../../api/admin';

function maskPhone(p: string) { return p.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'); }

// ===== OTP Input =====
function OtpInput({ value, onChange, length = 6 }: { value: string; onChange: (v: string) => void; length?: number }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const chars = value.split('');
  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') { e.preventDefault(); if (chars[i]) { const newChars = [...chars]; newChars[i] = ''; onChange(newChars.join('')); } else if (i > 0) { const newChars = [...chars]; newChars[i - 1] = ''; onChange(newChars.join('')); refs.current[i - 1]?.focus(); } }
  };
  const handleChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1); if (!digit) return;
    const newChars = [...chars]; newChars[i] = digit; const newVal = newChars.join('').slice(0, length); onChange(newVal);
    if (i < length - 1) refs.current[i + 1]?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent) => { e.preventDefault(); const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length); onChange(pasted); if (pasted.length < length) refs.current[pasted.length]?.focus(); else refs.current[length - 1]?.blur(); };
  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input key={i} ref={el => { refs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1}
          value={chars[i] || ''} onKeyDown={e => handleKeyDown(i, e)} onChange={e => handleChange(i, e.target.value)}
          className="w-11 h-14 rounded-2xl text-center text-xl font-bold outline-none transition-all"
          style={{ background: chars[i] ? 'rgba(212,165,116,0.12)' : 'rgba(0,0,0,0.04)', color: chars[i] ? '#d4a574' : '#a09080',
            boxShadow: chars[i] ? 'inset 0 0 0 2px rgba(212,165,116,0.4), 0 2px 8px rgba(212,165,116,0.15)' : 'inset 0 1px 3px rgba(0,0,0,0.06)', caretColor: '#d4a574' }} />
      ))}
    </div>
  );
}

// ===== Main Page =====
export function AccountSecurityPage() {
  const goBack = useSmartBack('/profile/settings');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [homeEnabledPhone, setHomeEnabledPhone] = useState(false);
  const [homeEnabledEmail, setHomeEnabledEmail] = useState(false);

  // Password modal
  const [showPwd, setShowPwd] = useState(false);
  const [pwdMode, setPwdMode] = useState<'choose' | 'direct' | 'forgot'>('choose');
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwdInput, setShowPwdInput] = useState(false);
  const [pwdSending, setPwdSending] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdOk, setPwdOk] = useState(false);
  // 忘记密码
  const [forgotStep, setForgotStep] = useState<'choose' | 'captcha' | 'code'>('choose');
  const [forgotType, setForgotType] = useState<'phone' | 'email' | ''>('');
  const [fpCaptchaSvg, setFpCaptchaSvg] = useState('');
  const [fpCaptchaToken, setFpCaptchaToken] = useState('');
  const [fpCaptchaAnswer, setFpCaptchaAnswer] = useState('');
  const [fpCode, setFpCode] = useState('');

  // Phone modal
  const [showPhone, setShowPhone] = useState(false);
  const [phoneStep, setPhoneStep] = useState<'input' | 'captcha' | 'code'>('input');
  const [newPhone, setNewPhone] = useState('');
  const [phoneCaptchaSvg, setPhoneCaptchaSvg] = useState('');
  const [phoneCaptchaToken, setPhoneCaptchaToken] = useState('');
  const [phoneCaptchaAnswer, setPhoneCaptchaAnswer] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [phoneOk, setPhoneOk] = useState(false);

  // Email modal
  const [showEmail, setShowEmail] = useState(false);
  const [emailStep, setEmailStep] = useState<'input' | 'captcha' | 'code'>('input');
  const [newEmail, setNewEmail] = useState('');
  const [emailCaptchaSvg, setEmailCaptchaSvg] = useState('');
  const [emailCaptchaToken, setEmailCaptchaToken] = useState('');
  const [emailCaptchaAnswer, setEmailCaptchaAnswer] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailOk, setEmailOk] = useState(false);

  useEffect(() => {
    Promise.all([getProfile(), adminApi.getPublicSettings()]).then(([prof, pub]: [any, any]) => {
      if (prof.code === 0) { setPhone(prof.data.phone || ''); setEmail(prof.data.email || ''); setHasPassword(prof.data.has_password); }
      if (pub.code === 0) { setHomeEnabledPhone(pub.data.login_method_phone !== '0'); setHomeEnabledEmail(pub.data.login_method_email !== '0'); }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const fetchCaptcha = async (setSvg: (v: string) => void, setToken: (v: string) => void) => {
    try { const res: any = await getCaptcha(); if (res.code === 0) { setSvg(res.data.svg || ''); setToken(res.data.token || ''); } } catch {}
  };

  // ===== Password =====
  const openPwd = async () => {
    setShowPwd(true); setOldPwd(''); setNewPwd(''); setConfirmPwd(''); setPwdError(''); setPwdOk(false);
    if (!hasPassword) {
      // 首次设置密码：直接设置
      setPwdMode('direct');
    } else {
      // 已有密码：弹出选择
      setPwdMode('choose');
    }
  };

  const submitDirectPwd = async () => {
    setPwdError('');
    if (hasPassword && (!oldPwd || oldPwd.length < 6)) { setPwdError('请输入旧密码'); return; }
    if (!newPwd || newPwd.length < 6) { setPwdError('新密码至少6位'); return; }
    if (newPwd !== confirmPwd) { setPwdError('两次密码不一致'); return; }
    setPwdSending(true);
    try {
      const payload: any = { newPassword: newPwd };
      if (hasPassword) payload.oldPassword = oldPwd;
      const res: any = await setPassword(payload);
      if (res.code === 0) { setPwdOk(true); setHasPassword(true); setTimeout(() => closePwd(), 1500); }
      else { setPwdError(res.message || '修改失败'); }
    } catch { setPwdError('网络错误'); }
    setPwdSending(false);
  };

  const closePwd = () => { setShowPwd(false); setForgotStep('choose'); setForgotType(''); };

  // ===== Forgot Password =====
  const openForgotPassword = async () => {
    // 检查是否有可用的验证方式
    const canPhone = homeEnabledPhone && phone;
    const canEmail = homeEnabledEmail && email;
    if (!canPhone && !canEmail) {
      const hasBinding = phone || email;
      if (hasBinding) {
        const bound = phone ? '手机号' : '邮箱';
        setPwdError(`已绑定${bound}，但当前未开启对应登录方式，请联系管理员`);
      } else {
        setPwdError('当前暂无可用验证方式，请先绑定手机号或邮箱');
      }
      return;
    }
    setPwdMode('forgot'); setForgotStep('choose'); setNewPwd(''); setConfirmPwd(''); setPwdError('');
    // 自动选择唯一可用方式
    if (canPhone && !canEmail) setForgotType('phone');
    else if (!canPhone && canEmail) setForgotType('email');
  };

  const sendForgotCode = async () => {
    if (!forgotType) return;
    setPwdError('');
    try {
      await fetchCaptcha(setFpCaptchaSvg, setFpCaptchaToken);
      setForgotStep('captcha');
    } catch { setPwdError('网络错误'); }
  };

  const handleFpCaptchaSubmit = async () => {
    if (!fpCaptchaAnswer.trim()) { setPwdError('请输入验证码'); return; }
    setPwdError(''); setPwdSending(true);
    try {
      const fn = forgotType === 'phone' ? sendCode : sendEmailCode;
      const target = forgotType === 'phone' ? phone : email;
      const res: any = await fn(target, fpCaptchaToken, fpCaptchaAnswer.trim());
      if (res.code === 0) { setForgotStep('code'); } else { setPwdError(res.message || '发送失败'); }
    } catch { setPwdError('网络错误'); }
    setPwdSending(false);
  };

  const submitForgotPwd = async () => {
    if (!fpCode || fpCode.length < 4) { setPwdError('请输入完整验证码'); return; }
    if (!newPwd || newPwd.length < 6) { setPwdError('新密码至少6位'); return; }
    if (newPwd !== confirmPwd) { setPwdError('两次密码不一致'); return; }
    setPwdSending(true);
    try {
      const res: any = await setPassword({ code: fpCode, codeType: forgotType as 'phone' | 'email', newPassword: newPwd });
      if (res.code === 0) { setPwdOk(true); setHasPassword(true); setTimeout(() => closePwd(), 1500); }
      else { setPwdError(res.message || '验证失败'); }
    } catch { setPwdError('网络错误'); }
    setPwdSending(false);
  };

  // ===== Phone =====
  const openPhone = async () => { setShowPhone(true); setPhoneStep('input'); setNewPhone(''); setPhoneCode(''); setPhoneCaptchaAnswer(''); setPhoneError(''); setPhoneOk(false); };
  const toPhoneCaptcha = async () => { setPhoneError(''); if (!newPhone || !/^1[3-9]\d{9}$/.test(newPhone)) { setPhoneError('请输入正确手机号'); return; } if (newPhone === phone) { setPhoneError('新手机号与当前一致'); return; } setPhoneSending(true); try { const checkRes: any = await checkPhone(newPhone); if (checkRes.code === 0 && checkRes.data?.exists) { setPhoneError('该手机号已被其他账号绑定'); setPhoneSending(false); return; } setPhoneStep('captcha'); await fetchCaptcha(setPhoneCaptchaSvg, setPhoneCaptchaToken); } catch { setPhoneError('网络错误'); } setPhoneSending(false); };
  const sendPhoneCode = async () => { if (!phoneCaptchaAnswer.trim()) { setPhoneError('请输入验证码'); return; } setPhoneError(''); setPhoneSending(true); try { const res: any = await sendCode(newPhone, phoneCaptchaToken, phoneCaptchaAnswer.trim()); if (res.code === 0) { setPhoneStep('code'); } else { setPhoneError(res.message || '发送失败'); } } catch { setPhoneError('网络错误'); } setPhoneSending(false); };
  const submitPhone = async () => { if (!phoneCode || phoneCode.length < 4) { setPhoneError('请输入完整验证码'); return; } setPhoneSending(true); setPhoneError(''); try { const fn = phone ? rebindPhone : bindPhone; const res: any = await fn(newPhone, phoneCode); if (res.code === 0) { setPhone(newPhone); setPhoneOk(true); setTimeout(() => closePhone(), 1500); } else { setPhoneError(res.message || '验证失败'); } } catch { setPhoneError('网络错误'); } setPhoneSending(false); };
  const closePhone = () => setShowPhone(false);

  // ===== Email =====
  const openEmail = async () => { setShowEmail(true); setEmailStep('input'); setNewEmail(''); setEmailCode(''); setEmailCaptchaAnswer(''); setEmailError(''); setEmailOk(false); };
  const toEmailCaptcha = async () => { setEmailError(''); if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { setEmailError('请输入正确的邮箱地址'); return; } if (newEmail === email) { setEmailError('新邮箱与当前一致'); return; } setEmailSending(true); try { const checkRes: any = await checkEmail(newEmail); if (checkRes.code === 0 && checkRes.data?.exists) { setEmailError('该邮箱已被其他账号绑定'); setEmailSending(false); return; } setEmailStep('captcha'); await fetchCaptcha(setEmailCaptchaSvg, setEmailCaptchaToken); } catch { setEmailError('网络错误'); } setEmailSending(false); };
  const sendEmailCodeHandler = async () => { if (!emailCaptchaAnswer.trim()) { setEmailError('请输入验证码'); return; } setEmailError(''); setEmailSending(true); try { const res: any = await sendEmailCode(newEmail, emailCaptchaToken, emailCaptchaAnswer.trim()); if (res.code === 0) { setEmailStep('code'); } else { setEmailError(res.message || '发送失败'); } } catch { setEmailError('网络错误'); } setEmailSending(false); };
  const submitEmail = async () => { if (!emailCode || emailCode.length < 4) { setEmailError('请输入完整验证码'); return; } setEmailSending(true); setEmailError(''); try { const res: any = await bindEmail(newEmail, emailCode); if (res.code === 0) { setEmail(newEmail); setEmailOk(true); setTimeout(() => closeEmail(), 1500); } else { setEmailError(res.message || '绑定失败'); } } catch { setEmailError('网络错误'); } setEmailSending(false); };
  const closeEmail = () => setShowEmail(false);

  // ===== Render =====
  if (loading) {
    return <motion.div className="fixed inset-0 z-[220] flex items-center justify-center" style={{ background: '#f5f0eb' }} initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}><Loader2 size={24} className="text-warm-400 animate-spin" /></motion.div>;
  }

  return (
    <motion.div className="fixed inset-0 z-[220] flex flex-col overflow-hidden"
      style={{ background: '#f5f0eb' }}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
      <div className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)' }}>
        <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-200"><ChevronLeft size={22} className="text-cream-800" /></button>
        <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,165,116,0.15)' }}><Shield size={16} style={{ color: '#d4a574' }} /></div><h1 className="font-display text-lg font-semibold text-cream-900">账号安全</h1></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Phone Card */}
        <InfoCard icon={<Smartphone size={18} />} label="绑定手机" value={phone ? maskPhone(phone) : '未绑定'} protected_={!!phone} action={openPhone} actionLabel={phone ? '换绑手机号' : '绑定手机号'} iconColor="#63b380" />
        {/* Email Card */}
        <InfoCard icon={<Mail size={18} />} label="绑定邮箱" value={email ? (email.slice(0, 3) + '***' + email.slice(email.indexOf('@'))) : '未绑定'} protected_={!!email} action={openEmail} actionLabel={email ? '更换邮箱' : '绑定邮箱'} iconColor="#8E8CD8" />
        {/* Password Card */}
        <div className="rounded-3xl p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff 0%, #faf7f2 100%)', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-5" style={{ background: 'radial-gradient(circle, #d4a574 0%, transparent 70%)' }} />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: hasPassword ? 'rgba(99,179,128,0.12)' : 'rgba(245,158,11,0.12)' }}><Lock size={18} className={hasPassword ? 'text-emerald-500' : 'text-amber-500'} /></div>
              <div><p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-cream-500">登录密码</p><p className="text-sm font-semibold text-cream-900">{hasPassword ? '已设置' : '未设置'}</p></div>
              <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold" style={hasPassword ? { background: 'rgba(99,179,128,0.1)', color: '#63b380' } : { background: 'rgba(245,158,11,0.1)', color: '#d97706' }}><div className={`w-1.5 h-1.5 rounded-full ${hasPassword ? 'bg-emerald-500' : 'bg-amber-500'}`} />{hasPassword ? '已保护' : '待设置'}</div>
            </div>
            <button onClick={openPwd} className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: '#d4a574' }}>{hasPassword ? '修改密码' : '设置密码'} <ArrowRight size={13} /></button>
          </div>
        </div>
      </div>

      {/* ===== Password Modal ===== */}
      <AnimatePresence>
        {showPwd && (
          <motion.div className="fixed inset-0 bg-black/40 z-[350] flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closePwd}>
            <motion.div className="w-full max-w-md bg-white rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: 0.2 }} onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-cream-900 mb-4">{hasPassword ? '修改密码' : '设置登录密码'}</h3>

              {pwdMode === 'choose' && (
                <div className="space-y-3">
                  <button onClick={() => setPwdMode('direct')} className="w-full p-4 rounded-xl border border-cream-200 hover:bg-cream-50 text-left">
                    <p className="text-sm font-semibold text-cream-900">输入旧密码修改</p>
                    <p className="text-xs text-cream-400 mt-0.5">验证当前密码后直接设置新密码</p>
                  </button>
                  <button onClick={openForgotPassword} className="w-full p-4 rounded-xl border border-cream-200 hover:bg-cream-50 text-left">
                    <p className="text-sm font-semibold text-cream-900">忘记密码</p>
                    <p className="text-xs text-cream-400 mt-0.5">通过已绑定的手机号或邮箱验证重置</p>
                  </button>
                  {pwdError && <p className="text-xs text-red-500 text-center">{pwdError}</p>}
                  <button onClick={closePwd} className="w-full mt-3 py-2.5 text-sm text-cream-400">取消</button>
                </div>
              )}

              {pwdMode === 'direct' && (
                <div className="space-y-3">
                  {!hasPassword && <p className="text-[13px] text-cream-400 mb-2">首次设置密码无需验证，请直接设置</p>}
                  {hasPassword && <div><label className="text-[11px] font-semibold text-cream-500 mb-1.5 block">旧密码</label><input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} placeholder="输入当前密码" className="w-full rounded-xl px-4 py-3 text-sm bg-cream-50 outline-none" /></div>}
                  <PasswordFields newPwd={newPwd} setNewPwd={setNewPwd} confirmPwd={confirmPwd} setConfirmPwd={setConfirmPwd} showInput={showPwdInput} setShowInput={setShowPwdInput} />
                  {pwdError && <p className="text-xs text-red-500"><X size={12} className="inline mr-1" />{pwdError}</p>}
                  {pwdOk && <p className="text-xs text-emerald-500"><Check size={12} className="inline mr-1" />修改成功</p>}
                  <button onClick={submitDirectPwd} disabled={pwdSending} className="w-full py-3 rounded-2xl text-sm font-semibold text-white" style={{ background: '#d4a574' }}>{pwdSending ? <Loader2 size={16} className="animate-spin mx-auto" /> : '确认修改'}</button>
                  {hasPassword && <button onClick={() => { setPwdMode('choose'); setPwdError(''); }} className="w-full py-2.5 text-sm text-cream-400">返回</button>}
                  <button onClick={closePwd} className="w-full py-2.5 text-sm text-cream-400">取消</button>
                </div>
              )}

              {pwdMode === 'forgot' && (
                <div className="space-y-3">
                  {forgotStep === 'choose' && (
                    <>
                      <p className="text-[13px] text-cream-400 mb-2">选择验证方式重置密码</p>
                      {homeEnabledPhone && phone && <button onClick={() => { setForgotType('phone'); sendForgotCode(); }} className="w-full p-4 rounded-xl border border-cream-200 hover:bg-cream-50 text-left"><p className="text-sm font-semibold text-cream-900">手机号验证</p><p className="text-xs text-cream-400">发送验证码至 {maskPhone(phone)}</p></button>}
                      {homeEnabledEmail && email && <button onClick={() => { setForgotType('email'); sendForgotCode(); }} className="w-full p-4 rounded-xl border border-cream-200 hover:bg-cream-50 text-left"><p className="text-sm font-semibold text-cream-900">邮箱验证</p><p className="text-xs text-cream-400">发送验证码至 {email.slice(0, 3)}***{email.slice(email.indexOf('@'))}</p></button>}
                      {!homeEnabledPhone && !homeEnabledEmail && <p className="text-sm text-cream-400 text-center py-4">当前暂无可用验证方式</p>}
                      {!phone && !email && <p className="text-xs text-amber-500 text-center">您尚未绑定手机号或邮箱，请先绑定后再使用忘记密码功能</p>}
                      {pwdError && <p className="text-xs text-red-500 text-center">{pwdError}</p>}
                      <button onClick={() => { setPwdMode('choose'); setPwdError(''); }} className="w-full py-2.5 text-sm text-cream-400">返回</button>
                    </>
                  )}
                  {forgotStep === 'captcha' && (
                    <>
                      <p className="text-[13px] text-cream-400 mb-3">图形验证</p>
                      <div className="flex justify-center mb-3"><img src={fpCaptchaSvg} alt="验证码" className="h-[50px] cursor-pointer rounded-xl" onClick={() => fetchCaptcha(setFpCaptchaSvg, setFpCaptchaToken)} /></div>
                      <input type="text" maxLength={6} value={fpCaptchaAnswer} onChange={e => setFpCaptchaAnswer(e.target.value)} placeholder="请输入图中字符" className="w-full rounded-xl px-4 py-3 text-sm bg-cream-50 outline-none text-center tracking-[0.2em]" />
                      {pwdError && <p className="text-xs text-red-500 text-center">{pwdError}</p>}
                      <button onClick={handleFpCaptchaSubmit} disabled={pwdSending || !fpCaptchaAnswer} className="w-full py-3 rounded-2xl text-sm font-semibold text-white mt-3" style={{ background: '#d4a574' }}>{pwdSending ? <Loader2 size={16} className="animate-spin mx-auto" /> : '获取验证码'}</button>
                      <button onClick={() => { setForgotStep('choose'); setPwdError(''); }} className="w-full py-2.5 text-sm text-cream-400">返回</button>
                    </>
                  )}
                  {forgotStep === 'code' && (
                    <>
                      <p className="text-[13px] text-cream-400 mb-3 text-center">请输入{forgotType === 'phone' ? '短信' : '邮件'}中的验证码</p>
                      <OtpInput value={fpCode} onChange={setFpCode} />
                      <PasswordFields newPwd={newPwd} setNewPwd={setNewPwd} confirmPwd={confirmPwd} setConfirmPwd={setConfirmPwd} showInput={showPwdInput} setShowInput={setShowPwdInput} />
                      {pwdError && <p className="text-xs text-red-500 text-center"><X size={12} className="inline mr-1" />{pwdError}</p>}
                      {pwdOk && <p className="text-xs text-emerald-500 text-center"><Check size={12} className="inline mr-1" />密码已重置</p>}
                      <button onClick={submitForgotPwd} disabled={pwdSending} className="w-full py-3 rounded-2xl text-sm font-semibold text-white mt-3" style={{ background: '#d4a574' }}>{pwdSending ? <Loader2 size={16} className="animate-spin mx-auto" /> : '重置密码'}</button>
                      <button onClick={closePwd} className="w-full py-2.5 text-sm text-cream-400">取消</button>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Phone Modal ===== */}
      <AnimatePresence>
        {showPhone && (
          phoneStep === 'input' ? (
            <motion.div className="fixed inset-0 bg-black/40 z-[350] flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closePhone}>
              <motion.div className="w-full max-w-md rounded-t-3xl p-6" style={{ background: '#fff' }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: 0.2 }} onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-cream-900 mb-1">{phone ? '换绑手机号' : '绑定手机号'}</h3>
                {phone && <p className="text-[13px] text-cream-500 mb-4">当前绑定：{maskPhone(phone)}</p>}
                <label className="text-[11px] font-semibold text-cream-500 mb-1.5 block">{phone ? '新手机号' : '手机号'}</label>
                <div className="rounded-2xl px-4 py-3 mb-5" style={{ background: 'rgba(0,0,0,0.03)' }}><input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="输入手机号" maxLength={11} className="w-full bg-transparent text-sm text-cream-900 outline-none" /></div>
                {phoneError && <p className="text-[12px] text-red-500 mb-3"><X size={12} className="inline mr-1" />{phoneError}</p>}
                <button onClick={toPhoneCaptcha} disabled={phoneSending || newPhone.length !== 11} className="w-full py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-50" style={{ background: '#d4a574' }}>{phoneSending ? <Loader2 size={16} className="animate-spin mx-auto" /> : '下一步'}</button>
                <button onClick={closePhone} className="w-full mt-3 py-2.5 text-sm text-cream-400">取消</button>
              </motion.div>
            </motion.div>
          ) : (
            <CaptchaVerifyModal title={phone ? '换绑手机号' : '绑定手机号'} subtitle={`验证码将发送至 ${newPhone}`}
              captchaSvg={phoneCaptchaSvg} captchaAnswer={phoneCaptchaAnswer} setCaptchaAnswer={setPhoneCaptchaAnswer}
              code={phoneCode} setCode={setPhoneCode} error={phoneError} ok={phoneOk} sending={phoneSending}
              step={phoneStep === 'captcha' ? 'captcha' : 'code'} onSendCode={sendPhoneCode}
              onRefreshCaptcha={() => fetchCaptcha(setPhoneCaptchaSvg, setPhoneCaptchaToken)} onClose={closePhone} onConfirm={submitPhone} />
          )
        )}
      </AnimatePresence>

      {/* ===== Email Modal ===== */}
      <AnimatePresence>
        {showEmail && (
          emailStep === 'input' ? (
            <motion.div className="fixed inset-0 bg-black/40 z-[350] flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeEmail}>
              <motion.div className="w-full max-w-md rounded-t-3xl p-6" style={{ background: '#fff' }} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: 0.2 }} onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-cream-900 mb-1">{email ? '更换邮箱' : '绑定邮箱'}</h3>
                {email && <p className="text-[13px] text-cream-500 mb-4">当前绑定：{email}</p>}
                <label className="text-[11px] font-semibold text-cream-500 mb-1.5 block">邮箱地址</label>
                <div className="rounded-2xl px-4 py-3 mb-5" style={{ background: 'rgba(0,0,0,0.03)' }}><input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="输入邮箱地址" className="w-full bg-transparent text-sm text-cream-900 outline-none" /></div>
                {emailError && <p className="text-[12px] text-red-500 mb-3"><X size={12} className="inline mr-1" />{emailError}</p>}
                <button onClick={toEmailCaptcha} disabled={emailSending || !newEmail} className="w-full py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-50" style={{ background: '#8E8CD8' }}>{emailSending ? <Loader2 size={16} className="animate-spin mx-auto" /> : '下一步'}</button>
                <button onClick={closeEmail} className="w-full mt-3 py-2.5 text-sm text-cream-400">取消</button>
              </motion.div>
            </motion.div>
          ) : (
            <CaptchaVerifyModal title={email ? '更换邮箱' : '绑定邮箱'} subtitle={`验证码将发送至 ${newEmail}`}
              captchaSvg={emailCaptchaSvg} captchaAnswer={emailCaptchaAnswer} setCaptchaAnswer={setEmailCaptchaAnswer}
              code={emailCode} setCode={setEmailCode} error={emailError} ok={emailOk} sending={emailSending}
              step={emailStep === 'captcha' ? 'captcha' : 'code'} onSendCode={sendEmailCodeHandler}
              onRefreshCaptcha={() => fetchCaptcha(setEmailCaptchaSvg, setEmailCaptchaToken)} onClose={closeEmail} onConfirm={submitEmail} />
          )
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ===== Info Card =====
function InfoCard({ icon, label, value, protected_, action, actionLabel, iconColor }: {
  icon: React.ReactNode; label: string; value: string; protected_: boolean; action: () => void; actionLabel: string; iconColor: string;
}) {
  return (
    <div className="rounded-3xl p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #fff 0%, #faf7f2 100%)', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
      <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-5" style={{ background: 'radial-gradient(circle, #d4a574 0%, transparent 70%)' }} />
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: protected_ ? `${iconColor}1f` : 'rgba(0,0,0,0.04)' }}>{icon}</div>
          <div><p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-cream-500">{label}</p><p className="text-sm font-semibold text-cream-900">{value}</p></div>
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
            style={protected_ ? { background: `${iconColor}1a`, color: iconColor } : { background: 'rgba(245,158,11,0.1)', color: '#d97706' }}>
            <div className={`w-1.5 h-1.5 rounded-full`} style={{ background: protected_ ? iconColor : '#f59e0b' }} />{protected_ ? '已保护' : '待绑定'}</div>
        </div>
        <button onClick={action} className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: '#d4a574' }}>{actionLabel} <ArrowRight size={13} /></button>
      </div>
    </div>
  );
}

// ===== Password strength =====
function getStrength(pwd: string): { level: number; label: string; color: string } {
  if (!pwd) return { level: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++; else if (/[a-zA-Z]/.test(pwd)) score += 0.5;
  if (/\d/.test(pwd)) score++; if (/[^a-zA-Z\d]/.test(pwd)) score++;
  const bars = [{ level: 1, label: '弱', color: '#ef4444' }, { level: 2, label: '中等', color: '#f59e0b' }, { level: 3, label: '强', color: '#63b380' }, { level: 4, label: '很强', color: '#22c55e' }];
  return bars[Math.min(Math.floor(score), 3)];
}

function PasswordFields({ newPwd, setNewPwd, confirmPwd, setConfirmPwd, showInput, setShowInput }: {
  newPwd: string; setNewPwd: (v: string) => void; confirmPwd: string; setConfirmPwd: (v: string) => void;
  showInput: boolean; setShowInput: (v: boolean) => void;
}) {
  const strength = getStrength(newPwd);
  return <>
    <label className="text-[11px] font-semibold text-cream-500 mb-2 block">新密码</label>
    <div className="flex items-center rounded-2xl px-4 py-3 mb-1.5" style={{ background: 'rgba(0,0,0,0.03)' }}>
      <input type={showInput ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="至少6位" maxLength={128} className="flex-1 bg-transparent text-sm text-cream-900 outline-none" />
      <button onClick={() => setShowInput(!showInput)}>{showInput ? <EyeOff size={16} /> : <Eye size={16} />}</button>
    </div>
    {newPwd && <div className="flex gap-1 mb-3"><div className="flex-1 h-1 rounded-full" style={{ background: strength.level >= 1 ? strength.color : '#e5e0d8' }} /><div className="flex-1 h-1 rounded-full" style={{ background: strength.level >= 2 ? strength.color : '#e5e0d8' }} /><div className="flex-1 h-1 rounded-full" style={{ background: strength.level >= 3 ? strength.color : '#e5e0d8' }} /></div>}
    <label className="text-[11px] font-semibold text-cream-500 mb-2 block">确认密码</label>
    <div className="rounded-2xl px-4 py-3 mb-3" style={{ background: 'rgba(0,0,0,0.03)' }}><input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="再次输入" maxLength={128} className="w-full bg-transparent text-sm text-cream-900 outline-none" /></div>
  </>;
}

function CaptchaVerifyModal({ title, subtitle, captchaSvg, captchaAnswer, setCaptchaAnswer, code, setCode, error, ok, sending, step, onSendCode, onRefreshCaptcha, onClose, onConfirm, children }: {
  title: string; subtitle: string; captchaSvg: string; captchaAnswer: string; setCaptchaAnswer: (v: string) => void;
  code: string; setCode: (v: string) => void; error: string; ok: boolean; sending: boolean;
  step: 'captcha' | 'code'; onSendCode: () => void; onRefreshCaptcha: () => void; onClose: () => void; onConfirm?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <motion.div className="fixed inset-0 bg-black/40 z-[350] flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="w-full max-w-md bg-white rounded-t-3xl p-6" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: 0.2 }} onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-cream-900 mb-1">{title}</h3>
        {subtitle && <p className="text-[13px] text-cream-400 mb-4">{subtitle}</p>}
        {step === 'captcha' ? <>
          <div className="flex justify-center mb-3"><img src={captchaSvg} alt="验证码" className="h-[50px] cursor-pointer rounded-xl" onClick={onRefreshCaptcha} /></div>
          <input type="text" maxLength={6} value={captchaAnswer} onChange={e => setCaptchaAnswer(e.target.value)} placeholder="请输入图中字符" className="w-full rounded-xl px-4 py-3 text-sm bg-cream-50 outline-none text-center tracking-[0.2em] mb-4" />
          <button onClick={onSendCode} disabled={sending || !captchaAnswer.trim()} className="w-full py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-50" style={{ background: '#d4a574' }}>{sending ? <Loader2 size={16} className="animate-spin mx-auto" /> : '获取验证码'}</button>
        </> : <>
          <p className="text-[13px] text-cream-400 mb-3 text-center">请输入短信/邮件中的验证码</p>
          <OtpInput value={code} onChange={setCode} />
          {error && <p className="text-[12px] text-red-500 mt-4 flex items-center justify-center gap-1"><X size={12} />{error}</p>}
          {ok && <p className="text-[12px] text-emerald-500 mt-4 flex items-center justify-center gap-1"><Check size={12} />操作成功</p>}
          {children}
          {onConfirm && !children && <button onClick={onConfirm} disabled={sending || ok || code.length < 4} className="w-full py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-50 mt-4" style={{ background: '#d4a574' }}>{sending ? <Loader2 size={16} className="animate-spin mx-auto" /> : '确认'}</button>}
          {!onConfirm && !children && <button onClick={onRefreshCaptcha} className="w-full py-3 rounded-2xl text-sm font-medium text-cream-500 mt-4" style={{ background: 'rgba(0,0,0,0.04)' }}>重新获取</button>}
        </>}
        <button onClick={onClose} className="w-full mt-3 py-2.5 text-sm text-cream-400">取消</button>
      </motion.div>
    </motion.div>
  );
}

export default AccountSecurityPage;
