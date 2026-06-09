import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { ChevronLeft, LayoutDashboard, Settings, Users, MessageSquare, Image, Star, Shield, CalendarCheck, Hash, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSmartBack } from '../../hooks/useSmartBack';
import { useEffect, useRef } from 'react';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: '仪表盘' },
  { path: '/admin/users', icon: Users, label: '用户管理' },
  { path: '/admin/groups', icon: MessageSquare, label: '群聊管理' },
  { path: '/admin/moments', icon: Image, label: '动态管理' },
  { path: '/admin/level', icon: Star, label: '等级管理' },
  { path: '/admin/signin', icon: CalendarCheck, label: '签到管理' },
  { path: '/admin/presets', icon: Image, label: '预设背景' },
  { path: '/admin/topics', icon: Hash, label: '话题管理' },
  { path: '/admin/captcha', icon: Shield, label: '验证码配置' },
  { path: '/admin/login-config', icon: KeyRound, label: '登录与注册' },
  { path: '/admin/settings', icon: Settings, label: '基础设置' },
];

export function AdminLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const goBack = useSmartBack('/profile');
  const location = useLocation();

  useEffect(() => {
    if (!user || user.role !== 'admin') navigate('/profile', { replace: true });
  }, [user]);

  const isActive = (path: string) =>
    location.pathname === path || (path === '/admin' && location.pathname === '/admin');
  const navRef = useRef<HTMLElement>(null);

  // 选中项自动滚动到居中位置
  useEffect(() => {
    if (!navRef.current) return;
    const activeBtn = navRef.current.querySelector('.border-warm-500') as HTMLElement;
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [location.pathname]);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-cream-100"
      
      >
      {/* Header */}
      <div className="bg-white border-b border-cream-200 shrink-0">
        <div className="flex items-center gap-3 px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-3">
          <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-cream-100 transition-colors">
            <ChevronLeft size={22} className="text-cream-800" />
          </button>
          <h1 className="font-display text-lg font-semibold text-cream-900">系统管理</h1>
        </div>
        {/* Mobile top tabs */}
        <nav ref={navRef} className="md:hidden flex overflow-x-auto px-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {navItems.map(({ path, icon: Icon, label }) => (
            <button key={path} onClick={() => navigate(path)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors shrink-0 ${isActive(path) ? 'border-warm-500 text-warm-600' : 'border-transparent text-cream-500'}`}>
              <Icon size={14} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <nav className="hidden md:flex flex-col w-48 bg-white border-r border-cream-200 py-2 shrink-0">
          {navItems.map(({ path, icon: Icon, label }) => (
            <button key={path} onClick={() => navigate(path)}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${isActive(path) ? 'bg-warm-50 text-warm-600 border-r-2 border-warm-500' : 'text-cream-600 hover:bg-cream-50'}`}>
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
