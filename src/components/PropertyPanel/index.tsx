import { View, Text } from '@tarojs/components'
import React, { useMemo } from 'react'
import type { BraceletProperties } from '../../types/bracelet'
import { formatPrice, formatWeight, formatLength } from '../../utils/formatter'
import './index.scss'

interface PropertyPanelProps {
  properties: BraceletProperties
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ properties }) => {
  const { beadCount, totalPrice, totalWeight, totalLength } = properties

  // 使用useMemo缓存格式化结果，避免每次渲染都重新计算
  const formattedPrice = useMemo(() => formatPrice(totalPrice), [totalPrice])
  const formattedWeight = useMemo(() => formatWeight(totalWeight), [totalWeight])
  const formattedLength = useMemo(() => formatLength(totalLength), [totalLength])

  return (
    <View className='property-panel'>
      <View className='property-panel__item'>
        <Text className='property-panel__label'>数量</Text>
        <Text className='property-panel__value'>{beadCount}</Text>
      </View>

      <View className='property-panel__item'>
        <Text className='property-panel__label'>价格</Text>
        <Text className='property-panel__value property-panel__value--price'>
          {formattedPrice}
        </Text>
      </View>

      <View className='property-panel__item'>
        <Text className='property-panel__label'>重量</Text>
        <Text className='property-panel__value'>
          {formattedWeight}
        </Text>
      </View>

      <View className='property-panel__item'>
        <Text className='property-panel__label'>长度</Text>
        <Text className='property-panel__value'>
          {formattedLength}
        </Text>
      </View>
    </View>
  )
}

// 使用React.memo优化，只有当properties改变时才重新渲染
export default React.memo(PropertyPanel, (prevProps, nextProps) => {
  return prevProps.properties.beadCount === nextProps.properties.beadCount &&
         prevProps.properties.totalPrice === nextProps.properties.totalPrice &&
         prevProps.properties.totalWeight === nextProps.properties.totalWeight &&
         prevProps.properties.totalLength === nextProps.properties.totalLength
})
