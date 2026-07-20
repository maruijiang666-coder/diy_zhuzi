// src/hooks/usePlatePhysics.ts
import { useRef, useEffect, useState, useCallback } from 'react'
import Taro from '@tarojs/taro'
import { GameState, GAME_STATE, SHOOT_DIRECTION, GameStateType, PlateBead } from '../lib/GameState'
import { PhysicsEngine } from '../lib/PhysicsEngine'
import { Renderer } from '../lib/Renderer'


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

  const braceletAnglesRef = useRef<number[]>([])
  const braceletRotationRef = useRef(0)
  const assembleAnimationRef = useRef<any>(null)
  const addBeadAnimationRef = useRef<any>(null)

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

  const [state, setState] = useState<GameStateType>(GAME_STATE.IDLE)
  const [beadCount, setBeadCount] = useState(0)
  const [canString, setCanString] = useState(false)

  const updateUI = useCallback(() => {
    const gs = gameStateRef.current
    const isBracelet = gs.getState() === GAME_STATE.BRACELET
    const count = isBracelet ? gs.getBraceletBeads().length : gs.getPlateBeadCount()
    setState(gs.getState())
    setBeadCount(count)
    setCanString(gs.canStringBracelet())
  }, [])

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

        const Matter = require('../libs/matter.min.js')
        const physics = new PhysicsEngine()
        physics.init(Matter)
        physics.createPlate(cx, cy, radius)
        physicsRef.current = physics

        const renderer = new Renderer(ctx, res[0].width, res[0].height, canvas)
        rendererRef.current = renderer
        canvasRef.current = canvas

        startRenderLoop()
      })
  }, [])

  const startRenderLoop = useCallback(() => {
    const loop = () => {
      update()
      render()
      animationIdRef.current = canvasRef.current ? canvasRef.current.requestAnimationFrame(loop) : null
    }
    animationIdRef.current = canvasRef.current ? canvasRef.current.requestAnimationFrame(loop) : null
  }, [])

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

    if (addBeadAnimationRef.current) updateAddBeadAnimation()
    if (assembleAnimationRef.current) updateAssembleAnimation()
  }, [updateUI])

  const render = useCallback(() => {
    const renderer = rendererRef.current
    const physics = physicsRef.current
    const gs = gameStateRef.current
    if (!renderer || !physics) return

    renderer.clear()
    const { cx, cy, radius } = plateParamsRef.current
    renderer.drawPlate(cx, cy, radius)

    if (gs.getState() !== GAME_STATE.BRACELET) {
      const positions = physics.getBeadPositions()
      positions.forEach((pos, index) => {
        if (gs.plateBeads[index]) {
          renderer.drawBead(pos.x, pos.y, gs.plateBeads[index].radius, gs.plateBeads[index].color, pos.angle, gs.plateBeads[index].image)
        }
      })
    }

    if (gs.getState() === GAME_STATE.BRACELET) {
      const braceletBeads = gs.getBraceletBeads()
      if (braceletBeads.length > 0) {
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
        if (dragState.isDragging && dragState.mode === 'bracelet' && dragState.currentX !== undefined && dragState.currentY !== undefined) {
          draggedBeadPos = { index: dragState.beadIndex, x: dragState.currentX, y: dragState.currentY }
        }

        const rotatedAngles = braceletAnglesRef.current.map(a => a + braceletRotationRef.current)
        const scaledBeadRadius = braceletBeads[0].radius || 15
        renderer.drawBraceletWithAngles(braceletBeads, cx, cy, rotatedAngles, draggedBeadPos, scaledBeadRadius)

        if (addBeadAnimationRef.current && addBeadAnimationRef.current.phase === 'shootBead') {
          const anim = addBeadAnimationRef.current
          const flyAngle = Math.atan2(anim.beadY - cy, anim.beadX - cx)
          renderer.drawBead(anim.beadX, anim.beadY, anim.bead.radius, anim.bead.color, flyAngle + Math.PI / 2, anim.bead.image)
        }
      }
    }
  }, [])

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
      if (localT <= 0) { positions.push({ x: sx, y: sy, rollAngle: data.startRollAngle }); continue }
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
    if (anim.progress >= 1) assembleAnimationRef.current = null
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
        if (i === phIdx) { braceletAnglesRef.current[i] = anim.finalAngles[i]; continue }
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

  const addBead = useCallback((bead: PlateBead) => {
    const gs = gameStateRef.current
    const physics = physicsRef.current
    if (!physics) return

    if (gs.getState() === GAME_STATE.BRACELET) {
      animateAddBeadToBracelet(bead)
      return
    }

    if (gs.getState() === GAME_STATE.IDLE || gs.getState() === GAME_STATE.SETTLED || gs.getState() === GAME_STATE.SHOOTING) {
      const { cx, cy, radius } = plateParamsRef.current
      const direction = gs.shootDirection
      const baseAngle = direction === SHOOT_DIRECTION.LEFT ? Math.PI * (250 / 180) : Math.PI * (290 / 180)
      const angle = baseAngle + (Math.random() - 0.5) * (Math.PI * 4 / 180)
      const speed = 22
      physics.shootBead(cx, cy + radius - 20, angle, speed, bead.radius)
      gs.addBeadToPlate(bead)
      gs.setState(GAME_STATE.SHOOTING)
      updateUI()
    }
  }, [updateUI])

  const animateAddBeadToBracelet = useCallback((bead: PlateBead) => {
    if (addBeadAnimationRef.current) finishAddBeadAnimation()
    const gs = gameStateRef.current
    const { cx, cy, radius } = plateParamsRef.current
    const braceletBeads = gs.getBraceletBeads()
    const count = braceletBeads.length

    if (!braceletAnglesRef.current || braceletAnglesRef.current.length !== count) recalcBraceletAngles()

    const rotation = braceletRotationRef.current
    braceletRotationRef.current = 0
    for (let i = 0; i < braceletAnglesRef.current.length; i++) {
      braceletAnglesRef.current[i] = ((braceletAnglesRef.current[i] % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    }
    if (rotation !== 0) {
      for (let i = 0; i < braceletAnglesRef.current.length; i++) braceletAnglesRef.current[i] += rotation
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
    for (let i = 0; i < newCount; i++) finalAngles.push(i * newSlotAngle - Math.PI / 2 + rotationOffset)

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
      bead, placeholderIndex, phase: 'makeSpace', progress: 0,
      oldAngles, finalAngles, shootX, shootY, targetX, targetY,
      beadX: shootX, beadY: shootY, newCount
    }
    updateUI()
  }, [updateUI])

  const finishAddBeadAnimation = useCallback(() => {
    const anim = addBeadAnimationRef.current
    if (!anim) return
    const gs = gameStateRef.current
    const phIdx = anim.placeholderIndex
    const braceletBeads = gs.getBraceletBeads()
    if (anim.phase === 'makeSpace') braceletAnglesRef.current = anim.finalAngles.slice()
    braceletBeads.splice(phIdx, 1, anim.bead)
    braceletAnglesRef.current = anim.finalAngles.slice()
    addBeadAnimationRef.current = null
  }, [])

  const recalcBraceletAngles = useCallback(() => {
    const gs = gameStateRef.current
    const count = gs.getBraceletBeads().length
    braceletAnglesRef.current = []
    for (let i = 0; i < count; i++) braceletAnglesRef.current.push((i / count) * Math.PI * 2 - Math.PI / 2)
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
      targetPositions.push({ x: cx + Math.cos(angle) * tightRadius, y: cy + Math.sin(angle) * tightRadius })
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
      startPositions, targetPositions, targetAngles, beadRadius, beadData,
      progress: 0, delayPerBead: 0.02, totalBeads: count
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
    const beadRadius = (gs.plateBeads[0] && gs.plateBeads[0].radius) || 15
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

  const handleTouchStart = useCallback((e: any) => {
    if (assembleAnimationRef.current) return
    const gs = gameStateRef.current
    const touch = e.touches[0]
    if (!touch) return
    const x = touch.x
    const y = touch.y
    if (gs.getState() === GAME_STATE.BRACELET) handleBraceletTouchStart(x, y)
    else if (gs.getState() === GAME_STATE.SETTLED) handlePlateTouchStart(x, y)
  }, [])

  const handleTouchMove = useCallback((e: any) => {
    const touch = e.touches[0]
    if (!touch) return
    const x = touch.x
    const y = touch.y
    const dragState = dragStateRef.current
    if (dragState.isDragging) {
      if (dragState.mode === 'bracelet') handleBraceletTouchMove(x, y)
      else if (dragState.mode === 'plate') handlePlateTouchMove(x, y)
      else if (dragState.mode === 'rotate') handleBraceletRotateMove(x, y)
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    const gs = gameStateRef.current
    const { cx, cy, radius } = plateParamsRef.current
    const dragState = dragStateRef.current

    if (dragState.mode === 'bracelet' && dragState.currentX !== undefined && dragState.currentY !== undefined) {
      const distFromCenter = Math.sqrt((dragState.currentX - cx) ** 2 + (dragState.currentY - cy) ** 2)
      if (distFromCenter > radius * 1.1) {
        const deleteIndex = dragState.beadIndex
        gs.removeBeadFromBracelet(deleteIndex)
        if (braceletAnglesRef.current) braceletAnglesRef.current.splice(deleteIndex, 1)
        if (gs.getBraceletBeads().length < MIN_STRING_COUNT) disbandBracelet()
        else recalcBraceletAngles()
        updateUI()
      }
    }

    if (braceletAnglesRef.current && dragState.mode === 'bracelet' && dragState.currentX !== undefined) {
      const count = braceletAnglesRef.current.length
      const slotAngle = (Math.PI * 2) / count
      for (let i = 0; i < count; i++) braceletAnglesRef.current[i] = (i * slotAngle) - Math.PI / 2
    }

    if (dragState.mode === 'rotate' && braceletRotationRef.current !== 0) {
      if (braceletAnglesRef.current) {
        for (let i = 0; i < braceletAnglesRef.current.length; i++) braceletAnglesRef.current[i] += braceletRotationRef.current
      }
      braceletRotationRef.current = 0
    }

    dragState.isDragging = false
    dragState.beadIndex = -1
    dragState.slotIndex = -1
    dragState.currentX = undefined
    dragState.currentY = undefined
    dragState.mode = ''
    if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null }
  }, [disbandBracelet, recalcBraceletAngles, updateUI])

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
        longPressTimerRef.current = setTimeout(() => showDeleteConfirm(i), 800)
        break
      }
    }
  }, [])

  const handlePlateTouchMove = useCallback((x: number, y: number) => {
    if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null }
    const { cx, cy, radius } = plateParamsRef.current
    const distFromCenter = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    if (distFromCenter > radius * 1.1) {
      const gs = gameStateRef.current
      const physics = physicsRef.current
      if (!physics) return
      const deleteIndex = dragStateRef.current.beadIndex
      const body = physics.beadBodies[deleteIndex]
      if (body) { physics.Matter.World.remove(physics.world, body); physics.beadBodies.splice(deleteIndex, 1) }
      gs.plateBeads.splice(deleteIndex, 1)
      if (gs.plateBeads.length === 0) gs.setState(GAME_STATE.IDLE)
      dragStateRef.current.isDragging = false
      dragStateRef.current.beadIndex = -1
      dragStateRef.current.mode = ''
      updateUI()
      return
    }
    const physics = physicsRef.current
    if (!physics) return
    const body = physics.beadBodies[dragStateRef.current.beadIndex]
    if (body) { physics.Matter.Body.setPosition(body, { x, y }); physics.Matter.Body.setVelocity(body, { x: 0, y: 0 }) }
    dragStateRef.current.lastX = x
    dragStateRef.current.lastY = y
  }, [updateUI])

  const handleBraceletTouchStart = useCallback((x: number, y: number) => {
    const gs = gameStateRef.current
    const { cx, cy } = plateParamsRef.current
    const braceletBeads = gs.getBraceletBeads()
    const count = braceletBeads.length
    if (count === 0) return
    const beadRadius = braceletBeads[0].radius || 15
    const tightRadius = count > 1 ? beadRadius / Math.sin(Math.PI / count) : 0
    if (!braceletAnglesRef.current || braceletAnglesRef.current.length !== count) recalcBraceletAngles()
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
      if (diff > 0) { for (let i = currentSlot; i < targetSlot; i++) { const temp = braceletBeads[i]; braceletBeads[i] = braceletBeads[i + 1]; braceletBeads[i + 1] = temp } }
      else if (diff < 0) { for (let i = currentSlot; i > targetSlot; i--) { const temp = braceletBeads[i]; braceletBeads[i] = braceletBeads[i - 1]; braceletBeads[i - 1] = temp } }
      dragStateRef.current.slotIndex = targetSlot
      dragStateRef.current.beadIndex = targetSlot
    }
    braceletAnglesRef.current[dragStateRef.current.beadIndex] = currentAngle
    for (let i = 0; i < count; i++) { if (i === dragStateRef.current.beadIndex) continue; braceletAnglesRef.current[i] = (i * slotAngle) - Math.PI / 2 }
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
    Taro.showModal({
      title: '删除珠子',
      content: isBracelet ? '确定要从手串中删除这颗珠子吗？' : '确定要删除这颗珠子吗？',
      success: (res) => {
        if (res.confirm) {
          if (isBracelet) {
            gs.removeBeadFromBracelet(index)
            if (braceletAnglesRef.current) braceletAnglesRef.current.splice(index, 1)
          } else {
            const physics = physicsRef.current
            if (physics) physics.beadBodies.splice(index, 1)
            gs.plateBeads.splice(index, 1)
          }
          updateUI()
        }
      }
    })
  }, [updateUI])

  useEffect(() => {
    initCanvas()
    return () => {
      if (animationIdRef.current && canvasRef.current) canvasRef.current.cancelAnimationFrame(animationIdRef.current)
      if (physicsRef.current) physicsRef.current.destroy()
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
    }
  }, [initCanvas])

  return {
    state, beadCount, canString,
    isBracelet: state === GAME_STATE.BRACELET,
    canvasRef,
    addBead, stringBracelet, disbandBracelet, clearPlate,
    handleTouchStart, handleTouchMove, handleTouchEnd,
    getGameState: () => gameStateRef.current,
  }
}
