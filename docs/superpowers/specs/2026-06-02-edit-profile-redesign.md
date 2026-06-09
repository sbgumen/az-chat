# Edit Profile Page Redesign

## 概述

对现有编辑资料页面（`EditProfilePage.tsx`）进行视觉和交互优化，在不改变现有功能逻辑的前提下，提升页面的视觉层次、微交互体验和用户填写意愿。

所有优化基于现有 cream/warm 设计系统，不引入新的颜色体系或组件库。

## 页面布局（从上到下）

1. **Header** — 返回按钮 + 标题「编辑资料」+ 副标题「完善你的个人档案，让更多人了解你」
2. **个性化入口** — 移至顶部，渐变暖色横幅卡片
3. **头像区域** — 呼吸光晕 + 渐变细环边框 + 右下角相机角标
4. **资料完整度** — 百分比数字 + 进度条卡片
5. **基础信息表单** — 昵称/性别/体重/身高/生日（同一卡片）
6. **个人签名** — 独立卡片，引号装饰
7. **个性标签** — 推荐标签 + 已有标签 + 自定义输入
8. **保存按钮** — 底部固定，渐变暖金色

## 逐项改动

### 1. Header 副标题

- 标题下方增加 `font-size: 11px, color: #BFB0A3` 副标题
- 文案：「完善你的个人档案，让更多人了解你」

### 2. 个性化入口（移至顶部）

- 从表单区域中移到 avatar 上方第一位
- 视觉：`linear-gradient(135deg, #FEFDFB, #FDF5EF)` 渐变背景
- 左侧：`44x44` 圆角 16px 金色渐变图标 + 文案「个性化你的主页 / 背景图、主页风格、装饰特效」
- 右侧：箭头 `>`
- 右下角装饰光斑（伪元素，径向渐变圆）
- hover：微上浮 + 暖色阴影

### 3. 头像区域

- **光晕**：`96x96` 头像外围 `inset: -12px` 径向渐变圆，`glow-pulse` 呼吸动画（3s ease-in-out）
- **细环**：`inset: -4px`，border-image 方式实现渐变金环（`#D4A574 → #E8B89A → #D4A574`）
- **相机角标**：右下角 `28x28` 白色圆角方块 + 相机 SVG 图标，hover 放大
- **提示文字**：「点击头像更换照片」

### 4. 资料完整度

- 独立卡片，左侧显示百分比数值（`font-size: 22px, font-weight: 700, color: #D4A574`）
- 右侧：标签「资料完整度」+ 提示「继续完善可获得更多关注」
- 进度条：`height: 4px`，`border-radius: 2px`，填充色 `linear-gradient(90deg, #D4A574, #E8B89A)`
- 数据来源：根据已有字段计算填充率（昵称 20% + 头像 20% + 性别 15% + 体重 10% + 身高 10% + 生日 10% + 签名 10% + 标签 5%）

### 5. 基础信息表单

- 所有字段 label 左对齐（`text-align: left`），value/input 右对齐（`text-align: right`）
- 字段间用 `border-top: 1px solid #F8F5F0` 分隔
- 焦点态：字段背景微变 `#FEFBFB`

**脏状态指示**：
- 修改过的字段左侧出现 `4x4` 暖金色圆点（`color: #D4A574`）
- 对应的 input 文字变为暖金色

**性别选择器 — Color Drop 设计**：
- 三个彩色圆形水滴排列：女（粉渐变）、男（蓝渐变）、未设置（灰渐变）
- 每个水滴 `44x44`，内含对应符号
- 选中态：`transform: scale(1.1)` + 彩色光晕环（`::after` 伪元素）+ 底部小标签浮现
- 标签文字：「已选」/「切换」
- 所有过渡使用 `cubic-bezier(0.22, 0.61, 0.36, 1)`

**生日**：
- 保持现有 DatePicker 滚轮组件不变

### 6. 个人签名

- 独立卡片
- 标题行：左侧「个人签名」+ 右侧字数统计 `14/100`
- textarea 使用暖色底背景 `#FEFDFB`，圆角 12px
- 右上角装饰：大号灰色引号 `"`（`font-size: 28px, color: #F2EDE6`）

### 7. 个性标签

- **推荐标签区**：
  - 标题行：「为你推荐」+ 闪烁金色圆点（`glow-pulse` 动画）
  - 虚线边框标签（`border: 1px dashed #E8E0D6`），点击 `+` 一键添加
  - 已添加的标签变灰不可操作
  - 与已有标签用 `1px solid #F8F5F0` 分割线隔开

- **已有标签**：渐变暖色背景 `linear-gradient(135deg, #FDF5EF, #F9E8D9)`，hover 红叉删除

- **自定义输入**：输入框 + 金色圆角加号按钮

- 推荐标签数据源：后端 `/api/user/recommend/tags` 接口（需要新增），或前端基于用户已有资料推断

### 8. 保存按钮

- 底部固定，上方 `border-top: 1px solid #F8F5F0`
- 按钮：`linear-gradient(135deg, #D4A574, #C8956C)`，圆角 16px
- 阴影：`0 4px 16px rgba(200,149,108,0.2)`
- hover：上浮 1px + 阴影加深
- active：回弹

## 不需要修改的部分

- 日期选择器（DatePicker / WheelColumn）— 保持现有代码
- 表单验证逻辑（validate / handleSave）— 保持现有代码
- API 调用（updateProfile / uploadAvatar / getProfile）— 保持现有代码
- 路由和导航逻辑 — 保持现有代码
- 文件结构 — 仅修改 `EditProfilePage.tsx` 一个文件

### 9. ProfilePage 编辑资料入口（新增完整度进度条）

- 编辑资料按钮下方新增迷你进度条行
- 进度条：`height: 3px`，背景 `#F2EDE6`，填充 `linear-gradient(90deg, #D4A574, #E8B89A)`
- 右侧显示百分比数字（`font-size: 10px, font-weight: 700, color: #D4A574`）
- 布局：flex row，进度条 `flex: 1` + 百分比

### 10. SettingsPage 账号资料入口（新增环形百分比）

- 「账号资料」行右侧新增 `34px` 环形百分比指示器
- 实现方式：`conic-gradient` 圆环（`#D4A574` 填充弧 + `#F2EDE6` 剩余弧）
- 内圈白色 `24px` 圆形，显示百分比数字（`font-size: 8px, font-weight: 700`）
- 环形百分比位于 chevron `>` 左侧

### 资料完整度计算（共享工具函数）

新增 `src/utils/profileCompletion.ts`：

```ts
function calcCompletion(profile: any): number {
  let filled = 0;
  const total = 100;
  if (profile.nickname) filled += 20;
  if (profile.avatar && profile.avatar !== '/default-avatar.png') filled += 20;
  if (profile.gender && profile.gender !== 0) filled += 15;
  if (profile.weight) filled += 10;
  if (profile.height) filled += 10;
  if (profile.birthday) filled += 10;
  if (profile.signature) filled += 10;
  if (profile.tags && profile.tags.length > 0) filled += 5;
  return filled;
}
```

该函数供 EditProfilePage、ProfilePage、SettingsPage 共同使用。

## 不需要修改的部分

- 日期选择器（DatePicker / WheelColumn）— 保持现有代码
- 表单验证逻辑（validate / handleSave）— 保持现有代码
- API 调用（updateProfile / uploadAvatar / getProfile）— 保持现有代码
- 路由和导航逻辑 — 保持现有代码

## 涉及文件

| 文件 | 改动类型 |
|---|---|
| `src/pages/Profile/EditProfilePage.tsx` | 全部重写 JSX 样式部分，保留逻辑代码 |
| `src/pages/Profile/ProfilePage.tsx` | 编辑资料按钮下方新增完整度进度条 |
| `src/pages/Profile/SettingsPage.tsx` | 账号资料行右侧新增环形百分比 |
| `src/utils/profileCompletion.ts` | **新增** — 资料完整度计算工具函数 |

## 新增后端接口（可选，推荐标签功能需要）

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | `/api/user/recommend/tags` | 返回推荐标签列表（基于用户资料推断） |

如果暂不新增后端接口，前端可使用硬编码的默认推荐标签列表作为 fallback。
