import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default function SupportPage() {
  const handleCallMerchant = () => {
    Taro.makePhoneCall({
      phoneNumber: '13800138000', // TODO: 替换为真实的商家电话
      success: () => {
        console.log('拨打电话成功')
      },
      fail: (err) => {
        console.error('拨打电话失败:', err)
        // 如果是在开发者工具中，可能会失败，提示一下
        if (process.env.TARO_ENV === 'weapp' && err.errMsg.includes('not supported')) {
          Taro.showToast({
            title: '请在真机上测试拨打电话',
            icon: 'none'
          })
        }
      }
    })
  }

  return (
    <View className='support-page'>
      {/* 顶部Banner区域 */}
      <View className='banner-section'>
        <View className='banner-content'>
          <Text className='banner-title'>联系商家</Text>
          <Text className='banner-desc'>订单已超出售后有效期，如有其他诉求，您可联系商家协商处理</Text>
        </View>
        <View className='banner-icon'>
          <Text>🛡️</Text>
        </View>
      </View>

      {/* 操作区域 */}
      <View className='action-section'>
        <View className='action-card'>
          <Button className='action-btn' onClick={handleCallMerchant}>
            <Text className='btn-icon'>📞</Text>
            <Text>致电商家</Text>
          </Button>
        </View>
      </View>
    </View>
  )
}
