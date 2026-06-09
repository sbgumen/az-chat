import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, BrowserRouter } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { PushNotifications, type PushNotificationActionPerformed } from '@capacitor/push-notifications'

import './styles/global.css'
import App from './App.tsx'

// standalone 模式下用 HashRouter，支持 file:// 直接打开
declare const __STANDALONE__: boolean | undefined
const Router = typeof __STANDALONE__ !== 'undefined' ? HashRouter : BrowserRouter

// 推送通知点击跳转
function handlePushOpen(notification: PushNotificationActionPerformed | any) {
  const raw = notification?.notification?.data || notification?.detail || {};
  // JPush extras 可能是 JSON 字符串
  let extras: any = raw.extras || raw;
  if (typeof extras === 'string') {
    try { extras = JSON.parse(extras); } catch { extras = { type: extras }; }
  }
  const type = extras.type || raw.type;
  const isHash = typeof __STANDALONE__ !== 'undefined';

  const nav = (path: string) => {
    setTimeout(() => {
      if (isHash) window.location.hash = '#' + path;
      else window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, 300);
  };

  switch (type) {
    case 'private':
      if (extras.senderId) nav(`/messages/${extras.senderId}`);
      else nav('/messages');
      break;
    case 'group':
    case 'group_mention':
      if (extras.groupId) nav(`/messages/group/${extras.groupId}`);
      else nav('/messages');
      break;
    case 'friend_request':
      nav('/contacts/friend-requests');
      break;
    case 'album_comment':
    case 'album_favorite':
      if (extras.albumId) nav(`/profile/albums/${extras.albumId}`);
      break;
    default:
      nav('/messages');
  }
}

async function initApp() {
  if (Capacitor.isNativePlatform()) {
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Light });
    try { await StatusBar.setBackgroundColor({ color: '#00000000' }); } catch(_) {}

    // 读取真实状态栏高度并设到 CSS 变量
    try {
      const info = await StatusBar.getInfo();
      if (info.height > 0) {
        document.documentElement.style.setProperty('--status-bar-height', `${info.height}px`);
      }
    } catch(_) {}

    // 申请推送通知权限
    try {
      const { receive } = await PushNotifications.requestPermissions();
      if (receive === 'granted') await PushNotifications.register();
    } catch(_) {}

    // 推送通知点击跳转（Capacitor 通道 + JPush 原生通道）
    try {
      PushNotifications.addListener('pushNotificationActionPerformed', handlePushOpen);
    } catch(_) {}
    // JPush 原生层通过 evaluateJavascript 派发的自定义事件
    const jpushHandler = (e: Event) => {
      handlePushOpen({ notification: { data: (e as CustomEvent).detail } } as any);
    };
    window.addEventListener('push-notification-opened', jpushHandler);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Router>
        <App />
      </Router>
    </StrictMode>,
  )
}

initApp();
