import { View, Text, Image, Button } from '@tarojs/components'
import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import { useUserStore } from '../../stores/useUserStore'
import { Loading, Empty } from '../../components/common'
import './index.scss'

export default function ProfilePage() {
  const { user, isLoggedIn, loading, error, login, logout, loadUserInfo, clearError } = useUserStore()

  useEffect(() => {
    // 页面加载时检查登录状态
    if (isLoggedIn && !user) {
      // 已登录但没有用户信息，加载用户信息
      loadUserInfo().catch((err) => {
        console.error('加载用户信息失败:', err)
      })
    }
  }, [isLoggedIn, user, loadUserInfo])

  // 处理微信登录
  const handleWechatLogin = async () => {
    try {
      clearError()
      
      Taro.showLoading({ title: '登录中...', mask: true })
      
      // 调用登录接口（内部会调用 wx.login 和 wx.getUserProfile）
      await login()
      
      Taro.hideLoading()
      
      Taro.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 2000,
      })
    } catch (error: any) {
      Taro.hideLoading()
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
          <Button 
            className='login-button' 
            type='primary'
            onClick={handleWechatLogin}
          >
            微信登录
          </Button>
          <View className='login-tips'>
            <Text className='tips-text'>点击登录将获取您的微信头像和昵称</Text>
          </View>
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
