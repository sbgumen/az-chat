import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { getCaptcha, registerByPassword } from '../../api/auth';

interface PasswordRegisterProps {
  onLogin: (data: any) => void;
  onBack: () => void;
  agreeDisabled?: boolean;
}

export function PasswordRegister({ onLogin, onBack, agreeDisabled }: PasswordRegisterProps) {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaError, setCaptchaError] = useState('');
  const captchaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showCaptcha) {
      setTimeout(() => captchaInputRef.current?.focus(), 100);
    }
  }, [showCaptcha]);

  const fetchCaptcha = async () => {
    if (!nickname.trim()) { setError('请输入昵称'); return; }
    if (password.length < 6) { setError('密码至少6位'); return; }
    if (password !== confirmPwd) { setError('两次密码不一致'); return; }
    setError('');
    try {
      const captchaRes: any = await getCaptcha();
      if (captchaRes.code === 0) {
        setCaptchaToken(captchaRes.data.token);
        setCaptchaSvg(captchaRes.data.svg);
        setCaptchaAnswer('');
        setCaptchaError('');
        setShowCaptcha(true);
      } else {
        setError(captchaRes.message || '获取验证失败');
      }
    } catch {
      setError('网络错误，请重试');
    }
  };

  const handleRegister = async () => {
    if (!captchaAnswer.trim()) { setCaptchaError('请输入验证码'); return; }
    setCaptchaError('');
    setShowCaptcha(false);
    setLoading(true);
    setError('');
    try {
      const res: any = await registerByPassword(nickname.trim(), password, captchaToken, captchaAnswer.trim());
      if (res.code === 0) {
        onLogin(res.data);
      } else {
        setError(res.message || '注册失败');
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="space-y-4"
      initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
      <p className="text-[11px] text-cream-500 tracking-widest mb-1">REGISTER</p>
      <p className="text-lg font-semibold text-cream-900 mb-5 font-display">创建账号</p>

      {/* 昵称 */}
      <div>
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
          style={{ background: 'rgba(248,245,240,0.9)', boxShadow: '0 2px 10px rgba(45,32,22,0.04)' }}>
          <input
            type="text"
            placeholder="请输入昵称"
            value={nickname}
            onChange={e => { setNickname(e.target.value.slice(0, 20)); setError(''); }}
            autoFocus
            className="flex-1 bg-transparent text-sm text-cream-900 placeholder:text-cream-400 outline-none"
            style={{ border: 'none' }}
          />
        </div>
      </div>

      {/* 密码 */}
      <div>
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
          style={{ background: 'rgba(248,245,240,0.9)', boxShadow: '0 2px 10px rgba(45,32,22,0.04)' }}>
          <input
            type={showPwd ? 'text' : 'password'}
            placeholder="请设置密码（至少6位）"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            className="flex-1 bg-transparent text-sm text-cream-900 placeholder:text-cream-400 outline-none"
            style={{ border: 'none' }}
          />
          <button onClick={() => setShowPwd(v => !v)} className="text-cream-400 hover:text-cream-600">
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* 确认密码 */}
      <div>
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
          style={{ background: 'rgba(248,245,240,0.9)', boxShadow: '0 2px 10px rgba(45,32,22,0.04)' }}>
          <input
            type="password"
            placeholder="请确认密码"
            value={confirmPwd}
            onChange={e => { setConfirmPwd(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && fetchCaptcha()}
            className="flex-1 bg-transparent text-sm text-cream-900 placeholder:text-cream-400 outline-none"
            style={{ border: 'none' }}
          />
        </div>
      </div>

      {/* 提示 */}
      <div className="flex items-center gap-2 text-[12px] text-cream-500">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8956C" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
        </svg>
        注册后系统将自动分配唯一账号 ID
      </div>

      {/* Error */}
      {error && (
        <motion.div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] text-red-600"
          style={{ background: 'rgba(239,68,68,0.07)' }}
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
          <AlertCircle size={14} className="flex-shrink-0" />{error}
        </motion.div>
      )}

      {agreeDisabled && (
        <motion.p className="text-[12px] text-amber-600 text-center"
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
          请先阅读并同意用户协议和隐私政策
        </motion.p>
      )}

      <button onClick={() => {
        if (agreeDisabled) { setError('请先阅读并同意用户协议和隐私政策'); return; }
        fetchCaptcha();
      }} disabled={loading || agreeDisabled}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white text-[15px] font-medium transition-all active:scale-[0.98] disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, #C8956C 0%, #D4A574 100%)', boxShadow: '0 4px 20px rgba(200,149,108,0.35)' }}>
        {loading && <Loader2 size={18} className="animate-spin" />}
        {loading ? '请稍候...' : '注册'}
      </button>

      <p className="text-center text-[12px] text-cream-500">
        已有账号？<span className="text-warm-600 cursor-pointer hover:text-warm-700 underline underline-offset-2" onClick={onBack}>去登录</span>
      </p>

      {/* 人机验证弹窗 */}
      <AnimatePresence>
        {showCaptcha && (
          <motion.div
            className="fixed inset-0 z-[300] flex items-center justify-center px-5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowCaptcha(false)} />
            <motion.div
              className="relative z-10 w-full max-w-[300px] rounded-2xl p-6 shadow-medium"
              style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)' }}
              initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <p className="text-sm font-semibold text-cream-900 text-center mb-1">图形验证</p>
              <p className="text-[11px] text-cream-500 text-center mb-4">请输入图中字符，不区分大小写</p>
              <div className="flex justify-center mb-4">
                <div className="rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 10px rgba(45,32,22,0.06)' }}>
                  <img src={captchaSvg} alt="验证码" className="h-[50px] cursor-pointer" onClick={fetchCaptcha} title="点击刷新" />
                </div>
              </div>
              <p className="text-center text-[10px] text-cream-400 mb-3">点击图片可刷新</p>
              <input
                ref={captchaInputRef}
                type="text" maxLength={6} placeholder="请输入图中字符"
                value={captchaAnswer}
                onChange={e => { setCaptchaAnswer(e.target.value); setCaptchaError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
                className="w-full px-4 py-3 rounded-xl text-center text-lg font-semibold tracking-[0.3em] text-cream-900 placeholder:text-cream-400 outline-none"
                style={{ background: 'rgba(248,245,240,0.9)', boxShadow: '0 2px 10px rgba(45,32,22,0.04)', border: 'none' }}
              />
              {captchaError && <p className="text-[12px] text-red-500 text-center mt-2">{captchaError}</p>}
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowCaptcha(false)}
                  className="flex-1 py-2.5 rounded-xl text-[13px] text-cream-600 font-medium hover:bg-cream-100 transition-colors">取消</button>
                <button onClick={handleRegister} disabled={!captchaAnswer}
                  className="flex-1 py-2.5 rounded-xl text-[13px] text-white font-medium transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #C8956C 0%, #D4A574 100%)', boxShadow: '0 4px 16px rgba(200,149,108,0.3)' }}>确认注册</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
