# 排名页面重设计 — 领奖台双榜

## 概述

重新设计等级页面的「排名」tab，采用领奖台式（Podium）视觉方案，新增「等级榜」和「人气榜」双榜切换，前三名用金银铜柱台展示，4名往后滚动列表，本人排名行左侧暖金高亮。

## 页面结构

排名 tab 内：
```
┌─────────────────────────────┐
│  [等级榜]  [人气榜]  ← pill切换  │
├─────────────────────────────┤
│                             │
│     ★  Podium 前三名        │
│    NO.2  NO.1  NO.3         │
│    ██    ██    ██           │
│    ██    ██    ██   柱台     │
│    ██    ██                 │
│                             │
├─────────────────────────────┤
│  #4  头像  昵称      LV.28   │
│  #5  头像  昵称      LV.25   │
│  ...                         │
│  #12 ▏头像  (我)  LV.18 ←高亮 │
└─────────────────────────────┘
```

## 交互细节

### 双榜切换
- 顶部 pill tab：「等级榜」「人气榜」，切换时 podium 和列表同步刷新
- 等级榜排序：LV desc → EXP desc
- 人气榜排序：followers desc

### Podium 前三名
- NO.1：金色柱台最高 (+星标)，柱面显示核心数值
  - 等级榜：LV.50
  - 人气榜：256粉丝
- NO.2：银色柱台中等高度
- NO.3：铜色柱台最低
- 柱台上方显示排名圆形徽章 (1/2/3)
- Podium 区总高度约 160px

### 后续列表 (4名 ~ N)
- 圆形头像 + 昵称 + 右侧数值徽章
- 圆角白色卡片行，间距 5px
- 等级榜显示 LV.XX 徽章，人气榜显示 XX粉丝

### 本人高亮
- 左侧 3px 暖金色竖线 (`#c8956c`)
- 整行浅暖金底色 (`rgba(200,149,108,0.06)`)
- 昵称旁显示「(我)」
- 本人排到前 3 名时 podium 柱台也需相应标识

## 数据

### 等级榜
- 复用现有 API `GET /api/user/level/ranking`
- 返回 `{ list: User[], me: User }` — 好友列表 + 本人

### 人气榜（需新增）
- **后端**: 新增 `GET /api/user/ranking/popular` 路由
  - SQL: `SELECT id, nickname, avatar, level, followers FROM users WHERE id != ? ORDER BY followers DESC LIMIT 50`
  - 排除系统机器人 (id=9999) 和当前用户
  - 本人单独查询插入正确位置
- **前端**: 新增 `getPopularRanking()` API 函数

## LevelPage 改造

### 新增文件
- 无

### 修改文件
- `src/pages/Profile/LevelPage.tsx` — 重写排名 tab UI
- `src/api/user.ts` — 新增 `getPopularRanking()`
- `C:\Users\25855\AZ-chat-后端\routes\user.js` — 新增人气榜 API

### 排名 tab 新组件结构
- 保留现有 `tab` state 增加 `'level' | 'popular'` 子 tab
- Podium 组件：渲染前三名柱台
- RankingList 组件：渲染 4-N 名列表
- 本人高亮逻辑：查找 `me` 位置，若不在前三则在列表中高亮

## 设计约束
- 图标使用 lucide-react（Trophy, Star, Heart 等），无 emoji
- 保持 AZ-chat 暖色调 (cream-100/200, warm-500)
- Podium 柱台渐变：金 #fbbf24→#f59e0b / 银 #d0d0d0→#e0e0e0 / 铜 #cd7f32→#daa520
- 本人高亮色：暖金 #c8956c
