import { motion } from 'framer-motion';
import { ChevronLeft, Zap, Shield, Users, Sparkles } from 'lucide-react';
import { useSmartBack } from '../../hooks/useSmartBack';

const highlights = [
  { icon: Zap, title: '极速通讯', desc: '实时消息推送，毫秒级送达，支持文字、图片、语音等多种消息类型' },
  { icon: Users, title: '群组社交', desc: '支持200人大群，群公告、@提及、管理员体系，沟通更高效' },
  { icon: Shield, title: '安全可靠', desc: 'JWT认证 + bcrypt密码加密 + HTTPS传输，全方位保护您的数据安全' },
  { icon: Sparkles, title: '等级特权', desc: '签到升级、发消息获得经验，解锁彩虹昵称、头像框等专属特权' },
];

export function AboutPage() {
  const goBack = useSmartBack('/profile/settings');

  return (
    <motion.div className="fixed inset-0 z-[220] flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #faf7f2 0%, #f5f0eb 100%)' }}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}>

      <div className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)' }}>
        <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-200">
          <ChevronLeft size={22} className="text-cream-800" /></button>
        <h1 className="font-display text-lg font-semibold text-cream-900">关于我们</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center px-5 pt-10 pb-6">
          {/* App icon */}
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #d4a574, #c4956a)' }}>
            <span className="text-white text-3xl font-extrabold font-display">AZ</span>
          </div>
          <h2 className="font-display text-xl font-bold text-cream-900 mb-1">{localStorage.getItem('az_sysname') || 'AZ-Chat'}</h2>
          <p className="text-cream-500 text-sm">即时通讯社交平台</p>
          <p className="text-cream-400 text-[12px] mt-1">Version 1.0.0</p>
        </div>

        {/* Highlights grid */}
        <div className="px-4 grid grid-cols-2 gap-3 mb-6">
          {highlights.map((h, i) => {
            const Icon = h.icon;
            return (
              <motion.div key={i} className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.7)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: 'rgba(212,165,116,0.12)' }}>
                  <Icon size={18} style={{ color: '#d4a574' }} /></div>
                <h3 className="text-[13px] font-bold text-cream-900 mb-1">{h.title}</h3>
                <p className="text-[11px] text-cream-600 leading-relaxed">{h.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Mission statement */}
        <div className="px-4 mb-8">
          <div className="rounded-2xl p-5 text-center"
            style={{ background: 'linear-gradient(135deg, rgba(212,165,116,0.08), rgba(139,92,246,0.04))' }}>
            <p className="text-[14px] text-cream-700 leading-relaxed">
              AZ-Chat 致力于打造一个温暖、安全的即时通讯空间，连接你我，传递真实。
            </p>
            <p className="text-[12px] text-cream-400 mt-3">
              2024 - 2026 AZ-Chat Team
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default AboutPage;
