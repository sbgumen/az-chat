import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Lock, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSmartBack } from '../../hooks/useSmartBack';
import { useAuth } from '../../context/AuthContext';
import { getProfile, getLv30Style, saveLv30Style } from '../../api/user';
import { HOME_STYLES, type HomeStyle } from '../../components/effects/lv30Styles';

const STYLE_ORDER: HomeStyle[] = ['original', 'golden', 'sakura', 'crystal', 'aurora', 'neon'];

export function HomeStylePage() {
  const goBack = useSmartBack('/profile/personalization');
  const { user, updateUser } = useAuth();

  const [currentStyle, setCurrentStyle] = useState<HomeStyle>('original');
  const [previewStyle, setPreviewStyle] = useState<HomeStyle>('original');
  const [userLevel, setUserLevel] = useState(user?.level ?? 1);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const thumbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const [profileRes]: any[] = await Promise.all([getProfile(), getLv30Style()]);
        if (profileRes.code === 0) {
          const level = profileRes.data.level ?? 1;
          setUserLevel(level);
          const style = (localStorage.getItem('az_lv30_style') || profileRes.data.lv30_style || 'original') as HomeStyle;
          setCurrentStyle(style);
          setPreviewStyle(style);
          // Scroll to current style
          setTimeout(() => {
            const idx = STYLE_ORDER.indexOf(style);
            if (thumbRef.current && idx >= 0) {
              const el = thumbRef.current.children[idx] as HTMLElement;
              el?.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
            }
          }, 100);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  // When previewStyle changes (via arrow buttons or tap), scroll it to center
  useEffect(() => {
    const idx = STYLE_ORDER.indexOf(previewStyle);
    if (thumbRef.current && idx >= 0) {
      const el = thumbRef.current.children[idx] as HTMLElement;
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [previewStyle]);

  const isUnlocked = (style: HomeStyle) => userLevel >= HOME_STYLES[style].unlockLevel;
  const isCurrent = (style: HomeStyle) => style === currentStyle;

  const handleApply = async (style: HomeStyle) => {
    if (!isUnlocked(style) || isCurrent(style) || saving) return;
    setSaving(true);
    try {
      await saveLv30Style(style);
      setCurrentStyle(style);
      localStorage.setItem('az_lv30_style', style);
      updateUser({ lv30_style: style });
      setToast(`${HOME_STYLES[style].label} 已应用`);
      setTimeout(() => setToast(''), 2000);
    } catch {
      setToast('保存失败，请重试');
      setTimeout(() => setToast(''), 2000);
    }
    setSaving(false);
  };

  const p = HOME_STYLES[previewStyle] || HOME_STYLES.original;

  return (
    <motion.div
      className="fixed inset-0 z-[250] flex flex-col"
      style={{ background: '#1a1a2e' }}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 flex-shrink-0">
        <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft size={20} className="text-white/70" />
        </button>
        <h1 className="text-[17px] font-bold text-white/90">主页风格</h1>
        <div className="w-9" />
      </div>

      {/* Immersive preview area (~60%) */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={previewStyle}
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: p.bgGradient }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Aurora layers */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* 渐变流动光扫 */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, transparent 35%, ${p.previewPrimary}0a 48%, ${p.previewSecondary}15 50%, ${p.previewPrimary}0a 52%, transparent 65%)`,
                  backgroundSize: '300% 300%',
                }}
                animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute -top-20 -left-10 w-[85%] h-[60%]"
                style={{ background: p.aurora1, filter: 'blur(50px)', willChange: 'transform', opacity: 0.6 }}
                animate={{ x: [0, 25, 0, -18, 0], y: [0, -15, 0, 12, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute -bottom-12 -right-8 w-[70%] h-[50%]"
                style={{ background: p.aurora2, filter: 'blur(45px)', willChange: 'transform', opacity: 0.5 }}
                animate={{ x: [0, -20, 0, 16, 0], y: [0, 18, 0, -12, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
              />
              <motion.div
                className="absolute top-[10%] left-[35%] w-[55%] h-[40%]"
                style={{ background: p.aurora3, filter: 'blur(40px)', willChange: 'transform', opacity: 0.4 }}
                animate={{ x: [0, 15, 0, -12, 0], y: [0, -10, 0, 14, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
              />
              <motion.div
                className="absolute bottom-[5%] right-[10%] w-[45%] h-[35%]"
                style={{ background: p.aurora4, filter: 'blur(38px)', willChange: 'transform', opacity: 0.35 }}
                animate={{ x: [0, -12, 0, 14, 0], y: [0, -10, 0, 8, 0] }}
                transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
              />
            </div>

            {/* Simulated avatar ring */}
            <div className="relative" style={{ width: 88, height: 88 }}>
              <motion.div
                className="absolute inset-[-6px] rounded-full"
                style={{
                  background: p.ringOuter,
                  filter: 'blur(0.5px)',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute inset-[-3px] rounded-full"
                style={{
                  background: p.ringMiddle,
                }}
                animate={{ rotate: -360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              />
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '2px solid rgba(255,255,255,0.1)',
                }}
              />
              <motion.div
                className="absolute inset-[2px] rounded-full"
                style={{
                  background: p.ringInner,
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              />
            </div>

            {/* Nickname preview */}
            <div className="mt-6 text-center">
              <span
                className="font-display text-xl font-bold"
                style={{
                  background: p.nameGradient,
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: p.nameShadow !== 'none' ? p.nameShadow : undefined,
                }}
              >
                {user?.nickname || '你的昵称'}
              </span>
              <p className="text-[11px] mt-1.5" style={{ color: p.isDark ? 'rgba(255,255,255,0.3)' : '#8b6f50' }}>
                ID: {user?.id ?? '...'} · LV.{userLevel}
              </p>
            </div>

            {/* Style name overlay top-left */}
            <div className="absolute top-4 left-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-40"
                style={{ color: p.isDark ? 'white' : '#3d2b1a' }}>预览效果</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Thumbnail strip (~30%) */}
      <div className="flex-shrink-0 py-4" style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #12121f 100%)' }}>
        <div className="flex items-center justify-between px-5 mb-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/20">选择风格</p>
          {/* Arrow controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const idx = STYLE_ORDER.indexOf(previewStyle);
                if (idx > 0) setPreviewStyle(STYLE_ORDER[idx - 1]);
              }}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <ChevronLeft size={14} className="text-white/40" />
            </button>
            <button
              onClick={() => {
                const idx = STYLE_ORDER.indexOf(previewStyle);
                if (idx < STYLE_ORDER.length - 1) setPreviewStyle(STYLE_ORDER[idx + 1]);
              }}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <ChevronRight size={14} className="text-white/40" />
            </button>
          </div>
        </div>
        <div
          ref={thumbRef}
          className="flex gap-3 px-5 overflow-x-auto scrollbar-hide py-4"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {STYLE_ORDER.map((key) => {
            const s = HOME_STYLES[key];
            const unlocked = userLevel >= s.unlockLevel;
            const selected = previewStyle === key;
            const active = currentStyle === key;
            return (
              <button
                key={key}
                onClick={() => setPreviewStyle(key)}
                className="flex-shrink-0 relative rounded-2xl transition-all duration-200"
                style={{
                  width: 100,
                  height: 120,
                  background: s.bgGradient,
                  boxShadow: selected
                    ? `0 0 0 2px ${s.cardAccent}, 0 0 20px ${s.cardAccent}60`
                    : '0 4px 12px rgba(0,0,0,0.3)',
                  scrollSnapAlign: 'center',
                  opacity: unlocked ? 1 : 0.45,
                }}
              >
                {/* Preview ring in center */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full"
                  style={{ border: `2px solid ${s.previewPrimary}`, opacity: 0.7, background: s.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.3)' }} />

                {/* Aurora blob hints */}
                <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full blur-lg"
                  style={{ background: s.previewPrimary, opacity: 0.3 }} />
                <div className="absolute -bottom-2 -left-2 w-9 h-9 rounded-full blur-lg"
                  style={{ background: s.previewSecondary, opacity: 0.2 }} />

                {/* Active badge */}
                {active && (
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[8px] font-bold"
                    style={{ background: s.cardAccent, color: '#fff' }}>
                    使用中
                  </div>
                )}

                {/* Lock badge */}
                {!unlocked && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <Lock size={10} className="text-white/60" />
                  </div>
                )}

                {/* Selected check */}
                {selected && unlocked && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: s.cardAccent }}>
                    <Check size={11} className="text-white" />
                  </div>
                )}

                {/* Name label */}
                <div className="absolute bottom-2.5 left-0 right-0 text-center">
                  <span className="text-[10px] font-semibold"
                    style={{ color: s.isDark ? s.previewText : '#5c4330' }}>
                    {s.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom action bar (~10%) */}
      <div className="flex-shrink-0 px-5 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-3"
        style={{ background: '#12121f' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[14px] font-bold text-white/90">{p.label}</p>
            <p className="text-[11px] text-white/40 mt-0.5">{p.desc}</p>
          </div>
          {!isUnlocked(previewStyle) && (
            <span className="text-[12px] text-white/30 font-medium">
              LV{HOME_STYLES[previewStyle].unlockLevel} 解锁
            </span>
          )}
        </div>
        <button
          onClick={() => handleApply(previewStyle)}
          disabled={!isUnlocked(previewStyle) || isCurrent(previewStyle) || saving}
          className="w-full py-3 rounded-2xl text-[14px] font-semibold transition-all active:scale-[0.97] disabled:opacity-40"
          style={{
            background: isUnlocked(previewStyle) && !isCurrent(previewStyle)
              ? `linear-gradient(135deg, ${p.previewPrimary}, ${p.previewSecondary})`
              : 'rgba(255,255,255,0.08)',
            color: isUnlocked(previewStyle) && !isCurrent(previewStyle) ? '#fff' : 'rgba(255,255,255,0.4)',
          }}
        >
          {saving ? '保存中...'
            : isCurrent(previewStyle) ? '当前使用中'
            : isUnlocked(previewStyle) ? '应用风格'
            : `LV${HOME_STYLES[previewStyle].unlockLevel} 解锁`}
        </button>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[500] px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-md text-white text-sm font-medium whitespace-nowrap"
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
