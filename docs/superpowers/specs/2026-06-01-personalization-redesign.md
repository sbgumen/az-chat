# 个性化设置重构 & 主页风格重设计

## 概述

重构个人主页美化配置体系：将背景设置和主页风格整合为统一的"个性化设置"入口，重新设计主页风格选择页面（实时预览 + 缩略图条），新增 4 种分级解锁风格，打造差异显著的视觉效果。

## 页面结构调整

### 路由变更

| 旧路由 | 新路由 | 说明 |
|---|---|---|
| `/profile/banner` | `/profile/personalization/banner` | 背景图设置迁移到个性化子路由 |
| - | `/profile/personalization` | 新增：个性化设置主页 |
| - | `/profile/personalization/style` | 新增：主页风格选择页 |

### 入口改造

| 位置 | 当前 | 改为 |
|---|---|---|
| `EditProfilePage` 背景图行 | 标题"背景图"，跳转 `/profile/banner` | 标题"个性化设置"，跳转 `/profile/personalization` |
| `UserProfilePage` 右上角编辑按钮 | 跳转 `/profile/banner` | 跳转 `/profile/personalization` |

### 旧页面处理

- `BannerSelectPage`：整体迁移为 `/profile/personalization/banner` 的页面内容，从原路径移除
- LV30 主页风格区块从 `BannerSelectPage` 中删除

## 新页面设计

### 1. PersonalizationPage (`/profile/personalization`)

**布局**：双卡片画廊 — 两个大卡片垂直排列，每个卡片包含顶部彩色预览区和底部信息栏。

**设计规范**：
- 纯色渐变预览区，无边框卡片
- 图标使用 lucide-react（无 emoji）
- 卡片之间间距 12px
- 当前选择显示在卡片底部

**卡片1 — 背景图设置**:
- 顶部：暖金色渐变预览区，叠加当前背景图缩略图
- 底部：左侧显示"当前: 日出/自定义/默认"，右侧箭头按钮

**卡片2 — 主页风格**:
- 顶部：当前风格的渐变预览区 + 3 个色点
- 底部：左侧显示"当前: 水晶棱镜"，右侧色点指示

### 2. HomeStylePage (`/profile/personalization/style`)

**布局**：实时预览 + 缩略图条

**上部 — 实时预览区（占屏幕约 60%）**：
- 全屏沉浸式预览当前选中风格效果，模拟个人主页外观
- 渲染内容：风格背景渐变 + 极光层动效 + 模拟头像环 + 昵称 + 等级徽章 + ID
- 极光层实时流动动画（framer-motion animate），粒子漂浮
- 预览区背景完全应用当前风格的 `bgGradient` + `aurora1-4`
- 未解锁风格同样可以预览（去除遮罩），让用户看到完整效果

**下部 — 缩略图条（占屏幕约 30%）**：
- 6 个风格缩略图横向排列，当前选中缩略图放大 + 发光边框
- 每张缩略图：该风格的渐变色块 + 小圆环（模拟头像环）
- 已解锁风格：正常渲染，缩略图下方标注名称
- 未解锁风格：缩略图右下角显示小锁图标（Lock, lucide-react）
- 左右滑动浏览所有缩略图（overflow-x: auto + snap）
- 点击缩略图切换预览

**底部 — 操作区（约 10%）**：
- 当前风格名称 + 描述文字
- 已解锁风格："应用风格" 按钮（主色按钮，无边框）
- 未解锁风格：置灰按钮显示 "LV30 解锁"
- 当前使用中的风格：按钮显示 "使用中"（禁用态）

**交互细节**：
- 切换缩略图时，上部预览区有 0.3s 淡入淡出过渡
- 缩略图选中态：`scale(1.08)` + 2px 发光边框（使用风格 cardAccent 色）
- 触摸滑动缩略图条使用 `scroll-snap-type: x mandatory` 对齐

### 3. BannerSelectPage 迁移 (`/profile/personalization/banner`)

内容不变，仅路由改为 `/profile/personalization/banner`，返回按钮回到 `/profile/personalization`。

## 6 种风格定义

### 分级体系

| 解锁等级 | 风格列表 |
|---|---|
| LV1 | 原版经典 |
| LV20 | 鎏金暖阳 |
| LV25 | 樱吹雪 |
| LV30 | 水晶棱镜、极光幻境、暗夜霓虹 |

### 风格配置项（每个风格）

```typescript
interface StylePalette {
  name: string;           // 内部标识
  label: string;          // 显示名称
  desc: string;           // 描述文案
  unlockLevel: number;    // 解锁等级
  isDark: boolean;        // 深色模式标记
  bgBase: string;         // 基础背景色
  bgGradient: string;     // 整体渐变背景
  aurora1-4: string;      // 极光层径向渐变
  ringOuter: string;      // 头像外环渐变
  ringMiddle: string;     // 头像中环渐变
  ringInner: string;      // 头像内环渐变
  particleColors: string[]; // 粒子颜色数组
  btnBg: string;          // 按钮背景
  btnMsgGradient: string; // 发消息按钮
  btnDelBg: string;       // 删除按钮
  bottomBarBg: string;    // 底部栏背景
  tagBg / tagText: string; // 标签样式
  nameGradient: string;   // 昵称渐变
  nameShadow: string;     // 昵称阴影
  // 新增：预览卡片专属色
  cardAccent: string;     // 卡片强调色
}
```

### 风格详情

#### 1. 原版经典 (original) — LV1 默认
- **色调**: 暖奶油色 #f5efe4
- **风格**: 浅色温暖治愈系
- **背景**: 纯色奶油底色，无极光层
- **头像环**: 暖棕金色系 conic-gradient
- **粒子**: 棕色半透明
- **昵称**: 纯色深棕
- **特点**: 干净舒适，所有用户默认风格

#### 2. 鎏金暖阳 (golden) — LV20 解锁
- **色调**: 暗金底 #1a1208 → #2d1f0a
- **风格**: 日落余晖、奢华金质
- **背景**: 暗棕渐变 + 金色极光层
- **aurora1**: 琥珀金 rgba(245,158,11,0.8) → 橙金 rgba(249,115,22,0.4)
- **aurora2**: 深金 rgba(234,179,8,0.65) + 暖橙
- **头像环**: 金色系 conic-gradient（金→橙→琥珀→金）
- **粒子**: 金色系 rgba(245,158,11,0.35)
- **昵称渐变**: 金色流光 #fde68a→#fbbf24→#f59e0b
- **特点**: LV20 首款深色风格

#### 3. 樱吹雪 (sakura) — LV25 解锁
- **色调**: 暗粉底 #1a0a14 → #220f1a
- **风格**: 樱花飘落、梦幻柔粉
- **背景**: 暗粉紫渐变 + 粉色极光层
- **aurora1**: 粉红 rgba(244,114,182,0.8) → 玫红 rgba(236,72,153,0.4)
- **aurora2**: 淡粉 rgba(251,207,232,0.5) + 浅紫
- **头像环**: 粉色系 conic-gradient（粉→玫红→浅紫→粉）
- **粒子**: 粉色系 rgba(244,114,182,0.35)
- **昵称渐变**: 柔粉 #fbcfe8→#f9a8d4→#f472b6
- **特点**: LV25 专属浪漫风格

#### 4. 水晶棱镜 (crystal) — LV30 解锁
- **色调**: 紫黑底 #0a0814 → #130e28
- **风格**: 紫晶玻璃折射、幻彩琉璃
- **背景**: 深紫渐变 + 4层彩色极光（紫、粉、金、蓝）
- **aurora1**: 紫 rgba(139,92,246,0.85) → 靛蓝
- **aurora2**: 琥珀金 rgba(245,158,11,0.7)
- **aurora3**: 玫红 rgba(236,72,153,0.6)
- **aurora4**: 蓝 rgba(59,130,246,0.55)
- **头像环**: 全彩 conic-gradient（紫→粉→金→蓝→紫）
- **粒子**: 紫/粉/金三色
- **昵称渐变**: 紫→白→金→紫 四色流光
- **特点**: 最丰富的多层极光 + 全彩环

#### 5. 极光幻境 (aurora) — LV30 解锁
- **色调**: 深蓝绿底 #020d14 → #0a1628
- **风格**: 北极光流动、自然灵力
- **背景**: 深蓝渐变 + 4层绿/青极光
- **aurora1**: 翠绿 rgba(16,185,129,0.8) → 青
- **aurora2**: 蓝 rgba(59,130,246,0.65) → 靛蓝
- **aurora3**: 紫 rgba(168,85,247,0.55)
- **aurora4**: 青 rgba(6,182,212,0.5)
- **头像环**: 绿青蓝紫 conic-gradient
- **粒子**: 绿/青/蓝三色
- **昵称渐变**: 绿→浅绿→青→绿 流光
- **特点**: 清新自然极光主题

#### 6. 暗夜霓虹 (neon) — LV30 解锁
- **色调**: 纯黑紫底 #0a0014 → #120020
- **风格**: 赛博朋克、霓虹都市
- **背景**: 黑紫渐变 + 4层霓虹色极光
- **aurora1**: 品红 rgba(236,72,153,0.85) → 紫
- **aurora2**: 青 rgba(6,182,212,0.7) → 蓝
- **aurora3**: 电紫 rgba(168,85,247,0.6)
- **aurora4**: 霓虹蓝 rgba(56,189,248,0.55)
- **头像环**: 霓虹色 conic-gradient（品红→青→电紫→蓝→品红）
- **粒子**: 品红/青/紫三色
- **昵称渐变**: 品红→紫→青→品红 霓虹流光
- **特点**: 赛博朋克高对比度霓虹风格，粒子附带 glow 效果

## 未解锁状态 UI

未解锁风格卡片：
- 整个卡片叠加 60% 半透明黑色遮罩
- 居中显示锁图标（Lock，来自 lucide-react）
- 下方文字 "LV30 解锁"（等白色，13px 粗体）
- 卡片不可滑动选中，点击无效

## 数据流

### 风格存储
- 用户所选风格保存到后端 `users.lv30_style` 字段
- 前端 localStorage 键 `az_lv30_style` 缓存
- API: `PUT /api/user/lv30-style` 保存，`GET /api/user/lv30-style` 读取

### 风格预览
- HomeStylePage 读取用户当前等级判断哪些风格已解锁
- 预览卡片使用对应风格的 `bgGradient` + `aurora1` + `ringOuter` 渲染
- 点击"应用风格"调用 API 保存 + 更新本地缓存

## 实现文件清单

### 新增文件
- `src/pages/Profile/PersonalizationPage.tsx` — 个性化设置主页
- `src/pages/Profile/HomeStylePage.tsx` — 主页风格选择页

### 修改文件
- `src/App.tsx` — 添加新路由，调整旧路由
- `src/pages/Profile/BannerSelectPage.tsx` — 移除 LV30 风格区块，修改返回路径
- `src/pages/Profile/EditProfilePage.tsx` — 背景图入口改为个性化设置入口
- `src/pages/Profile/UserProfilePage.tsx` — 右上角编辑按钮跳转 `/profile/personalization`
- `src/components/effects/lv30Styles.ts` — 重命名类型，新增 3 种风格，添加 `unlockLevel` 和 `cardAccent` 字段

### 不删除但调整路由的文件
- `src/pages/Profile/BannerSelectPage.tsx` — 保留文件，仅改路由和去掉风格区块

## 设计约束

- 图标统一使用 lucide-react，不使用 emoji
- 所有卡片无边框（border: none），视觉分隔靠背景色差和阴影
- 页面整体背景色 Cream-100 (#f5efe4)
- 深色风格预览区域使用独立暗色背景
- 移动端触控优先：滑动手势切换卡片需处理 `touch-action: pan-y`
