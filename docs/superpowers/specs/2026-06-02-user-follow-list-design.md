# TA 的粉丝/关注列表 + 隐私设置

## 概述
UserProfilePage 上点击粉丝数和关注数，跳转到对方的粉丝/关注列表页面。同时新增隐私设置控制列表可见性。

## 后端

### API 新增
- `GET /api/user/:userId/following` — 获取指定用户的关注列表
- `GET /api/user/:userId/followers` — 获取指定用户的粉丝列表

返回格式（与现有一致）：
```json
{
  "code": 0,
  "data": [
    { "id": 1, "nickname": "...", "avatar": "...", "signature": "...", "is_followed": true, "follows_me": true }
  ]
}
```

### 隐私检查
- 读取目标用户的 `privacy` JSON 字段
- 若 `privacy.following` 或 `privacy.followers` 为 `false`，返回 `code: 403`
- 自己查看自己始终允许

## 前端

### 新页面：UserFollowListPage
- 路由：`/user/:userId/follow/:mode`（mode = 'following' | 'followers'）
- 使用 `useParams` 获取 userId
- 调用对应 API
- 列表项展示：头像、昵称、签名、关注按钮
- 按钮逻辑：我关注ta → "已关注"；ta关注我但我没关注ta → "回关"；都没关注 → "关注"
- 403 时显示 "对方设置了关注列表不可见" / "对方设置了粉丝列表不可见"
- 页面可点击头像跳转到 `/user/:id`

### UserProfilePage 修改
- 粉丝数和关注数从 `<span>` 改为 `<button>`，点击跳转
- 暗色风格按钮：带玻璃质感的可点击样式

### PrivacySettingsPage 修改
- 隐私字段数组新增：
  - `{ key: 'followers', icon: Users, label: '粉丝列表' }`
  - `{ key: 'following', icon: Users, label: '关注列表' }`
- 保存到 `users.privacy` JSON

### App.tsx 路由
- 新增 `/user/:userId/follow/:mode` → `UserFollowListPage`
