# 聊天页面风格切换 — 设计文档

## 概述
为 AZ-Chat 添加聊天页面风格切换功能，默认"温暖拿铁(latte)"，全局生效。用户可在个性化设置、私聊设置、群设置三个入口选择风格，切换后即时生效。

## 预设风格（4套）

| Key | 名称 | 背景色 | 己方气泡 | 对方气泡 | 描述 |
|-----|------|--------|----------|----------|------|
| `latte` | 温暖拿铁 | #faf8f5 | #d4a574 | #fff | 默认，清爽暖调 |
| `mocha` | 焦糖摩卡 | #f5f0ea | #b8956a | #fff | 更深邃暖色 |
| `morning` | 雾蓝清晨 | #f7f9fc | #8b9dc3 | #fff | QQ风格清爽蓝 |
| `linen` | 驼色亚麻 | #f7f5f0 | #9b8c7c | #fff | 日系侘寂感 |

## 数据流

```
users.chat_style (VARCHAR(32) DEFAULT 'latte')
  ↓ login/profile → { ..., chat_style: 'latte' }
  ↓ AuthContext.user.chat_style
  ↓ ChatRoom / GroupChatRoom 读取并应用
  ↓ PUT /api/user/chat-style ← 用户选择
```

## 后端改动

### 1. 数据库
```sql
ALTER TABLE users ADD COLUMN chat_style VARCHAR(32) DEFAULT 'latte';
```

### 2. 路由 (routes/user.js)
- GET `/api/user/chat-style` → 返回当前风格
- PUT `/api/user/chat-style` ← body: { style } → 更新并校验 (latte/mocha/morning/linen)
- `GET /profile` 的 SELECT 中加入 `chat_style`

### 3. auth.js 登录返回
- 现有 `SELECT *` 会自动包含新字段，无需改动

## 前端改动

### 新增文件
- `src/pages/Profile/ChatStylePage.tsx` — 风格选择页，4个卡片带实时预览

### 修改文件
- `src/types/index.ts` — AuthUser 加上 chat_style
- `src/api/user.ts` — 添加 getChatStyle() / saveChatStyle()
- `src/context/AuthContext.tsx` — user 存储 chat_style
- `src/pages/Profile/PersonalizationPage.tsx` — 添加"聊天界面风格"卡片
- `src/pages/Messages/ChatSettingsPage.tsx` — 添加风格入口行
- `src/pages/Groups/GroupInfoPage.tsx` — 添加风格入口行
- `src/pages/Messages/ChatRoom.tsx` — 读取并应用风格
- `src/pages/Messages/GroupChatRoom.tsx` — 读取并应用风格

### 风格定义
```ts
export const CHAT_STYLES = {
  latte:   { bg: '#faf8f5', selfBubble: '#d4a574', ... },
  mocha:   { bg: '#f5f0ea', selfBubble: '#b8956a', ... },
  morning: { bg: '#f7f9fc', selfBubble: '#8b9dc3', ... },
  linen:   { bg: '#f7f5f0', selfBubble: '#9b8c7c', ... },
};
```

每个风格定义包含: bg, selfBubble, selfBubbleGradient, otherBubble, headerBg, inputBg, inputBorder, 对应的 Tailwind class 覆盖。

## UI 入口

| 页面 | 入口文案 | 跳转 |
|------|----------|------|
| PersonalizationPage | "聊天界面风格" 卡片 | → ChatStylePage |
| ChatSettingsPage | "聊天界面风格" 设置行 | → ChatStylePage |
| GroupInfoPage | "聊天界面风格" 设置行 | → ChatStylePage |

## 注意事项
- 风格切换即时生效，无需刷新页面
- 与 lv30_style（主页风格）独立，互不影响
- 不加 localStorage 缓存，优先从 AuthContext/user 读取
