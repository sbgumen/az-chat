import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import { getCaptcha, sendCode, loginByPhone, registerUser, checkPhone } from '../../api/auth';
import { CodeInput } from './CodeInput';
import { NicknameStep } from './NicknameStep';

type Step = 'phone' | 'code' | 'nickname';

interface PhoneLoginProps {
  onLogin: (data: any) => void;
  onStepChange?: (step: Step) => void;
  agreeDisabled?: boolean;
}

export function PhoneLogin({ onLogin, onStepChange, agreeDisabled }: PhoneLoginProps) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaError, setCaptchaError] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const captchaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  useEffect(() => {
    if (showCaptcha) {
      setTimeout(() => captchaInputRef.current?.focus(), 100);
    }
  }, [showCaptcha]);

  const fetchCaptcha = async () => {
    if (!/^1\d{10}$/.test(phone)) { setError('请输入正确的手机号'); return; }
    setError('');
    try {
      // 并行获取图形验证码和检查手机号是否已注册
      const [captchaRes, checkRes]: [any, any] = await Promise.all([
        getCaptcha(),
        checkPhone(phone),
      ]);
      if (captchaRes.code === 0) {
        setCaptchaToken(captchaRes.data.token);
        setCaptchaSvg(captchaRes.data.svg);
        setCaptchaAnswer('');
        setCaptchaError('');
        setShowCaptcha(true);
        // 根据是否已注册决定显示 2 步还是 3 步
        if (checkRes.code === 0) {
          setIsNewUser(!checkRes.data.exists);
        }
      } else {
        setError(captchaRes.message || '获取验证失败');
      }
    } catch {
      setError('网络错误，请重试');
    }
  };

  const handleSendCodeWithCaptcha = async () => {
    if (!captchaAnswer.trim()) { setCaptchaError('请输入验证码'); return; }
    setCaptchaError('');
    setShowCaptcha(false);
    setError('');
    try {
      const res: any = await sendCode(phone, captchaToken, captchaAnswer.trim());
      if (res.code === 0) {
        setCountdown(60);
        countdownRef.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) { if (countdownRef.current) clearInterval(countdownRef.current); return 0; }
            return prev - 1;
          });
        }, 1000);
        setStep('code');
      } else {
        setError(res.message || '发送失败');
      }
    } catch {
      setError('网络错误，请重试');
    }
  };

  const handleCodeChange = (val: string) => {
    setCode(val);
    setCodeError(false);
    if (val.length === 6) {
      handleVerify(val);
    }
  };

  const handleVerify = async (verifyCode: string) => {
    setLoading(true);
    setError('');
    setCodeError(false);
    try {
      const res: any = await loginByPhone(phone, verifyCode);
      if (res.code === 0) {
        onLogin(res.data);
      } else if (res.code === 200 && res.data?.needRegister) {
        setTempToken(res.data.tempToken);
        setIsNewUser(true);
        setStep('nickname');
      } else {
        setCodeError(true);
        setError(res.message || '验证失败');
        setCode('');
      }
    } catch {
      setCodeError(true);
      setError('网络错误，请重试');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleNicknameSubmit = async (nickname: string) => {
    setLoading(true);
    setError('');
    try {
      const res: any = await registerUser(tempToken, nickname);
      if (res.code === 0) {
        onLogin(res.data);
      } else {
        setError(res.message || '注册失败');
        throw new Error(res.message);
      }
    } catch (err: any) {
      setError(err?.message || '注册失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const stepLabels: Record<Step, string> = { phone: '手机号登录/注册', code: '请输入短信验证码', nickname: '设置昵称' };
  const steps = isNewUser ? (['phone', 'code', 'nickname'] as Step[]) : (['phone', 'code'] as Step[]);

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, i) => {
          const isActive = s === step;
          const isDone = (step === 'code' && i === 0) || (step === 'nickname' && i < 2);
          return (
            <div key={s} className="flex items-center gap-2">
              <span
                className="flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-medium transition-all duration-300"
                style={{
                  background: isActive ? 'linear-gradient(135deg, #C8956C, #D4A574)' : isDone ? '#C8956C' : '#f2ede6',
                  color: isActive || isDone ? '#fff' : '#BFB0A3',
                  boxShadow: isActive ? '0 2px 8px rgba(200,149,108,0.4)' : 'none',
                }}
              >
                {isDone ? '✓' : i + 1}
              </span>
              {i < steps.length - 1 && (
                <div
                  className="w-6 h-px transition-colors duration-300"
                  style={{ background: isDone ? '#D4C8BA' : '#f2ede6' }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step title */}
      <p className="text-[11px] text-cream-500 tracking-widest mb-1">PHONE LOGIN</p>
      <p className="text-lg font-semibold text-cream-900 mb-5 font-display">{stepLabels[step]}</p>

      {/* Step content */}
      <AnimatePresence mode="wait">
        {step === 'phone' && (
          <motion.div key="phone" className="space-y-4"
            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
            <div>
              <div
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200"
                style={{
                  background: 'rgba(248,245,240,0.9)',
                  boxShadow: '0 2px 10px rgba(45,32,22,0.04)',
                }}
              >
                <span className="text-sm text-cream-400 flex-shrink-0">+86</span>
                <input
                  type="tel"
                  maxLength={11}
                  placeholder="请输入手机号"
                  value={phone}
                  onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setError(''); }}
                  autoFocus
                  className="flex-1 bg-transparent text-sm text-cream-900 placeholder:text-cream-400 outline-none"
                  style={{ border: 'none' }}
                />
              </div>
            </div>

            {error && (
              <motion.div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] text-red-600"
                style={{ background: 'rgba(239,68,68,0.07)' }}
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                <AlertCircle size={14} className="flex-shrink-0" />{error}
              </motion.div>
            )}

            {agreeDisabled && phone.length === 11 && (
              <motion.p className="text-[12px] text-amber-600 text-center"
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                请先阅读并同意用户协议和隐私政策
              </motion.p>
            )}
            <button onClick={() => {
              if (agreeDisabled) {
                setError('请先阅读并同意用户协议和隐私政策');
                return;
              }
              fetchCaptcha();
            }} disabled={!phone || phone.length < 11}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white text-[15px] font-medium transition-all active:scale-[0.98] disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #C8956C 0%, #D4A574 100%)',
                boxShadow: '0 4px 20px rgba(200,149,108,0.35)',
              }}>
              获取验证码
            </button>
          </motion.div>
        )}

        {step === 'code' && (
          <motion.div key="code" className="space-y-4"
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
            <p className="text-[13px] text-cream-600 text-center mb-1">
              验证码已发送至 {phone.slice(0, 3)}****{phone.slice(-4)}
            </p>
            <p className="text-[11px] text-cream-400 text-center mb-1">
              请在下方输入6位数字验证码
            </p>

            <CodeInput
              value={code}
              onChange={handleCodeChange}
              hasError={codeError}
              disabled={loading}
            />

            {error && (
              <motion.div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] text-red-600"
                style={{ background: 'rgba(239,68,68,0.07)' }}
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                <AlertCircle size={14} className="flex-shrink-0" />{error}
              </motion.div>
            )}

            <div className="flex items-center justify-between pt-1">
              <button onClick={() => { setStep('phone'); setCode(''); setError(''); setIsNewUser(false); }}
                className="text-[12px] text-cream-500 hover:text-cream-700 transition-colors">
                更换手机号
              </button>
              <button onClick={fetchCaptcha} disabled={countdown > 0}
                className={`text-[12px] transition-all ${countdown > 0 ? 'text-cream-400 cursor-not-allowed' : 'text-warm-600 hover:text-warm-700'}`}>
                {countdown > 0 ? `${countdown}s 后重发` : '重新发送'}
              </button>
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 pt-2 text-cream-500 text-[12px]">
                <Loader2 size={16} className="animate-spin" /> 验证中...
              </div>
            )}
          </motion.div>
        )}

        {step === 'nickname' && (
          <NicknameStep
            key="nickname"
            phone={phone}
            onSubmit={handleNicknameSubmit}
            onBack={() => { setStep('phone'); setCode(''); setError(''); setIsNewUser(false); }}
            loading={loading}
          />
        )}
      </AnimatePresence>

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

              {/* SVG 图形验证码 */}
              <div className="flex justify-center mb-4">
                <div className="rounded-xl overflow-hidden" style={{ boxShadow: '0 2px 10px rgba(45,32,22,0.06)' }}>
                  <img
                    src={captchaSvg}
                    alt="验证码"
                    className="h-[50px] cursor-pointer"
                    onClick={fetchCaptcha}
                    title="点击刷新"
                  />
                </div>
              </div>
              <p className="text-center text-[10px] text-cream-400 mb-3">点击图片可刷新</p>

              <input
                ref={captchaInputRef}
                type="text"
                maxLength={6}
                placeholder="请输入图中字符"
                value={captchaAnswer}
                onChange={e => { setCaptchaAnswer(e.target.value); setCaptchaError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSendCodeWithCaptcha()}
                className="w-full px-4 py-3 rounded-xl text-center text-lg font-semibold tracking-[0.3em] text-cream-900 placeholder:text-cream-400 outline-none transition-all"
                style={{
                  background: 'rgba(248,245,240,0.9)',
                  boxShadow: '0 2px 10px rgba(45,32,22,0.04)',
                  border: 'none',
                }}
              />

              {captchaError && (
                <p className="text-[12px] text-red-500 text-center mt-2">{captchaError}</p>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowCaptcha(false)}
                  className="flex-1 py-2.5 rounded-xl text-[13px] text-cream-600 font-medium hover:bg-cream-100 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSendCodeWithCaptcha}
                  disabled={!captchaAnswer}
                  className="flex-1 py-2.5 rounded-xl text-[13px] text-white font-medium transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #C8956C 0%, #D4A574 100%)',
                    boxShadow: '0 4px 16px rgba(200,149,108,0.3)',
                  }}
                >
                  确认
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
