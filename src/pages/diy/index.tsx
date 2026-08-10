// src/pages/diy/index.tsx
import { View, Canvas, Button, ScrollView, Text, Image } from '@tarojs/components'
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
import { beadService } from '../../services/beadService'
import type { Bead } from '../../types/bead'
import { calculateProperties } from '../../utils/calculator'
import './index.scss'

// 珠子尺寸缩放：mm → canvas像素
const BEAD_SCALE = 3

// 连续发射冷却（ms）：避免快速连点时物理引擎同时处理的珠子过多导致卡顿
const SHOOT_COOLDOWN = 150

// 珠子视觉半径压缩区间（px）：大小珠子渲染尺寸被压缩到该区间内，避免差别过于夸张
const BEAD_RADIUS_MIN = 10
const BEAD_RADIUS_MAX = 16
// 原始渲染半径的映射区间：6mm → 9px，16mm → 24px
const BEAD_RAW_RADIUS_MIN = (6 / 2) * BEAD_SCALE
const BEAD_RAW_RADIUS_MAX = (16 / 2) * BEAD_SCALE

/**
 * 计算珠子的渲染半径（px）
 * 将直径按区间线性压缩到 BEAD_RADIUS_MIN~MAX，保留大小的相对差异但明显缩小跨度
 */
const getBeadRadius = (b: any): number => {
  const raw = b && b.diameter
    ? (b.diameter / 2) * BEAD_SCALE
    : b && b.radius
      ? b.radius * BEAD_SCALE
      : 5 * BEAD_SCALE
  if (raw <= BEAD_RAW_RADIUS_MIN) return BEAD_RADIUS_MIN
  if (raw >= BEAD_RAW_RADIUS_MAX) return BEAD_RADIUS_MAX
  const t = (raw - BEAD_RAW_RADIUS_MIN) / (BEAD_RAW_RADIUS_MAX - BEAD_RAW_RADIUS_MIN)
  return BEAD_RADIUS_MIN + t * (BEAD_RADIUS_MAX - BEAD_RADIUS_MIN)
}

// 分类数据接口
interface CategoryData {
  id: string
  name: string
  children?: CategoryData[]
  subTypes?: Array<{ id: string; name: string }>
}

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
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [currentCategory, setCurrentCategory] = useState<string>('')
  const [subTypes, setSubTypes] = useState<CategoryData[]>([])
  const [currentSubType, setCurrentSubType] = useState<string>('')
  const [currentBeads, setCurrentBeads] = useState<Bead[]>([])
  const [loading, setLoading] = useState(false)
  const [beadCount, setBeadCount] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)
  const [canString, setCanString] = useState(false)
  const [isBracelet, setIsBracelet] = useState(false)

  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isSavingDesign, setIsSavingDesign] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [showWristModal, setShowWristModal] = useState(wristSize === null)

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
  // 渲染循环是否在运行（空闲时暂停，避免无谓的每帧全量重绘）
  const renderLoopRunningRef = useRef(false)
  const startRenderLoopRef = useRef<(() => void) | null>(null)
  // 画布是否已初始化（调整手围时不再重建画布，避免清空已摆放的珠子）
  const canvasInitedRef = useRef(false)
  // 发射冷却：记录上一次发射时间
  const lastShootTimeRef = useRef(0)
  // 当前展示珠子的引用（供画布初始化后预加载图片）
  const currentBeadsRef = useRef<Bead[]>([])
  useEffect(() => {
    currentBeadsRef.current = currentBeads
  }, [currentBeads])

  // 恢复渲染循环：场景有变化时调用（画布未初始化时为 no-op）
  const resumeRenderLoop = useCallback(() => {
    if (startRenderLoopRef.current) startRenderLoopRef.current()
  }, [])

  // 预加载珠子图片到渲染器缓存，减少点击时的网络等待（画布未初始化时为 no-op）
  const preloadBeadImages = useCallback((beads: Bead[]) => {
    const renderer = rendererRef.current
    if (!renderer) return
    beads.forEach((bead) => {
      if (bead.imageUrl && !renderer.hasBeadImage(bead.imageUrl)) {
        renderer.loadBeadImage(bead.imageUrl)
      }
    })
  }, [])

  // 原生图片缓存预取：让 <Image> 组件直接命中微信图片缓存，加快首栏/首屏加载
  const prefetchNativeImages = useCallback((beads: Bead[]) => {
    const urls = beads.map((b) => b && b.imageUrl).filter((u): u is string => !!u)
    if (urls.length === 0) return
    // wx.prefetchImage 需要基础库 2.24.0+
    if (typeof wx !== 'undefined' && wx && typeof wx.prefetchImage === 'function') {
      wx.prefetchImage({ urls })
    }
  }, [])

  // 构建提交给后端的手串珠子数据（保留 originalId，确保后端收到真实数据库ID）
  const buildBraceletBeads = useCallback((beads: any[]): any[] => {
    return beads.map((b) => ({
      id: b.id,
      originalId: b.originalId || b.id,
      name: b.name,
      category: b.category || '',
      imageUrl: b.imageUrl || b.image || '',
      price: b.price || 0,
      weight: b.weight || 0,
      diameter: b.diameter || (b.radius ? b.radius * 2 / BEAD_SCALE : 10),
      stock: b.stock || 999,
    }))
  }, [])

  // 加载分类数据
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true)
        const categoriesData = await beadService.getCategories()
        setCategories(categoriesData)

        if (categoriesData.length > 0) {
          const firstCategory = categoriesData[0]
          setCurrentCategory(firstCategory.id)

          // 获取第一个分类的子分类
          if (firstCategory.subTypes && firstCategory.subTypes.length > 0) {
            setSubTypes(firstCategory.subTypes)
            setCurrentSubType(firstCategory.subTypes[0].id)

            // 获取第一个子分类的珠子
            const beadsResult = await beadService.getBeads(firstCategory.id, firstCategory.subTypes[0].id)
            setCurrentBeads(beadsResult.beads)
            // 第一栏优先缓存：原生图片缓存预取 + 渲染器缓存，加快首屏展示
            prefetchNativeImages(beadsResult.beads)
            preloadBeadImages(beadsResult.beads)
          }
        }
      } catch (error) {
        console.error('加载分类数据失败:', error)
        Taro.showToast({ title: '加载数据失败', icon: 'none' })
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [])

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
    // 场景有变化，恢复渲染循环（空闲时循环已暂停）
    resumeRenderLoop()
    const gs = gameStateRef.current
    const isBraceletState = gs.getState() === GAME_STATE.BRACELET
    const beads = isBraceletState
      ? gs.getBraceletBeads()
      : gs.plateBeads
    const count = beads.length
    const price = beads.reduce((sum, b) => sum + (Number(b.price) || 0), 0)
    setBeadCount(count)
    setTotalPrice(price)
    setCanString(gs.canStringBracelet())
    setIsBracelet(isBraceletState)
  }, [resumeRenderLoop])

  // 初始化 Canvas - 首次设置手围后初始化一次；之后调整手围不再重建画布，避免清空已摆放的珠子
  useEffect(() => {
    // 如果手围未设置，不初始化 Canvas，等待弹窗关闭后由 wristSize 变化触发
    if (wristSize === null) return
    // 已初始化过：仅更新手围数值，不重建画布（否则会清空当前的珠子设计）
    if (canvasInitedRef.current) return
    canvasInitedRef.current = true

    const plateImageUrl = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/diy_shou_chuang/panzi.png'

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
          const renderer = new Renderer(ctx, res[0].width, res[0].height, canvas)
          rendererRef.current = renderer

          // 预加载当前子分类的珠子图片到渲染器缓存，避免首次点击等待网络下载
          currentBeadsRef.current.forEach((bead) => {
            if (bead.imageUrl) renderer.loadBeadImage(bead.imageUrl)
          })

          // 加载盘子背景图片
          const loadPlateImage = (imageUrl: string) => {
            const image = canvas.createImage()
            image.onload = () => {
              renderer.setPlateImage(image)
              startRenderLoop()
              console.log('盘子背景图片加载成功:', imageUrl)
            }
            image.onerror = (err) => {
              console.error('盘子背景图片加载失败:', imageUrl, err)
            }
            image.src = imageUrl
          }

          // 优先尝试加载网络图片
          Taro.getImageInfo({
            src: plateImageUrl,
            success: (imageInfo) => {
              console.log('Taro.getImageInfo加载图片成功:', imageInfo)
              loadPlateImage(imageInfo.path)
            },
            fail: (err) => {
              console.error('Taro.getImageInfo加载图片失败:', err)
              // 如果Taro加载失败，尝试直接使用canvas.createImage
              loadPlateImage(plateImageUrl)
            }
          })

          // 场景是否仍需要持续渲染（物理/动画/拖拽进行中）
          const shouldKeepRendering = () => {
            const gs = gameStateRef.current
            if (gs.getState() === GAME_STATE.SHOOTING) return true
            if (addBeadAnimationRef.current) return true
            if (assembleAnimationRef.current) return true
            if (dragStateRef.current.isDragging) return true
            return false
          }

          // 渲染循环：空闲时自动暂停，避免无谓的每帧全量重绘
          const loop = () => {
            update()
            render()
            if (shouldKeepRendering()) {
              animationIdRef.current = canvas.requestAnimationFrame(loop)
            } else {
              renderLoopRunningRef.current = false
              animationIdRef.current = null
            }
          }

          // 启动/恢复渲染循环（重复调用无副作用）
          const startRenderLoop = () => {
            if (renderLoopRunningRef.current) return
            renderLoopRunningRef.current = true
            animationIdRef.current = canvas.requestAnimationFrame(loop)
          }
          startRenderLoopRef.current = startRenderLoop

          // 开始渲染循环（先渲染一帧，空闲则自动暂停）
          startRenderLoop()
        })
    }

    initCanvas()
  }, [wristSize])

  // 手围弹窗关闭后重绘画布：弹窗打开期间画布被 display:none 隐藏，重新显示后需恢复绘制内容
  useEffect(() => {
    if (showWristModal) return
    if (!canvasInitedRef.current) return
    const timer = setTimeout(() => resumeRenderLoop(), 50)
    return () => clearTimeout(timer)
  }, [showWristModal, resumeRenderLoop])

  // 组件卸载时清理画布与物理引擎
  useEffect(() => {
    return () => {
      if (animationIdRef.current) {
        canvasRef.current && canvasRef.current.cancelAnimationFrame(animationIdRef.current)
      }
      startRenderLoopRef.current = null
      renderLoopRunningRef.current = false
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
        renderer.drawBead(pos.x, pos.y, getBeadRadius(plateBeads[index]), plateBeads[index].color, pos.angle, plateBeads[index].imageUrl)
      }
    })

    if (gs.getState() === GAME_STATE.BRACELET) {
      const braceletBeads = gs.getBraceletBeads()
      if (braceletBeads.length > 0) {
        // 添加珠子动画期间，使用动画专用渲染路径（跳过占位珠、绘制飞行中的新珠子）
        if (addBeadAnimationRef.current) {
          renderAddBeadAnimation()
          return
        }
        if (assembleAnimationRef.current) {
          const animPositions = getAssembleBeadPositions()
          if (animPositions) {
            const anim = assembleAnimationRef.current
            for (let i = 0; i < braceletBeads.length; i++) {
              const pos = animPositions[i]
              renderer.drawBead(pos.x, pos.y, anim.beadRadius, braceletBeads[i].color, pos.rollAngle, braceletBeads[i].imageUrl)
            }
          }
          return
        }

        // 使用与触摸检测相同的逻辑计算珠子位置
        const beadPositions = calculateBraceletBeadPositions(braceletBeads)

        let draggedBeadPos = null
        const ds = dragStateRef.current
        if (ds.isDragging && ds.mode === 'bracelet' && ds.currentX !== undefined) {
          draggedBeadPos = { index: ds.beadIndex, x: ds.currentX, y: ds.currentY }
        }

        // 使用计算出的位置来绘制手串
        renderer.drawBraceletWithPositions(braceletBeads, beadPositions, draggedBeadPos)
      }
    }
  }, [])

  // 更新添加珠子动画（位置插值：先让已有珠子让位腾出槽位，再从底部飞入新珠子）
  const updateAddBeadAnimation = useCallback(() => {
    const anim = addBeadAnimationRef.current
    if (!anim) return

    anim.progress += 0.08
    if (anim.progress > 0.92) anim.progress = 1

    const t = Math.min(anim.progress, 1)
    const ease = 1 - Math.pow(1 - t, 3)

    if (anim.phase === 'makeSpace') {
      // 已有珠子从当前位置平滑过渡到最终位置，让出插入槽位（槽位处不绘制任何东西）
      const positions: Array<{ x: number; y: number; radius: number }> = new Array(anim.newCount)
      for (let i = 0; i < anim.newCount; i++) {
        if (i === anim.placeholderIndex) {
          positions[i] = anim.finalPositions[i]
          continue
        }
        const oldIdx = i < anim.placeholderIndex ? i : i - 1
        const startPos = oldIdx < anim.startPositions.length ? anim.startPositions[oldIdx] : null
        const finalPos = anim.finalPositions[i]
        positions[i] = startPos
          ? {
              x: startPos.x + (finalPos.x - startPos.x) * ease,
              y: startPos.y + (finalPos.y - startPos.y) * ease,
              radius: finalPos.radius
            }
          : finalPos
      }
      anim.currentPositions = positions

      if (t >= 1) {
        anim.phase = 'shootBead'
        anim.progress = 0
        anim.currentPositions = null
      }
    } else {
      // 新珠子从盘子底部飞入目标槽位
      anim.beadX = (1 - ease) * anim.shootX + ease * anim.targetX
      anim.beadY = (1 - ease) * anim.shootY + ease * anim.targetY

      if (t >= 1) {
        const gs = gameStateRef.current
        const braceletBeads = gs.getBraceletBeads()
        braceletBeads.splice(anim.placeholderIndex, 1, anim.bead)
        addBeadAnimationRef.current = null
      }
    }
  }, [])

  // 绘制添加珠子动画（跳过占位珠，绘制飞行中的新珠子）
  const renderAddBeadAnimation = useCallback(() => {
    const renderer = rendererRef.current
    const gs = gameStateRef.current
    const anim = addBeadAnimationRef.current
    if (!renderer || !anim) return

    const braceletBeads = gs.getBraceletBeads()
    const positions = anim.phase === 'makeSpace' ? anim.currentPositions : anim.finalPositions
    if (!positions) return

    for (let i = 0; i < positions.length; i++) {
      if (i === anim.placeholderIndex) continue
      const pos = positions[i]
      const bead = braceletBeads[i]
      if (!bead || !pos) continue
      renderer.drawBead(pos.x, pos.y, pos.radius, bead.color, 0, bead.imageUrl)
    }

    if (anim.phase === 'shootBead') {
      renderer.drawBead(anim.beadX, anim.beadY, anim.beadRadius, anim.bead.color, 0, anim.bead.imageUrl)
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
  const handleBeadTap = useCallback(async (bead: Bead) => {
    // 恢复渲染循环（空闲时已暂停）
    resumeRenderLoop()

    if (assembleAnimationRef.current) return

    // 发射冷却：连点过快时忽略本次点击，给物理引擎喘息时间
    const now = Date.now()
    if (now - lastShootTimeRef.current < SHOOT_COOLDOWN) return
    lastShootTimeRef.current = now

    const gs = gameStateRef.current

    if (gs.getState() === GAME_STATE.BRACELET) {
      animateAddBeadToBracelet(bead)
      return
    }

    if (gs.getState() === GAME_STATE.IDLE ||
        gs.getState() === GAME_STATE.SETTLED ||
        gs.getState() === GAME_STATE.SHOOTING) {

      // 预加载珠子图片
      if (bead.imageUrl && rendererRef.current) {
        await rendererRef.current.loadBeadImage(bead.imageUrl)
      }

      const direction = gs.shootDirection
      const baseAngle = direction === 'left'
        ? Math.PI * (250 / 180)
        : Math.PI * (290 / 180)
      const angle = baseAngle + (Math.random() - 0.5) * (Math.PI * 4 / 180)

      const speed = 22
      const beadRadius = getBeadRadius(bead)
      physicsRef.current && physicsRef.current.shootBead(
        plateCxRef.current,
        plateCyRef.current + plateRadiusRef.current - 20,
        angle,
        speed,
        beadRadius
      )

      gs.addBeadToPlate(bead)
      gs.setState(GAME_STATE.SHOOTING)
      updateUI()
    }
  }, [updateUI])

  // 手串模式 - 动画添加珠子
  const animateAddBeadToBracelet = useCallback(async (bead: Bead) => {
    if (addBeadAnimationRef.current) {
      finishAddBeadAnimation()
    }

    // 预加载珠子图片
    if (bead.imageUrl && rendererRef.current) {
      await rendererRef.current.loadBeadImage(bead.imageUrl)
    }

    const gs = gameStateRef.current
    const braceletBeads = gs.getBraceletBeads()
    const count = braceletBeads.length

    const newBeadRadius = getBeadRadius(bead)

    // 当前已有珠子的位置（作为动画起点）
    const startPositions = count > 0 ? calculateBraceletBeadPositions(braceletBeads) : []

    // 占位珠：沿用原始 diameter（与真实珠子同尺寸，getBeadRadius 会做同样的压缩），仅用于计算布局，动画期间渲染会跳过它
    const placeholder = {
      _placeholder: true,
      diameter: bead.diameter,
      color: 'transparent'
    } as any

    // 确定插入槽位：依次尝试每个位置，选新珠子最终落在屏幕最底部（6点方向）的那个，与从底部飞入的动画方向一致
    let placeholderIndex = count
    if (count > 0) {
      let bestY = -Infinity
      for (let p = 0; p <= count; p++) {
        const trial = [...braceletBeads]
        trial.splice(p, 0, placeholder)
        const trialPositions = calculateBraceletBeadPositions(trial)
        if (trialPositions[p] && trialPositions[p].y > bestY) {
          bestY = trialPositions[p].y
          placeholderIndex = p
        }
      }
    }

    // 最终布局：与正常渲染共用 calculateBraceletBeadPositions，动画结束无跳变
    const newBeads = [...braceletBeads]
    newBeads.splice(placeholderIndex, 0, placeholder)
    const finalPositions = calculateBraceletBeadPositions(newBeads)

    const targetX = finalPositions[placeholderIndex] ? finalPositions[placeholderIndex].x : plateCxRef.current
    const targetY = finalPositions[placeholderIndex] ? finalPositions[placeholderIndex].y : plateCyRef.current

    const shootX = plateCxRef.current
    const shootY = plateCyRef.current + plateRadiusRef.current + 40

    // 将占位珠插入真实数组
    braceletBeads.splice(placeholderIndex, 0, placeholder)

    addBeadAnimationRef.current = {
      bead,
      placeholderIndex,
      phase: 'makeSpace',
      progress: 0,
      startPositions,
      finalPositions,
      currentPositions: null,
      shootX,
      shootY,
      targetX,
      targetY,
      beadX: shootX,
      beadY: shootY,
      newCount: count + 1,
      beadRadius: newBeadRadius
    }

    updateUI()
  }, [updateUI])

  // 立即完成添加珠子动画（用真实珠子替换占位珠，剩余由正常渲染路径接管）
  const finishAddBeadAnimation = useCallback(() => {
    const anim = addBeadAnimationRef.current
    if (!anim) return

    const gs = gameStateRef.current
    const braceletBeads = gs.getBraceletBeads()
    braceletBeads.splice(anim.placeholderIndex, 1, anim.bead)
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
    const beadRadius = getBeadRadius(beads[0])
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
    const beadRadius = gs.plateBeads.length > 0 ? getBeadRadius(gs.plateBeads[0]) : (5 * BEAD_SCALE)
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

  // 清空：清空所有珠子
  const handleClearAllBeads = useCallback(() => {
    const gs = gameStateRef.current
    const isBracelet = gs.getState() === GAME_STATE.BRACELET
    Taro.showModal({
      title: '清空',
      content: isBracelet ? '确定要清空当前手串的所有珠子吗？' : '确定要清空盘子上的所有珠子吗？',
      confirmColor: '#e64340',
      success: (res) => {
        if (res.confirm) {
          gs.reset()
          physicsRef.current && physicsRef.current.clearBeads()
          braceletAnglesRef.current = []
          updateUI()
        }
      }
    })
  }, [updateUI])

  // Canvas 触摸事件
  const handleCanvasTouch = useCallback((e: any) => {
    // 恢复渲染循环（拖拽/旋转期间需要持续渲染）
    resumeRenderLoop()

    if (assembleAnimationRef.current || addBeadAnimationRef.current) return

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
      if (distance < getBeadRadius(plateBeads[i])) {
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

  // 计算手串珠子位置的辅助函数
  const calculateBraceletBeadPositions = useCallback((beads: any[]) => {
    const count = beads.length
    if (count === 0) return []


    const positions: Array<{ x: number; y: number; radius: number }> = []
    const rotation = braceletRotationRef.current

    if (count === 1) {
      // 只有一个珠子，放在中心
      positions.push({ x: plateCxRef.current, y: plateCyRef.current, radius: getBeadRadius(beads[0]) })
    } else {
      // 计算手串的总周长（所有珠子直径之和）
      const totalBeadDiameter = beads.reduce((sum, bead) => sum + getBeadRadius(bead) * 2, 0)

      // 计算手串的半径（基于周长）
      const braceletRadius = totalBeadDiameter / (2 * Math.PI)

      // 计算每个珠子的位置，考虑旋转角度
      let currentAngle = -Math.PI / 2 + rotation // 从顶部开始，加上旋转角度

      beads.forEach((bead, index) => {
        const beadRadius = getBeadRadius(bead)

        // 计算珠子中心的位置
        const x = plateCxRef.current + Math.cos(currentAngle) * braceletRadius
        const y = plateCyRef.current + Math.sin(currentAngle) * braceletRadius
        positions.push({ x, y, radius: beadRadius })

        // 计算下一个珠子的角度偏移（基于当前珠子和下一个珠子的半径）
        const nextIndex = (index + 1) % count
        const nextRadius = getBeadRadius(beads[nextIndex])
        const angleOffset = (beadRadius + nextRadius) / braceletRadius

        // 如果是最后一个珠子，不需要更新角度
        if (index < count - 1) {
          currentAngle += angleOffset
        }
      })
    }

    return positions
  }, [])

  // 手串模式 - 触摸开始
  const handleBraceletTouchStart = useCallback((x: number, y: number) => {
    const gs = gameStateRef.current
    const braceletBeads = gs.getBraceletBeads()
    const count = braceletBeads.length
    if (count === 0) return

    // 使用与渲染相同的逻辑计算珠子位置
    const beadPositions = calculateBraceletBeadPositions(braceletBeads)

    for (let index = 0; index < count; index++) {
      const pos = beadPositions[index]
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2)
      if (distance < pos.radius * 1.2) {
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
  }, [calculateBraceletBeadPositions])

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

    // 使用与渲染相同的逻辑计算珠子位置
    const beadPositions = calculateBraceletBeadPositions(braceletBeads)

    // 找到最近的珠子位置（排除当前拖动的珠子）
    let closestIndex = -1
    let closestDistance = Infinity

    for (let i = 0; i < count; i++) {
      if (i === dragStateRef.current.beadIndex) continue
      const pos = beadPositions[i]
      const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2)
      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = i
      }
    }

    // 如果找到了最近的珠子，并且距离足够近，则交换位置
    if (closestIndex >= 0 && closestDistance < beadPositions[closestIndex].radius * 2) {
      const currentSlot = dragStateRef.current.slotIndex
      const targetSlot = closestIndex

      if (targetSlot !== currentSlot) {
        // 交换珠子位置
        const temp = braceletBeads[currentSlot]
        braceletBeads[currentSlot] = braceletBeads[targetSlot]
        braceletBeads[targetSlot] = temp

        // 更新拖动状态
        dragStateRef.current.slotIndex = targetSlot
        dragStateRef.current.beadIndex = targetSlot
      }
    }
  }, [calculateBraceletBeadPositions])

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

    // 注意：不再重置 braceletRotationRef.current，因为我们现在使用 calculateBraceletBeadPositions 来计算珠子位置
    // braceletRotationRef.current 会保持旋转状态

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
            // 从物理世界移除刚体，避免留下孤立碰撞体
            const body = physicsRef.current!.beadBodies[index]
            if (body) {
              physicsRef.current!.Matter.World.remove(physicsRef.current!.world, body)
            }
            physicsRef.current!.beadBodies.splice(index, 1)
            gs.plateBeads.splice(index, 1)
          }
          updateUI()
        }
      }
    })
  }, [updateUI])

  // 切换主分类
  const handleCategoryTap = useCallback(async (categoryId: string) => {
    try {
      setCurrentCategory(categoryId)
      setLoading(true)

      // 找到当前分类的子分类
      const category = categories.find(c => c.id === categoryId)
      if (category && category.subTypes) {
        setSubTypes(category.subTypes)
        const firstSubType = category.subTypes.length > 0 ? category.subTypes[0].id : ''
        setCurrentSubType(firstSubType)

        // 获取第一个子分类的珠子
        if (firstSubType) {
          const beadsResult = await beadService.getBeads(categoryId, firstSubType)
          setCurrentBeads(beadsResult.beads)
          prefetchNativeImages(beadsResult.beads)
          preloadBeadImages(beadsResult.beads)
        } else {
          // 如果没有子分类，获取该分类下的所有珠子
          const beadsResult = await beadService.getBeads(categoryId)
          setCurrentBeads(beadsResult.beads)
          prefetchNativeImages(beadsResult.beads)
          preloadBeadImages(beadsResult.beads)
        }
      }
    } catch (error) {
      console.error('切换分类失败:', error)
      Taro.showToast({ title: '加载数据失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [categories])

  // 切换子类
  const handleSubTypeTap = useCallback(async (subTypeId: string) => {
    try {
      setCurrentSubType(subTypeId)
      setLoading(true)

      const beadsResult = await beadService.getBeads(currentCategory, subTypeId)
      setCurrentBeads(beadsResult.beads)
      prefetchNativeImages(beadsResult.beads)
      preloadBeadImages(beadsResult.beads)
    } catch (error) {
      console.error('切换子分类失败:', error)
      Taro.showToast({ title: '加载数据失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [currentCategory])

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
        beads: buildBraceletBeads(beads),
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
  }, [saveDesign, buildBraceletBeads])

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
        beads: buildBraceletBeads(beads),
        name: braceletName,
        updatedAt: Date.now(),
      }

      // 计算真实的手串属性（价格/重量/长度），避免购物车显示为 0
      const propertiesData = calculateProperties(braceletData.beads as any)

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
        success: (res) => {
          if (res.confirm) {
            Taro.switchTab({ url: '/pages/profile/index' }).catch(() => {
              Taro.reLaunch({ url: '/pages/profile/index' })
            })
          }
        },
      })
    } finally {
      setIsAddingToCart(false)
    }
  }, [addToCart, isAddingToCart, buildBraceletBeads])

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
      {/* 盘子区域 - 上方 60% (弹窗打开时用 visibility 隐藏，避免原生Canvas遮挡弹窗；不卸载节点以免背景/珠子丢失) */}
      <View className={`diy-page__canvas ${showWristModal ? 'diy-page__canvas--hidden' : ''}`}>
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

          {/* 顶部 - 当前珠子数 + 总费用 */}
          <View className="diy-page__stats">
            <Text className="diy-page__stats-item">当前 {beadCount} 颗</Text>
            <Text className="diy-page__stats-item diy-page__stats-price">总费用 ¥{totalPrice.toFixed(2)}</Text>
          </View>

          {/* 左下角 - 手围设置 + 清空 */}
          <View className="diy-page__bottom-left">
            <Button className="diy-page__btn" onClick={() => setShowWristModal(true)}>手围设置</Button>
            <Button className="diy-page__btn" onClick={handleClearAllBeads}>清空</Button>
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
                  {/* 珠子图片展示区域 - 视觉焦点 */}
                  <View className="bead-card__image-area">
                    {bead.imageUrl ? (
                      <Image
                        className="bead-card__image"
                        src={bead.imageUrl}
                        mode="aspectFit"
                        lazyLoad
                      />
                    ) : (
                      <View className="bead-card__bead-visual">
                        <View
                          className="bead-card__bead-circle"
                          style={{ backgroundColor: '#F0F8FF' }}
                        >
                          {/* 光泽效果 */}
                          <View className="bead-card__bead-shine" />
                        </View>
                      </View>
                    )}
                    {/* 尺寸标签 */}
                    <View className="bead-card__size-tag">
                      {bead.diameter}mm
                    </View>
                  </View>

                  {/* 珠子信息 */}
                  <View className="bead-card__info">
                    <Text className="bead-card__name">{bead.name}</Text>
                    <View className="bead-card__actions">
                      <Text className="bead-card__current-size">{bead.diameter}mm</Text>
                    </View>
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
