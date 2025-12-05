import { View, Text, Image, Button, Input } from '@tarojs/components'
import { useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import { useUserStore } from '../../stores/useUserStore'
import { Loading, Empty } from '../../components/common'
import './index.scss'

export default function ProfilePage() {
  const { user, isLoggedIn, loading, error, login, logout, loadUserInfo, clearError } = useUserStore()
  const hasAttemptedLoad = useRef(false)

  useEffect(() => {
    // 页面加载时检查登录状态
    if (isLoggedIn && !user && !hasAttemptedLoad.current) {
      hasAttemptedLoad.current = true
      // 已登录但没有用户信息，加载用户信息
      loadUserInfo().catch((err) => {
        console.error('加载用户信息失败:', err)
        // 如果是 401 错误，清除登录状态
        if (err.code === '401' || err.type === 'NETWORK_ERROR') {
          logout()
        }
      })
    }
  }, [isLoggedIn, user, loadUserInfo, logout])

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
      
      // 根据错误码提供更友好的提示
      let errorMessage = error.message || '登录失败'
      if (error.code === '502') {
        errorMessage = '服务器暂时无法访问，请稍后再试'
      } else if (error.code === '500') {
        errorMessage = '服务器内部错误，请稍后再试'
      } else if (error.code === '404') {
        errorMessage = '登录接口不存在'
      }
      
      Taro.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 3000,
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

  // 1. 获取头像 
  const setAvatar = (avatarUrl: string) => {
    console.log('获取头像成功:', avatarUrl)
    // 这里可以添加保存头像的逻辑
    Taro.showToast({
      title: '头像获取成功',
      icon: 'success',
      duration: 2000
    })
  }

  // 2. 获取昵称
  const handleNicknameChange = (e: any) => {
    const nickname = e.detail.value
    console.log('获取昵称:', nickname)
    // 这里可以添加保存昵称的逻辑
    if (nickname) {
      Taro.showToast({
        title: '昵称已更新',
        icon: 'success',
        duration: 2000
      })
    }
  }

  // 3. 获取用户手机号
  const handleGetPhoneNumber = async (e: any) => {
    console.log('获取手机号事件:', e)
    
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      const code = e.detail.code
      console.log('获取手机号成功，code:', code)
      
      try {
        // 使用真实的后端接口获取手机号
        Taro.showLoading({ title: '获取手机号中...' })
        
        const response = await Taro.request({
          url: `https://crystal.quant-speed.com/api/auth/wx/get_phone_number/`,
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'X-CSRFTOKEN': 'QjAtpufAC7oTUhnKbQaG8GWwvZ91U2xptiRnJk19S6UXeNW1X6wnmAe6RgYJDf1M',
            'Accept': 'application/json'
          },
          data: {
            code: code,
            app_type: 'diy'
          }
        })
        
        const result = response.data
        console.log('手机号API返回结果:', result)
        
        Taro.hideLoading()
        
        if (result.code === 0) {
          const phoneNumber = result.data.phone_info && result.data.phone_info.phoneNumber
          console.log('获取到手机号:', phoneNumber)
          Taro.showToast({
            title: '手机号获取成功',
            icon: 'success',
            duration: 2000
          })
          



        } else {
          console.error('获取手机号失败:', result)
          Taro.showToast({
            title: '获取手机号失败',
            icon: 'none',
            duration: 2000
          })
        }
      } catch (error) {
        Taro.hideLoading()
        console.error('获取手机号错误:', error)
        Taro.showToast({
          title: '网络错误，请重试',
          icon: 'none',
          duration: 2000
        })
      }
    } else {
      console.log('用户拒绝获取手机号')
      Taro.showToast({
        title: '已取消获取手机号',
        icon: 'none',
        duration: 2000
      })
    }
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
          <Button 
            openType="chooseAvatar" 
            onChooseAvatar={(e) => setAvatar(e.detail.avatarUrl)}
            className='avatar-button'
            type='default'
          >
            <View className='empty-state'>
              <Image 
                className='empty-icon' 
                src='https://img.icons8.com/clouds/200/user.png'
                mode='aspectFit'
              />
              <Text className='empty-text'>您还未登录</Text>
              <Text className='empty-description'>请选择头像、输入昵称并获取手机号完成登录</Text>
            </View>
          </Button>
          <Input 
            type="nickname" 
            placeholder="请输入昵称"
            className='nickname-input'
            onBlur={handleNicknameChange}
            onClick={() => {
              // 点击输入框时自动聚焦，提升用户体验
              console.log('点击昵称输入框')
            }}
          />
          <Button 
            className='login-button' 
            type='primary'
            onClick={handleWechatLogin}
          >
            微信登录
          </Button>
          {/* 1. 获取头像 - 已移到上方图片区域 */}
          
          {/* 2. 获取昵称 */}
          {/* 3. 获取用户手机号 */}
          <Button 
            openType="getPhoneNumber" 
            onGetPhoneNumber={handleGetPhoneNumber}
            className='phone-button'
            type='primary'
          >
            获取手机号
          </Button>
          
          {/* 2. 获取昵称 */}
     
          
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
