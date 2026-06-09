import { RemoteImage } from '../../components/RemoteImage';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bookmark, Image, ChevronRight, Pencil, Gift, Zap } from 'lucide-react';
import { getProfile, getLevelInfo, signIn } from '../../api/user';
import { calcCompletion } from '../../utils/profileCompletion';
import { getMediaUrl } from '../../utils/mediaUrl';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { calcStarDisplay, TIER_META } from '../../utils/levelStars';
import goldImg from '../../assets/gold.png';

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-cream-300/60 rounded-xl ${className}`} />;
}

function MiniStarRow({ count, tier }: { count: number; tier: number }) {
  if (count === 0) return null;
  const { icon: Icon, fill } = TIER_META[tier];
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <span key={i} className="relative flex items-center justify-center"
          style={{ filter: i < count ? 'drop-shadow(0 0 2px rgba(0,0,0,0.6))' : undefined }}>
          <Icon size={13} fill={i < count ? fill : 'rgba(255,255,255,0.2)'} style={{ color: i < count ? fill : 'rgba(255,255,255,0.2)' }} />
        </span>
      ))}
    </div>
  );
}

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [levelData, setLevelData] = useState<any>(null);
  const [signing, setSigning] = useState(false);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    Promise.all([
      getProfile().then((res: any) => { if (res.code === 0) { setProfile(res.data); updateUser(res.data); } }).catch(() => {}),
      getLevelInfo().then((res: any) => { if (res.code === 0) setLevelData(res.data); }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const displayUser = profile || user;
  const level = levelData?.level ?? displayUser?.level ?? 1;
  const exp = levelData?.exp ?? 0;
  const progress = Math.min((exp % 100) / 100, 1);
  const alreadySigned = levelData?.signedToday ?? false;
  const completion = calcCompletion(displayUser);

  const handleSignIn = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (signing || alreadySigned) return;
    setSigning(true);
    try {
      const res: any = await signIn();
      if (res.code === 0) {
        setLevelData((prev: any) => prev ? { ...prev, exp: res.data.exp, level: res.data.level, signedToday: true } : prev);
        setProfile((prev: any) => prev ? { ...prev, coins: res.data.coins } : prev);
      }
    } catch { /* ignore */ }
    setSigning(false);
  };

  // 等级渐变配置
  const levelConfig = level >= 27
    ? { gradient: 'linear-gradient(135deg,#ff6b00 0%,#ff2d78 30%,#c026d3 60%,#7c3aed 100%)', glow: 'rgba(255,45,120,0.45)', accent: '#ff9f43' }
    : level >= 18
    ? { gradient: 'linear-gradient(135deg,#7c3aed 0%,#6366f1 50%,#4f46e5 100%)', glow: 'rgba(124,58,237,0.35)', accent: '#a78bfa' }
    : level >= 9
    ? { gradient: 'linear-gradient(135deg,#2563eb 0%,#4f46e5 50%,#7c3aed 100%)', glow: 'rgba(79,70,229,0.35)', accent: '#818cf8' }
    : { gradient: 'linear-gradient(135deg,#c8956c 0%,#e8b89a 50%,#b87040 100%)', glow: 'rgba(200,149,108,0.35)', accent: '#fcd9b0' };

  const menuItems = [
    { icon: Gift, label: '礼物墙', desc: '收到的礼物展示', action: undefined, highlight: true },
    { icon: Bookmark, label: '收藏', desc: '查看收藏的内容', action: () => navigate('/profile/favorites') },
    { icon: Image, label: '相册', desc: '我的相册集', action: () => navigate('/profile/album') },
    { icon: Settings, label: '设置', desc: '账号与隐私', action: () => navigate('/profile/settings') },
  ];

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-cream-100 pb-[calc(68px+env(safe-area-inset-bottom,0px)+10px)]">
      <button
        onClick={() => navigate('/profile/settings')}
        className="absolute right-5 w-9 h-9 flex items-center justify-center rounded-full bg-cream-200/80 hover:bg-cream-300 transition-colors z-20"
        style={{ top: 'calc(var(--status-bar-height, 0px) + 40px)' }}
      >
        <Settings size={18} className="text-cream-700" />
      </button>

      {/* Hero */}
      <div className="relative flex flex-col pb-5 px-5" style={{ paddingTop: 'calc(var(--status-bar-height, 0px) + 40px)' }}>
        <div className="absolute -top-[60%] -left-[20%] -right-[20%] h-[200%] pointer-events-none bg-[radial-gradient(ellipse_at_50%_30%,rgba(200,149,108,0.08)_0%,transparent_50%)]" />

        {loading ? (
          <div className="flex items-center gap-4 mb-3">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ) : (
          <>
            <motion.div className="relative mb-3 flex items-center gap-4 w-full"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
              <div className="relative shrink-0">
                <div className="absolute inset-[-8px] rounded-full bg-gradient-to-br from-warm-400 to-warm-600 opacity-20 blur-xl" />
                <RemoteImage
                  src={displayUser?.avatar ? getMediaUrl(displayUser.avatar) : 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                  alt={displayUser?.nickname}
                  className="w-[80px] h-[80px] rounded-full border-[3px] border-cream-100 object-cover relative z-10 bg-cream-300 shadow-medium"
                />
                <span className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-sage-500 border-[2px] border-cream-100 z-20" />
              </div>
              <div className="flex-1 relative z-10 flex flex-col gap-2">
                <div className="flex items-center gap-5">
                  <button onClick={() => navigate('/profile/follow/following')} className="flex flex-col items-center gap-0.5 hover:opacity-70 transition-opacity">
                    <span className="font-display text-base font-semibold text-cream-900">{displayUser?.following ?? 0}</span>
                    <span className="text-[11px] text-cream-600">关注</span>
                  </button>
                  <div className="w-px h-5 bg-cream-300" />
                  <button onClick={() => navigate('/profile/follow/followers')} className="flex flex-col items-center gap-0.5 hover:opacity-70 transition-opacity">
                    <span className="font-display text-base font-semibold text-cream-900">{displayUser?.followers ?? 0}</span>
                    <span className="text-[11px] text-cream-600">粉丝</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {displayUser?.gender === 1 && <span className="text-[11px] font-semibold text-blue-500 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full">{'\u2642'} 男</span>}
                  {displayUser?.gender === 2 && <span className="text-[11px] font-semibold text-pink-500 bg-pink-50 border border-pink-200/60 px-2 py-0.5 rounded-full">{'\u2640'} 女</span>}
                  <button onClick={() => navigate('/profile/edit')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warm-500 text-white text-[11px] font-semibold shadow-sm hover:bg-warm-600 active:bg-warm-700 transition-all">
                    <Pencil size={10} />编辑资料
                    {completion < 100 && (
                      <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-white/25">{completion}%</span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>

          </>
        )}

        {loading ? (
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : (
          <motion.div className="w-full relative z-10" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }}>
            <h2 className="font-display text-xl font-semibold text-cream-900 mb-0.5">{displayUser?.nickname || '未设置昵称'}</h2>
            <p className="text-[12px] text-cream-600">ID: {displayUser?.id} · {displayUser?.phone}</p>
          </motion.div>
        )}
      </div>

      {/* ── 等级卡片 ── */}
      <div className="px-4 mb-3">
        {loading ? <Skeleton className="h-[108px] w-full" /> : (
          <motion.div
            onClick={() => navigate('/profile/level')}
            className="w-full relative overflow-hidden rounded-3xl cursor-pointer"
            style={level >= 27 ? {
              background: 'rgba(255,255,255,0.07)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
            } : { background: levelConfig.gradient }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            whileTap={{ scale: 0.97 }}
          >
            {/* LV27+ 极光背景层 */}
            {level >= 27 && (
              <>
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg,#0d0d1a 0%,#120820 50%,#0a0d1f 100%)' }} />
                  <div className="absolute -top-8 -left-4 w-[80%] h-24 opacity-50"
                    style={{ background: 'radial-gradient(ellipse 60% 50% at 40% 50%, rgba(255,107,0,0.55) 0%, rgba(255,45,120,0.3) 50%, transparent 70%)', filter: 'blur(20px)', animation: 'lvAurora1 6s ease-in-out infinite' }} />
                  <div className="absolute -bottom-4 right-0 w-[60%] h-20 opacity-40"
                    style={{ background: 'radial-gradient(ellipse 65% 50% at 60% 50%, rgba(192,38,211,0.5) 0%, rgba(124,58,237,0.3) 60%, transparent 70%)', filter: 'blur(18px)', animation: 'lvAurora2 8s ease-in-out infinite' }} />
                </div>
                <style>{`
                  @keyframes lvAurora1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(16px,-8px)} }
                  @keyframes lvAurora2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-12px,6px)} }
                `}</style>
              </>
            )}

            {/* 非LV27+ 光晕背景 */}
            {level < 27 && (
              <>
                <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full blur-2xl pointer-events-none"
                  style={{ background: levelConfig.glow }} />
                <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-40"
                  style={{ background: levelConfig.glow }} />
              </>
            )}

            {/* 扫光动画 — 双层增强 */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut', delay: 1 }}
            />

            <div className="relative z-10 p-4">
              {/* 顶部行：段位徽章 + 签到按钮 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {/* 等级数字徽章 */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-black/20 border border-white/20 backdrop-blur-sm shrink-0">
                    <span className="font-display text-xl font-black text-white leading-none">{level}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {(() => { const { crowns, suns, moons, stars } = calcStarDisplay(level); return (
                      <div className="flex items-center gap-1.5">
                        <MiniStarRow count={crowns} tier={3} />
                        <MiniStarRow count={suns} tier={2} />
                        <MiniStarRow count={moons} tier={1} />
                        <MiniStarRow count={stars} tier={0} />
                        {crowns === 0 && suns === 0 && moons === 0 && stars === 0 && (
                          <span className="text-white/50 text-[10px]">— —</span>
                        )}
                      </div>
                    ); })()}
                    <span className="text-white/60 text-[10px]">LV.{level} · 我的等级</span>
                  </div>
                </div>

                {!alreadySigned ? (
                  <button
                    onMouseDown={e => e.preventDefault()}
                    onClick={handleSignIn}
                    disabled={signing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 backdrop-blur-sm text-white text-[12px] font-semibold hover:bg-white/30 transition-all active:scale-95"
                  >
                    <Zap size={11} className="fill-white text-white" />
                    {signing ? '签到中' : '签到'}
                  </button>
                ) : (
                  <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/60 text-[12px] font-medium">
                    <span className="text-[10px]">✓</span> 已签到
                  </span>
                )}
              </div>

              {/* 经验条 */}
              <div className="space-y-1.5">
                <div className="h-1.5 rounded-full bg-black/25 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${levelConfig.accent}, white)` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ delay: 0.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/55 text-[10px]">{exp % 100} / 100 EXP</span>
                  <div className="flex items-center gap-1">
                    <span className="text-white/55 text-[10px]">距升级还差 {100 - (exp % 100)} EXP</span>
                    <ChevronRight size={12} className="text-white/40" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── 金币卡片 ── */}
      <div className="px-4 mb-3">
        {loading ? <Skeleton className="h-[80px] w-full" /> : (
          <motion.button
            onClick={() => navigate('/profile/coins')}
            className="w-full relative overflow-hidden rounded-3xl"
            style={{ background: 'linear-gradient(135deg,#0f0c29 0%,#1a1040 40%,#24243e 100%)' }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            whileTap={{ scale: 0.97 }}
          >
            {/* 星点装饰 - 动态漂浮 */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[
                { top: '20%', left: '15%', size: 2, opacity: 0.5, dur: 2.2, dy: 4 },
                { top: '60%', left: '30%', size: 1.5, opacity: 0.35, dur: 3.1, dy: 3 },
                { top: '35%', left: '55%', size: 1, opacity: 0.4, dur: 2.7, dy: 5 },
                { top: '70%', left: '70%', size: 2, opacity: 0.3, dur: 3.5, dy: 3 },
                { top: '15%', left: '80%', size: 1.5, opacity: 0.4, dur: 2.0, dy: 4 },
              ].map((s, i) => (
                <motion.div key={i}
                  className="absolute rounded-full bg-white"
                  style={{ top: s.top, left: s.left, width: s.size, height: s.size }}
                  animate={{ opacity: [s.opacity * 0.6, s.opacity * 1.8, s.opacity * 0.6], y: [0, -s.dy, 0] }}
                  transition={{ duration: s.dur, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                />
              ))}
            </div>

            {/* 金色光晕 */}
            <div className="absolute top-0 right-8 w-28 h-28 rounded-full bg-yellow-400/15 blur-2xl pointer-events-none" />

            {/* 扫光循环 */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300/12 to-transparent pointer-events-none"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
            />

            <div className="relative z-10 flex items-center gap-3.5 px-4 py-3.5">
              {/* 金币图标容器 */}
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-yellow-400/30 blur-md" />
                <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-yellow-400/25 to-amber-600/25 border border-yellow-400/30 flex items-center justify-center">
                  <img src={goldImg} alt="金币" className="w-7 h-7 object-contain drop-shadow-lg" />
                </div>
              </div>

              {/* 文字区 */}
              <div className="flex-1 min-w-0">
                <p className="text-yellow-400/60 text-[10px] font-medium tracking-wider uppercase mb-0.5">My Coins</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-[26px] font-black text-yellow-300 leading-none">{displayUser?.coins ?? 0}</span>
                  <span className="text-yellow-400/50 text-xs font-medium">枚</span>
                </div>
              </div>

              {/* 右侧 */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-[10px] text-yellow-400/40 font-medium">签到 / 升级获得</span>
                <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/20">
                  <span className="text-[10px] text-yellow-400/60 font-medium">明细</span>
                  <ChevronRight size={10} className="text-yellow-400/40" />
                </div>
              </div>
            </div>
          </motion.button>
        )}
      </div>

      {/* Menu */}
      <div className="px-4 py-2 flex flex-col gap-0.5">
        {loading ? (
          <>
            <Skeleton className="h-[60px] w-full mb-0.5" />
            <Skeleton className="h-[60px] w-full mb-0.5" />
            <Skeleton className="h-[60px] w-full mb-0.5" />
            <Skeleton className="h-[60px] w-full" />
          </>
        ) : menuItems.map((item) => {
          const Icon = item.icon;
          const isGift = (item as any).highlight;
          return (
            <button
              key={item.label}
              onClick={item.action}
              disabled={!item.action}
              className={`w-full flex items-center justify-between px-3 py-3.5 rounded-xl transition-colors disabled:cursor-default ${isGift ? 'bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200/60 hover:from-rose-100 hover:to-pink-100' : 'hover:bg-cream-200 active:bg-cream-300'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isGift ? 'bg-gradient-to-br from-rose-400 to-pink-500 shadow-sm' : 'bg-cream-200 border border-cream-300/60 text-warm-500'}`}>
                  <Icon size={18} className={isGift ? 'text-white' : ''} />
                </div>
                <div className="flex flex-col items-start">
                  <span className={`text-sm font-medium ${isGift ? 'text-rose-800' : 'text-cream-900'}`}>{item.label}</span>
                  <span className="text-[11px] text-cream-700">{item.desc}</span>
                </div>
              </div>
              <ChevronRight size={16} className={isGift ? 'text-rose-400' : 'text-cream-600'} />
            </button>
          );
        })}
      </div>

      <div className="h-[calc(env(safe-area-inset-bottom,0px)+55px)]" />
    </div>
  );
}
