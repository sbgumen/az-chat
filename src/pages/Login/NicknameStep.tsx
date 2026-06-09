import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight } from 'lucide-react';

interface NicknameStepProps {
  phone: string;
  type?: 'phone' | 'email';
  onSubmit: (nickname: string) => Promise<void>;
  onBack: () => void;
  loading: boolean;
}

function maskEmail(e: string) { const at = e.indexOf('@'); return e.slice(0, 3) + '***' + e.slice(at - 2); }
function maskPhone(p: string) { return p.slice(0, 3) + '****' + p.slice(-4); }

export function NicknameStep({ phone, type = 'phone', onSubmit, onBack, loading }: NicknameStepProps) {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) { setError('请输入昵称'); return; }
    if (trimmed.length > 20) { setError('昵称最多20个字符'); return; }
    setError('');
    try {
      await onSubmit(trimmed);
    } catch {
      setError('注册失败，请重试');
    }
  };

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* 标题 */}
      <div className="text-center">
        <p className="text-[11px] text-cream-500 tracking-widest">WELCOME</p>
        <p className="text-lg font-semibold text-cream-900 mt-1 font-display">设置你的昵称</p>
        <p className="text-[12px] text-cream-500 mt-1.5">
          {type === 'email' ? `邮箱 ${maskEmail(phone)} 注册` : `手机号 ${maskPhone(phone)} 注册`}
        </p>
      </div>

      {/* 昵称输入 */}
      <div>
        <div
          className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200"
          style={{
            background: 'rgba(248,245,240,0.9)',
            boxShadow: '0 2px 10px rgba(45,32,22,0.04)',
          }}
        >
          <input
            type="text"
            maxLength={20}
            placeholder="取一个好听的名字吧"
            value={nickname}
            onChange={e => { setNickname(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
            className="flex-1 bg-transparent text-sm text-cream-900 placeholder:text-cream-400 outline-none"
            style={{ border: 'none' }}
          />
        </div>
        {error && (
          <motion.p
            className="text-[12px] text-red-500 mt-1.5 pl-2"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}
      </div>

      {/* 按钮 */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex items-center justify-center w-11 h-11 rounded-2xl flex-shrink-0 transition-all active:scale-95 disabled:opacity-50"
          style={{ background: 'rgba(242,237,230,0.9)', color: '#9C8B7D' }}
        >
          <ArrowRight size={18} className="rotate-180" />
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !nickname.trim()}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white text-[15px] font-medium transition-all active:scale-[0.98] disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #C8956C 0%, #D4A574 100%)',
            boxShadow: '0 4px 20px rgba(200,149,108,0.35)',
          }}
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? '注册中...' : '完成注册'}
        </button>
      </div>
    </motion.div>
  );
}
