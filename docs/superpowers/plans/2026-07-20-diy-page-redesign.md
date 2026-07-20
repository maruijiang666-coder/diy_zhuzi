# DIY 页面重新设计实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 DIY 页面从组件列表点击添加重新设计为基于 Matter.js 物理引擎的 Canvas 2D 盘子交互模式

**Architecture:** 三层架构 — 物理层（PhysicsEngine/Renderer/GameState TypeScript 类，移植自参考项目）、Hook 层（usePlatePhysics 封装生命周期）、页面层（DiyPage + PlateCanvas + BeadSelector）

**Tech Stack:** Taro 3.6 + React 18 + Matter.js + Canvas 2D + Zustand

---

## 文件结构

```
src/
├── libs/
│   └── matter.min.js              # 从参考项目拷贝
├── lib/
│   ├── GameState.ts               # 移植自 state.js
│   ├── PhysicsEngine.ts           # 移植自 physics.js
│   └── Renderer.ts                # 移植自 renderer.js
├── hooks/
│   └── usePlatePhysics.ts         # 新建
├── components/
│   ├── PlateCanvas/               # 新建
│   │   ├── index.tsx
│   │   └── index.scss
│   ├── BeadSelector/              # 重写
│   │   ├── index.tsx
│   │   └── index.scss
│   └── DesignCanvas/              # 删除（被 PlateCanvas 替代）
├── pages/
│   └── diy/
│       ├── index.tsx              # 重写
│       └── index.scss             # 重写
├── utils/
│   └── beadAdapter.ts             # 新建
└── types/
    └── bead.ts                    # 更新
```

---

### Task 1: 拷贝 matter.min.js 并创建类型声明

**Files:**
- Create: `src/libs/matter.min.js`
- Create: `src/libs/matter.d.ts`

- [ ] **Step 1: 拷贝 matter.min.js**

```bash
cp "F:\DieJiaTai\diy_shouchuang\libs\matter.min.js" "F:\DieJiaTai\diyUseCanvans\DIY_crystal_bus\src\libs\matter.min.js"
```

- [ ] **Step 2: 创建类型声明文件**

```typescript
// src/libs/matter.d.ts
declare module '*.min.js' {
  const Matter: any
  export default Matter
}
```

- [ ] **Step 3: 验证文件存在**

```bash
ls -la src/libs/
```

Expected: matter.min.js 和 matter.d.ts 都存在

- [ ] **Step 4: 提交**

```bash
git add src/libs/
git commit -m "chore: add Matter.js physics engine library"
```

---

### Task 2: 创建 GameState.ts

**Files:**
- Create: `src/lib/GameState.ts`

- [ ] **Step 1: 创建 GameState.ts**

```typescript
// src/lib/GameState.ts

export const GAME_STATE = {
  IDLE: 'idle',
  SHOOTING: 'shooting',
  SETTLED: 'settled',
  BRACELET: 'bracelet'
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
  price: number
  image?: string
  category?: string
  subType?: string
}

export class GameState {
  state: GameStateType = GAME_STATE.IDLE
  plateBeads: PlateBead[] = []
  braceletBeads: PlateBead[] = []
  shootCount: number = 0
  shootDirection: ShootDirectionType = SHOOT_DIRECTION.LEFT

  getState(): GameStateType {
    return this.state
  }

  setState(newState: GameStateType): void {
    this.state = newState
  }

  addBeadToPlate(bead: PlateBead): void {
    this.plateBeads.push(bead)
    this.shootCount++
    this.shootDirection = this.shootCount % 2 === 0
      ? SHOOT_DIRECTION.RIGHT
      : SHOOT_DIRECTION.LEFT
  }

  getPlateBeadCount(): number {
    return this.plateBeads.length
  }

  canStringBracelet(): boolean {
    return this.plateBeads.length >= 10
  }

  stringBracelet(): void {
    this.braceletBeads = [...this.plateBeads]
    this.plateBeads = []
    this.state = GAME_STATE.BRACELET
  }

  addBeadToBracelet(bead: PlateBead): void {
    this.braceletBeads.push(bead)
  }

  removeBeadFromBracelet(index: number): void {
    this.braceletBeads.splice(index, 1)
  }

  getBraceletBeads(): PlateBead[] {
    return this.braceletBeads
  }

  reset(): void {
    this.state = GAME_STATE.IDLE
    this.plateBeads = []
    this.braceletBeads = []
    this.shootCount = 0
    this.shootDirection = SHOOT_DIRECTION.LEFT
  }
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit src/lib/GameState.ts
```

Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/lib/GameState.ts
git commit -m "feat: add GameState class for plate/bracelet state management"
```

---

### Task 3: 创建 PhysicsEngine.ts

**Files:**
- Create: `src/lib/PhysicsEngine.ts`

- [ ] **Step 1: 创建 PhysicsEngine.ts**

```typescript
// src/lib/PhysicsEngine.ts

export class PhysicsEngine {
  engine: any = null
  world: any = null
  plateBodies: any[] = []
  beadBodies: any[] = []
  private Matter: any = null

  init(Matter: any): void {
    this.Matter = Matter
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 }
    })
    this.world = this.engine.world
  }

  createPlate(cx: number, cy: number, radius: number): void {
    const Matter = this.Matter
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

    const bottom = Matter.Bodies.rectangle(cx, cy + radius - 10, radius * 1.5, 10, {
      isStatic: true,
      render: { visible: false }
    })

    bodies.push(bottom)
    this.plateBodies = bodies
    Matter.World.add(this.world, bodies)
  }

  shootBead(x: number, y: number, angle: number, speed: number, radius: number): any {
    const Matter = this.Matter

    const bead = Matter.Bodies.circle(x, y, radius, {
      restitution: 0.5,
      friction: 0.15,
      frictionAir: 0.05,
      density: 0.003,
      render: { visible: false }
    })

    Matter.Body.setVelocity(bead, {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed
    })

    this.beadBodies.push(bead)
    Matter.World.add(this.world, bead)

    return bead
  }

  update(delta: number): void {
    this.Matter.Engine.update(this.engine, delta)
  }

  getBeadPositions(): Array<{ x: number; y: number; angle: number }> {
    return this.beadBodies.map(body => ({
      x: body.position.x,
      y: body.position.y,
      angle: body.angle
    }))
  }

  areBeadsSettled(): boolean {
    if (this.beadBodies.length === 0) return true
    return this.beadBodies.every(body => {
      const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2)
      return speed < 0.5
    })
  }

  clearBeads(): void {
    this.beadBodies.forEach(body => {
      this.Matter.World.remove(this.world, body)
    })
    this.beadBodies = []
  }

  destroy(): void {
    this.Matter.World.clear(this.world)
    this.Matter.Engine.clear(this.engine)
  }
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit src/lib/PhysicsEngine.ts
```

Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/lib/PhysicsEngine.ts
git commit -m "feat: add PhysicsEngine class wrapping Matter.js"
```

---

### Task 4: 创建 Renderer.ts

**Files:**
- Create: `src/lib/Renderer.ts`

- [ ] **Step 1: 创建 Renderer.ts**

```typescript
// src/lib/Renderer.ts

export class Renderer {
  private ctx: CanvasRenderingContext2D
  private width: number
  private height: number
  private canvas: any
  private imageCache: Record<string, any> = {}

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number, canvas?: any) {
    this.ctx = ctx
    this.width = width
    this.height = height
    this.canvas = canvas
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  drawPlate(cx: number, cy: number, radius: number): void {
    const ctx = this.ctx
    const entry = this.imageCache['plate_bg']

    ctx.save()

    if (entry && entry.ready && entry.image) {
      const r = radius * 1.05
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(entry.image, cx - r, cy - r, r * 2, r * 2)
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 10
      ctx.shadowOffsetX = 3
      ctx.shadowOffsetY = 3

      const gradient = ctx.createRadialGradient(
        cx - radius * 0.3, cy - radius * 0.3, 0,
        cx, cy, radius
      )
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
    }

    ctx.restore()
  }

  drawBead(x: number, y: number, radius: number, color: string, angle: number = 0, image?: string): void {
    const ctx = this.ctx
    const entry = image ? this.imageCache[image] : null

    try {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(angle)

      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2

      ctx.beginPath()
      ctx.arc(0, 0, radius, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()

      if (entry && entry.ready && entry.offscreen) {
        ctx.beginPath()
        ctx.arc(0, 0, radius, 0, Math.PI * 2)
        ctx.clip()
        ctx.shadowColor = 'transparent'
        ctx.drawImage(entry.offscreen, -radius, -radius, radius * 2, radius * 2)
      } else {
        ctx.beginPath()
        ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.3, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.fill()
      }

      ctx.restore()
    } catch (e) {
      try { ctx.restore() } catch (e2) {}
    }
  }

  drawBracelet(beads: any[], cx: number, cy: number, radius: number): void {
    const count = beads.length
    if (count === 0) return

    const beadRadius = beads[0].radius || 15
    const tightRadius = count > 1 ? beadRadius / Math.sin(Math.PI / count) : 0

    beads.forEach((bead, index) => {
      const angle = (index / count) * Math.PI * 2 - Math.PI / 2
      const x = cx + Math.cos(angle) * tightRadius
      const y = cy + Math.sin(angle) * tightRadius
      const rotation = angle + Math.PI / 2
      this.drawBead(x, y, beadRadius, bead.color, rotation, bead.image)
    })
  }

  drawBraceletWithAngles(
    beads: any[],
    cx: number,
    cy: number,
    angles: number[],
    draggedBeadPos: { index: number; x: number; y: number } | null,
    beadRadius: number
  ): void {
    const count = beads.length
    if (count === 0 || !angles || angles.length !== count) return

    if (beadRadius === undefined) beadRadius = (beads[0].radius || 5) * 3
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

      if (bead._placeholder) {
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
        this.drawBead(x, y, beadRadius, bead.color, rotation, bead.image)
      }
    })
  }
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit src/lib/Renderer.ts
```

Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/lib/Renderer.ts
git commit -m "feat: add Renderer class for Canvas 2D plate and bead drawing"
```

---

### Task 5: 创建 beadAdapter.ts

**Files:**
- Create: `src/utils/beadAdapter.ts`
- Modify: `src/types/bead.ts`

- [ ] **Step 1: 更新 bead.ts 类型定义**

在现有 `Bead` 接口中，`weight` 字段已存在（重量/克），`diameter` 是直径/毫米。物理引擎需要的是直径作为尺寸，所以用 `diameter` 字段。

```typescript
// src/types/bead.ts — 保持现有不变，添加 PlateBead 导出
export type BeadShape = 'circle' | 'square' | 'irregular'

export interface Bead {
  id: string
  originalId?: string
  name: string
  category: string
  imageUrl: string
  price: number
  weight: number
  diameter: number
  stock: number
  description?: string
  shape?: BeadShape
}

// 物理引擎使用的珠子数据
export interface PhysicsBead {
  id: string
  name: string
  color: string
  radius: number    // diameter / 2
  price: number
  image?: string
  category: string
}
```

- [ ] **Step 2: 创建 beadAdapter.ts**

```typescript
// src/utils/beadAdapter.ts
import { Bead, PhysicsBead } from '../types/bead'

// BEAD_SCALE: mm → canvas pixels (与参考项目一致)
const BEAD_SCALE = 3

/**
 * 将 API 珠子数据转换为物理引擎格式
 * diameter (mm) → radius (canvas pixels) = diameter / 2 * BEAD_SCALE
 */
export function adaptBead(bead: Bead): PhysicsBead {
  return {
    id: bead.id,
    name: bead.name,
    color: getBeadColor(bead),
    radius: (bead.diameter / 2) * BEAD_SCALE,
    price: bead.price,
    image: bead.imageUrl || undefined,
    category: bead.category,
  }
}

/**
 * 根据珠子信息生成颜色
 * 优先使用 imageUrl，否则用默认颜色映射
 */
function getBeadColor(bead: Bead): string {
  // 如果有图片，渲染器会用图片覆盖颜色
  if (bead.imageUrl) return '#CCCCCC'
  
  // 按分类给默认颜色
  const colorMap: Record<string, string> = {
    '单色水晶': '#E8E0F0',
    '天然石': '#8B7355',
    '配饰': '#C0C0C0',
    '随型': '#DEB887',
    '文玩': '#8B4513',
  }
  
  return colorMap[bead.category] || '#CCCCCC'
}

export { BEAD_SCALE }
```

- [ ] **Step 3: 验证 TypeScript 编译**

```bash
npx tsc --noEmit src/utils/beadAdapter.ts
```

Expected: 无错误

- [ ] **Step 4: 提交**

```bash
git add src/utils/beadAdapter.ts src/types/bead.ts
git commit -m "feat: add beadAdapter to convert API data to physics format"
```

---

### Task 6: 创建 usePlatePhysics hook

**Files:**
- Create: `src/hooks/usePlatePhysics.ts`

- [ ] **Step 1: 创建 usePlatePhysics.ts**

```typescript
// src/hooks/usePlatePhysics.ts
import { useRef, useEffect, useState, useCallback } from 'react'
import Taro from '@tarojs/taro'
import { GameState, GAME_STATE, SHOOT_DIRECTION, GameStateType, PlateBead } from '../lib/GameState'
import { PhysicsEngine } from '../lib/PhysicsEngine'
import { Renderer } from '../lib/Renderer'
import { BEAD_SCALE } from '../utils/beadAdapter'

const MIN_STRING_COUNT = 10

interface DragState {
  isDragging: boolean
  beadIndex: number
  slotIndex: number
  lastX: number
  lastY: number
  lastAngle: number
  currentX: number | undefined
  currentY: number | undefined
  mode: '' | 'plate' | 'bracelet' | 'rotate'
}

export function usePlatePhysics() {
  const canvasRef = useRef<any>(null)
  const physicsRef = useRef<PhysicsEngine | null>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const gameStateRef = useRef<GameState>(new GameState())
  const animationIdRef = useRef<number | null>(null)
  const longPressTimerRef = useRef<any>(null)
  const plateParamsRef = useRef({ cx: 0, cy: 0, radius: 0 })

  // 手串角度状态
  const braceletAnglesRef = useRef<number[]>([])
  const braceletRotationRef = useRef(0)

  // 动画状态
  const assembleAnimationRef = useRef<any>(null)
  const addBeadAnimationRef = useRef<any>(null)

  // 拖拽状态
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    beadIndex: -1,
    slotIndex: -1,
    lastX: 0,
    lastY: 0,
    lastAngle: 0,
    currentX: undefined,
    currentY: undefined,
    mode: ''
  })

  // React 状态（用于 UI 更新）
  const [state, setState] = useState<GameStateType>(GAME_STATE.IDLE)
  const [beadCount, setBeadCount] = useState(0)
  const [canString, setCanString] = useState(false)

  // 更新 UI 状态
  const updateUI = useCallback(() => {
    const gs = gameStateRef.current
    const isBracelet = gs.getState() === GAME_STATE.BRACELET
    const count = isBracelet ? gs.getBraceletBeads().length : gs.getPlateBeadCount()
    setState(gs.getState())
    setBeadCount(count)
    setCanString(gs.canStringBracelet())
  }, [])

  // 初始化 Canvas 和物理引擎
  const initCanvas = useCallback(() => {
    const query = Taro.createSelectorQuery()
    query.select('#plateCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          setTimeout(() => initCanvas(), 100)
          return
        }

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = Taro.getSystemInfoSync().pixelRatio

        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        ctx.scale(dpr, dpr)

        const cx = res[0].width / 2
        const cy = res[0].height / 2
        const radius = Math.min(res[0].width, res[0].height) * 0.35

        plateParamsRef.current = { cx, cy, radius }

        // 初始化物理引擎
        const Matter = require('../libs/matter.min.js')
        const physics = new PhysicsEngine()
        physics.init(Matter)
        physics.createPlate(cx, cy, radius)
        physicsRef.current = physics

        // 初始化渲染器
        const renderer = new Renderer(ctx, res[0].width, res[0].height, canvas)
        rendererRef.current = renderer
        canvasRef.current = canvas

        // 开始渲染循环
        startRenderLoop()
      })
  }, [])

  // 渲染循环
  const startRenderLoop = useCallback(() => {
    const loop = () => {
      update()
      render()
      animationIdRef.current = canvasRef.current?.requestAnimationFrame(loop) ?? null
    }
    animationIdRef.current = canvasRef.current?.requestAnimationFrame(loop) ?? null
  }, [])

  // 更新物理状态
  const update = useCallback(() => {
    const gs = gameStateRef.current
    const physics = physicsRef.current

    if (gs.getState() === GAME_STATE.SHOOTING && physics) {
      physics.update(16.67)
      if (physics.areBeadsSettled()) {
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

    const { cx, cy, radius } = plateParamsRef.current
    renderer.drawPlate(cx, cy, radius)

    // 绘制盘子上的珠子
    if (gs.getState() !== GAME_STATE.BRACELET) {
      const positions = physics.getBeadPositions()
      positions.forEach((pos, index) => {
        if (gs.plateBeads[index]) {
          renderer.drawBead(pos.x, pos.y, gs.plateBeads[index].radius, gs.plateBeads[index].color, pos.angle, gs.plateBeads[index].image)
        }
      })
    }

    // 手串模式绘制
    if (gs.getState() === GAME_STATE.BRACELET) {
      const braceletBeads = gs.getBraceletBeads()
      if (braceletBeads.length > 0) {
        // 聚合动画中
        if (assembleAnimationRef.current) {
          const animPositions = getAssembleBeadPositions()
          if (animPositions) {
            for (let i = 0; i < braceletBeads.length; i++) {
              const pos = animPositions[i]
              renderer.drawBead(pos.x, pos.y, assembleAnimationRef.current.beadRadius, braceletBeads[i].color, pos.rollAngle, braceletBeads[i].image)
            }
          }
          return
        }

        const dragState = dragStateRef.current
        let draggedBeadPos = null
        if (dragState.isDragging && dragState.mode === 'bracelet' && dragState.currentX !== undefined) {
          draggedBeadPos = { index: dragState.beadIndex, x: dragState.currentX, y: dragState.currentY }
        }

        const rotatedAngles = braceletAnglesRef.current.map(a => a + braceletRotationRef.current)
        const scaledBeadRadius = braceletBeads[0].radius || 15
        renderer.drawBraceletWithAngles(braceletBeads, cx, cy, rotatedAngles, draggedBeadPos, scaledBeadRadius)

        // 飞入中的珠子
        if (addBeadAnimationRef.current && addBeadAnimationRef.current.phase === 'shootBead') {
          const anim = addBeadAnimationRef.current
          const flyAngle = Math.atan2(anim.beadY - cy, anim.beadX - cx)
          renderer.drawBead(anim.beadX, anim.beadY, anim.bead.radius, anim.bead.color, flyAngle + Math.PI / 2, anim.bead.image)
        }
      }
    }
  }, [])

  // 聚合动画相关函数
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

  const updateAssembleAnimation = useCallback(() => {
    const anim = assembleAnimationRef.current
    if (!anim) return
    anim.progress += 0.007
    if (anim.progress >= 1) {
      assembleAnimationRef.current = null
    }
  }, [])

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

  // === 外部 API ===

  const addBead = useCallback((bead: PlateBead) => {
    const gs = gameStateRef.current
    const physics = physicsRef.current
    if (!physics) return

    // 手串模式下动画添加
    if (gs.getState() === GAME_STATE.BRACELET) {
      animateAddBeadToBracelet(bead)
      return
    }

    // 盘子模式射击
    if (gs.getState() === GAME_STATE.IDLE || gs.getState() === GAME_STATE.SETTLED || gs.getState() === GAME_STATE.SHOOTING) {
      const { cx, cy, radius } = plateParamsRef.current
      const direction = gs.shootDirection
      const baseAngle = direction === SHOOT_DIRECTION.LEFT
        ? Math.PI * (250 / 180)
        : Math.PI * (290 / 180)
      const angle = baseAngle + (Math.random() - 0.5) * (Math.PI * 4 / 180)
      const speed = 22

      physics.shootBead(cx, cy + radius - 20, angle, speed, bead.radius)
      gs.addBeadToPlate(bead)
      gs.setState(GAME_STATE.SHOOTING)
      updateUI()
    }
  }, [updateUI])

  const animateAddBeadToBracelet = useCallback((bead: PlateBead) => {
    // 动画进行中，立即跳到结束状态
    if (addBeadAnimationRef.current) {
      finishAddBeadAnimation()
    }

    const gs = gameStateRef.current
    const { cx, cy, radius } = plateParamsRef.current
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

    const beadRadius = count > 0 ? (braceletBeads[0].radius || 15) : 15

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

    const placeholder: PlateBead = { id: '_placeholder', name: '', color: 'transparent', radius: beadRadius, price: 0 }

    const newCount = count + 1
    const newSlotAngle = (Math.PI * 2) / newCount
    const refNewIndex = referenceIndex < placeholderIndex ? referenceIndex : referenceIndex + 1
    const rotationOffset = 3 * Math.PI / 2 - (refNewIndex * newSlotAngle - Math.PI / 2)

    const finalAngles: number[] = []
    for (let i = 0; i < newCount; i++) {
      finalAngles.push(i * newSlotAngle - Math.PI / 2 + rotationOffset)
    }

    const shootX = cx
    const shootY = cy + radius + 40
    const oldAngles = [...braceletAnglesRef.current]

    braceletBeads.splice(placeholderIndex, 0, placeholder)
    braceletAnglesRef.current.splice(placeholderIndex, 0, finalAngles[placeholderIndex])

    const tightRadius = beadRadius / Math.sin(Math.PI / newCount)
    const phAngle = finalAngles[placeholderIndex]
    const targetX = cx + Math.cos(phAngle) * tightRadius
    const targetY = cy + Math.sin(phAngle) * tightRadius

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

  const recalcBraceletAngles = useCallback(() => {
    const gs = gameStateRef.current
    const count = gs.getBraceletBeads().length
    braceletAnglesRef.current = []
    for (let i = 0; i < count; i++) {
      braceletAnglesRef.current.push((i / count) * Math.PI * 2 - Math.PI / 2)
    }
    braceletRotationRef.current = 0
  }, [])

  const stringBracelet = useCallback(() => {
    if (assembleAnimationRef.current) return
    const gs = gameStateRef.current
    const physics = physicsRef.current
    if (!physics || !gs.canStringBracelet()) return

    const { cx, cy } = plateParamsRef.current
    const startPositions = physics.getBeadPositions().map(p => ({ x: p.x, y: p.y }))

    physics.clearBeads()
    gs.stringBracelet()

    const beads = gs.getBraceletBeads()
    const count = beads.length
    const beadRadius = beads[0].radius || 15
    const tightRadius = count > 1 ? beadRadius / Math.sin(Math.PI / count) : 0

    const targetAngles: number[] = []
    const targetPositions: Array<{ x: number; y: number }> = []
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2
      targetAngles.push(angle)
      targetPositions.push({
        x: cx + Math.cos(angle) * tightRadius,
        y: cy + Math.sin(angle) * tightRadius
      })
    }

    braceletAnglesRef.current = targetAngles.slice()
    braceletRotationRef.current = 0

    const beadData = []
    for (let i = 0; i < count; i++) {
      const dx = targetPositions[i].x - startPositions[i].x
      const dy = targetPositions[i].y - startPositions[i].y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const startRollAngle = Math.atan2(startPositions[i].y - cy, startPositions[i].x - cx) + Math.PI / 2
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

  const disbandBracelet = useCallback(() => {
    if (assembleAnimationRef.current) return
    const gs = gameStateRef.current
    const physics = physicsRef.current
    if (!physics) return

    const { cx, cy } = plateParamsRef.current
    const braceletBeads = gs.getBraceletBeads()

    gs.plateBeads = [...braceletBeads]
    gs.braceletBeads = []
    gs.setState(GAME_STATE.SHOOTING)

    physics.clearBeads()
    const beadRadius = gs.plateBeads[0]?.radius || 15
    const count = gs.plateBeads.length
    const scatterSpeed = 8
    const startRadius = beadRadius * 2

    for (let i = 0; i < count; i++) {
      const baseAngle = (i / count) * Math.PI * 2
      const jitter = (Math.random() - 0.5) * (Math.PI * 2 / count) * 0.5
      const angle = baseAngle + jitter
      const x = cx + Math.cos(angle) * startRadius
      const y = cy + Math.sin(angle) * startRadius
      physics.shootBead(x, y, angle, scatterSpeed, beadRadius)
    }

    braceletAnglesRef.current = []
    updateUI()
  }, [updateUI])

  const clearPlate = useCallback(() => {
    const gs = gameStateRef.current
    const physics = physicsRef.current
    if (physics) physics.clearBeads()
    gs.reset()
    braceletAnglesRef.current = []
    braceletRotationRef.current = 0
    assembleAnimationRef.current = null
    addBeadAnimationRef.current = null
    updateUI()
  }, [updateUI])

  // 触摸事件处理
  const handleTouchStart = useCallback((e: any) => {
    if (assembleAnimationRef.current) return
    const gs = gameStateRef.current
    const touch = e.touches[0]
    if (!touch) return

    const x = touch.x
    const y = touch.y

    if (gs.getState() === GAME_STATE.BRACELET) {
      handleBraceletTouchStart(x, y)
    } else if (gs.getState() === GAME_STATE.SETTLED) {
      handlePlateTouchStart(x, y)
    }
  }, [])

  const handleTouchMove = useCallback((e: any) => {
    const touch = e.touches[0]
    if (!touch) return
    const x = touch.x
    const y = touch.y

    const dragState = dragStateRef.current
    if (dragState.isDragging) {
      if (dragState.mode === 'bracelet') {
        handleBraceletTouchMove(x, y)
      } else if (dragState.mode === 'plate') {
        handlePlateTouchMove(x, y)
      } else if (dragState.mode === 'rotate') {
        handleBraceletRotateMove(x, y)
      }
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    const gs = gameStateRef.current
    const { cx, cy, radius } = plateParamsRef.current
    const dragState = dragStateRef.current

    // 手串模式拖出盘子删除
    if (dragState.mode === 'bracelet' && dragState.currentX !== undefined) {
      const distFromCenter = Math.sqrt(
        (dragState.currentX - cx) ** 2 + (dragState.currentY - cy) ** 2
      )

      if (distFromCenter > radius * 1.1) {
        const deleteIndex = dragState.beadIndex
        gs.removeBeadFromBracelet(deleteIndex)

        if (braceletAnglesRef.current) {
          braceletAnglesRef.current.splice(deleteIndex, 1)
        }

        if (gs.getBraceletBeads().length < MIN_STRING_COUNT) {
          disbandBracelet()
        } else {
          recalcBraceletAngles()
        }

        updateUI()
      }
    }

    // 拖拽后吸附到标准槽位
    if (braceletAnglesRef.current && dragState.mode === 'bracelet' && dragState.currentX !== undefined) {
      const count = braceletAnglesRef.current.length
      const slotAngle = (Math.PI * 2) / count
      for (let i = 0; i < count; i++) {
        braceletAnglesRef.current[i] = (i * slotAngle) - Math.PI / 2
      }
    }

    // 旋转结束烘焙
    if (dragState.mode === 'rotate' && braceletRotationRef.current !== 0) {
      if (braceletAnglesRef.current) {
        for (let i = 0; i < braceletAnglesRef.current.length; i++) {
          braceletAnglesRef.current[i] += braceletRotationRef.current
        }
      }
      braceletRotationRef.current = 0
    }

    dragState.isDragging = false
    dragState.beadIndex = -1
    dragState.slotIndex = -1
    dragState.currentX = undefined
    dragState.currentY = undefined
    dragState.mode = ''

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [disbandBracelet, recalcBraceletAngles, updateUI])

  // 盘子模式触摸
  const handlePlateTouchStart = useCallback((x: number, y: number) => {
    const gs = gameStateRef.current
    const physics = physicsRef.current
    if (!physics) return

    const positions = physics.getBeadPositions()

    for (let i = positions.length - 1; i >= 0; i--) {
      const pos = positions[i]
      if (!gs.plateBeads[i]) continue

      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2)
      if (distance < gs.plateBeads[i].radius) {
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

  const handlePlateTouchMove = useCallback((x: number, y: number) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    const { cx, cy, radius } = plateParamsRef.current
    const distFromCenter = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    if (distFromCenter > radius * 1.1) {
      const gs = gameStateRef.current
      const physics = physicsRef.current
      if (!physics) return

      const deleteIndex = dragStateRef.current.beadIndex
      const body = physics.beadBodies[deleteIndex]
      if (body) {
        physics.Matter.World.remove(physics.world, body)
        physics.beadBodies.splice(deleteIndex, 1)
      }
      gs.plateBeads.splice(deleteIndex, 1)

      if (gs.plateBeads.length === 0) {
        gs.setState(GAME_STATE.IDLE)
      }

      dragStateRef.current.isDragging = false
      dragStateRef.current.beadIndex = -1
      dragStateRef.current.mode = ''
      updateUI()
      return
    }

    const physics = physicsRef.current
    if (!physics) return
    const body = physics.beadBodies[dragStateRef.current.beadIndex]
    if (body) {
      physics.Matter.Body.setPosition(body, { x, y })
      physics.Matter.Body.setVelocity(body, { x: 0, y: 0 })
    }

    dragStateRef.current.lastX = x
    dragStateRef.current.lastY = y
  }, [updateUI])

  // 手串模式触摸
  const handleBraceletTouchStart = useCallback((x: number, y: number) => {
    const gs = gameStateRef.current
    const { cx, cy } = plateParamsRef.current
    const braceletBeads = gs.getBraceletBeads()
    const count = braceletBeads.length
    if (count === 0) return

    const beadRadius = braceletBeads[0].radius || 15
    const tightRadius = count > 1 ? beadRadius / Math.sin(Math.PI / count) : 0

    if (!braceletAnglesRef.current || braceletAnglesRef.current.length !== count) {
      recalcBraceletAngles()
    }

    for (let index = 0; index < count; index++) {
      const beadX = cx + Math.cos(braceletAnglesRef.current[index]) * tightRadius
      const beadY = cy + Math.sin(braceletAnglesRef.current[index]) * tightRadius
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
    dragStateRef.current.lastAngle = Math.atan2(y - cy, x - cx)
  }, [recalcBraceletAngles])

  const handleBraceletTouchMove = useCallback((x: number, y: number) => {
    const gs = gameStateRef.current
    const { cx, cy } = plateParamsRef.current
    const braceletBeads = gs.getBraceletBeads()
    const count = braceletBeads.length
    if (count <= 1) return

    dragStateRef.current.currentX = x
    dragStateRef.current.currentY = y

    const currentAngle = Math.atan2(y - cy, x - cx)
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

  const handleBraceletRotateMove = useCallback((x: number, y: number) => {
    const { cx, cy } = plateParamsRef.current
    const currentAngle = Math.atan2(y - cy, x - cx)
    let delta = currentAngle - dragStateRef.current.lastAngle

    if (delta > Math.PI) delta -= Math.PI * 2
    if (delta < -Math.PI) delta += Math.PI * 2

    braceletRotationRef.current += delta
    braceletRotationRef.current = ((braceletRotationRef.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    dragStateRef.current.lastAngle = currentAngle
  }, [])

  const showDeleteConfirm = useCallback((index: number) => {
    const gs = gameStateRef.current
    const isBracelet = gs.getState() === GAME_STATE.BRACELET
    const content = isBracelet ? '确定要从手串中删除这颗珠子吗？' : '确定要删除这颗珠子吗？'

    Taro.showModal({
      title: '删除珠子',
      content,
      success: (res) => {
        if (res.confirm) {
          if (isBracelet) {
            gs.removeBeadFromBracelet(index)
            if (braceletAnglesRef.current) {
              braceletAnglesRef.current.splice(index, 1)
            }
          } else {
            const physics = physicsRef.current
            if (physics) {
              physics.beadBodies.splice(index, 1)
            }
            gs.plateBeads.splice(index, 1)
          }
          updateUI()
        }
      }
    })
  }, [updateUI])

  // 生命周期
  useEffect(() => {
    initCanvas()

    return () => {
      if (animationIdRef.current && canvasRef.current) {
        canvasRef.current.cancelAnimationFrame(animationIdRef.current)
      }
      if (physicsRef.current) {
        physicsRef.current.destroy()
      }
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [initCanvas])

  return {
    // 状态
    state,
    beadCount,
    canString,
    isBracelet: state === GAME_STATE.BRACELET,

    // Refs（供 PlateCanvas 绑定事件）
    canvasRef,

    // 操作
    addBead,
    stringBracelet,
    disbandBracelet,
    clearPlate,

    // 触摸事件
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,

    // 内部数据（供 DiyPage 读取用于保存/加购）
    getGameState: () => gameStateRef.current,
  }
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit src/hooks/usePlatePhysics.ts
```

Expected: 可能有类型警告但无阻塞错误

- [ ] **Step 3: 提交**

```bash
git add src/hooks/usePlatePhysics.ts
git commit -m "feat: add usePlatePhysics hook for physics engine integration"
```

---

### Task 7: 创建 PlateCanvas 组件

**Files:**
- Create: `src/components/PlateCanvas/index.tsx`
- Create: `src/components/PlateCanvas/index.scss`

- [ ] **Step 1: 创建 PlateCanvas/index.tsx**

```tsx
// src/components/PlateCanvas/index.tsx
import { View, Canvas, Button } from '@tarojs/components'
import type { GameStateType } from '../../lib/GameState'
import { GAME_STATE } from '../../lib/GameState'
import './index.scss'

interface PlateCanvasProps {
  canvasRef: any
  state: GameStateType
  canString: boolean
  onWristSizeClick: () => void
  onToolboxClick: () => void
  onSave: () => void
  onPurchase: () => void
  onStringBracelet: () => void
  onDisband: () => void
  onTouchStart: (e: any) => void
  onTouchMove: (e: any) => void
  onTouchEnd: () => void
  disabled?: boolean
}

export default function PlateCanvas({
  canvasRef,
  state,
  canString,
  onWristSizeClick,
  onToolboxClick,
  onSave,
  onPurchase,
  onStringBracelet,
  onDisband,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  disabled,
}: PlateCanvasProps) {
  return (
    <View className="plate-canvas">
      <Canvas
        type="2d"
        id="plateCanvas"
        canvasId="plateCanvas"
        className="plate-canvas__canvas"
        ref={canvasRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />

      {/* 左下角 - 手围设置 + 工具箱 */}
      <View className="plate-canvas__bottom-left">
        <Button className="plate-canvas__btn" onClick={onWristSizeClick}>手围设置</Button>
        <Button className="plate-canvas__btn" onClick={onToolboxClick}>工具箱</Button>
      </View>

      {/* 右上角 - 保存 + 购买 */}
      <View className="plate-canvas__top-right">
        <Button className="plate-canvas__btn" onClick={onSave} disabled={disabled}>保存</Button>
        <Button className="plate-canvas__btn plate-canvas__btn--primary" onClick={onPurchase} disabled={disabled}>购买</Button>
      </View>

      {/* 右下角 - 串手串/打散 */}
      <View className="plate-canvas__bottom-right">
        {canString && state !== GAME_STATE.BRACELET && (
          <Button className="plate-canvas__btn plate-canvas__btn--string" onClick={onStringBracelet}>串手串</Button>
        )}
        {state === GAME_STATE.BRACELET && (
          <Button className="plate-canvas__btn plate-canvas__btn--disband" onClick={onDisband}>打散</Button>
        )}
      </View>
    </View>
  )
}
```

- [ ] **Step 2: 创建 PlateCanvas/index.scss**

```scss
// src/components/PlateCanvas/index.scss
.plate-canvas {
  position: relative;
  width: 100%;
  height: 100%;

  &__canvas {
    width: 100%;
    height: 100%;
  }

  &__bottom-left,
  &__top-right,
  &__bottom-right {
    position: absolute;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 10;
  }

  &__bottom-left {
    left: 12px;
    bottom: 12px;
  }

  &__top-right {
    right: 12px;
    top: 12px;
  }

  &__bottom-right {
    right: 12px;
    bottom: 12px;
  }

  &__btn {
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

    &--string {
      background: #A0522D;
      color: #fff;
      border-color: #A0522D;
    }

    &--disband {
      background: #8B4513;
      color: #fff;
      border-color: #8B4513;
    }

    &[disabled] {
      opacity: 0.5;
    }
  }
}
```

- [ ] **Step 3: 验证无语法错误**

```bash
npx tsc --noEmit src/components/PlateCanvas/index.tsx
```

- [ ] **Step 4: 提交**

```bash
git add src/components/PlateCanvas/
git commit -m "feat: add PlateCanvas component with floating action buttons"
```

---

### Task 8: 重写 BeadSelector 组件

**Files:**
- Modify: `src/components/BeadSelector/index.tsx`
- Modify: `src/components/BeadSelector/index.scss`

- [ ] **Step 1: 重写 BeadSelector/index.tsx**

```tsx
// src/components/BeadSelector/index.tsx
import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useMemo, useCallback, useEffect } from 'react'
import Taro from '@tarojs/taro'
import type { Bead, PhysicsBead } from '../../types/bead'
import { beadService } from '../../services/beadService'
import { adaptBead } from '../../utils/beadAdapter'
import './index.scss'

interface BeadSelectorProps {
  onBeadTap: (bead: PhysicsBead) => void
}

// 一级分类配置
const CATEGORIES = [
  { id: '单色水晶', name: '珠子' },
  { id: '天然石', name: '天然石' },
  { id: '配饰', name: '配饰' },
  { id: '随型', name: '随型' },
  { id: '文玩', name: '文玩' },
]

export default function BeadSelector({ onBeadTap }: BeadSelectorProps) {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id)
  const [activeSubType, setActiveSubType] = useState('')
  const [allBeads, setAllBeads] = useState<Bead[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // 加载珠子数据
  const loadBeads = useCallback(async (category: string, pageNum: number = 1, append: boolean = false) => {
    if (loading) return
    setLoading(true)
    try {
      const result = await beadService.getBeads(category, undefined, pageNum, 50)
      if (append) {
        setAllBeads(prev => [...prev, ...result.beads])
      } else {
        setAllBeads(result.beads)
      }
      setHasMore(result.beads.length === 50)
      setPage(pageNum)
    } catch (error) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [loading])

  // 切换一级分类
  const handleCategoryTap = useCallback((categoryId: string) => {
    setActiveCategory(categoryId)
    setActiveSubType('')
    loadBeads(categoryId)
  }, [loadBeads])

  // 切换二级分类
  const handleSubTypeTap = useCallback((subType: string) => {
    setActiveSubType(subType)
  }, [])

  // 点击珠子
  const handleBeadCardTap = useCallback((bead: Bead) => {
    const physicsBead = adaptBead(bead)
    onBeadTap(physicsBead)
  }, [onBeadTap])

  // 触底加载更多
  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadBeads(activeCategory, page + 1, true)
    }
  }, [hasMore, loading, activeCategory, page, loadBeads])

  // 初始加载
  useEffect(() => {
    loadBeads(activeCategory)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 二级分类列表（从珠子数据中提取去重的 category）
  const subTypes = useMemo(() => {
    const categories = new Set(allBeads.map(b => b.category))
    return Array.from(categories).map(c => ({ id: c, name: c }))
  }, [allBeads])

  // 当前显示的珠子（按二级分类筛选）
  const displayBeads = useMemo(() => {
    if (!activeSubType) return allBeads
    return allBeads.filter(b => b.category === activeSubType)
  }, [allBeads, activeSubType])

  // 暴露 loadMore 给父组件
  useEffect(() => {
    // 注册触底事件
    const handleReachBottom = () => {
      handleLoadMore()
    }
    // Taro 的 useReachBottom 在 DiyPage 中处理
  }, [handleLoadMore])

  return (
    <View className="bead-selector">
      {/* 顶部 - 横向一级分类标签 */}
      <ScrollView className="bead-selector__categories" scrollX>
        {CATEGORIES.map(cat => (
          <View
            key={cat.id}
            className={`bead-selector__tab ${activeCategory === cat.id ? 'bead-selector__tab--active' : ''}`}
            onClick={() => handleCategoryTap(cat.id)}
          >
            {cat.name}
          </View>
        ))}
      </ScrollView>

      {/* 下方 - 左二级分类 + 右珠子网格 */}
      <View className="bead-selector__body">
        {/* 左侧二级分类列表 */}
        <ScrollView className="bead-selector__subtypes" scrollY>
          {subTypes.map(sub => (
            <View
              key={sub.id}
              className={`bead-selector__subtype ${activeSubType === sub.id ? 'bead-selector__subtype--active' : ''}`}
              onClick={() => handleSubTypeTap(sub.id)}
            >
              {sub.name}
            </View>
          ))}
        </ScrollView>

        {/* 右侧珠子网格（3列） */}
        <ScrollView className="bead-selector__beads" scrollY onScrollToLower={handleLoadMore}>
          {loading && displayBeads.length === 0 ? (
            <View className="bead-selector__loading">加载中...</View>
          ) : displayBeads.length === 0 ? (
            <View className="bead-selector__empty">暂无珠子</View>
          ) : (
            <View className="bead-selector__grid">
              {displayBeads.map(bead => (
                <View
                  key={bead.id}
                  className="bead-card"
                  onClick={() => handleBeadCardTap(bead)}
                >
                  <View
                    className="bead-card__preview"
                    style={{ backgroundColor: bead.imageUrl ? undefined : '#CCCCCC' }}
                  >
                    {bead.imageUrl ? (
                      <Image className="bead-card__image" src={bead.imageUrl} mode="aspectFill" />
                    ) : null}
                  </View>
                  <Text className="bead-card__name">{bead.name}</Text>
                  <Text className="bead-card__size">{bead.diameter}mm</Text>
                </View>
              ))}
            </View>
          )}
          {loading && displayBeads.length > 0 && (
            <View className="bead-selector__loading-more">加载更多...</View>
          )}
        </ScrollView>
      </View>
    </View>
  )
}
```

- [ ] **Step 2: 重写 BeadSelector/index.scss**

```scss
// src/components/BeadSelector/index.scss
.bead-selector {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #FAEBD7;

  &__categories {
    white-space: nowrap;
    padding: 8px 12px;
    background: #FFF8DC;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  &__tab {
    display: inline-block;
    padding: 6px 16px;
    margin-right: 8px;
    border-radius: 16px;
    font-size: 13px;
    color: #666;
    background: rgba(255, 255, 255, 0.6);

    &--active {
      background: #8B4513;
      color: #fff;
    }
  }

  &__body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  &__subtypes {
    width: 65px;
    flex-shrink: 0;
    background: #F0E6D3;
  }

  &__subtype {
    padding: 12px 8px;
    font-size: 12px;
    color: #666;
    text-align: center;
    border-left: 3px solid transparent;

    &--active {
      color: #8B4513;
      font-weight: 600;
      border-left-color: #8B4513;
      background: #FAEBD7;
    }
  }

  &__beads {
    flex: 1;
    padding: 8px;
  }

  &__grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__loading,
  &__empty,
  &__loading-more {
    padding: 24px;
    text-align: center;
    font-size: 13px;
    color: #999;
  }
}

.bead-card {
  flex: 0 0 calc(33.33% - 4px);
  padding: 8px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;

  &__preview {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-bottom: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 8px rgba(255, 255, 255, 0.6);
    overflow: hidden;
  }

  &__image {
    width: 100%;
    height: 100%;
  }

  &__name {
    font-size: 11px;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }

  &__size {
    font-size: 10px;
    color: #999;
  }
}
```

- [ ] **Step 3: 提交**

```bash
git add src/components/BeadSelector/
git commit -m "feat: rewrite BeadSelector with two-level category layout"
```

---

### Task 9: 重写 DiyPage

**Files:**
- Modify: `src/pages/diy/index.tsx`
- Modify: `src/pages/diy/index.scss`

- [ ] **Step 1: 重写 DiyPage/index.tsx**

```tsx
// src/pages/diy/index.tsx
import { View } from '@tarojs/components'
import { useState, useCallback } from 'react'
import Taro, { useRouter, useShareAppMessage, useShareTimeline, useReachBottom } from '@tarojs/taro'
import { useDiyStore } from '../../stores/useDiyStore'
import { useCartStore } from '../../stores/useCartStore'
import { useDesignStore } from '../../stores/useDesignStore'
import { usePlatePhysics } from '../../hooks/usePlatePhysics'
import PlateCanvas from '../../components/PlateCanvas'
import BeadSelector from '../../components/BeadSelector'
import NameInputModal from '../../components/NameInputModal'
import WristSizeModal from '../../components/WristSizeModal'
import { validateBracelet } from '../../utils/validator'
import { checkLoginAndPrompt } from '../../utils/authGuard'
import type { PhysicsBead } from '../../types/bead'
import './index.scss'

export default function DiyPage() {
  const router = useRouter()
  const shareImageUrl = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/crystallogo/%E9%81%A3%E5%B1%B1%E6%B0%B4%E6%99%B6logo.png'

  const {
    properties,
    wristSize,
    wearingStyle,
    setWristSize,
    setWearingStyle,
  } = useDiyStore()

  const { addToCart, items } = useCartStore()
  const { saveDesign } = useDesignStore()

  const {
    state,
    beadCount,
    canString,
    canvasRef,
    addBead,
    stringBracelet,
    disbandBracelet,
    clearPlate,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    getGameState,
  } = usePlatePhysics()

  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isSavingDesign, setIsSavingDesign] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [showWristModal, setShowWristModal] = useState(false)

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
    })
  })

  // 珠子点击
  const handleBeadTap = useCallback((bead: PhysicsBead) => {
    addBead(bead)
  }, [addBead])

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

    const gs = getGameState()
    const beads = gs.getState() === 'bracelet' ? gs.getBraceletBeads() : gs.plateBeads
    if (beads.length === 0) {
      Taro.showToast({ title: '请至少添加一个珠子', icon: 'none' })
      return
    }

    if (isSavingDesign) return
    setShowNameModal(true)
  }, [getGameState, isSavingDesign])

  const handleConfirmSave = useCallback(async (designName: string) => {
    setShowNameModal(false)
    setIsSavingDesign(true)

    try {
      Taro.showLoading({ title: '保存中...', mask: true })

      const gs = getGameState()
      const beads = gs.getState() === 'bracelet' ? gs.getBraceletBeads() : gs.plateBeads

      // 构造 bracelet 数据用于保存
      const braceletData = {
        beads: beads.map(b => ({
          id: b.id,
          name: b.name,
          category: b.category || '',
          imageUrl: b.image || '',
          price: b.price,
          weight: 0,
          diameter: b.radius * 2 / 3, // 还原 mm
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
  }, [getGameState, saveDesign])

  // 加入购物车
  const handleAddToCart = useCallback(async () => {
    const isLoggedIn = await checkLoginAndPrompt('加入购物车')
    if (!isLoggedIn) return

    const gs = getGameState()
    const beads = gs.getState() === 'bracelet' ? gs.getBraceletBeads() : gs.plateBeads
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
          price: b.price,
          weight: 0,
          diameter: b.radius * 2 / 3,
          stock: 999,
        })),
        name: braceletName,
        updatedAt: Date.now(),
      }

      const propertiesData = {
        beadCount: beads.length,
        totalPrice: beads.reduce((sum, b) => sum + b.price, 0),
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
  }, [getGameState, addToCart, isAddingToCart])

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
      {/* 盘子画布区域 - 上方 60% */}
      <View className="diy-page__canvas">
        <PlateCanvas
          canvasRef={canvasRef}
          state={state}
          canString={canString}
          onWristSizeClick={() => setShowWristModal(true)}
          onToolboxClick={() => {}} // TODO: 工具箱功能
          onSave={handleSaveDesign}
          onPurchase={handleAddToCart}
          onStringBracelet={stringBracelet}
          onDisband={disbandBracelet}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          disabled={beadCount === 0}
        />
      </View>

      {/* 珠子选择器 - 下方 40% */}
      <View className="diy-page__selector">
        <BeadSelector onBeadTap={handleBeadTap} />
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

- [ ] **Step 2: 重写 DiyPage/index.scss**

```scss
// src/pages/diy/index.scss
.diy-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: #FAFAFA;

  &__canvas {
    flex: 6;
    min-height: 0;
    background: linear-gradient(180deg, #DEB887, #D2B48C);
  }

  &__selector {
    flex: 4;
    min-height: 0;
    overflow: hidden;
  }
}
```

- [ ] **Step 3: 提交**

```bash
git add src/pages/diy/
git commit -m "feat: rewrite DiyPage with physics-based plate canvas layout"
```

---

### Task 10: 更新 useDiyStore 适配新架构

**Files:**
- Modify: `src/stores/useDiyStore.ts`

- [ ] **Step 1: 更新 useDiyStore**

保留现有 store 结构不变，但 `bracelet.beads` 和相关操作（addBead/removeBead/moveBead）将不再直接由 DiyPage 调用。物理引擎管理珠子列表，Zustand 只在保存/加购时同步数据。

主要变化：
- `canAddBead` 的 `MAX_BEADS` 限制移除（改为物理引擎的≥10规则）
- `bracelet.beads` 保留用于保存/加购时的数据快照

```typescript
// src/stores/useDiyStore.ts — 修改 canAddBead
// 移除 MAX_BEADS 限制，只保留手围限制
canAddBead: (bead?: Bead) => {
  const state = get()
  if (state.wristSize === null) return true

  const currentSize = state.wristSize
  const increment = 1.6 + (currentSize - 14) * 0.1
  const baseCircumference = currentSize + increment
  const maxCircumference = state.wearingStyle === 'double' ? baseCircumference * 2 : baseCircumference

  const currentTotalLength = state.properties.totalLength
  const beadLength = bead ? bead.diameter / 10 : 0

  return (currentTotalLength + beadLength) <= maxCircumference
},
```

- [ ] **Step 2: 提交**

```bash
git add src/stores/useDiyStore.ts
git commit -m "refactor: remove MAX_BEADS limit from useDiyStore for physics-based design"
```

---

### Task 11: 删除 DesignCanvas 组件

**Files:**
- Delete: `src/components/DesignCanvas/`

- [ ] **Step 1: 删除 DesignCanvas**

```bash
rm -rf src/components/DesignCanvas/
```

- [ ] **Step 2: 确认无其他文件引用 DesignCanvas**

```bash
grep -r "DesignCanvas" src/ --include="*.tsx" --include="*.ts"
```

Expected: 无结果（DiyPage 已重写，不再引用 DesignCanvas）

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "chore: remove DesignCanvas component (replaced by PlateCanvas)"
```

---

### Task 12: 最终验证

- [ ] **Step 1: TypeScript 编译检查**

```bash
npx tsc --noEmit
```

Expected: 无阻塞错误

- [ ] **Step 2: 开发服务器启动**

```bash
npm run dev:h5
```

Expected: 编译成功，页面可访问

- [ ] **Step 3: 功能验证清单**

在浏览器中验证：
1. 页面布局：上方盘子区域 60%，下方珠子选择区 40%
2. 浮动按钮位置：左下角（手围设置、工具箱）、右上角（保存、购买）
3. 珠子选择器：一级分类标签横向滚动，左侧二级分类，右侧3列珠子网格
4. 点击珠子 → 射入盘子（物理动画）
5. 盘子模式：拖拽珠子、长按删除
6. ≥10颗 → 串手串按钮出现 → 点击组装动画
7. 手串模式：旋转、拖拽交换
8. 打散按钮 → 回到盘子模式

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "feat: complete DIY page redesign with physics-based canvas interaction"
```
