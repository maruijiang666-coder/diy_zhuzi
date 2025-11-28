import { View, Image } from '@tarojs/components'
import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

export default function SplashPage() {
  useEffect(() => {
    // 2秒后跳转到主页
    const timer = setTimeout(() => {
      Taro.switchTab({
        url: '/pages/diy/index',
      })
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <View className='splash-page'>
      <View className='splash-content'>
        <Image
          className='splash-logo'
          src='https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/logoqianshan.svg'
          mode='aspectFit'
        />
        <View className='splash-title gradient-text'>遣山水晶</View>
        <View className='splash-subtitle'>定制你的专属水晶手串</View>
      </View>
      
      <View className='splash-footer'>
        <View className='loading-dots'>
          <View className='dot' />
          <View className='dot' />
          <View className='dot' />
        </View>
      </View>
    </View>
  )
}
