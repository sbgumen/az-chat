# 系统群聊实施计划

**关联设计文档**: `docs/superpowers/specs/2025-06-06-system-group-design.md`

---

## 任务顺序

```
Task 1 (后端DB) → Task 2 (后端API) → Task 3 (后端注册) → Task 4 (后端管理)
                                                         ↘ Task 5 (前端API+页面并行)
                                                            Task 6 (前端列表+搜索)
                                                            Task 7 (管理后台)
```

---

## Task 1 — 数据库 migration（后端）

**文件**: `AZ-chat-后端/app.js`

**改动**:
1. 在 `initDatabase()` 中新增 ALTER TABLE 语句：
   ```sql
   ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `is_system` TINYINT DEFAULT 0;
   ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `system_mode` VARCHAR(10) DEFAULT NULL;
   ```
2. （MySQL 不支持 `IF NOT EXISTS` 在 ALTER TABLE 中，参考现有 migration 写法，用 try/catch 包裹）

**验证**: 启动后端后，`groups` 表包含 `is_system` 和 `system_mode` 字段

---

## Task 2 — 后端系统群 API（后端）

**文件**: `AZ-chat-后端/routes/groups.js`

**改动**:
1. 新增 `POST /api/groups/create-system` 路由：
   - 检查 `req.userId === parseInt(process.env.DEFAULT_ADMIN_ID)` → 否则 403
   - 参数校验：`name` 必填、`systemMode` 必须为 `all` 或 `selected`
   - 生成群 ID → INSERT groups (is_system=1, system_mode=...)
   - 创建者插入 group_members (role='owner')
   - `systemMode='all'` → `INSERT IGNORE INTO group_members (group_id, user_id, role) SELECT id, ?, 'member' FROM users`（插入所有用户）
   - `systemMode='selected'` → 循环插入 memberIds
   - 插入系统消息
   - 返回 `{ code: 0, data: { groupId, name } }`

2. 修改 `POST /:groupId/leave`：查询 `is_system`，=1 返回 `{ code: 400, message: '系统群聊不可退出' }`

3. 修改 `POST /:groupId/kick`：同上，`is_system=1` 返回 400

4. 修改 `POST /:groupId/dismiss`：同上

5. 修改 `GET /search`：SQL 加 `AND is_system = 0`

**验证**:
- 系统管理员调用 create-system 返回 groupId
- 普通用户调用 create-system 返回 403
- 系统群成员调用 leave 返回 400
- 普通搜索不返回系统群

---

## Task 3 — 新用户自动加群（后端）

**文件**: `AZ-chat-后端/routes/auth.js`

**改动**:
在 `POST /login` 自动注册创建用户后，新增：
```js
await pool.execute(`
  INSERT IGNORE INTO group_members (group_id, user_id, role)
  SELECT id, ?, 'member' FROM \`groups\`
  WHERE is_system = 1 AND system_mode = 'all'
`, [userId]);
```

**验证**: 新用户注册后查询 group_members，包含所有全员群的记录

---

## Task 4 — 管理后台系统群 API（后端）

**文件**: `AZ-chat-后端/routes/admin.js`

**改动**:
1. `GET /api/admin/groups` — 返回数据加 `is_system`、`system_mode` 字段；支持 `systemType` query 参数筛选
2. `POST /api/admin/groups/:id/members` — 给指定用户模式系统群添加成员
   - 校验 `is_system=1` 且 `system_mode='selected'`
   - `INSERT IGNORE INTO group_members`
3. `DELETE /api/admin/groups/:id/members/:userId` — 移除指定用户模式系统群成员
   - 校验不能移除 owner
4. `DELETE /api/admin/groups/:id` — 系统群可删除（现有逻辑已支持，无需改动）

**验证**: 后台可筛选系统群、增删成员、删除系统群

---

## Task 5 — 前端 CreateGroupPage + API 层

**文件**:
- `AZ-chat/src/api/groups.ts`
- `AZ-chat/src/pages/Groups/CreateGroupPage.tsx`

**改动**:
1. `groups.ts` — 新增 `createSystemGroup(name, systemMode, memberIds?)`
2. `CreateGroupPage.tsx`:
   - 判断当前用户是否系统管理员：`user?.id === Number(import.meta.env.VITE_DEFAULT_ADMIN_ID || 10003)`
   - 新增 state: `tab` (`'normal'`/`'system'`)、`systemMode` (`'all'`/`'selected'`)
   - 管理员可见顶部 Tab 切换栏（参考 `mockup-system-group.html`）
   - 系统群聊模式选择卡片（全员群 / 指定用户群）
   - 指定用户模式显示好友多选
   - 底部按钮切换文案和样式
   - 创建调用对应 API

**验证**:
- 系统管理员可见「系统群聊」Tab
- 普通用户不可见
- 创建全员群 → 跳转群聊页
- 创建指定用户群 → 跳转群聊页

---

## Task 6 — 前端群聊列表 + 搜索过滤

**文件**:
- `AZ-chat/src/pages/Messages/MessageList.tsx`
- `AZ-chat/src/pages/Contacts/AddPage.tsx`
- `AZ-chat/src/pages/Groups/GroupInfoPage.tsx`

**改动**:
1. `MessageList.tsx` — 群聊会话卡片：
   - 读 `is_system` 字段
   - =1 时群名旁显示 Shield 图标 + "官方" 紫色标签
2. `AddPage.tsx` — 搜索结果兜底过滤 `g => !g.is_system`
3. `GroupInfoPage.tsx` — 系统群隐藏/置灰「退出群聊」按钮

**验证**:
- 系统群在列表显示 Shield + "官方"
- 搜索不返回系统群
- 系统群设置页无退出按钮

---

## Task 7 — 前端管理后台系统群管理

**文件**: `AZ-chat/src/pages/Admin/AdminGroupsPage.tsx`

**改动**:
1. 顶部新增筛选下拉：`[全部] [系统群聊] [普通群聊]`
2. 列表卡片：系统群显示 Shield + "官方" 标签 + system_mode chip
3. 新增「管理成员」按钮（仅指定用户系统群显示，弹出成员增删弹窗）
4. 删除系统群时二次确认："系统群聊，删除后所有成员将退出"

**验证**:
- 筛选功能正常切换
- 系统群标识正确显示
- 成员弹窗可增删
- 删除二次确认

---

## 执行顺序

按依赖关系：Task 1 → Task 2 → Task 3 → Task 4（后端完成）→ Task 5/6/7 可并行（前端）
