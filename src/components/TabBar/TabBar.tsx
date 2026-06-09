import { motion } from 'framer-motion';
import { MessageCircle, Users, Compass, User } from 'lucide-react';
import type { TabType } from '../../types';

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  unreadMessages?: number;
  momentsUnread?: number;
  contactsUnread?: number;
}

const tabs: { key: TabType; icon: typeof MessageCircle; label: string }[] = [
  { key: 'messages', icon: MessageCircle, label: '消息' },
  { key: 'contacts', icon: Users, label: '联系人' },
  { key: 'moments', icon: Compass, label: '动态' },
  { key: 'profile', icon: User, label: '我的' },
];

export function TabBar({ activeTab, onTabChange, unreadMessages = 0, momentsUnread = 0, contactsUnread = 0 }: TabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-cream-300/60 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-[68px] px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              className={`flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-150 min-w-[60px] active:scale-90 ${
                isActive ? 'text-warm-500' : 'text-cream-700'
              }`}
              onClick={() => onTabChange(tab.key)}
              aria-label={tab.label}
            >
              <div className="relative flex items-center justify-center w-8 h-8">
                <Icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.2 : 1.8} />
                {tab.key === 'messages' && unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center animate-pulse-soft">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
                {tab.key === 'contacts' && contactsUnread > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center animate-pulse-soft">
                    {contactsUnread > 99 ? '99+' : contactsUnread}
                  </span>
                )}
                {tab.key === 'moments' && momentsUnread > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center animate-pulse-soft">
                    {momentsUnread > 99 ? '99+' : momentsUnread}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    className="absolute inset-[-6px] rounded-full bg-warm-500/10 -z-10"
                    layoutId="tabbar-glow"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </div>
              {isActive && (
                <motion.span
                  className="text-[10px] font-medium"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {tab.label}
                </motion.span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
