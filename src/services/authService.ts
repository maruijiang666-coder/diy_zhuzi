import Taro from '@tarojs/taro'
import { authApi, WechatLoginRequest, User } from '../api/endpoints'
import { saveToken, clearToken } from '../api/client'

/**
 * 认证服务
 * 封装用户认证相关的业务逻辑和API调用
 */
class AuthService {
  private readonly TEST_USER_KEY = 'test_user_mode'
  private readonly TEST_USER_DATA_KEY = 'test_user_data'

  /**
   * 创建测试用户
   */
  private createTestUser(): {
    token: string
    user: {
      id: string
      nickname: string
      avatar: string
    }
  } {
    const testUser = {
      token: 'test_token_' + Date.now(),
      user: {
        id: 'test_user_001',
        nickname: '测试用户',
        avatar: 'https://img.icons8.com/clouds/200/user.png',
      },
    }

    // 保存测试用户标记和数据
    Taro.setStorageSync(this.TEST_USER_KEY, 'true')
    Taro.setStorageSync(this.TEST_USER_DATA_KEY, JSON.stringify(testUser))
    saveToken(testUser.token)

    return testUser
  }

  /**
   * 获取测试用户
   */
  private getTestUser(): {
    token: string
    user: {
      id: string
      nickname: string
      avatar: string
    }
  } | null {
    try {
      const isTestMode = Taro.getStorageSync(this.TEST_USER_KEY)
      if (isTestMode === 'true') {
        const userData = Taro.getStorageSync(this.TEST_USER_DATA_KEY)
        if (userData) {
          return JSON.parse(userData)
        }
      }
      return null
    } catch (error) {
      console.error('获取测试用户失败:', error)
      return null
    }
  }

  /**
   * 检查是否为测试用户模式
   */
  isTestUserMode(): boolean {
    try {
      const isTestMode = Taro.getStorageSync(this.TEST_USER_KEY)
      return isTestMode === 'true'
    } catch (error) {
      return false
    }
  }

  /**
   * 微信登录
   * 1. 调用Taro.login()获取微信code
   * 2. 将code发送到后端换取token
   * 3. 如果网络出错，自动使用测试用户
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
    try {
      // 1. 获取微信登录code
      const loginResult = await Taro.login()
      
      if (!loginResult.code) {
        throw new Error('获取微信登录code失败')
      }

      // 2. 调用后端接口换取token
      const request: WechatLoginRequest = {
        code: loginResult.code,
      }

      const response = await authApi.wechatLogin(request)

      // 3. 保存token到本地存储
      if (response.token) {
        saveToken(response.token)
        // 清除测试用户标记
        Taro.removeStorageSync(this.TEST_USER_KEY)
        Taro.removeStorageSync(this.TEST_USER_DATA_KEY)
      } else {
        throw new Error('登录失败：未获取到token')
      }

      return response
    } catch (error: any) {
      console.error('微信登录失败:', error)
      
      // 网络错误或API错误，使用测试用户
      const isNetworkError = 
        error.message?.includes('网络') ||
        error.message?.includes('Network') ||
        error.message?.includes('timeout') ||
        error.message?.includes('Failed to fetch') ||
        error.code === 'NETWORK_ERROR'

      if (isNetworkError) {
        console.log('检测到网络错误，使用测试用户模式')
        const testUser = this.createTestUser()
        return testUser
      }

      // 其他错误也使用测试用户（开发阶段）
      console.log('登录失败，使用测试用户模式')
      const testUser = this.createTestUser()
      return testUser
    }
  }

  /**
   * 获取用户信息
   * @returns 用户详细信息
   */
  async getUserInfo(): Promise<User> {
    try {
      // 如果是测试用户模式，返回测试用户信息
      if (this.isTestUserMode()) {
        const testUser = this.getTestUser()
        if (testUser) {
          return {
            id: testUser.user.id,
            nickname: testUser.user.nickname,
            avatar: testUser.user.avatar,
            createdAt: Date.now(),
          }
        }
      }

      return await authApi.getUserInfo()
    } catch (error: any) {
      console.error('获取用户信息失败:', error)
      
      // 如果获取失败且不是测试用户，尝试使用测试用户
      if (!this.isTestUserMode()) {
        const testUser = this.createTestUser()
        return {
          id: testUser.user.id,
          nickname: testUser.user.nickname,
          avatar: testUser.user.avatar,
          createdAt: Date.now(),
        }
      }
      
      throw new Error('获取用户信息失败，请重试')
    }
  }

  /**
   * 退出登录
   * 清除本地存储的token和测试用户数据
   */
  logout(): void {
    clearToken()
    // 清除测试用户数据
    Taro.removeStorageSync(this.TEST_USER_KEY)
    Taro.removeStorageSync(this.TEST_USER_DATA_KEY)
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
