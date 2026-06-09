import { CardDecoration } from '../../components/CardDecoration';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, CheckCircle, Star, TrendingUp } from 'lucide-react';
import goldImg from '../../assets/gold.png';
import { getProfile, getLevelInfo, signIn } from '../../api/user';
import { useNavigate } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';
import { useStatusBarColor } from '../../hooks/useStatusBarColor';

export function CoinsPage() {
  useStatusBarColor('#0a0a0f');
  const navigate = useNavigate();
  const goBack = useSmartBack('/profile');
  const [coins, setCoins] = useState(0);
  const [levelData, setLevelData] = useState<any>(null);
  const [signing, setSigning] = useState(false);
  const [signedNow, setSignedNow] = useState(false);

  useEffect(() => {
    getProfile().then((res: any) => { if (res.code === 0) setCoins(res.data.coins ?? 0); }).catch(() => {});
    getLevelInfo().then((res: any) => { if (res.code === 0) setLevelData(res.data); }).catch(() => {});
  }, []);

  const alreadySigned = levelData?.signedToday || signedNow;

  const handleSignIn = async () => {
    if (signing || alreadySigned) return;
    setSigning(true);
    try {
      const res: any = await signIn();
      if (res.code === 0) {
        setSignedNow(true);
        setCoins(res.data.coins ?? coins + 1);
        setLevelData((prev: any) => prev ? { ...prev, signedToday: true, exp: res.data.exp, level: res.data.level } : prev);
      }
    } catch { /* ignore */ }
    setSigning(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(175deg, #0a0a0f 0%, #12100a 50%, #1a1200 100%)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-72 opacity-25"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(251,191,36,0.5) 0%, rgba(245,158,11,0.2) 50%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3">
        <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
          <ChevronLeft size={22} className="text-amber-200" />
        </button>
        <h1 className="font-display text-lg font-semibold text-amber-100 flex-1">我的金币</h1>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-8 relative z-10">
        {/* 金箔余额卡 */}
        <div className="relative rounded-3xl overflow-hidden mb-5"
          style={{
            background: 'linear-gradient(160deg, #1a1400 0%, #0f0a00 100%)',
            border: '1px solid rgba(251,191,36,0.15)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}>
          <CardDecoration pattern="circles" color="#f59e0b" />
          <div className="relative z-10 p-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-semibold tracking-[3px] text-amber-500/30">BALANCE</span>
              {levelData && (
                <span className="text-[11px] font-medium text-amber-500/25">LV.{levelData.level}</span>
              )}
            </div>

            <div className="flex items-baseline gap-2 mb-5">
              <span className="text-[52px] font-black leading-none"
                style={{ background: 'linear-gradient(180deg, #fef3c7 0%, #fbbf24 60%, #d97706 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {coins}
              </span>
              <span className="text-[13px] text-amber-500/40">金币</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                <span className={`text-[10px] ${alreadySigned ? 'text-emerald-500/50' : 'text-amber-500/25'}`}>
                  {alreadySigned ? '今日已签到' : '今日未签到'}
                </span>
              </div>
              <span className="text-[10px] text-amber-500/15">累计 {coins} · 支出 0</span>
            </div>
          </div>
        </div>

        {/* 获取金币标题 */}
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.2))' }} />
          <span className="text-[10px] font-semibold tracking-[2px] text-amber-500/30">获取金币</span>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(251,191,36,0.2), transparent)' }} />
        </div>

        {/* 每日签到卡片 */}
        <motion.button
          onClick={handleSignIn}
          disabled={alreadySigned || signing}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl mb-3 transition-all ${
            alreadySigned ? 'cursor-default' : 'active:scale-[0.99]'
          }`}
          style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(245,158,11,0.04))',
            border: '1px solid rgba(251,191,36,0.1)',
          }}
          whileTap={alreadySigned ? undefined : { scale: 0.99 }}
        >
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.1))', border: '1px solid rgba(251,191,36,0.2)' }}>
            <Star size={20} className="text-amber-300" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <span className="text-[13px] font-semibold text-amber-100 block leading-tight">每日签到</span>
            <span className="text-[10px] text-amber-500/35 block mt-0.5">每天签到一次</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <img src={goldImg} alt="" className="w-4 h-4 object-contain" />
            <span className="text-[11px] font-bold text-amber-400/60">+1</span>
          </div>
          {alreadySigned ? (
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <CheckCircle size={12} />已签到
            </span>
          ) : (
            <span className="px-4 py-1.5 rounded-full text-[11px] font-bold"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#1a0f00', boxShadow: '0 4px 15px rgba(251,191,36,0.25)' }}>
              {signing ? '签到中...' : '签到'}
            </span>
          )}
        </motion.button>

        {/* 等级奖励卡片 */}
        <button
          onClick={() => navigate('/profile/level')}
          className="w-full flex items-center gap-4 p-4 rounded-2xl active:scale-[0.99] transition-transform"
          style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(245,158,11,0.04))',
            border: '1px solid rgba(251,191,36,0.1)',
          }}
        >
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.1))', border: '1px solid rgba(251,191,36,0.2)' }}>
            <TrendingUp size={20} className="text-amber-300" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <span className="text-[13px] font-semibold text-amber-100 block leading-tight">等级奖励</span>
            <span className="text-[10px] text-amber-500/35 block mt-0.5">每升1级自动获得金币</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 mr-2">
            <img src={goldImg} alt="" className="w-4 h-4 object-contain" />
            <span className="text-[11px] font-bold text-amber-400/60">+2/级</span>
          </div>
          <span className="text-sm text-amber-500/15">&#x203A;</span>
        </button>

        {/* 说明 */}
        <div className="mt-4 px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="text-[10px] leading-relaxed flex items-start gap-2" style={{ color: 'rgba(251,191,36,0.25)' }}>
            <img src={goldImg} alt="" className="w-3.5 h-3.5 object-contain flex-shrink-0 mt-[1px] opacity-40" />
            <span>
              签到每天获 1 金币 + 50 经验<br />
              每升 1 级自动获 2 金币<br />
              金币暂不支持充值或转让
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
