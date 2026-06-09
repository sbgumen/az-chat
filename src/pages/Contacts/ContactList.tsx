import { RemoteImage } from '../../components/RemoteImage';
import { useState, useEffect } from 'react';
import { Search, UserPlus, Users, MessageSquarePlus, LayoutGrid, ChevronRight } from 'lucide-react';
import { getFriends, getFriendRequests } from '../../api/contacts';
import { getGroupRequests } from '../../api/groups';
import { getConversations } from '../../api/messages';
import { useSocket } from '../../hooks/useSocket';
import { useOnlineStatus } from '../../context/OnlineStatusContext';
import { OnlineStatusDot } from '../../components/OnlineStatusDot';
import { CardDecoration } from '../../components/CardDecoration';
import { useNavigate } from 'react-router-dom';

interface Friend {
  id: number;
  nickname: string;
  avatar: string;
  gender: number;
  phone: string;
}

interface FriendRequest {
  id: number;
  from_user_id: number;
  nickname: string;
  avatar: string;
  message: string;
  status: number;
  created_at: string;
}

const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
const getAvatar = (avatar: string) => avatar?.startsWith('http') ? avatar : `${apiBase}${avatar}`;

export function ContactList() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [groupPending, setGroupPending] = useState(0);
  const [recentIds, setRecentIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const { on } = useSocket();
  const { isOnline, getLastSeenText, fetchStatuses } = useOnlineStatus();

  const handleFriendClick = (friend: Friend) => {
    navigate(`/messages/chat/${friend.id}`, {
      state: {
        conversation: {
          id: `c_${friend.id}`,
          user: {
            id: String(friend.id),
            name: friend.nickname,
            avatar: getAvatar(friend.avatar),
          },
          lastMessage: { id: '', senderId: '', content: '', timestamp: '', type: 'text' },
          unreadCount: 0,
        }
      }
    });
  };

  const fetchData = async () => {
    try {
      const [friendsRes, requestsRes, groupReqRes, convsRes]: any[] = await Promise.all([
        getFriends(), getFriendRequests(), getGroupRequests(), getConversations()
      ]);
      if (friendsRes.code === 0) {
        const list: Friend[] = friendsRes.data || [];
        setFriends(list);
        fetchStatuses(list.map(f => f.id));
        // 最近互动：从私聊会话中提取最近聊过的好友 ID（排除系统 bot）
        const friendIds = new Set(list.map(f => f.id));
        const convIds = (convsRes?.code === 0 ? convsRes.data : [])
          .map((c: any) => c.user_id)
          .filter((id: number) => friendIds.has(id));
        setRecentIds(convIds);
      }
      if (requestsRes.code === 0) setRequests(requestsRes.data || []);
      if (groupReqRes.code === 0) setGroupPending((groupReqRes.data || []).filter((r: any) => r.status === 0).length);
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const unsub = on('friend:request', () => { fetchData(); });
    return unsub;
  }, [on]);

  useEffect(() => {
    const unsub = on('friend:accepted', () => { fetchData(); });
    return unsub;
  }, [on]);

  const pendingCount = requests.filter(r => r.status === 0).length;
  const totalPending = pendingCount + groupPending;
  const onlineFriends = friends.filter(f => isOnline(f.id));
  // 最近互动：排除在线好友（他们已在在线区展示）
  const onlineIdSet = new Set(onlineFriends.map(f => f.id));
  const recentFriends = recentIds
    .filter(id => !onlineIdSet.has(id))
    .map(id => friends.find(f => f.id === id))
    .filter(Boolean) as Friend[];

  return (
    <div className="h-full flex flex-col bg-cream-100">
      {/* Header */}
      <header className="px-5 pt-[calc(var(--status-bar-height,0px)+20px)] pb-3 flex-shrink-0">
        <h1 className="font-display text-2xl font-semibold text-cream-900 mb-4">联系人</h1>

        {/* 搜索栏 — B风格：无边框，阴影替代 */}
        <div
          className="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-full shadow-sm cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => navigate('/messages/search')}
        >
          <Search size={16} className="text-cream-500 flex-shrink-0" />
          <input type="text" placeholder="搜索联系人..." readOnly className="flex-1 text-sm text-cream-900 placeholder:text-cream-400 bg-transparent cursor-pointer outline-none" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-[120px]">
        {/* 快捷操作 — A风格：2x2 网格，无边框，渐变背景 */}
        <div className="grid grid-cols-2 gap-2.5 mt-3 mb-5">
          <button
            onClick={() => navigate('/contacts/add')}
            className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-gradient-to-br from-warm-50 to-warm-100 active:scale-[0.97] transition-transform relative overflow-hidden"
          >
            <CardDecoration pattern="circles" color="#f59e0b" />
            <div className="w-9 h-9 rounded-xl bg-warm-500 flex items-center justify-center flex-shrink-0 shadow-sm relative z-10">
              <UserPlus size={17} className="text-white" />
            </div>
            <div className="flex-1 text-left min-w-0 relative z-10">
              <span className="text-[13px] font-semibold text-cream-900">添加好友/群</span>
              <span className="block text-[10px] text-cream-600">搜索用户或群聊</span>
            </div>
          </button>

          <button
            onClick={() => navigate('/contacts/create-group')}
            className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 active:scale-[0.97] transition-transform relative overflow-hidden"
          >
            <CardDecoration pattern="waves" color="#3b82f6" />
            <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm relative z-10">
              <MessageSquarePlus size={17} className="text-white" />
            </div>
            <div className="flex-1 text-left min-w-0 relative z-10">
              <span className="text-[13px] font-semibold text-cream-900">创建群聊</span>
              <span className="block text-[10px] text-cream-600">发起群聊</span>
            </div>
          </button>

          <button
            onClick={() => navigate('/contacts/my-groups')}
            className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 active:scale-[0.97] transition-transform relative overflow-hidden"
          >
            <CardDecoration pattern="dots" color="#a855f7" />
            <div className="w-9 h-9 rounded-xl bg-purple-500 flex items-center justify-center flex-shrink-0 shadow-sm relative z-10">
              <LayoutGrid size={17} className="text-white" />
            </div>
            <div className="flex-1 text-left min-w-0 relative z-10">
              <span className="text-[13px] font-semibold text-cream-900">我的群聊</span>
              <span className="block text-[10px] text-cream-600">查看群组</span>
            </div>
          </button>

          <button
            onClick={() => navigate('/contacts/requests')}
            className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 active:scale-[0.97] transition-transform relative overflow-hidden"
          >
            <CardDecoration pattern="crosshatch" color="#10b981" />
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-sm relative z-10">
              <Users size={17} className="text-white" />
            </div>
            <div className="flex-1 text-left min-w-0 relative z-10">
              <span className="text-[13px] font-semibold text-cream-900">申请通知</span>
              <span className="block text-[10px] text-cream-600">
                {totalPending > 0 ? `${totalPending}条待处理` : '暂无新申请'}
              </span>
            </div>
            {totalPending > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center z-10">
                {totalPending > 99 ? '99+' : totalPending}
              </span>
            )}
          </button>
        </div>

        {/* 加载态 */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-1 py-2 rounded-xl animate-pulse">
                <div className="w-[42px] h-[42px] rounded-xl bg-cream-300 flex-shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="h-3.5 bg-cream-300 rounded-full w-1/3" />
                  <div className="h-3 bg-cream-200 rounded-full w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-cream-500">
            <Users size={40} className="text-cream-300 mb-3" />
            <p className="text-sm">暂无联系人</p>
            <p className="text-xs mt-1">点击添加好友开始交友吧</p>
          </div>
        ) : (
          <>
            {/* 在线好友 — B风格：横向滚动，大号方形头像，彩色竖线标题 */}
            {onlineFriends.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="block w-[3px] h-4 rounded-sm bg-gradient-to-b from-warm-500 to-warm-600" />
                    <span className="text-[14px] font-semibold text-cream-900">在线好友</span>
                  </div>
                  <span className="text-[11px] text-cream-500">{onlineFriends.length}人在线</span>
                </div>
                <div className="flex gap-3.5 overflow-x-auto pb-2 px-1 scrollbar-hide">
                  {onlineFriends.map(friend => (
                    <button
                      key={friend.id}
                      className="flex flex-col items-center gap-1.5 flex-shrink-0 focus:outline-none"
                      onClick={() => handleFriendClick(friend)}
                    >
                      <div className="relative flex-shrink-0">
                        <RemoteImage
                          src={getAvatar(friend.avatar)}
                          alt={friend.nickname}
                          className="w-14 h-14 rounded-2xl object-cover bg-cream-300 shadow-sm"
                        />
                        <OnlineStatusDot userId={friend.id} size={13} borderWidth={2.5} />
                      </div>
                      <span className="text-[11px] font-medium text-cream-900 max-w-[56px] truncate">{friend.nickname}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 最近互动 — 离线但最近聊过的好友 */}
            {recentFriends.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="block w-[3px] h-4 rounded-sm bg-gradient-to-b from-blue-400 to-blue-500" />
                    <span className="text-[14px] font-semibold text-cream-900">最近互动</span>
                  </div>
                  <span className="text-[11px] text-cream-500">{recentFriends.length}人</span>
                </div>
                <div className="flex gap-3.5 overflow-x-auto pb-2 px-1 scrollbar-hide">
                  {recentFriends.map(friend => (
                    <button
                      key={friend.id}
                      className="flex flex-col items-center gap-1.5 flex-shrink-0 focus:outline-none"
                      onClick={() => handleFriendClick(friend)}
                    >
                      <div className="relative flex-shrink-0">
                        <RemoteImage
                          src={getAvatar(friend.avatar)}
                          alt={friend.nickname}
                          className="w-14 h-14 rounded-2xl object-cover bg-cream-300 shadow-sm opacity-60"
                        />
                        <OnlineStatusDot userId={friend.id} size={13} borderWidth={2.5} />
                      </div>
                      <span className="text-[11px] font-medium text-cream-600 max-w-[56px] truncate">{friend.nickname}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 全部联系人 — B风格：竖列表，灰色竖线标题 */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="block w-[3px] h-4 rounded-sm bg-gradient-to-b from-cream-400 to-cream-500" />
                  <span className="text-[14px] font-semibold text-cream-900">全部联系人</span>
                </div>
                <span className="text-[11px] text-cream-500">{friends.length}位好友</span>
              </div>

              <div className="flex flex-col">
                {friends.map(friend => {
                  const online = isOnline(friend.id);
                  return (
                    <button
                      key={friend.id}
                      className="flex items-center gap-3 px-1 py-2.5 rounded-xl active:bg-cream-200 transition-colors text-left"
                      onClick={() => handleFriendClick(friend)}
                    >
                      <div className="relative flex-shrink-0">
                        <RemoteImage
                          src={getAvatar(friend.avatar)}
                          alt={friend.nickname}
                          className={`w-[42px] h-[42px] rounded-xl object-cover bg-cream-300 ${!online ? 'opacity-60' : ''}`}
                        />
                        <OnlineStatusDot userId={friend.id} size={11} borderWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0 flex items-center justify-between">
                        <div className="flex flex-col min-w-0">
                          <span className={`text-[13px] font-semibold truncate ${online ? 'text-cream-900' : 'text-cream-600'}`}>
                            {friend.nickname}
                          </span>
                          <span className={`text-[11px] ${online ? 'text-sage-500' : 'text-cream-400'}`}>
                            {online ? '在线' : getLastSeenText(friend.id)}
                          </span>
                        </div>
                        <ChevronRight size={15} className="text-cream-300 flex-shrink-0 ml-2" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
