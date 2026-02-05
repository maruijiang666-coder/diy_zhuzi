import { View, Image, Text } from '@tarojs/components'
import React from 'react'
import type { Bead } from '../../types/bead'
import './index.scss'

interface BeadDetailModalProps {
  bead: Bead | null
  visible: boolean
  onClose: () => void
  onDelete: () => void
}

const BeadDetailModal: React.FC<BeadDetailModalProps> = ({
  bead,
  visible,
  onClose,
  onDelete,
}) => {
  if (!visible || !bead) {
    return null
  }

  return (
    <View className={`bead-detail-modal bead-detail-modal--${bead.shape || 'circle'}`} onClick={onClose}>
      <View className='bead-detail-modal__content' onClick={(e) => e.stopPropagation()}>
        {/* 珠子图片 */}
        <View className='bead-detail-modal__image-wrapper'>
          <Image
            className='bead-detail-modal__image'
            src={bead.imageUrl}
            mode='aspectFit'
          />
        </View>

        {/* 珠子信息 */}
        <View className='bead-detail-modal__info'>
          <Text className='bead-detail-modal__name'>{bead.name}</Text>
          
          <View className='bead-detail-modal__details'>
            <View className='bead-detail-modal__detail-item'>
              <Text className='bead-detail-modal__detail-label'>价格</Text>
              <Text className='bead-detail-modal__detail-value bead-detail-modal__detail-value--price'>
                ¥{bead.price.toFixed(2)}
              </Text>
            </View>
            
            <View className='bead-detail-modal__detail-item'>
              <Text className='bead-detail-modal__detail-label'>直径</Text>
              <Text className='bead-detail-modal__detail-value'>{bead.diameter}mm</Text>
            </View>
            
            <View className='bead-detail-modal__detail-item'>
              <Text className='bead-detail-modal__detail-label'>重量</Text>
              <Text className='bead-detail-modal__detail-value'>{bead.weight}g</Text>
            </View>
            
            <View className='bead-detail-modal__detail-item'>
              <Text className='bead-detail-modal__detail-label'>库存</Text>
              <Text className='bead-detail-modal__detail-value'>{bead.stock}个</Text>
            </View>
          </View>

          {bead.description && (
            <View className='bead-detail-modal__description'>
              <Text className='bead-detail-modal__description-text'>{bead.description}</Text>
            </View>
          )}
        </View>

        {/* 操作按钮 */}
        <View className='bead-detail-modal__actions'>
          <View className='bead-detail-modal__btn bead-detail-modal__btn--cancel' onClick={onClose}>
            <Text className='bead-detail-modal__btn-text'>取消</Text>
          </View>
          <View className='bead-detail-modal__btn bead-detail-modal__btn--delete' onClick={onDelete}>
            <Text className='bead-detail-modal__btn-text'>删除</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default BeadDetailModal
