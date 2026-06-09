# 在线状态功能 — 设计文档

**日期**: 2026-06-02  
**状态**: 待实现

---

## 1. 需求概述

当前项目后端已通过 Socket.IO 实现了在线/离线跟踪和广播，但前端未监听相关事件，所有页面的在线状态均为硬编码 `status: 'online'`。

本次改造目标：
- 前端监听 Socket 实时在线状态并展示
- 后端支持"最后在线时间"和"隐身模式"
- 在联系人列表、会话列表、私聊顶部、用户资料页四个位置展示

---

## 2. 展示范围

| 位置 | 是否展示 | 展示形式 |
|------|----------|----------|
| 联系人列表 | ✅ | 头像右下角绿色/灰色圆点 |
| 会话列表 | ✅ | 头像右下角绿色/灰色圆点，离线降低不透明度 |
| 私聊顶部栏 | ✅ | 头像右下角绿色/灰色圆点 |
| 群聊顶部栏 | ❌ | 不展示 |
| 群成员列表 | ❌ | 不展示 |
| 用户资料页 | ✅ | 头像右下角绿色/灰色圆点（大尺寸） |
| 隐私设置页 | ✅ | 新增"对所有人隐藏在线状态"开关 |

---

## 3. 后端改动

### 3.1 数据库 — `users` 表新增字段

```sql
ALTER TABLE users ADD COLUMN last_seen DATETIME;
ALTER TABLE users ADD COLUMN hide_online_status TINYINT DEFAULT 0;
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `last_seen` | DATETIME | 用户断线时写入 NOW() |
| `hide_online_status` | TINYINT | 0=正常, 1=隐身 |

### 3.2 Socket.IO 改动 (`socket/index.js`)

**user:online 事件** — 增加隐身判断：
```
如果 hide_online_status = 0 → 向好友广播 user:status {userId, status:'online'}（现有逻辑）
如果 hide_online_status = 1 → 不广播
```

**disconnect 事件** — 增加 last_seen 写入 + 隐身判断：
```
UPDATE users SET last_seen = NOW() WHERE id = userId
如果 hide_online_status = 0 → 向好友广播 user:status {userId, status:'offline'}
如果 hide_online_status = 1 → 不广播
```

### 3.3 新增 REST API

**GET `/api/user/online-status`**
- 参数: `?ids=10001,10002,10003`（逗号分隔，最多 200 个）
- 权限: 需要 JWT
- 返回:
```json
{
  "10001": { "online": true },
  "10002": { "online": false, "lastSeen": "2026-06-02T14:30:00.000Z" },
  "10003": { "isHidden": true }
}
```
- 规则：隐身用户返回 `isHidden: true`，前端统一理解为"离线"。批量查询只查非隐身用户的实际在线状态，隐身用户直接返回 `isHidden: true`。

**GET `/api/user/online-status/:userId`**
- 单个查询，返回格式同上

### 3.4 现有接口调整

- `GET /api/user/profile/:userId` — 返回增加 `last_seen` 字段（非隐身时返回实际时间，隐身时返回 null）
- `PUT /api/user/profile` — 接收 `hide_online_status` 字段更新。**特殊处理**：当 `hide_online_status` 变更时：
  - 0→1（开启隐身）：若用户当前在线，向所有好友广播 `user:status { userId, status:'offline' }`
  - 1→0（关闭隐身）：若用户当前在线，向所有好友广播 `user:status { userId, status:'online' }`

### 3.5 路由顺序注意

`GET /api/user/online-status` 必须在 `routes/user.js` 中定义在 `GET /:userId/*` 之前，防止 Express 将 `online-status` 当作 `:userId` 参数匹配。

---

## 4. 前端改动

### 4.1 新增文件

| 文件 | 说明 |
|------|------|
| `src/context/OnlineStatusContext.tsx` | 全局在线状态上下文 |
| `src/hooks/useOnlineStatus.ts` | 便捷 hook |
| `src/components/OnlineStatusDot.tsx` | 统一角标组件 |

### 4.2 OnlineStatusContext

```ts
interface OnlineStatus {
  online: boolean;
  lastSeen?: string;      // ISO string
  isHidden?: boolean;
}

interface OnlineStatusContextValue {
  statusMap: Map<number, OnlineStatus>;
  setStatus: (userId: number, status: OnlineStatus) => void;
  fetchStatuses: (userIds: number[]) => Promise<void>;
  getRelativeTime: (lastSeen: string) => string;  // "3小时前"等
}
```

**数据流：**
1. `App.tsx` 挂载 `OnlineStatusProvider`
2. `OnlineStatusProvider` 内部监听 `user:status` Socket 事件，实时更新 `statusMap`
3. 各页面挂载时调用 `fetchStatuses(friendIds)` 获取初始状态
4. 隐身用户的 `user:status` 事件不会被广播，API 返回 `isHidden: true`

### 4.3 OnlineStatusDot 组件

```tsx
interface Props {
  userId: number;
  size: number;          // 角标直径 (px)
  borderWidth: number;   // 白边宽度 (px)
  glow?: boolean;        // 是否加发光阴影
}
```

**渲染逻辑：**
- 在线 → 绿色圆点 `#4caf50`
- 离线 → 灰色圆点 `#bfb8ae`
- 隐身 → 等同于离线（灰色）
- 定位方式：`position: absolute; bottom: 0; right: 0;`

### 4.4 各页面改动

#### ContactList (`src/pages/Contacts/ContactList.tsx`)
- 使用 `useOnlineStatus` hook
- 加载好友后调用 `fetchStatuses(friendIds)` 初始化
- 每个好友头像外层包裹 `position: relative`，嵌入 `OnlineStatusDot`
- 移除硬编码 `status: 'online'`

#### MessageList (`src/pages/Messages/MessageList.tsx`)
- 同上，加载会话后批量获取好友在线状态
- 群聊会话不显示在线状态
- 离线用户头像降低不透明度（添加 `opacity: 0.7` class）
- 移除硬编码 `status: 'online'`

#### ChatRoom (`src/pages/Messages/ChatRoom.tsx`)
- 私聊顶部栏显示对方在线状态
- 初始加载：调用单个用户状态 API
- 实时更新：监听 `user:status` Socket 事件
- 群聊不进行任何改动

#### UserProfilePage (`src/pages/Profile/UserProfilePage.tsx`)
- 头像右下角添加 `OnlineStatusDot`（大尺寸 16px）
- 移除硬编码 `status: 'online'`

#### PrivacySettingsPage (`src/pages/Profile/PrivacySettingsPage.tsx`)
- 新增一行："对所有人隐藏在线状态" Switch 开关
- 调用 `PUT /api/user/profile` 更新 `hide_online_status`

### 4.5 规格对照表

| 位置 | 头像尺寸 | 角标尺寸 | 白边 | 定位 | 附加效果 |
|------|----------|----------|------|------|----------|
| ContactList | 40px | 11px | 2px | bottom:0 right:0 | — |
| MessageList | 48px | 12px | 2.5px | bottom:0 right:0 | 离线降低不透明度 |
| ChatRoom 顶部 | 36px | 11px | 2px | bottom:-1px right:-1px | 负偏移贴紧边缘 |
| UserProfile | 80px | 16px | 3px | bottom:1px right:1px | 绿色发光阴影 |

### 4.6 时间格式化（getRelativeTime）

```ts
// 刚在线 → 不显示
// <1分钟 → "刚刚"
// <1小时 → "X分钟前"
// <24小时 → "X小时前"
// <7天 → "X天前"
// >=7天 → 日期 "6月2日"
```

---

## 5. 边界与异常处理

| 场景 | 处理 |
|------|------|
| 页面加载时 Socket 尚未连接 | API 批量查询兜底，socket 连接后 `user:status` 事件增量更新 |
| 网络断开后重连 | `useSocket` 的 `reconnect` 会重新发 `user:online`，触发新一轮广播 |
| 隐身用户切换隐身开关 | 开关关闭后，若当前在线则**立即广播一次上线**；开关打开后**立即广播一次离线** |
| 批量查询无好友 | API 返回空对象 `{}` |
| 用户断线但服务器重启 | `last_seen` 已在断线时写入数据库，重启后持久 |
| 系统 bot (9999) | API 查询时过滤掉，不处理其在线状态 |

---

## 6. 测试要点

- [ ] 好友上下线时，联系人列表和会话列表状态同步更新
- [ ] 打开隐身开关后，好友看到你的状态变为离线
- [ ] 关闭隐身开关后，好友看到你恢复在线
- [ ] 私聊顶部栏正确显示对方状态
- [ ] 群聊顶部栏和成员列表不显示在线状态
- [ ] 离线用户头像在 MessageList 中有不透明度降低效果
- [ ] "最后在线时间"文字格式正确（刚刚/X分钟前/X小时前/X天前/日期）
- [ ] 页面初次加载时通过 API 获取正确状态（不等 Socket 事件）
- [ ] 断线重连后状态恢复正确
- [ ] UserProfilePage 查看隐身用户时不暴露实际在线状态
