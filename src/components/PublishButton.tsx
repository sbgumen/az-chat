import { motion } from 'framer-motion';
import { PenLine } from 'lucide-react';

interface PublishButtonProps {
  onClick: () => void;
}

export function PublishButton({ onClick }: PublishButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed z-40"
      style={{
        right: '14px',
        bottom: 'calc(68px + env(safe-area-inset-bottom, 0px) + 14px)',
      }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.3 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.9 }}
      aria-label="发布动态"
    >
      {/* 外层旋转光环 */}
      <div
        style={{
          position: 'absolute',
          inset: '-3px',
          borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: 'rgba(255,107,107,0.3)',
          borderRightColor: 'rgba(255,179,71,0.2)',
          animation: 'publish-ring-spin 3s linear infinite',
        }}
      />

      {/* 第二层光环（反向旋转） */}
      <div
        style={{
          position: 'absolute',
          inset: '-6px',
          borderRadius: '50%',
          border: '1.5px solid transparent',
          borderBottomColor: 'rgba(255,107,107,0.2)',
          borderLeftColor: 'rgba(255,179,71,0.15)',
          animation: 'publish-ring-spin 4s linear infinite reverse',
        }}
      />

      {/* 内按钮 */}
      <div
        style={{
          position: 'relative',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FF6B6B 0%, #FFB347 100%)',
          boxShadow: '0 6px 24px rgba(255,107,107,0.35), 0 2px 8px rgba(255,107,107,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* 内部光泽 */}
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: '8px',
            right: '8px',
            height: '16px',
            borderRadius: '50%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
          }}
        />
        <PenLine size={22} color="#fff" strokeWidth={2.2} style={{ position: 'relative', zIndex: 1 }} />
      </div>

      <style>{`
        @keyframes publish-ring-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </motion.button>
  );
}
