# 群聊系统优化 — 成员管理 + 禁言 + 邀请

## 后端

### 新表 `group_member_mutes`
```sql
CREATE TABLE group_member_mutes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  group_id BIGINT NOT NULL,
  user_id INT NOT NULL,
  muted_by INT NOT NULL,
  muted_until DATETIME NULL,  -- NULL = 永久
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_group_user (group_id, user_id)
);
```

### 新 API
- `POST /:groupId/mute` — `{ userId, duration }` 分钟数, 0=永久
- `POST /:groupId/unmute` — `{ userId }`
- `GET /:groupId/mutes` — 禁言列表
- 定时清理: setInterval 每60s 删除 `muted_until < NOW()`

### Socket 拦截
- `group:message:send` 检查 `group_member_mutes`，禁言中返回错误

## 前端

### 新页面
- `/messages/group/:groupId/member/:userId` — 成员管理页
- `/messages/group/:groupId/members` — 成员列表页
- `/messages/group/:groupId/invite` — 邀请好友页

### 权限矩阵
| 操作者\被操作者 | 群主 | 管理员 | 普通成员 |
|---|---|---|---|
| 群主 | — | 取消管理员+禁言+移除 | 设管理员+禁言+移除 |
| 管理员 | — | — | 禁言+移除 |
| 普通成员 | — | — | 查看主页 |

### GroupInfoPage 改动
- 成员面板: "邀请好友" → "查看群成员" → 成员列表页
- 最后成员后添加 + 号按钮 → 邀请页
- 管理员/群主点击成员头像 → 成员管理页
- 普通成员点击头像 → 用户主页

### ChatRoom 禁言拦截
- 发消息时后端检查, 前端显示禁言提示(剩余时长)

### 排序规则
- 群主最前, 管理员其次, 成员按昵称 A-Z
