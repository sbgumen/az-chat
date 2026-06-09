import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Plus, Sparkles } from 'lucide-react';
import { getActiveTopics } from '../api/moments';
import type { Topic } from '../types';

interface TopicPickerProps {
  selected: string[];
  onToggle: (topicName: string) => void;
}

// 预定义配色循环
const palettes = [
  { bg: '#FFF0E5', text: '#FF6B6B', glow: 'rgba(255,107,107,0.15)' },
  { bg: '#F3EFFF', text: '#A18CD1', glow: 'rgba(161,140,209,0.15)' },
  { bg: '#F0FFF4', text: '#4ECDC4', glow: 'rgba(78,205,196,0.15)' },
  { bg: '#FFF8F0', text: '#FFB347', glow: 'rgba(255,179,71,0.15)' },
  { bg: '#FFF5F5', text: '#E88989', glow: 'rgba(232,137,137,0.15)' },
  { bg: '#F0F6FF', text: '#6B9FFF', glow: 'rgba(107,159,255,0.15)' },
];

export function TopicPicker({ selected, onToggle }: TopicPickerProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [customCreating, setCustomCreating] = useState(false);

  useEffect(() => {
    getActiveTopics().then((res: any) => {
      if (res.code === 0) setTopics(res.data || []);
    }).catch(() => {});
  }, []);

  const handleToggle = (name: string) => {
    onToggle(name);
  };

  const handleCreateCustom = () => {
    const trimmed = searchText.trim();
    if (!trimmed) return;
    if (selected.includes(trimmed)) {
      setSearchText('');
      return;
    }
    setCustomCreating(true);
    // 微延迟给用户视觉反馈
    setTimeout(() => {
      onToggle(trimmed);
      setSearchText('');
      setCustomCreating(false);
    }, 150);
  };

  const filteredTopics = searchText.trim()
    ? topics.filter(t => t.name.includes(searchText.trim()))
    : topics;

  const showCreateButton = searchText.trim() &&
    !filteredTopics.some(t => t.name === searchText.trim()) &&
    !selected.includes(searchText.trim());

  // 已选话题用多彩展示
  const selectedDisplay = selected.map((name, i) => {
    const palette = palettes[i % palettes.length];
    return (
      <motion.button
        key={name}
        layout
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        onClick={() => handleToggle(name)}
        className="relative flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold active:scale-95 transition-transform overflow-hidden group"
        style={{ color: '#fff' }}
      >
        <span
          className="absolute inset-0 rounded-full opacity-90"
          style={{ background: `linear-gradient(135deg, ${palette.text}, ${palette.text}dd)` }}
        />
        <span className="relative z-10 flex items-center gap-1">
          # {name}
          <X size={10} className="opacity-70 group-hover:opacity-100 transition-opacity" />
        </span>
      </motion.button>
    );
  });

  return (
    <div className="flex-shrink-0" data-topic-picker>
      {/* 已选话题 + 添加按钮 */}
      <div className="px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {selectedDisplay}
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium active:scale-95 transition-transform"
            style={{ color: '#FF6B6B', border: '1.5px dashed #FF6B6B33', backgroundColor: '#FFF0E522' }}
          >
            <Plus size={12} />
            {selected.length === 0 ? '添加话题' : '添加'}
          </button>
        </div>
        {selected.length === 0 && (
          <p className="text-[10px] text-[#BBA0A0] mt-2 flex items-center gap-1">
            <Sparkles size={10} />
            添加话题让更多人看到你的动态
          </p>
        )}
      </div>

      {/* 搜索面板 */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            className="fixed inset-0 z-[250] flex flex-col justify-end"
              
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSearch(false)}
          >
            <motion.div
              className="rounded-t-[20px] flex flex-col max-h-[65vh] shadow-lg"
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFBFA 100%)',
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 搜索栏 */}
              <div className="px-4 pt-4 pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#F5F0F0] transition-colors"
                    style={searchText ? { backgroundColor: '#FFF0E5' } : {}}>
                    <Search size={15} color={searchText ? '#FF6B6B' : '#BBA0A0'} />
                    <input
                      type="text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="搜索或输入新话题..."
                      className="flex-1 bg-transparent text-[14px] text-[#2D1B1B] placeholder-[#BBA0A0] outline-none"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCreateCustom(); }}
                    />
                    {searchText && (
                      <button onClick={() => setSearchText('')} className="p-0.5"><X size={14} color="#BBA0A0" /></button>
                    )}
                  </div>
                  <button onClick={() => setShowSearch(false)} className="text-[13px] font-semibold text-[#FF6B6B] flex-shrink-0 px-1">
                    取消
                  </button>
                </div>
              </div>

              {/* 创建自定义话题 */}
              {showCreateButton && (
                <div className="px-4 pb-3">
                  <button
                    onClick={handleCreateCustom}
                    disabled={customCreating}
                    className="w-full flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 pb-3 rounded-2xl active:scale-[0.98] transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #FFF0E5, #FFE0D0)',
                      boxShadow: '0 2px 12px rgba(255,107,107,0.12)',
                    }}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #FF6B6B, #FFB347)' }}>
                      <Plus size={16} color="#fff" />
                    </div>
                    <div className="text-left flex-1">
                      <span className="text-[13px] font-bold text-[#FF6B6B] block">创建 #{searchText.trim()}</span>
                      <span className="text-[10px] text-[#BBA0A0]">自定义话题，自由表达</span>
                    </div>
                  </button>
                </div>
              )}

              {/* 已选标签指示 */}
              {selected.length > 0 && (
                <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-[#BBA0A0] py-1">已选: </span>
                  {selected.map((name, i) => (
                    <span key={name} className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                      style={{ background: palettes[i % palettes.length].text }}>
                      #{name}
                    </span>
                  ))}
                </div>
              )}

              {/* 话题标签云 — 自动换行，不溢出 */}
              <div className="overflow-y-auto px-4">
                {!searchText && (
                  <p className="text-[11px] font-semibold text-[#2D1B1B] mb-3">热门话题</p>
                )}
                <div className="flex flex-wrap gap-2.5 pb-4">
                  {filteredTopics.slice(0, 30).map((topic, i) => {
                    const isSel = selected.includes(topic.name);
                    const palette = palettes[i % palettes.length];
                    return (
                      <motion.button
                        key={topic.id}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => handleToggle(topic.name)}
                        className="relative px-3.5 py-2 rounded-2xl text-[12px] font-semibold transition-all"
                        style={{
                          backgroundColor: isSel ? palette.text : palette.bg,
                          color: isSel ? '#fff' : palette.text,
                          boxShadow: isSel ? `0 2px 10px ${palette.glow}` : 'none',
                        }}
                      >
                        # {topic.name}
                        {topic.usage_count > 0 && (
                          <span className="ml-1 text-[9px] opacity-60">{topic.usage_count}</span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
