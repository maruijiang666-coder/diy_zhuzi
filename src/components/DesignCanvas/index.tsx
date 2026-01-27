import { View, Image, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import type { Bead } from '../../types/bead'
import type { Bracelet } from '../../types/bracelet'
import BeadDetailModal from '../BeadDetailModal'
import { getOptimizedImageUrlSync, ImageSize, checkWebPSupport } from '../../utils/image'
import './index.scss'

interface DesignCanvasProps {
  bracelet: Bracelet
  selectedBeadIndex: number | null
  onBeadSelect: (index: number) => void
  onBeadDelete: (index: number) => void
  onBeadMove: (fromIndex: number, toIndex: number) => void
  onSettingClick?: () => void
}

interface VisualBeadState {
  x: number
  y: number
  angle: number
  opacity: number
  scale: number
}

const DesignCanvas: React.FC<DesignCanvasProps> = ({
  bracelet,
  selectedBeadIndex,
  onBeadSelect,
  onBeadDelete,
  onBeadMove,
  onSettingClick,
}) => {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  const [webpSupported, setWebpSupported] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedBead, setSelectedBead] = useState<Bead | null>(null)
  const [clickedBeadIndex, setClickedBeadIndex] = useState<number>(-1)
  
  // 交互状态
  const [visualBeads, setVisualBeads] = useState<VisualBeadState[]>([])
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  
  // Refs needed for interaction logic to avoid closure staleness
  const visualBeadsRef = useRef<VisualBeadState[]>([])
  const draggingIndexRef = useRef<number | null>(null)
  const longPressTimerRef = useRef<any>(null)
  const touchStartRef = useRef<{ x: number, y: number } | null>(null)
  const lastMoveRef = useRef<{ x: number, y: number } | null>(null)
  const canvasRef = useRef<any>(null)
  const animationFrameRef = useRef<any>(null)

  // 检测WebP支持
  useEffect(() => {
    checkWebPSupport().then(setWebpSupported)
  }, [])

  // 处理图片加载失败
  const handleImageError = useCallback((index: number) => {
    setImageErrors((prev) => new Set(prev).add(index))
  }, [])

  // 关闭弹窗
  const handleModalClose = useCallback(() => {
    setModalVisible(false)
    setSelectedBead(null)
    setClickedBeadIndex(-1)
    onBeadSelect(-1)
  }, [onBeadSelect])

  // 删除珠子
  const handleModalDelete = useCallback(() => {
    if (clickedBeadIndex >= 0) {
      onBeadDelete(clickedBeadIndex)
      setModalVisible(false)
      setSelectedBead(null)
      setClickedBeadIndex(-1)
      Taro.showToast({
        title: '已删除',
        icon: 'success',
        duration: 1500,
      })
    }
  }, [clickedBeadIndex, onBeadDelete])

  // px转rpx比例
  const rpxRatio = useMemo(() => {
    try {
      const info = Taro.getSystemInfoSync()
      return 750 / info.windowWidth
    } catch (e) {
      return 2
    }
  }, [])

  // 计算珠子渲染尺寸
  const getBeadSize = useCallback((bead: Bead) => {
    const baseSize = 25
    const baseDiameter = 8
    const size = (bead.diameter / baseDiameter) * baseSize
    return Math.max(10, size)
  }, [])

  // 计算画布尺寸和半径
  const { canvasSize, centerOffset } = useMemo(() => {
    const radius = 150 
    const padding = 50 
    const size = radius * 2 + padding * 2 
    const center = size / 2 
    return { canvasSize: size, centerOffset: center }
  }, [])

  // 计算布局指标
  const { effectiveRadius, scaleFactor } = useMemo(() => {
    const FIXED_RADIUS = 150;
    if (bracelet.beads.length === 0) {
      return { effectiveRadius: FIXED_RADIUS, scaleFactor: 1 };
    }
    const beadSizes = bracelet.beads.map(bead => getBeadSize(bead))
    const totalBeadCircumference = beadSizes.reduce((sum, size) => sum + size, 0)
    const targetCircumference = 2 * Math.PI * FIXED_RADIUS;
    let scale = targetCircumference / totalBeadCircumference;
    const MAX_SCALE = 2.2;
    const MIN_SCALE = 0.5;
    scale = Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);
    return { effectiveRadius: FIXED_RADIUS, scaleFactor: scale };
  }, [bracelet.beads, getBeadSize]);

  // 获取画布位置
  const updateCanvasRect = useCallback(() => {
    const query = Taro.createSelectorQuery()
    query.select('.design-canvas__beads').boundingClientRect(rect => {
      if (rect) {
        canvasRef.current = rect
      }
    }).exec()
  }, [])

  // 监听画布尺寸变化
  useEffect(() => {
    const timer = setTimeout(updateCanvasRect, 200)
    return () => clearTimeout(timer)
  }, [updateCanvasRect, bracelet.beads.length])

  // 核心计算函数：计算标准圆形布局位置
  const calculateStandardLayout = useCallback((beads: Bead[]) => {
    const layout: VisualBeadState[] = []
    let accumulatedAngle = -Math.PI / 2
    
    beads.forEach((bead) => {
        const beadSize = getBeadSize(bead) * scaleFactor
        const angleWidth = beadSize / effectiveRadius
        const currentBeadAngle = accumulatedAngle + angleWidth / 2
        
        const x = centerOffset + effectiveRadius * Math.cos(currentBeadAngle)
        const y = centerOffset + effectiveRadius * Math.sin(currentBeadAngle)
        
        layout.push({
            x,
            y,
            angle: currentBeadAngle,
            opacity: 1,
            scale: 1
        })
        
        accumulatedAngle += angleWidth
    })
    return layout
  }, [effectiveRadius, scaleFactor, centerOffset, getBeadSize])

  // 初始化或同步视觉状态
  useEffect(() => {
    // 只有在非拖拽且非动画状态下才同步
    if (draggingIndexRef.current === null && !isAnimating) {
        const layout = calculateStandardLayout(bracelet.beads)
        setVisualBeads(layout)
        visualBeadsRef.current = layout
    }
  }, [bracelet.beads, calculateStandardLayout, isAnimating])

  // ----------------------------------------------------------------
  // 交互层：处理长按、拖动、松手
  // ----------------------------------------------------------------



  // 处理珠子点击（供 handleContainerTouchEnd 调用）
  const handleBeadClick = useCallback((index: number) => {
    const bead = bracelet.beads[index]
    onBeadSelect(index)
    setClickedBeadIndex(index)
    setSelectedBead(bead)
    setModalVisible(true)
  }, [bracelet.beads, onBeadSelect])

  // 1. 触摸开始
  const handleContainerTouchStart = useCallback((e: any) => {
    // 如果正在动画中，阻止交互，防止状态混乱
    if (isAnimating) return

    // 确保 Canvas 位置是最新的
    updateCanvasRect()

    const touch = e.touches[0]
    if (!touch || !canvasRef.current) return

    const { left, top } = canvasRef.current
    // 转换为相对于 Canvas 左上角的坐标 (px)
    // 注意：这里的坐标是 px，用于逻辑计算
    const touchX = touch.clientX - left
    const touchY = touch.clientY - top
    
    // 记录初始坐标用于判断移动距离
    touchStartRef.current = { x: touchX, y: touchY }

    // 碰撞检测：找到被点击的珠子
    // 将 px 转换为 rpx 进行比较 (因为 bead size 是 rpx)
    const touchXRpx = touchX * rpxRatio
    const touchYRpx = touchY * rpxRatio
    
    let foundIndex = -1
    
    // 遍历当前视觉位置进行检测
    const currentVisuals = visualBeadsRef.current
    
    for (let i = 0; i < currentVisuals.length; i++) {
        const beadState = currentVisuals[i]
        const bead = bracelet.beads[i]
        const size = getBeadSize(bead) * scaleFactor
        const radius = size / 2
        
        // 计算距离
        const dx = touchXRpx - beadState.x
        const dy = touchYRpx - beadState.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        // 增加一点点击判定范围 (1.2倍半径)
        if (dist <= radius * 1.2) {
            foundIndex = i
            break
        }
    }

    if (foundIndex !== -1) {
        // 启动 300ms 计时器
        longPressTimerRef.current = setTimeout(() => {
            // 触发长按逻辑
            Taro.vibrateShort({ type: 'medium' })
            
            // 标记选中
            setDraggingIndex(foundIndex)
            draggingIndexRef.current = foundIndex
            
            // 立即重绘：选中珠子半透明
            const newVisuals = [...visualBeadsRef.current]
            newVisuals[foundIndex] = {
                ...newVisuals[foundIndex],
                opacity: 0.6,
                scale: 1.1
            }
            setVisualBeads(newVisuals)
            visualBeadsRef.current = newVisuals
            
        }, 300)
    }
  }, [bracelet.beads, rpxRatio, getBeadSize, scaleFactor, updateCanvasRect, isAnimating])

  // 2. 触摸移动
  const handleContainerTouchMove = useCallback((e: any) => {
    e.stopPropagation() // 阻止页面滚动
    
    const touch = e.touches[0]
    if (!touch || !canvasRef.current) return
    
    const { left, top } = canvasRef.current
    const touchX = touch.clientX - left
    const touchY = touch.clientY - top
    
    // 检查是否在长按判定期间移动过大
    if (longPressTimerRef.current && touchStartRef.current) {
        const dx = touchX - touchStartRef.current.x
        const dy = touchY - touchStartRef.current.y
        const moveDist = Math.sqrt(dx * dx + dy * dy)
        
        if (moveDist > 10) {
            // 移动超过阈值，取消长按
            clearTimeout(longPressTimerRef.current)
            longPressTimerRef.current = null
        }
    }
    
    // 记录最后移动位置（用于松手计算）
    lastMoveRef.current = { x: touchX, y: touchY }
    
    // 拖动跟随逻辑
    if (draggingIndexRef.current !== null) {
        const index = draggingIndexRef.current
        
        // 限制坐标不超出画布范围
        // 简单限制在矩形内，或者圆形内
        // 转换为 rpx
        let targetX = touchX * rpxRatio
        let targetY = (touchY - 20) * rpxRatio // Y轴微调上移，避开手指
        
        // 简单的边界限制 (0 ~ canvasSize)
        targetX = Math.max(0, Math.min(targetX, canvasSize))
        targetY = Math.max(0, Math.min(targetY, canvasSize))
        
        const newVisuals = [...visualBeadsRef.current]
        newVisuals[index] = {
            ...newVisuals[index],
            x: targetX,
            y: targetY
            // 其他珠子保持不变
        }
        
        setVisualBeads(newVisuals)
        visualBeadsRef.current = newVisuals
    }
  }, [canvasSize, rpxRatio])

  // 3. 松手重排
  const handleContainerTouchEnd = useCallback(() => {
    // 清除长按计时器
    if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
        
        // 如果没有触发长按（即点击），处理点击事件
        // 这里的逻辑：如果有 touchStart 记录且没有 dragging，说明是点击
        if (touchStartRef.current && draggingIndexRef.current === null) {
             // 简单的点击检测逻辑复用 start 里的 hit test 或者直接不管
             // 为了简化，我们假设 DesignCanvas 主要用于拖拽，点击逻辑可以在这里补充
             // 但原需求是“点击弹窗”，这里我们简单处理：如果没拖拽，且在原位置附近松手，视为点击
             // 重新进行一次 hit test 找到点击的珠子
             const startX = touchStartRef.current.x * rpxRatio
             const startY = touchStartRef.current.y * rpxRatio
             
             // ... Hit test logic ...
             // 由于篇幅，这里暂略，如果用户需要点击详情，可以在这里加
             // 实际上，如果长按没触发，我们可以在这里触发 handleBeadClick
             
             // 重新 Hit Test
             const currentVisuals = visualBeadsRef.current
             for (let i = 0; i < currentVisuals.length; i++) {
                 const beadState = currentVisuals[i]
                 const bead = bracelet.beads[i]
                 const size = getBeadSize(bead) * scaleFactor
                 const dx = startX - beadState.x
                 const dy = startY - beadState.y
                 if (Math.sqrt(dx*dx + dy*dy) <= size/2 * 1.2) {
                     handleBeadClick(i)
                     break
                 }
             }
        }
    }
    
    touchStartRef.current = null

    if (draggingIndexRef.current !== null) {
        const draggingIdx = draggingIndexRef.current
        
        // 获取最后的触摸位置（原始坐标，无Y轴偏移）
        // 如果没有移动过（比如长按后直接松手），使用 touchStartRef
        let rawX = 0
        let rawY = 0
        
        if (lastMoveRef.current) {
            rawX = lastMoveRef.current.x
            rawY = lastMoveRef.current.y
        } else if (touchStartRef.current) {
            rawX = touchStartRef.current.x
            rawY = touchStartRef.current.y
        }

        const finalX = rawX * rpxRatio
        const finalY = rawY * rpxRatio
        
        // 取消选中状态
        setDraggingIndex(null)
        draggingIndexRef.current = null
        lastMoveRef.current = null
        
        // 计算松手位置的角度（使用原始触摸点）
        const dx = finalX - centerOffset
        const dy = finalY - centerOffset
        // Math.atan2 返回 (-PI, PI]，0 是右边(3点)
        let angle = Math.atan2(dy, dx)
        
        // 转换为从 -PI/2 (12点) 开始的角度 [0, 2PI)
        let normalizedAngle = angle + Math.PI / 2
        if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI
        
        // 计算新的排序 - 使用“最近邻”算法
        // 1. 获取其他珠子的视觉位置信息
        // 注意：我们需要使用 visualBeadsRef 来获取当前视觉角度，这样更符合用户直觉
        // 但是 visualBeads 的索引是对应 bracelet.beads 的
        const otherBeadsVisuals: { originalIndex: number, x: number, y: number, angle: number }[] = []
        
        visualBeadsRef.current.forEach((visual, index) => {
            if (index !== draggingIdx) {
                otherBeadsVisuals.push({
                    originalIndex: index,
                    x: visual.x,
                    y: visual.y,
                    angle: visual.angle
                })
            }
        })
        
        let insertIndex = draggingIdx
        
        if (otherBeadsVisuals.length > 0) {
            // 2. 找到最匹配的【缝隙】
            // 之前的算法是找最近的珠子，但在大小珠子混排时，小珠子可能因为距离大珠子表面远而被忽略
            // 尤其是当两个大珠子紧挨着时，它们之间的缝隙很小，小珠子很难插进去
            
            // 新策略：计算所有相邻珠子对构成的“缝隙”，看手指落在哪个缝隙的判定范围内
            
            // 按照角度排序 otherBeadsVisuals，确保是顺序的圆环
            otherBeadsVisuals.sort((a, b) => a.angle - b.angle)
            
            let bestInsertIndex = -1
            let minGapDist = Infinity
            
            // 遍历所有缝隙（包括首尾相接）
            const len = otherBeadsVisuals.length
            
            // 修正：如果只有一个珠子（移除拖拽珠子后），缝隙应该在其对面
            if (len === 1) {
                const current = otherBeadsVisuals[0]
                const midAngle = current.angle + Math.PI
                // 只有一个缝隙，插在它后面（即 index 1，或者是 0，视作环形相同）
                bestInsertIndex = 1 
            } else {
                for (let i = 0; i < len; i++) {
                    const current = otherBeadsVisuals[i]
                    const next = otherBeadsVisuals[(i + 1) % len]
                    
                    // 1. 计算缝隙的“中心点”
                    // 使用向量平均法，避免角度跨越 2PI 的计算问题
                    const midX = (Math.cos(current.angle) + Math.cos(next.angle)) / 2
                    const midY = (Math.sin(current.angle) + Math.sin(next.angle)) / 2
                    
                    let midAngle
                    const lenSq = midX * midX + midY * midY
                    // 处理180度对角的情况（向量模长接近0）
                    if (lenSq < 0.0001) {
                        let diff = next.angle - current.angle
                        if (diff < 0) diff += 2 * Math.PI
                        midAngle = current.angle + diff / 2
                    } else {
                        midAngle = Math.atan2(midY, midX)
                    }
                    
                    // 计算缝隙中心点的坐标
                    const realGapX = centerOffset + effectiveRadius * Math.cos(midAngle)
                    const realGapY = centerOffset + effectiveRadius * Math.sin(midAngle)
                    
                    // 2. 计算手指到这个“缝隙点”的距离
                    const distToGapX = finalX - realGapX
                    const distToGapY = finalY - realGapY
                    const distToGap = Math.sqrt(distToGapX * distToGapX + distToGapY * distToGapY)
                    
                    // 优化小珠子插入大珠子的逻辑：
                    // 我们不仅要看“距离缝隙中心有多远”，还要看“这个距离是否小于缝隙本身的宽度”？
                    // 或者说，如果两颗珠子挨得很近，缝隙中心在它们接触点。
                    // 只要手指离这个接触点最近，就应该插入。
                    
                    if (distToGap < minGapDist) {
                        minGapDist = distToGap
                        bestInsertIndex = i + 1
                    }
                }
                
                // ----------------------------------------------------------------
                // 优化：大缺口判定 (Large Gap Detection)
                // 仅当 minGapDist 比较大（说明没选中任何紧密缝隙）时，或者明确落在首尾区间时才触发？
                // 如果我们无条件优先“大缺口判定”，那么当首尾缝隙很大时（比如半圆空着），
                // 任何在半圆区域的操作都会被吸附到首尾，导致无法精确插入到首尾珠子与其他珠子之间的缝隙？
                // 不，首尾区间是 (last, first)。
                // 如果我要插在 first 和 second 之间。那是 gap 0.
                // gap 0 不在大缺口区间内。
                
                // 但是！如果 normalizedAngle 算出来有些偏差，或者“大缺口区间”的判定太宽泛？
                // 现在的判定是：只要 angle 在 (last, first) 之间，就强制吸附。
                
                // 问题可能出在：当我们在大珠子之间插入小珠子时，手指可能实际上处于“圆内”或“圆外”较远的地方，
                // 但角度上是在这两个大珠子之间。
                // 如果这两个大珠子正好是 First 和 Last（比如只有两颗大珠子），那没问题。
                // 如果是中间的两个大珠子，Gap Span 很小，不会触发 Large Gap Logic。
                
                // 那为什么用户说“小珠子插入不了大直径珠子中间”？
                // 可能是因为 minGapDist 的计算回退到了“中心点距离”。
                // 之前我用过“边缘距离” (Edge Distance) 逻辑，后来在实现“缝隙中心点”逻辑时去掉了。
                // 对于大珠子，缝隙中心点（切点）离珠子表面很近。
                // 但如果两颗大珠子半径很大，中心点在它们中间。
                // 如果我手指点在大珠子的“肚子”上（偏离切点），距离切点就远了。
                
                // 让我们恢复“边缘距离”的辅助判断？
                // 不，缝隙中心点逻辑应该是最准的，因为它直接对应插入位置。
                
                // 让我们看看 Large Gap Logic 是否误判。
                // if (gapSpan > 20 deg).
                // 如果是满串（或接近满串），Gap Span 很小，不会触发。
                // 所以对于满串插入，Large Gap Logic 不生效。
                // 问题出在 Loop 里的 minGapDist 比较。
                
                // 回顾之前的“边缘距离”逻辑：
                // 当我们找“最近珠子”时，大珠子因为半径大，边缘离手指近，容易被选中。
                // 但现在的逻辑是找“缝隙中心”。
                // 缝隙中心是几何点。
                // 无论珠子大小，缝隙中心都在那里。
                // 所以理论上没问题。
                
                // 那为什么不行？
                // 可能是因为大珠子把“缝隙中心”挡住了？视觉上？
                // 不，手指是点。
                
                // 可能是因为大珠子占据了很大的角度。
                // 比如 A(0), B(45). Gap at 22.5.
                // 如果我点在 10 度（A 的身上）。
                // dist to 22.5 is X.
                // dist to -22.5 (prev gap) is Y.
                // 如果 X < Y，就插在 A-B 之间。
                // 这似乎没问题。
                
                // 等等，用户说的是“大直径珠子中间”。
                // 暗示：有两颗大珠子，想插在它们中间。
                // 如果这两颗大珠子紧紧挨着。Gap 很小。
                // 比如 A(0), B(20). Gap at 10.
                // 手指点在 10. dist is small.
                // 应该能选中。
                
                // 除非... 有另一个 Gap 离得更近？
                // 比如 C 是小珠子。
                // 如果 A, B 是大珠子，C, D 是小珠子。
                // 也许大珠子的视觉干扰导致用户点的不是 10，而是 15？
                
                // 让我们再看一眼 Large Gap Logic。
                // 如果 Gap Span > 20度。
                // 如果我在插值时，不小心触发了 Large Gap Logic？
                // 只有当 len 比较小，或者还没排满时，Gap Span 才会大。
                // 如果是排满的，Gap Span 应该接近 0 或负数（重叠）。
                // 此时 gapSpan += 2PI 也会很小（如果重叠）。
                // 比如 first=10, last=350 (-10). span=20.
                // 20度 = 0.34 rad.
                // 刚好 20 度。
                
                // 如果 Gap Span 很大，说明确实有空地。
                // 此时强制吸附到空地是合理的。
                
                // 那么问题出在“小珠子插入大珠子”时，并没有触发 Large Gap，而是走的 minGapDist。
                // 为什么 minGapDist 选不中？
                
                // 让我们把 minGapDist 的判定加一个“吸附半径”？
                // 或者，我们不仅比较 dist，还比较角度差？
                
                // 实际上，之前的“最近邻珠子”算法（Nearest Neighbor）配合“左右方向判断”其实对大小珠子混排挺好用的。
                // 现在的“最近缝隙”算法（Nearest Gap）在几何上更纯粹。
                
                // 让我们结合两者？
                // 计算手指到 Gap 的距离。
                // 同时，如果手指在大珠子 A 的范围内（Hit Test），我们应该认为它在 A 的附近。
                // 之前的 Hit Test 只是用来判断“选中”。
                // 现在是 Drag End。
                
                // 让我们尝试优化 Gap 距离计算：
                // 不仅计算到 Gap Center 的距离。
                // 还要考虑手指是否在 Gap 的“扇区”内。
                
                // 简单的优化：
                // 如果 minGapDist 算出来的最佳缝隙距离很远（比如 > 100px），
                // 但我们在 Large Gap 区间内，那就优先 Large Gap。
                // 但现在 Large Gap 是无条件优先。
                // 如果 Large Gap 判定了 true，bestInsertIndex 就被改写了。
                
                // 难道是大珠子之间被误判为 Large Gap？
                // 不可能，Large Gap 是 Last 和 First 之间的。
                // 除非大珠子就是 Last 和 First。
                // 比如 A, B, C, D. A=First, D=Last.
                // 如果 A 和 D 是大珠子。
                // 它们之间的 Gap 是 Last->First.
                // 如果我想插在 B 和 C 之间（它俩也是大珠子）。
                // 此时 angle 在 B, C 之间。
                // 肯定不在 Last->First 区间内。
                // 所以 Large Gap Logic 不会触发。
                
                // 那为什么 B, C 之间插不进去？
                // 只能是 minGapDist 算错了，或者别的 Gap 更近。
                
                // 让我们回退到“边缘距离”的概念？
                // 现在的 Gap Center 是 (A+B)/2.
                // 假设 A, B 半径 50. 中心距 100. Gap Center 在切点。
                // 假设 C, D 半径 10. 中心距 20. Gap Center 在切点。
                // 两个 Gap Center 都在圆周上。
                // 无论珠子大小，Gap Center 都在 effectiveRadius 的圆周上。
                // 所以珠子大小不影响 Gap Center 的位置。
                
                // 唯一的影响是：视觉上。
                // 大珠子的切点被珠子本身包围。
                // 小珠子的切点比较暴露。
                // 用户可能倾向于点在“空地”上。
                // 大珠子之间没有空地（视觉上）。用户必须点在两颗珠子接触的地方（也就是珠子身上）。
                // 如果用户点在珠子身上，finalX, finalY 就在 Gap Center 附近。
                // 应该能选中。
                
                // 除非... `effectiveRadius` 算错了？
                // calculateStandardLayout 用的 effectiveRadius。
                // 我们计算 Gap Center 也用的 effectiveRadius。
                // 一致的。
                
                // 有没有可能是 `draggingBead` 的遮挡？
                // 用户拖着一个小珠子，盖住了大珠子的缝隙。
                // 用户以为对准了。
                
                // 让我们尝试把 minGapDist 的计算逻辑改成“角度差”？
                // 因为都在圆环上，距离差其实就是角度差。
                // 直接找 angle 最接近 midAngle 的缝隙。
                // 这样就完全忽略了径向距离（内外径）。
                // 只要角度对上就行。
                
                // 之前的 distToGap 是欧氏距离。
                // 如果我点在圆心，所有 Gap 的距离都差不多（半径）。
                // 可能会随机选一个。
                // 如果我点在圆外，也差不多。
                // 只有点在圆环线上，区别才明显。
                
                // 这是一个潜在问题！
                // 如果用户拖拽时，手指在圆环内部（半径较小处）。
                // 比如 R=150. 手指在 R=50 处。
                // 此时到所有 Gap Center (R=150) 的距离都大约是 100~160.
                // 差异不明显，容易误判。
                
                // **解决方案**：
                // 改用纯角度比较！
                // 计算手指的角度 angle。
                // 遍历所有 Gap，计算 Gap MidAngle。
                // 找 |angle - MidAngle| 最小的那个 Gap。
                
                // 这样无论手指在圆心还是圆外，只要角度对准了缝隙，就一定能选中。
                // 且不受珠子大小影响（因为 Gap Center 只是角度）。
                
                // 验证 Large Gap Logic：
                // Large Gap Logic 本质上也是角度判定（区间判定）。
                // 如果我们把所有 Gap 都看作角度点。
                // Large Gap 只是一个特别宽的 Gap。
                // 它的“中心点”角度可能离手指远，但因为宽，所以只要在区间内就算。
                
                // 所以：
                // 1. 保留 Large Gap Logic 处理首尾大空地（区间判定）。
                // 2. 对于普通缝隙，改用“最小角度差”判定，而不是欧氏距离判定。
                
                // 实施：
                // 遍历所有 Gap。
                // 计算 Gap MidAngle.
                // 计算 Diff = |normalizedAngle - MidAngle|. (Handle Wrap).
                // 找 minDiff.
                
                let bestGapDiff = Infinity
                
                for (let i = 0; i < len; i++) {
                    // ... midAngle calculation ...
                    const current = otherBeadsVisuals[i]
                    const next = otherBeadsVisuals[(i + 1) % len]
                    
                    // 向量法算出的 midAngle 是 (-PI, PI]
                    // 需要归一化到 [0, 2PI) 以便和 normalizedAngle 比较
                    // 或者统一用 atan2 的值比较（处理好 wrap）
                    
                    const midX = (Math.cos(current.angle) + Math.cos(next.angle)) / 2
                    const midY = (Math.sin(current.angle) + Math.sin(next.angle)) / 2
                    
                    let midAngle
                    const lenSq = midX * midX + midY * midY
                    if (lenSq < 0.0001) {
                        let diff = next.angle - current.angle
                        if (diff < 0) diff += 2 * Math.PI
                        midAngle = current.angle + diff / 2
                    } else {
                        midAngle = Math.atan2(midY, midX)
                    }
                    
                    // 归一化 midAngle 到 [0, 2PI)
                    // normalizedAngle 已经是 [0, 2PI) (基于 -PI/2 ? 不，基于 12点)
                    // Wait, handleContainerTouchEnd 里：
                    // let angle = Math.atan2(dy, dx)
                    // let normalizedAngle = angle + Math.PI / 2
                    // 这把 -PI/2 (Top) 变成了 0.
                    // 所以 normalizedAngle 0 是 12点。
                    
                    // 而 otherBeadsVisuals[i].angle 是 calculateStandardLayout 算出来的。
                    // accumulatedAngle = -PI/2.
                    // cos(angle).
                    // 所以 visual.angle 是标准极坐标 (-PI/2 是 Top).
                    // 所以 midAngle 也是标准极坐标。
                    // 我们需要把 midAngle 也转换成 "12点为0" 的坐标系，才能和 normalizedAngle 比较。
                    
                    let normalizedMidAngle = midAngle + Math.PI / 2
                    if (normalizedMidAngle < 0) normalizedMidAngle += 2 * Math.PI
                    normalizedMidAngle = normalizedMidAngle % (2 * Math.PI)
                    
                    // 计算角度差
                    let diff = Math.abs(normalizedAngle - normalizedMidAngle)
                    if (diff > Math.PI) diff = 2 * Math.PI - diff
                    
                    if (diff < bestGapDiff) {
                        bestGapDiff = diff
                        bestInsertIndex = i + 1
                    }
                }
            }
                
                // 这样改之后，Large Gap Logic 还需要吗？
                // 纯角度比较会找“最近的中心点”。
                // 如果 Gap 很大（比如 180度），中心点在中间。
                // 如果我点在 Gap 的边缘（靠近 Last），离中心点 90度。
                // 离 Last-1 的 Gap 可能只有 20 度。
                // 于是会被吸附到 Last-1。
                // 这就是为什么需要 Large Gap Logic（区间判定）。
                // 区间判定保证只要在 Gap 范围内，就算 Gap Center 很远，也优先选中。
                
                // 所以：纯角度比较 + Large Gap Logic 是完美组合。
                
            if (bestInsertIndex > len) bestInsertIndex = 0
            
            // 关键修正：如果 bestInsertIndex === len，对于 splice 来说是插在末尾。
            // 但在圆环中，插在末尾和插在开头（index 0）视觉上是一样的。
            // 然而，如果用户想把珠子放在“最后一个珠子之后”，我们应该允许 index = len。
            // 但如果之前的 bug 是“无法插在最后”，可能是因为后续逻辑把 len 变成了 0？
            // 或者 onBeadMove 限制了？
            
            // 让我们看看之前的逻辑：
            // if (bestInsertIndex >= len + 1) bestInsertIndex = 0
            // 如果 len=4, i=3 (last), best=4. 4 >= 5 is false. best=4. Correct.
            
            // 那为什么不行？
            // 可能是 otherBeadsVisuals 的排序问题？
            // 假设 [A, B, C]. Angles: 0, 2, 4. (Rad)
            // Gap(C, A): (4+0)/2 + PI = 2 + 3.14 = 5.14. Correct.
            // If touch is near 5.14, minGapDist is small.
            // i=2 (C). best = 3.
            
            // 会不会是 insertIndex 的后续处理？
            // insertIndex = bestInsertIndex
            
            // onBeadMove(draggingIdx, insertIndex)
            // 假设 draggingIdx=0. insertIndex=3.
            // onBeadMove(0, 3).
            // 如果 onBeadMove 实现是 splice，那结果是：
            // remove 0 (A). list: [B, C].
            // insert at 3? list len is 2. 3 > 2.
            // 通常 splice 允许 index > len，直接追加到末尾。
            // 但如果 insertIndex 是基于 otherBeads 的索引（长度 len），
            // 那么有效索引是 0 到 len。
            // 所以 3 是合法的（追加）。
            
            // 让我们再检查一下 onBeadMove 的调用条件：
            // if (draggingIdx !== insertIndex)
            
            // Case: [A, B, C, D]. Drag A (0).
            // other: [B, C, D].
            // Want to insert after D.
            // other visual sorted: B, C, D.
            // Gap D-B. i=2 (D). best = 3.
            // insertIndex = 3.
            // draggingIdx(0) !== 3. True.
            // onBeadMove(0, 3).
            // Result: B, C, D, A.
            
            // 看起来逻辑是对的。
            // 难道是 onBeadMove 内部有什么限制？
            // 或者 React 渲染 key 的问题？
            
            // 还有一种可能：visualBeadsRef 的数据没更新？
            // 或者 calculateCirclePosition 计算的角度有问题？
            
            // 让我们强制允许插在最后，并且确保 sort 是正确的。
            // 还有一种可能是“缝隙”判定有问题，特别是跨越 0/2PI 的那个缝隙。
            // Math.abs(current.angle - next.angle) > Math.PI
            // 如果一个是 6.2 (almost 2PI), 一个是 0.1. Diff = 6.1 > 3.14. True.
            // Mid = (6.2+0.1)/2 + PI = 3.15 + 3.14 = 6.29 (> 2PI).
            // Mid % 2PI = 0.00something.
            // 就在 0 度附近。
            
            // 如果手指在 0 度附近（顶部），应该选中这个缝隙。
            
            insertIndex = bestInsertIndex
            
            // 额外的修正：
            // 如果 bestInsertIndex == len，说明是在最后一个和第一个之间。
            // 这种情况下，到底是插在队尾（index=len）还是队头（index=0）？
            // 视觉上没区别。但在数据上，如果用户习惯顺时针操作，插在 D 后面就是队尾。
            // 如果用户习惯逆时针，插在 B 前面就是队头（如果 B 是第一个）。
            // 但我们的循环是 i=0(B) ... i=last(D)。
            // Gap(D, B) 是最后一个 gap。
            // 对应的 index 是 len。
            
            // 唯一的问题可能是：如果 draggingIdx 原本就是最后一个，或者接近最后一个。
            // 比如 [A, B, C, D]. Drag D(3).
            // other: [A, B, C].
            // Insert after C? i=2. best=3.
            // insertIndex=3.
            // draggingIdx(3) === insertIndex(3).
            // onBeadMove 不触发！
            
            // 等等，如果 D 原本在最后，插在最后，那确实不用动。
            // 但如果我想把 A 移到最后？
            // Drag A(0). other [B, C, D].
            // Insert after D. best=3.
            // 0 !== 3. Trigger move. Correct.
            
            // 那为什么用户说“不行”？
            // 可能是因为 calculateCirclePosition 的起始角度是 -PI/2 (顶部)。
            // 而我们的 sort 是基于这个角度的。
            // 数组的第一个元素通常在 -PI/2 附近。
            // 数组的最后一个元素在 -PI/2 - epsilon (也就是 2PI - PI/2 = 3/2 PI 附近)。
            
            // 如果我把珠子拖到顶部（-PI/2），这正好是 Gap(Last, First)。
            // 也就是 Gap(D, A)。
            // 这个 Gap 对应的 index 是 len (因为循环到 i=len-1 (D) 时处理这个 gap)。
            // 所以应该返回 len。
            
            // 除非... otherBeadsVisuals 的顺序不是 [A, B, C] 而是别的？
            // 比如 [C, A, B]？
            // sort 会把它排好。
            // 假设排好后是 [A, B, C]。
            // Gap(C, A) 是最后一个。
            // index = 3.
            
            // 有没有可能是角度归一化的问题？
            // calculateCirclePosition: accumulatedAngle starts at -PI/2.
            // loop adds beadSize/radius.
            // So angles are increasing: -1.57, -1.0, -0.5 ...
            // visual.angle 是 raw angle。
            // 但在 handleContainerTouchEnd 里：
            // normalizedAngle = angle + PI/2.
            // 我们比较的 visual.angle 是原始的吗？
            // otherBeadsVisuals.push({ angle: visual.angle })
            // 这里的 visual.angle 是 DesignCanvas state 里的。
            // calculateStandardLayout: angle: currentBeadAngle.
            // currentBeadAngle = accumulatedAngle + ...
            // accumulatedAngle starts at -PI/2.
            // 所以 visual.angle 是 [-PI/2, 3/2PI) 范围的。
            
            // 而我们计算 Gap 时：
            // midAngle = (cur + next)/2
            // cos(midAngle).
            // 这里直接用了 cos，意味着 midAngle 应该是“标准极坐标角度”（0=右）。
            // 但 visual.angle 是“布局角度”（-PI/2=顶）。
            // 等等，calculateCirclePosition 里：
            // x = center + r * cos(angle).
            // 这说明 visual.angle 就是传给 cos 的参数，也就是标准极坐标角度！
            // 只要 accumulatedAngle 是按这个逻辑算的。
            // accumulatedAngle = -PI/2.
            // 没错，所以 visual.angle 就是标准极坐标角度。
            
            // 那我们的 sort (a.angle - b.angle) 是按数值排序。
            // -1.57 (Top), -1.0, 0 (Right), 1.57 (Bottom), 3.14 (Left).
            // 范围大致是 -PI/2 到 3/2PI。
            // sort 是没问题的。
            
            // 问题可能出在“最后一个缝隙”的判断。
            // 最后一个缝隙是 Last(i=len-1) 和 First(next=0) 之间。
            // Last angle approx 3/2 PI (4.71).
            // First angle approx -PI/2 (-1.57).
            // Diff = 4.71 - (-1.57) = 6.28 > PI.
            // Mid = (4.71 - 1.57) / 2 + PI = 1.57 + 3.14 = 4.71.
            // Wait. (A+B)/2.
            // 4.71 + (-1.57) = 3.14. /2 = 1.57.
            // 1.57 + 3.14 = 4.71 (Bottom???)
            // 不对，Top is -1.57. Last is near Top (from left), so close to -1.57 + 2PI = 4.71.
            // Gap center should be near -1.57 (Top).
            
            // Let's verify mid angle calculation.
            // A = 4.7 (approx 3/2 PI). B = -1.5 (approx -PI/2).
            // A - B = 6.2 > PI.
            // Mid = (4.7 - 1.5)/2 + PI = 1.6 + 3.14 = 4.74.
            // 4.74 is approx 3/2 PI. Which is Top?
            // No, 3/2 PI is Bottom (270 deg)?
            // 0=Right. PI/2=Bottom. PI=Left. 3/2PI=Top.
            // Wait.
            // cos(-PI/2) = 0, sin(-PI/2) = -1. (0, -r). TOP. Correct.
            // cos(3/2PI) = 0, sin(3/2PI) = -1. TOP. Correct.
            
            // So -1.57 and 4.71 are the same physical angle.
            // The gap between them should be at that angle.
            // (4.71 + (-1.57)) / 2 = 1.57.
            // 1.57 is Bottom (PI/2). WRONG.
            
            // If we simply avg: (-1.57 + 4.71)/2 = 1.57. This is the midpoint on the "long" side.
            // We want the midpoint on the "short" side (crossing 0/2PI boundary? No, crossing the cut).
            
            // Actually, since our angles are linear from -PI/2 increasing...
            // First is -1.57. Last is 4.71.
            // The gap is wrapping around.
            // We need to normalize them to be close?
            // Or just handle the wrap explicitly.
            
            // If Diff > PI, we add PI to the average.
            // Average = 1.57. Add PI = 4.71.
            // 4.71 is Top. Correct.
            
            // So the math seems ok.
            
            // But wait, midAngle normalization:
            // midAngle = midAngle % (2PI).
            // 4.71 % 6.28 = 4.71.
            // realGapX = cos(4.71) = 0.
            // realGapY = sin(4.71) = -1.
            // Top. Correct.
            
            // So gap calculation is correct.
            
            // Why does it fail?
            // Maybe because "bestInsertIndex = i + 1" for the last element sets it to len.
            // And maybe len is not handled correctly somewhere else?
            
            // Or maybe sort logic is flawed if angles are not in (-PI/2, 3/2PI) range?
            // calculateStandardLayout: accumulatedAngle starts -PI/2.
            // It increases monotonically.
            // If total angle > 2PI (overlap), then sorting by value is tricky.
            // But for a bracelet, total angle < 2PI usually.
            
            // Let's look at the implementation of Loop.
            // for (let i = 0; i < len; i++) {
            //   current = visuals[i];
            //   next = visuals[(i+1)%len];
            // }
            // This covers all gaps.
            // i=len-1. current=Last. next=First.
            // This is the wrap-around gap.
            // If chosen, bestInsertIndex = len.
            
            // Is it possible that "otherBeadsVisuals" includes the dragging bead?
            // No, filtered.
            
            // Maybe the issue is purely visual/feedback?
            // Or maybe "onBeadMove" logic.
            // The user says "cannot insert". Does it mean it snaps back? Or nothing happens?
            
            // Let's add a small bias for the last gap?
            // Or maybe the loop condition?
            
            // Wait, I see "bestInsertIndex = i + 1".
            // If i = len - 1. index = len.
            // This index is valid for insertion into "otherBeads".
            // otherBeads has length "len".
            // index "len" means append.
            
            // Let's assume the user drags A(0) to the end (after C).
            // other: [B, C]. len=2.
            // sorted: B, C.
            // i=0: Gap B-C. index=1. Result: B, A, C. (Middle)
            // i=1: Gap C-B (Wrap). index=2. Result: B, C, A. (End).
            
            // If I drag A to the very top (gap C-B).
            // It should pick i=1. index=2.
            
            // Maybe the distance calculation favors the other gap?
            // Gap B-C is at bottom. Gap C-B is at top.
            // If I drag to top, dist to Gap C-B is 0.
            // Should pick i=1.
            
            // I suspect the issue might be `onBeadMove` implementation in the parent component?
            // DesignCanvas is just UI.
            // If `onBeadMove(0, 2)` is called, does the parent handle it correctly?
            // The user said "debug... cannot insert".
            // Implies the UI doesn't reflect it.
            
            // Let's check `handleContainerTouchEnd` again.
            // It calls `startAnimation` immediately after `onBeadMove`.
            // `startAnimation` uses `newBeadsList` which is constructed locally:
            // `newBeadsList.splice(insertIndex, 0, draggingBead)`
            // If insertIndex is 2. `[B, C].splice(2, 0, A)` -> `[B, C, A]`.
            // The animation should show A moving to the end.
            
            // If the animation works but then it snaps back, it's `onBeadMove` issue.
            // If the animation targets the wrong place, it's `insertIndex` issue.
            
            // If the user says "cannot insert", maybe they mean the bead refuses to go there visually?
            
            // Let's double check the `midAngle` logic.
            // If `Math.abs(current.angle - next.angle) > Math.PI`
            // Case: Last=4.7, First=-1.5. Diff=6.2.
            // mid = (3.2)/2 = 1.6 (Bottom).
            // + PI = 4.74 (Top).
            // This seems correct.
            
            // What if Last=4.7, First=4.8 (if First is shifted by 2PI)?
            // No, sorted by raw value.
            // Range is -1.57 to ~4.71.
            
            // Maybe the issue is: `midAngle` calculation for the wrap-around gap is unstable?
            // Let's use vector averaging instead of angle averaging to be safe.
            // MidX = (x1 + x2) / 2
            // MidY = (y1 + y2) / 2
            // Angle = atan2(MidY, MidX).
            // This is always the correct angle for the midpoint of the chord.
            // Then realGapX = R * cos(Angle).
            
            // This avoids all "mod 2PI" and "cross 0" confusion.
            // 但我们需要返回的是在 otherBeads (未排序，按 originalIndex 顺序?) 里的索引吗？
            // 不，onBeadMove 需要的是 index。
            // 此时 otherBeadsVisuals 是按角度排序的，这代表了视觉上的顺序。
            // 实际上，bracelet.beads 的顺序应该就是视觉顺序（因为我们是按顺序渲染的）
            // 除非 visualBeadsRef 里的 angle 乱了，或者 calculateCirclePosition 没按顺序排
            // 检查 calculateCirclePosition：它是按 beads 数组顺序累加角度的。
            // 所以 bracelet.beads 的顺序 = 视觉顺序。
            // 所以 otherBeadsVisuals.sort 其实没改变顺序，除非数组本身就乱了（不太可能）
            // 但为了保险，我们假设 visual 顺序就是 array 顺序。
            
            // 如果 array 顺序 = visual 顺序，那么 i+1 就是正确的 insertIndex
            
            // 验证：originalIndex 是否递增？
            // 正常情况下是的。
            
            insertIndex = bestInsertIndex
            
            // 如果 minGapDist 还是很大（比如在圆心），可能需要兜底逻辑
            // 但通常总会有一个最近的缝隙
        }
        
        // 3. 重排数据
        // 注意：这里的 insertIndex 是在包含自身的数组中的位置，还是移除后的？
        // 实际上，我们应该看它相对于其他珠子的位置。
        // 上面的 sectorAngle 是基于 total 的，所以得到的是“它应该在第几个位置”
        
        // 3. 重排数据
        
        // ----------------------------------------------------------------
        // 动画层：平滑重排
        // ----------------------------------------------------------------
        
        // 1. 构造新的 bead 数组（预测）
        // 重新获取 otherBeads，因为之前可能没定义或者作用域问题
        const otherBeads = bracelet.beads.filter((_, i) => i !== draggingIdx)
        const newBeadsList = [...otherBeads]
        const draggingBead = bracelet.beads[draggingIdx]
        newBeadsList.splice(insertIndex, 0, draggingBead)
        
        // 2. 计算目标坐标 (Target Coordinates)
        const targetLayout = calculateStandardLayout(newBeadsList)
        
        // 3. 映射回当前的 visualBeads 顺序
        // 因为 visualBeads 的索引是对应 bracelet.beads 的（在数据更新前）
        // 我们需要知道：原来的第 i 个珠子，现在的目标位置在哪里
        // 原始：A(0), B(1), C(2). Drag B to 0.
        // 新：B, A, C.
        // Target Layout: [Pos0(B), Pos1(A), Pos2(C)]
        // B(原1) -> Target[0]
        // A(原0) -> Target[1]
        // C(原2) -> Target[2]
        
        // 建立 ID 映射
        const beadIdToTargetMap = new Map()
        newBeadsList.forEach((bead, idx) => {
            beadIdToTargetMap.set(bead.id, targetLayout[idx])
        })
        
        const targets = bracelet.beads.map(bead => beadIdToTargetMap.get(bead.id))
        
        // 4. 启动动画循环
        startAnimation(targets, () => {
             // 触发数据更新 (onBeadMove) - 延迟到动画结束
             if (draggingIdx !== insertIndex) {
                  onBeadMove(draggingIdx, insertIndex)
             }
        })
    }
  }, [bracelet.beads, centerOffset, calculateStandardLayout, onBeadMove, handleBeadClick, rpxRatio, getBeadSize, scaleFactor])

  // 动画循环逻辑
  const startAnimation = (targets: VisualBeadState[], onComplete?: () => void) => {
      setIsAnimating(true)
      
      const animate = () => {
          let allSettled = true
          const currentVisuals = visualBeadsRef.current
          const nextVisuals = currentVisuals.map((current, i) => {
              const target = targets[i]
              if (!target) return current // Should not happen
              
              // 插值计算：靠近 10%
              const dx = target.x - current.x
              const dy = target.y - current.y
              const da = target.angle - current.angle // 角度也插值？可以，但坐标够了
              
              // 如果距离很小，直接到位
              if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
                  return { ...target, opacity: 1, scale: 1 } // 恢复不透明和大小
              }
              
              allSettled = false
              return {
                  ...current,
                  x: current.x + dx * 0.2, // 20% 速度，稍微快点
                  y: current.y + dy * 0.2,
                  angle: target.angle, // 角度直接到位，或者也插值
                  opacity: 1, // 动画中恢复透明度
                  scale: 1
              }
          })
          
          setVisualBeads(nextVisuals)
          visualBeadsRef.current = nextVisuals
          
          if (!allSettled) {
              animationFrameRef.current = requestAnimationFrame(animate)
          } else {
              try {
                if (onComplete) onComplete()
              } finally {
                setIsAnimating(false)
                animationFrameRef.current = null
              }
          }
      }
      
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = requestAnimationFrame(animate)
  }
  
  // 清理动画
  useEffect(() => {
      return () => {
          if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      }
  }, [])



  // 如果手串为空，显示引导提示
  if (!bracelet.beads || bracelet.beads.length === 0) {
    return (
      <View className='design-canvas design-canvas--empty'>
        <View className='design-canvas__setting-btn' onClick={onSettingClick}>
          <Text className='setting-icon'>⚙️</Text>
          <Text className='setting-text'>手围设置</Text>
        </View>

        <View className='design-canvas__empty-content'>
          <View className='design-canvas__empty-icon'>📿</View>
          <Text className='design-canvas__empty-text'>还没有添加珠子哦</Text>
          <Text className='design-canvas__empty-desc'>点击下方珠子开始设计</Text>
        </View>
      </View>
    )
  }

  return (
    <>
      <View className='design-canvas'>
        <View className='design-canvas__setting-btn' onClick={onSettingClick}>
          <Text className='setting-icon'>⚙️</Text>
          <Text className='setting-text'>手围设置</Text>
        </View>

        <View className='design-canvas__container'>
          <View 
            className='design-canvas__beads design-canvas__beads--circle'
            style={{ 
              width: `${canvasSize}rpx`, 
              height: `${canvasSize}rpx` 
            }}
            // 绑定容器级触摸事件
            onTouchStart={handleContainerTouchStart}
            onTouchMove={handleContainerTouchMove}
            onTouchEnd={handleContainerTouchEnd}
            catchMove // 阻止事件穿透
          >
            <View className='design-canvas__string' />
            
            {/* 绘制层：仅根据 visualBeads 数据绘制 */}
            {visualBeads.map((visual, index) => {
                const bead = bracelet.beads[index]
                if (!bead) return null
                
                const size = getBeadSize(bead) * scaleFactor
                const optimizedImageUrl = getOptimizedImageUrlSync(bead.imageUrl, ImageSize.THUMBNAIL, webpSupported)
                
                // 获取稳定的 key
                // 现在的 bead.id 已经是唯一的了
                const visualKey = bead.id || `unknown-${index}`
                
                return (
                    <View
                        key={visualKey}
                        className='design-canvas__bead'
                        style={{
                            width: `${size}rpx`,
                            height: `${size}rpx`,
                            position: 'absolute',
                            left: `${visual.x}rpx`,
                            top: `${visual.y}rpx`,
                            transform: `translate(-50%, -50%) rotate(${(visual.angle * 180 / Math.PI) + 90}deg) scale(${visual.scale})`,
                            opacity: visual.opacity,
                            // 移除 CSS transition
                            transition: 'none',
                            zIndex: index === draggingIndex ? 10 : 1
                        }}
                    >
                        <Image
                          className='design-canvas__bead-image'
                          src={optimizedImageUrl}
                          mode='aspectFill'
                          webp={webpSupported}
                          onError={() => handleImageError(index)}
                        />
                         {/* 选中指示器 - 仅在点击选中模式显示，这里简化为 scale/opacity 区分 */}
                         {selectedBeadIndex === index && <View className='design-canvas__bead-selected-indicator' />}
                    </View>
                )
            })}
          </View>

          <View className='design-canvas__info'>
            <Text className='design-canvas__info-text'>
              已添加 {bracelet.beads.length} 颗珠子
            </Text>
          </View>
        </View>
      </View>

      <BeadDetailModal
        bead={selectedBead}
        visible={modalVisible}
        onClose={handleModalClose}
        onDelete={handleModalDelete}
      />
    </>
  )
}

export default React.memo(DesignCanvas)
