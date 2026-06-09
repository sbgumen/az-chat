import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { loginById, getCaptcha } from '../../api/auth';

interface IdLoginProps {
  onLogin: (data: any) => void;
  agreeDisabled?: boolean;
  multiInput?: boolean;
}

export function IdLogin({ onLogin, agreeDisabled }: IdLoginProps) {
  const [idInput, setIdInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Captcha
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [showCaptcha, setShowCaptcha] = useState(false);
  const captchaInputRef = useRef<HTMLInputElement>(null);

  const refreshCaptcha = async () => {
    try {
      const res: any = await getCaptcha();
      if (res.code === 0) {
        setCaptchaToken(res.data.token);
        setCaptchaSvg(res.data.svg);
        setShowCaptcha(true);
        setTimeout(() => captchaInputRef.current?.focus(), 100);
      }
    } catch { /* ignore */ }
  };

  const handleLogin = async () => {
    if (!idInput || !password) { setError('请填写完整信息'); return; }
    if (!captchaToken || !captchaAnswer) {
      setError('请完成图形验证');
      refreshCaptcha();
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res: any = await loginById(idInput, password, captchaToken, captchaAnswer);
      if (res.code === 0) {
        onLogin(res.data);
      } else {
        setError(res.message || '登录失败');
        refreshCaptcha();
      }
    } catch {
      setError('网络错误，请重试');
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="space-y-4"
      initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
      <p className="text-[11px] text-cream-500 tracking-widest mb-1">PASSWORD LOGIN</p>
      <p className="text-lg font-semibold text-cream-900 mb-5 font-display">账号密码登录</p>

      {/* ID input */}
      <div>
        <div
          className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200"
          style={{ background: 'rgba(248,245,240,0.9)', boxShadow: '0 2px 10px rgba(45,32,22,0.04)', border: '1px solid rgba(200,149,108,0.1)' }}>
          <input type="text" value={idInput} onChange={e => setIdInput(e.target.value)} placeholder="账号ID/手机号/邮箱" maxLength={30}
            className="flex-1 bg-transparent text-[15px] text-cream-900 placeholder:text-cream-400 outline-none" autoComplete="username" />
        </div>
      </div>

      {/* Password input */}
      <div>
        <div
          className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200"
          style={{ background: 'rgba(248,245,240,0.9)', boxShadow: '0 2px 10px rgba(45,32,22,0.04)', border: '1px solid rgba(200,149,108,0.1)' }}>
          <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="输入密码" maxLength={30}
            className="flex-1 bg-transparent text-[15px] text-cream-900 placeholder:text-cream-400 outline-none" autoComplete="current-password"
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          <button className="p-1 text-cream-500 active:scale-90" onClick={() => setShowPwd(!showPwd)}>
            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Captcha */}
      {showCaptcha && (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2.5 rounded-2xl"
              style={{ background: 'rgba(248,245,240,0.9)', boxShadow: '0 2px 10px rgba(45,32,22,0.04)', border: '1px solid rgba(200,149,108,0.1)' }}>
              <input ref={captchaInputRef} type="text" value={captchaAnswer} onChange={e => setCaptchaAnswer(e.target.value)}
                placeholder="验证码" maxLength={6} className="flex-1 min-w-0 bg-transparent text-[15px] text-cream-900 placeholder:text-cream-400 outline-none"
                onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
            <img
              src={captchaSvg} alt="验证码"
              className="h-[46px] w-[90px] rounded-xl cursor-pointer flex-shrink-0 border border-cream-200 bg-white"
              onClick={refreshCaptcha} />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-[13px] px-1">
          <AlertCircle size={14} /><span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <button onClick={handleLogin} disabled={loading || agreeDisabled}
        className="w-full py-3.5 rounded-2xl text-[15px] font-semibold text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: 'linear-gradient(135deg, #C8956C, #B07D5A)', boxShadow: '0 4px 20px rgba(200,149,108,0.3)' }}>
        {loading ? <Loader2 size={20} className="animate-spin mx-auto" /> : '登录'}
      </button>

    </motion.div>
  );
}
