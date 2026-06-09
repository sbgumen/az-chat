# 联系人列表 UI 重设计

**日期**: 2026-06-02  
**状态**: 待实现

---

## 设计方向

混合方案：快捷操作 A 风格（2x2 渐变卡片网格）+ 其余 B 风格（杂志排版）

## 额外要求

- 不使用 emoji 表情包，使用 lucide-react 图标
- 不使用卡片边框（border），用背景色和阴影区分层次
- 使用 frontend-design 技能实现

---

## 布局结构（从上到下）

### 1. 搜索栏（B 风格）
- 白色圆角胶囊 `rounded-full`
- lucide `Search` 图标 + placeholder 文字
- 无边框，用 `shadow-sm` 替代
- 点击跳转到搜索页

### 2. 快捷操作（A 风格 — 2x2 网格）
- CSS Grid 2x2，间距 `gap-2`
- 每格：圆形渐变图标 + 主标题 + 副标题
- 4个入口卡片不使用边框，用背景色渐变 + 圆角区分
- 颜色方案：
  - 添加好友：暖橙渐变 `from-warm-50 to-warm-100`，图标 `bg-warm-500`
  - 创建群聊：蓝色渐变 `from-blue-50 to-blue-100`，图标 `bg-blue-500`
  - 我的群聊：紫色渐变 `from-purple-50 to-purple-100`，图标 `bg-purple-500`
  - 好友申请：绿色渐变 `from-emerald-50 to-emerald-100`，图标 `bg-emerald-500`，红点角标

### 3. 在线好友区（B 风格 — 横向滚动）
- 左侧彩色竖线（2px）+ 标题 "在线好友" + 人数
- 横向滑动列表：大号圆角方形头像（56x56, `rounded-2xl`）
- 在线状态：绿色圆点角标（13px, `border-white border-2`）
- 昵称在头像下方

### 4. 全部联系人（B 风格 — 竖列表）
- 左侧灰色竖线 + 标题 "全部联系人" + 人数
- 列表项：圆角方形头像（42x42, `rounded-xl`）+ 昵称 + 状态文字 + `>` 箭头
- 离线用户：头像 `opacity-60`，文字灰色
- 在线用户：绿色状态文字

---

## 视觉规范

| 元素 | 规格 |
|------|------|
| 搜索栏高度 | 44px, 圆角 24px |
| 快捷操作卡片 | 圆角 14px, 内边距 12px |
| 在线好友头像 | 56x56px, 圆角 18px |
| 联系人列表头像 | 42x42px, 圆角 14px |
| 在线状态圆点 | 在线 11-13px, 白边 2-2.5px |
| 竖线标题装饰 | 3px x 16px, 圆角 2px |
| 无 emoji | 全部使用 lucide-react 图标 |

---

## 文件改动

| 文件 | 说明 |
|------|------|
| `src/pages/Contacts/ContactList.tsx` | 完全重写 |

## 复用现有组件
- `OnlineStatusDot` — 在线状态圆点
- `RemoteImage` — 远程图片加载
- `useOnlineStatus` — 在线状态数据
- `useSocket` — Socket.IO 事件
- 现有 API 调用不变
