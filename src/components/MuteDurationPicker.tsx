import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronLeft, Check } from 'lucide-react';

const PRESETS = [
  { label: '10 分钟', mins: 10 },
  { label: '30 分钟', mins: 30 },
  { label: '1 小时', mins: 60 },
  { label: '6 小时', mins: 360 },
  { label: '12 小时', mins: 720 },
  { label: '1 天', mins: 1440 },
  { label: '3 天', mins: 4320 },
  { label: '7 天', mins: 10080 },
  { label: '30 天', mins: 43200 },
  { label: '永久禁言', mins: 0 },
];

interface Props {
  onSelect: (minutes: number) => void;
  selected?: number | null;
}

function fmtCustom(h: number, m: number) {
  if (h === 0) return `${m} 分钟`;
  if (m === 0) return `${h} 小时`;
  return `${h} 小时 ${m} 分钟`;
}

export function MuteDurationPicker({ onSelect, selected }: Props) {
  const [showCustom, setShowCustom] = useState(false);
  const [customHours, setCustomHours] = useState(0);
  const [customMins, setCustomMins] = useState(30);
  const [customLabel, setCustomLabel] = useState('');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Clock size={15} className="text-amber-500" />
        <span className="text-[12px] font-semibold uppercase tracking-wide text-cream-500">选择禁言时长</span>
      </div>

      {/* 2-column grid of presets */}
      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map(p => {
          const isActive = selected === p.mins;
          return (
            <motion.button key={p.label}
              onClick={() => { onSelect(p.mins); setCustomLabel(''); }}
              className="py-3.5 rounded-2xl text-[13px] font-semibold transition-all text-center"
              style={{
                background: isActive ? 'rgba(245,158,11,0.12)' : 'rgba(0,0,0,0.03)',
                color: isActive ? '#d97706' : '#a09080',
                boxShadow: isActive ? 'inset 0 0 0 1.5px rgba(245,158,11,0.3)' : 'none',
              }}
              whileTap={{ scale: 0.97 }}
            >
              {p.label}
            </motion.button>
          );
        })}
      </div>

      {/* Custom duration button */}
      <button onClick={() => setShowCustom(true)}
        className="w-full py-3.5 rounded-2xl text-[13px] font-semibold transition-all text-center"
        style={{
          background: customLabel ? 'rgba(245,158,11,0.12)' : 'rgba(0,0,0,0.03)',
          color: customLabel ? '#d97706' : '#a09080',
          boxShadow: customLabel ? 'inset 0 0 0 1.5px rgba(245,158,11,0.3)' : 'none',
        }}>
        {customLabel || '自定义时长'}
      </button>

      {/* Custom duration sub-page */}
      <AnimatePresence>
        {showCustom && (
          <motion.div className="fixed inset-0 z-[360] flex flex-col" style={{ background: '#f5f0eb' }}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
            <div className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3"
              style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)' }}>
              <button onClick={() => setShowCustom(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-200">
                <ChevronLeft size={22} className="text-cream-800" /></button>
              <span className="font-display text-lg font-semibold text-cream-900 flex-1">自定义时长</span>
              <button onClick={() => {
                const totalMins = customHours * 60 + customMins;
                const mins = totalMins > 0 ? totalMins : 1;
                onSelect(mins);
                setCustomLabel(fmtCustom(customHours, customMins));
                setShowCustom(false);
              }}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(212,165,116,0.15)' }}>
                <Check size={18} style={{ color: '#d4a574' }} /></button>
            </div>

            {/* Scroller */}
            <div className="flex-1 flex items-center justify-center gap-0">
              <div className="flex items-end gap-2">
                {/* Hours */}
                <div className="flex flex-col items-center">
                  <div className="h-40 overflow-y-auto scrollbar-hide py-16" style={{ scrollSnapType: 'y mandatory' }}>
                    {Array.from({ length: 24 }, (_, i) => (
                      <button key={i} onClick={() => setCustomHours(i)}
                        className="block w-16 text-center py-2.5 transition-all"
                        style={{
                          fontSize: i === customHours ? 28 : 16,
                          fontWeight: i === customHours ? 800 : 400,
                          color: i === customHours ? '#d4a574' : '#c0b0a0',
                          scrollSnapAlign: 'center',
                        }}>
                        {String(i).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-cream-500 mt-2 font-medium">小时</span>
                </div>

                <span className="text-2xl font-light text-cream-300 mb-6">:</span>

                {/* Minutes */}
                <div className="flex flex-col items-center">
                  <div className="h-40 overflow-y-auto scrollbar-hide py-16" style={{ scrollSnapType: 'y mandatory' }}>
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(n => (
                      <button key={n} onClick={() => setCustomMins(n)}
                        className="block w-16 text-center py-2.5 transition-all"
                        style={{
                          fontSize: n === customMins ? 28 : 16,
                          fontWeight: n === customMins ? 800 : 400,
                          color: n === customMins ? '#d4a574' : '#c0b0a0',
                          scrollSnapAlign: 'center',
                        }}>
                        {String(n).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-cream-500 mt-2 font-medium">分钟</span>
                </div>
              </div>
            </div>

            <div className="text-center pb-8">
              <p className="text-[13px] text-cream-500">
                共计 <span className="font-bold text-cream-800">{customHours * 60 + customMins}</span> 分钟
                {customHours > 0 && <span className="text-cream-400">（{customHours}小时{customMins > 0 ? ` ${customMins}分钟` : ''}）</span>}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MuteDurationPicker;
