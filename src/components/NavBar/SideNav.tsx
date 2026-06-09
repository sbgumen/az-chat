import { motion } from 'framer-motion';
import { MessageCircle, Users, Compass, User, Sparkles } from 'lucide-react';
import type { TabType } from '../../types';

interface SideNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  unreadMessages?: number;
  momentsUnread?: number;
  contactsUnread?: number;
}

const navItems: { key: TabType; icon: typeof MessageCircle; label: string }[] = [
  { key: 'messages', icon: MessageCircle, label: '消息' },
  { key: 'contacts', icon: Users, label: '联系人' },
  { key: 'moments', icon: Compass, label: '动态' },
  { key: 'profile', icon: User, label: '我的' },
];

export function SideNav({ activeTab, onTabChange, unreadMessages = 0, momentsUnread = 0, contactsUnread = 0 }: SideNavProps) {
  return (
    <aside className="w-16 h-full bg-white border-r border-cream-300/60 flex flex-col items-center py-5 gap-2 shadow-soft">
      <div className="w-10 h-10 flex items-center justify-center mb-6 text-warm-500 rounded-xl">
        <Sparkles size={24} />
      </div>

      <nav className="flex flex-col items-center gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              className={`relative w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-150 ${
                isActive ? 'text-warm-500' : 'text-cream-700 hover:text-cream-800 hover:bg-cream-200'
              }`}
              onClick={() => onTabChange(item.key)}
              title={item.label}
              aria-label={item.label}
            >
              {isActive && (
                <motion.div
                  className="absolute -left-[10px] w-[3px] h-6 rounded-r-lg bg-gradient-to-b from-warm-400 to-warm-600"
                  layoutId="sidenav-indicator"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.6} />
              {item.key === 'messages' && unreadMessages > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-semibold flex items-center justify-center animate-pulse-soft">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
              {item.key === 'moments' && momentsUnread > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-semibold flex items-center justify-center animate-pulse-soft">
                  {momentsUnread > 99 ? '99+' : momentsUnread}
                </span>
              )}
              {item.key === 'contacts' && contactsUnread > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-semibold flex items-center justify-center animate-pulse-soft">
                  {contactsUnread > 99 ? '99+' : contactsUnread}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-cream-300 hover:border-warm-500 transition-colors cursor-pointer">
        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="avatar" className="w-full h-full object-cover" />
        <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-sage-500 border-2 border-white" />
      </div>
    </aside>
  );
}
