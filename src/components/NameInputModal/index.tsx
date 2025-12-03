import { View, Text, Input, Button } from '@tarojs/components'
import { useState } from 'react'
import './index.scss'

interface NameInputModalProps {
  visible: boolean
  defaultName?: string
  onConfirm: (name: string) => void
  onCancel: () => void
}

const NameInputModal: React.FC<NameInputModalProps> = ({
  visible,
  defaultName = '',
  onConfirm,
  onCancel,
}) => {
  const [name, setName] = useState(defaultName)

  if (!visible) {
    return null
  }

  const handleConfirm = () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      onConfirm(defaultName || `设计 ${new Date().toLocaleDateString()}`)

    } else {
      
      onConfirm(trimmedName)
    }
  }

  return (
    <View className='name-input-modal'>
      <View className='modal-mask' onClick={onCancel} />
      <View className='modal-content'>
        <View className='modal-header'>
          <Text className='modal-title'>保存设计</Text>
        </View>
        
        <View className='modal-body'>
          <Text className='input-label'>设计名称</Text>
          <Input
            className='name-input'
            type='text'
            placeholder={defaultName || '请输入设计名称'}
            value={name}
            onInput={(e) => setName(e.detail.value)}
            maxlength={20}
            focus
          />
        </View>

        <View className='modal-footer'>
          <Button className='modal-btn modal-btn--cancel' onClick={onCancel}>
            取消
          </Button>
          <Button className='modal-btn modal-btn--confirm' onClick={handleConfirm}>
            确定
          </Button>
        </View>
      </View>
    </View>
  )
}

export default NameInputModal
