# 多登录方式配置系统 — 设计文档

**日期**: 2026-06-06  
**状态**: 设计中

---

## 一、概述

将 AZ-Chat 登录系统从固定的"手机号+账号密码"双模式升级为**可配置的多登录方式系统**，支持三种登录方式：

| 方式 | 标识 | 验证手段 | 自动注册 |
|------|------|----------|----------|
| 账号密码登录 | `password` | ID + 密码 | 否，需进入注册页 |
| 手机号验证码登录 | `phone` | 短信验证码 | 是 |
| 邮箱验证码登录 | `email` | 邮件验证码 | 是 |

**核心规则：**
1. 管理员在后台配置开启/关闭各登录方式，至少必须开启一项
2. 系统初始默认仅开启"账号密码登录"
3. 验证码方式始终自动注册（未注册则自动创建账号）
4. 密码方式不自动注册，底部提供注册入口

---

## 二、数据库变更

### 2.1 users 表新增字段

```sql
ALTER TABLE users ADD COLUMN email VARCHAR(255) DEFAULT NULL AFTER phone;
ALTER TABLE users ADD COLUMN password VARCHAR(255) DEFAULT NULL;
ALTER TABLE users MODIFY COLUMN phone VARCHAR(255) NULL;
```

- `email`: 可选，唯一索引（NULL 不冲突）
- `password`: bcrypt 哈希，新用户注册时设置
- `phone`: 改为可选（纯密码注册时不填手机号）

### 2.2 system_settings 新增配置项

```sql
-- 登录方式开关（1=开启, 0=关闭）
INSERT IGNORE INTO system_settings (`key`, `value`) VALUES ('login_method_password', '1');
INSERT IGNORE INTO system_settings (`key`, `value`) VALUES ('login_method_phone', '0');
INSERT IGNORE INTO system_settings (`key`, `value`) VALUES ('login_method_email', '0');

-- 短信模板地址（推送助手，留空则用 .env 默认值）
INSERT IGNORE INTO system_settings (`key`, `value`) VALUES ('sms_template_url', '');

-- 邮箱 SMTP 配置
INSERT IGNORE INTO system_settings (`key`, `value`) VALUES ('smtp_host', '');
INSERT IGNORE INTO system_settings (`key`, `value`) VALUES ('smtp_port', '587');
INSERT IGNORE INTO system_settings (`key`, `value`) VALUES ('smtp_user', '');
INSERT IGNORE INTO system_settings (`key`, `value`) VALUES ('smtp_pass', '');
INSERT IGNORE INTO system_settings (`key`, `value`) VALUES ('smtp_from', '');
```

### 2.3 新增 email_codes 表

```sql
CREATE TABLE IF NOT EXISTS email_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);
```

---

## 三、后端 API 变更

### 3.1 认证模块 (`routes/auth.js`)

#### 新增：邮箱验证码发送

```
POST /api/auth/send-email-code
Body: { email, captchaToken, captchaAnswer }
→ 生成6位验证码 → SMTP 发送邮件 → 存入 email_codes
```

#### 新增：邮箱验证码登录

```
POST /api/auth/login-email
Body: { email, code }
→ 验证码校验 → 查找或自动创建用户 → 返回 Token
逻辑与手机号登录一致，自动注册
```

#### 新增：纯密码注册

```
POST /api/auth/register-password
Body: { nickname, password }
→ 创建用户（自动分配 ID，phone=null, email=null）→ 返回 Token
```

#### 修改：密码登录适配多账号类型

```
POST /api/auth/login-id  (修改)
Body: { userId, password }
→ userId 字段现在支持：数字ID / 手机号 / 邮箱
→ 识别逻辑：纯数字→ID查询，含@→邮箱查询，否则→手机号查询
```

#### 新增：公开配置接口扩展

```
GET /api/admin/public-settings
→ 返回新增: { login_method_password, login_method_phone, login_method_email }
```

### 3.2 用户模块 (`routes/user.js`)

#### 新增：绑定手机号

```
POST /api/user/bind-phone
Body: { phone, code }
```

#### 新增：绑定邮箱

```
POST /api/user/bind-email
Body: { email, code }
```

### 3.3 管理后台 (`routes/admin.js`)

#### 修改：设置接口扩展

```
PUT /api/admin/settings
→ 支持新增字段: login_method_password, login_method_phone, login_method_email,
  sms_template_url, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from
→ 校验：至少一项 login_method_* = '1'，否则拒绝保存
```

---

## 四、前端变更

### 4.1 管理后台 — 新增「登录与注册管理」页面

**路由**: `/admin/login-config`  
**侧边栏**: AdminLayout 新增菜单项

**页面结构：**

```
┌─ 页面标题：「登录与注册管理」
│  副标题：「配置系统支持的登录方式，至少需开启一项」
│
├─ [卡片] 账号密码登录 ──────────── Toggle (默认开)
│   使用系统分配的 ID + 密码登录
│
├─ [卡片] 手机号验证码登录 ──────── Toggle (默认关)
│   短信验证码一键登录/注册
│   └─ [展开] 推送助手模板地址: [____________] [测试发送]
│       留空使用系统默认推送助手接口
│
├─ [卡片] 邮箱验证码登录 ────────── Toggle (默认关)
│   邮件验证码登录/注册
│   └─ [展开] SMTP配置:
│       SMTP地址: [________]  端口: [____]
│       发件邮箱: [________]  授权码: [****]
│
└─ 底部: [重置] [保存配置]
```

**交互规则：**
- 关闭最后一项 Toggle 时弹出 toast 警告"至少需开启一种登录方式"，阻止操作
- 手机号/邮箱开启时展开对应配置区
- 保存调用 `adminApi.updateSettings()`

### 4.2 登录页 — 多方式适配

**核心策略：保持现有 UI 设计（分屏杂志风 + 移动端圆形焦点布局），仅动态调整 Tab 和表单。**

#### 场景1：仅密码登录（初始默认）

```
┌─ 无 Tab 栏
├─ 表单：账号ID + 密码 + 登录按钮
└─ 底部：「还没有账号？立即注册」→ 切换到注册表单 (昵称+密码→生成ID)
```

#### 场景2：密码 + 手机号

```
┌─ Tab: [手机号登录/注册] [账号密码登录]
├─ 手机号Tab: +86 + 手机号输入 + 获取验证码 → 自动注册
├─ 密码Tab: 手机号/账号ID + 密码
└─ 底部：「使用账号密码登录 →」「使用手机号登录/注册 →」
```

#### 场景3：密码 + 邮箱

```
同场景2，手机号替换为邮箱。
┌─ Tab: [邮箱登录/注册] [账号密码登录]
└─ 底部切换同上
```

#### 场景4：密码 + 手机号 + 邮箱

```
┌─ 一级Tab: [验证码登录/注册] [账号密码登录]
│
├─ 验证码Tab 内二级分段:
│   ┌─ [手机号] [邮箱] ← 胶囊分段
│   ├─ 手机号表单: +86 + 手机号 + 获取验证码
│   └─ 邮箱表单: 邮箱地址 + 获取验证码
│
├─ 密码Tab:
│   统一输入框：邮箱 / 手机号 / 账号ID + 密码
│
└─ 底部：Tab 间切换链接
```

**二级分段样式：**
- 桌面端：文字 Tab + 下划线指示器（与一级Tab一致风格）
- 移动端：圆角胶囊按钮，略小于一级

#### 验证码步骤适配

```
短信验证码：
  「验证码已发送至 138****8888」
  「请在下方输入6位数字验证码」
  「更换手机号」「XXs 后重发」

邮件验证码：
  「验证码已发送至 user***@example.com」
  「请查收邮件，输入6位验证码」
  「更换邮箱」「XXs 后重发」
```

### 4.3 账号安全页 — 绑定状态适配

现有 `AccountSecurityPage` 增加手机号和邮箱的绑定管理：

| 项目 | 未绑定 | 已绑定 |
|------|--------|--------|
| 图标色 | 灰色 `#C4B8A8` | 手机号绿 `#5BAD7A` / 邮箱紫 `#8E8CD8` |
| 文字 | 「未绑定」灰色 | 脱敏显示内容 + 绿色/紫色 |
| 操作 | 「绑定」→ 弹出绑定流程 | 「更换」→ 同绑定流程 |

**绑定流程：**
1. 点击「绑定」→ 弹出输入框（手机号/邮箱）
2. 图形验证码弹窗
3. 发送验证码（短信/邮件）
4. 输入6位验证码 → 完成绑定

### 4.4 前端 API 模块变更 (`src/api/auth.ts`)

```typescript
// 新增
export function sendEmailCode(email: string, captchaToken: string, captchaAnswer: string)
export function loginByEmail(email: string, code: string)
export function registerByPassword(nickname: string, password: string)

// 修改：loginById 支持邮箱/手机号/ID
export function loginById(userId: string, password: string)
```

### 4.5 前端 API 模块变更 (`src/api/admin.ts`)

```typescript
// 新增
getLoginConfig: () => api.get('/api/admin/login-config'),
// 实际复用 updateSettings，字段已扩展
```

---

## 五、配置项速查表

| Key | 默认值 | 说明 |
|-----|--------|------|
| `login_method_password` | `1` | 账号密码登录开关 |
| `login_method_phone` | `0` | 手机号验证码登录开关 |
| `login_method_email` | `0` | 邮箱验证码登录开关 |
| `sms_template_url` | `` | 推送助手模板地址（空则用 .env 默认） |
| `smtp_host` | `` | SMTP 服务器地址 |
| `smtp_port` | `587` | SMTP 端口 |
| `smtp_user` | `` | SMTP 用户名 |
| `smtp_pass` | `` | SMTP 授权码 |
| `smtp_from` | `` | 发件人地址 |

---

## 六、安全考虑

1. 邮箱验证码同样采用 HMAC-SHA256 哈希存储，不做明文
2. 邮箱验证码同样 5 分钟过期、5 次错误锁定
3. 绑定/更换手机号或邮箱需验证当前已有验证方式
4. SMTP 授权码在管理后台展示时做脱敏处理
5. 密码注册需要 CAPTCHA 人机验证

---

## 七、实施顺序

1. **后端数据库迁移** — users 表新增 email/password 字段，system_settings 新增配置项
2. **后端 API** — 邮箱验证码发送/登录、密码注册、绑定接口、admin settings 扩展
3. **前端 API 层** — auth.ts、admin.ts 新增调用
4. **管理后台页面** — AdminLoginConfigPage 新建
5. **登录页适配** — LoginPage 动态 Tab 渲染逻辑
6. **账号安全页** — 绑定状态 UI
7. **联调测试** — 四种配置场景全覆盖
