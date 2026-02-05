import { View, Image } from '@tarojs/components'
import { useMemo } from 'react'
import type { Bracelet } from '../../types/bracelet'
import type { Bead } from '../../types/bead'
import './index.scss'

interface BraceletPreviewProps {
  bracelet: Bracelet
  size?: number // 容器尺寸（rpx）
}

const BraceletPreview: React.FC<BraceletPreviewProps> = ({ bracelet, size = 180 }) => {
  // 计算珠子渲染尺寸（与DesignCanvas保持一致）
  const getBeadSize = (bead: Bead): number => {
    const baseSize = 45
    const baseDiameter = 8
    const beadSize = (bead.diameter / baseDiameter) * baseSize
    return Math.max(40, Math.min(60, beadSize))
  }

  // 计算圆形布局的珠子位置（与DesignCanvas保持一致）
  const calculateCirclePosition = (
    beads: Bead[],
    currentIndex: number,
    radius: number,
    centerOffset: number,
    getScaledBeadSize: (bead: Bead) => number
  ) => {
    let accumulatedAngle = -Math.PI / 2 // 从顶部开始

    for (let i = 0; i < currentIndex; i++) {
      const beadSize = getScaledBeadSize(beads[i])
      const angleForBead = beadSize / radius
      accumulatedAngle += angleForBead
    }

    const currentBeadSize = getScaledBeadSize(beads[currentIndex])
    const currentBeadAngle = accumulatedAngle + currentBeadSize / radius / 2

    const x = centerOffset + radius * Math.cos(currentBeadAngle)
    const y = centerOffset + radius * Math.sin(currentBeadAngle)

    return { x, y, angle: currentBeadAngle }
  }

  // 计算预览尺寸和缩放
  const { circleRadius, centerOffset, scaleFactor, beadSizes } = useMemo(() => {
    // 根据容器大小计算圆环半径
    const radius = size * 0.33 // 圆环半径约为容器的1/3
    const center = size / 2

    // 安全检查：如果没有珠子数据，返回默认值
    if (!bracelet || !bracelet.beads || bracelet.beads.length === 0) {
      return {
        circleRadius: radius,
        centerOffset: center,
        scaleFactor: 1,
        beadSizes: [],
      }
    }

    // 计算所有珠子的原始尺寸
    const sizes = bracelet.beads.map((bead) => getBeadSize(bead))
    const totalBeadCircumference = sizes.reduce((sum, s) => sum + s, 0)

    // 圆的周长
    const circleCircumference = 2 * Math.PI * radius

    // 计算缩放系数
    const scale =
      totalBeadCircumference > circleCircumference
        ? (circleCircumference * 0.98) / totalBeadCircumference
        : 1

    return {
      circleRadius: radius,
      centerOffset: center,
      scaleFactor: scale,
      beadSizes: sizes,
    }
  }, [bracelet.beads, size])

  // 渲染珠子
  const renderedBeads = useMemo(() => {
    // 安全检查：如果没有珠子数据，返回空数组
    if (!bracelet || !bracelet.beads || bracelet.beads.length === 0) {
      return []
    }

    const getScaledBeadSize = (bead: Bead) => getBeadSize(bead) * scaleFactor

    return bracelet.beads.map((bead, index) => {
      const originalSize = beadSizes[index]
      const scaledSize = originalSize * scaleFactor

      const { x, y, angle } = calculateCirclePosition(
        bracelet.beads,
        index,
        circleRadius,
        centerOffset,
        getScaledBeadSize
      )

      return (
        <Image
          key={`${bead.id}-${index}`}
          className={`preview-bead preview-bead--${bead.shape || 'circle'}`}
          src={bead.imageUrl}
          mode={bead.shape === 'irregular' ? 'aspectFit' : 'aspectFill'}
          style={{
            width: `${scaledSize}rpx`,
            height: `${scaledSize}rpx`,
            left: `${x}rpx`,
            top: `${y}rpx`,
            transform: `translate(-50%, -50%) rotate(${(angle * 180) / Math.PI + 90}deg)`,
          }}
        />
      )
    })
  }, [bracelet.beads, circleRadius, centerOffset, scaleFactor, beadSizes])

  return (
    <View className='bracelet-preview' style={{ width: `${size}rpx`, height: `${size}rpx` }}>
      {/* 圆环线条 */}
      <View
        className='preview-circle-line'
        style={{
          width: `${circleRadius * 2}rpx`,
          height: `${circleRadius * 2}rpx`,
          left: `${centerOffset}rpx`,
          top: `${centerOffset}rpx`,
        }}
      />

      {/* 珠子 */}
      {renderedBeads}
    </View>
  )
}

export default BraceletPreview
