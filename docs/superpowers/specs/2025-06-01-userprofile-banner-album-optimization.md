# UserProfilePage 背景图 + 相册入口优化

## 概述

三项改动：
1. Hero 区域底层叠加柔和背景图/纹理
2. 相册入口改为无边框 Editorial 不规则网格
3. 新增背景图选择/裁剪页面，支持系统预设和自定义上传

---

## 一、顶部背景图

### 层级结构

```
Hero 容器 (position: relative)
  ├─ 背景图层 (position: absolute, inset: 0, opacity: 0.2-0.35)
  │   └─ 用户上传的图 / 系统预设 CSS / 默认纹理
  ├─ 渐变遮罩 (position: absolute, inset: 0)
  │   └─ linear-gradient(0deg, #f5efe4 0%, transparent 60%)
  └─ 内容层 (position: relative, z-index: 1)
      └─ 现有头部全部内容（不动）
```

### 背景图来源

| 来源 | 说明 |
|------|------|
| 系统预设（6种） | 暖色晨曦、晨雾山影、暖沐流光、星夜幕色、樱吹雪、林间晨光 |
| 用户上传 | 从相册选择图片 → 3:1 裁剪 → 上传保存 |
| 默认纹理 | 未设置时的 fallback：CSS 径向光晕 + SVG 点阵 |

### LV30+ 暗色适配

- 暗色模式下背景图叠加 `rgba(0,0,0,0.5)` 遮罩
- 让背景图变暗，融入 `#0f0c1e → #130e28` 暗色背景

---

## 二、相册入口重设计

### 改动

去掉当前 `bg-white rounded-2xl shadow-sm` 白色卡片，改为 Editorial 风格：

```
SectionLabel "相册" + GradientDivider + "查看全部 →"
┌──────────┬──────┬──────┐
│  大图    │ 图2  │ 图4  │
│ (1.2fr)  │      │      │
│  跨两行  ├──────┼──────┤
│          │ 图3  │ +12  │
└──────────┴──────┴──────┘
```

- 无卡片边框，SectionLabel + GradientDivider 风格（与群设置页统一）
- `grid-template-columns: 1.2fr 0.8fr 0.8fr`，左大图跨两行
- 最后一张半透明遮罩显示 "+N" 剩余数量
- 照片占位用暖色渐变

---

## 三、背景图选择页（新页面）

### 路由

`/user/:userId/banner` — BannerSelectPage

### 布局

```
Header: ← 返回      选择背景图

实时预览区（Banner 效果预览，带用户头像和名字）

系统预设 (SectionLabel)
  3x2 网格，6 个预设卡片（CSS 渐变缩略图）
  点击 = 立即应用（保存 preset key 到后端）

自定义 (SectionLabel)
  虚线边框上传按钮："从相册中选择"
  点击 → 系统文件选择器
  选择后 → 进入裁剪模式（同页面内切换）

当前背景 (SectionLabel)
  当前使用的背景缩略图
  "移除背景" 按钮（恢复默认纹理）
```

### 交互逻辑

| 操作 | 行为 |
|------|------|
| 点击预设卡片 | 调用 API 保存 `banner_type: 'preset'` + `banner_preset: 'sunrise'` |
| 点击上传图片 | 打开文件选择器，选完后进入裁剪模式 |
| 裁剪完成 | 上传裁剪后的图到 `/uploads/banner_xxx`，保存 URL |
| 移除背景 | 重置为 `banner_type: 'default'` |
| 返回 | 回到来源页面 |

### 裁剪模式（同页面内）

- 全屏暗色覆盖层
- 固定 3:1 裁剪框 + 白色四角标记 + 九宫格辅助线
- 单指拖动图片 / 双指 Pinch 缩放
- 底部缩放滑条
- 底部实时预览裁剪结果
- "取消" → 回到选择状态，"完成" → Canvas 裁剪 → upload → save

---

## 四、入口点

| 入口 | 页面 | 触发方式 |
|------|------|---------|
| 自己的 UserProfilePage | `/user/:userId` | Hero 背景区域出现"编辑背景"浮层按钮（仅自己的主页可见） |
| ProfilePage | `/profile` | 设置齿轮 → 添加到菜单项，或 Hero 区域加编辑按钮 |
| EditProfilePage | `/profile/edit` | 在编辑项列表中加入"编辑背景图"行 |

---

## 五、后端 API

### 新增接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/user/banner` | 上传背景图（Multer, max 10MB, JPG/PNG/WebP） |
| PUT | `/api/user/banner-settings` | 保存背景图设置（`{ banner_type, banner_preset, banner_image }`） |

### 数据字段

在 `users` 表新增字段：
- `banner_type` — `'default'` | `'preset'` | `'custom'`
- `banner_preset` — 预设名称（`'sunrise'`, `'mountain'`, `'flow'`, `'starry'`, `'sakura'`, `'forest'`）
- `banner_image` — 自定义上传图的 URL

### GET `/api/user/profile/:userId` 返回增加

```json
{
  "banner_type": "preset",
  "banner_preset": "sunrise",
  "banner_image": null
}
```

---

## 六、文件变更

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/pages/Profile/UserProfilePage.tsx` | 修改 | Hero 加背景图层；相册区域重写；自己的主页显示编辑背景按钮 |
| `src/pages/Profile/ProfilePage.tsx` | 修改 | 添加编辑背景图入口（菜单项或 Hero 按钮） |
| `src/pages/Profile/EditProfilePage.tsx` | 修改 | 添加"编辑背景图"行 |
| `src/pages/Profile/BannerSelectPage.tsx` | 新建 | 背景图选择页（含裁剪模式） |
| `src/api/user.ts` | 修改 | 新增 `uploadBanner`, `saveBannerSettings` |
| `src/App.tsx` | 修改 | 添加 `/user/:userId/banner` 路由 |
| 后端 `routes/user.js` | 修改 | 新增 banner 上传 + banner-settings 接口 |
| 后端 `app.js` | 修改 | 数据库新增 `banner_type`, `banner_preset`, `banner_image` 字段 |

---

## 七、6 个系统预设详情

| 预设名 | key | CSS 实现 | 色系 |
|--------|-----|----------|------|
| 暖色晨曦 | `sunrise` | 暖调三色渐变 + 柔光 | 暖橙 #f5d5b0 / #e8c8a0 / #d4a574 |
| 晨雾山影 | `mountain` | 雾蓝底 + clip-path 山脊线 | 蓝灰 #c8d8e0 / #a0b8c8 |
| 暖沐流光 | `flow` | 暖棕底 + 半透明白色圆形光晕 | 暖棕 #e8d0b8 / #c8a880 |
| 星夜幕色 | `starry` | 深紫渐变 + 散布白色星点 | 暗紫 #1a1a2e / #3d2e4a |
| 樱吹雪 | `sakura` | 樱粉渐变 + 半透明粉色圆点花瓣 | 樱粉 #f5e0e8 / #e8c8d4 |
| 林间晨光 | `forest` | 绿调渐变 + clip-path 树冠层 | 森林绿 #d4e0c8 / #bcd0a8 |

全部纯 CSS 实现，无图片资源依赖。

---

## 八、自检

- [x] 头部布局不动
- [x] LV30+ 暗色适配
- [x] 默认 fallback 纹理
- [x] 无相册时隐藏
- [x] 无 emoji — Lucide 图标
- [x] 无卡片边框 — Editorial 分割线
- [x] 6 个系统预设
- [x] 用户上传 + 裁剪
- [x] 多个入口点（自己主页、ProfilePage、EditProfilePage）
- [x] 后端数据持久化
