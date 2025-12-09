import { View, Text, Image, Button, Input } from '@tarojs/components'
import { useEffect, useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import { useUserStore } from '../../stores/useUserStore'
import { Loading, Empty } from '../../components/common'
import { setStorage, getStorage, setToken, getToken, STORAGE_KEYS } from '../../utils/storage'
import { authService } from '../../services/authService'
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

  // 清理和验证头像URL
  const cleanAndValidateAvatarUrl = (avatarUrl: string): string => {
    if (!avatarUrl) return 'https://img.icons8.com/clouds/200/user.png'
    
    // 清理URL中的特殊字符（如反引号、空格等）
    let cleanedUrl = avatarUrl.replace(/^`|`$/g, '').trim()
    cleanedUrl = cleanedUrl.replace(/\s+/g, '') // 移除所有空格
    
    // 检查是否包含反引号或其他非法字符
    if (avatarUrl.includes('`') || avatarUrl.includes('\n') || avatarUrl.includes('\r')) {
      console.log('检测到非法字符，使用默认头像')
      return 'https://img.icons8.com/clouds/200/user.png'
    }
    
    // 验证URL格式
    if (!cleanedUrl.startsWith('http')) {
      console.log('URL格式不合法，使用默认头像')
      return 'https://img.icons8.com/clouds/200/user.png'
    }
    
    // 检查URL长度（防止过长的URL）
    if (cleanedUrl.length > 500) {
      console.log('URL过长，使用默认头像')
      return 'https://img.icons8.com/clouds/200/user.png'
    }
    
    console.log('头像URL验证通过:', cleanedUrl)
    return cleanedUrl
  }

  // 处理微信登录
  const handleWechatLogin = async () => {
    try {
      clearError()
      
      Taro.showLoading({ title: '登录中...', mask: true })
      
      // 先获取微信登录凭证
      const loginResult = await Taro.login()
      console.log('wx.login()的code:', loginResult)
      
      // 准备登录数据（使用已获取的用户信息，不再调用getUserProfile）
      // 验证头像URL格式
      console.log('开始验证头像URL，原始值:', avatar)
      
      const finalAvatar = cleanAndValidateAvatarUrl(avatar)
      console.log('验证后的最终头像URL:', finalAvatar)
      
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
      // 保存Token到Import_code（用于API客户端）
      Taro.setStorageSync('Import_code', response.data.data.login_token)
      // 同时保存到标准Token存储（用于一致性）
      await setToken(response.data.data.login_token)
      console.log('服务器登录响应--*-*-*-*-*-*:', response.data)
      console.log('服务器响应状态:', response.statusCode)
      console.log('服务器响应头:', response.header)
      
      // 检查响应状态
      if (response.statusCode !== 200) {
        throw new Error(`服务器返回错误状态码: ${response.statusCode}`)
      }
      
      const responseData = response.data
      
      // 详细查看后端返回的数据结构
      console.log('后端响应数据结构:', JSON.stringify(responseData, null, 2))
      console.log('responseData.data:', responseData.data)
      console.log('responseData.code:', responseData.code)
      console.log('responseData.message:', responseData.message)
      
      // 检查后端返回的业务状态码
      if (responseData.code === 0) {
        // 登录成功，保存token和用户信息
        // 注意：需要先查看实际的数据结构
        const data = responseData.data
        console.log('data 对象:', data)
        console.log('data 的所有属性:', Object.keys(data))
        console.log('data 对象完整内容:', JSON.stringify(data, null, 2))
        
        // 尝试不同的字段组合
        let token, user_info
        
        if (data.openid) {
          // 如果存在 openid 字段
          token = data.openid
          user_info = data.user
          console.log('使用 openid 作为 token:', token)
        } else if (data.token) {
          // 如果存在 token 字段
          token = data.token
          user_info = data.user_info
          console.log('使用 token 字段:', token)
        } else {
          // 其他情况，尝试从用户对象中获取 openid
          console.log('尝试从用户对象中获取 openid...')
          if (data.user && data.user.openid) {
            token = data.user.openid
            user_info = data.user
            console.log('从 user.openid 获取 token:', token)
          } else {
            console.error('无法找到合适的 token 字段，可用数据:', data)
            throw new Error('登录失败：无法从后端响应中获取有效的 token')
          }
        }
        
        console.log('最终使用的 token:', token)
        console.log('用户信息:', user_info)
        
        // 保存token到本地存储（使用正确的工具函数）
        console.log('开始保存token...')
        try {
          await setToken(token)
          console.log('Token保存完成')
        } catch (saveError) {
          console.error('Token保存失败:', saveError)
          throw new Error(`Token保存失败: ${saveError.message}`)
        }
        
        // 确保token立即生效，等待存储完成
        console.log('Token已保存，等待生效...')
        
        // 验证token是否正确保存
        let savedToken
        try {
          savedToken = await getToken()
          console.log('验证保存的token:', savedToken ? savedToken.substring(0, 10) + '...' : 'null')
        } catch (getError) {
          console.error('Token验证失败:', getError)
          throw new Error(`Token验证失败: ${getError.message}`)
        }
        
        if (!savedToken) {
          console.error('Token保存验证失败：保存后获取为null')
          throw new Error('Token保存失败：保存后无法获取token')
        }

        if (savedToken !== token) {
          console.error('Token保存不一致!', {
            原始: token ? token.substring(0, 10) + '...' : 'null',
            保存的: savedToken ? savedToken.substring(0, 10) + '...' : 'null'
          })
        }
        
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
          const finalUserAvatar = cleanAndValidateAvatarUrl(user_info.avatar)
          console.log('登录成功后验证的头像URL:', finalUserAvatar)
          
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
        setTimeout(async () => {
          try {
            // 先验证登录态
            console.log('开始验证登录态...')
            const isValid = await authService.validateToken()
            console.log('登录态验证结果:', isValid)
            
            if (!isValid) {
              console.log('登录态验证失败，需要重新登录')
              Taro.showToast({
                title: '登录状态异常，请重新登录',
                icon: 'none',
                duration: 3000
              })
              // 清除无效token
              await setToken('')
              return
            }
            
            // 登录态有效，再获取用户信息
            console.log('登录态有效，开始获取用户信息...')
            await loadUserInfo()
            
            // 如果用户信息获取成功，显示成功提示
            Taro.showToast({
              title: '登录成功',
              icon: 'success',
              duration: 2000
            })
            
          } catch (err) {
            console.error('延迟加载用户信息失败:', err)
            console.error('错误详情:', {
              code: err.code,
              type: err.type,
              message: err.message
            })
            
            // 如果是401错误，可能需要重新登录
            if (err.code === '401' || err.type === 'NETWORK_ERROR') {
              console.log('Token可能无效，需要重新登录')
              Taro.showToast({
                title: '登录状态异常，请重新登录',
                icon: 'none',
                duration: 3000
              })
              // 清除无效token
              await setToken('')
            }
          }
        }, 1500) // 减少到1.5秒，平衡等待时间
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
              url: 'https://crystal.quant-speed.com/api/auth/wx/logout/',
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

  // 1. 获取头像 
  const handleSetAvatar = async (avatarUrl: string) => {
    console.log('获取头像成功，原始URL:', avatarUrl)
    
    // 使用验证函数清理和验证头像URL
    const cleanedAvatarUrl = cleanAndValidateAvatarUrl(avatarUrl)
    console.log('验证后的头像URL:', cleanedAvatarUrl)
    
    // 显示上传中提示
    Taro.showLoading({
      title: '上传头像中...',
      mask: true
    })
    
    try {
      // 使用 wx.uploadFile 上传头像到服务器
      const uploadResult = await new Promise<any>((resolve, reject) => {
        Taro.uploadFile({
          url: 'https://data.tangledup-ai.com/upload?folder=diyminiuser',
          filePath: cleanedAvatarUrl,
          name: 'file',
          header: {
            'accept': 'application/json',
            'Content-Type': 'multipart/form-data'
          },
          formData: {
            // 可以添加额外的表单数据
          },
          success: (res) => {
            console.log('头像上传成功:', res)
            resolve(res)
          },
          fail: (err) => {
            console.error('头像上传失败:', err)
            reject(err)
          }
        })
      })
      
      Taro.hideLoading()
      
      // 解析上传结果
      if (uploadResult.statusCode === 200) {
        const responseData = JSON.parse(uploadResult.data)
        console.log('头像上传返回数据:', responseData)
        
        if (responseData.file_url) {
          // 使用服务器返回的图片URL
          const serverAvatarUrl = responseData.file_url
          console.log('服务器头像URL:', serverAvatarUrl)
          
          setAvatar(serverAvatarUrl)
          // 保存头像URL到缓存
          try {
            // 头像缓存键名
            await setStorage(STORAGE_KEYS.USER_AVATAR, serverAvatarUrl)
            console.log('头像URL已保存到缓存')
          } catch (error) {
            console.error('保存头像URL到缓存失败:', error)
          }
          
          Taro.showToast({
            title: '头像上传成功',
            icon: 'success',
            duration: 2000
          })
        } else {
          console.error('上传成功但未返回图片URL:', responseData)
          Taro.showToast({
            title: '头像上传失败',
            icon: 'none',
            duration: 2000
          })
        }
      } else {
        console.error('头像上传失败，状态码:', uploadResult.statusCode)
        Taro.showToast({
          title: '头像上传失败',
          icon: 'none',
          duration: 2000
        })
      }
      
    } catch (error) {
      Taro.hideLoading()
      console.error('头像上传过程出错:', error)
      Taro.showToast({
        title: '头像上传失败',
        icon: 'none',
        duration: 2000
      })
    }
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
      console.log('获取手机号成功的code:', code)
      
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
