# AZ-Chat v1.1.1

基于 React 19 + Node.js 的全栈实时聊天应用，支持私聊、群聊、朋友圈、相册、等级系统、管理后台，并提供 Android 原生打包。

---

## 功能特色

### 多登录方式系统 (v1.1.0 新增)
- **三种登录方式**：账号密码 / 手机号验证码 / 邮箱验证码，管理后台可独立开关
- **密码注册**：昵称 + 密码自动生成唯一 ID，支持 CAPTCHA 人机验证
- **邮箱登录/注册**：邮件验证码一键登录，自动注册
- **手机号/邮箱绑定**：账号安全页支持独立绑定/换绑

### 即时通讯
- **私聊**：文字、图片、语音，支持消息撤回（2 分钟内）、引用回复、消息收藏
- **群聊**：@提及、群公告、广播通知、群成员管理（禁言/踢出/管理员）
- **会话管理**：置顶、免打扰、未读计数、@提及筛选

### 社交系统
- **好友**：发送/接受/拒绝好友申请，双向好友关系
- **关注**：关注/取关，粉丝/关注列表，关注动态流
- **相册**：创建相册，设置可见范围（公开/好友/私密），评论和收藏
- **朋友圈**：发布/编辑/删除动态，点赞/评论/收藏，话题标签，地理位置

### 等级与金币
- **QQ 四级体系**：星星 → 月亮 → 太阳 → 皇冠（3 进制）
- **多行为经验**：签到、发消息、发动态、发评论、关注、加好友
- **管理端开关**：每种行为可独立启用/禁用，经验值可自定义
- **签到系统**：每日签到 + 连续签到奖励
- **金币系统**：AES-256-GCM 加密存储，原子事务防并发，审计记录完整

### 视觉效果
- **等级头像框**：LV10 渐变边框 / LV20 炫彩边框 / LV30 水晶棱镜
- **LV20/30 入场动画**：GSAP 动效，用户可见升级庆祝
- **6 种主页风格**：鎏金暖阳 / 樱吹雪 / 水晶棱镜 / 极光幻境 / 暗夜霓虹
- **Canvas 粒子背景**：朋友圈/个人主页定制动态装饰

### 安全防护 (v1.1.0 加强)
- **数据加密**：消息、手机号、邮箱、短信模板 ID、SMTP 授权码 AES-256-GCM 加密
- **邮箱加密**：确定性加密支持精确查询，兼容明文旧数据自动迁移
- **双令牌认证**：Access Token 2h + Refresh Token 7d，自动刷新
- **防重放**：Refresh Token 轮换时旧家族全作废
- **HTTPS 兼容**：HTTPS 下使用 HttpOnly Secure Cookie，清缓存不丢登录
- **审计日志**：管理员操作全记录
- **防刷机制**：SMS/邮箱三层限流、Socket 消息限流 30条/分钟、每日经验上限

### 管理后台 (v1.1.0 增强)
- **仪表盘**：实时统计卡片 + 在线人数 + 最近登录
- **用户管理**：创建（昵称+密码自动生成ID）/编辑（含手机号+邮箱）/封禁/删除，搜索
- **登录与注册管理**：三种登录方式独立开关 + 短信模板 ID 配置 + SMTP 邮箱配置 + 测试发送
- **验证码配置**：图形验证码（位数/字母/算数模式 + 实时预览）+ 短信/邮箱验证码（位数/有效期）
- **群聊管理**：编辑/封禁/删除
- **动态管理**：查看/搜索/删除违规动态
- **等级管理**：经验值配置（开关+数值）+ 等级规则表 + 等级分布图
- **话题管理**：编辑/删除话题
- **签到管理**：统计+连续奖励配置
- **预设背景管理**：增删改预设 Banner
- **基础设置**：系统名称/Logo/注册开关/维护公告

### 账号安全
- **修改密码**：旧密码直接修改 / 忘记密码验证重置
- **忘记密码**：自动检测已开启的验证方式（手机号/邮箱），未绑定提示绑定
- **手机号+邮箱双绑定**：独立绑定/换绑，支持不绑定的无验证状态

### 推送通知
- 极光推送（JPush）：App 离线时推送私聊、群聊、好友申请通知

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 8 |
| 样式 | Tailwind CSS 3 + Framer Motion + GSAP |
| 实时通信 | Socket.IO 4 |
| HTTP | Axios |
| 路由 | React Router DOM 7 |
| 移动端 | Capacitor 7（Android） |
| 推送 | 极光推送 JPush |
| XSS 防护 | DOMPurify |
| 图片压缩 | browser-image-compression |
| 后端 | Node.js + Express 4 |
| 数据库 | MySQL 8 (mysql2/promise) |
| 认证 | JWT 双令牌 + bcrypt |
| 加密 | AES-256-GCM（消息/金币/经验/手机号/邮箱/SMTP授权码） |
| 邮件 | Nodemailer（SMTP 发送邮箱验证码） |
| 图片压缩 | Sharp（服务端 Logo 压缩） |

---

## 项目结构

```
AZ-chat/                    # 前端
├── src/
│   ├── pages/
│   │   ├── Login/          # 登录（手机号/邮箱验证码 + 密码 + 注册）
│   │   ├── Messages/       # 消息列表、私聊、群聊、聊天搜索
│   │   ├── Contacts/       # 好友列表、添加好友、好友申请
│   │   ├── Groups/         # 群组管理（创建/邀请/成员管理/公告）
│   │   ├── Moments/        # 朋友圈动态（发布/编辑/搜索/话题）
│   │   ├── Profile/        # 个人主页、设置、等级、相册、金币、账号安全
│   │   └── Admin/          # 管理后台（仪表盘/用户/群聊/动态/等级/签到/预设/话题/验证码/登录与注册/设置）
│   ├── components/         # 公共组件（布局/导航/图片/动画/效果）
│   ├── hooks/              # 自定义 Hook（Socket/陀螺仪/滚动记忆等）
│   ├── api/                # Axios 请求封装
│   ├── utils/              # 工具函数（压缩/剪贴板/等级星星等）
│   ├── context/            # AuthContext + OnlineStatusContext
│   └── styles/             # 全局样式
├── android/                # Capacitor Android 工程
│   ├── variables.gradle    # 应用配置（AppKey、包名）
│   └── app/src/main/java/  # MainActivity / JPush 推送
├── index.html              # 入口 HTML
└── .env                    # 后端地址配置

AZ-chat-后端/               # 后端
├── routes/                 # API 路由（auth/user/messages/contacts/groups/moments/admin 等）
├── socket/                 # Socket.IO 事件处理
├── middleware/              # 中间件（auth/rateLimiter）
├── utils/                  # 工具（加密/钱包/推送/审计/crypto）
├── sql/                    # SQL 初始化脚本
├── config/                 # 数据库连接池
└── app.js                  # 入口（含自动建表+数据迁移+加密初始化）
```

---

## 快速开始

### 环境要求

- Node.js 18+
- MySQL 8+
- Nodemailer（可选，邮箱验证码功能需要 `npm install nodemailer`）

### 1. 启动后端

```bash
cd AZ-chat-后端
cp .env.example .env    # 编辑 .env，填写数据库密码和生成密钥
npm install
node app.js
# 服务运行在 http://0.0.0.0:5001
# 首次启动自动创建数据库表 + 加密迁移 + 填充默认数据
```

### 2. 配置前端

编辑 `AZ-chat/.env`：

```env
VITE_API_URL=http://localhost:5001
```

### 3. 启动前端

```bash
cd AZ-chat
npm install
npm run dev
# 前端运行在 http://localhost:5000
```

---

## 应用配置管理

所有应用级配置统一在项目根目录 `app.config.json`：

```json
{
  "appName": "AZ Chat",         // 应用名称（同步到 APK/网页标题）
  "appId": "com.azchat",        // Android 包名
  "version": "1.1.0",          // 版本号
  "versionCode": 2,            // Android 版本码（整数，每次发版 +1）
  "description": "连接你我，温暖每一刻"
}
```

修改后运行同步命令，自动更新所有配置文件：

```bash
npm run sync-config
```

**同步目标文件：** `capacitor.config.ts` → `strings.xml` → `build.gradle` → `package.json` → `index.html`

> 注意：包名 (`appId`) 修改后需要重新 `npx cap sync android`，部分 Android 原生文件不会自动更新。

---

## Android App 打包

```bash
cd AZ-chat
npm run sync-config          # 先同步配置
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

### 图标替换

替换 `android/app/src/main/res/mipmap-*/ic_launcher.png`（各分辨率目录），推荐用 Android Studio 的 Image Asset 工具生成。

---

## 生产部署

### 构建前端

```bash
cd AZ-chat
npm run build
# 产物在 dist/ 目录
```

### Nginx 配置示例

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    location / {
        root /var/www/azchat/dist;
        try_files $uri $uri/ /index.html;
    }
    location /api {
        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
    }
    location /socket.io {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

> 使用 HTTPS 时，Refresh Token 自动使用 HttpOnly Secure Cookie 存储，清除浏览器缓存不会退出登录。

---

## API 概览

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 手机号验证码登录（自动注册） |
| POST | /api/auth/login-id | 账号ID/手机号/邮箱 + 密码登录 |
| POST | /api/auth/login-email | 邮箱验证码登录（自动注册） |
| POST | /api/auth/register | 完成注册（设置昵称） |
| POST | /api/auth/register-password | 纯密码注册（昵称+密码生成ID） |
| GET | /api/auth/check-email | 检查邮箱是否已注册 |
| POST | /api/auth/send-email-code | 发送邮箱验证码 |

### 管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/dashboard | 仪表盘 |
| GET | /api/admin/public-settings | 公开设置（含登录方式配置） |
| POST | /api/admin/test-sms | 测试短信发送 |
| POST | /api/admin/test-email | 测试邮件发送 |

---

## 版本迭代

### v1.1.1 (2026-06-08)
- **应用配置系统**：新增 `app.config.json` 中央配置 + `npm run sync-config` 同步脚本，一键更新应用名/版本号/包名
- **Android 打包修复**：修复状态栏双重偏移（改用 `overlaysWebView: true` + Capacitor API 读取真实高度）、图片无法加载（JS fetch 转 blob URL 方案）
- **推送通知升级**：通知支持大图展示（图片消息）+ 点击通知自动跳转对应聊天/申请页
- **Socket 实时通讯修复**：添加 polling 回退 + 断线自动重连 + App 前后台自动切换连接状态
- **图片加载优化**：SafeImg/RemoteImage/ChatImage 全链路 blob URL 预加载 + 骨架屏，去除破图体验
- **消息通知弹窗**：全新毛玻璃 UI，支持私聊/群聊/@/好友申请/群申请多类型，点击跳转
- **关注粉丝列表**：修复签名加密乱码、新增互相关注状态、个人主页关注/粉丝数可点击跳转
- **页面顶部栏统一**：overlay 页面统一 `top: var(--status-bar-height)` 避开状态栏，主页面 header 去重安全区偏移
- **ImageViewer 修复**：图片正常加载 + 顶部状态栏适配
- **群公告头像**：BroadcastPopup / NoticeDetailPage 头像改为 SafeImg 加载
- **邮件验证码**：SMTP 配置管理后台可保存授权码

### v1.1.0 (2026-06-06)
- **多登录方式系统**：支持账号密码/手机号/邮箱三种方式，管理后台可配置开关
- **邮箱登录/注册**：SMTP 邮件验证码，自动注册，三步注册流程
- **密码注册**：昵称+密码自动生成ID，CAPTCHA 人机验证
- **登录页动态适配**：根据开启的登录方式动态渲染 Tab 和表单
- **管理后台增强**：新增「登录与注册管理」页面，含模板配置+测试发送
- **验证码配置增强**：图形验证码支持算数模式+实时预览；短信/邮箱验证码位数和有效期可配
- **账号安全重构**：支持旧密码直接修改 + 忘记密码验证重置；手机号/邮箱双绑定
- **安全加密扩展**：邮箱加密存储、SMTP 授权码加密、短信模板 ID 加密
- **数据迁移修复**：邮箱渐进加密迁移、phone 列 NULL 约束修复
- **用户管理增强**：支持昵称+密码创建用户，编辑含手机号+邮箱字段

### v1.0.0
- 初始版本，支持手机号验证码登录和 ID+密码登录
- 私聊/群聊/朋友圈/相册/等级系统/管理后台
