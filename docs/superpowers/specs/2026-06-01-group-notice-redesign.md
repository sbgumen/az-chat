# 群公告系统重设计

**日期:** 2026-06-01
**范围:** 前端 + 后端
**关联页面:** 播报弹窗、公告详情、公告管理列表、公告编写

---

## 1. 设计目标

重新设计群公告系统的 UI/UX 和交互逻辑，修复现有 bug，添加标题字段，拆分管理页面结构，提升整体体验。

---

## 2. 设计选型

| 页面 | 风格 |
|------|------|
| 播报弹窗 (BroadcastPopup) | 杂志封面 — cream 底色全屏居中排版，暖金点缀 |
| 公告详情 (NoticeDetailPage) | Hero 暖金横幅 + 白色正文卡片向上叠加 |
| 公告编写 (NoticeComposePage) | 备忘录极简编辑器，标题+正文+图片上传，无草稿 |
| 公告列表 (NoticeListPage) | 左侧暖金时间轴串联，节点区分播报/普通 |

---

## 3. 统一设计约束

- 不使用 emoji 作为图标/装饰
- 不使用卡片边框（无 border/shadow 分界线）
- 统一 cream/warm 色系（#f5f0eb, #d4a574, #3d3226 等）
- 与项目现有设计语言一致
- 光泽/动效：Framer Motion spring 过渡

---

## 4. 数据库变更

```sql
-- group_notices 新增标题列
ALTER TABLE group_notices ADD COLUMN title VARCHAR(200) DEFAULT '' COMMENT '公告标题' AFTER content;
```

- `title` — 公告标题，最长200字符，默认空
- 后端所有 notice 相关接口需同步返回/接收 `title` 字段

---

## 5. 页面架构重组

```
旧结构：
  GroupManagePage → GroupNoticeManage（发布栏 + 列表混在一起）
  GroupInfoPage   → GroupNoticePage（成员视角列表 + 简陋详情）
  GroupChatRoom   → broadcastNotice 内嵌弹窗

新结构：
  GroupManagePage → NoticeListPage（管理视角，时间线列表）
                  → NoticeComposePage（独立编写页，路由 /compose）
                  → NoticeComposePage（编辑，路由 /compose/:noticeId）

  GroupInfoPage   → NoticeListPage（成员只读，复用同一组件，隐藏管理按钮）
                  → NoticeDetailPage（详情: Hero 横幅 + 正文 + 已读确认）

  GroupChatRoom   → BroadcastPopup（独立弹窗组件，杂志封面风格）
```

---

## 6. 页面路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/messages/group/:gid/info/notices` | NoticeListPage | 管理列表/成员只读（根据角色显示按钮） |
| `/messages/group/:gid/info/notices/compose` | NoticeComposePage | 新建公告 |
| `/messages/group/:gid/info/notices/compose/:nid` | NoticeComposePage | 编辑已有公告 |
| `/messages/group/:gid/info/notices/:nid` | NoticeDetailPage | 公告详情+标记已读 |

---

## 7. 交互逻辑规范

### 7.1 播报弹窗触发与限制

- **进入群聊时**：获取当前播报公告，若未读则弹出
- **实时推送**：管理员设置新播报 → Socket `group:broadcast` → 群聊中立即弹出
- **重复提醒**：关闭弹窗但未进入详情 = 仍为未读 → 下次进入该群聊（距上次关闭≥5分钟）再次弹出
  - 前端实现：在 GroupChatRoom 中记录 `lastDismissedNoticeId` + `lastDismissedTime`（localStorage），进入群聊时比较
- **消除条件**：只有进入 NoticeDetailPage 才调用 `markNoticeRead` 标记已读
- **关闭按钮**：「我知道了」关闭弹窗但不标记已读；「查看详情」跳转详情页并标记已读

### 7.2 标记已读

- 唯一标记入口：NoticeDetailPage 进入时自动调用 `markNoticeRead`
- 管理列表/成员列表中点击卡片不标记已读，直接进入详情
- 已读后重新进入群聊不再弹播报弹窗

### 7.3 管理权限

- 群主(owner)和管理员(admin)可见编辑/删除/播报开关按钮
- 普通成员(member)仅只读列表

---

## 8. 组件设计

### 8.1 BroadcastPopup（播报弹窗）

- 位置：GroupChatRoom 中独立渲染
- 外观：全屏 cream 淡米背景，居中排版
  - 顶部装饰线或留白
  - 居中「✦ 群公告 ✦」小字标签
  - 公告标题（大字体 serif / font-display）
  - 装饰分隔线
  - 正文内容（居中或左对齐，可滚动）
  - 图片横向滑动（如有）
  - 作者头像 + 名称 + 时间
  - 底部双按钮：「我知道了」（次要）、「查看详情」（主要暖金按钮）
- 动画：fade + scale 入场，spring 弹性

### 8.2 NoticeDetailPage（公告详情）

- 位置：全屏覆盖子页面（z-index 覆盖在 Layout 上）
- 头部：返回按钮 + "公告详情"
- Hero 区域：暖金渐变背景（#d4a574 → #c4956a）
  - 标签「群公告」
  - 标题大字体
  - 作者头像 + 名称 + 时间
- 正文区域：白色背景圆角叠加在 Hero 下方
  - 正文内容（支持换行和段落）
  - 图片网格展示（如有）
- 底部栏：已读人数统计 + 操作按钮（管理可编辑/删除）
- 进入时自动调用 markNoticeRead

### 8.3 NoticeComposePage（公告编写）

- 位置：全屏子页面
- 头部：返回 + "编写公告" + 右侧发布按钮
- 输入区（极简风格）：
  - 标题输入（必填，placeholder "公告标题"，大字重体）
  - 正文 textarea（最大500字，自适应高度，placeholder "输入公告正文..."）
  - 字数计数
- 图片区：
  - 已上传图片缩略图网格（可删除）
  - 添加按钮（虚线方框 + 加号图标）
  - 最多9张
- 播报开关：toggle 开关（可选设为播报）
- 底部发布按钮（全宽暖金按钮）
- 编辑模式：通过路由参数 `:nid` 判断，预填充已有数据，按钮文字改为"保存"

### 8.4 NoticeListPage（公告列表）

- 位置：全屏子页面
- 头部：返回 + "群公告" + 已发布数量 +（管理可见"+ 发布"按钮）
- 列表区（时间线风格）：
  - 左侧暖金竖线时间轴
  - 每条公告节点：
    - 播报公告：实心暖金圆点
    - 普通公告：浅色圆点
    - 未读公告：节点上有红色标记点
  - 内容：标题 + 正文摘要(2行截断) + 图片缩略图(最多3张) + 作者+时间+已读统计
  - 管理底部操作栏（仅管理可见）：播报状态/设为播报 | 编辑 | 删除
  - 点击卡片 → 进入详情
- 空态：居中图标 + "暂无群公告"

---

## 9. Bug 修复清单

| # | 问题 | 修复 |
|---|------|------|
| 1 | 图片不加载 — URL 解析不一致 | 后端 upload 统一返回 `{ code: 0, data: { url: "/uploads/..." } }` 格式；前端统一 `apiBase + url` |
| 2 | `read_count` 死字段 | markNoticeRead 接口中加 `UPDATE group_notices SET read_count = read_count + 1` |
| 3 | 编辑播报公告不通知在线用户 | PUT notices/:id 编辑后判断 is_broadcast=1 → emit `group:broadcast` |
| 4 | 删除播报公告不通知在线用户 | DELETE notices/:id 删除后判断原 is_broadcast=1 → emit `group:broadcast`（notice=null 表示清除） |

---

## 10. 后端接口变更

### 新增/修改字段

所有 notice 相关接口的请求和响应增加 `title` 字段：
- `POST /:groupId/notices` — 接收 `{ title, content, images }`
- `PUT /:groupId/notices/:noticeId` — 接收 `{ title, content, images }`
- GET 列表/详情/播报查询 — 返回增加 `title`

### 接口行为修改

- `POST /:groupId/notices/:noticeId/read` — 增加 `UPDATE SET read_count = read_count + 1`
- `PUT /:groupId/notices/:noticeId` — 编辑后若 is_broadcast=1 则 emit socket
- `DELETE /:groupId/notices/:noticeId` — 删除后若原为播报则 emit `group:broadcast` with null notice

### Socket 事件

- `group:broadcast` 新增 payload: `{ groupId, notice: NoticeObject | null }`（null 表示播报已清除，前端收到 null 时关闭弹窗并清除 localStorage 中该群的播报记录）

---

## 11. 前端实现文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/BroadcastPopup.tsx` | 新建 | 杂志封面风格播报弹窗组件 |
| `src/pages/Groups/NoticeDetailPage.tsx` | 新建 | Hero 横幅详情页 |
| `src/pages/Groups/NoticeComposePage.tsx` | 新建 | 备忘录风格编写页 |
| `src/pages/Groups/NoticeListPage.tsx` | 新建 | 时间线风格列表页 |
| `src/pages/Groups/GroupNoticePage.tsx` | 修改 | 重构为路由入口，指向新组件 |
| `src/pages/Groups/GroupManagePage.tsx` | 修改 | notices 子页替换为新组件 |
| `src/pages/Groups/GroupInfoPage.tsx` | 修改 | notices 入口指向新列表 |
| `src/pages/Messages/GroupChatRoom.tsx` | 修改 | 替换弹窗为新 BroadcastPopup |
| `src/api/groups.ts` | 修改 | 接口增加 title 参数 |

---

## 12. 后端实现文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `app.js` | 修改 | ALTER TABLE 添加 title 列 |
| `routes/groups.js` | 修改 | 所有 notice 接口增 title；read_count 递增；编辑/删除 emit |
| `socket/index.js` | 修改 | group:broadcast 支持 null notice 清除 |

---

## 13. 验收标准

1. 管理员可新建公告（含标题、正文、图片），发布后出现在时间线列表
2. 管理员可编辑/删除已有公告，可设置/取消播报
3. 成员进入群聊看到播报弹窗（杂志封面风格），关闭后5分钟内不再弹
4. 成员点击「查看详情」进入详情页，自动标记已读，不再弹窗
5. 管理员实时设置播报时，群内在线成员立即看到弹窗
6. 删除播报公告时，在线成员弹窗清除
7. 公告图片正常上传和加载显示
8. 所有页面符合无边框、无 emoji、cream 色系设计约束
9. 列表时间线、详情 Hero 横幅、弹窗杂志封面风格正确呈现
