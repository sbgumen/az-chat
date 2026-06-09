# LV20 / LV30 等级玻璃视觉效果升级

## 概述

为 UserProfilePage 的 LV20 和 LV30 用户设计全新的仿真玻璃主题视觉效果。LV20 采用二向色玻璃（Dichroic Glass）风格，LV30 采用碎镜重组 + 厚重水晶（Shattered Glass + Crystal Prism）风格，打破传统 UI 设计，提供强烈的视觉冲击力。

**设计原则：**
- 不使用 emoji 表情
- 不使用卡片边框（纯玻璃融合，无缝透明质感）
- 动画有情感曲线，不生硬机械
- 入场动画只在首次访问时播放，之后展示持久微动效

---

## 视觉风格定义

### LV20 — 二向色玻璃

随视角变化呈现不同色彩折射效果的玻璃质感，类似激光镭射/全息贴纸的视觉效果。

| 效果元素 | 实现方式 |
|---------|---------|
| 头像框 | 多层 conic-gradient + backdrop-blur 半透明环，陀螺仪/鼠标响应变色（二向色效应），非线性缓速旋转 |
| 头部光晕 | 3层径向渐变光斑叠层，缓慢漂移，颜色随时间/滚动位置变化；浅色主题基底 + 二向色叠加层 |
| 等级徽章 | 全息镭射质感背景（holographic gradient），玻璃磨砂描边，微光滑过动画 |
| 资料标签 | 半透明玻璃磨砂背景，无边框，内发光边缘替代边框 |
| 底部按钮 | 半透明玻璃 + 二向色渐变背景，无描边 |

**颜色调板（二向色光谱）：**
```
主色: #ec4899 (pink) -> #8b5cf6 (violet) -> #3b82f6 (blue) -> #10b981 (emerald) -> #f59e0b (amber)
镭射底层: conic-gradient(from 0deg, #f59e0b, #ec4899, #8b5cf6, #3b82f6, #10b981, #f59e0b)
```

### LV30 — 碎镜重组 + 厚重水晶

入场采用冲击开场动画，之后页面保持水晶玻璃质感的深色主题 + 持续微动效。

| 效果元素 | 实现方式 |
|---------|---------|
| 入场动画 | 冲击开场 4.5s：白闪 -> 碎片爆炸 -> 减速回旋 -> 水晶聚合成型 -> 光晕扩散 -> 融入主页 |
| 全局主题 | 深色水晶暗夜背景 (#0a0814)，多层极光背景流动 |
| 头像框 | 3层嵌套玻璃环，各层独立旋转（不同速率/方向），高光泽反射条纹，棱镜折射彩色边缘（chromatic aberration） |
| 浮动粒子 | 5-8片微型玻璃碎片，慢速漂移 + 旋转，随机轨迹 |
| 水晶呼吸光晕 | 头像框外圈 2.5s 周期呼吸光晕 |
| 极光背景 | 8-10s 周期慢速流动的径向渐变光斑 |
| 视差滚动 | 头像层 / 内容层不同滚动速率，营造 3D 景深感 |
| 昵称 | 多层玻璃折射渐变色（比 LV20 多一层颜色通道） |
| 底部按钮 | 厚重玻璃 + 渐变光折射内发光，无边框 |

**颜色调板（暗夜水晶）：**
```
基底: #0a0814 -> #130e28 -> #0f0c1e
极光1: rgba(139,92,246,0.6) -> transparent (violet)
极光2: rgba(245,158,11,0.5) -> transparent (amber)
折射边缘: linear-gradient(135deg, rgba(139,92,246,0.4), rgba(236,72,153,0.3), rgba(245,158,11,0.2))
```

---

## 入场动画时间线

### LV30 冲击开场（总时长 ~4.5s）

```
阶段1 (0-0.3s)   | 全屏白闪 -> 深色背景淡入
阶段2 (0.3-1.5s)  | 玻璃碎片从中心爆炸飞散到屏幕各处（15-20片）
                 | 碎片具有不同的初始速度、旋转角度、透明度
                 | 每片碎片是小型不规则多边形（clip-path），带玻璃 blur 效果
阶段3 (1.5-2.5s)  | 碎片减速，开始反向回旋聚合
                 | 碎片颜色从透明逐渐注入色彩（注入二向色光谱）
阶段4 (2.5-3.5s)  | 碎片拼合成环形（头像框位置）+ 中心等级徽章
                 | 拼合瞬间触发光晕脉冲（白色 radial 扩散）
阶段5 (3.5-4.0s)  | 光晕爆发扩散覆盖全屏
                 | 剩余碎片沉降为浮动粒子效果
阶段6 (4.0-4.5s)  | 动画元素渐隐，主页内容透过玻璃质感淡入
```

### LV20 入场动画（轻量版，总时长 ~2.5s）

```
阶段1 (0-0.2s)   | 头部区域微闪烁
阶段2 (0.2-1.2s)  | 二向色光谱从左侧扫入头像框区域（色散效果）
阶段3 (1.2-2.0s)  | 光晕光斑从中心扩散，覆盖头部区域
阶段4 (2.0-2.5s)  | 色彩稳定，转为持久微动效
```

---

## 组件架构

```
src/
  components/
    effects/                          # 新增目录
      GlassAvatarFrame.tsx            # 通用玻璃头像框组件（接收 level 参数）
      DichroicEffects.tsx             # LV20 二向色光晕背景 + 等级徽章
      CrystalEffects.tsx              # LV30 水晶主题背景 + 极光 + 浮动粒子
      Lv20EntranceAnimation.tsx       # LV20 入场动画
      Lv30EntranceAnimation.tsx       # LV30 入场动画（冲击开场）
      FloatingGlassParticles.tsx      # 浮动玻璃碎片粒子（持久微动效）
      GlassParallax.tsx               # 玻璃视差滚动容器
  hooks/
    useLevelAnimation.ts             # 新增：动画状态管理（localStorage 记录）
    useGyroscope.ts                  # 新增：陀螺仪/鼠标位置响应（二向色效应）
  pages/
    Profile/
      UserProfilePage.tsx            # 改造：集成所有新组件
      ProfilePage.tsx                # 可选：适配个人主页等级卡片
```

---

## 动画播放策略

```typescript
// useLevelAnimation.ts 核心逻辑
function useLevelAnimation(userId: string, level: number) {
  const COOLDOWN_MS = 5 * 60 * 1000; // 5分钟冷却
  const KEY = `az_lv_anim_ts_${userId}_${level}`;
  const [shouldPlayEntrance, setShouldPlay] = useState(false);

  useEffect(() => {
    const lastPlayed = localStorage.getItem(KEY);
    const now = Date.now();
    if (!lastPlayed || now - parseInt(lastPlayed) > COOLDOWN_MS) {
      setShouldPlay(true);
      localStorage.setItem(KEY, String(now));
    }
  }, [userId, level]);

  return { shouldPlayEntrance };
}
```

- 每个用户对每个等级的目标用户主页独立记录时间戳
- 首次访问或距上次播放超过 5 分钟时，播放完整入场动画
- 5 分钟内再次进入，跳过动画，直接展示主页 + 持久微动效
- 持久微动效（粒子、呼吸光晕、视差、极光）始终激活

---

## 持久微动效规格

| 动效 | 周期 | 描述 |
|------|------|------|
| 浮动玻璃粒子 | 6-12s 随机 | 5-8片半透明多边形，缓慢漂移 + 自转，随机起始位置 |
| 头像框呼吸光晕 | 2.5s | opacity 0.4 -> 0.8 -> 0.4，scale 1 -> 1.08 -> 1 |
| 极光背景流动 | 8-10s | 2层径向渐变光斑，translate 10-20px 往返 |
| 二向色头像框旋转（LV20） | 12-15s 非匀速 | 缓入缓出变速旋转，非机械匀速 |
| 水晶环独立旋转（LV30） | 8s / 12s / 16s | 3层环各自独立速率和方向旋转 |
| 视差滚动（LV30） | 随scroll | 头像层 parallax 0.5x，内容层 1x |

---

## 技术约束

1. 所有玻璃效果使用 `backdrop-filter: blur()` + `background: rgba(255,255,255,0.x)` 实现
2. 碎片动画使用 Framer Motion 的 `animate` + CSS `clip-path`
3. 陀螺仪响应使用 `DeviceOrientationEvent`（移动端） + `mousemove`（桌面端）
4. 视差效果使用 CSS `transform: translateZ()` + `perspective` 或 Framer Motion `useScroll`
5. 性能目标：所有动效 60fps，使用 `will-change` 和 GPU 加速属性（transform, opacity, filter）
6. 兼容性：需要检查 `backdrop-filter` 支持（iOS Safari 需 `-webkit-backdrop-filter`）

---

## 实现阶段

### Phase 1: 基础玻璃组件
- 创建 `GlassAvatarFrame.tsx`（LV20/LV30 通用）
- 创建 `DichroicEffects.tsx`（LV20 背景光晕）
- 创建 `CrystalEffects.tsx`（LV30 全局深色主题 + 极光）

### Phase 2: 入场动画
- 创建 `Lv20EntranceAnimation.tsx`（光谱扫入）
- 创建 `Lv30EntranceAnimation.tsx`（碎镜冲击开场，重头戏）

### Phase 3: 持久微动效
- 创建 `FloatingGlassParticles.tsx`
- 创建 `GlassParallax.tsx`
- 创建 `useLevelAnimation.ts` + `useGyroscope.ts`

### Phase 4: 集成改造
- 改造 `UserProfilePage.tsx` 集成所有组件
- 移除旧的 `Lv30EnterAnimation` 和硬编码的 level 判断逻辑
- 测试 LV20 / LV30 / 非特权等级三态切换

---

## 验收标准

1. LV20 用户主页显示二向色玻璃头像框，随鼠标/手机倾斜变色
2. LV30 用户首次访问播放完整碎镜冲击开场动画（爆炸->聚合->成型->融入）
3. LV30 用户主页保持深色水晶主题 + 浮动粒子 + 呼吸光晕 + 极光 + 视差
4. 再次访问 LV20/LV30 主页不重复播放入场动画，直接展示持久效果
5. 非 LV20/LV30 用户主页保持原有设计，不受影响
6. 所有动效在移动端和桌面端均流畅运行（60fps）
7. 无 emoji、无卡片边框、纯玻璃融合视觉
