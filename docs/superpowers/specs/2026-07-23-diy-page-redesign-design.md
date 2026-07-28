# DIY 页面重设计方案

## 概述

将 `pages/diy` 页面的设计风格完全重写，参考 `F:\DieJiaTai\diy_shouchuang` 项目的交互布局和视觉设计。使用 mock 数据，保留现有弹窗功能（手围设置、保存设计、加入购物车）。

## 设计目标

1. **完全重写** - 按参考项目重新设计页面结构和交互
2. **移植物理引擎** - 使用参考项目的物理引擎和渲染逻辑
3. **Mock 数据** - 先用本地硬编码的珠子数据跑通流程
4. **保留功能** - 保留串手串/打散动画、手围设置、保存/购买功能

## 页面布局

```
┌─────────────────────────────┐
│                             │
│      盘子区域 (60%)         │
│      Canvas 画布            │
│                             │
│   [手围设置]    [串手串/打散] │
│   [工具箱]      [保存] [购买] │
├─────────────────────────────┤
│  [分类1] [分类2] [分类3] ... │  ← 横向滚动标签
├────────┬────────────────────┤
│ 子类1  │  ┌──┐ ┌──┐ ┌──┐   │
│ 子类2  │  │  │ │  │ │  │   │  ← 3列网格
│ 子类3  │  └──┘ └──┘ └──┘   │
│        │  ┌──┐ ┌──┐ ┌──┐   │
│        │  │  │ │  │ │  │   │
│        │  └──┘ └──┘ └──┘   │
└────────┴────────────────────┘
   65px      剩余空间
```

## 配色方案

- 盘子背景：渐变 `#DEB887` → `#D2B48C`
- 选择区背景：`#FAEBD7`
- 分类标签背景：`#F5DEB3`
- 子类列表背景：`#F0E6D3`
- 按钮颜色：`#8B4513`（深棕色）

## 核心逻辑

### Mock 数据结构

```typescript
interface BeadData {
  id: string
  name: string
  color: string
  sizes: number[]
  prices: number[]
  sizeIndex: number
  category: string
  subType: string
}

interface SubType {
  id: string
  name: string
  beads: BeadData[]
}

interface Category {
  id: string
  name: string
  subTypes: SubType[]
}
```

### 游戏状态管理

```typescript
type GameStateType = 'idle' | 'plate' | 'bracelet'

interface BeadState {
  id: string
  name: string
  color: string
  radius: number
  x: number
  y: number
  sizeIndex: number
  category: string
  subType: string
}
```

### 物理引擎功能

- 珠子碰撞检测
- 珠子拖拽交互
- 重力和边界约束
- 串手串时的聚合动画

### 渲染器功能

- 绘制盘子（圆形木盘）
- 绘制珠子（带阴影和高光）
- 绘制手串（圆形排列）
- 动画帧更新

## 交互流程

### 珠子选择流程

1. 用户点击顶部分类标签 → 切换一级分类
2. 左侧子类列表更新 → 显示该分类下的子类
3. 右侧珠子网格更新 → 显示该子类下的珠子
4. 点击珠子卡片 → 珠子添加到盘子上

### 珠子尺寸调整

- 点击 `-`：尺寸减小（切换到更小的尺寸）
- 点击 `+`：尺寸增大（切换到更大的尺寸）
- 尺寸变化时，盘子上的珠子大小实时更新

### 串手串流程

1. 盘子上有珠子 → "串手串" 按钮可点击
2. 点击 "串手串" → 珠子从盘子聚合到中心
3. 动画：珠子按圆形排列，形成手串
4. 状态变为 "bracelet"
5. 按钮变为 "打散"

### 打散流程

1. 当前状态为 "bracelet"
2. 点击 "打散" → 珠子从手串状态散开
3. 动画：珠子从圆形排列散开到盘子各处
4. 状态变为 "plate"
5. 按钮变回 "串手串 (N/10)"

## 文件结构

### 需要新建的文件

| 文件 | 说明 |
|------|------|
| `src/pages/diy/mock/beads.ts` | 从参考项目 `utils/beads.js` 移植 |
| `src/pages/diy/lib/gameState.ts` | 从参考项目 `utils/state.js` 移植 |
| `src/pages/diy/lib/physics.ts` | 从参考项目 `utils/physics.js` 移植 |
| `src/pages/diy/lib/renderer.ts` | 从参考项目 `utils/renderer.js` 移植 |

### 需要修改的文件

| 文件 | 说明 |
|------|------|
| `src/pages/diy/index.tsx` | 重写主页面，集成新的物理引擎和渲染器 |
| `src/pages/diy/index.scss` | 重写样式，匹配参考项目设计 |

### 可以删除的文件（可选）

| 文件 | 说明 |
|------|------|
| `src/components/PlateCanvas/` | 不再需要，逻辑移入页面 |
| `src/components/BeadSelector/` | 不再需要，逻辑移入页面 |
| `src/lib/PhysicsEngine.ts` | 不再需要，使用新移植的版本 |
| `src/lib/Renderer.ts` | 不再需要，使用新移植的版本 |
| `src/lib/GameState.ts` | 不再需要，使用新移植的版本 |
| `src/hooks/usePlatePhysics.ts` | 不再需要，逻辑移入页面 |

### 保留的文件

| 文件 | 说明 |
|------|------|
| `src/components/NameInputModal/` | 保留，用于保存设计命名 |
| `src/components/WristSizeModal/` | 保留，用于手围设置 |
| `src/stores/useDiyStore.ts` | 保留，用于手围数据持久化 |
| `src/stores/useCartStore.ts` | 保留，用于购物车功能 |
| `src/stores/useDesignStore.ts` | 保留，用于保存设计 |

## 实施步骤

### 步骤 1：创建 Mock 数据

- 从参考项目 `utils/beads.js` 移植珠子数据
- 转换为 TypeScript 格式

### 步骤 2：移植核心逻辑

- 移植 `gameState.ts`（游戏状态管理）
- 移植 `physics.ts`（物理引擎）
- 移植 `renderer.ts`（渲染器）

### 步骤 3：重写 DIY 页面

- 重写 `index.tsx`（主页面逻辑）
- 重写 `index.scss`（页面样式）
- 集成物理引擎和渲染器

### 步骤 4：测试和调试

- 测试珠子添加功能
- 测试串手串/打散功能
- 测试弹窗功能（手围、保存、购买）
- 修复兼容性问题

### 步骤 5：清理（可选）

- 删除不再使用的组件
- 删除不再使用的 hooks

## 预计工作量

- **步骤 1-2**：移植核心逻辑，约 2-3 小时
- **步骤 3**：重写页面，约 2-3 小时
- **步骤 4**：测试调试，约 1-2 小时
- **总计**：约 5-8 小时

## 风险点

1. **Canvas 兼容性** - Taro 的 Canvas API 可能与原生微信小程序有差异
2. **物理引擎适配** - 需要调整物理引擎以适配 Taro 的事件系统
3. **动画性能** - 需要确保动画在小程序中流畅运行
