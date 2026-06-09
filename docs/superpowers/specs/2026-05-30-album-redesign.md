# 相册系统重设计 — 设计文档

**日期**: 2026-05-30  
**状态**: 设计完成，待实现

---

## 背景与目标

当前相册系统存在以下问题：
1. 每个相册硬编码最多 10 张照片
2. 照片平铺网格，无时间维度的组织
3. UI 设计较为传统（标准网格 + 边框卡片）
4. 相册列表页和详情页设计语言平淡

目标：
- 移除照片数量限制，支持超大相册
- 照片按月份分组，杂志式非对称排版
- 打破传统框架的设计语言：无卡片边框、深色氛围、动态交互
- Cover Story 横向滑动大卡作为相册列表入口

---

## 设计方案总览

| 页面 | 设计方向 | 核心组件 |
|---|---|---|
| 我的相册（列表） | Cover Story 横向大卡 + 小卡横滑 | 深色背景、无边框、封面全出血 |
| TA的相册（列表） | 同上，移除管理功能 | 同上 |
| 相册详情 | 杂志式月份分组 + 非对称网格 | 精选轮播(Carousel3D保留)、虚拟滚动、悬浮操作 |

全局约束：
- 不使用 emoji，图标统一用 Lucide React
- 不使用卡片边框（border），用色差/阴影/透明度区分层级
- 保留 LV30+ 玻璃态极光特效
- 保留精选照片 3D 轮播组件（Carousel3D）
- 手机端适配：所有尺寸用相对单位，适配安全区域

---

## 1. 相册列表页 — Cover Story 模式

### 1.1 布局结构

```
┌─────────────────────────────┐
│ 页面标题 "我的相册 · N"        │  ← Header: 标题 + 管理按钮
├─────────────────────────────┤
│ 最近更新                     │  ← 分区标签(small caps)
│ ┌─────┐ ┌─────┐ ┌─────┐    │
│ │ 大卡 │ │ 大卡 │ │ 大卡 │    │  ← 200×260 大卡横向滑动
│ │     │ │     │ │     │    │    完整封面图作背景
│ │ 标  │ │ 标  │ │ 标  │    │    杂志式标题叠印
│ └─────┘ └─────┘ └─────┘    │    scroll-snap 对齐
├─────────────────────────────┤
│ 全部相册                     │
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐  │
│ │ +│ │  │ │  │ │  │ │  │  │  ← 120×120 小方卡横滑
│ │  │ │  │ │  │ │  │ │  │  │    新建按钮在首位
│ └──┘ └──┘ └──┘ └──┘ └──┘  │    封面图 + 渐变叠加
└─────────────────────────────┘
```

### 1.2 大卡样式

- 尺寸：`min(200px, 55vw)` 宽 × 260px 高（手机端确保露出 1.5 张引导横向滑动）
- 圆角：24px
- 背景：相册封面图 `object-fit: cover` 全填充
- 叠加层：`linear-gradient(transparent, rgba(0,0,0,0.6))` 底部渐变
- 底部文案区：
  - 日期标签：13px / 400 / rgba(255,255,255,0.55) / letter-spacing 1px
  - 相册名：18px / 800 / white
  - 统计行：10px / rgba(255,255,255,0.5) — "12 张 · 2024.03-05"
- 背景暗色：`#0d0d1a`（LV30- 和 LV30+ 都用深色）
- `scroll-snap-type: x mandatory; scroll-snap-align: center` 保证滑动对齐

### 1.3 小卡样式

- 尺寸：120×120px
- 圆角：20px
- 背景：相册第一张预览图 + `linear-gradient(transparent, rgba(0,0,0,0.5))` 底部
- 底部文案：相册名 11px/700 white + 照片数 9px
- 新建按钮：`rgba(255,255,255,0.06)` 纯色 + Plus 图标，首位

### 1.4 管理模式

- 长按触发（保持不变，500ms）
- 管理态下卡片角显选中圆圈
- 顶部工具栏：改名、删除、完成按钮
- LV30+ 玻璃态在管理模式下保留

### 1.5 TA的相册页

- 布局与我的相册完全一致
- 移除：新建按钮、管理模式、长按管理、编辑工具栏
- 新增：返回按钮、收藏按钮（Heart）

### 1.6 LV30+ 差异化

- 背景替换为极光深色动画（保留现有 Lv30AlbumBg / aurora 动画）
- 大卡增加 `backdrop-filter: blur(16px)` 玻璃态
- 扫光效果在每个大卡上周期性触发

---

## 2. 相册详情页 — 杂志式时间分组

### 2.1 布局结构

```
┌─────────────────────────────┐
│ ← 东京漫步                    │  ← Header: 名称 + 日期范围
│    24张 · 2024.03-05    ···  │    更多操作按钮(省略号)
├─────────────────────────────┤
│    ┌─── 精选 ───┐            │
│    │ Carousel3D │            │  ← 保留精选轮播（仅≥2张时展示）
│    │ (保留组件)  │            │
│    └────────────┘            │
├─────────────────────────────┤
│                              │
│  五月 · 12 photos ──────    │  ← 月份标题 26px/900
│  ┌──────┐ ┌──┐ ┌──┐        │
│  │      │ │  │ │  │        │  ← 非对称网格
│  │  大  │ └──┘ └──┘        │     2fr 1fr 1fr
│  │      │ ┌──┐ ┌──┐        │     大图跨两行
│  └──────┘ │  │ │  │        │
│           └──┘ └──┘        │
│                              │
│  四月 · 8 photos ───────    │  ← 透明度略降
│  ┌──────┐ ┌──┐             │
│  │ 横图  │ │  │             │  ← 1fr 1fr 1fr
│  ├──────┤ └──┘             │     横图跨两列
│  │      │ ┌──┐             │
│  │      │ │  │             │
│  └──────┘ └──┘             │
│                              │
│  三月 · 4 photos ───────    │  ← 透明度更低(越早越淡)
│  ┌──┐ ┌──┐                 │
│  │  │ │  │                 │  ← 1fr 1fr
│  └──┘ └──┘                 │
│                              │
│  [评论区] (折叠，点击展开)    │
│                              │
│                        [+]  │  ← 悬浮上传按钮
└─────────────────────────────┘
```

### 2.2 月份标题

- 字体：26px / font-weight 900 / letter-spacing -0.5px
- 颜色：`rgba(255,255,255,0.85)` → 越旧的月份透明度越低（最低 0.3）
- 右侧：`· N photos` 11px 次级色 + 分隔线 `height: 1px`
- 手机端字号调整为 24px

### 2.3 非对称网格规则

根据该月照片数自动选择列布局：

| 照片数 | 布局 | 说明 |
|---|---|---|
| 1 | `1fr` | 单张大图 |
| 2 | `1fr 1fr` | 并排 |
| 3 | `1fr 1fr 1fr` | 三列均分 |
| 4 | `1fr 1fr` 两行 | 2×2 |
| 5 | `2fr 1fr 1fr` + 跨行 | 左侧大图跨两行，右侧 4 小图 |
| 6 | `2fr 1fr 1fr` ×2 行 | 标准杂志布局 |
| 7+ | 同上，超出部分 3 列均分 | 多行延续 |

- 间距（gutter）：4px 紧凑间距，让照片组呈现「一块内容」的视觉整体感
- 圆角：大图 12px，小图 10px

### 2.4 虚拟滚动

- 使用 `react-virtuoso` 处理大量照片
- 每组（月份）为一个列表项
- 滚动到底自动加载下一页（分页 30 张/页）
- 快速滚动时月份标题 sticky 置顶提示当前位置

### 2.5 悬浮操作按钮

- 位置：右下角 fixed
- 样式：44×44px 圆形，`rgba(200,150,110,0.9)` 暖色半透明，无边框
- 图标：Plus（上传照片）
- 阴影：`0 4px 20px rgba(200,150,110,0.4)` 暖光氛围
- 可选：点击展开径向菜单（上传 / 编辑权限 / 管理精选）
- 滚动隐藏时有缩放动画

### 2.6 手机端适配

- Header padding 适配状态栏（`var(--status-bar-height)` + safe-area-inset-top）
- 非对称网格 gutter 保持 4px
- 月份标题：24px
- 悬浮按钮：40×40px，bottom 距底部安全区 + 16px
- 底部评论区留足安全区距离

### 2.7 用户相册详情页（TA的）

- 布局同上
- 移除：悬浮上传按钮、编辑工具栏
- 新增：收藏按钮（Heart）在 Header 右侧
- 评论区保留（仅可评论，不可删除他人评论）

---

## 3. 动效设计

| 元素 | 动效 | 实现方式 |
|---|---|---|
| 列表页大卡 | 横滑时中间卡片 scale 1.0 两侧 0.92 | Framer Motion `useScroll` + `useTransform` |
| 大卡入场 | 从下淡入 + 错峰 delay | `whileInView` + stagger 0.08s |
| 进入详情 | 封面图到头部共享过渡 | `layoutId` (如果页面切换可行) 或手动 spring |
| 月份标题 | 滚动时透明度衰减（越远越淡） | `useScroll` + opacity 映射 `[0.3, 1]` |
| 照片网格 | 进入视口时错峰 scale 淡入 | `whileInView` + staggerChildren 0.04s |
| 悬浮按钮 | 向上滚动时缩小 + 旋转 | `useScroll` + `useTransform` |
| 照片点击展开 | spring 弹性缩放到全屏查看器 | 保留现有 ImageViewer 组件 |
| 扫光 | LV30+ 大卡/照片周期性扫光 | 保留现有扫光动画 |

---

## 4. 后端变更

### 4.1 移除照片数量限制

**文件**: `routes/album.js`

删除上传端点中的 10 张限制逻辑：
```js
// 删除这两行
const [[{ cnt }]] = await pool.execute('SELECT COUNT(*) as cnt FROM album_photos WHERE album_id = ?', [albumId]);
if (cnt >= 10) return res.json({ code: 400, message: '每个相册最多10张照片' });
```

### 4.2 新增照片分页接口

**现有接口**: `GET /api/album/:albumId/photos` — 返回全部照片  
**新增参数**: `?page=1&limit=30`

返回格式：
```json
{
  "code": 0,
  "data": {
    "album": { "id": 1, "name": "...", "carousel_photos": [], "visibility": "public", "favorite_count": 10 },
    "photos": [{ "id": 1, "url": "...", "caption": "", "created_at": "2024-05-15" }],
    "pagination": { "page": 1, "limit": 30, "total": 145, "hasMore": true }
  }
}
```

实现：
```sql
-- 获取总数
SELECT COUNT(*) as total FROM album_photos WHERE album_id = ?;

-- 分页查询（保持按 created_at 排序）
SELECT id, url, caption, created_at FROM album_photos
WHERE album_id = ? ORDER BY created_at DESC
LIMIT ? OFFSET ?;
```

### 4.3 新增相册日期范围统计

在列表查询（`/my` 和 `/user/:userId`）中，增加 `date_from` / `date_to` 字段：
```sql
SELECT MIN(ap.created_at) as date_from, MAX(ap.created_at) as date_to
FROM album_photos ap WHERE ap.album_id = a.id
```

### 4.4 不变的部分

- `album_photos` 表结构不变（已有 `created_at` 字段）
- 权限校验逻辑不变
- 相册 CRUD、评论、收藏接口不变
- 精选轮播逻辑不变
- 文件上传（multer）不变

---

## 5. 前端变更清单

### 文件范围

| 文件 | 变更类型 | 说明 |
|---|---|---|
| `src/pages/Profile/MyAlbumPage.tsx` | 重写 | Cover Story 列表 + 重写详情页 |
| `src/pages/Profile/UserAlbumPage.tsx` | 重写 | 同上（移除管理功能） |
| `src/components/AlbumComments.tsx` | 微调 | 适配深色背景、无边框 |
| `src/components/Carousel3D.tsx` | 提取 | 从页面中提取为独立组件（目前内联在两个页面中重复定义） |
| `src/api/user.ts` | 新增 | 添加分页参数到 `getAlbumPhotos` |

### 新增文件

| 文件 | 说明 |
|---|---|
| `src/components/CoverStoryCard.tsx` | 列表页大卡组件 |
| `src/components/AlbumGrid.tsx` | 杂志式非对称网格组件 |
| `src/components/MonthSection.tsx` | 月份分组标题 + 照片组组件 |

### 新增依赖

```json
{
  "react-virtuoso": "^4.x"
}
```

---

## 6. 测试要点

- [ ] 创建新相册后在 Cover Story 列表正确展示
- [ ] 上传 10+ 张照片不再被限制
- [ ] 上传 50+ 张照片后虚拟滚动正常工作
- [ ] 月份分组正确（跨年、跨月）
- [ ] 非对称网格在不同照片数下布局正确
- [ ] 手机端横滑、snap 对齐正常
- [ ] 他人相册页权限过滤正常（public/friends/private）
- [ ] LV30+ 玻璃态/极光特效正常
- [ ] 精选轮播 3D 效果正常（照片增删后同步）
- [ ] 评论区展示、发送、删除正常
- [ ] 长按进入管理模式正常

---

## 7. 技术决策记录

1. **月份分组在前端做**：后端返回 `created_at` 排序的扁平列表，前端 `groupBy`。原因：逻辑简单、后端不改 SQL、分组后仍支持虚拟滚动。
2. **react-virtuoso 选型**：社区活跃、API 简单、支持分组列表（grouped mode）、TypeScript 支持好。
3. **Carousel3D 提取为独立组件**：目前两个页面各自定义了 Carousel3D，重设计时统一提取到 `src/components/` 避免重复。
4. **无边框设计**：所有 `border` 移除，用 `box-shadow`、`rgba` 填充、`backdrop-filter` 区分层级。深色背景为主线。
5. **不使用 emoji**：所有图标使用 Lucide React (`Plus`, `Heart`, `ChevronLeft`, `MoreHorizontal`, `Camera`, `Trash2`, `Pencil` 等)。
