import { RemoteImage } from '../../components/RemoteImage';
import { SafeImg } from '../../components/SafeImg';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, UserPlus, UserMinus, Heart, MessageCircle, Cake, Ruler, Weight, X, Sun, ChevronRight, Pencil } from 'lucide-react';
import { getUserProfile, followUser, unfollowUser, getUserAlbums } from '../../api/user';
import { getUserMoments } from '../../api/moments';
import { sendFriendRequest, deleteFriend, getMyRequests } from '../../api/contacts';
import { useNavigate, useParams } from 'react-router-dom';
import { calcStarDisplay } from '../../utils/levelStars';
import { useHistoryBack } from '../../hooks/useHistoryBack';
import { useSmartBack } from '../../hooks/useSmartBack';
import { useAuth } from '../../context/AuthContext';
import { OnlineStatusDot } from '../../components/OnlineStatusDot';
import { UserAlbumPage } from './UserAlbumPage';
import { ImageViewer } from '../../components/ImageViewer';
import { GlassAvatarFrame } from '../../components/effects/GlassAvatarFrame';
import { DichroicBackground, DichroicBadge } from '../../components/effects/DichroicEffects';
import { CrystalBackground, CrystalTag, CrystalNickname } from '../../components/effects/CrystalEffects';
import { StyleCanvasDecor } from '../../components/effects/StyleCanvasDecor';
import { CanvasBanner } from '../../components/effects/CanvasBanner';
import { HOME_STYLES, type HomeStyle } from '../../components/effects/lv30Styles';
import { useGyroscope } from '../../hooks/useGyroscope';
import { useImageBrightness } from '../../hooks/useImageBrightness';
import { useStatusBarColor } from '../../hooks/useStatusBarColor';

interface Props {
  userId?: number;
  onClose?: () => void;
  zIndex?: number;
  disableHistoryBack?: boolean;
}

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getAvatar = (a: string) => a?.startsWith('http') ? a : `${apiBase}${a}`;

const TAG_COLORS = [
  'bg-pink-50 text-pink-600 border-pink-200/60',
  'bg-purple-50 text-purple-600 border-purple-200/60',
  'bg-blue-50 text-blue-600 border-blue-200/60',
  'bg-teal-50 text-teal-600 border-teal-200/60',
  'bg-amber-50 text-amber-600 border-amber-200/60',
  'bg-rose-50 text-rose-600 border-rose-200/60',
  'bg-indigo-50 text-indigo-600 border-indigo-200/60',
  'bg-emerald-50 text-emerald-600 border-emerald-200/60',
];

// QQ四级等级展示
function StarLevelDisplay({ level }: { level: number }) {
  if (!level) return null;
  const { crowns, suns, moons, stars } = calcStarDisplay(level);
  return (
    <div className="flex items-center gap-1 mt-1">
      {level >= 30 ? (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.8), rgba(245,158,11,0.7))', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)' }}>
          LV{level}
        </span>
      ) : level >= 20 ? (
        <DichroicBadge level={level} />
      ) : (
        <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold shadow-sm">
          LV{level}
        </span>
      )}
      {Array.from({ length: crowns }).map((_, i) => <svg key={`c${i}`} width="12" height="12" viewBox="0 0 24 24" fill="#ca8a04" stroke="currentColor" className="text-yellow-600"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/></svg>)}
      {Array.from({ length: suns }).map((_, i) => <Sun key={`su${i}`} size={12} fill="#f97316" className="text-orange-500" />)}
      {Array.from({ length: moons }).map((_, i) => <svg key={`m${i}`} width="12" height="12" viewBox="0 0 24 24" fill="#6366f1" stroke="currentColor" className="text-indigo-500"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></svg>)}
      {Array.from({ length: stars }).map((_, i) => <svg key={`s${i}`} width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="currentColor" className="text-amber-500"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>)}
    </div>
  );
}



// 权益1 (lv>=10): 彩色流光名字
function RainbowName({ name }: { name: string }) {
  return (
    <span className="relative inline-block font-display text-xl font-semibold">
      <span className="bg-gradient-to-r from-pink-500 via-purple-500 via-blue-500 via-teal-500 to-amber-500 bg-clip-text text-transparent"
        style={{ backgroundSize: '200% auto', animation: 'rainbowFlow 3s linear infinite' }}>
        {name}
      </span>
      <style>{`@keyframes rainbowFlow { 0%{background-position:0% center} 100%{background-position:200% center} }`}</style>
    </span>
  );
}


export function UserProfilePage({ userId: userIdProp, onClose, zIndex = 200, disableHistoryBack }: Props) {
  const navigate = useNavigate();
  const { userId: userIdParam } = useParams<{ userId: string }>();
  const userId = userIdProp ?? Number(userIdParam);
  const { user: authUser } = useAuth();
  const isOwnProfile = authUser?.id === userId;
  const goBack = useSmartBack('/messages');
  const handleBack = onClose ?? goBack;
  useHistoryBack(disableHistoryBack ? null : (onClose ?? null));

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowed, setIsFollowed] = useState(false);
  const [isFriendState, setIsFriendState] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [friendLoading, setFriendLoading] = useState(false);
  const [showAddFriendDialog, setShowAddFriendDialog] = useState(false);
  const [friendMessage, setFriendMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState('');
  const [albums, setAlbums] = useState<{ id: number; name: string; preview_photos: string[]; photo_count: number }[]>([]);
  const [recentMoments, setRecentMoments] = useState<any[]>([]);
  const [showAlbum, setShowAlbum] = useState(false);
  const [showBannerViewer, setShowBannerViewer] = useState(false);

  const gyro = useGyroscope();

  const loadProfile = async () => {
    try {
      const res: any = await getUserProfile(userId);
      if (res.code === 0) {
        setProfile(res.data);
        setIsFollowed(!!res.data.is_followed);
        setIsFriendState(!!res.data.is_friend);
      }
    } catch { /* ignore */ }
    // Check if there's already a pending friend request
    try {
      const mr: any = await getMyRequests();
      if (mr.code === 0) {
        const pending = (mr.data || []).find((r: any) => r.to_user_id === userId && r.status === 0);
        setHasPendingRequest(!!pending);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
    getUserAlbums(userId).then((res: any) => {
      if (res.code === 0) setAlbums(res.data.slice(0, 3));
    }).catch(() => {});
    getUserMoments(userId, 1, 3).then((res: any) => {
      if (res.code === 0) setRecentMoments((res.data?.list || []).slice(0, 3));
    }).catch(() => {});
  }, [userId]);

  // 返回页面时重新加载（确保风格切换等设置生效）
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') loadProfile(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [userId]);

  const level = profile?.level || 1;
  const showLv20Effects = level >= 20 && level < 30;
  const showLv30Effects = level >= 30;
  const lv30Style = (isOwnProfile ? (localStorage.getItem('az_lv30_style') || profile?.lv30_style || 'original') : profile?.lv30_style || 'original') as HomeStyle;
  const isLv30Dark = showLv30Effects && lv30Style !== 'original';
  const styleP = HOME_STYLES[showLv30Effects ? lv30Style : 'original'] || HOME_STYLES.original;
  useStatusBarColor(isLv30Dark ? styleP.bgBase : '#00000000');
  const iconStyle = useImageBrightness(
    profile?.banner_type === 'custom' ? `${apiBase}${profile.banner_image}` : null,
    profile?.banner_type === 'preset' ? profile?.banner_preset : null
  );
  const btnGlassBg = iconStyle.isDarkBg ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.22)';
  const btnGlassBorder = iconStyle.isDarkBg ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.10)';
  const btnGlassHighlight = iconStyle.isDarkBg ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.40)';

  const handleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowed) {
        const res: any = await unfollowUser(userId);
        if (res.code === 0) setIsFollowed(false);
      } else {
        const res: any = await followUser(userId);
        if (res.code === 0) setIsFollowed(true);
      }
    } catch { /* ignore */ }
    setFollowLoading(false);
  };

  const handleAddFriend = async () => {
    if (sendingRequest) return;
    setSendingRequest(true);
    try {
      const res: any = await sendFriendRequest(userId, friendMessage || '你好，我想加你为好友');
      if (res.code === 0) {
        setShowAddFriendDialog(false);
        setFriendMessage('');
        setToast('好友申请已发送，等待对方同意');
        setHasPendingRequest(true);
        setTimeout(() => setToast(''), 3000);
      }
    } catch { /* ignore */ }
    setSendingRequest(false);
  };

  const handleDeleteFriend = async () => {
    if (friendLoading) return;
    setFriendLoading(true);
    try {
      const res: any = await deleteFriend(userId);
      if (res.code === 0) { setIsFriendState(false); setShowDeleteConfirm(false); }
    } catch { /* ignore */ }
    setFriendLoading(false);
  };

  const handleSendMessage = () => {
    if (profile) {
      navigate(`/messages/chat/${userId}`, {
        state: {
          conversation: {
            id: `c_${userId}`,
            user: {
              id: String(userId),
              name: profile.nickname || '',
              avatar: profile.avatar ? getAvatar(profile.avatar) : '/default-avatar.png',
            },
            lastMessage: { id: '', senderId: '', content: '', timestamp: '', type: 'text' },
            unreadCount: 0,
          }
        }
      });
    }
  };

  return (
    <motion.div
      className={`fixed inset-0 flex flex-col ${isLv30Dark ? '' : 'bg-cream-100'}`}
      style={{ zIndex, background: isLv30Dark ? styleP.bgGradient : undefined }}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pb-[calc(env(safe-area-inset-bottom,0px)+80px)]">
        {loading ? (
          <div className="animate-pulse">
            {/* Header skeleton */}
            <div className="relative overflow-hidden px-5 pb-5" style={{ paddingTop: 'calc(var(--status-bar-height, 0px) + 52px)' }}>
              <div className="flex items-center gap-4">
                <div className="w-[80px] h-[80px] rounded-full bg-cream-200 shrink-0" />
                <div className="flex-1 flex flex-col gap-3">
                  <div className="flex gap-5">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-4 rounded bg-cream-200" />
                      <div className="w-6 h-3 rounded bg-cream-200" />
                    </div>
                    <div className="w-px h-5 bg-cream-200" />
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-4 rounded bg-cream-200" />
                      <div className="w-6 h-3 rounded bg-cream-200" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-12 h-6 rounded-full bg-cream-200" />
                    <div className="w-16 h-6 rounded-full bg-cream-200" />
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="w-32 h-5 rounded bg-cream-200" />
                <div className="w-20 h-3 rounded bg-cream-200" />
                <div className="w-16 h-5 rounded-full bg-cream-200" />
                <div className="w-48 h-3 rounded bg-cream-200 mt-2" />
              </div>
            </div>
            {/* Album skeleton */}
            <div className="px-4 mb-3">
              <div className="w-full h-24 rounded-2xl bg-cream-200" />
            </div>
            {/* Info skeleton */}
            <div className="px-4 mb-3">
              <div className="w-full rounded-2xl bg-white border border-cream-200/60 p-4 space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cream-200" />
                    <div className="flex-1 h-4 rounded bg-cream-200" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : !profile ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2">
            <p className="text-cream-600 text-sm">无法加载用户信息</p>
            <button onClick={() => handleBack()} className="text-warm-500 text-sm font-medium">返回</button>
          </div>
        ) : (
          <>
            {/* Hero */}
            <div className="relative overflow-hidden">
              <div className={`absolute inset-0 ${isLv30Dark ? '' : 'bg-cream-100'}`} />

              {/* LV30+ 水晶背景：深色极光 (放在banner之前，让banner在上面) */}
              {showLv30Effects && lv30Style !== 'original' && <>
                <CrystalBackground style={lv30Style} />
                <StyleCanvasDecor style={lv30Style} />
              </>}

              {/* LV20 二向色光晕背景 */}
              {showLv20Effects && <DichroicBackground />}

              {/* Banner image area — mask-blend into content below */}
              {profile && (
                <div className="relative h-[140px] w-full cursor-pointer z-[1]"
                  style={{
                    background: isLv30Dark ? styleP.bgBase : '#f5efe4',
                    maskImage: 'linear-gradient(to bottom, black 0%, black 65%, black 80%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 65%, black 80%, transparent 100%)',
                  }}
                  onClick={() => { if (profile.banner_type === 'custom' && profile.banner_image) setShowBannerViewer(true); }}>
                  {profile.banner_type === 'custom' && profile.banner_image ? (
                    <SafeImg src={profile.banner_image?.startsWith('http') ? profile.banner_image : `${apiBase}${profile.banner_image}`}
                      alt="" className="w-full h-full object-cover"
                      style={isLv30Dark ? { filter: 'brightness(0.5)' } : {}} />
                  ) : profile.banner_type === 'preset' && profile.banner_preset ? (
                    <CanvasBanner preset={profile.banner_preset as any} />
                  ) : (
                    <CanvasBanner preset="sunrise" />
                  )}
                </div>
              )}

              <div className="absolute -top-[60%] -left-[20%] -right-[20%] h-[200%] pointer-events-none bg-[radial-gradient(ellipse_at_50%_30%,rgba(200,149,108,0.10)_0%,transparent_50%),radial-gradient(ellipse_at_30%_60%,rgba(232,184,154,0.07)_0%,transparent_40%)]" />

              {/* Back & Edit buttons — absolute top, float over banner */}
              <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-[calc(var(--status-bar-height,0px)+12px)] pb-2 pointer-events-none">
                <button onClick={() => handleBack()} className="pointer-events-auto active:scale-95 transition-transform"
                  style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: btnGlassBg,
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: `1px solid ${btnGlassBorder}`,
                    boxShadow: `0 2px 8px rgba(0,0,0,0.10), inset 0 1px 0 ${btnGlassHighlight}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  <ArrowLeft size={18} color={iconStyle.iconColor} strokeWidth={2.5} />
                </button>
                {isOwnProfile && (
                  <button onClick={() => navigate('/profile/personalization')}
                    className="pointer-events-auto active:scale-95 transition-transform"
                    style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: btnGlassBg,
                      backdropFilter: 'blur(20px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                      border: `1px solid ${btnGlassBorder}`,
                      boxShadow: `0 2px 8px rgba(0,0,0,0.10), inset 0 1px 0 ${btnGlassHighlight}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    <Pencil size={15} color={iconStyle.iconColor} strokeWidth={2.2} />
                  </button>
                )}
              </div>

              {/* LV30+ hero: 暗色风格专属滑动动画 */}
              {isLv30Dark ? (
                <div className="relative z-10 px-5 pb-4 flex items-center gap-4 w-full">
                  <motion.div className="-mt-[44px]"
                    initial={{ x: -60, opacity: 0, scale: 0.5 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <GlassAvatarFrame level={level} gyroX={gyro.x} gyroY={gyro.y} lv30Style={lv30Style}>
                      <div className="relative">
                        <motion.div
                          className="absolute inset-[-16px] rounded-full pointer-events-none"
                          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)' }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: [0, 1.5, 1], opacity: [0, 0.8, 0] }}
                          transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                        />
                        <RemoteImage
                          src={profile.avatar ? getAvatar(profile.avatar) : 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                          alt={profile.nickname}
                          className="w-[80px] h-[80px] rounded-full border-[3px] border-cream-100 object-cover relative z-10 bg-cream-300 shadow-medium"
                        />
                        <OnlineStatusDot userId={userId} size={16} borderWidth={3} glow className="bottom-[3px] right-[3px]" />
                      </div>
                    </GlassAvatarFrame>
                  </motion.div>

                  {/* 右侧信息：从右侧飞入，错落延迟 */}
                  <div className="flex-1 relative z-10 flex flex-col gap-2">
                    <motion.div
                      className="flex items-center gap-5"
                      initial={{ x: 40, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <button onClick={() => navigate(`/user/${userId}/follow/following`)} className="flex flex-col items-center gap-0.5 hover:opacity-70 transition-opacity">
                        <span className="font-display text-base font-semibold text-white">{profile.following ?? 0}</span>
                        <span className="text-[11px] text-white/50">关注</span>
                      </button>
                      <div className="w-px h-5 bg-white/20" />
                      <button onClick={() => navigate(`/user/${userId}/follow/followers`)} className="flex flex-col items-center gap-0.5 hover:opacity-70 transition-opacity">
                        <span className="font-display text-base font-semibold text-white">{profile.followers ?? 0}</span>
                        <span className="text-[11px] text-white/50">粉丝</span>
                      </button>
                    </motion.div>
                    <motion.div
                      className="flex items-center gap-2"
                      initial={{ x: 40, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {profile.gender === 1 && (
                        <span className="text-[11px] font-semibold text-blue-300 bg-blue-500/20 border border-blue-400/30 px-2 py-0.5 rounded-full">♂ 男</span>
                      )}
                      {profile.gender === 2 && (
                        <span className="text-[11px] font-semibold text-pink-300 bg-pink-500/20 border border-pink-400/30 px-2 py-0.5 rounded-full">♀ 女</span>
                      )}
                      <button
                        onClick={handleFollow}
                        disabled={followLoading}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold shadow-sm active:scale-95 transition-all ${
                          isFollowed
                            ? 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
                            : 'bg-violet-500/80 text-white hover:bg-violet-500'
                        }`}
                      >
                        <Heart size={10} className={isFollowed ? 'fill-white/50 text-white/50' : 'fill-white text-white'} />
                        {isFollowed ? '已关注' : '关注'}
                      </button>
                    </motion.div>
                  </div>
                </div>
              ) : (
                <motion.div
                  className="relative z-10 px-5 pb-4 flex items-center gap-4 w-full"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="-mt-[44px]">
                    <GlassAvatarFrame level={level} gyroX={gyro.x} gyroY={gyro.y} lv30Style={lv30Style}>
                    <div className="relative">
                      <div className="absolute inset-[-8px] rounded-full bg-gradient-to-br from-warm-400 to-warm-600 opacity-20 blur-xl" />
                      <RemoteImage
                        src={profile.avatar ? getAvatar(profile.avatar) : 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                        alt={profile.nickname}
                        className="w-[80px] h-[80px] rounded-full border-[3px] border-cream-100 object-cover relative z-10 bg-cream-300 shadow-medium"
                      />
                      <OnlineStatusDot userId={userId} size={16} borderWidth={3} glow className="bottom-[3px] right-[3px]" />
                    </div>
                  </GlassAvatarFrame>
                  </div>

                  <div className="flex-1 relative z-10 flex flex-col gap-2">
                    <div className="flex items-center gap-5">
                      <button onClick={() => navigate(`/user/${userId}/follow/following`)} className="flex flex-col items-center gap-0.5 hover:opacity-70 transition-opacity">
                        <span className="font-display text-base font-semibold text-cream-900">{profile.following ?? 0}</span>
                        <span className="text-[11px] text-cream-600">关注</span>
                      </button>
                      <div className="w-px h-5 bg-cream-300" />
                      <button onClick={() => navigate(`/user/${userId}/follow/followers`)} className="flex flex-col items-center gap-0.5 hover:opacity-70 transition-opacity">
                        <span className="font-display text-base font-semibold text-cream-900">{profile.followers ?? 0}</span>
                        <span className="text-[11px] text-cream-600">粉丝</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {profile.gender === 1 && (
                        <span className="text-[11px] font-semibold text-blue-500 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full">♂ 男</span>
                      )}
                      {profile.gender === 2 && (
                        <span className="text-[11px] font-semibold text-pink-500 bg-pink-50 border border-pink-200/60 px-2 py-0.5 rounded-full">♀ 女</span>
                      )}
                      <button
                        onClick={handleFollow}
                        disabled={followLoading}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold shadow-sm active:scale-95 transition-all ${
                          isFollowed
                            ? 'bg-cream-200 text-cream-600 border border-cream-300 hover:bg-cream-300'
                            : 'bg-warm-500 text-white hover:bg-warm-600'
                        }`}
                      >
                        <Heart size={10} className={isFollowed ? 'fill-cream-500 text-cream-500' : 'fill-white text-white'} />
                        {isFollowed ? '已关注' : '关注'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 昵称/签名区域 */}
              {isLv30Dark ? (
                <div className="relative z-10 px-5 pb-5">
                  <motion.h2
                    className="mb-0.5"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <CrystalNickname name={profile.nickname || '未设置昵称'} style={lv30Style} />
                  </motion.h2>
                  <motion.p
                    className="text-[12px] text-white/40 mb-1.5"
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.42, duration: 0.4 }}
                  >
                    ID: {profile.id}
                  </motion.p>
                  <motion.div
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.48, duration: 0.4 }}
                  >
                    <StarLevelDisplay level={level} />
                  </motion.div>
                  {profile.signature && (
                    <motion.p
                      className="text-[13px] text-white/40 italic leading-relaxed mt-1"
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.54, duration: 0.4 }}
                    >
                      "{profile.signature}"
                    </motion.p>
                  )}
                  {profile.tags && profile.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {profile.tags.map((tag: string, i: number) => (
                        <motion.span
                          key={tag}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${TAG_COLORS[i % TAG_COLORS.length]}`}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.6 + i * 0.06, type: 'spring', stiffness: 400, damping: 20 }}
                        >
                          {tag}
                        </motion.span>
                      ))}
                    </div>
                  )}
                  {(profile.birthday || profile.height || profile.weight) && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {profile.birthday && (
                        <CrystalTag style={lv30Style}><Cake size={11} className="text-amber-400" />{profile.birthday.slice(0, 10)}</CrystalTag>
                      )}
                      {profile.height && (
                        <CrystalTag style={lv30Style}><Ruler size={11} className="text-emerald-400" />{profile.height} cm</CrystalTag>
                      )}
                      {profile.weight && (
                        <CrystalTag style={lv30Style}><Weight size={11} className="text-blue-400" />{profile.weight} kg</CrystalTag>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <motion.div
                  className="relative z-10 px-5 pb-5"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  <h2 className="mb-0.5">
                    {level >= 10 ? (
                      <RainbowName name={profile.nickname || '未设置昵称'} />
                    ) : (
                      <span className="font-display text-xl font-semibold text-cream-900">{profile.nickname || '未设置昵称'}</span>
                    )}
                  </h2>
                  <p className="text-[12px] text-cream-600 mb-1.5">ID: {profile.id}</p>
                  <StarLevelDisplay level={level} />
                  {profile.signature && (
                    <p className="text-[13px] text-cream-500 italic leading-relaxed mt-1">"{profile.signature}"</p>
                  )}
                  {profile.tags && profile.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {profile.tags.map((tag: string, i: number) => (
                        <span key={tag} className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${TAG_COLORS[i % TAG_COLORS.length]}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {(profile.birthday || profile.height || profile.weight) && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {profile.birthday && (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-cream-100 text-cream-600 border border-cream-200">
                          <Cake size={11} className="text-warm-500" />{profile.birthday.slice(0, 10)}
                        </span>
                      )}
                      {profile.height && (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-cream-100 text-cream-600 border border-cream-200">
                          <Ruler size={11} className="text-sage-600" />{profile.height} cm
                        </span>
                      )}
                      {profile.weight && (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-cream-100 text-cream-600 border border-cream-200">
                          <Weight size={11} className="text-blue-500" />{profile.weight} kg
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Moments entry — 微信朋友圈预览 */}
            <div className="mx-4 mt-3 mb-1">
              <button
                onClick={() => navigate(`/user/${userId}/moments`)}
                className="w-full flex items-center gap-3 active:scale-[0.98] transition-transform py-3"
              >
                {/* 左侧标题 */}
                <div className="flex-shrink-0 flex flex-col items-start">
                  <span className="text-[14px] font-semibold" style={{ color: isLv30Dark ? styleP.previewText : '#2D1B1B' }}>
                    {profile?.gender === 1 ? '他的动态' : profile?.gender === 2 ? '她的动态' : '动态'}
                  </span>
                  {recentMoments.length === 0 && (
                    <span className="text-[10px] mt-0.5" style={{ color: isLv30Dark ? 'rgba(255,255,255,0.3)' : '#BBA0A0' }}>对方暂无动态</span>
                  )}
                </div>

                {/* 右侧预览卡片 */}
                <div className="flex-1 flex justify-end gap-1.5 min-w-0">
                  {Array.from({ length: 3 }).map((_, i) => {
                    const m = recentMoments[i];
                    if (!m) {
                      return (
                        <div key={`empty-${i}`} className="rounded-md flex-shrink-0" style={{ width: '52px', height: '52px', background: isLv30Dark ? 'rgba(255,255,255,0.04)' : '#F0EDE8' }} />
                      );
                    }
                    const imgs = Array.isArray(m.images) ? m.images : [];
                    const isTextOnly = imgs.length === 0 && !m.audio_url;
                    const textCardColor = ['#F5F0EB', '#F3EFFF', '#FFF0E5'][Math.abs(m.id || 0) % 3];
                    const textCardText = ['#3D2B1B', '#4A3D6B', '#8B4A3A'][Math.abs(m.id || 0) % 3];
                    return (
                      <div key={m.id} className="flex-shrink-0 rounded-md overflow-hidden" style={{ width: '52px', height: '52px' }}>
                        {isTextOnly ? (
                          <div style={{ width: '100%', height: '100%', background: textCardColor, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                            <span className="text-[8px] leading-tight text-center font-semibold line-clamp-3" style={{ color: textCardText }}>
                              {m.content?.slice(0, 20)}
                            </span>
                          </div>
                        ) : imgs.length > 0 ? (
                          <SafeImg src={imgs[0]?.startsWith('http') ? imgs[0] : `${apiBase}${imgs[0]}`} alt="" className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: isLv30Dark ? 'rgba(255,255,255,0.06)' : '#FFF0E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="text-[8px]" style={{ color: isLv30Dark ? 'rgba(255,255,255,0.3)' : '#BBA0A0' }}>语音</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className="flex items-center ml-1">
                    <ChevronRight size={14} color={isLv30Dark ? 'rgba(255,255,255,0.3)' : '#BBA0A0'} />
                  </div>
                </div>
              </button>
            </div>

            {/* Album preview */}
            {albums.length > 0 && (() => {
              const allPhotos = albums.flatMap(a => a.preview_photos);
              const displayPhotos = allPhotos.slice(0, 5);
              const remaining = allPhotos.length - 5;
              return (
                <div className="mx-4 mt-3 mb-3">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-[10px] font-bold uppercase tracking-[0.15em] ${isLv30Dark ? 'text-white/40' : 'text-warm-500'}`}>相册</h3>
                      <div className="h-px flex-1 bg-gradient-to-r from-current to-transparent" style={{ width: 40, opacity: isLv30Dark ? 0.2 : 1, color: isLv30Dark ? '#fff' : '#d4c4b0' }} />
                    </div>
                    <button
                      onClick={() => onClose ? setShowAlbum(true) : navigate(`/user/${userId}/album`, { state: { ownerLevel: level } })}
                      className={`text-[11px] font-semibold flex items-center gap-0.5 ${isLv30Dark ? 'text-white/50' : 'text-warm-500'}`}>
                      {albums.length} 个相册 <ChevronRight size={12} />
                    </button>
                  </div>
                  <div className="grid gap-[3px] rounded-xl overflow-hidden" style={{ gridTemplateColumns: '1.2fr 0.8fr 0.8fr', height: 120 }}>
                    {/* Left large photo */}
                    {displayPhotos[0] && (
                      <div className="row-span-2 bg-cream-200 overflow-hidden">
                        <RemoteImage src={displayPhotos[0]?.startsWith('http') ? displayPhotos[0] : `${apiBase}${displayPhotos[0]}`}
                          alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    {/* Right top photos */}
                    {[1, 2].map(i => displayPhotos[i] ? (
                      <div key={i} className="bg-cream-200 overflow-hidden">
                        <RemoteImage src={displayPhotos[i]?.startsWith('http') ? displayPhotos[i] : `${apiBase}${displayPhotos[i]}`}
                          alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : <div key={i} className="bg-cream-200" />)}
                    {/* Right bottom photos */}
                    {[3, 4].map(i => {
                      if (displayPhotos[i]) {
                        return (
                          <div key={i} className="bg-cream-200 overflow-hidden relative">
                            <RemoteImage src={displayPhotos[i]?.startsWith('http') ? displayPhotos[i] : `${apiBase}${displayPhotos[i]}`}
                              alt="" className="w-full h-full object-cover" />
                            {i === 4 && remaining > 0 && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span className="text-white text-[13px] font-bold">+{remaining}</span>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return <div key={i} className="bg-cream-200" />;
                    })}
                  </div>
                </div>
              );
            })()}

          </>
        )}

      </div>

      {/* 悬浮底部按钮 */}
      {profile && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-3 flex gap-3 backdrop-blur-sm"
          style={{ zIndex: zIndex + 1, background: styleP.bottomBarBg }}>
          {userId !== 9999 && (
            hasPendingRequest ? (
              <button disabled
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[14px] font-semibold text-cream-500 bg-cream-200 cursor-not-allowed">
                申请已发出，对方未处理
              </button>
            ) : (
              <button
                onClick={() => isFriendState ? setShowDeleteConfirm(true) : setShowAddFriendDialog(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[14px] font-semibold transition-all active:scale-[0.97] ${
                  isFriendState ? styleP.btnDelBg : styleP.btnBg
                }`}
              >
                {isFriendState ? <UserMinus size={16} /> : <UserPlus size={16} />}
                {isFriendState ? '删除好友' : '加好友'}
              </button>
            )
          )}
          <button
            onClick={handleSendMessage}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[14px] font-semibold active:scale-[0.97] transition-all ${
              styleP.btnMsgGradient
            }`}
          >
            <MessageCircle size={16} />
            发消息
          </button>
        </div>
      )}


      {/* Add Friend Dialog */}
      <AnimatePresence>
        {showAddFriendDialog && (
          <motion.div className="fixed inset-0 z-[300] flex items-center justify-center px-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddFriendDialog(false)} />
            <motion.div className="relative bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h3 className="text-base font-semibold text-cream-900">添加好友</h3>
                <button onClick={() => setShowAddFriendDialog(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream-100 transition-colors">
                  <X size={18} className="text-cream-500" />
                </button>
              </div>
              <div className="px-5 pb-3">
                <p className="text-sm text-cream-600 mb-3">发送验证消息给 {profile?.nickname}</p>
                <textarea value={friendMessage} onChange={(e) => setFriendMessage(e.target.value)}
                  placeholder="你好，我想加你为好友"
                  className="w-full h-24 px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 text-sm text-cream-800 placeholder:text-cream-400 resize-none focus:outline-none focus:ring-2 focus:ring-warm-300 focus:border-warm-400 transition-all" />
              </div>
              <div className="flex gap-3 px-5 pb-5">
                <button onClick={() => setShowAddFriendDialog(false)} className="flex-1 py-2.5 rounded-xl border border-cream-200 text-sm font-medium text-cream-700 hover:bg-cream-50 transition-colors">取消</button>
                <button onClick={handleAddFriend} disabled={sendingRequest} className="flex-1 py-2.5 rounded-xl bg-sage-500 text-white text-sm font-medium hover:bg-sage-600 transition-colors disabled:opacity-50">
                  {sendingRequest ? '发送中...' : '发送请求'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Friend Confirm */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div className="fixed inset-0 z-[300] flex items-center justify-center px-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteConfirm(false)} />
            <motion.div className="relative bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
              <div className="px-5 pt-6 pb-4 text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
                  <UserMinus size={22} className="text-red-500" />
                </div>
                <h3 className="text-base font-semibold text-cream-900 mb-2">删除好友</h3>
                <p className="text-sm text-cream-600">确定要删除好友 <span className="font-medium text-cream-800">{profile?.nickname}</span> 吗？</p>
              </div>
              <div className="flex gap-3 px-5 pb-5">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-cream-200 text-sm font-medium text-cream-700 hover:bg-cream-50 transition-colors">取消</button>
                <button onClick={handleDeleteFriend} disabled={friendLoading} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50">
                  {friendLoading ? '删除中...' : '确认删除'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div className="fixed top-20 left-1/2 -translate-x-1/2 z-[400] px-5 py-3 rounded-xl bg-cream-900/90 text-white text-sm font-medium shadow-lg"
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Album overlay (when used as overlay) */}
      <AnimatePresence>
        {showAlbum && (
          <UserAlbumPage overlayUserId={userId} onClose={() => setShowAlbum(false)} zIndex={(zIndex ?? 200) + 20} ownerLevel={level} />
        )}
      </AnimatePresence>

      {/* Banner image viewer */}
      {showBannerViewer && profile?.banner_image && (
        <ImageViewer
          images={[profile.banner_image?.startsWith('http') ? profile.banner_image : `${apiBase}${profile.banner_image}`]}
          initialIndex={0}
          onClose={() => setShowBannerViewer(false)}
        />
      )}

    </motion.div>
  );
}
