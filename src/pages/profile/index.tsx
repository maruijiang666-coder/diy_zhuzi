import { View, Text, Image, Button } from '@tarojs/components'
import { useEffect, useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import { useUserStore } from '../../stores/useUserStore'
import { Loading } from '../../components/common'
import { getStorage, STORAGE_KEYS } from '../../utils/storage'
import { useAvatarUpload } from './hooks/useAvatarUpload'
import './index.scss'

export default function ProfilePage() {
  const { user, isLoggedIn, loading, error, logout, loadUserInfo } = useUserStore()
  const hasAttemptedLoad = useRef(false)
  const [avatar, setAvatar] = useState<string>('')
  const [nickname, setNickname] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  
  const { uploadAvatar } = useAvatarUpload()

  useEffect(() => {
    // 页面加载时检查登录状态
    if (isLoggedIn && !user && !hasAttemptedLoad.current) {
      hasAttemptedLoad.current = true
      // 延迟加载用户信息，确保token生效
      setTimeout(() => {
        loadUserInfo().catch((err) => {
          console.error('加载用户信息失败:', err)
          console.error('错误详情:', {
            code: err.code,
            type: err.type,
            message: err.message
          })
          // 如果是 401 错误，清除登录状态
          if (err.code === '401' || err.type === 'NETWORK_ERROR') {
            console.log('401错误，清除登录状态')
            logout()
            Taro.showToast({
              title: '登录状态失效，请重新登录',
              icon: 'none',
              duration: 3000
            })
          }
        })
      }, 1000) // 增加到1秒，确保token生效
    }
  }, [isLoggedIn, user, loadUserInfo, logout])

  // 加载缓存的用户信息
  useEffect(() => {
    const loadCachedUserInfo = async () => {
      try {
        const cachedAvatar = await getStorage<string>(STORAGE_KEYS.USER_AVATAR)
        const cachedNickname = await getStorage<string>(STORAGE_KEYS.USER_NICKNAME)
        const cachedPhone = await getStorage<string>(STORAGE_KEYS.USER_PHONE)
        
        if (cachedAvatar) setAvatar(cachedAvatar)
        if (cachedNickname) setNickname(cachedNickname)
        if (cachedPhone) setPhone(cachedPhone)
        
        console.log('加载缓存的用户信息:', { cachedAvatar, cachedNickname, cachedPhone })
      } catch (error) {
        console.error('加载缓存用户信息失败:', error)
      }
    }
    
    loadCachedUserInfo()
  }, [])

  // 处理退出登录
  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            // 获取登录token
            const loginToken = Taro.getStorageSync('Import_code')
            if (!loginToken) {
              console.log('未找到登录token，直接清除本地状态')
              await logout()
              Taro.showToast({
                title: '已退出登录',
                icon: 'success',
                duration: 2000,
              })
              return
            }

            // 调用真实的退出登录接口
            console.log('开始调用退出登录接口...')
            const response = await Taro.request({
              url: 'http://localhost:8011/api/auth/wx/logout/',
              method: 'POST',
              header: {
                'Content-Type': 'application/json',
                'X-API-Key': '123quant-speed',
                'X-CSRFTOKEN': 'QjAtpufAC7oTUhnKbQaG8GWwvZ91U2xptiRnJk19S6UXeNW1X6wnmAe6RgYJDf1M',
                'Accept': 'application/json'
              },
              data: {
                login_token: loginToken
              }
            })

            console.log('退出登录接口响应:', response.data)

            // 无论接口返回什么，都清除本地状态
            await logout()
            
            if (response.data && response.data.code === 0) {
              Taro.showToast({
                title: '已退出登录',
                icon: 'success',
                duration: 2000,
              })
            } else {
              // 即使接口报错，也显示退出成功（因为本地状态已清除）
              Taro.showToast({
                title: '已退出登录',
                icon: 'success',
                duration: 2000,
              })
            }
          } catch (error) {
            console.error('退出登录接口调用失败:', error)
            // 即使接口调用失败，也清除本地状态并显示退出成功
            await logout()
            Taro.showToast({
              title: '已退出登录',
              icon: 'success',
              duration: 2000,
            })
          }
        }
      },
    })
  }

  // 1. 获取头像 (Logged in user only)
  const handleSetAvatar = async (avatarUrl: string) => {
    const serverUrl = await uploadAvatar(avatarUrl)
    if (serverUrl) {
      setAvatar(serverUrl)
    }
  }

  // 跳转到登录页
  const handleGoToLogin = () => {
    Taro.navigateTo({
      url: '/pages/login/index'
    })
  }

  // 跳转到我的设计
  const handleGoToDesigns = () => {
    if (!isLoggedIn || !user) {
      Taro.showModal({
        title: '提示',
        content: '登录以后才能查询到设计信息',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            handleGoToLogin()
          }
        }
      })
      return
    }
    Taro.navigateTo({
      url: '/pages/designs/index',
    })
  }

  // 跳转到订单列表
  const handleGoToOrders = () => {
    if (!isLoggedIn || !user) {
      Taro.showModal({
        title: '提示',
        content: '请先登录后查看订单',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            handleGoToLogin()
          }
        }
      })
      return
    }

    Taro.navigateTo({
      url: '/pages/order/list/index',
    })
  }

  // 跳转到客服支持
  const handleGoToSupport = () => {
    Taro.navigateTo({
      url: '/pages/support/index',
    })
  }

  // 加载中状态
  if (loading) {
    return <Loading fullscreen />
  }

  const isUserLoggedIn = isLoggedIn && user

  return (
    <View className='profile-page'>
      {/* 用户信息区域 */}
      <View className='user-info-section'>
        {isUserLoggedIn ? (
          <Button 
            openType="chooseAvatar" 
            onChooseAvatar={(e) => handleSetAvatar(e.detail.avatarUrl)}
            className='avatar-button'
            type='default'
          >
            <View className='user-avatar'>
              <Image
                className='avatar-image'
                src={user.avatar || avatar || 'https://img.icons8.com/clouds/200/user.png'}
                mode='aspectFill'
              />
            </View>
          </Button>
        ) : (
          <View className='avatar-button' onClick={handleGoToLogin}>
            <View className='user-avatar'>
              <Image
                className='avatar-image'
                src='https://img.icons8.com/clouds/200/user.png'
                mode='aspectFill'
              />
            </View>
          </View>
        )}
        
        <View className='user-details' onClick={!isUserLoggedIn ? handleGoToLogin : undefined}>
          <Text className='user-nickname'>
            {isUserLoggedIn ? (user.nickname || nickname || '未设置昵称') : '点击登录/注册'}
          </Text>
          {isUserLoggedIn && (user.phone || phone) && <Text className='user-phone'>{user.phone || phone}</Text>}
          {!isUserLoggedIn && <Text className='user-phone'>登录后查看更多信息</Text>}
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


        <View className='menu-item' onClick={handleGoToSupport}>
          <View className='menu-item-left'>
            <Text className='menu-icon'>🎧</Text>
            <Text className='menu-text'>联系我们</Text>
          </View>
          <Text className='menu-arrow'>›</Text>
        </View>
      </View>

      {/* 退出登录按钮 - 仅登录时显示 */}
      {isUserLoggedIn && (
        <View className='logout-section'>
          <Button className='logout-button' onClick={handleLogout}>
            退出登录
          </Button>
        </View>
      )}

      {/* 错误提示 */}
      {error && (
        <View className='error-message'>
          <Text>{error}</Text>
        </View>
      )}
    </View>
  )
}
