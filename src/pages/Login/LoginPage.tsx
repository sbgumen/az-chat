import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RemoteImage } from '../../components/RemoteImage';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/admin';
import { PhoneLogin } from './PhoneLogin';
import { IdLogin } from './IdLogin';
import { EmailLogin } from './EmailLogin';
import { PasswordRegister } from './PasswordRegister';

type LoginMode = 'password' | 'phone' | 'email' | 'code';
type CodeSubMode = 'phone' | 'email';

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;

export function LoginPage() {
  // 从后台获取的登录方式配置
  const [loginConfig, setLoginConfig] = useState<{ password: boolean; phone: boolean; email: boolean }>({
    password: true, phone: false, email: false,
  });
  const [configReady, setConfigReady] = useState(false);

  const [mode, setMode] = useState<LoginMode>('password');
  const [codeSubMode, setCodeSubMode] = useState<CodeSubMode>('phone');
  const [showRegister, setShowRegister] = useState(false);
  const [showMobileBrand, setShowMobileBrand] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [sysName, setSysName] = useState(() => localStorage.getItem('az_sysname') || 'AZ-Chat');
  const [sysLogo, setSysLogo] = useState(() => localStorage.getItem('az_syslogo') || '/logo.png');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    adminApi.getPublicSettings().then((r: any) => {
      if (r.code === 0) {
        const pwd = (r.data.login_method_password ?? '1') !== '0';
        const phone = (r.data.login_method_phone ?? '0') !== '0';
        const email = (r.data.login_method_email ?? '0') !== '0';
        setLoginConfig({ password: pwd, phone, email });
        // 设置默认选中的方式：验证码方式优先
        if (phone && email) setMode('code');
        else if (phone) setMode('phone');
        else if (email) setMode('email');
        else if (pwd) setMode('password');
        if (r.data.system_name) { setSysName(r.data.system_name); localStorage.setItem('az_sysname', r.data.system_name); document.title = r.data.system_name; }
        if (r.data.system_logo) { setSysLogo(r.data.system_logo); localStorage.setItem('az_syslogo', r.data.system_logo); }
      }
      setConfigReady(true);
    }).catch(() => setConfigReady(true));
  }, []);

  const handleLogin = (dataOrToken: any, userObj?: any) => {
    if (userObj) { login(dataOrToken, userObj); }
    else { login(dataOrToken); }
    navigate('/messages', { replace: true });
  };

  const { password: hasPwd, phone: hasPhone, email: hasEmail } = loginConfig;
  // 验证码方式数量（phone + email）
  const codeMethodCount = (hasPhone ? 1 : 0) + (hasEmail ? 1 : 0);
  // 总共开启的方式数
  const totalMethods = (hasPwd ? 1 : 0) + codeMethodCount;
  // 是否需要显示一级Tab
  const showMainTabs = totalMethods >= 2;
  // 验证码Tab是否需要二级分段
  const showCodeSubTabs = codeMethodCount >= 2;

  // 仅密码模式时使用的模式标识
  const activeMode: LoginMode = showMainTabs ? mode : (hasPwd ? 'password' : (hasPhone ? 'phone' : 'email'));

  const logoUrl = sysLogo.startsWith('http') ? sysLogo : `${apiBase}${sysLogo}`;

  if (!configReady) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #fdfaf6 0%, #f5ede2 50%, #ede8e0 100%)' }}>
        <div className="w-8 h-8 border-2 border-warm-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 渲染表单内容
  const renderFormContent = () => {
    if (showRegister) {
      return <PasswordRegister key="register" onLogin={handleLogin} onBack={() => setShowRegister(false)} agreeDisabled={!agreed} />;
    }

    if (activeMode === 'password') {
      return (
        <IdLogin
          key="password"
          onLogin={handleLogin}
          agreeDisabled={!agreed}
          multiInput={totalMethods > 1}
        />
      );
    }

    if (activeMode === 'phone') {
      return (
        <PhoneLogin
          key="phone"
          onLogin={handleLogin}
          onStepChange={s => setShowMobileBrand(s === 'phone')}
          agreeDisabled={!agreed}
        />
      );
    }

    if (activeMode === 'email') {
      return (
        <EmailLogin key="email" onLogin={handleLogin} agreeDisabled={!agreed} />
      );
    }

    if (activeMode === 'code') {
      if (codeSubMode === 'phone') {
        return <PhoneLogin key="code-phone" onLogin={handleLogin} onStepChange={s => setShowMobileBrand(s === 'phone')} agreeDisabled={!agreed} />;
      }
      return <EmailLogin key="code-email" onLogin={handleLogin} agreeDisabled={!agreed} />;
    }

    return null;
  };

  // 底部文案和切换逻辑
  const renderBottomToggle = () => {
    if (showRegister) return null;
    if (!showMainTabs) {
      if (hasPwd) {
        return (
          <motion.div className="mt-4 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
            <button onClick={() => setShowRegister(true)} className="text-[12px] text-cream-500 hover:text-warm-600 transition-colors tracking-wider">
              还没有账号？<span className="text-warm-600 underline underline-offset-2">立即注册</span>
            </button>
          </motion.div>
        );
      }
      return null;
    }

    // 有多个Tab时显示切换
    const otherLabel = activeMode === 'password' ? (
      showCodeSubTabs ? '手机号/邮箱登录/注册 →' : hasPhone ? '手机号登录/注册 →' : '邮箱登录/注册 →'
    ) : '账号密码登录 →';

    return (
      <motion.div className="mt-4 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
        <button
          onClick={() => {
            if (activeMode === 'password') {
              setMode(showCodeSubTabs ? 'code' : hasPhone ? 'phone' : 'email');
            } else {
              setMode('password');
            }
          }}
          className="text-[12px] text-cream-500 hover:text-warm-600 transition-colors tracking-wider"
        >
          使用{otherLabel}
        </button>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen w-screen flex overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #fdfaf6 0%, #f5ede2 50%, #ede8e0 100%)' }}>

      {/* ========== 桌面端 ========== */}
      <div className="hidden md:flex w-full h-screen">
        <div className="flex-[1] relative flex items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(170deg, #f5ede2 0%, #e8e0d6 50%, #d4c8ba 100%)' }}>
          <div className="absolute top-[-100px] right-[-80px] w-72 h-72 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(200,149,108,0.16) 0%, transparent 70%)' }} />
          <div className="absolute bottom-[-80px] left-[-60px] w-80 h-80 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(91,173,122,0.10) 0%, transparent 70%)' }} />
          <div className="absolute top-[45%] left-[15%] w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(200,149,108,0.07) 0%, transparent 70%)' }} />
          <div className="absolute top-[20%] right-[25%] w-32 h-32 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(212,165,116,0.08) 0%, transparent 70%)' }} />
          <div className="relative z-10 text-center px-10">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 rounded-[28px] blur-xl opacity-25"
                  style={{ background: 'linear-gradient(135deg, #C8956C, #D4A574)', transform: 'scale(1.2)' }} />
                <RemoteImage key={logoUrl} src={logoUrl} alt={sysName} className="relative w-20 h-20 rounded-[24px] object-cover"
                  style={{ boxShadow: '0 8px 32px rgba(200,149,108,0.25)' }} />
              </div>
            </motion.div>
            <motion.h1 className="font-display text-[32px] tracking-[0.08em] text-cream-900 mb-3"
              initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
              {sysName}
            </motion.h1>
            <motion.p className="text-[14px] text-cream-600 tracking-[0.15em] font-body"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.25 }}>
              连接你我，温暖每一刻
            </motion.p>
            <motion.div className="mt-10 w-20 h-px mx-auto"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(200,149,108,0.4), transparent)' }}
              initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ duration: 0.5, delay: 0.4 }} />
            <motion.p className="mt-4 text-[12px] text-cream-500 tracking-[0.1em]"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.5 }}>
              安全 · 私密 · 即时
            </motion.p>
          </div>
        </div>

        {/* 右栏 - 表单区 */}
        <div className="flex-[1.1] flex items-center justify-center p-10" style={{ background: '#fdfaf6' }}>
          <motion.div className="w-full max-w-[340px]"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* 一级Tab */}
            {showMainTabs && (
              <div className="flex mb-6">
                {hasPwd && (
                  <button
                    onClick={() => { setMode('password'); setShowRegister(false); }}
                    className="flex-1 text-center pb-3 text-sm font-medium border-b-2 transition-all"
                    style={{
                      color: activeMode === 'password' ? '#C8956C' : '#B0A090',
                      borderColor: activeMode === 'password' ? '#C8956C' : 'transparent',
                    }}
                  >账号密码登录</button>
                )}
                {codeMethodCount > 0 && (
                  <button
                    onClick={() => {
                      setShowRegister(false);
                      if (showCodeSubTabs) { setMode('code'); }
                      else if (hasPhone) { setMode('phone'); }
                      else { setMode('email'); }
                    }}
                    className="flex-1 text-center pb-3 text-sm font-medium border-b-2 transition-all"
                    style={{
                      color: (activeMode === 'code' || activeMode === 'phone' || activeMode === 'email') ? '#C8956C' : '#B0A090',
                      borderColor: (activeMode === 'code' || activeMode === 'phone' || activeMode === 'email') ? '#C8956C' : 'transparent',
                    }}
                  >
                    {showCodeSubTabs ? '验证码登录/注册' : hasPhone ? '手机号登录/注册' : '邮箱登录/注册'}
                  </button>
                )}
              </div>
            )}

            {/* 二级分段（验证码Tab内） */}
            {showCodeSubTabs && activeMode === 'code' && (
              <div className="flex mb-5 bg-cream-100/50 rounded-lg p-1">
                <button
                  onClick={() => setCodeSubMode('phone')}
                  className="flex-1 py-2 text-xs font-medium rounded-md transition-all"
                  style={{
                    background: codeSubMode === 'phone' ? 'linear-gradient(135deg, #C8956C, #D4A574)' : 'transparent',
                    color: codeSubMode === 'phone' ? '#fff' : '#B0A090',
                  }}
                >手机号</button>
                <button
                  onClick={() => setCodeSubMode('email')}
                  className="flex-1 py-2 text-xs font-medium rounded-md transition-all"
                  style={{
                    background: codeSubMode === 'email' ? 'linear-gradient(135deg, #8E8CD8, #A5A3E0)' : 'transparent',
                    color: codeSubMode === 'email' ? '#fff' : '#B0A090',
                  }}
                >邮箱</button>
              </div>
            )}

            <AnimatePresence mode="wait">
              <div key={activeMode + (activeMode === 'code' ? codeSubMode : '') + (showRegister ? 'reg' : '')}>
                {renderFormContent()}
              </div>
            </AnimatePresence>

            {/* 协议勾选 */}
            <motion.div className="mt-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <button onClick={() => setAgreed(v => !v)} className="flex-shrink-0 mt-0.5 transition-colors">
                    {agreed ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8956C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      <div className="w-4 h-4 rounded border-2 border-cream-400" />
                    )}
                  </button>
                  <span className="text-[12px] text-cream-700 leading-relaxed">
                    已阅读并同意
                    <span onClick={(e) => { e.stopPropagation(); navigate('/legal/terms'); }} className="text-warm-600 cursor-pointer hover:text-warm-700 underline underline-offset-2">《用户协议》</span>
                    和
                    <span onClick={(e) => { e.stopPropagation(); navigate('/legal/privacy'); }} className="text-warm-600 cursor-pointer hover:text-warm-700 underline underline-offset-2">《隐私政策》</span>
                  </span>
                </label>
              </motion.div>

            {renderBottomToggle()}
          </motion.div>
        </div>
      </div>

      {/* ========== 移动端 ========== */}
      <div className="flex md:hidden w-full h-screen items-center justify-center px-5 relative">
        <div className="absolute top-[-60px] right-[-40px] w-60 h-60 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(200,149,108,0.14) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(91,173,122,0.09) 0%, transparent 70%)' }} />
        <div className="absolute top-[35%] right-[-30px] w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(200,149,108,0.06) 0%, transparent 70%)' }} />

        <motion.div className="relative z-10 w-full max-w-[340px]"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <AnimatePresence>
            {showMobileBrand && !showRegister && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="text-center">
                  <div className="relative inline-block mb-3">
                    <div className="absolute inset-0 rounded-[22px] blur-lg opacity-20"
                      style={{ background: 'linear-gradient(135deg, #C8956C, #D4A574)', transform: 'scale(1.15)' }} />
                    <RemoteImage src={logoUrl} alt={sysName} className="relative w-14 h-14 rounded-[18px] object-cover" />
                  </div>
                  <h1 className="font-display text-[22px] tracking-[0.06em] text-cream-900">{sysName}</h1>
                  <p className="text-[11px] text-cream-500 tracking-[0.12em] mt-1">连接你我，温暖每一刻</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>


          {/* 移动端二级分段 */}
          {showCodeSubTabs && activeMode === 'code' && (
            <div className="flex mb-4 bg-cream-100/40 rounded-md p-0.5 max-w-[200px] mx-auto">
              <button
                onClick={() => setCodeSubMode('phone')}
                className="flex-1 py-1.5 text-[11px] font-medium rounded transition-all"
                style={{
                  background: codeSubMode === 'phone' ? 'rgba(200,149,108,0.85)' : 'transparent',
                  color: codeSubMode === 'phone' ? '#fff' : '#B0A090',
                }}
              >手机号</button>
              <button
                onClick={() => setCodeSubMode('email')}
                className="flex-1 py-1.5 text-[11px] font-medium rounded transition-all"
                style={{
                  background: codeSubMode === 'email' ? 'rgba(142,140,216,0.85)' : 'transparent',
                  color: codeSubMode === 'email' ? '#fff' : '#B0A090',
                }}
              >邮箱</button>
            </div>
          )}

          <AnimatePresence mode="wait">
            <div key={(showMainTabs ? activeMode : 'single') + (activeMode === 'code' ? codeSubMode : '') + (showRegister ? 'reg' : '')}>
              {renderFormContent()}
            </div>
          </AnimatePresence>

          {/* 协议勾选 */}
          <div className="mt-5">
            <div className="flex items-start gap-2 cursor-pointer select-none" onClick={() => setAgreed(v => !v)}>
              <div className="flex-shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center">
                {agreed ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8956C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                ) : (
                  <div className="w-4 h-4 rounded border-2 border-cream-400" />
                )}
              </div>
              <span className="text-[12px] text-cream-700 leading-relaxed">
                已阅读并同意
                <span onClick={(e) => { e.stopPropagation(); navigate('/legal/terms'); }} className="text-warm-600 cursor-pointer hover:text-warm-700 underline underline-offset-2">《用户协议》</span>
                和
                <span onClick={(e) => { e.stopPropagation(); navigate('/legal/privacy'); }} className="text-warm-600 cursor-pointer hover:text-warm-700 underline underline-offset-2">《隐私政策》</span>
              </span>
            </div>
          </div>

          {renderBottomToggle()}
        </motion.div>
      </div>
    </div>
  );
}
