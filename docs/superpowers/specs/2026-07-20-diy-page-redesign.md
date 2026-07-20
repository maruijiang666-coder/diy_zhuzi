# DIY 页面重新设计规格

## 概述

将当前 DIY 页面的珠子交互方式从组件列表点击添加，重新设计为基于 Matter.js 物理引擎的 Canvas 2D 盘子交互模式。保留现有的手围设置、工具箱、保存、购买功能。

参考项目：`F:\DieJiaTai\diy_shouchuang`

## 架构方案

采用 **Class 做物理层，Hook 做集成层** 方案（方案C）。

三层架构：
- **物理层**：移植参考项目的 3 个核心类（PhysicsEngine、Renderer、GameState），TypeScript 化
- **Hook 层**：`usePlatePhysics` 封装物理层生命周期，暴露操作 API
- **页面层**：`DiyPage` 组合 `PlateCanvas` + `BeadSelector` + 浮动按钮

```
┌─────────────────────────────────────────┐
│           DiyPage (页面层)               │
│  ┌──────────┐  ┌──────────────────────┐ │
│  │ PlateCanvas│  │  BeadSelector       │ │
│  │ (Canvas)  │  │  (分类+珠子列表)     │ │
│  └─────┬─────┘  └──────────┬──────────┘ │
│        │                    │            │
│  ┌─────┴────────────────────┴──────────┐ │
│  │       usePlatePhysics (Hook层)       │ │
│  └─────┬───────────────────────────────┘ │
│        │                                 │
│  ┌─────┴───────────────────────────────┐ │
│  │  PhysicsEngine / Renderer / State    │ │
│  │  (物理层 - 移植自参考项目)           │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  ┌─────────────────────────────────────┐ │
│  │  useDiyStore (Zustand)              │ │
│  │  手围、工具箱、购物车、保存          │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 文件结构

新增/修改的文件：

```
src/
├── libs/
│   └── matter.min.js              # 物理引擎库（从参考项目拷贝）
├── lib/
│   ├── PhysicsEngine.ts           # 物理引擎封装（移植自 physics.js）
│   ├── Renderer.ts                # Canvas 渲染器（移植自 renderer.js）
│   └── GameState.ts               # 游戏状态机（移植自 state.js）
├── hooks/
│   └── usePlatePhysics.ts         # 物理引擎集成 hook
├── components/
│   ├── PlateCanvas/               # 新建 - 盘子画布组件
│   │   ├── index.tsx
│   │   └── index.scss
│   ├── BeadSelector/              # 重写 - 三层分类选择器
│   │   ├── index.tsx
│   │   └── index.scss
│   └── DesignCanvas/              # 删除（被 PlateCanvas 替代）
├── pages/
│   └── diy/
│       ├── index.tsx              # 重写 - 新布局
│       └── index.scss             # 重写 - 新样式
├── utils/
│   └── beadAdapter.ts             # 新建 - API 数据适配为物理引擎格式
└── types/
    └── bead.ts                    # 可能需要更新类型定义
```

关键决策：
- `libs/matter.min.js` 直接拷贝，不用 npm 包（与参考项目一致，避免版本差异）
- 3 个核心类放在 `src/lib/` 而非 `src/utils/`，因为它们是独立模块而非工具函数
- `BeadSelector` 重写而非修改，因为布局和交互完全不同
- `DesignCanvas` 删除，由 `PlateCanvas` 替代

## 物理层

### GameState.ts — 游戏状态机

- 4 个状态：`IDLE`（空盘子）→ `SHOOTING`（珠子飞行中）→ `SETTLED`（珠子静止）→ `BRACELET`（手串模式）
- 管理 `plateBeads`（盘子上的珠子）和 `braceletBeads`（手串珠子）
- 追踪射击方向（左右交替）、射击计数
- 提供 `stringBracelet()` 和 `disbandBracelet()` 状态转换方法

### PhysicsEngine.ts — Matter.js 封装

- 零重力环境，32段圆弧边界
- 珠子射击：从盘子底部交替左右发射，速度22，带±2°随机偏移
- 碰撞检测：珠子 `restitution: 0.5, friction: 0.15`
- `areBeadsSettled()` 检测所有珠子是否静止（速度 < 0.5）
- 拖拽珠子时直接设置 `Body.setPosition()` 并清零速度

### Renderer.ts — Canvas 2D 渲染

- 盘子：加载 `panzi.png` 背景图裁切为圆形，备选径向渐变
- 珠子：纯色填充 + 阴影 + 高光点（左上白色半透明圆）
- 手串模式：珠子按紧贴半径排列成圆
- 占位珠（添加动画中）：半透明虚线圆

### 适配点

- 参考项目用 `wx.createSelectorQuery()` 获取 Canvas，Taro 用 `Taro.createSelectorQuery()` 或直接 `ref`
- 参考项目的珠子数据结构 `{id, name, color, sizes, prices}` 需要适配为 API 返回的格式（通过 `beadAdapter.ts` 转换）
- `BEAD_SCALE = 3` 保持不变（珠子 mm 半径 × 3 = 画布像素半径）

## Hook 层 — usePlatePhysics

```typescript
function usePlatePhysics(canvasRef: RefObject<HTMLCanvasElement>) {
  // 内部持有三个类实例
  // physicsEngine: PhysicsEngine
  // renderer: Renderer
  // gameState: GameState

  return {
    // 状态
    state: GameState状态 (IDLE/SHOOTING/SETTLED/BRACELET),
    plateBeads: 盘子上的珠子列表,
    braceletBeads: 手串珠子列表,
    canString: 是否可以串手串 (>=10颗),

    // 操作
    addBead(bead):        // 射击珠子进入盘子
    removeBead(index):    // 从盘子移除珠子
    stringBracelet():     // 串手串（盘子→手串）
    disbandBracelet():    // 打散（手串→盘子）
    clearPlate():         // 清空盘子

    // 手串模式交互
    onBraceletDrag(from, to):    // 拖拽交换位置
    onBraceletRotate(angle):     // 旋转手串
    addBeadToBracelet(bead):     // 手串模式下添加珠子
    removeBeadFromBracelet(idx): // 手串模式下删除珠子
  }
}
```

**生命周期**：
- `useEffect` 初始化：创建 Canvas context → 初始化 PhysicsEngine + Renderer + GameState → 启动渲染循环 `requestAnimationFrame`
- `useEffect` 清理：停止渲染循环，销毁 Matter.js engine
- Canvas 尺寸变化时重新初始化（`ResizeObserver`）

**事件桥接**：
- Canvas 的 `touchstart/touchmove/touchend` 事件由 `PlateCanvas` 组件绑定，转发给 hook 的内部处理函数
- Hook 内部根据当前 state 决定响应方式（射击/拖拽盘子珠子/拖拽手串珠子）

**与 Zustand 的关系**：
- Hook 管理物理状态（珠子位置、动画、模式）
- 当珠子增删时，通过回调通知 DiyPage，DiyPage 再更新 Zustand store 的属性（总价、重量等）
- 手围、工具箱、购物车、保存仍由现有 Zustand store 管理

## 组件层

### PlateCanvas（新建，替代 DesignCanvas）

负责 Canvas 元素渲染、触摸事件绑定、浮动按钮叠加。

```tsx
function PlateCanvas({ canvasRef, physics }) {
  return (
    <View className="plate-canvas">
      <Canvas type="2d" canvasId="plateCanvas" ref={canvasRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* 左下角 - 手围设置 + 工具箱 */}
      <View className="plate-canvas__bottom-left">
        <Button onClick={onWristSizeClick}>手围设置</Button>
        <Button onClick={onToolboxClick}>工具箱</Button>
      </View>

      {/* 右上角 - 保存 + 购买 */}
      <View className="plate-canvas__top-right">
        <Button onClick={onSave}>保存</Button>
        <Button onClick={onPurchase}>购买</Button>
      </View>

      {/* 右下角 - 串手串/打散 */}
      <View className="plate-canvas__bottom-right">
        {canString && state !== 'BRACELET' && (
          <Button onClick={onStringBracelet}>串手串</Button>
        )}
        {state === 'BRACELET' && (
          <Button onClick={onDisband}>打散</Button>
        )}
      </View>
    </View>
  )
}
```

### BeadSelector（重写，三层分类）

珠子分类结构：
- 一级分类：珠子、天然石、配饰、随型、文玩
- 二级分类：绿水晶、红玛瑙、紫水晶等（这些就是珠子本身）
- 无三级分类

珠子的尺寸（weight）通过卡片上的 (-/+) 按钮调节。

```tsx
function BeadSelector({ beads, onBeadTap, currentBeads }) {
  return (
    <View className="bead-selector">
      {/* 顶部 - 横向一级分类标签 */}
      <ScrollView className="bead-selector__categories" scrollX>
        {categories.map(cat => (
          <View className={active ? 'tab active' : 'tab'} onClick={() => onCategoryTap(cat)}>
            {cat.name}
          </View>
        ))}
      </ScrollView>

      {/* 下方 - 左二级分类 + 右珠子网格 */}
      <View className="bead-selector__body">
        {/* 左侧二级分类列表 */}
        <ScrollView className="bead-selector__subtypes" scrollY>
          {subTypes.map(sub => (
            <View className={active ? 'item active' : 'item'} onClick={() => onSubTypeTap(sub)}>
              {sub.name}
            </View>
          ))}
        </ScrollView>

        {/* 右侧珠子网格（3列） */}
        <ScrollView className="bead-selector__beads" scrollY>
          {beads.map(bead => (
            <View className="bead-card" onClick={() => onBeadTap(bead)}>
              <View className="bead-card__preview" style={{ backgroundColor: bead.color }} />
              <Text className="bead-card__name">{bead.name}</Text>
              <Text className="bead-card__size">{bead.weight}mm</Text>
              <View className="bead-card__size-btns">
                <Button onClick={(e) => { e.stopPropagation(); onSizeDown(bead) }}>-</Button>
                <Button onClick={(e) => { e.stopPropagation(); onSizeUp(bead) }}>+</Button>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  )
}
```

## 数据流

```
用户点击珠子卡片
    ↓
BeadSelector.onBeadTap(bead)
    ↓
DiyPage.handleBeadTap(bead)
    ↓
usePlatePhysics.addBead(adaptedBead)  ← beadAdapter 转换 API 数据
    ↓
PhysicsEngine 创建 Matter.js body → 射入盘子
    ↓
GameState 状态: IDLE → SHOOTING → SETTLED
    ↓
DiyPage 收到回调 → 更新 Zustand store（珠子列表、属性）
```

## Zustand store 分工

| Store | 职责 | 不管 |
|-------|------|------|
| `useDiyStore` | wristSize, wearingStyle, properties(总价/重量/数量) | 珠子物理位置、动画 |
| `useCartStore` | addToCart | 无 |
| `useDesignStore` | saveDesign | 无 |

关键变化：现有 `useDiyStore` 里的 `bracelet.beads` 数组不再直接管理珠子列表。珠子列表由物理引擎的 `GameState` 管理，Zustand 只同步存储用于保存/加购时的数据快照。

## beadAdapter 适配器

```typescript
interface ApiBead {
  id: string
  name: string
  color: string
  weight: number     // mm 尺寸
  price: number
  category: string   // 一级分类
  subType?: string   // 二级分类
}

interface PhysicsBead {
  id: string
  name: string
  color: string
  radius: number     // weight / 2
  price: number
  category: string
  subType?: string
}

function adaptBead(apiBead: ApiBead): PhysicsBead {
  return {
    ...apiBead,
    radius: apiBead.weight / 2
  }
}
```

## 页面布局

```
┌─────────────────────────────────────┐
│                              [保存]  │
│                              [购买]  │  ← 右上角
│                                      │
│           ┌─────────────┐            │
│           │             │            │
│           │   盘子区域    │            │  ← Canvas 60%
│           │  (物理引擎)   │            │
│           │             │            │
│           └─────────────┘            │
│ [手围设置]                   [串手串]  │
│ [工具箱]                     [打散]   │
│ 左下角                       右下角    │
├─────────────────────────────────────┤
│ [珠子] [天然石] [配饰] [随型] [文玩]   │  ← 一级分类标签
├──────┬──────────────────────────────┤
│绿水晶│  ┌─────┐ ┌─────┐ ┌─────┐    │
│红玛瑙│  │ ●   │ │ ●   │ │ ●   │    │  ← 珠子选择区 40%
│紫水晶│  │8mm  │ │     │ │     │    │
└──────┴──────────────────────────────┘
```

- 页面整体 `100vh`，`overflow: hidden`
- Canvas 区域占 60%，珠子选择区占 40%（flex 布局）
- 浮动按钮用 `position: absolute` 覆盖在 Canvas 区域内
- 珠子选择区内部：左侧二级分类 65px 固定宽，右侧珠子网格自适应 3 列

### 浮动按钮布局

- **左下角**：手围设置 + 工具箱（垂直排列）
- **右上角**：保存 + 购买（垂直排列）
- **右下角**：串手串 / 打散（根据模式显示对应按钮）

## 交互流程

1. 首次进入 → 弹出手围设置弹窗（与现有逻辑一致）
2. 选择珠子 → 射入盘子（物理动画）
3. 盘子模式：拖拽珠子、长按删除、继续添加
4. ≥10 颗 → 点击"串手串" → 组装动画 → 手串模式
5. 手串模式：旋转、拖拽交换、继续添加/删除
6. 点击"打散" → 回到盘子模式
7. 保存/购买 → 走现有流程

### 珠子操作规则

- 盘子模式下删除珠子至空盘 → 状态回到 IDLE
- 手串模式下删除至 <10 颗 → 自动打散回盘子模式（爆炸散开动画）
- 串手串动画进行中 → 禁止新的珠子操作
- 添加珠子动画进行中再次添加 → 强制完成当前动画再执行新的

## 错误处理

- Canvas 初始化失败 → 显示降级提示，隐藏盘子区域
- Matter.js 加载失败 → try-catch 捕获，提示用户刷新
- API 请求失败 → 保留当前珠子选择区状态，Toast 提示
- 珠子列表加载更多 → 继续用 `useReachBottom` 触底加载

## 保留的现有功能

- 手围未设置时首次进入 → 弹出手围设置弹窗
- 保存/购买前验证登录状态 → 现有 `checkLoginAndPrompt` 逻辑
- 保存/购买前验证手串有效性 → 现有 `validateBracelet` 逻辑
- 分享功能 → 保留 `useShareAppMessage` 和 `useShareTimeline`
- 命名对话框 → 保留 `NameInputModal`
- 手围设置弹窗 → 保留 `WristSizeModal`

## 样式

- 参考项目的暖色调（棕色系）可作为基础
- 品牌色按当前项目调整（主色 `#8B7FD8`）
- 珠子卡片预览圆 40px，带 `box-shadow` 3D 效果
- 高光点：白色半透明圆偏移至左上
