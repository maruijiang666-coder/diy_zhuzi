import { View, Image, Text } from '@tarojs/components'
import React, { useState, useCallback, useMemo, useEffect } from 'react'
import type { Bead } from '../../types/bead'
import { getOptimizedImageUrlSync, ImageSize, checkWebPSupport } from '../../utils/image'
import './index.scss'

interface BeadItemProps {
  bead: Bead
  onClick?: (bead: Bead) => void
  lazyLoad?: boolean // 支持图片懒加载
}

const BeadItem: React.FC<BeadItemProps> = ({ bead, onClick, lazyLoad = false }) => {
  const [imageError, setImageError] = useState(false)
  const [webpSupported, setWebpSupported] = useState(false)

  // 检测WebP支持
  useEffect(() => {
    checkWebPSupport().then(setWebpSupported)
  }, [])

  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  const handleClick = useCallback(() => {
    onClick?.(bead)
  }, [onClick, bead])

  // 使用useMemo缓存优化后的图片URL
  const optimizedImageUrl = useMemo(() => {
    return getOptimizedImageUrlSync(bead.imageUrl, ImageSize.SMALL, webpSupported)
  }, [bead.imageUrl, webpSupported])

  return (
    <View className='bead-item' onClick={handleClick}>
      <View className='bead-item__image-wrapper'>
        {imageError ? (
          <View className='bead-item__placeholder'>
            <Text className='bead-item__placeholder-text'>图片加载失败</Text>
          </View>
        ) : (
          <Image
            className='bead-item__image'
            src={optimizedImageUrl}
            mode='aspectFit'
            lazyLoad={lazyLoad}
            onError={handleImageError}
            webp={webpSupported}
          />
        )}
      </View>
      <View className='bead-item__info'>
        <Text className='bead-item__name'>{bead.name}</Text>
        <Text className='bead-item__price'>¥{bead.price.toFixed(2)}</Text>
        <Text className='bead-item__size'>{bead.diameter}mm</Text>
      </View>
    </View>
  )
}

// 使用React.memo优化，避免不必要的重渲染
export default React.memo(BeadItem, (prevProps, nextProps) => {
  // 只有当bead的id或onClick改变时才重新渲染
  return prevProps.bead.id === nextProps.bead.id && 
         prevProps.onClick === nextProps.onClick &&
         prevProps.lazyLoad === nextProps.lazyLoad
})
