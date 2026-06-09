import { useCallback, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { TabBar } from '../TabBar/TabBar';
import { SideNav } from '../NavBar/SideNav';
import { getConversations, getGroupConversations } from '../../api/messages';
import { getUnreadNotificationCount } from '../../api/moments';
import { getFollowFeedUnread } from '../../api/user';
import { getFriendRequests } from '../../api/contacts';
import { getMyGroupRequests } from '../../api/groups';
import { useSocket } from '../../hooks/useSocket';
import { NotificationToast } from '../NotificationToast';
import { useStatusBarColor } from '../../hooks/useStatusBarColor';
import { useState, useMemo } from 'react';
import type { TabType } from '../../types';

const TAB_ROUTES: Record<string, TabType> = {
  '/messages': 'messages',
  '/contacts': 'contacts',
  '/moments': 'moments',
  '/profile': 'profile',
}

const TAB_PATHS = Object.keys(TAB_ROUTES)

export function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { on } = useSocket()
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [momentsUnread, setMomentsUnread] = useState(0)
  const [followUnread, setFollowUnread] = useState(0)
  const [contactsUnread, setContactsUnread] = useState(0)

  const activeTab: TabType = TAB_ROUTES[location.pathname] ?? 'messages'
  const showTabBar = TAB_PATHS.includes(location.pathname)

  // 状态栏自适应主页面颜色
  const tabBarColor = useMemo(() => ({
    messages: '#F5F0EB',
    contacts: '#FDFBF7',
    moments: '#FFFBFA',
    profile: '#FDFBF7',
  } as Record<string, string>), []);
  useStatusBarColor(tabBarColor[activeTab] || '#FDFBF7');

  const fetchMomentsUnread = useCallback(async () => {
    try {
      const [notifRes, followRes] = await Promise.all([
        getUnreadNotificationCount(),
        getFollowFeedUnread(),
      ]);
      if ((notifRes as any).code === 0) setMomentsUnread((notifRes as any).data?.total || 0);
      if ((followRes as any).code === 0) setFollowUnread((followRes as any).data?.count || 0);
    } catch (e) { /* ignore */ }
  }, [])

  const fetchUnread = useCallback(async () => {
    try {
      const [pRes, gRes]: any[] = await Promise.all([
        getConversations(),
        getGroupConversations(),
      ]);
      let total = 0;
      if (pRes.code === 0) total += (pRes.data || []).reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0);
      if (gRes.code === 0) total += (gRes.data || []).reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0);
      setUnreadMessages(total);
    } catch (e) { /* ignore */ }
  }, [])

  const fetchContactsUnread = useCallback(async () => {
    try {
      const [frRes, grRes]: any[] = await Promise.all([
        getFriendRequests(),
        getMyGroupRequests(),
      ]);
      let total = 0;
      if (frRes.code === 0) total += (frRes.data || []).filter((r: any) => r.status === 0).length;
      if (grRes.code === 0) total += (grRes.data || []).filter((r: any) => r.status === 0).length;
      setContactsUnread(total);
    } catch {}
  }, [])

  useEffect(() => { fetchUnread(); fetchMomentsUnread(); fetchContactsUnread(); }, [fetchUnread, fetchMomentsUnread, fetchContactsUnread])

  useEffect(() => {
    const unsub1 = on('message:receive', () => { fetchUnread() })
    const unsub2 = on('message:sent', () => { fetchUnread() })
    const unsub3 = on('message:read', () => { fetchUnread() })
    const unsub4 = on('group:message:receive', () => { fetchUnread() })
    const unsub5 = on('friend:request', () => { fetchContactsUnread() })
    const unsub6 = on('friend:accepted', () => { fetchContactsUnread() })
    const unsub7 = on('group:request', () => { fetchContactsUnread() })
    const unsub8 = on('album:new_comment', () => { window.dispatchEvent(new CustomEvent('album_unread_update')) })
    const unsub9 = on('album:new_favorite', () => { window.dispatchEvent(new CustomEvent('album_unread_update')) })
    const unsubA = on('moment:notification', () => { fetchMomentsUnread() })
    const unsubB = on('moment:new', () => { fetchMomentsUnread() })
    const unsubC = on('follow_feed_unread_update', (data: any) => {
      if (typeof data?.count === 'number') setFollowUnread(data.count);
      else fetchMomentsUnread();
    })
    const handleUnreadUpdate = () => fetchMomentsUnread();
    const handleFollowClear = () => setFollowUnread(0);
    window.addEventListener('moments_unread_update', handleUnreadUpdate);
    window.addEventListener('follow_unread_clear', handleFollowClear);
    window.addEventListener('messages_unread_update', fetchUnread);
    window.addEventListener('contacts_unread_update', fetchContactsUnread);
    window.addEventListener('contacts_unread_clear', () => setContactsUnread(0));
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); unsub7(); unsub8(); unsub9(); unsubA(); unsubB(); unsubC(); window.removeEventListener('moments_unread_update', handleUnreadUpdate); window.removeEventListener('follow_unread_clear', handleFollowClear); window.removeEventListener('messages_unread_update', fetchUnread); window.removeEventListener('contacts_unread_update', fetchContactsUnread); }
  }, [on, fetchUnread, fetchMomentsUnread])

  const handleTabChange = (tab: TabType) => {
    navigate(`/${tab}`)
  }

  // 合并总数给 TabBar
  const momentsTotalUnread = momentsUnread + followUnread;

  return (
    <div className={`w-full h-screen h-[100dvh] flex overflow-hidden ${isMobile ? 'flex-col' : 'flex-row'}`}>
      <NotificationToast />
      {!isMobile && (
        <SideNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          unreadMessages={unreadMessages}
          momentsUnread={momentsTotalUnread}
          contactsUnread={contactsUnread}
        />
      )}

      <main className="flex-1 min-h-0 overflow-hidden relative h-full">
        <div className="h-full">
          <Outlet />
        </div>
      </main>

      {isMobile && showTabBar && (
        <TabBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          unreadMessages={unreadMessages}
          momentsUnread={momentsTotalUnread}
          contactsUnread={contactsUnread}
        />
      )}
    </div>
  )
}
