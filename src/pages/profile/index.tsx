import { View, Text, Image, Button, Input } from '@tarojs/components'
import { useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import { useUserStore } from '../../stores/useUserStore'
import { Loading, Empty } from '../../components/common'
import './index.scss'

export default function ProfilePage() {
  const { user, isLoggedIn, loading, error, login, logout, loadUserInfo, clearError, updateUserInfo } = useUserStore()
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
    console.log('=== handleWechatLogin 函数被调用 ===')
    try {
      console.log('准备调用 clearError...')
      clearError()

      console.log('开始微信登录流程')
      console.log('准备调用 Taro.getUserProfile...')
      
      // 先获取用户信息（必须在用户点击事件中调用）
      console.log('准备创建 Promise...')
      const userInfo = await new Promise<any>((resolve, reject) => {
        console.log('Promise 创建成功，准备调用 Taro.getUserProfile...')
        console.log('Taro 对象:', Taro)
        console.log('Taro.getUserProfile 函数:', Taro.getUserProfile)
        console.log('Taro.getUserProfile 类型:', typeof Taro.getUserProfile)
        
        try {
          Taro.getUserProfile({
            desc: '用于完善会员资料', // 声明获取用户个人信息后的用途
            success: (res) => {
              console.log('获取微信用户信息成功', res.userInfo)
              resolve(res.userInfo)
            },
            fail: (err) => {
              console.warn('用户拒绝了获取用户信息', err)
              console.log('getUserProfile fail error:', err)
              console.log('错误类型:', typeof err)
              console.log('错误对象:', err)
              // 用户拒绝时，返回默认信息
              resolve({
                nickName: '微信用户',
                avatarUrl: 'https://img.icons8.com/clouds/200/user.png'
              })
            }
          })
        } catch (error) {
          console.error('调用 getUserProfile 时发生错误:', error)
          console.error('错误详情:', {
            message: error.message,
            stack: error.stack,
            error: error
          })
          // 发生错误时，返回默认信息
          resolve({
            nickName: '微信用户',
            avatarUrl: 'https://img.icons8.com/clouds/200/user.png'
          })
        }
      })
      
      console.log('获取用户信息结果:', userInfo)
      
      console.log('准备调用登录接口...')
      Taro.showLoading({ title: '登录中...', mask: true })
      
      // 调用登录接口，传入用户信息
      await login(userInfo)
      
      Taro.hideLoading()
      
      Taro.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 2000,
      })
    } catch (error: any) {
      Taro.hideLoading()
      console.error('登录失败:', error)
      console.error('错误详情:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        error: error
      })
      
      // 根据错误码提供更友好的提示
      let errorMessage = error.message || '登录失败'
      if (error.code === '502') {
        errorMessage = '服务器暂时无法访问，请稍后再试'
      } else if (error.code === '500') {
        errorMessage = '服务器内部错误，请稍后再试'
      } else if (error.code === '404') {
        errorMessage = '登录接口不存在'
      } else if (error.message && error.message.includes('getUserProfile')) {
        errorMessage = '获取用户信息失败，请确保在微信环境中操作'
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
            onClick={() => {
              console.log('=== 登录按钮被点击 ===')
              console.log('handleWechatLogin 函数:', handleWechatLogin)
              console.log('函数类型:', typeof handleWechatLogin)
              handleWechatLogin()
            }}
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

  // 处理头像选择
  const handleChooseAvatar = async (e: any) => {
    try {
      const avatarUrl = e.detail.avatarUrl
      console.log('选择头像:', avatarUrl)
      
      if (avatarUrl) {
        await updateUserInfo({ avatar: avatarUrl })
        Taro.showToast({
          title: '头像更新成功',
          icon: 'success',
          duration: 2000,
        })
      }
    } catch (error) {
      console.error('更新头像失败:', error)
      Taro.showToast({
        title: '头像更新失败',
        icon: 'none',
        duration: 2000,
      })
    }
  }

  // 处理昵称输入
  const handleNicknameInput = async (e: any) => {
    try {
      const nickname = e.detail.value
      console.log('输入昵称:', nickname)
      
      if (nickname && nickname !== user.nickname) {
        await updateUserInfo({ nickname })
        Taro.showToast({
          title: '昵称更新成功',
          icon: 'success',
          duration: 2000,
        })
      }
    } catch (error) {
      console.error('更新昵称失败:', error)
      Taro.showToast({
        title: '昵称更新失败',
        icon: 'none',
        duration: 2000,
      })
    }
  }

  // 已登录状态
  return (
    <View className='profile-page'>
      {/* 用户信息区域 */}
      <View className='user-info-section'>
        <View className='user-avatar'>
          <Button 
            className='avatar-button' 
            openType='chooseAvatar'
            onChooseAvatar={handleChooseAvatar}
          >
            <Image
              className='avatar-image'
              src={user.avatar || 'https://img.icons8.com/clouds/200/user.png'}
              mode='aspectFill'
            />
          </Button>
        </View>
        <View className='user-details'>
          <Input
            className='nickname-input'
            type='nickname'
            placeholder='请输入昵称'
            value={user.nickname || ''}
            onInput={handleNicknameInput}
          />
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
