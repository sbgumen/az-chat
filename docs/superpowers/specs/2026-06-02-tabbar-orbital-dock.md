# TabBar Redesign — Orbital Dock

## 概述

将底部导航栏从传统图标+文字横排改为类 macOS Dock 的悬浮托盘设计。选中 tab 以 Q 弹弹簧动画凸出菜单栏，未选中项保持简洁。

所有设计基于现有 cream/warm 色彩体系，不引入新颜色。

## 设计核心

**Orbital Dock** — 4 个 tab 等距排列在毛玻璃圆角托盘内。选中 tab 图标放大 + 金色渐变 + 双层投影 + 上浮凸出，带 Q 弹弹簧动画。

## 布局结构

```
┌─ dock-wrap (overflow: visible) ─┐
│  ┌─ dock (backdrop-blur, 圆角 26px) ─┐
│  │  [消息] [联系人] [选中-凸出] [我的] │
│  └────────────────────────────────────┘
└──────────────────────────────────────┘
┌─ home-bar ─┐
│  ────────  │ (iOS 风格指示条)
└────────────┘
```

## 组件改动

### 文件：`src/components/TabBar/TabBar.tsx`

**保留不变**：
- Props 接口（`activeTab`, `onTabChange`, `unreadMessages`）
- Tab 定义数组（4 个 tab 配置）
- 未读角标逻辑
- Framer Motion 动画依赖

**改动内容**：

#### 1. 外层容器
- 移除 `fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t` 全宽条
- 改为：居中 flex 容器，`overflow: visible`（允许选中按钮溢出）
- 保留 `pb-[env(safe-area-inset-bottom)]`

#### 2. Dock 托盘
```tsx
<div className="flex items-end gap-0.5 px-3.5 py-1.5 rounded-[26px]"
  style={{
    background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(253,251,247,0.92))',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(200,149,108,0.06)',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.6) inset, 0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 8px rgba(45,32,22,0.04), 0 6px 24px rgba(45,32,22,0.05)',
    height: 50,
    overflow: 'visible',
  }}
>
```

#### 3. 顶部高光线
- `::after` 伪元素，`1px` 白色渐变线，模拟玻璃磨边

#### 4. 单个 Tab 按钮
- `flex flex-col items-center gap-0.5 px-3 py-1`
- 默认 `translateY(0)`，坐在 dock 内

#### 5. 图标容器
- 默认：`w-[34px] h-[34px] rounded-[11px]`，透明背景，灰色图标（`#BFB0A3`）
- 选中：`w-[48px] h-[48px] rounded-[16px]`，金色渐变背景，白色图标 + `drop-shadow`
- 选中 `::after` 伪元素：内阴影仿玻璃质感（顶部高光 + 底部暗角）

#### 6. 选中图标投影
```tsx
boxShadow: '0 0 0 3px rgba(200,149,108,0.08), 0 6px 20px rgba(200,149,108,0.28), 0 12px 36px rgba(200,149,108,0.10)'
```

#### 7. 标签文字
- 默认 `opacity: 0`
- 选中 `opacity: 1, color: #8B6248, font-weight: 600`

#### 8. Q弹动画（Framer Motion）

使用 `motion.button` + 自定义变体：

```tsx
const bounceVariants = {
  inactive: { y: 0, scale: 1 },
  // press down first, then spring up through keyframes
  active: {
    y: -16,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 18,
      mass: 1.2,
    },
  },
};
```

选中 tab 用 `layout` prop 做弹簧过渡（Framer Motion 内置 spring 物理引擎）。

**退出动画**：`damping: 28` 更低回弹，快速归位。

#### 9. 选中态 background glow
保留现有 `layoutId="tabbar-glow"` 但调整为只在图标容器内生效。

#### 10. 未读角标
保留现有红色胶囊 + `animate-pulse-soft`，位置微调适配新尺寸。

#### 11. home 指示条
dock 下方保留 `h-[22px]` 区域 + 居中 `w-[130px] h-[5px]` 灰色横条。

## 不需要修改的部分

- `Layout.tsx` — 布局逻辑不变
- `SideNav` — 桌面端侧边栏不变
- Tab 路由映射 — 不变
- 未读消息获取逻辑 — 不变

## 涉及文件

| 文件 | 改动 |
|---|---|
| `src/components/TabBar/TabBar.tsx` | 重写 JSX 和样式 |
