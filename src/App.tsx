import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { OnlineStatusProvider } from './context/OnlineStatusContext'
import { useSocket } from './hooks/useSocket'
import { IntroAnimation, useIntroAnimation } from './components/IntroAnimation'
import { Layout } from './components/Layout/Layout'
import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { MessageList } from './pages/Messages/MessageList'
import { ContactList } from './pages/Contacts/ContactList'
import { MomentsFeed } from './pages/Moments/MomentsFeed'
import { PublishMoment } from './pages/Moments/PublishMoment'
import { MomentDetail } from './pages/Moments/MomentDetail'
import { TopicPage } from './pages/Moments/TopicPage'
import { MomentNotifications } from './pages/Moments/MomentNotifications'
import { MyMoments } from './pages/Moments/MyMoments'
import { MomentSearchPage } from './pages/Moments/SearchPage'
import { UserMomentsPage } from './pages/Moments/UserMomentsPage'
import { ProfilePage } from './pages/Profile/ProfilePage'
import { ChatRoom } from './pages/Messages/ChatRoom'
import { GroupChatRoom } from './pages/Messages/GroupChatRoom'
import { LoginPage } from './pages/Login/LoginPage'
import { AddPage } from './pages/Contacts/AddPage'
import { FriendRequestsPage } from './pages/Contacts/FriendRequestsPage'
import { CreateGroupPage } from './pages/Groups/CreateGroupPage'
import { GroupInfoPage } from './pages/Groups/GroupInfoPage'
import { GroupManagePage } from './pages/Groups/GroupManagePage'
import { GroupNoticePage } from './pages/Groups/GroupNoticePage'
import { NoticeDetailPage } from './pages/Groups/NoticeDetailPage'
import { NoticeComposePage } from './pages/Groups/NoticeComposePage'
import { GroupDetailPage } from './pages/Groups/GroupDetailPage'
import { MyGroupsPage } from './pages/Groups/MyGroupsPage'
import { BannerSelectPage } from './pages/Profile/BannerSelectPage'
import { PersonalizationPage } from './pages/Profile/PersonalizationPage'
import { HomeStylePage } from './pages/Profile/HomeStylePage'
import { ChatStylePage } from './pages/Profile/ChatStylePage'
import { EditProfilePage } from './pages/Profile/EditProfilePage'
import { SettingsPage } from './pages/Profile/SettingsPage'
import { PrivacySettingsPage } from './pages/Profile/PrivacySettingsPage'

import { LevelPage } from './pages/Profile/LevelPage'
import { FollowListPage } from './pages/Profile/FollowListPage'
import { UserFollowListPage } from './pages/Profile/UserFollowListPage'
import { UserProfilePage } from './pages/Profile/UserProfilePage'
import { FavoritesPage } from './pages/Profile/FavoritesPage'
import { MyAlbumPage } from './pages/Profile/MyAlbumPage'
import { CoinsPage } from './pages/Profile/CoinsPage'
import { UserAlbumPage, UserAlbumDetailPage } from './pages/Profile/UserAlbumPage'
import { LegalPage } from './pages/Profile/LegalPage'
import { ChatSettingsPage } from './pages/Messages/ChatSettingsPage'
import { SearchPage } from './pages/Messages/SearchPage'
import { AccountSecurityPage } from './pages/Profile/AccountSecurityPage'
import { AboutPage } from './pages/Profile/AboutPage'
import { ContactPage } from './pages/Profile/ContactPage'
import { HelpPage } from './pages/Profile/HelpPage'
import { MemberManagePage } from './pages/Groups/MemberManagePage'
import { MemberListPage } from './pages/Groups/MemberListPage'
import { InvitePage } from './pages/Groups/InvitePage'
import { AdminLayout } from './pages/Admin/AdminLayout'
import { DashboardPage } from './pages/Admin/DashboardPage'
import { AdminSettingsPage } from './pages/Admin/AdminSettingsPage'
import { AdminUsersPage } from './pages/Admin/AdminUsersPage'
import { AdminGroupsPage } from './pages/Admin/AdminGroupsPage'
import { AdminLevelPage } from './pages/Admin/AdminLevelPage'
import { AdminCaptchaPage } from './pages/Admin/AdminCaptchaPage'
import { AdminMomentsPage } from './pages/Admin/AdminMomentsPage'
import { AdminSigninPage } from './pages/Admin/AdminSigninPage'
import { AdminPresetsPage } from './pages/Admin/AdminPresetsPage'
import { AdminTopicsPage } from './pages/Admin/AdminTopicsPage'
import { AdminLoginConfigPage } from './pages/Admin/AdminLoginConfigPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, ready } = useAuth()
  if (!ready) return <div className="min-h-screen bg-cream-100 flex items-center justify-center"><div className="w-8 h-8 border-2 border-warm-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { token, updateUser } = useAuth()
  const { on, disconnect, reconnect } = useSocket()
  const navigate = useNavigate()

  // Android 返回键
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) navigate(-1);
    });
    return () => { listener.then(h => h.remove()); };
  }, [navigate])

  // App 前后台切换：后台时断开 Socket（让后端立即触发 FCM），前台时重连
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !token) return;
    const listener = CapApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) reconnect();
      else disconnect();
    });
    return () => { listener.then(h => h.remove()); };
  }, [token, disconnect, reconnect])

  useEffect(() => {
    if (!token || !Capacitor.isNativePlatform()) return;
    const BASE = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
    const upload = (regId: string) => {
      fetch(`${BASE}/api/user/fcm-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ token: regId }),
      });
    };
    if ((window as any).jpushRegId) upload((window as any).jpushRegId);
    // 监听后续注册事件
    const handler = (e: Event) => upload((e as CustomEvent).detail);
    window.addEventListener('jpush-registration', handler);
    // 轮询兜底：每2秒检查一次，最多检查10次
    let tries = 0;
    const poll = setInterval(() => {
      tries++;
      const id = (window as any).jpushRegId;
      if (id) { upload(id); clearInterval(poll); }
      if (tries >= 10) clearInterval(poll);
    }, 2000);
    return () => { window.removeEventListener('jpush-registration', handler); clearInterval(poll); };
  }, [token])

  useEffect(() => {
    if (!token) return;
    return on('exp:gained', ({ level, coins }: { level: number; coins: number }) => {
      updateUser({ level, coins });
    });
  }, [token, on, updateUser])

  return (
    <>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/messages" replace /> : <LoginPage />} />
        <Route path="/legal/:type" element={<LegalPage />} />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/messages" replace />} />
          <Route path="/messages" element={<MessageList />} />
          <Route path="/contacts" element={<ContactList />} />
          <Route path="/moments" element={<MomentsFeed />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Moments sub-pages */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/moments/publish" element={<PublishMoment />} />
          <Route path="/moments/:momentId" element={<MomentDetail />} />
          <Route path="/moments/notifications" element={<MomentNotifications />} />
          <Route path="/moments/mine" element={<MyMoments />} />
          <Route path="/topics/:topicName" element={<TopicPage />} />
          <Route path="/moments/search" element={<MomentSearchPage />} />
          <Route path="/user/:userId/moments" element={<UserMomentsPage />} />
        </Route>

        {/* Sub-pages rendered as full-screen overlays on top of Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/messages/chat/:userId" element={<ChatRoom />} />
          <Route path="/messages/chat/:userId/settings" element={<ChatSettingsPage />} />
          <Route path="/messages/group/:groupId" element={<GroupChatRoom />} />
          <Route path="/messages/group/:groupId/info" element={<GroupInfoPage />} />
          <Route path="/messages/group/:groupId/info/manage" element={<GroupManagePage />} />
          <Route path="/messages/group/:groupId/info/notices" element={<GroupNoticePage />} />
          <Route path="/messages/group/:groupId/info/notices/compose" element={<NoticeComposePage />} />
          <Route path="/messages/group/:groupId/info/notices/compose/:noticeId" element={<NoticeComposePage />} />
          <Route path="/messages/group/:groupId/info/notices/:noticeId" element={<NoticeDetailPage />} />
          <Route path="/messages/group/:groupId/detail" element={<GroupDetailPage />} />
          <Route path="/messages/group/:groupId/members" element={<MemberListPage />} />
          <Route path="/messages/group/:groupId/member/:userId" element={<MemberManagePage />} />
          <Route path="/messages/group/:groupId/invite" element={<InvitePage />} />
          <Route path="/messages/search" element={<SearchPage />} />
          <Route path="/messages/add" element={<AddPage />} />
          <Route path="/messages/create-group" element={<CreateGroupPage />} />
          <Route path="/contacts/add" element={<AddPage />} />
          <Route path="/contacts/requests" element={<FriendRequestsPage />} />
          <Route path="/contacts/my-groups" element={<MyGroupsPage />} />
          <Route path="/contacts/create-group" element={<CreateGroupPage />} />
          <Route path="/profile/personalization" element={<PersonalizationPage />} />
          <Route path="/profile/personalization/style" element={<HomeStylePage />} />
          <Route path="/profile/personalization/chat-style" element={<ChatStylePage />} />
          <Route path="/profile/personalization/banner" element={<BannerSelectPage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/profile/settings" element={<SettingsPage />} />
          <Route path="/profile/settings/privacy" element={<PrivacySettingsPage />} />
          <Route path="/profile/security" element={<AccountSecurityPage />} />
          <Route path="/profile/about" element={<AboutPage />} />
          <Route path="/profile/contact" element={<ContactPage />} />
          <Route path="/profile/help" element={<HelpPage />} />
          <Route path="/profile/level" element={<LevelPage />} />
          <Route path="/profile/follow/:mode" element={<FollowListPage />} />
          <Route path="/profile/favorites" element={<FavoritesPage />} />
          <Route path="/profile/album" element={<MyAlbumPage />} />
          <Route path="/profile/coins" element={<CoinsPage />} />
          <Route path="/user/:userId" element={<UserProfilePage />} />
          <Route path="/user/:userId/follow/:mode" element={<UserFollowListPage />} />
          <Route path="/user/:userId/album" element={<UserAlbumPage />} />
          <Route path="/user/:userId/album/:albumId" element={<UserAlbumDetailPage />} />
        </Route>

        {/* Admin routes */}
        <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route path="/admin" element={<DashboardPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/groups" element={<AdminGroupsPage />} />
          <Route path="/admin/moments" element={<AdminMomentsPage />} />
          <Route path="/admin/level" element={<AdminLevelPage />} />
          <Route path="/admin/signin" element={<AdminSigninPage />} />
          <Route path="/admin/presets" element={<AdminPresetsPage />} />
          <Route path="/admin/topics" element={<AdminTopicsPage />} />
          <Route path="/admin/captcha" element={<AdminCaptchaPage />} />
          <Route path="/admin/login-config" element={<AdminLoginConfigPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/messages" replace />} />
      </Routes>
    </>
  )
}

function App() {
  const { show, done } = useIntroAnimation();
  const [appName, setAppName] = useState(() => localStorage.getItem('az_sysname') || 'AZ-Chat');

  useEffect(() => {
    import('./api/admin').then(({ adminApi }) => {
      adminApi.getPublicSettings().then((r: any) => {
        if (r?.code !== 0 || !r.data) return;
        if (r.data.system_name) {
          setAppName(r.data.system_name);
          localStorage.setItem('az_sysname', r.data.system_name);
          document.title = r.data.system_name;
        }
        if (r.data.system_logo) {
          localStorage.setItem('az_syslogo', r.data.system_logo);
          // 动态更新 favicon
          const API_BASE = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5001`;
          const logoUrl = r.data.system_logo.startsWith('http') ? r.data.system_logo : `${API_BASE}${r.data.system_logo}`;
          let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
          if (link) link.href = logoUrl;
        }
      }).catch(() => {});
    });
  }, []);

  return (
    <AuthProvider>
      <OnlineStatusProvider>
        {show && <IntroAnimation onDone={done} appName={appName} />}
        <AppRoutes />
      </OnlineStatusProvider>
    </AuthProvider>
  )
}

export default App
