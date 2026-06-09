import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Check } from 'lucide-react';
import { getFriends } from '../api/contacts';

interface Friend {
  id: number;
  nickname: string;
  avatar: string;
}

interface AtPickerProps {
  show: boolean;
  selectedIds: number[];
  onToggle: (userId: number, nickname: string) => void;
  onClose: () => void;
}

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;

export function AtPicker({ show, selectedIds, onToggle, onClose }: AtPickerProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!show) return;
    setLoading(true);
    getFriends()
      .then((res: any) => {
        if (res.code === 0) setFriends(res.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // 延迟聚焦以等待动画完成
    setTimeout(() => searchInputRef.current?.focus(), 300);
  }, [show]);

  const filtered = searchText.trim()
    ? friends.filter(f => f.nickname.includes(searchText.trim()))
    : friends;

  const getUrl = (s: string) => s?.startsWith('http') ? s : `${apiBase}${s}`;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[250] flex flex-col justify-end"
            
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-t-[20px] flex flex-col max-h-[65vh]"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <span className="text-[15px] font-extrabold text-[#2D1B1B]">提醒谁看</span>
              <button onClick={onClose} className="text-[13px] font-semibold text-[#FF6B6B]">完成</button>
            </div>

            {/* Search */}
            <div className="px-4 pb-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#F5F0F0]">
                <Search size={14} color="#BBA0A0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="搜索好友..."
                  className="flex-1 bg-transparent text-[13px] text-[#2D1B1B] placeholder-[#BBA0A0] outline-none"
                />
                {searchText && (
                  <button onClick={() => setSearchText('')}>
                    <X size={14} color="#BBA0A0" />
                  </button>
                )}
              </div>
            </div>

            {/* Selected count */}
            {selectedIds.length > 0 && (
              <div className="px-4 py-1.5">
                <span className="text-[11px] text-[#FF6B6B] font-medium">
                  已选 {selectedIds.length} 人
                </span>
              </div>
            )}

            {/* Friend list */}
            <div className="overflow-y-auto flex-1 px-2">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-[#FF6B6B] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-[13px] text-[#BBA0A0] text-center py-12">
                  {searchText ? '未找到匹配好友' : '暂无好友'}
                </p>
              ) : (
                <div className="flex flex-col">
                  {filtered.map((friend) => {
                    const isSelected = selectedIds.includes(friend.id);
                    return (
                      <button
                        key={friend.id}
                        onClick={() => onToggle(friend.id, friend.nickname)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl active:bg-[#F8F5F2] transition-colors"
                      >
                        <img
                          src={getUrl(friend.avatar)}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover bg-[#F0E6E6] flex-shrink-0"
                        />
                        <span className="text-[13px] font-medium text-[#2D1B1B] flex-1 text-left">
                          {friend.nickname}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected ? 'bg-[#FF6B6B]' : 'border-2 border-[#D4C4C4]'
                          }`}
                        >
                          {isSelected && <Check size={11} color="#fff" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
