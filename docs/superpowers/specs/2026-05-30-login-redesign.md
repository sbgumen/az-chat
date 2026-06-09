# Login Page Redesign — 登录/注册页面重新设计

## 目标

将现有卡片式登录页重新设计为高颜值、现代化的双端自适应登录体验。打破传统卡片/边框布局，采用分屏杂志风（桌面端）和圆形焦点（移动端），配合时间线进度式验证码输入，实现手机验证码登录 → 新用户昵称设置 → 完成注册的无缝两步流程。

---

## 设计语言

- **色调**：复用项目 cream/warm/sage 三色系，以暖米色为主，铜金色为点缀，鼠尾草绿为辅助
- **字体**：ZCOOL XiaoWei（展示标题）+ Noto Sans SC（正文）
- **动画**：framer-motion spring 动画，呼吸光晕，有机光斑浮动
- **核心原则**：零可见边框、零 Emoji 图标、无传统卡片容器、使用背景色差和微阴影区分层级

---

## 布局方案

### 桌面端 (>=768px) — 分屏杂志风

左右两栏布局，无外层卡片容器：

- **左栏（品牌展示区）**：大面积 warm 系渐变背景（#f5ede2 → #e8e0d6 → #d4c8ba），叠加多个不同大小的径向渐变圆形（有机光斑），中央展示系统 Logo + 名称 + Slogan，底部有装饰分割线和标签文字
- **右栏（表单区）**：纯白/浅米色背景，表单元素像杂志排版一样自然流动。顶部小字英文标签 + 中文大标题，输入框用圆角浅色背景 + 微弱阴影区分

### 移动端 (<768px) — 圆形焦点

单栏居中布局：

- 顶部：系统 Logo + 名称（紧凑排列）
- 中央：conic-gradient 圆环作为视觉锚点（暖金色，低透明度），内部放置毛玻璃效果的状态图标
- 表单元素环绕圆心下方排列
- 背景散布有机光斑（暖金 + 鼠尾草绿径向渐变圆）

---

## 验证码输入 — 时间线进度式

- 横向进度条（4px 高，圆角），填充部分为暖金色渐变，当前节点为发光圆点
- 6 位数字以大字号独立显示在进度条下方，间距均匀
- 已输入数字：暖金色（#C8956C），粗体
- 当前输入位：进度条节点有呼吸光晕动画
- 未输入位：浅灰色圆点（·）
- 底层使用一个隐藏 input，自动聚焦，onChange 驱动进度条和数字显示
- 输入满 6 位自动触发验证

---

## 交互流程

```
[输入手机号] → [获取验证码] → [时间线输入6位验证码]
                                      ↓
                              ┌─ 账号已存在 → 登录成功 → 跳转主页
                              │
                              └─ 新用户 → 平滑过渡 → [设置昵称] → 注册成功 → 跳转主页
```

### Step 1 — 手机号输入
- 手机号输入框，带 11 位格式校验
- 「获取验证码」按钮，60 秒倒计时

### Step 2 — 验证码输入
- 时间线进度式 6 位验证码输入
- 输入满 6 位自动调用验证接口
- 错误时进度条变红 + 抖动动画 + 错误提示

### Step 3a — 已有账号
- 直接登录，跳转 `/messages`

### Step 3b — 新用户注册
- 表单区平滑过渡（framer-motion AnimatePresence）到昵称输入界面
- 昵称输入框（最长 20 字符）+ 提交按钮
- 提交后完成注册，跳转 `/messages`

### 模式切换
- 底部文字链接「使用账号密码登录 →」，切换到 ID/密码登录模式
- ID/密码模式保持相同布局风格，仅替换表单内容

---

## API 设计

### 新增接口

**`GET /api/auth/check-phone?phone=xxx`**（无需认证）
- 检查手机号是否已注册
- 返回：`{ code: 0, data: { exists: true/false } }`

### 修改接口

**`POST /api/auth/login`**（修改现有）
- 新增可选字段 `nickname`（string，最长 20 字符）
- 当用户不存在且提供了 `nickname`：使用该昵称创建新用户
- 当用户不存在且未提供 `nickname`：返回 `{ code: 200, data: { needRegister: true, tempToken: "..." } }`
- tempToken 为短期 JWT（5分钟有效期），用于后续注册
- 当用户已存在：正常登录逻辑不变

**`POST /api/auth/register`**（新增）
- 接收 `{ tempToken, nickname }`
- 验证 tempToken → 创建用户 → 返回 token + user
- tempToken 一次性使用，注册后失效

---

## 前端文件变更

| 文件 | 操作 | 说明 |
|---|---|---|
| `src/pages/Login/LoginPage.tsx` | 重写 | 整体重写为新布局 |
| `src/pages/Login/PhoneLogin.tsx` | 新增 | 手机验证码登录/注册子组件 |
| `src/pages/Login/IdLogin.tsx` | 新增 | ID/密码登录子组件 |
| `src/pages/Login/CodeInput.tsx` | 新增 | 时间线进度式验证码输入组件 |
| `src/pages/Login/NicknameStep.tsx` | 新增 | 昵称设置步骤组件 |
| `src/api/auth.ts` | 修改 | 新增 checkPhone、register 接口 |

## 后端文件变更

| 文件 | 操作 | 说明 |
|---|---|---|
| `routes/auth.js` | 修改 | 新增 check-phone、register 路由；修改 login 路由 |

---

## 状态管理

所有状态通过 LoginPage 的 useState 管理，无需引入全局状态：

```
mode: 'phone' | 'id'          // 登录模式
step: 'phone' | 'code' | 'nickname'  // 当前步骤
phone: string                 // 手机号
code: string                  // 验证码
nickname: string              // 昵称
countdown: number             // 验证码倒计时
loading: boolean              // 加载状态
error: string                 // 错误信息
tempToken: string             // 新用户临时 token
isNewUser: boolean            // 是否新用户
```

---

## 动画规范

- 步骤切换：AnimatePresence + x 轴平移（右进左出），duration 0.25s，ease [0.22, 1, 0.36, 1]
- 有机光斑：CSS 静态定位，不设动画（保持性能）
- 进度条节点呼吸：pulse-soft keyframe（已有），2s ease-in-out infinite
- 圆形焦点（移动端）：conic-gradient 静态，无旋转动画
- 昵称输入出现：y 轴从下弹入 + opacity，spring 动画 stiffness: 300, damping: 28

---

## 不实现的内容

- 不支持第三方登录（微信/QQ/Apple）
- 不改变密码登录的 ID 模式功能
- 不修改验证码发送机制
- 不修改 JPush / FCM 推送逻辑
- 朋友圈 Mock 数据相关
