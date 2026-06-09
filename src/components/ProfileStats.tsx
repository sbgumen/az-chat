import { useNavigate } from 'react-router-dom';
import { SafeImg } from './SafeImg';

interface ProfileStatsProps {
  avatar: string;
  nickname: string;
  level: number;
  signature: string;
  stats: {
    momentCount: number;
    followers: number;
    following: number;
    likesReceived: number;
  };
  isOwn?: boolean;
  isFollowing?: boolean;
  onFollow?: () => void;
  onEditProfile?: () => void;
  onPublish?: () => void;
  onMore?: () => void;
  hideMomentCount?: boolean;
  targetUserId?: number; // 查看他人资料时的 target user id
}

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;

export function ProfileStats({
  avatar, nickname, level, signature, stats,
  isOwn, isFollowing, onFollow, onEditProfile, onPublish, onMore, hideMomentCount,
  targetUserId,
}: ProfileStatsProps) {
  const getUrl = (s: string) => s?.startsWith('http') ? s : s?.startsWith('/') ? `${apiBase}${s}` : s;
  const navigate = useNavigate();

  const navTo = (type: 'following' | 'followers') => {
    if (targetUserId) {
      navigate(`/user/${targetUserId}/follow/${type}`);
    } else {
      navigate(`/profile/follow/${type}`);
    }
  };

  return (
    <div
      className="flex-shrink-0 mx-4 mb-1 rounded-[20px] overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #FFF0E5 0%, #FFFBFA 100%)' }}
    >
      <div className="flex items-center gap-4 px-4 pt-5 pb-3">
        <div className="w-[72px] h-[72px] rounded-full flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #FF6B6B, #FFB347)', padding: '2px' }}>
          <div className="w-full h-full rounded-full bg-white overflow-hidden">
            <SafeImg src={getUrl(avatar)} alt="" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="flex-1 flex justify-around text-center">
          {!hideMomentCount && (
            <div className="flex flex-col items-center">
              <span className="text-[20px] font-extrabold text-[#2D1B1B] leading-tight">{stats.momentCount}</span>
              <span className="text-[10px] text-[#BBA0A0] mt-0.5">动态</span>
            </div>
          )}
          <div className="flex flex-col items-center cursor-pointer active:opacity-70" onClick={() => navTo('followers')}>
            <span className="text-[20px] font-extrabold text-[#2D1B1B] leading-tight">{stats.followers}</span>
            <span className="text-[10px] text-[#BBA0A0] mt-0.5">粉丝</span>
          </div>
          <div className="flex flex-col items-center cursor-pointer active:opacity-70" onClick={() => navTo('following')}>
            <span className="text-[20px] font-extrabold text-[#2D1B1B] leading-tight">{stats.following}</span>
            <span className="text-[10px] text-[#BBA0A0] mt-0.5">关注</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[20px] font-extrabold text-[#2D1B1B] leading-tight">{stats.likesReceived}</span>
            <span className="text-[10px] text-[#BBA0A0] mt-0.5">获赞</span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-1">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[15px] font-extrabold text-[#2D1B1B] truncate max-w-[140px]">{nickname}</span>
          {level > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-[#FFF0E5] text-[#FF6B6B] flex-shrink-0">
              LV.{level}
            </span>
          )}
        </div>
        <p className="text-[11px] text-[#BBA0A0] truncate leading-relaxed">{signature || '这个人很懒，什么都没写~'}</p>
      </div>

      <div className="flex gap-2 px-4 py-3 pb-4">
        {isOwn ? (
          <>
            <button
              onClick={onEditProfile}
              className="flex-1 py-2 rounded-full text-[12px] font-semibold text-[#2D1B1B] bg-[#F5F0F0] active:scale-95 transition-transform"
            >
              编辑资料
            </button>
            <button
              onClick={onPublish}
              className="flex-1 py-2 rounded-full text-[12px] font-semibold text-white active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg, #FF6B6B, #FFB347)' }}
            >
              发布动态
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onFollow}
              className="flex-1 py-2 rounded-full text-[12px] font-semibold text-white active:scale-95 transition-transform"
              style={isFollowing
                ? { background: '#F5F0F0', color: '#BBA0A0' }
                : { background: 'linear-gradient(135deg, #FF6B6B, #FFB347)' }}
            >
              {isFollowing ? '已关注' : '关注'}
            </button>
            <button
              onClick={onMore}
              className="w-10 h-[36px] rounded-full bg-[#F5F0F0] flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
            >
              <span className="text-[16px] text-[#BBA0A0] leading-none">...</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
