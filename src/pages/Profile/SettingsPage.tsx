import { motion } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, User, Shield, Eye,
  Info, Mail, HelpCircle, FileText, LogOut, IdCard, Settings2, Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSmartBack } from '../../hooks/useSmartBack';
import { calcCompletion } from '../../utils/profileCompletion';

interface Props {}

export function SettingsPage({}: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const goBack = useSmartBack('/profile');

  const isAdmin = user?.role === 'admin';
  const completion = calcCompletion(user);

  const accountItems = [
    { icon: User, label: '账号资料', action: () => navigate('/profile/edit') },
    { icon: IdCard, label: '个人信息', action: () => navigate(`/user/${user?.id}`) },
    { icon: Shield, label: '账号安全', right: user ? '已绑定' : '', action: () => navigate('/profile/security') },
    { icon: Eye, label: '隐私设置', action: () => navigate('/profile/settings/privacy') },
    ...(isAdmin ? [{ icon: Settings2, label: '系统管理', action: () => navigate('/admin') }] : []),
  ];

  const aboutItems = [
    { icon: Info, label: '关于我们', action: () => navigate('/profile/about') },
    { icon: Mail, label: '联系我们', action: () => navigate('/profile/contact') },
    { icon: HelpCircle, label: '帮助中心', action: () => navigate('/profile/help') },
    { icon: FileText, label: '用户协议', action: () => navigate('/legal/terms') },
    { icon: Shield, label: '隐私政策', action: () => navigate('/legal/privacy') },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col bg-cream-100"
        
      
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3 border-b border-cream-200">
        <button
          onClick={goBack}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-200 transition-colors"
        >
          <ChevronLeft size={22} className="text-cream-800" />
        </button>
        <h1 className="font-display text-lg font-semibold text-cream-900">设置</h1>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 flex flex-col gap-3">
        {/* Profile completion progress card */}
        <motion.div className="bg-white rounded-2xl px-4 py-3.5" style={{ boxShadow: '0 1px 3px rgba(45,32,22,0.035)' }}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.3 }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FDF5EF, #F9E8D9)' }}>
                <Zap size={14} style={{ color: '#D4A574' }} />
              </div>
              <span className="text-[13px] font-medium text-cream-900">资料完整度</span>
            </div>
            <span className="font-display text-[18px] font-bold" style={{ color: '#D4A574' }}>{completion}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F2EDE6' }}>
            <motion.div className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #D4A574, #E8B89A)' }}
              initial={{ width: 0 }}
              animate={{ width: `${completion}%` }}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          {completion < 100 && (
            <p className="text-[10px] text-cream-500 mt-2">继续完善资料可获得更多关注</p>
          )}
        </motion.div>

        {/* Account section */}
        <div className="bg-white rounded-2xl border border-cream-200/60 shadow-soft">
          {accountItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.action}
                disabled={!item.action}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-cream-50 active:bg-cream-100 transition-colors ${i < accountItems.length - 1 ? 'border-b border-cream-100' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cream-100 flex items-center justify-center text-warm-500">
                    <Icon size={16} />
                  </div>
                  <span className="text-sm font-medium text-cream-900">{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.label === '账号资料' && (
                    <div className="relative w-[34px] h-[34px] shrink-0 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full"
                        style={{
                          background: `conic-gradient(#D4A574 ${completion * 3.6}deg, #F2EDE6 ${completion * 3.6}deg)`,
                        }}
                      />
                      <div className="relative w-6 h-6 rounded-full bg-white flex items-center justify-center">
                        <span className="text-[8px] font-bold" style={{ color: '#C8956C' }}>{completion}</span>
                      </div>
                    </div>
                  )}
                  {item.right && (
                    <span className="text-[13px] text-cream-600">{item.right}</span>
                  )}
                  {item.action != null && <ChevronRight size={15} className="text-cream-500" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* About section */}
        <div className="bg-white rounded-2xl border border-cream-200/60 shadow-soft">
          {aboutItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.action}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-cream-50 active:bg-cream-100 transition-colors ${i < aboutItems.length - 1 ? 'border-b border-cream-100' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cream-100 flex items-center justify-center text-warm-500">
                    <Icon size={16} />
                  </div>
                  <span className="text-sm font-medium text-cream-900">{item.label}</span>
                </div>
                <ChevronRight size={15} className="text-cream-500" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 pb-10 pt-2">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-200 text-red-500 text-[14px] font-medium hover:bg-red-50 active:bg-red-100 transition-all"
        >
          <LogOut size={17} />
          <span>退出登录</span>
        </button>
      </div>
    </motion.div>
  );
}
