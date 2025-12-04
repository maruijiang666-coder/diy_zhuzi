import Taro from '@tarojs/taro'
import { authApi, WechatLoginRequest, User } from '../api/endpoints'
import { saveToken, clearToken } from '../api/client'

/**
 * 认证服务
 * 封装用户认证相关的业务逻辑和API调用
 */
class AuthService {

  /**
   * 微信登录
   * 1. 调用 wx.getUserProfile() 获取用户信息（需要用户授权，必须先调用）
   * 2. 调用 wx.login() 获取临时登录凭证 code
   * 3. 将 code 发送到后端换取 token
   * 
   * 注意：getUserProfile 必须在用户点击事件中直接调用，不能在异步操作之后调用
   * @returns 用户信息和token
   */
  async wechatLogin(): Promise<{
    token: string
    user: {
      id: string
      nickname: string
      avatar: string
    }
  }> {
    console.log('开始微信登录流程...')

    // ========== 模拟登录（开发测试用） ==========
    // 先返回模拟数据，让用户可以立即使用应用
    console.log('使用模拟登录数据')
    const mockToken = 'mock_token_' + Date.now()
    const mockUser = {
      id: 'mock_user_123',
      nickname: '测试用户',
      avatar: 'https://img.icons8.com/clouds/200/user.png',
    }
    
    saveToken(mockToken)
    console.log('模拟登录成功，token 已保存')
    
    // 返回模拟数据
    return {
      token: mockToken,
      user: mockUser,
    }
    // ========== 模拟登录结束 ==========

    /* ========== 真实登录逻辑（暂时注释，需要时取消注释） ==========
    
    // 1. 先调用 getUserProfile 获取用户信息（必须在用户点击事件中直接调用）
    console.log('获取用户授权信息...')
    const profileResult = await Taro.getUserProfile({
      desc: '用于完善用户资料',
    })
    
    if (!profileResult.userInfo) {
      throw new Error('获取用户信息失败')
    }
    
    const wxUserInfo = {
      nickName: profileResult.userInfo.nickName,
      avatarUrl: profileResult.userInfo.avatarUrl,
    }
    
    console.log('用户信息:', wxUserInfo)

    // 2. 获取微信登录 code
    console.log('获取登录凭证...')
    const loginResult = await Taro.login()
    console.log('获取到 code:', loginResult.code)
    
    if (!loginResult.code) {
      throw new Error('获取微信登录 code 失败')
    }

    // 3. 调用后端接口换取 token
    const request: WechatLoginRequest = {
      code: loginResult.code,
      app_type: 'diy', // 应用类型固定为 'diy'
    }

    console.log('发送登录请求到后端:', request)
    const response = await authApi.wechatLogin(request)
    console.log('后端登录响应:', response)

    // 4. 保存 token 到本地存储
    if (!response.token) {
      throw new Error('登录失败：未获取到 token')
    }
    
    saveToken(response.token)
    console.log('登录成功，token 已保存')

    // 5. 返回用户信息（优先使用后端返回的，如果没有则使用微信的）
    return {
      token: response.token,
      user: {
        id: response.user.id,
        nickname: response.user.nickname || wxUserInfo.nickName,
        avatar: response.user.avatar || wxUserInfo.avatarUrl,
      },
    }
    
    ========== 真实登录逻辑结束 ========== */
  }

  /**
   * 获取用户信息
   * @returns 用户详细信息
   */
  async getUserInfo(): Promise<User> {
    return await authApi.getUserInfo()
  }

  /**
   * 退出登录
   * 清除本地存储的token
   */
  logout(): void {
    clearToken()
  }

  /**
   * 检查是否已登录
   * 通过检查本地是否有token来判断
   * @returns 是否已登录
   */
  isLoggedIn(): boolean {
    try {
      const token = Taro.getStorageSync('auth_token')
      return !!token
    } catch (error) {
      console.error('检查登录状态失败:', error)
      return false
    }
  }

  /**
   * 获取用户授权信息（微信用户信息）
   * 需要用户主动授权
   * @returns 微信用户信息
   */
  async getUserProfile(): Promise<{
    nickName: string
    avatarUrl: string
    gender: number
    country: string
    province: string
    city: string
  }> {
    try {
      const result = await Taro.getUserProfile({
        desc: '用于完善用户资料', // 声明获取用户个人信息后的用途
      })

      if (result.userInfo) {
        return {
          nickName: result.userInfo.nickName,
          avatarUrl: result.userInfo.avatarUrl,
          gender: result.userInfo.gender || 0,
          country: result.userInfo.country,
          province: result.userInfo.province,
          city: result.userInfo.city,
        }
      } else {
        throw new Error('获取用户信息失败')
      }
    } catch (error: any) {
      console.error('获取用户授权信息失败:', error)
      
      // 用户拒绝授权
      if (error.errMsg && error.errMsg.includes('auth deny')) {
        throw new Error('您拒绝了授权，无法获取用户信息')
      }
      
      throw new Error('获取用户信息失败，请重试')
    }
  }

  /**
   * 检查登录状态并在未登录时跳转到登录页
   * @returns 是否已登录
   */
  async checkLoginAndRedirect(): Promise<boolean> {
    const isLoggedIn = this.isLoggedIn()
    
    if (!isLoggedIn) {
      // 跳转到个人中心页面（登录页）
      await Taro.reLaunch({
        url: '/pages/profile/index',
      })
      return false
    }
    
    return true
  }
}

// 导出单例
export const authService = new AuthService()
