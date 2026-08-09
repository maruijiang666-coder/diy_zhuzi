import { View, Text, Input, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

interface WristSizeModalProps {
  visible: boolean
  initialSize?: number | null
  initialStyle?: 'single' | 'double'
  onConfirm: (size: number, style: 'single' | 'double') => void
  onClose?: () => void
}

export default function WristSizeModal({
  visible,
  initialSize,
  initialStyle = 'single',
  onConfirm,
  onClose
}: WristSizeModalProps) {
  const [size, setSize] = useState<string>('16')
  const [style, setStyle] = useState<'single' | 'double'>('single')

  useEffect(() => {
    if (visible) {
      if (initialSize) {
        setSize(String(initialSize))
      }
      if (initialStyle) {
        setStyle(initialStyle)
      }
    }
  }, [visible, initialSize, initialStyle])

  if (!visible) return null

  const handleConfirm = () => {
    const numSize = parseFloat(size)
    if (isNaN(numSize) || numSize < 10 || numSize > 25) {
      Taro.showToast({
        title: '请输入有效的尺寸(10-25cm)',
        icon: 'none'
      })
      return
    }
    onConfirm(numSize, style)
  }

  const currentSize = parseFloat(size) || 0
  const increment = 1.6 + (currentSize - 14) * 0.1
  const baseCircumference = currentSize + increment

  const maxCircumference = style === 'double' ? baseCircumference * 2 : baseCircumference

  return (
    <View className='wrist-modal-overlay'>
      <View className='wrist-modal-content'>
        <View className='wrist-modal-header'>
           <Text className='wrist-modal-icon'>⌚</Text>
           <Text className='wrist-modal-title'>手腕尺寸设置</Text>
        </View>

        <View className='wrist-modal-section'>
          <View className='section-header'>
            <Text className='section-label'>手围尺寸</Text>
            <Text className='section-sublabel'>(建议值: 14-20cm)</Text>
          </View>
          <View className='size-input-wrapper'>
            <Input
              className='size-input'
              type='digit'
              value={size}
              onInput={(e) => setSize(e.detail.value)}
            />
            <Text className='unit-text'>cm</Text>
          </View>
        </View>

        <View className='wrist-modal-section'>
          <Text className='section-label'>选择戴法</Text>
          <View className='style-options'>
            <View
              className={`style-option ${style === 'single' ? 'active' : ''}`}
              onClick={() => setStyle('single')}
            >
              <View className='radio-container'>
                <View className='radio-circle'>
                  {style === 'single' && <View className='radio-dot' />}
                </View>
              </View>
              <View className='option-text'>
                <Text className='option-title'>单圈</Text>
                <Text className='option-desc'>适合日常佩戴</Text>
              </View>
            </View>
            <View
              className={`style-option ${style === 'double' ? 'active' : ''}`}
              onClick={() => setStyle('double')}
            >
              <View className='radio-container'>
                <View className='radio-circle'>
                   {style === 'double' && <View className='radio-dot' />}
                </View>
              </View>
              <View className='option-text'>
                <Text className='option-title'>双圈</Text>
                <Text className='option-desc'>适合宽松手围</Text>
              </View>
            </View>
          </View>
        </View>

        <View className='wrist-modal-footer'>
          <View className='max-circumference'>
             <Text className='info-icon'>ⓘ</Text>
             <Text className='info-text'>最大周长: {maxCircumference.toFixed(1)}cm</Text>
          </View>

          <Button className='confirm-btn' onClick={handleConfirm}>
            完成设置
          </Button>
        </View>
      </View>
    </View>
  )
}
