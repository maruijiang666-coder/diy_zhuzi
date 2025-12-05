import { View, Text, Image, Button, Input } from '@tarojs/components'
import { useEffect, useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import { useUserStore } from '../../stores/useUserStore'
import { Loading, Empty } from '../../components/common'
import { setStorage, getStorage, setToken, STORAGE_KEYS } from '../../utils/storage'
import './index.scss'

export default function ProfilePage() {
  const { user, isLoggedIn, loading, error, login, logout, loadUserInfo, clearError } = useUserStore()
  const hasAttemptedLoad = useRef(false)
  const [avatar, setAvatar] = useState<string>('')
  const [nickname, setNickname] = useState<string>('')
  const [phone, setPhone] = useState<string>('')

  useEffect(() => {
    // 页面加载时检查登录状态
    if (isLoggedIn && !user && !hasAttemptedLoad.current) {
      hasAttemptedLoad.current = true
      // 延迟加载用户信息，确保token生效
      setTimeout(() => {
        loadUserInfo().catch((err) => {
          console.error('加载用户信息失败:', err)
          // 如果是 401 错误，清除登录状态
          if (err.code === '401' || err.type === 'NETWORK_ERROR') {
            logout()
          }
        })
      }, 300)
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

  // 处理微信登录
  const handleWechatLogin = async () => {
    try {
      clearError()
      
      Taro.showLoading({ title: '登录中...', mask: true })
      
      // 先获取微信登录凭证
      const loginResult = await Taro.login()
      console.log('微信登录凭证获取成功:', loginResult)
      
      // 准备登录数据（使用已获取的用户信息，不再调用getUserProfile）
      // 验证头像URL格式
      let finalAvatar = avatar || 'https://img.icons8.com/clouds/200/user.png'
      if (avatar && !avatar.startsWith('http')) {
        // 如果头像不是完整URL，使用默认头像
        finalAvatar = 'https://img.icons8.com/clouds/200/user.png'
      }
      
      console.log('原始头像URL:', avatar)
      console.log('验证后的头像URL:', finalAvatar)
      
      const loginData = {
        code: loginResult.code, // 使用临时登录凭证code
        app_type: 'diy',
        nickname: nickname || '微信用户', // 使用已获取的昵称
        avatar: finalAvatar, // 使用验证后的头像
        gender: 0, // 默认未知
        phone_number: phone || '13800138000', // 使用已获取的手机号，如果没有则使用默认手机号
        country: 'china', // 默认值
        province: 'yunnan', // 默认值
        city: 'kunming', // 默认值
        language: 'zh_CN' // 默认中文
      }
      
      // 验证必填字段
      if (!loginData.code) {
        throw new Error('获取微信登录凭证失败')
      }
      if (!loginData.app_type) {
        throw new Error('应用类型不能为空')
      }
      
      console.log('准备发送到服务器的登录数据:', loginData)
      console.log('头像URL类型:', typeof loginData.avatar)
      console.log('头像URL长度:', loginData.avatar ? loginData.avatar.length : 0)
      
      // 发送到真实服务器进行登录
      console.log('开始调用后端登录接口...')
      const response = await Taro.request({
        url: 'https://crystal.quant-speed.com/api/auth/wx/login/',
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'X-CSRFTOKEN': 'QjAtpufAC7oTUhnKbQaG8GWwvZ91U2xptiRnJk19S6UXeNW1X6wnmAe6RgYJDf1M',
          'Accept': 'application/json'
        },
        data: loginData,
        timeout: 10000 // 10秒超时
      })
      
      console.log('服务器登录响应:', response.data)
      console.log('服务器响应状态:', response.statusCode)
      console.log('服务器响应头:', response.header)
      
      // 检查响应状态
      if (response.statusCode !== 200) {
        throw new Error(`服务器返回错误状态码: ${response.statusCode}`)
      }
      
      const responseData = response.data
      
      // 检查后端返回的业务状态码
      if (responseData.code === 0) {
        // 登录成功，保存token和用户信息
        const { token, user_info } = responseData.data
        
        console.log('登录成功，获取到token:', token)
        console.log('用户信息:', user_info)
        
        // 保存token到本地存储（使用正确的工具函数）
        await setToken(token)
        
        // 确保token立即生效
        console.log('Token已保存，等待生效...')
        
        // 更新用户信息到缓存
        try {
          if (avatar) await setStorage(STORAGE_KEYS.USER_AVATAR, avatar)
          if (nickname) await setStorage(STORAGE_KEYS.USER_NICKNAME, nickname)
          if (phone) await setStorage(STORAGE_KEYS.USER_PHONE, phone)
          console.log('用户信息已同步到缓存')
        } catch (error) {
          console.error('同步用户信息到缓存失败:', error)
        }
        
        Taro.hideLoading()
        
        Taro.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 2000,
        })
        
        // 登录成功后使用返回的用户信息更新状态
        if (user_info) {
          // 验证返回的头像URL
          let finalUserAvatar = user_info.avatar
          if (finalUserAvatar && !finalUserAvatar.startsWith('http')) {
            finalUserAvatar = 'https://img.icons8.com/clouds/200/user.png'
          }
          
          // 使用返回的用户信息更新当前状态
          setNickname(user_info.nickname || nickname || '微信用户')
          setAvatar(finalUserAvatar || 'https://img.icons8.com/clouds/200/user.png')
          
          // 保存到缓存
          try {
            if (user_info.nickname) await setStorage(STORAGE_KEYS.USER_NICKNAME, user_info.nickname)
            if (finalUserAvatar) await setStorage(STORAGE_KEYS.USER_AVATAR, finalUserAvatar)
            console.log('用户信息已更新到缓存')
          } catch (error) {
            console.error('更新用户信息到缓存失败:', error)
          }
        }
        
        // 延迟刷新用户信息，确保token生效
        setTimeout(() => {
          loadUserInfo().catch(err => {
            console.error('延迟加载用户信息失败:', err)
          })
        }, 500)
      } else if (responseData.code === 400) {
        // 参数错误 - 显示具体的字段错误信息
        let errorMsg = responseData.message || '请求参数错误'
        if (responseData.data && typeof responseData.data === 'object') {
          const fieldErrors = []
          for (const [field, errors] of Object.entries(responseData.data)) {
            if (Array.isArray(errors)) {
              fieldErrors.push(`${field}: ${errors.join(', ')}`)
            }
          }
          if (fieldErrors.length > 0) {
            errorMsg += ` (${fieldErrors.join('; ')})`
          }
        }
        throw new Error(errorMsg)
      } else if (responseData.code === 401) {
        // 未授权
        throw new Error(responseData.message || '登录凭证无效')
      } else if (responseData.code === 500) {
        // 服务器错误
        throw new Error(responseData.message || '服务器内部错误')
      } else {
        // 其他错误
        throw new Error(responseData.message || `登录失败 (错误码: ${responseData.code})`)
      }
      
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
  const handleSetAvatar = async (avatarUrl: string) => {
    console.log('获取头像成功:', avatarUrl)
    setAvatar(avatarUrl)
    // 保存头像到缓存
    try {
      await setStorage(STORAGE_KEYS.USER_AVATAR, avatarUrl)
      console.log('头像已保存到缓存')
    } catch (error) {
      console.error('保存头像到缓存失败:', error)
    }
    Taro.showToast({
      title: '头像获取成功',
      icon: 'success',
      duration: 2000
    })
  }

  // 2. 获取昵称
  const handleNicknameChange = async (e: any) => {
    const nickname = e.detail.value
    console.log('获取昵称:', nickname)
    setNickname(nickname)
    // 保存昵称到缓存
    try {
      await setStorage(STORAGE_KEYS.USER_NICKNAME, nickname)
      console.log('昵称已保存到缓存')
    } catch (error) {
      console.error('保存昵称到缓存失败:', error)
    }
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
          setPhone(phoneNumber)
          // 保存手机号到缓存
          try {
            await setStorage(STORAGE_KEYS.USER_PHONE, phoneNumber)
            console.log('手机号已保存到缓存')
          } catch (error) {
            console.error('保存手机号到缓存失败:', error)
          }
          Taro.showToast({
            title: '手机号获取成功',
            icon: 'success',
            duration: 2000
          })
          
          // 获取手机号成功后，等弹窗显示完毕执行微信登录
          setTimeout(() => {
            handleWechatLogin()
          }, 2000)

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
            onChooseAvatar={(e) => handleSetAvatar(e.detail.avatarUrl)}
            className='avatar-button'
            type='default'
          >
            <View className='empty-state'>
              <Image 
                className='empty-icon' 
                src={avatar || 'https://img.icons8.com/clouds/200/user.png'}
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
            value={nickname}
            onInput={handleNicknameChange}
            onClick={() => {
              // 点击输入框时自动聚焦，提升用户体验
              console.log('点击昵称输入框')
            }}
          />
          {/* <Button 
            className='login-button' 
            type='primary'
            onClick={handleWechatLogin}
          >
            微信登录
          </Button> */}




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
            src={user.avatar || avatar || 'https://img.icons8.com/clouds/200/user.png'}
            mode='aspectFill'
          />
        </View>
        <View className='user-details'>
          <Text className='user-nickname'>{user.nickname || nickname || '未设置昵称'}</Text>
          {(user.phone || phone) && <Text className='user-phone'>{user.phone || phone}</Text>}
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
