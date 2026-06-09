import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, MessageCircle, Smartphone, Mail, Copy, Check } from 'lucide-react';
import { useSmartBack } from '../../hooks/useSmartBack';

const contacts = [
  { icon: MessageCircle, label: '微信', value: 'BYAZLZX', color: '#07c160', action: 'wechat' },
  { icon: Smartphone, label: '电话', value: '18977282572', color: '#3b82f6', action: 'phone' },
  { icon: Mail, label: '邮箱', value: '2585579144@qq.com', color: '#ef4444', action: 'email' },
];

export function ContactPage() {
  const goBack = useSmartBack('/profile/settings');
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback for mobile
      const ta = document.createElement('textarea');
      ta.value = value; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-[220] flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #faf7f2 0%, #f5f0eb 100%)' }}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}>

      <div className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)' }}>
        <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-200">
          <ChevronLeft size={22} className="text-cream-800" /></button>
        <h1 className="font-display text-lg font-semibold text-cream-900">联系我们</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(212,165,116,0.12)' }}>
            <MessageCircle size={28} style={{ color: '#d4a574' }} /></div>
          <h2 className="font-display text-lg font-bold text-cream-900 mb-2">需要帮助？</h2>
          <p className="text-[14px] text-cream-500 leading-relaxed max-w-xs mx-auto">
            我们随时为您提供支持，请通过以下方式联系我们
          </p>
        </div>

        {/* Contact cards */}
        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          {contacts.map((c, i) => {
            const Icon = c.icon;
            const isCopied = copied === c.label;
            return (
              <motion.button key={i}
                className="rounded-2xl p-4 flex items-center gap-4 text-left transition-all hover:scale-[1.02] active:scale-100"
                style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => copyToClipboard(c.value, c.label)}
              >
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${c.color}15` }}>
                  <Icon size={20} style={{ color: c.color }} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-cream-500 mb-0.5">{c.label}</p>
                  <p className="text-[14px] font-semibold text-cream-900 truncate">{c.value}</p>
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: isCopied ? 'rgba(34,197,94,0.1)' : 'rgba(0,0,0,0.04)' }}>
                  {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-cream-400" />}
                </div>
              </motion.button>
            );
          })}
        </div>

        <p className="text-center text-[12px] text-cream-400 mt-6 mb-8">
          工作日 9:00 - 18:00 在线，通常 2 小时内回复
        </p>
      </div>
    </motion.div>
  );
}

export default ContactPage;
