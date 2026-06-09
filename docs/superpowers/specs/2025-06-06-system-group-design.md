# 系统群聊功能设计文档

**日期**: 2025-06-06  
**状态**: 待实施  
**作者**: AZ-Chat

---

## 1. 需求概述

新增"系统群聊"功能：由系统管理员创建的强制群聊，成员不可自行退出。支持两种模式：
- **全员群**：所有用户（含新注册）自动进群，不可退出
- **指定用户群**：管理员指定用户进群，不可退出

### 核心规则

| 规则 | 说明 |
|------|------|
| 创建者 | 系统管理员（DEFAULT_ADMIN_ID） |
| 群主 | 默认创建者为群主，可转让 |
| 管理员设置 | 和普通群一样，群主可设置/取消管理员 |
| 成员退出 | 禁止（leave 接口返回错误） |
| 成员踢出 | 禁止（kick 接口对系统群无效） |
| 解散群 | 禁止（dismiss 接口对系统群无效，仅管理员可在后台删除） |
| 系统群降级 | 不可降级为普通群（永久锁定） |
| 搜索可见性 | 普通搜索不可见系统群 |
| UI 标注 | 群名旁 Shield 图标 + "官方" 紫色标签 |

---

## 2. 数据库改动

### 2.1 `groups` 表新增字段

```sql
ALTER TABLE `groups` ADD COLUMN `is_system` TINYINT DEFAULT 0;
ALTER TABLE `groups` ADD COLUMN `system_mode` VARCHAR(10) DEFAULT NULL;
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `is_system` | TINYINT | 0=普通群, 1=系统群 |
| `system_mode` | VARCHAR(10) | NULL=普通群, `all`=全员群, `selected`=指定用户群 |

### 2.2 `group_members` 表

不新增字段。系统群成员也是普通 `group_members` 记录，通过 `groups.is_system` 判断是否可退出。

---

## 3. 后端 API 改动

### 3.1 新增路由

#### `POST /api/groups/create-system`

仅系统管理员可调用。

**请求体：**
```json
{
  "name": "官方公告群",
  "systemMode": "all",
  "memberIds": [10001, 10002]
}
```
- `systemMode`: `"all"` = 全员自动进群, `"selected"` = 仅指定用户
- `memberIds`: 仅 `systemMode="selected"` 时需要

**处理逻辑：**
1. 鉴权 → `req.userId !== process.env.DEFAULT_ADMIN_ID` → 403
2. 生成群 ID → `INSERT INTO groups (name, owner_id, is_system, system_mode)`
3. 创建者插入 `group_members` (role='owner')
4. 如果 `systemMode='all'` → `INSERT IGNORE INTO group_members` 批量插入所有现有用户
5. 如果 `systemMode='selected'` → 插入指定 memberIds
6. 返回 `{ code: 0, data: { groupId, name } }`

### 3.2 修改路由

| 路由 | 改动 | 逻辑 |
|------|------|------|
| `POST /:groupId/leave` | 加系统群判断 | `SELECT is_system FROM groups WHERE id=?` → =1 则返回 400 "系统群聊不可退出" |
| `POST /:groupId/kick` | 加系统群判断 | 同上，系统群不可踢人 |
| `POST /:groupId/dismiss` | 加系统群判断 | 系统群不可解散，仅管理员可在 `/admin/groups/:id` DELETE 删除 |
| `GET /search` | 加过滤条件 | SQL 加 `AND is_system = 0`，普通搜索不返回系统群 |

### 3.3 用户注册自动加群

在 `auth.js` 注册/登录流程中（`POST /login` 自动注册时），新用户创建完成后：

```js
// 自动加入所有 system_mode='all' 的系统群
await pool.execute(`
  INSERT IGNORE INTO group_members (group_id, user_id, role)
  SELECT id, ?, 'member' FROM \`groups\`
  WHERE is_system = 1 AND system_mode = 'all'
`, [newUserId]);
```

### 3.4 管理后台路由（`admin.js`）

`GET /api/admin/groups` — 返回数据中增加 `is_system`、`system_mode` 字段，支持按类型筛选。

`DELETE /api/admin/groups/:id` — 系统群可删除（二次确认提示），删除后级联清理 `group_members`。

`POST /api/admin/groups/:id/members` — 新增：系统群指定用户模式下，管理员可添加成员。

`DELETE /api/admin/groups/:id/members/:userId` — 新增：系统群指定用户模式下，管理员可移除成员。

---

## 4. 前端改动

### 4.1 CreateGroupPage — 创建入口

在现有页面上增加系统管理员专属的 Tab 切换和系统群配置区域。UI 设计见 `mockup-system-group.html`。

**关键交互：**
- 系统管理员进入页面 → 顶部 Tab：「普通群聊」/「系统群聊」
- 选中系统群聊 → 展开模式卡片：「全员群」/「指定用户群」
- 指定用户模式 → 显示好友多选列表
- 底部按钮文案/颜色随模式切换

**权限判断：**
```ts
const isAdmin = user?.id === Number(import.meta.env.VITE_DEFAULT_ADMIN_ID || 10003);
```

**API 调用：**
```ts
// 新增 api 函数
createSystemGroup(name, systemMode, memberIds) → POST /api/groups/create-system
```

### 4.2 MessageList — 群聊列表标识

`is_system === 1` 的群聊在会话卡片中显示：

```
[Shield图标] 官方  群名称
            最后一条消息预览       时间
```

- Shield 图标 + "官方" 标识使用 `text-violet-500`
- 放在群名前面，小尺寸（`text-[10px]`）

### 4.3 GroupChatRoom — 群聊详情/设置

系统群聊：
- "退出群聊" 按钮置灰/隐藏，hover 显示 tooltip "系统群聊不可退出"
- 成员列表中不可移除系统群成员（kick 按钮隐藏）

### 4.4 AddPage — 搜索过滤

- 后端搜索已过滤，前端兜底：`groups.filter(g => !g.is_system)`
- 系统群不会出现在普通搜索和推荐中

### 4.5 AdminGroupsPage — 管理后台

**顶部筛选栏：**
搜索框旁加下拉：`[全部群聊 ▾] [系统群聊] [普通群聊]`

**列表卡片：**
系统群行增加：
```
[群头像] 群名称 🛡️官方    100/200人    创建者    操作
         ID: 1234567      全员群/[指定用户群]
```
- 第二行显示系统群模式（chip 样式）

**操作按钮变化：**

| 操作 | 普通群 | 系统群 |
|------|--------|--------|
| 编辑信息 | ✅ | ✅ |
| 封禁/解封 | ✅ | ✅ |
| 管理成员 | ❌ | ✅ 新增（仅指定用户模式，可增删成员） |
| 删除 | ✅ | ✅（二次确认提示"系统群聊，删除后所有成员将退出"） |

### 4.6 API 层新增函数

```ts
// src/api/groups.ts
export function createSystemGroup(name: string, systemMode: string, memberIds?: number[]) {
  return api.post('/api/groups/create-system', { name, systemMode, memberIds });
}
```

```ts
// src/api/admin.ts
export function getAdminGroups(params: { page?: number; limit?: number; keyword?: string; systemType?: string }) {...}
export function addSystemGroupMembers(groupId: number, userIds: number[]) {...}
export function removeSystemGroupMember(groupId: number, userId: number) {...}
```

---

## 5. 关键业务流程

### 5.1 创建系统全员群
```
管理员 → 创建系统群聊 → 选择"全员群" → 输入群名 → 确认
→ 后端批量 INSERT IGNORE 所有现有用户到 group_members
→ 返回 { groupId }
→ 前端跳转群聊页
```

### 5.2 新用户注册自动加群
```
新用户注册 → 创建 users 记录
→ SELECT * FROM groups WHERE is_system=1 AND system_mode='all'
→ INSERT IGNORE INTO group_members (每个全员群一条)
→ 注册完成
```

### 5.3 系统群指定用户模式增删成员
```
管理员 → 后台系统群管理 → 管理成员
→ 添加：POST /api/admin/groups/:id/members { userIds }
→ 移除：DELETE /api/admin/groups/:id/members/:userId
→ 前端刷新列表
```

---

## 6. 安全考虑

| 项目 | 措施 |
|------|------|
| 创建权限 | 仅 `DEFAULT_ADMIN_ID` 可调用 `create-system` |
| 退出拦截 | 后端强制检查 `is_system`，前端隐藏按钮兜底 |
| 搜索隔离 | 后端 SQL 过滤 + 前端二次过滤 |
| 成员管理 | 仅指定用户模式可在后台增删成员 |
| 审计日志 | 系统群创建/删除记入 `admin_logs` |

---

## 7. 验证清单

- [ ] 系统管理员可见「系统群聊」Tab
- [ ] 普通用户不可见系统群聊创建入口
- [ ] 创建全员群：所有现有用户自动加入
- [ ] 新用户注册：自动加入全员群
- [ ] 系统群成员点击退出 → 提示不可退出
- [ ] 系统群管理员踢人 → 提示不可踢出
- [ ] 普通搜索不出现系统群
- [ ] 群列表显示 Shield + "官方" 标识
- [ ] 管理后台可筛选系统群并管理成员
- [ ] 删除系统群：所有成员退出，群解散
