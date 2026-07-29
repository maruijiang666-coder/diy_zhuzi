# DIY 页面重设计实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 DIY 页面完全重写，移植参考项目 `diy_shouchuang` 的物理引擎、渲染器、交互逻辑和视觉设计。

**Architecture:** 页面分为上下两部分：上方 60% 为 Canvas 盘子区域（物理引擎 + 渲染器），下方 40% 为珠子选择区域（分类标签 + 子类列表 + 珠子网格）。物理引擎使用 Matter.js 处理珠子碰撞和拖拽，渲染器负责绘制盘子、珠子和手串。

**Tech Stack:** Taro 3.x (React), TypeScript, Canvas 2D, Matter.js

---

## 文件结构

```
src/pages/diy/
├── index.tsx              # 主页面（重写）
├── index.scss             # 页面样式（重写）
├── index.config.ts        # 页面配置（保留）
├── mock/
│   └── beads.ts           # 珠子 Mock 数据（新建）
├── lib/
│   ├── gameState.ts       # 游戏状态管理（新建）
│   ├── physics.ts         # 物理引擎（新建）
│   └── renderer.ts        # 渲染器（新建）
└── libs/
    └── matter.min.js      # Matter.js 物理引擎库（复制）
```

---

### Task 1: 复制 Matter.js 库文件

**Files:**
- Create: `src/pages/diy/libs/matter.min.js`

- [ ] **Step 1: 复制 Matter.js 到项目**

```bash
cp "F:\DieJiaTai\diy_shouchuang\libs\matter.min.js" "F:\DieJiaTai\diyUseCanvans\DIY_crystal_bus\src\pages\diy\libs\matter.min.js"
```

- [ ] **Step 2: 验证文件已复制**

```bash
ls -la src/pages/diy/libs/
```

Expected: 看到 `matter.min.js` 文件，约 80KB

- [ ] **Step 3: Commit**

```bash
git add src/pages/diy/libs/matter.min.js
git commit -m "chore: add Matter.js physics engine library"
```

---

### Task 2: 创建 Mock 数据文件

**Files:**
- Create: `src/pages/diy/mock/beads.ts`

- [ ] **Step 1: 创建 Mock 数据文件**

```typescript
// src/pages/diy/mock/beads.ts
/**
 * 珠子 Mock 数据
 * 从参考项目 diy_shouchuang/utils/beads.js 移植
 */

export interface BeadData {
  id: string
  name: string
  color: string
  sizes: number[]
  prices: number[]
}

export interface SubType {
  id: string
  name: string
  beads: BeadData[]
}

export interface Category {
  id: string
  name: string
  subTypes: SubType[]
}

// 珠子数据：分类 → 子类 → 珠子（含尺寸选项）
const beadData: Record<string, SubType[]> = {
  bead: [
    {
      id: 'crystal',
      name: '水晶',
      beads: [
        { id: 'b_crystal_1', name: '白水晶', color: '#F0F8FF', sizes: [6, 8, 10, 12, 14], prices: [3, 4, 5, 7, 10] },
        { id: 'b_crystal_2', name: '粉晶', color: '#FFB6C1', sizes: [6, 8, 10, 12, 14], prices: [3, 4, 5, 7, 10] },
        { id: 'b_crystal_3', name: '紫水晶', color: '#9370DB', sizes: [6, 8, 10, 12, 14], prices: [4, 5, 6, 8, 12] },
        { id: 'b_crystal_4', name: '黄水晶', color: '#FFD700', sizes: [6, 8, 10, 12, 14], prices: [4, 5, 6, 8, 12] },
        { id: 'b_crystal_5', name: '茶水晶', color: '#8B6914', sizes: [8, 10, 12], prices: [4, 5, 7] },
        { id: 'b_crystal_6', name: '绿幽灵', color: '#2E8B57', sizes: [8, 10, 12], prices: [5, 7, 10] }
      ]
    },
    {
      id: 'agate',
      name: '玛瑙',
      beads: [
        { id: 'b_agate_1', name: '红玛瑙', color: '#DC143C', sizes: [6, 8, 10, 12, 14], prices: [3, 4, 5, 6, 8] },
        { id: 'b_agate_2', name: '蓝玛瑙', color: '#4169E1', sizes: [6, 8, 10, 12, 14], prices: [3, 4, 5, 6, 8] },
        { id: 'b_agate_3', name: '绿玛瑙', color: '#3CB371', sizes: [6, 8, 10, 12, 14], prices: [3, 4, 5, 6, 8] },
        { id: 'b_agate_4', name: '黑玛瑙', color: '#1C1C1C', sizes: [6, 8, 10, 12, 14], prices: [3, 4, 5, 6, 8] }
      ]
    },
    {
      id: 'glass',
      name: '琉璃',
      beads: [
        { id: 'b_glass_1', name: '透明琉璃', color: '#87CEEB', sizes: [8, 10, 12, 14], prices: [3, 4, 5, 6] },
        { id: 'b_glass_2', name: '蓝色琉璃', color: '#4682B4', sizes: [8, 10, 12, 14], prices: [3, 4, 5, 6] },
        { id: 'b_glass_3', name: '绿色琉璃', color: '#32CD32', sizes: [8, 10, 12, 14], prices: [3, 4, 5, 6] },
        { id: 'b_glass_4', name: '紫色琉璃', color: '#BA55D3', sizes: [8, 10, 12, 14], prices: [3, 4, 5, 6] }
      ]
    }
  ],
  stone: [
    {
      id: 'natural_stone',
      name: '天然石',
      beads: [
        { id: 's_stone_1', name: '黑曜石', color: '#2F4F4F', sizes: [8, 10, 12, 14, 16], prices: [3, 4, 5, 6, 8] },
        { id: 's_stone_2', name: '虎眼石', color: '#B8860B', sizes: [8, 10, 12, 14, 16], prices: [4, 5, 6, 8, 10] },
        { id: 's_stone_3', name: '青金石', color: '#000080', sizes: [8, 10, 12, 14], prices: [5, 7, 10, 15] },
        { id: 's_stone_4', name: '孔雀石', color: '#2E8B57', sizes: [8, 10, 12, 14], prices: [5, 7, 10, 15] },
        { id: 's_stone_5', name: '南红', color: '#C41E3A', sizes: [8, 10, 12, 14, 16], prices: [6, 8, 12, 18, 25] },
        { id: 's_stone_6', name: '绿松石', color: '#40E0D0', sizes: [8, 10, 12, 14], prices: [6, 8, 12, 18] }
      ]
    }
  ],
  accessory: [
    {
      id: 'metal',
      name: '金属',
      beads: [
        { id: 'a_metal_1', name: '铜珠', color: '#B87333', sizes: [6, 8, 10], prices: [2, 3, 4] },
        { id: 'a_metal_2', name: '银珠', color: '#C0C0C0', sizes: [6, 8, 10], prices: [5, 8, 12] }
      ]
    },
    {
      id: 'spacer',
      name: '隔片',
      beads: [
        { id: 'a_spacer_1', name: '椰壳隔片', color: '#3E2723', sizes: [6, 8, 10], prices: [1, 2, 3] },
        { id: 'a_spacer_2', name: '蜜蜡隔片', color: '#FFD54F', sizes: [6, 8, 10], prices: [3, 4, 5] }
      ]
    }
  ],
  freeform: [
    {
      id: 'freeform_stone',
      name: '随型石',
      beads: [
        { id: 'f_stone_1', name: '随型蜜蜡', color: '#FFD54F', sizes: [10, 12, 14, 16], prices: [8, 12, 18, 25] },
        { id: 'f_stone_2', name: '随型南红', color: '#C41E3A', sizes: [10, 12, 14, 16], prices: [10, 15, 20, 30] }
      ]
    }
  ],
  wenwan: [
    {
      id: 'wood',
      name: '木质',
      beads: [
        { id: 'w_wood_1', name: '檀木', color: '#8B4513', sizes: [10, 12, 14, 16, 18], prices: [3, 4, 5, 7, 10] },
        { id: 'w_wood_2', name: '黄花梨', color: '#D2691E', sizes: [10, 12, 14, 16, 18], prices: [5, 7, 10, 15, 20] },
        { id: 'w_wood_3', name: '沉香', color: '#A0522D', sizes: [10, 12, 14, 16], prices: [8, 12, 18, 25] },
        { id: 'w_wood_4', name: '绿檀', color: '#556B2F', sizes: [10, 12, 14, 16, 18], prices: [3, 4, 5, 7, 10] }
      ]
    },
    {
      id: 'seed',
      name: '菩提',
      beads: [
        { id: 'w_seed_1', name: '星月菩提', color: '#F5F5DC', sizes: [8, 10, 12, 14], prices: [5, 7, 10, 15] },
        { id: 'w_seed_2', name: '金刚菩提', color: '#8B6914', sizes: [10, 12, 14, 16], prices: [5, 8, 12, 18] }
      ]
    }
  ]
}

// 主分类列表
export const categories: Category[] = [
  { id: 'bead', name: '珠子', subTypes: beadData.bead },
  { id: 'stone', name: '天然石', subTypes: beadData.stone },
  { id: 'accessory', name: '配饰', subTypes: beadData.accessory },
  { id: 'freeform', name: '随型', subTypes: beadData.freeform },
  { id: 'wenwan', name: '文玩', subTypes: beadData.wenwan }
]

/**
 * 获取所有主分类
 */
export function getCategories(): Category[] {
  return categories
}

/**
 * 获取指定分类的子类列表
 */
export function getSubTypes(categoryId: string): SubType[] {
  const cat = categories.find(c => c.id === categoryId)
  return cat ? cat.subTypes : []
}

/**
 * 获取指定子类的珠子列表（每个珠子附带当前选中尺寸）
 */
export function getBeadsBySubType(categoryId: string, subTypeId: string): BeadData[] {
  const subTypes = getSubTypes(categoryId)
  const subType = subTypes.find(s => s.id === subTypeId)
  if (!subType) return []
  return subType.beads.map(b => ({
    ...b,
    sizeIndex: Math.floor(b.sizes.length / 2),
    radius: b.sizes[Math.floor(b.sizes.length / 2)] / 2,
    category: categoryId,
    subType: subTypeId
  } as any))
}

/**
 * 根据 ID 获取珠子（搜索所有分类）
 */
export function getBeadById(id: string): BeadData | null {
  for (const cat of categories) {
    for (const subType of cat.subTypes) {
      const bead = subType.beads.find(b => b.id === id)
      if (bead) {
        return { ...bead, category: cat.id, subType: subType.id } as any
      }
    }
  }
  return null
}

/**
 * 获取所有珠子
 */
export function getAllBeads(): BeadData[] {
  const all: BeadData[] = []
  for (const cat of categories) {
    for (const subType of cat.subTypes) {
      for (const bead of subType.beads) {
        all.push({ ...bead, category: cat.id, subType: subType.id } as any)
      }
    }
  }
  return all
}
```

- [ ] **Step 2: 验证文件语法**

```bash
npx tsc --noEmit src/pages/diy/mock/beads.ts
```

Expected: 无错误输出

- [ ] **Step 3: Commit**

```bash
git add src/pages/diy/mock/beads.ts
git commit -m "feat: add bead mock data for DIY page"
```

---

### Task 3: 创建游戏状态管理模块

**Files:**
- Create: `src/pages/diy/lib/gameState.ts`

- [ ] **Step 1: 创建 GameState 类**

```typescript
// src/pages/diy/lib/gameState.ts
/**
 * 游戏状态管理
 * 从参考项目 diy_shouchuang/utils/state.js 移植
 */

export const GAME_STATE = {
  IDLE: 'idle',           // 盘子为空，等待选珠子
  SHOOTING: 'shooting',   // 正在弹射珠子
  SETTLED: 'settled',     // 珠子落定，可继续选珠或串手串
  BRACELET: 'bracelet'    // 手串模式
} as const

export type GameStateType = typeof GAME_STATE[keyof typeof GAME_STATE]

export const SHOOT_DIRECTION = {
  LEFT: 'left',
  RIGHT: 'right'
} as const

export type ShootDirectionType = typeof SHOOT_DIRECTION[keyof typeof SHOOT_DIRECTION]

export interface PlateBead {
  id: string
  name: string
  color: string
  radius: number
  sizeIndex: number
  category: string
  subType: string
  image?: string
}

export class GameState {
  state: GameStateType = GAME_STATE.IDLE
  plateBeads: PlateBead[] = []
  braceletBeads: PlateBead[] = []
  shootCount: number = 0
  shootDirection: ShootDirectionType = SHOOT_DIRECTION.LEFT

  /**
   * 获取当前状态
   */
  getState(): GameStateType {
    return this.state
  }

  /**
   * 设置状态
   */
  setState(newState: GameStateType): void {
    this.state = newState
  }

  /**
   * 添加珠子到盘子
   */
  addBeadToPlate(bead: PlateBead): void {
    this.plateBeads.push(bead)
    this.shootCount++
    this.shootDirection = this.shootCount % 2 === 0
      ? SHOOT_DIRECTION.RIGHT
      : SHOOT_DIRECTION.LEFT
  }

  /**
   * 获取盘子上珠子数量
   */
  getPlateBeadCount(): number {
    return this.plateBeads.length
  }

  /**
   * 检查是否可以串手串
   */
  canStringBracelet(): boolean {
    return this.plateBeads.length >= 10
  }

  /**
   * 将盘子上的珠子串成手串
   */
  stringBracelet(): void {
    this.braceletBeads = [...this.plateBeads]
    this.plateBeads = []
    this.state = GAME_STATE.BRACELET
  }

  /**
   * 添加珠子到手串
   */
  addBeadToBracelet(bead: PlateBead): void {
    this.braceletBeads.push(bead)
  }

  /**
   * 从手串删除珠子
   */
  removeBeadFromBracelet(index: number): void {
    this.braceletBeads.splice(index, 1)
  }

  /**
   * 获取手串珠子
   */
  getBraceletBeads(): PlateBead[] {
    return this.braceletBeads
  }

  /**
   * 重新开始
   */
  reset(): void {
    this.state = GAME_STATE.IDLE
    this.plateBeads = []
    this.braceletBeads = []
    this.shootCount = 0
    this.shootDirection = SHOOT_DIRECTION.LEFT
  }
}
```

- [ ] **Step 2: 验证文件语法**

```bash
npx tsc --noEmit src/pages/diy/lib/gameState.ts
```

Expected: 无错误输出

- [ ] **Step 3: Commit**

```bash
git add src/pages/diy/lib/gameState.ts
git commit -m "feat: add GameState class for DIY page"
```

---

### Task 4: 创建物理引擎模块

**Files:**
- Create: `src/pages/diy/lib/physics.ts`

- [ ] **Step 1: 创建 PhysicsEngine 类**

```typescript
// src/pages/diy/lib/physics.ts
/**
 * Matter.js 物理引擎封装
 * 从参考项目 diy_shouchuang/utils/physics.js 移植
 */

import Matter from '../libs/matter.min.js'

export class PhysicsEngine {
  engine: any = null
  world: any = null
  plateBodies: any[] = []
  beadBodies: any[] = []

  /**
   * 初始化物理引擎
   */
  init(): void {
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 }  // 无重力
    })
    this.world = this.engine.world
  }

  /**
   * 创建盘子边界
   * @param cx - 盘子中心 x
   * @param cy - 盘子中心 y
   * @param radius - 盘子半径
   */
  createPlate(cx: number, cy: number, radius: number): void {
    // 创建圆形边界（使用多个线段模拟）
    const segments = 32
    const bodies: any[] = []

    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2
      const angle2 = ((i + 1) / segments) * Math.PI * 2

      const x1 = cx + Math.cos(angle1) * radius
      const y1 = cy + Math.sin(angle1) * radius
      const x2 = cx + Math.cos(angle2) * radius
      const y2 = cy + Math.sin(angle2) * radius

      const midX = (x1 + x2) / 2
      const midY = (y1 + y2) / 2
      const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
      const angle = Math.atan2(y2 - y1, x2 - x1)

      const segment = Matter.Bodies.rectangle(midX, midY, length, 5, {
        isStatic: true,
        angle: angle,
        render: { visible: false }
      })

      bodies.push(segment)
    }

    // 底部平台
    const bottom = Matter.Bodies.rectangle(cx, cy + radius - 10, radius * 1.5, 10, {
      isStatic: true,
      render: { visible: false }
    })

    bodies.push(bottom)

    this.plateBodies = bodies
    Matter.World.add(this.world, bodies)
  }

  /**
   * 发射珠子
   * @param x - 起始 x
   * @param y - 起始 y
   * @param angle - 发射角度（弧度）
   * @param speed - 发射速度
   * @param radius - 珠子半径
   * @returns 珠子刚体
   */
  shootBead(x: number, y: number, angle: number, speed: number, radius: number): any {
    const bead = Matter.Bodies.circle(x, y, radius, {
      restitution: 0.5,    // 弹性系数
      friction: 0.15,      // 摩擦力
      frictionAir: 0.05,   // 空气阻力
      density: 0.003,      // 密度
      render: { visible: false }
    })

    // 设置初始速度
    Matter.Body.setVelocity(bead, {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed
    })

    this.beadBodies.push(bead)
    Matter.World.add(this.world, bead)

    return bead
  }

  /**
   * 更新物理引擎
   * @param delta - 时间增量
   */
  update(delta: number): void {
    Matter.Engine.update(this.engine, delta)
  }

  /**
   * 获取所有珠子位置
   */
  getBeadPositions(): Array<{ x: number; y: number; angle: number }> {
    return this.beadBodies.map(body => ({
      x: body.position.x,
      y: body.position.y,
      angle: body.angle
    }))
  }

  /**
   * 检查珠子是否静止
   */
  areBeadsSettled(): boolean {
    if (this.beadBodies.length === 0) return true
    return this.beadBodies.every(body => {
      const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2)
      return speed < 0.5
    })
  }

  /**
   * 清除所有珠子
   */
  clearBeads(): void {
    this.beadBodies.forEach(body => {
      Matter.World.remove(this.world, body)
    })
    this.beadBodies = []
  }

  /**
   * 销毁物理引擎
   */
  destroy(): void {
    Matter.World.clear(this.world)
    Matter.Engine.clear(this.engine)
  }
}
```

- [ ] **Step 2: 验证文件语法**

```bash
npx tsc --noEmit src/pages/diy/lib/physics.ts
```

Expected: 可能有类型错误，因为 matter.min.js 没有类型定义，可以忽略

- [ ] **Step 3: Commit**

```bash
git add src/pages/diy/lib/physics.ts
git commit -m "feat: add PhysicsEngine class for DIY page"
```

---

### Task 5: 创建渲染器模块

**Files:**
- Create: `src/pages/diy/lib/renderer.ts`

- [ ] **Step 1: 创建 Renderer 类**

```typescript
// src/pages/diy/lib/renderer.ts
/**
 * Canvas 渲染器
 * 负责绘制盘子、珠子、手串
 * 从参考项目 diy_shouchuang/utils/renderer.js 移植
 */

export class Renderer {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  canvas: any

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number, canvas: any) {
    this.ctx = ctx
    this.width = width
    this.height = height
    this.canvas = canvas
  }

  /**
   * 清空画布
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  /**
   * 绘制盘子
   */
  drawPlate(cx: number, cy: number, radius: number): void {
    const ctx = this.ctx

    ctx.save()

    // 绘制阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 3
    ctx.shadowOffsetY = 3

    // 绘制渐变盘子
    const gradient = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, 0, cx, cy, radius)
    gradient.addColorStop(0, '#D2B48C')
    gradient.addColorStop(0.7, '#C4A882')
    gradient.addColorStop(1, '#8B7355')

    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.strokeStyle = '#A0522D'
    ctx.lineWidth = 3
    ctx.stroke()

    ctx.restore()
  }

  /**
   * 绘制珠子
   */
  drawBead(x: number, y: number, radius: number, color: string, angle: number = 0): void {
    const ctx = this.ctx

    try {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(angle)

      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2

      // 画底色圆
      ctx.beginPath()
      ctx.arc(0, 0, radius, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()

      // 颜色渐变高光
      ctx.beginPath()
      ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.3, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.fill()

      ctx.restore()
    } catch (e) {
      try { ctx.restore() } catch (e2) {}
    }
  }

  /**
   * 绘制手串（使用指定角度位置）
   */
  drawBraceletWithAngles(
    beads: Array<{ color: string; radius: number }>,
    cx: number,
    cy: number,
    angles: number[],
    draggedBeadPos: { index: number; x: number; y: number } | null,
    beadRadius: number
  ): void {
    const count = beads.length
    if (count === 0 || !angles || angles.length !== count) return

    const tightRadius = count > 1 ? beadRadius / Math.sin(Math.PI / count) : 0

    beads.forEach((bead, index) => {
      let x: number, y: number
      if (draggedBeadPos && index === draggedBeadPos.index) {
        x = draggedBeadPos.x
        y = draggedBeadPos.y
      } else {
        x = cx + Math.cos(angles[index]) * tightRadius
        y = cy + Math.sin(angles[index]) * tightRadius
      }
      const rotation = angles[index] + Math.PI / 2

      if ((bead as any)._placeholder) {
        // 透明占位珠子
        const ctx = this.ctx
        ctx.save()
        ctx.translate(x, y)
        ctx.beginPath()
        ctx.arc(0, 0, beadRadius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(160, 130, 100, 0.2)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(160, 130, 100, 0.4)'
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.restore()
      } else {
        this.drawBead(x, y, beadRadius, bead.color, rotation)
      }
    })
  }
}
```

- [ ] **Step 2: 验证文件语法**

```bash
npx tsc --noEmit src/pages/diy/lib/renderer.ts
```

Expected: 无错误输出

- [ ] **Step 3: Commit**

```bash
git add src/pages/diy/lib/renderer.ts
git commit -m "feat: add Renderer class for DIY page"
```

---

### Task 6: 重写 DIY 页面样式

**Files:**
- Modify: `src/pages/diy/index.scss`

- [ ] **Step 1: 重写页面样式**

```scss
// src/pages/diy/index.scss
.diy-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

// 盘子区域 - 上方 60%
.diy-page__canvas {
  flex: 0 0 60%;
  position: relative;
  background: linear-gradient(180deg, #DEB887 0%, #D2B48C 100%);
  border-bottom: 2px solid #8B7355;
}

.diy-page__canvas-inner {
  width: 100%;
  height: 100%;
}

// 串手串/打散按钮
.diy-page__btn-string {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 30px;
  background-color: #A0522D;
  color: #F5DEB3;
  border-radius: 20px;
  font-size: 14px;
  opacity: 0.5;
  pointer-events: none;
  border: none;

  &::after {
    border: none;
  }

  &--active {
    opacity: 1;
    pointer-events: auto;
    background-color: #8B4513;
  }

  &--disband {
    background-color: #A0522D;
  }
}

// 左下角按钮组
.diy-page__bottom-left {
  position: absolute;
  left: 12px;
  bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
}

// 右上角按钮组
.diy-page__top-right {
  position: absolute;
  right: 12px;
  top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
}

// 通用按钮样式
.diy-page__btn {
  min-width: 72px;
  padding: 8px 16px;
  font-size: 13px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  border: 1px solid rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(4px);

  &::after {
    border: none;
  }

  &--primary {
    background: #8B7FD8;
    color: #fff;
    border-color: #8B7FD8;
  }

  &[disabled] {
    opacity: 0.5;
  }
}

// 选择区域 - 下方 40%
.diy-page__selector {
  flex: 0 0 40%;
  background-color: #FAEBD7;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// 主分类标签
.diy-page__categories {
  white-space: nowrap;
  padding: 8px 10px;
  background-color: #F5DEB3;
  border-bottom: 1px solid #DEB887;
}

.diy-page__tab {
  display: inline-block;
  padding: 5px 14px;
  margin-right: 8px;
  border-radius: 15px;
  font-size: 13px;
  color: #8B7355;
  background-color: #FFF8DC;

  &--active {
    background-color: #8B4513;
    color: #F5DEB3;
  }
}

// 子类+珠子内容区
.diy-page__content {
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  min-height: 0;
}

// 左侧子类列表
.diy-page__subtypes {
  width: 65px;
  min-width: 65px;
  height: 100%;
  background-color: #F0E6D3;
  border-right: 1px solid #DEB887;
  overflow-y: auto;
}

.diy-page__subtype {
  padding: 10px 4px;
  text-align: center;
  font-size: 12px;
  color: #8B7355;
  border-bottom: 1px solid #E8DCC8;

  &--active {
    background-color: #FAEBD7;
    color: #8B4513;
    font-weight: bold;
    border-left: 3px solid #8B4513;
  }
}

// 右侧珠子网格
.diy-page__beads {
  flex: 1;
  height: 100%;
  padding: 4px;
  overflow-y: auto;
}

.diy-page__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

// 珠子卡片
.bead-card {
  flex: 0 0 calc(33.33% - 4px);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  border-radius: 10px;
  overflow: hidden;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

.bead-card__preview {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 14px 0 10px;
  background-color: #fafafa;
}

.bead-card__color {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 0 8px rgba(255,255,255,0.6);
}

.bead-card__name {
  padding: 4px 8px 0;
  font-size: 12px;
  font-weight: 500;
  color: #333;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bead-card__size {
  font-size: 10px;
  color: #999;
  text-align: center;
  padding: 2px 0;
}

// 珠子尺寸调整按钮
.bead-card__actions {
  display: flex;
  width: 100%;
}

.bead-card__action {
  flex: 1;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  line-height: 1;
  background-color: #f5f5f5;
  color: #666;
  border: none;
  padding: 0;

  &::after {
    border: none;
  }

  &--left {
    border-radius: 0 0 0 10px;
    border-right: 1px solid #e0e0e0;
  }

  &--right {
    border-radius: 0 0 10px 0;
  }
}
```

- [ ] **Step 2: 验证样式文件**

```bash
npx stylelint src/pages/diy/index.scss
```

Expected: 无错误输出（可能有警告）

- [ ] **Step 3: Commit**

```bash
git add src/pages/diy/index.scss
git commit -m "feat: rewrite DIY page styles to match reference design"
```

---

### Task 7: 重写 DIY 页面主逻辑

**Files:**
- Modify: `src/pages/diy/index.tsx`

- [ ] **Step 1: 重写主页面**

```tsx
// src/pages/diy/index.tsx
import { View, Canvas, Button, ScrollView, Text } from '@tarojs/components'
import { useState, useCallback, useRef, useEffect } from 'react'
import Taro, { useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { useDiyStore } from '../../stores/useDiyStore'
import { useCartStore } from '../../stores/useCartStore'
import { useDesignStore } from '../../stores/useDesignStore'
import NameInputModal from '../../components/NameInputModal'
import WristSizeModal from '../../components/WristSizeModal'
import { checkLoginAndPrompt } from '../../utils/authGuard'
import { GameState, GAME_STATE } from './lib/gameState'
import type { PlateBead } from './lib/gameState'
import { PhysicsEngine } from './lib/physics'
import { Renderer } from './lib/renderer'
import { getCategories, getSubTypes, getBeadsBySubType } from './mock/beads'
import type { Category, SubType, BeadData } from './mock/beads'
import './index.scss'

// 珠子尺寸缩放：mm → canvas像素
const BEAD_SCALE = 3

export default function DiyPage() {
  const shareImageUrl = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/crystallogo/%E9%81%A3%E5%B1%B1%E6%B0%B4%E6%99%B6logo.png'

  const {
    wristSize,
    wearingStyle,
    setWristSize,
    setWearingStyle,
  } = useDiyStore()

  const { addToCart } = useCartStore()
  const { saveDesign } = useDesignStore()

  // 状态
  const [categories] = useState<Category[]>(getCategories)
  const [currentCategory, setCurrentCategory] = useState(categories[0]?.id || '')
  const [subTypes, setSubTypes] = useState<SubType[]>(() => getSubTypes(categories[0]?.id || ''))
  const [currentSubType, setCurrentSubType] = useState(subTypes[0]?.id || '')
  const [currentBeads, setCurrentBeads] = useState<any[]>(() => getBeadsBySubType(categories[0]?.id || '', subTypes[0]?.id || ''))
  const [beadCount, setBeadCount] = useState(0)
  const [canString, setCanString] = useState(false)
  const [isBracelet, setIsBracelet] = useState(false)

  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isSavingDesign, setIsSavingDesign] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [showWristModal, setShowWristModal] = useState(false)

  // 引用
  const canvasRef = useRef<any>(null)
  const gameStateRef = useRef(new GameState())
  const physicsRef = useRef<PhysicsEngine | null>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const plateCxRef = useRef(0)
  const plateCyRef = useRef(0)
  const plateRadiusRef = useRef(0)
  const braceletAnglesRef = useRef<number[]>([])
  const braceletRotationRef = useRef(0)
  const dragStateRef = useRef({
    isDragging: false,
    beadIndex: -1,
    slotIndex: -1,
    lastX: 0,
    lastY: 0,
    lastAngle: 0,
    currentX: undefined as number | undefined,
    currentY: undefined as number | undefined,
    mode: '' as '' | 'plate' | 'bracelet' | 'rotate'
  })
  const longPressTimerRef = useRef<any>(null)
  const addBeadAnimationRef = useRef<any>(null)
  const assembleAnimationRef = useRef<any>(null)

  // 页面显示时检查手围
  Taro.useDidShow(() => {
    if (wristSize === null) {
      setShowWristModal(true)
    }
  })

  // 启用分享
  Taro.useDidShow(() => {
    Taro.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    } as any)
  })

  // 更新 UI 状态
  const updateUI = useCallback(() => {
    const gs = gameStateRef.current
    const isBraceletState = gs.getState() === GAME_STATE.BRACELET
    const count = isBraceletState
      ? gs.getBraceletBeads().length
      : gs.getPlateBeadCount()
    setBeadCount(count)
    setCanString(gs.canStringBracelet())
    setIsBracelet(isBraceletState)
  }, [])

  // 初始化 Canvas
  useEffect(() => {
    const initCanvas = () => {
      const query = Taro.createSelectorQuery()
      query.select('#plateCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0] || !res[0].node) {
            setTimeout(initCanvas, 100)
            return
          }

          const canvas = res[0].node
          const ctx = canvas.getContext('2d')

          const dpr = Taro.getSystemInfoSync().pixelRatio
          canvas.width = res[0].width * dpr
          canvas.height = res[0].height * dpr
          ctx.scale(dpr, dpr)

          // 计算盘子参数
          plateCxRef.current = res[0].width / 2
          plateCyRef.current = res[0].height / 2
          plateRadiusRef.current = Math.min(res[0].width, res[0].height) * 0.35

          // 初始化物理引擎
          const physics = new PhysicsEngine()
          physics.init()
          physics.createPlate(plateCxRef.current, plateCyRef.current, plateRadiusRef.current)
          physicsRef.current = physics

          // 初始化渲染器
          rendererRef.current = new Renderer(ctx, res[0].width, res[0].height, canvas)

          // 开始渲染循环
          const loop = () => {
            update()
            render()
            animationIdRef.current = canvas.requestAnimationFrame(loop)
          }
          animationIdRef.current = canvas.requestAnimationFrame(loop)
        })
    }

    initCanvas()

    return () => {
      if (animationIdRef.current) {
        canvasRef.current?.cancelAnimationFrame(animationIdRef.current)
      }
      physicsRef.current?.destroy()
    }
  }, [])

  // 更新物理状态
  const update = useCallback(() => {
    const gs = gameStateRef.current

    if (gs.getState() === GAME_STATE.SHOOTING) {
      physicsRef.current?.update(16.67)
      if (physicsRef.current?.areBeadsSettled()) {
        gs.setState(GAME_STATE.SETTLED)
        updateUI()
      }
    }

    if (addBeadAnimationRef.current) {
      updateAddBeadAnimation()
    }

    if (assembleAnimationRef.current) {
      updateAssembleAnimation()
    }
  }, [updateUI])

  // 渲染画面
  const render = useCallback(() => {
    const renderer = rendererRef.current
    const physics = physicsRef.current
    const gs = gameStateRef.current
    if (!renderer || !physics) return

    renderer.clear()
    renderer.drawPlate(plateCxRef.current, plateCyRef.current, plateRadiusRef.current)

    const positions = physics.getBeadPositions()
    const plateBeads = gs.plateBeads

    positions.forEach((pos, index) => {
      if (plateBeads[index]) {
        renderer.drawBead(pos.x, pos.y, plateBeads[index].radius * BEAD_SCALE, plateBeads[index].color, pos.angle)
      }
    })

    if (gs.getState() === GAME_STATE.BRACELET) {
      const braceletBeads = gs.getBraceletBeads()
      if (braceletBeads.length > 0) {
        if (assembleAnimationRef.current) {
          const animPositions = getAssembleBeadPositions()
          if (animPositions) {
            const anim = assembleAnimationRef.current
            for (let i = 0; i < braceletBeads.length; i++) {
              const pos = animPositions[i]
              renderer.drawBead(pos.x, pos.y, anim.beadRadius, braceletBeads[i].color, pos.rollAngle)
            }
          }
          return
        }

        let draggedBeadPos = null
        const ds = dragStateRef.current
        if (ds.isDragging && ds.mode === 'bracelet' && ds.currentX !== undefined) {
          draggedBeadPos = { index: ds.beadIndex, x: ds.currentX, y: ds.currentY }
        }

        const rotatedAngles = braceletAnglesRef.current.map(a => a + braceletRotationRef.current)
        const scaledBeadRadius = (braceletBeads[0].radius || 5) * BEAD_SCALE
        renderer.drawBraceletWithAngles(braceletBeads, plateCxRef.current, plateCyRef.current, rotatedAngles, draggedBeadPos, scaledBeadRadius)
      }
    }
  }, [])

  // 更新添加珠子动画
  const updateAddBeadAnimation = useCallback(() => {
    const anim = addBeadAnimationRef.current
    if (!anim) return

    anim.progress += 0.08
    if (anim.progress > 0.92) anim.progress = 1

    const t = Math.min(anim.progress, 1)
    const ease = 1 - Math.pow(1 - t, 3)

    const phIdx = anim.placeholderIndex
    const newCount = anim.newCount

    if (anim.phase === 'makeSpace') {
      for (let i = 0; i < newCount; i++) {
        if (i === phIdx) {
          braceletAnglesRef.current[i] = anim.finalAngles[i]
          continue
        }
        const oldIdx = i < phIdx ? i : i - 1
        if (oldIdx < anim.oldAngles.length) {
          const from = anim.oldAngles[oldIdx]
          const to = anim.finalAngles[i]
          let diff = ((to - from) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI
          braceletAnglesRef.current[i] = from + diff * ease
        }
      }

      if (t >= 1) {
        anim.phase = 'shootBead'
        anim.progress = 0
        braceletAnglesRef.current = anim.finalAngles.slice()
      }
    } else {
      anim.beadX = (1 - ease) * anim.shootX + ease * anim.targetX
      anim.beadY = (1 - ease) * anim.shootY + ease * anim.targetY

      if (t >= 1) {
        const gs = gameStateRef.current
        const braceletBeads = gs.getBraceletBeads()
        braceletBeads.splice(phIdx, 1, anim.bead)
        braceletAnglesRef.current = anim.finalAngles.slice()
        addBeadAnimationRef.current = null
      }
    }
  }, [])

  // 更新聚合串动画
  const updateAssembleAnimation = useCallback(() => {
    const anim = assembleAnimationRef.current
    if (!anim) return

    anim.progress += 0.007
    if (anim.progress >= 1) {
      assembleAnimationRef.current = null
    }
  }, [])

  // 获取珠子在聚合动画中的当前位置
  const getAssembleBeadPositions = useCallback(() => {
    const anim = assembleAnimationRef.current
    if (!anim) return null

    const count = anim.totalBeads
    const totalDelay = (count - 1) * anim.delayPerBead
    const animDuration = 1 - totalDelay
    const positions = []

    for (let i = 0; i < count; i++) {
      const delay = i * anim.delayPerBead
      const localT = Math.max(0, Math.min(1, (anim.progress - delay) / animDuration))

      const sx = anim.startPositions[i].x
      const sy = anim.startPositions[i].y
      const tx = anim.targetPositions[i].x
      const ty = anim.targetPositions[i].y
      const data = anim.beadData[i]

      if (localT <= 0) {
        positions.push({ x: sx, y: sy, rollAngle: data.startRollAngle })
        continue
      }

      const ease = 1 - Math.pow(1 - localT, 3)
      const cx = sx + (tx - sx) * ease
      const cy = sy + (ty - sy) * ease

      const rollBlend = localT * (1 - localT) * 4
      const rollingDist = ease * data.dist / anim.beadRadius
      const rollAngle = data.startRollAngle + rollingDist + data.angleDiff * rollBlend

      positions.push({ x: cx, y: cy, rollAngle })
    }

    return positions
  }, [])

  // 珠子点击 - 弹射
  const handleBeadTap = useCallback((bead: any) => {
    if (assembleAnimationRef.current) return

    const gs = gameStateRef.current

    if (gs.getState() === GAME_STATE.BRACELET) {
      animateAddBeadToBracelet(bead)
      return
    }

    if (gs.getState() === GAME_STATE.IDLE ||
        gs.getState() === GAME_STATE.SETTLED ||
        gs.getState() === GAME_STATE.SHOOTING) {

      const direction = gs.shootDirection
      const baseAngle = direction === 'left'
        ? Math.PI * (250 / 180)
        : Math.PI * (290 / 180)
      const angle = baseAngle + (Math.random() - 0.5) * (Math.PI * 4 / 180)

      const speed = 22
      physicsRef.current?.shootBead(
        plateCxRef.current,
        plateCyRef.current + plateRadiusRef.current - 20,
        angle,
        speed,
        bead.radius * BEAD_SCALE
      )

      gs.addBeadToPlate(bead)
      gs.setState(GAME_STATE.SHOOTING)
      updateUI()
    }
  }, [updateUI])

  // 手串模式 - 动画添加珠子
  const animateAddBeadToBracelet = useCallback((bead: any) => {
    if (addBeadAnimationRef.current) {
      finishAddBeadAnimation()
    }

    const gs = gameStateRef.current
    const braceletBeads = gs.getBraceletBeads()
    const count = braceletBeads.length

    if (!braceletAnglesRef.current || braceletAnglesRef.current.length !== count) {
      recalcBraceletAngles()
    }

    const rotation = braceletRotationRef.current
    braceletRotationRef.current = 0

    for (let i = 0; i < braceletAnglesRef.current.length; i++) {
      braceletAnglesRef.current[i] = ((braceletAnglesRef.current[i] % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    }

    if (rotation !== 0) {
      for (let i = 0; i < braceletAnglesRef.current.length; i++) {
        braceletAnglesRef.current[i] += rotation
      }
    }

    const beadRadius = count > 0 ? ((braceletBeads[0].radius || 5) * BEAD_SCALE) : (5 * BEAD_SCALE)

    let placeholderIndex = count
    let referenceIndex = 0
    if (count > 0) {
      let minDiff = Infinity
      for (let i = 0; i < count; i++) {
        let ang = ((braceletAnglesRef.current[i] % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
        let diff = Math.abs(ang - 3 * Math.PI / 2)
        if (diff > Math.PI) diff = Math.PI * 2 - diff
        if (diff < minDiff) { minDiff = diff; referenceIndex = i }
      }
      const targetRelPos = Math.floor(count / 2)
      placeholderIndex = (referenceIndex + targetRelPos) % count + 1
    }

    const placeholder = { _placeholder: true, radius: beadRadius, color: 'transparent' }
    const newCount = count + 1
    const newSlotAngle = (Math.PI * 2) / newCount

    const refNewIndex = referenceIndex < placeholderIndex ? referenceIndex : referenceIndex + 1
    const rotationOffset = 3 * Math.PI / 2 - (refNewIndex * newSlotAngle - Math.PI / 2)

    const finalAngles = []
    for (let i = 0; i < newCount; i++) {
      finalAngles.push(i * newSlotAngle - Math.PI / 2 + rotationOffset)
    }

    const shootX = plateCxRef.current
    const shootY = plateCyRef.current + plateRadiusRef.current + 40

    const oldAngles = [...braceletAnglesRef.current]

    braceletBeads.splice(placeholderIndex, 0, placeholder as any)
    braceletAnglesRef.current.splice(placeholderIndex, 0, finalAngles[placeholderIndex])

    const tightRadius = beadRadius / Math.sin(Math.PI / newCount)
    const phAngle = finalAngles[placeholderIndex]
    const targetX = plateCxRef.current + Math.cos(phAngle) * tightRadius
    const targetY = plateCyRef.current + Math.sin(phAngle) * tightRadius

    addBeadAnimationRef.current = {
      bead,
      placeholderIndex,
      phase: 'makeSpace',
      progress: 0,
      oldAngles,
      finalAngles,
      shootX,
      shootY,
      targetX,
      targetY,
      beadX: shootX,
      beadY: shootY,
      newCount
    }

    updateUI()
  }, [updateUI])

  // 立即完成添加珠子动画
  const finishAddBeadAnimation = useCallback(() => {
    const anim = addBeadAnimationRef.current
    if (!anim) return

    const gs = gameStateRef.current
    const phIdx = anim.placeholderIndex
    const braceletBeads = gs.getBraceletBeads()

    if (anim.phase === 'makeSpace') {
      braceletAnglesRef.current = anim.finalAngles.slice()
    }

    braceletBeads.splice(phIdx, 1, anim.bead)
    braceletAnglesRef.current = anim.finalAngles.slice()
    addBeadAnimationRef.current = null
  }, [])

  // 重新计算手串角度位置
  const recalcBraceletAngles = useCallback(() => {
    const gs = gameStateRef.current
    const count = gs.getBraceletBeads().length
    braceletAnglesRef.current = []
    for (let i = 0; i < count; i++) {
      braceletAnglesRef.current.push((i / count) * Math.PI * 2 - Math.PI / 2)
    }
    braceletRotationRef.current = 0
  }, [])

  // 串手串
  const handleStringBracelet = useCallback(() => {
    if (assembleAnimationRef.current) return
    const gs = gameStateRef.current
    if (!gs.canStringBracelet()) return

    const startPositions = physicsRef.current!.getBeadPositions().map(p => ({ x: p.x, y: p.y }))

    physicsRef.current!.clearBeads()
    gs.stringBracelet()

    const beads = gs.getBraceletBeads()
    const count = beads.length
    const beadRadius = (beads[0].radius || 5) * BEAD_SCALE
    const tightRadius = count > 1 ? beadRadius / Math.sin(Math.PI / count) : 0

    const targetAngles = []
    const targetPositions = []
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2
      targetAngles.push(angle)
      targetPositions.push({
        x: plateCxRef.current + Math.cos(angle) * tightRadius,
        y: plateCyRef.current + Math.sin(angle) * tightRadius
      })
    }

    braceletAnglesRef.current = targetAngles.slice()
    braceletRotationRef.current = 0

    const beadData = []
    for (let i = 0; i < count; i++) {
      const dx = targetPositions[i].x - startPositions[i].x
      const dy = targetPositions[i].y - startPositions[i].y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const startRollAngle = Math.atan2(startPositions[i].y - plateCyRef.current, startPositions[i].x - plateCxRef.current) + Math.PI / 2
      const targetRollAngle = targetAngles[i] + Math.PI / 2
      let angleDiff = targetRollAngle - startRollAngle
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
      beadData.push({ dist, startRollAngle, targetRollAngle, angleDiff })
    }

    assembleAnimationRef.current = {
      startPositions,
      targetPositions,
      targetAngles,
      beadRadius,
      beadData,
      progress: 0,
      delayPerBead: 0.02,
      totalBeads: count
    }

    updateUI()
  }, [updateUI])

  // 打散手串
  const disbandBracelet = useCallback(() => {
    const gs = gameStateRef.current
    const braceletBeads = gs.getBraceletBeads()

    gs.plateBeads = [...braceletBeads]
    gs.braceletBeads = []
    gs.setState(GAME_STATE.SHOOTING)

    physicsRef.current!.clearBeads()
    const beadRadius = (gs.plateBeads[0]?.radius || 5) * BEAD_SCALE
    const count = gs.plateBeads.length

    const scatterSpeed = 8
    const startRadius = beadRadius * 2

    for (let i = 0; i < count; i++) {
      const baseAngle = (i / count) * Math.PI * 2
      const jitter = (Math.random() - 0.5) * (Math.PI * 2 / count) * 0.5
      const angle = baseAngle + jitter

      const x = plateCxRef.current + Math.cos(angle) * startRadius
      const y = plateCyRef.current + Math.sin(angle) * startRadius

      physicsRef.current!.shootBead(x, y, angle, scatterSpeed, beadRadius)
    }

    braceletAnglesRef.current = []
  }, [])

  // 打散按钮点击
  const handleDisband = useCallback(() => {
    if (assembleAnimationRef.current) return
    disbandBracelet()
    updateUI()
  }, [disbandBracelet, updateUI])

  // Canvas 触摸事件
  const handleCanvasTouch = useCallback((e: any) => {
    if (assembleAnimationRef.current) return

    const gs = gameStateRef.current
    const state = gs.getState()

    if (e.type === 'touchend') {
      handleTouchEnd()
      return
    }

    const touch = e.touches[0]
    if (!touch) return

    const x = touch.x
    const y = touch.y

    if (e.type === 'touchstart') {
      if (state === GAME_STATE.BRACELET) {
        handleBraceletTouchStart(x, y)
      } else if (state === GAME_STATE.SETTLED) {
        handlePlateTouchStart(x, y)
      }
    } else if (e.type === 'touchmove') {
      const ds = dragStateRef.current
      if (ds.isDragging) {
        if (ds.mode === 'bracelet') {
          handleBraceletTouchMove(x, y)
        } else if (ds.mode === 'plate') {
          handlePlateTouchMove(x, y)
        } else if (ds.mode === 'rotate') {
          handleBraceletRotateMove(x, y)
        }
      }
    }
  }, [])

  // 盘子模式 - 触摸开始
  const handlePlateTouchStart = useCallback((x: number, y: number) => {
    const positions = physicsRef.current!.getBeadPositions()
    const plateBeads = gameStateRef.current.plateBeads

    for (let i = positions.length - 1; i >= 0; i--) {
      const pos = positions[i]
      if (!plateBeads[i]) continue

      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2)
      if (distance < plateBeads[i].radius * BEAD_SCALE) {
        dragStateRef.current.isDragging = true
        dragStateRef.current.beadIndex = i
        dragStateRef.current.lastX = x
        dragStateRef.current.lastY = y
        dragStateRef.current.mode = 'plate'

        longPressTimerRef.current = setTimeout(() => {
          showDeleteConfirm(i)
        }, 800)
        break
      }
    }
  }, [])

  // 盘子模式 - 触摸移动
  const handlePlateTouchMove = useCallback((x: number, y: number) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    const distFromCenter = Math.sqrt((x - plateCxRef.current) ** 2 + (y - plateCyRef.current) ** 2)
    if (distFromCenter > plateRadiusRef.current * 1.1) {
      const deleteIndex = dragStateRef.current.beadIndex
      const body = physicsRef.current!.beadBodies[deleteIndex]
      if (body) {
        physicsRef.current!.Matter.World.remove(physicsRef.current!.world, body)
        physicsRef.current!.beadBodies.splice(deleteIndex, 1)
      }
      gameStateRef.current.plateBeads.splice(deleteIndex, 1)

      if (gameStateRef.current.plateBeads.length === 0) {
        gameStateRef.current.setState(GAME_STATE.IDLE)
      }

      dragStateRef.current.isDragging = false
      dragStateRef.current.beadIndex = -1
      dragStateRef.current.mode = ''
      updateUI()
      return
    }

    const body = physicsRef.current!.beadBodies[dragStateRef.current.beadIndex]
    if (body) {
      const Matter = physicsRef.current!.Matter
      Matter.Body.setPosition(body, { x, y })
      Matter.Body.setVelocity(body, { x: 0, y: 0 })
    }

    dragStateRef.current.lastX = x
    dragStateRef.current.lastY = y
  }, [updateUI])

  // 手串模式 - 触摸开始
  const handleBraceletTouchStart = useCallback((x: number, y: number) => {
    const gs = gameStateRef.current
    const braceletBeads = gs.getBraceletBeads()
    const count = braceletBeads.length
    if (count === 0) return

    const beadRadius = (braceletBeads[0].radius || 5) * BEAD_SCALE
    const tightRadius = count > 1 ? beadRadius / Math.sin(Math.PI / count) : 0

    if (!braceletAnglesRef.current || braceletAnglesRef.current.length !== count) {
      braceletAnglesRef.current = []
      for (let i = 0; i < count; i++) {
        braceletAnglesRef.current.push((i / count) * Math.PI * 2 - Math.PI / 2)
      }
    }

    for (let index = 0; index < count; index++) {
      const beadX = plateCxRef.current + Math.cos(braceletAnglesRef.current[index]) * tightRadius
      const beadY = plateCyRef.current + Math.sin(braceletAnglesRef.current[index]) * tightRadius

      const distance = Math.sqrt((x - beadX) ** 2 + (y - beadY) ** 2)
      if (distance < beadRadius * 1.2) {
        dragStateRef.current.isDragging = true
        dragStateRef.current.beadIndex = index
        dragStateRef.current.slotIndex = index
        dragStateRef.current.mode = 'bracelet'
        return
      }
    }

    dragStateRef.current.isDragging = true
    dragStateRef.current.mode = 'rotate'
    dragStateRef.current.lastAngle = Math.atan2(y - plateCyRef.current, x - plateCxRef.current)
  }, [])

  // 手串旋转 - 触摸移动
  const handleBraceletRotateMove = useCallback((x: number, y: number) => {
    const currentAngle = Math.atan2(y - plateCyRef.current, x - plateCxRef.current)
    let delta = currentAngle - dragStateRef.current.lastAngle

    if (delta > Math.PI) delta -= Math.PI * 2
    if (delta < -Math.PI) delta += Math.PI * 2

    braceletRotationRef.current += delta
    braceletRotationRef.current = ((braceletRotationRef.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    dragStateRef.current.lastAngle = currentAngle
  }, [])

  // 手串模式 - 触摸移动
  const handleBraceletTouchMove = useCallback((x: number, y: number) => {
    const gs = gameStateRef.current
    const braceletBeads = gs.getBraceletBeads()
    const count = braceletBeads.length
    if (count <= 1) return

    dragStateRef.current.currentX = x
    dragStateRef.current.currentY = y

    const currentAngle = Math.atan2(y - plateCyRef.current, x - plateCxRef.current)
    const slotAngle = (Math.PI * 2) / count

    let normalizedAngle = currentAngle + Math.PI / 2
    if (normalizedAngle < 0) normalizedAngle += Math.PI * 2
    if (normalizedAngle >= Math.PI * 2) normalizedAngle -= Math.PI * 2

    const targetSlot = Math.round(normalizedAngle / slotAngle) % count
    const currentSlot = dragStateRef.current.slotIndex

    if (targetSlot !== currentSlot) {
      let diff = targetSlot - currentSlot
      if (diff > count / 2) diff -= count
      if (diff < -count / 2) diff += count

      if (diff > 0) {
        for (let i = currentSlot; i < targetSlot; i++) {
          const temp = braceletBeads[i]
          braceletBeads[i] = braceletBeads[i + 1]
          braceletBeads[i + 1] = temp
        }
      } else if (diff < 0) {
        for (let i = currentSlot; i > targetSlot; i--) {
          const temp = braceletBeads[i]
          braceletBeads[i] = braceletBeads[i - 1]
          braceletBeads[i - 1] = temp
        }
      }

      dragStateRef.current.slotIndex = targetSlot
      dragStateRef.current.beadIndex = targetSlot
    }

    braceletAnglesRef.current[dragStateRef.current.beadIndex] = currentAngle

    for (let i = 0; i < count; i++) {
      if (i === dragStateRef.current.beadIndex) continue
      braceletAnglesRef.current[i] = (i * slotAngle) - Math.PI / 2
    }
  }, [])

  // 触摸结束
  const handleTouchEnd = useCallback(() => {
    const ds = dragStateRef.current
    const gs = gameStateRef.current

    if (ds.mode === 'bracelet' && ds.currentX !== undefined) {
      const distFromCenter = Math.sqrt(
        (ds.currentX - plateCxRef.current) ** 2 +
        (ds.currentY - plateCyRef.current) ** 2
      )

      if (distFromCenter > plateRadiusRef.current * 1.1) {
        const deleteIndex = ds.beadIndex
        gs.removeBeadFromBracelet(deleteIndex)

        if (braceletAnglesRef.current) {
          braceletAnglesRef.current.splice(deleteIndex, 1)
        }

        if (gs.getBraceletBeads().length < 10) {
          disbandBracelet()
        } else {
          recalcBraceletAngles()
        }

        updateUI()
      }
    }

    if (braceletAnglesRef.current && ds.mode === 'bracelet' && ds.currentX !== undefined) {
      const count = braceletAnglesRef.current.length
      const slotAngle = (Math.PI * 2) / count
      for (let i = 0; i < count; i++) {
        braceletAnglesRef.current[i] = (i * slotAngle) - Math.PI / 2
      }
    }

    if (ds.mode === 'rotate' && braceletRotationRef.current !== 0) {
      if (braceletAnglesRef.current) {
        for (let i = 0; i < braceletAnglesRef.current.length; i++) {
          braceletAnglesRef.current[i] += braceletRotationRef.current
        }
      }
      braceletRotationRef.current = 0
    }

    dragStateRef.current.isDragging = false
    dragStateRef.current.beadIndex = -1
    dragStateRef.current.slotIndex = -1
    dragStateRef.current.currentX = undefined
    dragStateRef.current.currentY = undefined
    dragStateRef.current.mode = ''

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [disbandBracelet, recalcBraceletAngles, updateUI])

  // 显示删除确认
  const showDeleteConfirm = useCallback((index: number) => {
    const gs = gameStateRef.current
    const state = gs.getState()
    const content = state === GAME_STATE.BRACELET
      ? '确定要从手串中删除这颗珠子吗？'
      : '确定要删除这颗珠子吗？'

    Taro.showModal({
      title: '删除珠子',
      content,
      success: (res) => {
        if (res.confirm) {
          if (state === GAME_STATE.BRACELET) {
            gs.removeBeadFromBracelet(index)
            if (braceletAnglesRef.current) {
              braceletAnglesRef.current.splice(index, 1)
            }
          } else {
            physicsRef.current!.beadBodies.splice(index, 1)
            gs.plateBeads.splice(index, 1)
          }
          updateUI()
        }
      }
    })
  }, [updateUI])

  // 切换主分类
  const handleCategoryTap = useCallback((categoryId: string) => {
    setCurrentCategory(categoryId)
    const newSubTypes = getSubTypes(categoryId)
    setSubTypes(newSubTypes)
    const firstSubType = newSubTypes.length > 0 ? newSubTypes[0].id : ''
    setCurrentSubType(firstSubType)
    setCurrentBeads(getBeadsBySubType(categoryId, firstSubType))
  }, [])

  // 切换子类
  const handleSubTypeTap = useCallback((subTypeId: string) => {
    setCurrentSubType(subTypeId)
    setCurrentBeads(getBeadsBySubType(currentCategory, subTypeId))
  }, [currentCategory])

  // 增大珠子尺寸
  const handleSizeUp = useCallback((beadId: string) => {
    setCurrentBeads(prev => prev.map(b => {
      if (b.id === beadId && b.sizeIndex < b.sizes.length - 1) {
        const newIndex = b.sizeIndex + 1
        return { ...b, sizeIndex: newIndex, radius: b.sizes[newIndex] / 2 }
      }
      return b
    }))
  }, [])

  // 减小珠子尺寸
  const handleSizeDown = useCallback((beadId: string) => {
    setCurrentBeads(prev => prev.map(b => {
      if (b.id === beadId && b.sizeIndex > 0) {
        const newIndex = b.sizeIndex - 1
        return { ...b, sizeIndex: newIndex, radius: b.sizes[newIndex] / 2 }
      }
      return b
    }))
  }, [])

  // 手围设置确认
  const handleWristSizeConfirm = useCallback((size: number, style: 'single' | 'double') => {
    setWristSize(size)
    setWearingStyle(style)
    setShowWristModal(false)
    Taro.showToast({ title: '设置成功', icon: 'success', duration: 1500 })
  }, [setWristSize, setWearingStyle])

  // 保存设计
  const handleSaveDesign = useCallback(async () => {
    const isLoggedIn = await checkLoginAndPrompt('保存设计')
    if (!isLoggedIn) return

    const gs = gameStateRef.current
    const beads = gs.getState() === GAME_STATE.BRACELET ? gs.getBraceletBeads() : gs.plateBeads
    if (beads.length === 0) {
      Taro.showToast({ title: '请至少添加一个珠子', icon: 'none' })
      return
    }

    if (isSavingDesign) return
    setShowNameModal(true)
  }, [isSavingDesign])

  const handleConfirmSave = useCallback(async (designName: string) => {
    setShowNameModal(false)
    setIsSavingDesign(true)

    try {
      Taro.showLoading({ title: '保存中...', mask: true })

      const gs = gameStateRef.current
      const beads = gs.getState() === GAME_STATE.BRACELET ? gs.getBraceletBeads() : gs.plateBeads

      const braceletData = {
        beads: beads.map(b => ({
          id: b.id,
          name: b.name,
          category: b.category || '',
          imageUrl: b.image || '',
          price: 0,
          weight: 0,
          diameter: b.radius * 2 / BEAD_SCALE,
          stock: 999,
        })),
        name: designName,
        updatedAt: Date.now(),
      }

      await saveDesign(braceletData as any, designName, '')
      Taro.hideLoading()
      Taro.showToast({ title: '保存成功', icon: 'success' })
    } catch (error: any) {
      Taro.hideLoading()
      Taro.showToast({ title: error.message || '保存失败', icon: 'none' })
    } finally {
      setIsSavingDesign(false)
    }
  }, [saveDesign])

  // 加入购物车
  const handleAddToCart = useCallback(async () => {
    const isLoggedIn = await checkLoginAndPrompt('加入购物车')
    if (!isLoggedIn) return

    const gs = gameStateRef.current
    const beads = gs.getState() === GAME_STATE.BRACELET ? gs.getBraceletBeads() : gs.plateBeads
    if (beads.length === 0) {
      Taro.showToast({ title: '请至少添加一个珠子', icon: 'none' })
      return
    }

    if (isAddingToCart) return
    setIsAddingToCart(true)

    try {
      Taro.showLoading({ title: '加入购物车中...', mask: true })

      const now = new Date()
      const timeStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
      const braceletName = `用户${timeStr}`

      const braceletData = {
        beads: beads.map(b => ({
          id: b.id,
          name: b.name,
          category: b.category || '',
          imageUrl: b.image || '',
          price: 0,
          weight: 0,
          diameter: b.radius * 2 / BEAD_SCALE,
          stock: 999,
        })),
        name: braceletName,
        updatedAt: Date.now(),
      }

      const propertiesData = {
        beadCount: beads.length,
        totalPrice: 0,
        totalWeight: 0,
        totalLength: 0,
      }

      await addToCart(braceletData as any, propertiesData)
      Taro.hideLoading()
      Taro.showToast({ title: '加入购物车成功', icon: 'success' })

      setTimeout(() => {
        Taro.switchTab({ url: '/pages/cart/index' })
      }, 1500)
    } catch (error: any) {
      Taro.hideLoading()
      Taro.showModal({
        title: '加入购物车失败',
        content: error.message || '加入购物车失败，请重试',
        showCancel: true,
        confirmText: '去登录',
        cancelText: '取消',
      })
    } finally {
      setIsAddingToCart(false)
    }
  }, [addToCart, isAddingToCart])

  // 分享
  useShareAppMessage(() => ({
    title: beadCount > 0
      ? `我设计了一个${beadCount}颗珠子的水晶手串！`
      : 'DIY水晶手串设计 - 定制你的专属饰品',
    path: '/pages/diy/index',
    imageUrl: shareImageUrl,
  }))

  useShareTimeline(() => ({
    title: beadCount > 0
      ? `我设计了一个${beadCount}颗珠子的水晶手串！`
      : 'DIY水晶手串设计 - 定制你的专属饰品',
    query: '',
    imageUrl: shareImageUrl,
  }))

  return (
    <View className="diy-page">
      {/* 盘子区域 - 上方 60% */}
      <View className="diy-page__canvas">
        <Canvas
          type="2d"
          id="plateCanvas"
          canvasId="plateCanvas"
          className="diy-page__canvas-inner"
          ref={canvasRef}
          onTouchStart={handleCanvasTouch}
          onTouchMove={handleCanvasTouch}
          onTouchEnd={handleCanvasTouch}
        />

        {/* 左下角 - 手围设置 + 工具箱 */}
        <View className="diy-page__bottom-left">
          <Button className="diy-page__btn" onClick={() => setShowWristModal(true)}>手围设置</Button>
          <Button className="diy-page__btn" onClick={() => {}}>工具箱</Button>
        </View>

        {/* 右上角 - 保存 + 购买 */}
        <View className="diy-page__top-right">
          <Button className="diy-page__btn" onClick={handleSaveDesign} disabled={beadCount === 0}>保存</Button>
          <Button className="diy-page__btn diy-page__btn--primary" onClick={handleAddToCart} disabled={beadCount === 0}>购买</Button>
        </View>

        {/* 底部 - 串手串/打散 */}
        {isBracelet ? (
          <Button className="diy-page__btn-string diy-page__btn-string--active diy-page__btn-string--disband" onClick={handleDisband}>
            打散
          </Button>
        ) : (
          <Button
            className={`diy-page__btn-string ${canString ? 'diy-page__btn-string--active' : ''}`}
            onClick={handleStringBracelet}
          >
            串手串 ({beadCount}/10)
          </Button>
        )}
      </View>

      {/* 选择区域 - 下方 40% */}
      <View className="diy-page__selector">
        {/* 主分类标签 */}
        <ScrollView scrollX className="diy-page__categories">
          {categories.map(cat => (
            <View
              key={cat.id}
              className={`diy-page__tab ${currentCategory === cat.id ? 'diy-page__tab--active' : ''}`}
              onClick={() => handleCategoryTap(cat.id)}
            >
              {cat.name}
            </View>
          ))}
        </ScrollView>

        {/* 子类列表 + 珠子网格 */}
        <View className="diy-page__content">
          {/* 左侧子类列表 */}
          <ScrollView scrollY className="diy-page__subtypes">
            {subTypes.map(sub => (
              <View
                key={sub.id}
                className={`diy-page__subtype ${currentSubType === sub.id ? 'diy-page__subtype--active' : ''}`}
                onClick={() => handleSubTypeTap(sub.id)}
              >
                {sub.name}
              </View>
            ))}
          </ScrollView>

          {/* 右侧珠子网格 */}
          <ScrollView scrollY className="diy-page__beads">
            <View className="diy-page__grid">
              {currentBeads.map(bead => (
                <View
                  key={bead.id}
                  className="bead-card"
                  onClick={() => handleBeadTap(bead)}
                >
                  <View className="bead-card__preview">
                    <View className="bead-card__color" style={{ backgroundColor: bead.color }} />
                  </View>
                  <Text className="bead-card__name">{bead.name}</Text>
                  <Text className="bead-card__size">{bead.radius * 2}mm</Text>
                  <View className="bead-card__actions">
                    <Button
                      className="bead-card__action bead-card__action--left"
                      catchtap={() => handleSizeDown(bead.id)}
                    >
                      -
                    </Button>
                    <Button
                      className="bead-card__action bead-card__action--right"
                      catchtap={() => handleSizeUp(bead.id)}
                    >
                      +
                    </Button>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* 命名对话框 */}
      <NameInputModal
        visible={showNameModal}
        defaultName={`手串设计${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`}
        onConfirm={handleConfirmSave}
        onCancel={() => setShowNameModal(false)}
      />

      {/* 手围设置弹窗 */}
      <WristSizeModal
        visible={showWristModal}
        initialSize={wristSize}
        initialStyle={wearingStyle}
        onConfirm={handleWristSizeConfirm}
        onClose={() => wristSize !== null && setShowWristModal(false)}
      />
    </View>
  )
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit src/pages/diy/index.tsx
```

Expected: 可能有一些类型错误，需要修复

- [ ] **Step 3: Commit**

```bash
git add src/pages/diy/index.tsx
git commit -m "feat: rewrite DIY page with reference project logic"
```

---

### Task 8: 测试和调试

**Files:**
- None (testing only)

- [ ] **Step 1: 启动开发服务器**

```bash
npm run dev:weapp
```

Expected: 开发服务器启动成功

- [ ] **Step 2: 在微信开发者工具中测试**

1. 打开微信开发者工具
2. 导入项目目录
3. 测试以下功能：
   - 珠子分类切换
   - 子类切换
   - 珠子点击添加到盘子
   - 珠子尺寸调整
   - 串手串功能
   - 打散功能
   - 手围设置弹窗
   - 保存设计功能
   - 加入购物车功能

- [ ] **Step 3: 修复发现的问题**

根据测试结果修复代码问题

- [ ] **Step 4: Commit 修复**

```bash
git add -A
git commit -m "fix: fix issues found during testing"
```

---

### Task 9: 清理不再使用的文件（可选）

**Files:**
- Delete: `src/components/PlateCanvas/`
- Delete: `src/components/BeadSelector/`
- Delete: `src/lib/PhysicsEngine.ts`
- Delete: `src/lib/Renderer.ts`
- Delete: `src/lib/GameState.ts`
- Delete: `src/hooks/usePlatePhysics.ts`

- [ ] **Step 1: 删除不再使用的组件**

```bash
rm -rf src/components/PlateCanvas
rm -rf src/components/BeadSelector
```

- [ ] **Step 2: 删除不再使用的库文件**

```bash
rm src/lib/PhysicsEngine.ts
rm src/lib/Renderer.ts
rm src/lib/GameState.ts
```

- [ ] **Step 3: 删除不再使用的 hooks**

```bash
rm src/hooks/usePlatePhysics.ts
```

- [ ] **Step 4: 验证项目仍能编译**

```bash
npm run build:weapp
```

Expected: 构建成功

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove unused components and files"
```

---

## 预计工作量

- **Task 1-5**：移植核心逻辑，约 2-3 小时
- **Task 6-7**：重写页面，约 2-3 小时
- **Task 8**：测试调试，约 1-2 小时
- **Task 9**：清理，约 30 分钟
- **总计**：约 6-9 小时

## 风险点

1. **Canvas 兼容性** - Taro 的 Canvas API 可能与原生微信小程序有差异
2. **物理引擎适配** - 需要调整物理引擎以适配 Taro 的事件系统
3. **动画性能** - 需要确保动画在小程序中流畅运行
4. **Matter.js 导入** - 可能需要处理模块导入问题
