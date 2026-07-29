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
  const [currentCategory, setCurrentCategory] = useState(categories[0] && categories[0].id || '')
  const [subTypes, setSubTypes] = useState<SubType[]>(() => getSubTypes(categories[0] && categories[0].id || ''))
  const [currentSubType, setCurrentSubType] = useState(subTypes[0] && subTypes[0].id || '')
  const [currentBeads, setCurrentBeads] = useState<any[]>(() => getBeadsBySubType(categories[0] && categories[0].id || '', subTypes[0] && subTypes[0].id || ''))
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
        canvasRef.current && canvasRef.current.cancelAnimationFrame(animationIdRef.current)
      }
      physicsRef.current && physicsRef.current.destroy()
    }
  }, [])

  // 更新物理状态
  const update = useCallback(() => {
    const gs = gameStateRef.current

    if (gs.getState() === GAME_STATE.SHOOTING) {
      physicsRef.current && physicsRef.current.update(16.67)
      if (physicsRef.current && physicsRef.current.areBeadsSettled()) {
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
      physicsRef.current && physicsRef.current.shootBead(
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
    const beadRadius = (gs.plateBeads[0] && gs.plateBeads[0].radius || 5) * BEAD_SCALE
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
                      onClick={(e) => { e.stopPropagation(); handleSizeDown(bead.id) }}
                    >
                      -
                    </Button>
                    <Button
                      className="bead-card__action bead-card__action--right"
                      onClick={(e) => { e.stopPropagation(); handleSizeUp(bead.id) }}
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
