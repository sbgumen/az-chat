import { RemoteImage } from '../../components/RemoteImage';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Star, Moon, Sun, Crown, MessageCircle, UserPlus, CheckCircle, Trophy, Users, Sparkles, Zap, Heart, Palette, Image } from 'lucide-react';
import { getLevelInfo, getLevelRanking, getLevelRankingGlobal, getPopularRanking, getPopularRankingGlobal, signIn, getUserLevelRules } from '../../api/user';
import { useSearchParams } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';
import { useStatusBarColor } from '../../hooks/useStatusBarColor';
import { calcStarDisplay } from '../../utils/levelStars';

interface LevelData {
  level: number;
  exp: number;
  nextLevelExp: number;
  signedToday: boolean;
  msgTodayCnt: number;
  cfg: { exp_signin: number; exp_message: number; exp_add_friend: number; exp_message_daily_limit: number };
}

const TIER_META = [
  { Icon: Star, label: '星', text: 'text-amber-500', fill: '#f59e0b', light: 'bg-amber-50', border: 'border-amber-200' },
  { Icon: Moon, label: '月', text: 'text-indigo-500', fill: '#6366f1', light: 'bg-indigo-50', border: 'border-indigo-200' },
  { Icon: Sun, label: '日', text: 'text-orange-500', fill: '#f97316', light: 'bg-orange-50', border: 'border-orange-200' },
  { Icon: Crown, label: '冠', text: 'text-yellow-600', fill: '#ca8a04', light: 'bg-yellow-50', border: 'border-yellow-300' },
];

function StarRow({ count, tier, doAnim }: { count: number; tier: number; doAnim?: boolean }) {
  const { Icon, label, text, fill, light, border } = TIER_META[tier];
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-[10px] font-semibold ${text} uppercase tracking-wider w-8`}>{label}</span>
      <div className="flex gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            className={`w-8 h-8 rounded-lg flex items-center justify-center border ${i < count ? `${light} ${border}` : 'bg-cream-100 border-cream-200'}`}
            initial={doAnim ? { scale: 0, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 + tier * 0.15 + i * 0.08, type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Icon size={16} fill={i < count ? fill : 'none'} className={i < count ? text : 'text-cream-300'} />
          </motion.div>
        ))}
      </div>
      {count === 3 && (
        <motion.div
          className="ml-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 + tier * 0.1, type: 'spring' }}
        >
          合成!
        </motion.div>
      )}
    </div>
  );
}

const PERKS = [
  { lv: 10, Icon: Sparkles, title: '彩虹名字', desc: '昵称变为彩色流光效果，全平台同步展示', color: 'text-pink-500 bg-pink-50 border-pink-200' },
  { lv: 20, Icon: Palette, title: '鎏金暖阳风格', desc: '解锁主页风格：鎏金暖阳', color: 'text-amber-500 bg-amber-50 border-amber-200' },
  { lv: 25, Icon: Palette, title: '樱吹雪风格', desc: '解锁主页风格：樱吹雪', color: 'text-pink-500 bg-pink-50 border-pink-200' },
  { lv: 30, Icon: Zap, title: '三风格解锁', desc: '解锁水晶棱镜、极光幻境、暗夜霓虹风格', color: 'text-purple-500 bg-purple-50 border-purple-200' },
  { lv: 40, Icon: Trophy, title: '超级置顶', desc: '消息列表永久置顶特权（即将开放）', color: 'text-amber-500 bg-amber-50 border-amber-200' },
];

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getAvatar = (a: string) => a?.startsWith('http') ? a : `${apiBase}${a}`;

function RankingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const resize = () => {
      c.width = c.offsetWidth * devicePixelRatio;
      c.height = c.offsetHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      draw();
    };
    const draw = () => {
      const w = c.offsetWidth, h = c.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      // ── 顶部光环弧线 ──
      ctx.strokeStyle = 'rgba(255,215,0,0.10)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.38, w * 0.45, Math.PI * 0.7, Math.PI * 0.3, true);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255,215,0,0.06)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.38, w * 0.52, Math.PI * 0.65, Math.PI * 0.35, true);
      ctx.stroke();

      // ── 左右对称装饰线 ──
      const lx = w * 0.06, rx = w * 0.94;
      ctx.strokeStyle = 'rgba(255,215,0,0.08)';
      ctx.lineWidth = 0.6;
      [lx, rx].forEach(x => {
        ctx.beginPath();
        ctx.moveTo(x, h * 0.25);
        ctx.lineTo(x, h * 0.18);
        ctx.moveTo(x, h * 0.25);
        ctx.lineTo(x, h * 0.50);
        ctx.stroke();
        // 端点圆
        ctx.beginPath(); ctx.arc(x, h * 0.18, 1.5, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,215,0,0.12)'; ctx.fill();
        ctx.beginPath(); ctx.arc(x, h * 0.50, 1.5, 0, Math.PI * 2); ctx.fill();
      });

      // ── 底部贝塞尔曲线 ──
      ctx.strokeStyle = 'rgba(255,215,0,0.07)';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.78);
      ctx.bezierCurveTo(w * 0.3, h * 0.72, w * 0.7, h * 0.84, w * 0.9, h * 0.78);
      ctx.stroke();

      // ── 散落装饰点 ──
      const dots = [
        [0.15, 0.30], [0.85, 0.30], [0.25, 0.62], [0.75, 0.62],
        [0.10, 0.72], [0.90, 0.72], [0.40, 0.85], [0.60, 0.85],
      ];
      dots.forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.arc(w * dx, h * dy, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,215,0,0.10)';
        ctx.fill();
      });

      // ── 领奖台上方十字星 ──
      const cx = w / 2, cy = h * 0.04;
      const drawStar = (px: number, py: number, s: number, a: number) => {
        ctx.save(); ctx.translate(px, py); ctx.globalAlpha = a;
        ctx.fillStyle = '#FFD700'; ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2;
          const lx1 = Math.cos(angle) * s, ly1 = Math.sin(angle) * s;
          const lx2 = Math.cos(angle + 0.3) * s * 1.5, ly2 = Math.sin(angle + 0.3) * s * 1.5;
          ctx.moveTo(0, 0); ctx.lineTo(lx1, ly1);
          ctx.moveTo(0, 0); ctx.lineTo(lx2, ly2);
        }
        ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      };
      drawStar(cx, cy, 8, 0.15);
    };
    resize(); window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }} />;
}

export function LevelPage() {
  const goBack = useSmartBack('/profile');
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<LevelData | null>(null);
  const [signing, setSigning] = useState(false);
  const [signedNow, setSignedNow] = useState(false);
  const [tab, setTab] = useState<'main' | 'ranking'>(searchParams.get('tab') === 'ranking' ? 'ranking' : 'main');
  const [ranking, setRanking] = useState<{ list: any[]; me: any } | null>(null);
  const [rankingGlobal, setRankingGlobal] = useState<{ list: any[]; me: any } | null>(null);
  const [popular, setPopular] = useState<{ list: any[]; me: any } | null>(null);
  const [popularGlobal, setPopularGlobal] = useState<{ list: any[]; me: any } | null>(null);
  useStatusBarColor(tab === 'ranking' ? '#0f0f14' : '#FDFBF7');
  const [rankingTab, setRankingTab] = useState<'level' | 'popular'>('level');
  const [rankingScope, setRankingScope] = useState<'friend' | 'global'>('friend');
  const [loadingRank, setLoadingRank] = useState(false);

  const [expEnabled, setExpEnabled] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getLevelInfo().then((res: any) => {
      if (res.code === 0) setData(res.data);
    }).catch(() => {});
    getUserLevelRules().then((res: any) => {
      if (res.code === 0 && res.data?.exp_config) {
        const en: Record<string, boolean> = {};
        Object.entries(res.data.exp_config).forEach(([k, v]) => {
          if (k.endsWith('_enabled')) en[k.replace('_enabled', '')] = v === 1;
        });
        setExpEnabled(en);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab !== 'ranking') return;
    const isFriend = rankingScope === 'friend';
    if (rankingTab === 'level') {
      const key = isFriend ? ranking : rankingGlobal;
      if (!key) {
        setLoadingRank(true);
        const fn = isFriend ? getLevelRanking : getLevelRankingGlobal;
        const setter = isFriend ? setRanking : setRankingGlobal;
        fn().then((res: any) => {
          if (res.code === 0) setter({ list: res.data, me: res.me });
        }).catch(() => {}).finally(() => setLoadingRank(false));
      }
    } else {
      const key = isFriend ? popular : popularGlobal;
      if (!key) {
        setLoadingRank(true);
        const fn = isFriend ? getPopularRanking : getPopularRankingGlobal;
        const setter = isFriend ? setPopular : setPopularGlobal;
        fn().then((res: any) => {
          if (res.code === 0) setter({ list: res.data, me: res.me });
        }).catch(() => {}).finally(() => setLoadingRank(false));
      }
    }
  }, [tab, rankingTab, rankingScope]);

  const handleSignIn = async () => {
    if (signing || data?.signedToday || signedNow) return;
    setSigning(true);
    try {
      const res: any = await signIn();
      if (res.code === 0) {
        setSignedNow(true);
        setData(prev => prev ? { ...prev, exp: res.data.exp, level: res.data.level, signedToday: true } : prev);
      }
    } catch { /* ignore */ }
    setSigning(false);
  };

  const level = data?.level ?? 1;
  const exp = data?.exp ?? 0;
  const progress = Math.min((exp % 100) / 100, 1);
  const alreadySigned = data?.signedToday || signedNow;
  const { crowns, suns, moons, stars } = calcStarDisplay(level);
  const cfg = data?.cfg ?? { exp_signin: 50, exp_message: 2, exp_add_friend: 30, exp_message_daily_limit: 50 };
  const msgTodayCnt = data?.msgTodayCnt ?? 0;
  const msgDone = msgTodayCnt >= cfg.exp_message_daily_limit;

  const cardGradient = level >= 27
    ? 'linear-gradient(135deg, #f59e0b 0%, #ef4444 30%, #8b5cf6 60%, #3b82f6 100%)'
    : level >= 18
    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #a855f7 70%, #7c3aed 100%)'
    : level >= 9
    ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 40%, #7c3aed 70%, #5b21b6 100%)'
    : 'linear-gradient(135deg, #c8956c 0%, #e8b89a 40%, #d4956a 70%, #b87040 100%)';

  const enabled = (k: string) => expEnabled[k] !== false; // 未定义视为启用（兼容）
  const allTasks = [
    { key: 'exp_signin', Icon: Star, label: '每日签到', desc: '每天签到一次', reward: `+${cfg.exp_signin}经验`, done: alreadySigned, action: handleSignIn, btnLabel: alreadySigned ? '已签到' : signing ? '签到中...' : '签到', hasAction: true, progress: null as null | { cur: number; max: number } },
    { key: 'exp_message', Icon: MessageCircle, label: '发送消息', desc: `每条+${cfg.exp_message}经验，每天上限${cfg.exp_message_daily_limit}条`, reward: `+${cfg.exp_message}经验/条`, done: msgDone, action: undefined, btnLabel: msgDone ? '已达上限' : '去聊天', hasAction: false, progress: { cur: msgTodayCnt, max: cfg.exp_message_daily_limit } },
    { key: 'exp_moment', Icon: Image, label: '发动态', desc: '发布一条动态', reward: `+${(cfg as any).exp_moment || 5}经验`, done: false, action: undefined, btnLabel: '去发布', hasAction: false, progress: null },
    { key: 'exp_comment', Icon: MessageCircle, label: '发评论', desc: '评论他人动态', reward: `+${(cfg as any).exp_comment || 3}经验`, done: false, action: undefined, btnLabel: '去看看', hasAction: false, progress: null },
    { key: 'exp_follow', Icon: UserPlus, label: '关注他人', desc: '关注一位新朋友', reward: `+${(cfg as any).exp_follow || 3}经验`, done: false, action: undefined, btnLabel: '去关注', hasAction: false, progress: null },
    { key: 'exp_add_friend', Icon: UserPlus, label: '添加好友', desc: '通过好友申请双方各得', reward: `+${cfg.exp_add_friend || 5}经验`, done: false, action: undefined, btnLabel: '去添加', hasAction: false, progress: null },
  ];
  const tasks = allTasks.filter(t => enabled(t.key));

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col bg-cream-100"
      
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 border-b flex-shrink-0"
        style={{
          background: tab === 'ranking' ? 'rgba(15,15,20,0.95)' : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
          borderColor: tab === 'ranking' ? 'rgba(255,255,255,0.06)' : '#f0e6d8',
        }}>
        <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
          style={{ background: tab === 'ranking' ? 'rgba(255,255,255,0.06)' : undefined }}>
          <ChevronLeft size={22} style={{ color: tab === 'ranking' ? '#999' : '#5c4330' }} />
        </button>
        <h1 className="text-lg font-semibold flex-1" style={{ color: tab === 'ranking' ? '#e0e0e0' : '#3d2b1a' }}>我的等级</h1>
        <div className="flex rounded-full p-0.5"
          style={{ background: tab === 'ranking' ? 'rgba(255,255,255,0.08)' : '#f0e6d8' }}>
          <button onClick={() => setTab('main')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              tab === 'main' ? 'bg-white text-gray-900 shadow-sm' : ''
            }`}
            style={tab === 'main' ? {} : { color: tab === 'ranking' ? '#777' : '#8b7355' }}>
            等级
          </button>
          <button onClick={() => setTab('ranking')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
              tab === 'ranking' ? 'bg-white text-gray-900 shadow-sm' : ''
            }`}
            style={tab === 'ranking' ? undefined : { color: '#8b7355' }}>
            <Trophy size={11} />排名
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-5 flex flex-col gap-4"
        style={{ background: tab === 'ranking' ? '#0f0f14' : '#FFFBFA' }}>
        <AnimatePresence mode="wait">
          {tab === 'main' ? (
            <motion.div key="main" className="flex flex-col gap-4"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Level card */}
              <motion.div
                className="relative rounded-3xl overflow-hidden p-6"
                style={level >= 27 ? {
                  background: 'rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
                } : { background: cardGradient }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* LV27+ 极光背景 */}
                {level >= 27 && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg,#0d0d1a 0%,#120820 50%,#0a0d1f 100%)' }} />
                    <div className="absolute -top-10 -left-6 w-[80%] h-32 opacity-50"
                      style={{ background: 'radial-gradient(ellipse 60% 50% at 40% 50%, rgba(255,107,0,0.55) 0%, rgba(255,45,120,0.3) 50%, transparent 70%)', filter: 'blur(24px)', animation: 'lvCardA1 6s ease-in-out infinite' }} />
                    <div className="absolute -bottom-6 right-0 w-[60%] h-24 opacity-40"
                      style={{ background: 'radial-gradient(ellipse 65% 50% at 60% 50%, rgba(192,38,211,0.5) 0%, rgba(124,58,237,0.3) 60%, transparent 70%)', filter: 'blur(20px)', animation: 'lvCardA2 8s ease-in-out infinite' }} />
                    <style>{`
                      @keyframes lvCardA1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(18px,-10px)} }
                      @keyframes lvCardA2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-14px,8px)} }
                    `}</style>
                  </div>
                )}
                {level < 27 && (
                  <>
                    <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-black/10 blur-2xl pointer-events-none" />
                  </>
                )}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
                />
                <div className="relative z-10">
                  <p className="text-white/70 text-[11px] font-medium uppercase tracking-widest mb-1">当前等级</p>
                  <motion.h2
                    className="font-display text-6xl font-black text-white mb-2 drop-shadow-lg"
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    LV{level}
                  </motion.h2>

                  {/* Star icons row — QQ 四级体系 */}
                  <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                    {crowns > 0 && Array.from({ length: crowns }).map((_, i) => (
                      <Crown key={`c${i}`} size={22} fill="#fbbf24" className="text-yellow-300 drop-shadow" />
                    ))}
                    {suns > 0 && Array.from({ length: suns }).map((_, i) => (
                      <Sun key={`su${i}`} size={20} fill="#f97316" className="text-orange-300 drop-shadow" />
                    ))}
                    {moons > 0 && Array.from({ length: moons }).map((_, i) => (
                      <Moon key={`m${i}`} size={22} fill="#a5b4fc" className="text-indigo-200 drop-shadow" />
                    ))}
                    {stars > 0 && Array.from({ length: stars }).map((_, i) => (
                      <Star key={`s${i}`} size={22} fill="#fde68a" className="text-yellow-200 drop-shadow" />
                    ))}
                    {level === 1 && <span className="text-white/50 text-sm">暂无星级</span>}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-white/80 text-[11px]">升级进度</span>
                      <span className="text-white text-[11px] font-semibold">{exp % 100} / 100 经验</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-black/20 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-white/90 shadow-sm"
                        initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }}
                        transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                    <p className="text-white/60 text-[11px] mt-1">还需 {100 - (exp % 100)} 经验升级 · 总经验 {exp}</p>
                  </div>
                </div>
              </motion.div>

              {/* Star breakdown */}
              <motion.div className="bg-white rounded-2xl border border-cream-200/60 shadow-soft px-4 py-4"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.35 }}>
                <p className="text-[12px] font-semibold text-cream-700 mb-3">星级图谱 (QQ体系)</p>
                <div className="flex flex-col gap-2.5">
                  <StarRow count={crowns} tier={3} doAnim />
                  <StarRow count={suns} tier={2} doAnim />
                  <StarRow count={moons} tier={1} doAnim />
                  <StarRow count={stars} tier={0} doAnim />
                  {crowns === 0 && suns === 0 && moons === 0 && stars === 0 && (
                    <p className="text-[12px] text-cream-500 text-center py-2">升到2级获得第一颗星星</p>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-cream-100 flex items-center gap-2 text-[11px] text-cream-500">
                  <Star size={10} fill="#f59e0b" className="text-amber-500" />3 → <Moon size={10} fill="#6366f1" className="text-indigo-500" /> 1
                  <span className="mx-1">·</span>
                  <Moon size={10} fill="#6366f1" className="text-indigo-500" />3 → <Sun size={10} fill="#f97316" className="text-orange-500" /> 1
                  <span className="mx-1">·</span>
                  <Sun size={10} fill="#f97316" className="text-orange-500" />3 → <Crown size={10} fill="#ca8a04" className="text-yellow-600" /> 1
                </div>
              </motion.div>

              {/* Tasks */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.35 }}>
                <h3 className="text-[12px] font-semibold text-cream-700 uppercase tracking-wider px-1 mb-2">获取经验</h3>
                <div className="bg-white rounded-2xl border border-cream-200/60 shadow-soft">
                  {tasks.map((task, i) => {
                    const Icon = task.Icon;
                    return (
                      <motion.div key={task.label}
                        className={`flex items-center px-4 py-3.5 gap-3 ${i < tasks.length - 1 ? 'border-b border-cream-100' : ''}`}
                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + i * 0.06 }}
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warm-100 to-warm-200 border border-warm-200/60 flex items-center justify-center text-warm-600 shrink-0">
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-cream-900">{task.label}</span>
                            <span className="text-[11px] font-semibold text-warm-600 bg-warm-50 border border-warm-200/60 px-1.5 py-0.5 rounded-full">{task.reward}</span>
                          </div>
                          <span className="text-[11px] text-cream-600">{task.desc}</span>
                          {task.progress && (
                            <div className="mt-1.5">
                              <div className="h-1.5 rounded-full bg-cream-200 overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full bg-warm-400"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(task.progress.cur / task.progress.max, 1) * 100}%` }}
                                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                />
                              </div>
                              <span className="text-[10px] text-cream-500 mt-0.5 block">{task.progress.cur} / {task.progress.max} 条</span>
                            </div>
                          )}
                        </div>
                        {task.hasAction ? (
                          <button onClick={task.action} disabled={task.done || signing}
                            className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all ${task.done ? 'bg-cream-100 text-cream-500 border border-cream-200 cursor-default' : 'bg-warm-500 text-white hover:bg-warm-600 shadow-sm'}`}>
                            {task.done ? <span className="flex items-center gap-1"><CheckCircle size={12} />{task.btnLabel}</span> : task.btnLabel}
                          </button>
                        ) : (
                          <span className="shrink-0 text-[12px] text-cream-500 border border-cream-200 px-3 py-1.5 rounded-full">{task.btnLabel}</span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Perks */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.35 }}>
                <h3 className="text-[12px] font-semibold text-cream-700 uppercase tracking-wider px-1 mb-2">等级权益</h3>
                <div className="bg-white rounded-2xl border border-cream-200/60 shadow-soft overflow-hidden">
                  {PERKS.map((perk, i) => {
                    const unlocked = level >= perk.lv;
                    const [iconCls, bgCls, borderCls] = perk.color.split(' ');
                    return (
                      <div key={perk.lv} className={`flex items-center gap-3 px-4 py-3.5 ${i < PERKS.length - 1 ? 'border-b border-cream-100' : ''}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${unlocked ? `${bgCls} ${borderCls}` : 'bg-cream-100 border-cream-200'}`}>
                          <perk.Icon size={18} className={unlocked ? iconCls : 'text-cream-300'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${unlocked ? 'text-cream-900' : 'text-cream-500'}`}>{perk.title}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${unlocked ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-cream-100 text-cream-500 border border-cream-200'}`}>
                              {unlocked ? '已解锁' : `LV${perk.lv}`}
                            </span>
                          </div>
                          <span className="text-[11px] text-cream-500">{perk.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Guide */}
              <motion.div className="bg-white rounded-2xl border border-cream-200/60 shadow-soft px-4 py-4"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.35 }}>
                <p className="text-[12px] font-semibold text-cream-700 mb-2.5">等级说明</p>
                <div className="flex flex-col gap-1.5 text-[11px] text-cream-600">
                  <p>· 每100经验升1级，等级最低为1级</p>
                  <p>· 每升1级获得1颗⭐，3颗⭐合成1个🌙(3级)</p>
                  <p>· 3个🌙合成1个☀️(9级)，3个☀️合成1个👑(27级)</p>
                  <p>· 每升10级解锁一项专属权益</p>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div key="ranking" className="flex flex-col gap-3"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Tab: 等级榜 / 人气榜 */}
              <div className="flex bg-gray-800/60 rounded-xl p-1 backdrop-blur-sm border border-white/5">
                <button onClick={() => setRankingTab('level')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold transition-all ${
                    rankingTab === 'level' ? 'bg-amber-500 text-gray-900 shadow-lg shadow-amber-500/20' : 'text-gray-400'
                  }`}>
                  <Trophy size={13} className={rankingTab === 'level' ? '' : ''} />
                  等级榜
                </button>
                <button onClick={() => setRankingTab('popular')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold transition-all ${
                    rankingTab === 'popular' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-gray-400'
                  }`}>
                  <Heart size={13} />
                  人气榜
                </button>
              </div>

              {/* Sub tab: 好友 / 世界 */}
              <div className="flex gap-2 px-1">
                {(['friend', 'global'] as const).map(scope => (
                  <button key={scope} onClick={() => setRankingScope(scope)}
                    className={`text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all ${
                      rankingScope === scope
                        ? 'bg-white/10 text-white border border-white/10'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}>
                    {scope === 'friend' ? '好友' : '世界'}
                  </button>
                ))}
              </div>

              {loadingRank && (
                <div className="animate-pulse space-y-3">
                  <div className="flex items-end justify-center gap-3 h-[200px] pt-3">
                    <div className="w-[72px] h-[90px] rounded-t-2xl bg-white/5" />
                    <div className="w-[88px] h-[120px] rounded-t-2xl bg-white/10" />
                    <div className="w-[66px] h-[70px] rounded-t-2xl bg-white/5" />
                  </div>
                </div>
              )}

              {!loadingRank && (() => {
                const currentData =
                  rankingTab === 'level'
                    ? (rankingScope === 'friend' ? ranking : rankingGlobal)
                    : (rankingScope === 'friend' ? popular : popularGlobal);
                if (!currentData) return null;
                const me = currentData.me;
                const list = currentData.list || [];

                let mergedList = list;
                let myRank = -1;
                if (me) {
                  if (rankingTab === 'level') {
                    const insertIdx = list.findIndex((u: any) => u.level < me.level || (u.level === me.level && u.exp <= me.exp));
                    myRank = insertIdx === -1 ? list.length : insertIdx;
                  } else {
                    const insertIdx = list.findIndex((u: any) => (u.followers || 0) < (me.followers || 0));
                    myRank = insertIdx === -1 ? list.length : insertIdx;
                  }
                  mergedList = [...list.slice(0, myRank), { ...me, isMe: true }, ...list.slice(myRank)];
                }

                if (mergedList.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                      <Users size={36} className="mb-3 text-gray-600" />
                      <p className="text-sm">还没有好友，快去添加吧</p>
                    </div>
                  );
                }

                const top3 = mergedList.slice(0, 3);
                const rest = mergedList.slice(3);
                const getValue = (u: any) => rankingTab === 'level' ? `LV.${u.level || 1}` : `${u.followers || 0}粉丝`;

                const championTitle = rankingTab === 'level' ? '至尊王者' : '人气之星';
                const medals = [
                  { gradient: 'linear-gradient(180deg, #FFE566, #FFD700, #E6A800)', glow: '#FFD700', y: 120, size: 88, shape: 'shield' as const },
                  { gradient: 'linear-gradient(180deg, #E8E8E8, #C0C0C0, #909090)', glow: '#C0C0C0', y: 90, size: 76, shape: 'diamond' as const },
                  { gradient: 'linear-gradient(180deg, #E8B87A, #CD7F32, #A0652A)', glow: '#CD7F32', y: 66, size: 68, shape: 'circle' as const },
                ];
                const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd visual order

                return (
                  <>
                    {/* Podium Section */}
                    <div className="relative" style={{ minHeight: 260 }}>
                      <RankingCanvas />
                      {/* Background glow */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-20"
                        style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.3), transparent 70%)' }} />

                      {/* Podium */}
                      <div className="flex items-end justify-center gap-3 h-[220px] pt-4 relative z-10">
                        {podiumOrder.map(orderIdx => {
                          const medal = medals[orderIdx];
                          const u = top3[orderIdx] || null;
                          const rank = orderIdx + 1;
                          return (
                            <motion.div key={rank}
                              className="flex flex-col items-center justify-end"
                              style={{ width: medal.size }}
                              initial={{ y: 60, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.1 * rank, type: 'spring', stiffness: 200, damping: 18 }}
                            >
                              {/* Crown + Champion title for 1st */}
                              {rank === 1 && u && (
                                <>
                                  <motion.div
                                    animate={{ y: [0, -3, 0], rotate: [0, 3, 0, -3, 0] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                                  >
                                    <Crown size={18} fill="#FFD700" color="#FFD700"
                                      style={{ filter: 'drop-shadow(0 0 5px rgba(255,215,0,0.5))' }} />
                                  </motion.div>
                                  <span className="text-[8px] font-bold text-amber-300 mb-0.5"
                                    style={{ textShadow: '0 0 6px rgba(255,215,0,0.4)' }}>
                                    {championTitle}
                                  </span>
                                </>
                              )}

                              {/* Avatar with glow ring */}
                              {u ? (
                                <div className="relative mb-2">
                                  <div className="absolute inset-[-3px] rounded-full opacity-60"
                                    style={{ background: medal.gradient, filter: 'blur(6px)' }} />
                                  <RemoteImage src={getAvatar(u.avatar)} alt=""
                                    className="relative w-9 h-9 rounded-full border-2 border-white/20" />
                                  {u.isMe && (
                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] bg-amber-500 text-white px-1.5 rounded-full font-bold">我</span>
                                  )}
                                </div>
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-white/5 mb-2" />
                              )}

                              {/* Podium block */}
                              <motion.div
                                className="w-full rounded-t-xl flex flex-col items-center justify-end pb-2 relative overflow-hidden"
                                style={{
                                  height: medal.y,
                                  background: medal.gradient,
                                }}
                                initial={{ scaleY: 0, transformOrigin: 'bottom' }}
                                animate={{ scaleY: 1 }}
                                transition={{ delay: 0.15 * rank, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                              >
                                {/* Shimmer */}
                                <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                  animate={{ x: ['-100%', '200%'] }}
                                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }} />

                                {/* Medal badge — 三种专属形状 */}
                                <div className="relative mb-1" style={{ marginTop: -14 }}>
                                  {medal.shape === 'shield' ? (
                                    /* 第一名：盾形勋章 */
                                    <motion.div className="relative flex items-center justify-center font-black text-white"
                                      style={{
                                        width: 36, height: 42,
                                        background: medal.gradient,
                                        clipPath: 'polygon(50% 0%, 100% 20%, 100% 70%, 50% 100%, 0% 70%, 0% 20%)',
                                        fontSize: 13, filter: `drop-shadow(0 0 10px ${medal.glow})`,
                                      }}
                                      animate={{ filter: [`drop-shadow(0 0 6px ${medal.glow}60)`, `drop-shadow(0 0 16px ${medal.glow}90)`, `drop-shadow(0 0 6px ${medal.glow}60)`] }}
                                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
                                      {rank}
                                    </motion.div>
                                  ) : medal.shape === 'diamond' ? (
                                    /* 第二名：菱形勋章 */
                                    <motion.div className="relative flex items-center justify-center font-black text-white"
                                      style={{
                                        width: 34, height: 34,
                                        background: medal.gradient,
                                        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                                        fontSize: 13, filter: `drop-shadow(0 0 8px ${medal.glow}50)`,
                                      }}
                                      animate={{ filter: [`drop-shadow(0 0 4px ${medal.glow}40)`, `drop-shadow(0 0 14px ${medal.glow}80)`, `drop-shadow(0 0 4px ${medal.glow}40)`] }}
                                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                                      {rank}
                                    </motion.div>
                                  ) : (
                                    /* 第三名：圆形勋章 */
                                    <motion.div className="relative flex items-center justify-center font-black text-white"
                                      style={{
                                        width: 34, height: 34, borderRadius: '50%',
                                        background: medal.gradient,
                                        boxShadow: `0 0 12px ${medal.glow}50, 0 2px 6px rgba(0,0,0,0.3)`,
                                        fontSize: 13, border: '2px solid rgba(255,255,255,0.35)',
                                      }}
                                      animate={{ boxShadow: [`0 0 6px ${medal.glow}30`, `0 0 16px ${medal.glow}60`, `0 0 6px ${medal.glow}30`] }}
                                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
                                      <div className="absolute inset-1.5 rounded-full border border-white/20" />
                                      {rank}
                                    </motion.div>
                                  )}
                                </div>
                                {u && (
                                  <span className="text-[10px] font-bold text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                                    {getValue(u)}
                                  </span>
                                )}
                              </motion.div>

                              {rank === 2 && u && (
                                <span className="text-[8px] text-gray-400 font-medium mt-0.5">银盾骑士</span>
                              )}
                              {rank === 3 && u && (
                                <span className="text-[8px] text-orange-300/60 font-medium mt-0.5">铜星勇士</span>
                              )}
                              {/* Name */}
                              {u && (
                                <span className="text-[10px] font-semibold text-gray-300 mt-1 truncate w-full text-center">
                                  {u.nickname}
                                </span>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Rest of list */}
                    {rest.length > 0 && (
                      <div className="flex flex-col gap-1">
                        {rest.map((u: any, i: number) => {
                          const rank = i + 4;
                          const isMe = u.isMe;
                          return (
                            <motion.div key={`${u.id}-${i}`}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.06] transition-colors"
                              style={isMe ? { background: 'rgba(255,215,0,0.06)', borderColor: 'rgba(255,215,0,0.15)' } : {}}
                              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 + i * 0.04, duration: 0.3 }}
                            >
                              <span className="text-[12px] font-bold text-gray-500 w-6 text-center">#{rank}</span>
                              <RemoteImage src={getAvatar(u.avatar)} alt=""
                                className="w-8 h-8 rounded-full bg-gray-700 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-gray-200 truncate">
                                  {u.nickname}{isMe ? ' (我)' : ''}
                                </p>
                              </div>
                              <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                                isMe
                                  ? 'text-gray-900 bg-amber-400'
                                  : 'text-gray-400 bg-white/5'
                              }`}>
                                {getValue(u)}
                              </span>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
