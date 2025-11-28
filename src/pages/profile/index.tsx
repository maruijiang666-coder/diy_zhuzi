import { View, Text, Image, Button } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { useUserStore } from '../../stores/useUserStore'
import { authService } from '../../services/authService'
import { Loading, Empty } from '../../components/common'
import './index.scss'

export default function ProfilePage() {
  const { user, isLoggedIn, loading, error, login, logout, loadUserInfo, clearError } = useUserStore()
  const [isTestMode, setIsTestMode] = useState(false)

  useEffect(() => {
    // 检查是否为测试用户模式
    setIsTestMode(authService.isTestUserMode())

    // 页面加载时检查登录状态
    if (isLoggedIn && !user) {
      // 已登录但没有用户信息，加载用户信息
      loadUserInfo().catch((err) => {
        console.error('加载用户信息失败:', err)
      })
    }
  }, [isLoggedIn, user, loadUserInfo])

  // 处理登录
  const handleLogin = async () => {
    try {
      clearError()
      await login()
      
      // 检查是否为测试用户模式
      const isTest = authService.isTestUserMode()
      setIsTestMode(isTest)
      
      if (isTest) {
        Taro.showToast({
          title: '已使用测试账号登录',
          icon: 'success',
          duration: 2000,
        })
      } else {
        Taro.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 2000,
        })
      }
    } catch (error: any) {
      console.error('登录失败:', error)
      Taro.showToast({
        title: error.message || '登录失败',
        icon: 'none',
        duration: 2000,
      })
    }
  }

  // 处理退出登录
  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout()
          Taro.showToast({
            title: '已退出登录',
            icon: 'success',
            duration: 2000,
          })
        }
      },
    })
  }

  // 跳转到我的设计
  const handleGoToDesigns = () => {
    Taro.navigateTo({
      url: '/pages/designs/index',
    })
  }

  // 跳转到订单列表
  const handleGoToOrders = () => {
    if (!isLoggedIn) {
      Taro.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000,
      })
      return
    }

    Taro.navigateTo({
      url: '/pages/order/list/index',
    })
  }

  // 加载中状态
  if (loading) {
    return <Loading fullscreen />
  }

  // 未登录状态
  if (!isLoggedIn || !user) {
    return (
      <View className='profile-page'>
        <View className='login-section'>
          <Empty
            text='您还未登录'
            description='请先登录以使用完整功能'
            icon='https://img.icons8.com/clouds/200/user.png'
          />
          <Button className='login-button' type='primary' onClick={handleLogin}>
            微信登录
          </Button>
          {error && (
            <View className='error-message'>
              <Text>{error}</Text>
            </View>
          )}
        </View>
      </View>
    )
  }

  // 已登录状态
  return (
    <View className='profile-page'>
      {/* 测试用户提示 */}
      {isTestMode && (
        <View className='test-mode-banner'>
          <Text className='test-mode-text'>🧪 测试模式（本地数据）</Text>
        </View>
      )}

      {/* 用户信息区域 */}
      <View className='user-info-section'>
        <View className='user-avatar'>
          <Image
            className='avatar-image'
            src={user.avatar || 'https://img.icons8.com/clouds/200/user.png'}
            mode='aspectFill'
          />
        </View>
        <View className='user-details'>
          <Text className='user-nickname'>{user.nickname || '未设置昵称'}</Text>
          {user.phone && <Text className='user-phone'>{user.phone}</Text>}
        </View>
      </View>

      {/* 功能菜单区域 */}
      <View className='menu-section'>
        <View className='menu-item' onClick={handleGoToDesigns}>
          <View className='menu-item-left'>
            <Text className='menu-icon'>💎</Text>
            <Text className='menu-text'>我的设计</Text>
          </View>
          <Text className='menu-arrow'>›</Text>
        </View>
        <View className='menu-item' onClick={handleGoToOrders}>
          <View className='menu-item-left'>
            <Text className='menu-icon'>📦</Text>
            <Text className='menu-text'>我的订单</Text>
          </View>
          <Text className='menu-arrow'>›</Text>
        </View>
      </View>

      {/* 退出登录按钮 */}
      <View className='logout-section'>
        <Button className='logout-button' onClick={handleLogout}>
          退出登录
        </Button>
      </View>

      {/* 错误提示 */}
      {error && (
        <View className='error-message'>
          <Text>{error}</Text>
        </View>
      )}
    </View>
  )
}
