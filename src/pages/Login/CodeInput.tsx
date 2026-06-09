import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface CodeInputProps {
  value: string;
  onChange: (val: string) => void;
  hasError: boolean;
  disabled: boolean;
}

export function CodeInput({ value, onChange, hasError, disabled }: CodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const digits = value.split('').slice(0, 6);
  const filled = digits.length;
  const pct = (filled / 6) * 100;

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  useEffect(() => {
    if (filled >= 6) {
      inputRef.current?.blur();
    }
  }, [filled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
    onChange(raw);
  };

  const isEmpty = filled === 0 && !focused;

  return (
    <div
      className="w-full"
      onClick={() => { inputRef.current?.focus(); setFocused(true); }}
    >
      {/* 进度条 */}
      <div className="relative mb-4">
        <div
          className="h-1 rounded-full transition-colors duration-300"
          style={{ background: hasError ? 'rgba(239,68,68,0.15)' : '#f2ede6' }}
        />
        <motion.div
          className="absolute left-0 top-0 h-1 rounded-full"
          style={{
            background: hasError
              ? 'linear-gradient(90deg, #ef4444, #f87171)'
              : 'linear-gradient(90deg, #C8956C, #D4A574)',
          }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        />
        {/* 当前节点 — 圆心对齐填充末端 */}
        {filled < 6 && !hasError && (
          <motion.div
            className="absolute w-3 h-3 rounded-full"
            style={{
              top: '-4px',
              background: '#C8956C',
              boxShadow: '0 0 12px rgba(200,149,108,0.5)',
            }}
            animate={{
              left: `calc(${pct}% - 6px)`,
              scale: [1, 1.3, 1],
              opacity: [1, 0.6, 1],
            }}
            transition={{
              left: { type: 'spring', stiffness: 300, damping: 28 },
              scale: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
              opacity: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
            }}
          />
        )}
      </div>

      {/* 数字显示区 */}
      <div className="relative">
        {/* 空状态占位引导 */}
        {isEmpty && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-2xl pointer-events-none z-10"
            style={{
              background: 'rgba(248,245,240,0.6)',
              border: '1.5px dashed rgba(200,149,108,0.3)',
            }}
          >
            <span className="text-[13px] text-cream-400 tracking-wider">
              点击此处输入6位验证码
            </span>
          </div>
        )}

        {/* 6个数字位 */}
        <div className="flex justify-between items-end px-1">
          {Array.from({ length: 6 }).map((_, i) => {
            const ch = digits[i];
            const isFilled = !!ch;
            const isCurrent = i === filled && !hasError;

            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <motion.span
                  className="inline-flex items-center justify-center select-none"
                  style={{
                    width: '2.2rem',
                    height: '2.4rem',
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    color: hasError ? '#ef4444' : isFilled ? '#C8956C' : '#B5CCB5',
                  }}
                  animate={
                    isCurrent
                      ? { scale: [1, 1.08, 1], opacity: [0.5, 1, 0.5] }
                      : { scale: 1, opacity: 1 }
                  }
                  transition={
                    isCurrent
                      ? { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }
                      : {}
                  }
                >
                  {isFilled ? ch : '\u00B7'}
                </motion.span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 自动验证提示 */}
      {filled > 0 && filled < 6 && (
        <p className="text-center text-[11px] text-cream-400 mt-3">
          输入完毕后自动验证
        </p>
      )}

      {/* 隐藏输入框 */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        className="absolute opacity-0 pointer-events-none"
        style={{ left: 0, top: 0, width: '100%', height: '100%', fontSize: 16, caretColor: 'transparent' }}
        autoComplete="one-time-code"
      />
    </div>
  );
}
