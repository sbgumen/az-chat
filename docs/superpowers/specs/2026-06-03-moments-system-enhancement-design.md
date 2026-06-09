# AZ-Chat 动态系统完善 - 设计文档

**日期**: 2026-06-03
**范围**: 前端 pages/Moments/ + api/moments.ts + 后端 routes/moments.js + socket/index.js

---

## 一、执行顺序

按依赖关系分四阶段：

| 阶段 | 优先级 | 内容 |
|------|--------|------|
| Phase 1 | P0 | Bug 修复（图片上传、卡片点击、位置、我的动态数据） |
| Phase 2 | P1 | 发布增强（话题选择器、@提及） |
| Phase 3 | P1 | 通知系统（实时推送 + 离线 FCM） |
| Phase 4 | P2 | 新功能（编辑动态、关注分页、搜索页、用户动态页） |

---

## 二、后端 API 变更

### 2.1 需要新增的端点

#### `POST /api/moments/location/geo` — GPS 反向地理编码
- 入参: `{ latitude: number, longitude: number }`
- 逻辑: 调用高德/百度逆地理编码 API（国内服务），返回城市+区
- 回退: 坐标获取失败则走原有 IP 定位

#### `GET /api/moments/search` — 动态搜索
- 入参: `keyword, type(moment|topic|user), page, limit`
- 逻辑:
  - `type=moment`: 搜索动态内容 LIKE keyword，返回动态列表（含用户信息）
  - `type=topic`: 搜索话题 name LIKE keyword
  - `type=user`: 搜索用户 nickname LIKE keyword（非机器人、非封禁）
- 权限: 动态只搜公开+好友可见的

#### `GET /api/moments/user/:userId` — 查看他人动态
- 入参: `page, limit`
- 逻辑: 查询目标用户的公开动态 + 若为好友则含 friends 可见
- 返回: 动态列表 + 该用户的统计信息（动态数/粉丝/关注/获赞）
- 注意: 不能返回 private 的动态

#### `PUT /api/moments/:id` — 编辑动态
- 入参: `{ content, images, location, visibility, topic_name, audio_url, audio_duration }`
- 权限: 仅作者本人
- 逻辑: 更新动态字段，不在 Socket 推送（编辑不产生新通知）

### 2.2 需要修改的端点

#### `POST /api/moments` (发布动态) — 扩展
- 新增入参: `mentioned_user_ids: string[]` (被@的用户ID列表)
- 后端: 将 @ 用户写入 moment_notifications (type='mention')
- Socket: 推送给被@用户 `moment:notification`

#### `GET /api/moments/mine` (我的动态) — 确认数据完整性
- 确认 published_count / like_received / favorite_count / liked_count 正确返回
- 确认 published/favorited/liked 三个 tab 分页正常

#### `GET /api/moments/feed` (动态流) — 确认关注分页
- 验证 `tab=follow` 的分页参数正确传递
- 确认 hasMore 逻辑正确

### 2.3 Socket.IO 变更

#### 新增事件
- `moment:notification` — 实时推送通知（点赞/评论/关注/@/收藏）
  - 已部分实现，需确保所有通知类型都触发
  - 离线时写入 moment_notifications 表 + 发送 FCM 推送

### 2.4 离线 FCM 推送

在以下时机，若目标用户不在线（不在 onlineUsers Map 中），发送 FCM 推送：
- 点赞动态 → FCM: "xxx 赞了你的动态"
- 评论动态 → FCM: "xxx 评论了你的动态"
- @提及 → FCM: "xxx @了你"
- 关注 → FCM: "xxx 关注了你"
- 收藏动态 → FCM: "xxx 收藏了你的动态"

---

## 三、前端页面变更

### 3.1 Bug 修复

#### B1: FeedCard 整卡点击跳转详情
- 在 `FeedCard` 组件的 `<article>` 上添加 `onClick={() => navigate(`/moments/${moment.id}`)}`
- 子元素的 `e.stopPropagation()` 保持不动（点赞/评论/分享按钮）

#### B2: 位置获取 GPS + IP 混合
- 新增函数 `getPreciseLocation()`:
  1. `navigator.geolocation.getCurrentPosition()` 获取坐标
  2. 成功 → 调用 `/api/moments/location/geo` 反向编码
  3. 失败/拒绝 → 调用原有 `/api/moments/location` (IP 定位)
- 底层不使用国外 API（前端用 Geolocation API 是浏览器原生能力，后端用国内服务）

#### B3: 图片上传排查
- 检查 `compressImage` 函数是否正确处理各种图片格式
- 排查 `uploadMomentImage` FormData 构造
- 测试上传流程：选择文件 → 压缩 → FormData → 后端接收

#### B4: 我的动态数据确认
- 确认后端 `/api/moments/mine` 返回的统计数字与实际数据一致
- 前端 MyMoments 页面已有 published/favorited/liked 三个 tab，确认切换正常

### 3.2 新功能

#### F2: 话题选择器（优先实现，因为 F5 依赖）

**交互设计**: 抖音风横向滚动话题条
- 发布页文本区与底部工具栏之间增加一行横向滚动话题推荐条
- 首个话题默认高亮（渐变暖色药丸），其余低饱和色
- 点击话题药丸 → 选中并显示"已选话题: #xxx"标签
- 右侧 `+` 按钮 → 打开话题搜索面板（底部半屏）
- 搜索无结果时显示"创建新话题 #xxx"
- 用户可直接输入自定义话题名，搜索无匹配时自动创建

**前端实现**:
- 组件: `TopicPicker`（横向滚动条 + 搜索弹窗）
- 数据: `getActiveTopics()` 已有 API
- 状态: 选中的话题名存入 `topicName` 状态

**后端**: 发布时若话题不存在则自动创建（已有 logic in POST /api/moments）

#### F1: @提及功能

**交互设计**: 底部选人面板 + 文本输入@触发内联下拉

**前端实现**:
- 组件: `AtPicker`（底部半屏面板，搜索+勾选好友列表）
- 文本区监听 `@` 输入 → 弹出内联下拉候选列表
- 选中后以 `@[userId]` 格式插入文本光标位置
- 发布前解析 `@[userId]` 提取 mentioned_user_ids 传给后端

**后端**: 接收 `mentioned_user_ids`，写入通知并推送

#### F3: 通知实时 + 离线播报

**前端**:
- `MomentNotifications` 页面已存在，确保 Socket 实时推送刷新
- `useSocket` 监听 `moment:notification` 更新未读计数

**后端**:
- 所有通知写入 moment_notifications 表（已有）
- 目标用户离线时调用 `sendPush()` FCM 推送（需要补全）
- 已有: like/comment/follow 通知写入
- 补全: mention/favorite 通知 + FCM 离线推送

#### F4: 编辑动态

**前端**:
- PublishMoment 支持编辑模式：检测 URL query `?edit=momentId`
- 编辑模式: 预填内容/图片/位置/可见范围/话题
- 提交时调用 `PUT /api/moments/:id`

**后端**:
- 新增 `PUT /api/moments/:id`
- 权限校验: `m.user_id === req.userId`

#### F5: 关注分页（创意 UI）

**UI 设计**: 时间线日记式
- 左侧渐变彩色竖线（#FF6B6B → #FFB347 → #A18CD1 → #4ECDC4）
- 日期标记（今天/昨天/具体日期）
- 内容区域圆角色块交替（粉/橘/紫/绿淡色渐变，无边框）
- 分页: 滚动加载更多

**前端**:
- Feed 页面的 `tab=follow` 已在 MomentsFeed 中
- 新增 FollowTimeline 组件替代关注 tab 下的 FeedCard 列表
- 后端 `/api/moments/feed?tab=follow` 已有，确认可用

#### F6: 动态搜索页

**UI 设计**: 搜索即结果
- 顶部搜索栏 + 热门搜索词（药丸标签）
- 三个 tab: 动态 / 话题 / 用户
- 搜索结果: 无卡片边框，色块背景区分

**前端**:
- 新页面: `src/pages/Moments/SearchPage.tsx`
- 路由: `/moments/search`
- API: 新增 `searchMoments(keyword, type, page)`

#### F7: 用户动态页（ta的动态）

**UI 设计**: 抖音风资料卡片 + 动态流
- 顶部: 大头像(72px) + 横向四列数字（动态/粉丝/关注/获赞）
- 昵称 + 等级标签 + 个性签名
- 关注/已关注按钮
- 下方: 动态列表（仅公开+好友可见，无边框色块风格）

**前端**:
- 新页面: `src/pages/Moments/UserMomentsPage.tsx`
- 路由: `/user/:userId/moments`
- API: 新增 `getUserMoments(userId, page)`

#### 我的动态页统计区升级

- 复用抖音风布局: 大头像 + 四列数字统计
- 按钮: 编辑资料 + 发布动态
- Tab: 动态 / 收藏 / 赞过（已有）

---

## 四、前端组件结构

```
src/pages/Moments/
├── MomentsFeed.tsx          # 现有，增加 FollowTimeline 组件
├── MomentDetail.tsx         # 现有，无需改动
├── PublishMoment.tsx        # 现有，增加 TopicPicker + AtPicker + 编辑模式 + 新定位
├── MyMoments.tsx            # 现有，升级为抖音风统计区
├── MomentNotifications.tsx  # 现有，增加 Socket 实时刷新
├── SearchPage.tsx           # 新增
├── UserMomentsPage.tsx      # 新增
├── TopicPage.tsx            # 现有
└── components/
    ├── TopicPicker.tsx      # 新增 — 横向滚动话题药丸条
    ├── AtPicker.tsx         # 新增 — @选人底部面板
    ├── FollowTimeline.tsx   # 新增 — 时间线日记式关注动态
    └── ProfileStats.tsx     # 新增 — 抖音风资料统计区
```

## 五、前端 API 变更（api/moments.ts）

新增函数:
- `searchMoments(keyword, type, page)` → GET /api/moments/search
- `getUserMoments(userId, page)` → GET /api/moments/user/:userId
- `updateMoment(id, data)` → PUT /api/moments/:id
- `getGeoLocation(lat, lng)` → POST /api/moments/location/geo

---

## 六、路由变更（App.tsx）

新增路由:
- `/moments/search` → SearchPage
- `/user/:userId/moments` → UserMomentsPage
