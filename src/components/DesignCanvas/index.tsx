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

const DesignCanvas: React.FC<DesignCanvasProps> = ({
  bracelet,
  selectedBeadIndex,
  onBeadSelect,
  onBeadDelete,
  onBeadMove,
  onSettingClick,
}) => {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const draggingIndexRef = useRef<number | null>(null)
  const [dragPosition, setDragPosition] = useState<{x: number, y: number} | null>(null)
  const [previewInsertIndex, setPreviewInsertIndex] = useState<number | null>(null)
  const canvasRef = useRef<any>(null)
  const [webpSupported, setWebpSupported] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedBead, setSelectedBead] = useState<Bead | null>(null)
  const [clickedBeadIndex, setClickedBeadIndex] = useState<number>(-1)

  // 检测WebP支持
  useEffect(() => {
    checkWebPSupport().then(setWebpSupported)
  }, [])

  // 处理图片加载失败 - 使用useCallback缓存
  const handleImageError = useCallback((index: number) => {
    setImageErrors((prev) => new Set(prev).add(index))
  }, [])

  // 处理珠子点击 - 先高亮，然后显示珠子信息弹窗
  const handleBeadClick = useCallback((index: number) => {
    const bead = bracelet.beads[index]
    
    // 选中珠子（高亮显示）
    onBeadSelect(index)
    setClickedBeadIndex(index)
    setSelectedBead(bead)
    setModalVisible(true)
  }, [bracelet.beads, onBeadSelect])

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
      return 2 // fallback
    }
  }, [])

  // 计算珠子渲染尺寸（基于直径比例）- 使用useCallback缓存
  const getBeadSize = useCallback((bead: Bead) => {
    // 固定尺寸，不随珠子数量变化
    // 基准尺寸：8mm直径对应25rpx (这样16mm对应50rpx)
    const baseSize = 25
    const baseDiameter = 8
    const size = (bead.diameter / baseDiameter) * baseSize
    
    // 移除最大尺寸限制，确保大珠子（>10mm）能显示出区别
    // 仅保留一个极小的底限，防止数据异常导致不可见
    return Math.max(10, size)
  }, [])

  // 计算圆形布局的珠子位置（基于累积角度，珠子紧密排列）
  const calculateCirclePosition = useCallback((
    beads: Bead[], 
    currentIndex: number, 
    radius: number, 
    centerOffset: number,
    getBeadSize: (bead: Bead) => number
  ) => {
    // 计算每个珠子占据的角度（基于珠子大小）
    let accumulatedAngle = -Math.PI / 2 // 从顶部开始
    
    for (let i = 0; i < currentIndex; i++) {
      const beadSize = getBeadSize(beads[i])
      // 珠子在圆周上占据的弧长 = 珠子直径
      // 角度 = 弧长 / 半径
      const angleForBead = beadSize / radius
      accumulatedAngle += angleForBead
    }
    
    // 当前珠子的角度（珠子中心位置）
    const currentBeadSize = getBeadSize(beads[currentIndex])
    const currentBeadAngle = accumulatedAngle + (currentBeadSize / radius) / 2
    
    // 计算珠子在圆周上的位置
    const x = centerOffset + radius * Math.cos(currentBeadAngle)
    const y = centerOffset + radius * Math.sin(currentBeadAngle)
    
    return { x, y, angle: currentBeadAngle }
  }, [])

  // 计算画布尺寸和半径 - 扩大尺寸作为核心功能
  const { canvasSize, centerOffset } = useMemo(() => {
    // 调整半径为150rpx，让缩放更早触发
    const radius = 150 
    const padding = 50 // 边距
    const size = radius * 2 + padding * 2 // 画布总尺寸 = 400rpx
    const center = size / 2 // 画布中心点 = 200rpx
    return { canvasSize: size, centerOffset: center }
  }, [])

  // 计算布局指标：有效半径和缩放系数
  const { effectiveRadius, scaleFactor } = useMemo(() => {
    // 调整半径为150rpx (对应300rpx直径)
    const FIXED_RADIUS = 150;
    
    // 如果没有珠子，返回默认值
    if (bracelet.beads.length === 0) {
      return { effectiveRadius: FIXED_RADIUS, scaleFactor: 1 };
    }

    // 计算所有珠子的总周长（基于基准尺寸）
    const beadSizes = bracelet.beads.map(bead => getBeadSize(bead))
    const totalBeadCircumference = beadSizes.reduce((sum, size) => sum + size, 0)
    
    // 目标圆周长 (完全闭合，不留间隙)
    const targetCircumference = 2 * Math.PI * FIXED_RADIUS;

    // 计算理想缩放比例
    let scale = targetCircumference / totalBeadCircumference;

    // 限制最大放大倍数，防止珠子过少时变得巨大
    // 设定为 2.2 倍，适配 300rpx 直径的圆环，确保 9 颗大珠子 (16mm) 能填满
    const MAX_SCALE = 2.2;
    
    // 限制最小缩放倍数，防止珠子过多时变得过小看不清（虽然一般不会发生，作为兜底）
    const MIN_SCALE = 0.5;

    scale = Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);
    
    return { effectiveRadius: FIXED_RADIUS, scaleFactor: scale };
  }, [bracelet.beads, getBeadSize]);

  // 获取画布位置
  const updateCanvasRect = useCallback(() => {
    const query = Taro.createSelectorQuery()
    // 在自定义组件中，可能需要使用 .in(this) 或者直接全局查询类名
    // 这里使用全局查询
    query.select('.design-canvas__beads').boundingClientRect(rect => {
      if (rect) {
        canvasRef.current = rect
        console.log('Canvas Rect updated:', rect)
      } else {
          console.warn('Canvas Rect not found')
      }
    }).exec()
  }, [])

  // 监听画布尺寸变化
  useEffect(() => {
    // 延迟一点时间确保DOM已渲染
    const timer = setTimeout(() => {
        updateCanvasRect()
    }, 200)
    return () => clearTimeout(timer)
  }, [updateCanvasRect, bracelet.beads.length])

  // 处理珠子长按 - 触发拖拽
  const handleBeadLongPress = useCallback((index: number, e: any) => {
    // 震动反馈
    Taro.vibrateShort({ type: 'medium' })
    
    setDraggingIndex(index)
    draggingIndexRef.current = index
    setPreviewInsertIndex(index) // 初始预测位置为当前位置
    
    // 尝试更新一下画布位置，以防万一
    if (!canvasRef.current) {
        updateCanvasRect()
    }
    
    // 初始化位置
    // 优先使用 touches，因为它是实时的触摸点
    const touch = e.touches && e.touches[0] ? e.touches[0] : null
    
    // 获取坐标：优先使用 clientX/Y
    // 注意：e.detail.x/y 通常是 pageX/Y，如果页面有滚动，可能需要减去滚动偏移
    // 但在这个全屏应用中，我们假设 clientX 和 detail.x 接近
    const clientX = touch ? touch.clientX : ((e.detail && e.detail.x) || 0)
    const clientY = touch ? touch.clientY : ((e.detail && e.detail.y) || 0)

    if (canvasRef.current) {
      const { left, top } = canvasRef.current
      setDragPosition({
        x: clientX - left,
        y: clientY - top
      })
    } else {
        // 如果此时还没有 canvasRef，先尝试使用 detail 坐标，假设 canvas 在左上角（不太准确，但比没有好）
        // 或者不设置 dragPosition，等到 move 时再设置
        console.warn('Canvas rect not ready for long press')
    }
  }, [updateCanvasRect])

  // 计算插入位置的辅助函数
  const calculateInsertIndex = useCallback((touchX: number, touchY: number) => {
    if (!canvasRef.current || draggingIndexRef.current === null) return null

    const currentIndex = draggingIndexRef.current
    const { width, height } = canvasRef.current
    const centerX = width / 2
    const centerY = height / 2
    
    // 计算相对于中心的坐标
    const dx = touchX - centerX
    const dy = touchY - centerY
    
    // 计算角度 (-PI 到 PI)
    // Math.atan2(y, x): 0 是右边(3点), PI/2 是下边(6点), -PI/2 是上边(12点)
    let angle = Math.atan2(dy, dx)
    
    // 我们的布局是从 -PI/2 (顶部) 开始的，顺时针增加
    // 转换为相对于顶部的角度 [0, 2PI)
    let normalizedAngle = angle + Math.PI / 2
    if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI
    
    // 获取当前所有珠子（不含正在拖拽的）
    // 注意：这里我们使用原始数据来计算布局，因为我们需要知道如果把珠子放进去会怎样
    // 但是比较角度时，我们应该比较“如果移除了拖拽珠子后的剩余珠子”的角度
    const otherBeadsWithIndex = bracelet.beads
        .map((bead, i) => ({ bead, originalIndex: i }))
        .filter(item => item.originalIndex !== currentIndex)
    
    if (otherBeadsWithIndex.length === 0) return 0
    
    // 计算所有其他珠子的角度
    let accumulatedAngle = -Math.PI / 2
    const beadAngles: {originalIndex: number, angle: number}[] = []
    
    // 临时计算布局：假设剩余珠子形成一个圆环
    // 注意：这里应该使用 effectiveRadius，但因为少了一个珠子，可能会有空隙
    // 为了更准确的交互，我们应该计算“缝隙”的角度
    // 简单起见，我们计算每个剩余珠子的中心角度
    
    for (let i = 0; i < otherBeadsWithIndex.length; i++) {
        const { bead, originalIndex } = otherBeadsWithIndex[i]
        const beadSize = getBeadSize(bead)
        // 使用 effectiveRadius 计算角度宽度
        const angleWidth = beadSize / effectiveRadius
        
        const currentAngle = accumulatedAngle + angleWidth / 2
        
        // 归一化角度到 [0, 2PI)
        let angleFromTop = currentAngle + Math.PI / 2
        if (angleFromTop < 0) angleFromTop += 2 * Math.PI
        angleFromTop = angleFromTop % (2 * Math.PI)
        
        beadAngles.push({ originalIndex, angle: angleFromTop })
        
        accumulatedAngle += angleWidth
    }
    
    // 找到与 normalizedAngle 最接近的 bead
    let closestIndex = -1
    let minDiff = Infinity
    
    beadAngles.forEach((item, i) => {
        let diff = Math.abs(item.angle - normalizedAngle)
        if (diff > Math.PI) diff = 2 * Math.PI - diff
        
        if (diff < minDiff) {
            minDiff = diff
            closestIndex = i // 这里记录的是 otherBeads 数组中的索引
        }
    })

    // 如果最近的是第 i 个珠子，我们需要判断是在它前面还是后面
    // 或者简单点，我们直接认为最近的那个位置就是目标位置（替换）
    // 但因为我们想插入，所以实际上有 N+1 个位置
    // 让我们简化逻辑：找到最近的珠子，然后判断角度大小决定是在前还是后
    
    if (closestIndex !== -1) {
        const closestBead = beadAngles[closestIndex]
        let diff = normalizedAngle - closestBead.angle
        // 处理跨越 0 点的情况
        if (diff > Math.PI) diff -= 2 * Math.PI
        if (diff < -Math.PI) diff += 2 * Math.PI
        
        // 如果 diff > 0，说明在珠子后面（顺时针方向），插入索引 + 1
        // 如果 diff < 0，说明在珠子前面，插入索引不变
        
        // otherBeads 中的索引对应：
        // 0 ... closestIndex ... length-1
        // 原始索引：
        // A, B, (Dragging), C, D
        // other: A, B, C, D
        // closest: C (index 2 in other)
        // if after C: insert index should be index of D?
        
        // 我们需要返回的是在最终数组中的索引
        // 最终数组长度 = otherBeads.length + 1
        
        // 计算在 otherBeads 中的插入位置 (0 到 length)
        let insertIndexInOther = closestIndex
        if (diff > 0) {
            insertIndexInOther = closestIndex + 1
        }
        
        // 修正环形边界
        if (insertIndexInOther > otherBeadsWithIndex.length) {
            insertIndexInOther = 0
        }
        
        // 映射回原始索引？
        // 不，我们只需要知道它在“新”数组中的位置。
        // 例如：[A, B, C, D], dragging E.
        // insert at 2 (between B and C).
        // Result: A, B, E, C, D.
        // Index is 2.
        
        return insertIndexInOther
    }
    
    return currentIndex
  }, [bracelet.beads, effectiveRadius, getBeadSize])

  // 处理拖拽移动
  const handleTouchMove = useCallback((e: any) => {
    // 使用 ref 获取最新的 draggingIndex，避免闭包问题
    if (draggingIndexRef.current === null) return
    
    e.stopPropagation() // 阻止冒泡
    
    const touch = e.touches[0]
    if (touch && canvasRef.current) {
      const { left, top } = canvasRef.current
      const x = touch.clientX - left
      const y = touch.clientY - top
      
      setDragPosition({ x, y })
      
      // 实时计算预测插入位置
      const newIndex = calculateInsertIndex(x, y)
      if (newIndex !== null) {
          setPreviewInsertIndex(newIndex)
      }
    }
  }, [calculateInsertIndex])

  // 处理拖拽开始 - 仅记录，不触发逻辑
  const handleTouchStart = useCallback((index: number) => {
    // 可以在这里做一些初始化，但主要逻辑交给 LongPress
    // 预先更新 Canvas 位置，以防页面滚动导致坐标偏差
    updateCanvasRect()
  }, [updateCanvasRect])

  // 处理拖拽结束
  const handleTouchEnd = useCallback(() => {
    if (draggingIndexRef.current !== null && dragPosition && canvasRef.current) {
      const currentIndex = draggingIndexRef.current
      // 使用最新的预测位置
      // 注意：previewInsertIndex 是状态，这里可能拿不到最新的？
      // 应该可以，因为 handleTouchMove 会频繁触发更新
      // 但为了安全，如果 previewInsertIndex 为 null，再计算一次？
      // 不，我们应该相信 state，或者重新计算一次以防万一
      
      const { left, top } = canvasRef.current
      const finalIndex = calculateInsertIndex(dragPosition.x, dragPosition.y)
      
      if (finalIndex !== null && finalIndex !== currentIndex) {
          // 注意：finalIndex 是基于“移除当前珠子后”的数组的插入位置
          // onBeadMove 需要处理这种逻辑吗？
          // onBeadMove(from, to) 通常指把 from 移到 to。
          // 如果 to > from，移动后索引会减1？
          // 假设：A, B, C, D, E. Move B(1) to 3 (between C and D).
          // remove B: A, C, D, E.
          // insert at 2 (0:A, 1:C, 2:D).
          // Result: A, C, B, D, E.
          // onBeadMove(1, 2) ?
          
          // 让我们看看 standard splice logic:
          // list.splice(to, 0, list.splice(from, 1)[0])
          // 如果 to > from，因为 from 移除了，后面的元素索引前移了。
          // 所以如果我们要插在“视觉上的第3个位置”，实际索引可能需要调整。
          
          // calculateInsertIndex 返回的是在 otherBeads 中的索引。
          // 也就是目标数组中的索引。
          
          // 如果我们直接调用 onBeadMove(currentIndex, finalIndex)
          // 需要确认 onBeadMove 的实现。假设它是标准的 array move。
          
          // 如果我们计算的是“插入到 otherBeads 的 index 位置”
          // 例子：[A, B, C, D]. dragging B (index 1). other: [A, C, D].
          // insert at 2 (before D).
          // Result: [A, C, B, D].
          // Index of B is now 2.
          // So onBeadMove(1, 2) is correct.
          
          // 例子：dragging B (index 1). other: [A, C, D].
          // insert at 1 (before C).
          // Result: [A, B, C, D]. (No change)
          // Index of B is 1.
          
          // 例子：dragging B (index 1). other: [A, C, D].
          // insert at 0 (before A).
          // Result: [B, A, C, D].
          // Index of B is 0.
          
          // 所以 calculateInsertIndex 返回的就是目标索引。
          
           if (currentIndex !== finalIndex) {
             onBeadMove(currentIndex, finalIndex)
           }
      }
    }
    
    setDraggingIndex(null)
    draggingIndexRef.current = null
    setDragPosition(null)
    setPreviewInsertIndex(null)
  }, [dragPosition, calculateInsertIndex, onBeadMove, previewInsertIndex])

  // 使用useMemo缓存渲染的珠子列表，避免每次都重新计算
  const renderedBeads = useMemo(() => {
    // 调试信息
    console.log('DesignCanvas 渲染信息:', {
      珠子数量: bracelet.beads.length,
      有效半径: effectiveRadius.toFixed(2) + ' rpx',
      缩放系数: scaleFactor.toFixed(3),
      画布中心: centerOffset + ' rpx',
    })
    
    // 如果正在拖拽，我们需要模拟插入后的布局
    let beadsToRender = bracelet.beads
    let layoutMap = new Map<number, {x: number, y: number, angle: number}>()
    
    if (draggingIndex !== null && previewInsertIndex !== null) {
        // 构建虚拟列表：移除拖拽珠子，再插入到预测位置
        const draggingBead = bracelet.beads[draggingIndex]
        const otherBeads = bracelet.beads.filter((_, i) => i !== draggingIndex)
        
        // 插入到预测位置
        const virtualBeads = [...otherBeads]
        virtualBeads.splice(previewInsertIndex, 0, draggingBead)
        
        // 计算这个虚拟列表的布局
        virtualBeads.forEach((bead, i) => {
            // 这里我们需要知道这个 bead 对应原始列表的哪个 index
            // 比较简单的办法是依赖对象引用相等（如果 bead 对象在内存中唯一）
            // 或者我们可以给 beadsToRender 添加 originalIndex 属性
            
            // 为了简单，我们只计算布局，然后在下面 map 中根据 bead 匹配
            // 注意：这要求 bead 对象唯一。如果不唯一（比如同样的珠子数据），可能出问题
            // 我们的 key 使用 `${bead.id}-${index}`，但这里 index 变了
            
            // 更好的做法：我们直接计算好所有位置，然后按顺序分配给 virtualBeads
            
            // 创建一个返回缩放后尺寸的函数
            const getScaledBeadSize = (b: Bead) => getBeadSize(b) * scaleFactor
            
            const layout = calculateCirclePosition(
                virtualBeads,
                i,
                effectiveRadius,
                centerOffset,
                getScaledBeadSize
            )
            
            // 我们需要把这个 layout 关联到原始的 bead 上
            // 假设 bead.id 是唯一的。如果不是，可能需要 originalIndex
            // 让我们用一个 Map: bead -> layout
            layoutMap.set(bead.id, layout)
            
            // 注意：如果 bracelet.beads 里有重复引用的 bead 对象，Map 会覆盖
            // 但通常 React props 里的数组元素是不同的对象实例，或者是带唯一 ID 的
            // 检查 bead.ts: interface Bead { id: string; ... }
            // 只要 id 唯一即可。
        })
    }
    
    return bracelet.beads.map((bead, index) => {
      const isSelected = selectedBeadIndex === index
      const isDragging = draggingIndex === index
      const originalSize = getBeadSize(bead)
      const size = originalSize * scaleFactor // 应用缩放系数
      const hasError = imageErrors.has(index)
      // 使用优化后的图片URL（缩略图尺寸）
      const optimizedImageUrl = getOptimizedImageUrlSync(bead.imageUrl, ImageSize.THUMBNAIL, webpSupported)
      
      // 默认布局（非拖拽时使用）
      const getScaledBeadSize = (b: Bead) => getBeadSize(b) * scaleFactor
      let layout = { x: 0, y: 0, angle: 0 }
      
      if (draggingIndex !== null && previewInsertIndex !== null && layoutMap.has(bead.id)) {
          // 使用虚拟布局
          layout = layoutMap.get(bead.id)!
      } else {
          // 正常计算
          layout = calculateCirclePosition(
            bracelet.beads, 
            index, 
            effectiveRadius, 
            centerOffset,
            getScaledBeadSize
          )
      }
      
      const { x, y, angle } = layout
      
      // 样式对象
      let style: React.CSSProperties = { 
        width: `${size}rpx`, 
        height: `${size}rpx`,
        position: 'absolute',
        left: `${x}rpx`,
        top: `${y}rpx`,
        // 先平移到中心，再旋转珠子使其沿圆周方向
        // angle 是珠子在圆周上的角度，加90度让穿线孔沿圆周
        transform: `translate(-50%, -50%) rotate(${(angle * 180 / Math.PI) + 90}deg)`,
        transition: isDragging ? 'left 0.2s, top 0.2s, transform 0.2s' : 'none' // 添加过渡动画让移动更平滑
      }

      // 如果正在拖拽，隐藏珠子（保持占位但不可见）
      if (isDragging && dragPosition) {
        style = {
            width: `${size * 1.2}rpx`, 
            height: `${size * 1.2}rpx`,
            position: 'absolute',
            left: `${dragPosition.x * rpxRatio}rpx`,
            top: `${dragPosition.y * rpxRatio}rpx`,
            transform: 'translate(-50%, -50%)',
            zIndex: 100,
            opacity: 0, // 隐藏珠子
            pointerEvents: 'none', // 确保触摸事件穿透到父容器（如果需要）
            transition: 'none' // 拖拽时不需要过渡
        }
      }

      return (
        <View
          key={`${bead.id}-${index}`}
          className={`design-canvas__bead ${
            isSelected ? 'design-canvas__bead--selected' : ''
          } ${isDragging ? 'design-canvas__bead--dragging' : ''}`}
          style={style}
          onClick={() => handleBeadClick(index)}
          onLongPress={(e) => handleBeadLongPress(index, e)}
          onTouchStart={() => handleTouchStart(index)}
        >
          {hasError ? (
            <View className='design-canvas__bead-placeholder'>
              <Text className='design-canvas__bead-placeholder-text'>
                ?
              </Text>
            </View>
          ) : (
            <Image
              className='design-canvas__bead-image'
              src={optimizedImageUrl}
              mode='aspectFill'
              webp={webpSupported}
              onError={() => handleImageError(index)}
            />
          )}
          {isSelected && (
            <View className='design-canvas__bead-selected-indicator' />
          )}
        </View>
      )
    })
  }, [bracelet.beads, selectedBeadIndex, draggingIndex, dragPosition, imageErrors, webpSupported, effectiveRadius, scaleFactor, centerOffset, getBeadSize, calculateCirclePosition, handleBeadClick, handleBeadLongPress, handleTouchStart, handleTouchMove, handleTouchEnd, handleImageError, rpxRatio, previewInsertIndex])

  // 如果手串为空，显示引导提示
  if (!bracelet.beads || bracelet.beads.length === 0) {
    return (
      <View className='design-canvas design-canvas--empty'>
        {/* 设置按钮 */}
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
        {/* 设置按钮 */}
        <View className='design-canvas__setting-btn' onClick={onSettingClick}>
          <Text className='setting-icon'>⚙️</Text>
          <Text className='setting-text'>手围设置</Text>
        </View>

        <View className='design-canvas__container'>
        {/* 圆形布局显示珠子 */}
        <View 
          className='design-canvas__beads design-canvas__beads--circle'
          style={{ 
            width: `${canvasSize}rpx`, 
            height: `${canvasSize}rpx` 
          }}
          catchTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* 静态渲染手串的线 (固定大小，样式在SCSS中定义) */}
          <View className='design-canvas__string' />
          {renderedBeads}
        </View>

        {/* 显示珠子数量 */}
        <View className='design-canvas__info'>
          <Text className='design-canvas__info-text'>
            已添加 {bracelet.beads.length} 颗珠子
          </Text>
        </View>
      </View>
    </View>

      {/* 珠子详情弹窗 */}
      <BeadDetailModal
        bead={selectedBead}
        visible={modalVisible}
        onClose={handleModalClose}
        onDelete={handleModalDelete}
      />
    </>
  )
}

// 使用React.memo优化，避免不必要的重渲染
export default React.memo(DesignCanvas, (prevProps, nextProps) => {
  return prevProps.bracelet.beads.length === nextProps.bracelet.beads.length &&
         prevProps.selectedBeadIndex === nextProps.selectedBeadIndex &&
         prevProps.onBeadSelect === nextProps.onBeadSelect &&
         prevProps.onBeadDelete === nextProps.onBeadDelete &&
         prevProps.onBeadMove === nextProps.onBeadMove &&
         prevProps.onSettingClick === nextProps.onSettingClick &&
         // 深度比较beads数组
         prevProps.bracelet.beads.every((bead, index) => {
           const nextBead = nextProps.bracelet.beads[index]
           return nextBead && bead.id === nextBead.id
         })
})
