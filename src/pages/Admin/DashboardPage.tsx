import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  MessageSquare,
  Image,
  Users2,
  Wifi,
  Clock,
  RefreshCw,
  HardDrive,
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardData {
  totalUsers?: number;
  todayUsers?: number;
  totalMessages?: number;
  todayMessages?: number;
  totalGroupMessages?: number;
  todayGroupMessages?: number;
  totalMoments?: number;
  todayMoments?: number;
  totalGroups?: number;
  onlineCount?: number;
  recentLogins?: Array<{
    id: number;
    nickname: string;
    avatar: string;
    level: number;
    last_login: string;
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const apiBase =
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:5001`;

function getFullAvatar(avatar: string | undefined): string {
  if (!avatar) return '';
  return avatar.startsWith('http') ? avatar : `${apiBase}${avatar}`;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  const months = Math.floor(days / 30);
  return `${months}个月前`;
}

function formatDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const w = weekdays[now.getDay()];
  return `${y}年${m}月${d}日 ${w}`;
}

function formatCount(n: number | undefined | null): string {
  if (n == null) return '—';
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return n.toLocaleString('zh-CN');
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SkeletonBlock() {
  return (
    <div className="animate-pulse space-y-4 px-2">
      {/* Top bar skeleton */}
      <div className="h-10 bg-cream-200 rounded-xl w-2/3" />

      {/* Stat cards row */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-5 shadow-soft space-y-3">
            <div className="h-5 w-8 bg-cream-200 rounded" />
            <div className="h-8 w-16 bg-cream-200 rounded" />
            <div className="h-4 w-24 bg-cream-100 rounded" />
          </div>
        ))}
      </div>

      {/* Second row skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-soft h-36" />
        <div className="bg-white rounded-xl p-5 shadow-soft h-36" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-xl p-5 shadow-soft space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cream-200 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-24 bg-cream-200 rounded" />
              <div className="h-3 w-16 bg-cream-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <RefreshCw size={28} className="text-red-400" />
      </div>
      <p className="text-cream-600 text-sm mb-1">加载失败</p>
      <p className="text-cream-500 text-xs mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 rounded-xl bg-warm-500 text-white text-sm font-medium active:scale-95 transition-transform"
      >
        重试
      </button>
    </div>
  );
}

function EmptyBlock() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-16 h-16 rounded-full bg-cream-100 flex items-center justify-center mb-4">
        <HardDrive size={28} className="text-cream-400" />
      </div>
      <p className="text-cream-500 text-sm">暂无数据</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  gradient: string;
  accentBorder: string;
  index: number;
}

function StatCard({ icon, label, value, subtitle, gradient, accentBorder, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.08 * index, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden bg-white rounded-2xl p-5 shadow-soft
                 hover:shadow-medium transition-shadow duration-300 cursor-default
                 group"
    >
      {/* Subtle gradient wash */}
      <div
        className={`absolute inset-0 opacity-30 ${gradient} transition-opacity duration-300 group-hover:opacity-50`}
      />

      {/* Left accent bar */}
      <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${accentBorder}`} />

      <div className="relative z-10 space-y-3">
        {/* Icon + Label */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cream-50/80 flex items-center justify-center text-cream-600">
            {icon}
          </div>
          <span className="text-xs font-medium text-cream-500 tracking-wide">{label}</span>
        </div>

        {/* Big number */}
        <p className="text-3xl font-display font-semibold text-cream-900 tracking-tight tabular-nums">
          {value}
        </p>

        {/* Subtitle */}
        <p className="text-xs text-cream-500 flex items-center gap-1">
          {subtitle}
        </p>
      </div>
    </motion.div>
  );
}

// Main Component
// ---------------------------------------------------------------------------

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await adminApi.getDashboard();
      if (res.code === 0) {
        setData(res.data);
      } else {
        setError(res.message || '获取数据失败');
      }
    } catch (e: any) {
      setError(e?.message || '网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // --- Loading state ---
  if (loading) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8">
        <SkeletonBlock />
      </div>
    );
  }

  // --- Error state ---
  if (error && !data) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8">
        <ErrorBlock message={error} onRetry={fetchDashboard} />
      </div>
    );
  }

  // --- Empty state ---
  if (!data) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8">
        <EmptyBlock />
      </div>
    );
  }

  const onlineCount = data.onlineCount ?? 0;
  const recentLogins: DashboardData['recentLogins'] = data.recentLogins ?? [];
  const totalMessages = (data.totalMessages || 0) + (data.totalGroupMessages || 0);
  const todayMessages = (data.todayMessages || 0) + (data.todayGroupMessages || 0);

  // --- Stat cards config ---
  const statCards = [
    {
      icon: <Users size={18} />,
      label: '用户总量',
      value: formatCount(data.totalUsers),
      subtitle: data.todayUsers != null
        ? `今日新增 ${data.todayUsers}`
        : '—',
      gradient: 'bg-gradient-to-br from-green-50/80 to-emerald-50/30',
      accentBorder: 'bg-green-400',
    },
    {
      icon: <MessageSquare size={18} />,
      label: '消息总量',
      value: formatCount(totalMessages),
      subtitle: todayMessages > 0
        ? `今日 ${formatCount(todayMessages)} 条`
        : '—',
      gradient: 'bg-gradient-to-br from-blue-50/80 to-cyan-50/30',
      accentBorder: 'bg-blue-400',
    },
    {
      icon: <Image size={18} />,
      label: '动态总量',
      value: formatCount(data.totalMoments),
      subtitle: data.todayMoments != null
        ? `今日 ${formatCount(data.todayMoments)} 条`
        : '—',
      gradient: 'bg-gradient-to-br from-purple-50/80 to-violet-50/30',
      accentBorder: 'bg-purple-400',
    },
    {
      icon: <Users2 size={18} />,
      label: '群组总量',
      value: formatCount(data.totalGroups),
      subtitle: '全部群组',
      gradient: 'bg-gradient-to-br from-amber-50/80 to-yellow-50/30',
      accentBorder: 'bg-amber-400',
    },
  ];

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 space-y-6">
      {/* ================================================================ */}
      {/* Top bar                                                          */}
      {/* ================================================================ */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-xl font-display font-semibold text-cream-900">
            仪表盘
          </h2>
          <p className="text-xs text-cream-500 mt-0.5">{formatDate()}</p>
        </div>

        {/* Admin avatar + name */}
        {user && (
          <div className="flex items-center gap-2.5">
            <div className="text-right">
              <p className="text-sm font-medium text-cream-800 leading-tight">
                {user.nickname}
              </p>
              <p className="text-[11px] text-cream-500">管理员</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-cream-200 overflow-hidden shadow-soft shrink-0 ring-2 ring-warm-200/50">
              {user.avatar ? (
                <img
                  src={getFullAvatar(user.avatar)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-cream-500 text-sm font-medium">
                  {user.nickname?.charAt(0)?.toUpperCase() || 'A'}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* ================================================================ */}
      {/* Stat cards (2x2 grid)                                            */}
      {/* ================================================================ */}
      <div className="grid grid-cols-2 gap-4">
        {statCards.map((card, i) => (
          <StatCard key={card.label} {...card} index={i} />
        ))}
      </div>

      {/* ================================================================ */}
      {/* Second row: Online + System Resources                            */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* --- Online users --- */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="bg-white rounded-2xl p-5 shadow-soft hover:shadow-medium transition-shadow duration-300"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
              <Wifi size={18} className="text-green-600" />
            </div>
            <span className="text-xs font-medium text-cream-500 tracking-wide">
              实时在线
            </span>
          </div>

          <div className="flex items-end gap-3">
            <span className="text-3xl font-display font-semibold text-cream-900 tabular-nums">
              {onlineCount.toLocaleString('zh-CN')}
            </span>
            <span className="text-sm text-cream-500 pb-1">人</span>

            {/* Pulsing green dot */}
            <div className="relative flex items-center ml-auto">
              <span className="absolute w-3 h-3 rounded-full bg-green-400 opacity-70 animate-ping" />
              <span className="relative w-2.5 h-2.5 rounded-full bg-green-500" />
            </div>
          </div>
        </motion.div>

        {/* --- Recent logins count --- */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.43, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="bg-white rounded-2xl p-5 shadow-soft hover:shadow-medium transition-shadow duration-300"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center">
              <Clock size={18} className="text-cyan-600" />
            </div>
            <span className="text-xs font-medium text-cream-500 tracking-wide">
              最近登录
            </span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-display font-semibold text-cream-900 tabular-nums">
              {recentLogins.length}
            </span>
            <span className="text-sm text-cream-500 pb-1">人</span>
          </div>
        </motion.div>
      </div>

      {/* ================================================================ */}
      {/* Recent logins table                                              */}
      {/* ================================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.51, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="bg-white rounded-2xl shadow-soft hover:shadow-medium transition-shadow duration-300 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-3 border-b border-cream-100">
          <div className="w-9 h-9 rounded-xl bg-cream-50 flex items-center justify-center">
            <Clock size={18} className="text-cream-600" />
          </div>
          <span className="text-xs font-medium text-cream-500 tracking-wide">
            最近登录
          </span>
          <span className="ml-auto text-[11px] text-cream-400">
            最近 {Math.min(recentLogins.length, 10)} 条
          </span>
        </div>

        {/* Table body */}
        {recentLogins.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-cream-400">暂无登录记录</p>
          </div>
        ) : (
          <div className="divide-y divide-cream-50">
            {recentLogins.slice(0, 10).map((login, i) => (
              <motion.div
                key={login.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.55 + i * 0.04 }}
                className="flex items-center gap-3 px-5 py-3 hover:bg-cream-50/60 transition-colors duration-150"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-cream-200 overflow-hidden shrink-0">
                  {login.avatar ? (
                    <img
                      src={getFullAvatar(login.avatar)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-cream-500 text-xs font-medium">
                      {login.nickname?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>

                {/* Nickname */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-cream-900 truncate">
                    {login.nickname || '未命名用户'}
                  </p>
                  <p className="text-[11px] text-cream-400 mt-0.5">
                    ID: {login.id}
                  </p>
                </div>

                {/* Login time */}
                <div className="text-right shrink-0">
                  <p className="text-xs text-cream-500 flex items-center gap-1">
                    <Clock size={11} className="text-cream-400" />
                    {relativeTime(login.last_login)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Bottom spacer */}
      <div className="h-4" />
    </div>
  );
}

export default DashboardPage;
