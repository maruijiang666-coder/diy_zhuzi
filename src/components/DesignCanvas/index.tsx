import { View, Image, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import React, { useState, useCallback, useMemo, useEffect } from 'react'
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
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null)
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

  // 处理珠子长按 - 显示更多操作
  const handleBeadLongPress = useCallback((index: number) => {
    Taro.showActionSheet({
      itemList: ['删除', '移动到开头', '移动到末尾'],
      success: (res) => {
        const tapIndex = res.tapIndex
        if (tapIndex === 0) {
          // 删除
          onBeadDelete(index)
          Taro.showToast({
            title: '已删除',
            icon: 'success',
            duration: 1500,
          })
        } else if (tapIndex === 1) {
          // 移动到开头
          if (index !== 0) {
            onBeadMove(index, 0)
            Taro.showToast({
              title: '已移动',
              icon: 'success',
              duration: 1500,
            })
          }
        } else if (tapIndex === 2) {
          // 移动到末尾
          const lastIndex = bracelet.beads.length - 1
          if (index !== lastIndex) {
            onBeadMove(index, lastIndex)
            Taro.showToast({
              title: '已移动',
              icon: 'success',
              duration: 1500,
            })
          }
        }
      },
    })
  }, [bracelet.beads.length, onBeadDelete, onBeadMove])

  // 处理拖拽开始 - 使用useCallback缓存
  const handleTouchStart = useCallback((index: number) => {
    setDragFromIndex(index)
  }, [])

  // 处理拖拽结束 - 使用useCallback缓存
  const handleTouchEnd = useCallback((toIndex: number) => {
    if (dragFromIndex !== null && dragFromIndex !== toIndex) {
      onBeadMove(dragFromIndex, toIndex)
    }
    setDragFromIndex(null)
  }, [dragFromIndex, onBeadMove])

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

  // 使用useMemo缓存渲染的珠子列表，避免每次都重新计算
  const renderedBeads = useMemo(() => {
    // 调试信息
    console.log('DesignCanvas 渲染信息:', {
      珠子数量: bracelet.beads.length,
      有效半径: effectiveRadius.toFixed(2) + ' rpx',
      缩放系数: scaleFactor.toFixed(3),
      画布中心: centerOffset + ' rpx',
    })
    
    return bracelet.beads.map((bead, index) => {
      const isSelected = selectedBeadIndex === index
      const isDragging = dragFromIndex === index
      const originalSize = getBeadSize(bead)
      const size = originalSize * scaleFactor // 应用缩放系数
      const hasError = imageErrors.has(index)
      // 使用优化后的图片URL（缩略图尺寸）
      const optimizedImageUrl = getOptimizedImageUrlSync(bead.imageUrl, ImageSize.THUMBNAIL, webpSupported)
      
      // 创建一个返回缩放后尺寸的函数
      const getScaledBeadSize = (b: Bead) => getBeadSize(b) * scaleFactor
      
      // 计算圆形位置（珠子紧密排列，使用缩放后的尺寸）
      const { x, y, angle } = calculateCirclePosition(
        bracelet.beads, 
        index, 
        effectiveRadius, 
        centerOffset,
        getScaledBeadSize
      )
      
      // 调试信息 - 输出第一个和最后一个珠子的位置
      if (index === 0 || index === bracelet.beads.length - 1) {
        console.log(`珠子 ${index}:`, { 
          原始大小: originalSize.toFixed(2),
          缩放后大小: size.toFixed(2),
          x: x.toFixed(2), 
          y: y.toFixed(2), 
          角度: (angle * 180 / Math.PI).toFixed(1) + '°',
          距离中心: Math.sqrt(Math.pow(x - centerOffset, 2) + Math.pow(y - centerOffset, 2)).toFixed(2) + ' rpx'
        })
      }

      return (
        <View
          key={`${bead.id}-${index}`}
          className={`design-canvas__bead ${
            isSelected ? 'design-canvas__bead--selected' : ''
          } ${isDragging ? 'design-canvas__bead--dragging' : ''}`}
          style={{ 
            width: `${size}rpx`, 
            height: `${size}rpx`,
            position: 'absolute',
            left: `${x}rpx`,
            top: `${y}rpx`,
            // 先平移到中心，再旋转珠子使其沿圆周方向
            // angle 是珠子在圆周上的角度，加90度让穿线孔沿圆周
            transform: `translate(-50%, -50%) rotate(${(angle * 180 / Math.PI) + 90}deg)`
          }}
          onClick={() => handleBeadClick(index)}
          onLongPress={() => handleBeadLongPress(index)}
          onTouchStart={() => handleTouchStart(index)}
          onTouchEnd={() => handleTouchEnd(index)}
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
  }, [bracelet.beads, selectedBeadIndex, dragFromIndex, imageErrors, webpSupported, effectiveRadius, scaleFactor, centerOffset, getBeadSize, calculateCirclePosition, handleBeadClick, handleBeadLongPress, handleTouchStart, handleTouchEnd, handleImageError])

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
