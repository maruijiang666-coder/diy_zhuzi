import { View, Text, Image, Button, Input } from '@tarojs/components'
import { useState, useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import { useUserStore } from '../../../../stores/useUserStore'
import { setStorage, setToken, getToken, STORAGE_KEYS } from '../../../../utils/storage'
import { authService } from '../../../../services/authService'
import { cleanAndValidateAvatarUrl } from '../../../../utils/avatarUtils'
import { useAvatarUpload } from '../../hooks/useAvatarUpload'
import './index.scss'

interface LoginGuideProps {
  initialAvatar?: string
  initialNickname?: string
  initialPhone?: string
}

export default function LoginGuide({ initialAvatar = '', initialNickname = '', initialPhone = '' }: LoginGuideProps) {
  const { clearError, loadUserInfo } = useUserStore()
  const [avatar, setAvatar] = useState<string>(initialAvatar)
  const [nickname, setNickname] = useState<string>(initialNickname)
  const [phone, setPhone] = useState<string>(initialPhone)
  const [isAgreed, setIsAgreed] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  // 登录中标记：防止并发/重复登录请求，避免微信 code 被重复使用导致「code只能使用一次」
  const isLoggingInRef = useRef(false)
  // 诊断：连续两次 wx.login() 是否返回了同一个 code（DevTools 游客模式常见问题）
  const lastLoginCodeRef = useRef('')
  const usedSameCodeRef = useRef(false)

  const { uploadAvatar } = useAvatarUpload()

  // 尝试从缓存加载用户信息（针对独立页面使用的情况）
  useEffect(() => {
    const initFromStorage = async () => {
      try {
        // 只有当当前 state 为空时才去读取缓存，避免覆盖 props
        if (!initialPhone) {
          const cachedPhone = await Taro.getStorage({ key: STORAGE_KEYS.USER_PHONE }).then(res => res.data).catch(() => '')
          if (cachedPhone) {
            console.log('LoginGuide: 从缓存加载手机号', cachedPhone)
            setPhone(cachedPhone)
          }
        }
        
        if (!initialNickname) {
          const cachedNickname = await Taro.getStorage({ key: STORAGE_KEYS.USER_NICKNAME }).then(res => res.data).catch(() => '')
          if (cachedNickname) {
            console.log('LoginGuide: 从缓存加载昵称', cachedNickname)
            setNickname(cachedNickname)
          }
        }

        if (!initialAvatar) {
          const cachedAvatar = await Taro.getStorage({ key: STORAGE_KEYS.USER_AVATAR }).then(res => res.data).catch(() => '')
          if (cachedAvatar) {
            console.log('LoginGuide: 从缓存加载头像', cachedAvatar)
            setAvatar(cachedAvatar)
          }
        }
      } catch (e) {
        console.error('LoginGuide: 加载缓存失败', e)
      }
    }
    
    initFromStorage()
  }, [initialPhone, initialNickname, initialAvatar])


  // 更新本地状态当 props 变化 (主要是为了初始加载)
  useEffect(() => {
    if (initialAvatar) setAvatar(initialAvatar)
  }, [initialAvatar])

  useEffect(() => {
    if (initialNickname) setNickname(initialNickname)
  }, [initialNickname])

  useEffect(() => {
    if (initialPhone) setPhone(initialPhone)
  }, [initialPhone])

  // 1. 获取头像
  const handleSetAvatar = async (avatarUrl: string) => {
    const serverUrl = await uploadAvatar(avatarUrl)
    if (serverUrl) {
      setAvatar(serverUrl)
    }
  }

  // 2. 获取昵称
  const handleNicknameChange = async (e: any) => {
    const newNickname = e.detail.value
    console.log('获取昵称:', newNickname)
    setNickname(newNickname)
    // 保存昵称到缓存
    try {
      await setStorage(STORAGE_KEYS.USER_NICKNAME, newNickname)
      console.log('昵称已保存到缓存')
    } catch (error) {
      console.error('保存昵称到缓存失败:', error)
    }
    if (newNickname) {
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
    
    // 检查是否同意协议
    if (!isAgreed) {
      Taro.showToast({
        title: '请先阅读并同意用户协议和隐私政策',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      const code = e.detail.code
      console.log('获取手机号成功的code:', code)
      
      try {
        // 使用真实的后端接口获取手机号
        Taro.showLoading({ title: '获取手机号中...' })
        
        const response = await Taro.request({
          url: `http://localhost:8011/api/auth/wx/get_phone_number/`,
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
          // 获取手机号成功后，立即执行微信登录
          handleWechatLogin(phoneNumber)

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

  // 处理微信登录
  const handleWechatLogin = async (phoneNumberOverride?: string) => {
    // 防止并发登录：上一个登录请求未结束前忽略新的点击（避免同一 code 被发送两次）
    if (isLoggingInRef.current) {
      console.warn('登录进行中，忽略重复点击')
      return
    }
    isLoggingInRef.current = true

    try {
      clearError()
      setError('')

      // 重置本次登录的诊断标记
      usedSameCodeRef.current = false
      lastLoginCodeRef.current = ''

      Taro.showLoading({ title: '登录中...', mask: true })

      // 单次登录尝试：获取新 code → 发送 → 解析 token
      const attemptLogin = async () => {
        const loginResult = await Taro.login()
        console.log('wx.login()的code:', loginResult.code)
        if (!loginResult.code) {
          throw new Error('获取微信登录凭证失败')
        }
        // 诊断：检测连续两次 wx.login() 是否返回同一个 code
        if (lastLoginCodeRef.current && loginResult.code === lastLoginCodeRef.current) {
          usedSameCodeRef.current = true
          console.warn('⚠️ wx.login() 连续返回同一个 code，可能是开发者工具游客模式导致:', loginResult.code)
        }
        lastLoginCodeRef.current = loginResult.code

        // 验证头像URL格式
        const finalAvatar = cleanAndValidateAvatarUrl(avatar)

        const loginData = {
          code: loginResult.code, // 使用临时登录凭证code
          app_type: 'diy',
          nickname: nickname || '微信用户',
          avatar: finalAvatar,
          gender: 0,
          phone_number: phoneNumberOverride || phone || '13800138000',
          country: 'china',
          province: 'yunnan',
          city: 'kunming',
          language: 'zh_CN',
        }

        if (!loginData.app_type) {
          throw new Error('应用类型不能为空')
        }

        console.log('准备发送到服务器的登录数据:', loginData)

        const response = await Taro.request({
          url: 'http://localhost:8011/api/auth/wx/login/',
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'X-CSRFTOKEN': 'QjAtpufAC7oTUhnKbQaG8GWwvZ91U2xptiRnJk19S6UXeNW1X6wnmAe6RgYJDf1M',
            'Accept': 'application/json',
          },
          data: loginData,
          timeout: 10000, // 10秒超时
        })

        // ★ 先检查 HTTP 状态码，再读响应体（避免 400 时读取 null 崩溃）
        if (response.statusCode !== 200) {
          const body: any = response.data
          const msg = (body && (body.message || body.error)) || `服务器返回错误状态码: ${response.statusCode}`
          const err: any = new Error(msg)
          err.statusCode = response.statusCode
          err.code = body && body.code !== undefined ? String(body.code) : String(response.statusCode)
          throw err
        }

        // ★ 业务状态码处理
        const responseData: any = response.data
        if (!responseData || responseData.code !== 0) {
          const bizCode = responseData && responseData.code
          let errorMsg = (responseData && responseData.message) || '登录失败'
          if (bizCode === 400 && responseData && responseData.data && typeof responseData.data === 'object') {
            const fieldErrors: string[] = []
            for (const [field, errors] of Object.entries(responseData.data)) {
              if (Array.isArray(errors)) {
                fieldErrors.push(`${field}: ${errors.join(', ')}`)
              }
            }
            if (fieldErrors.length > 0) {
              errorMsg += ` (${fieldErrors.join('; ')})`
            }
          }
          const err: any = new Error(errorMsg)
          err.code = String(bizCode)
          throw err
        }

        // 解析 token 和用户信息（兼容多种返回格式）
        const data = responseData.data || {}
        let token: string | undefined
        let user_info: any
        if (data.login_token) {
          token = data.login_token
          user_info = data.user
        } else if (data.openid) {
          token = data.openid
          user_info = data.user
        } else if (data.token) {
          token = data.token
          user_info = data.user_info
        } else if (data.user && data.user.openid) {
          token = data.user.openid
          user_info = data.user
        }
        if (!token) {
          throw new Error('登录失败：无法从后端响应中获取有效的 token')
        }

        return { token, user_info }
      }

      // 登录：若 code 无效（code 只能用一次等），重新获取 code 自动重试一次
      let result: { token: string; user_info: any } | null = null
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          result = await attemptLogin()
          break
        } catch (e: any) {
          const isCodeError = attempt === 0 && e.code === '400' && /code|登录凭证|凭证/i.test(String(e.message || ''))
          if (!isCodeError) throw e
          console.warn('登录 code 无效，重新获取 code 重试一次:', e.message)
        }
      }
      if (!result) return

      // ---- 登录成功，保存 token 和用户信息 ----
      const { token, user_info } = result

      // 保存 Token 到 Import_code（用于API客户端）和标准 Token 存储
      Taro.setStorageSync('Import_code', token)
      await setToken(token)
      console.log('服务器登录响应 token 已保存')

      // 保存用户真实微信 openid（外部支付需用它，不能把 login_token 当 openid 传）
      const realOpenid = user_info && user_info.openid
      if (realOpenid) {
        await setStorage(STORAGE_KEYS.USER_OPENID, realOpenid)
        console.log('服务器登录响应真实 openid 已保存')
      } else {
        console.warn('登录响应中未找到 user.openid，外部支付可能失败')
      }

      // 更新用户信息到缓存
      try {
        if (avatar) await setStorage(STORAGE_KEYS.USER_AVATAR, avatar)
        if (nickname) await setStorage(STORAGE_KEYS.USER_NICKNAME, nickname)
        if (phone) await setStorage(STORAGE_KEYS.USER_PHONE, phone)
      } catch (error) {
        console.error('同步用户信息到缓存失败:', error)
      }

      Taro.hideLoading()
      Taro.showToast({ title: '登录成功', icon: 'success', duration: 2000 })

      // 登录成功后使用返回的用户信息更新状态
      if (user_info) {
        const finalUserAvatar = cleanAndValidateAvatarUrl(user_info.avatar)
        setNickname(user_info.nickname || nickname || '微信用户')
        setAvatar(finalUserAvatar || 'https://img.icons8.com/clouds/200/user.png')
        try {
          if (user_info.nickname) await setStorage(STORAGE_KEYS.USER_NICKNAME, user_info.nickname)
          if (finalUserAvatar) await setStorage(STORAGE_KEYS.USER_AVATAR, finalUserAvatar)
        } catch (error) {
          console.error('更新用户信息到缓存失败:', error)
        }
      }

      // 延迟刷新用户信息，确保token生效
      setTimeout(async () => {
        try {
          const isValid = await authService.validateToken()

          if (!isValid) {
            Taro.showToast({ title: '登录状态异常，请重新登录', icon: 'none', duration: 3000 })
            await setToken('')
            return
          }

          await loadUserInfo()

          Taro.showToast({ title: '登录成功', icon: 'success', duration: 2000 })

          // 登录成功后返回上一页
          setTimeout(() => {
            const pages = Taro.getCurrentPages()
            if (pages.length > 1) {
              Taro.navigateBack()
            } else {
              Taro.switchTab({ url: '/pages/profile/index' })
            }
          }, 1500)
        } catch (err: any) {
          console.error('延迟加载用户信息失败:', err)
          if (err.code === '401' || err.type === 'NETWORK_ERROR') {
            Taro.showToast({ title: '登录状态异常，请重新登录', icon: 'none', duration: 3000 })
            await setToken('')
          }
        }
      }, 1500)

    } catch (error: any) {
      Taro.hideLoading()
      console.error('登录失败:', error)

      let errorMessage = error.message || '登录失败'
      if (error.code === '502') {
        errorMessage = '服务器暂时无法访问，请稍后再试'
      } else if (error.code === '500') {
        errorMessage = '服务器内部错误，请稍后再试'
      } else if (error.code === '404') {
        errorMessage = '登录接口不存在'
      }

      // 若连续两次 wx.login() 返回同一个 code，说明是开发者工具/游客模式的问题，给出明确提示
      if (usedSameCodeRef.current) {
        errorMessage = `${errorMessage}（连续两次获取到相同的登录凭证 code，疑似开发者工具游客模式问题：请在开发者工具右上角切换为已登录的微信账号，或用真机预览/真机调试登录）`
      }

      setError(errorMessage)
      Taro.showToast({ title: errorMessage, icon: 'none', duration: 3000 })
    } finally {
      // 无论成功失败都释放登录锁
      isLoggingInRef.current = false
    }
  }

  // 查看用户协议
  const handleShowAgreement = (e: any) => {
    e.stopPropagation()
    Taro.navigateTo({
      url: '/pages/agreement/index?type=user'
    })
  }

  // 查看隐私政策
  const handleShowPrivacy = (e: any) => {
    e.stopPropagation()
    Taro.navigateTo({
      url: '/pages/agreement/index?type=privacy'
    })
  }

  // 4. 处理快速登录（针对老用户）
  const handleQuickLogin = async () => {
    // 检查是否同意协议
    if (!isAgreed) {
      Taro.showToast({
        title: '请先阅读并同意用户协议和隐私政策',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    // 使用当前缓存的手机号直接登录
    await handleWechatLogin(phone)
  }

  return (
    <View className='login-section'>
      <View className='login-card'>
        <View className='login-header'>
          <Text className='login-title'>欢迎登录</Text>
          <Text className='login-subtitle'>登录后体验更多精彩功能</Text>
        </View>

        <Button 
          openType="chooseAvatar" 
          onChooseAvatar={(e) => handleSetAvatar(e.detail.avatarUrl)}
          className='avatar-button'
          type='default'
        > 
          <View className='avatar-wrapper'>
            <Image 
              className='avatar-image' 
              src={avatar || 'https://img.icons8.com/clouds/200/user.png'}
              mode='aspectFill'
            />
            <View className='avatar-edit-icon'>
              <Text>📷</Text>
            </View>
          </View>
          <Text className='avatar-tip'>点击设置头像</Text>
        </Button> 

        <View className='input-group'>
          <Text className='input-label'>昵称</Text>
          <Input 
            type="nickname" 
            placeholder="请输入昵称"
            placeholderClass="input-placeholder"
            className='nickname-input'
            value={nickname}
            onInput={handleNicknameChange}
          />
        </View>

        <View className='agreement-container' onClick={() => setIsAgreed(!isAgreed)}>
          <View className={`checkbox ${isAgreed ? 'checked' : ''}`}>
            {isAgreed && <Text className='check-icon'>✓</Text>}
          </View>
          <View className='agreement-text'>
            我已阅读并同意
            <Text className='link' onClick={handleShowAgreement}>《用户协议》</Text>
            和
            <Text className='link' onClick={handleShowPrivacy}>《隐私政策》</Text>
          </View>
        </View>

        {phone ? (
          <Button 
            className={`phone-button ${!isAgreed ? 'disabled' : ''}`}
            type='primary'
            onClick={handleQuickLogin}
          >
            一键登录
          </Button>
        ) : (
          <Button 
            openType="getPhoneNumber" 
            onGetPhoneNumber={handleGetPhoneNumber}
            className={`phone-button ${!isAgreed ? 'disabled' : ''}`}
            type='primary'
          >
            获取手机号登录
          </Button>
        )}
      </View>
      
      {error && (
        <View className='error-message'>
          <Text>{error}</Text>
        </View>
      )}
    </View>
  )
}
