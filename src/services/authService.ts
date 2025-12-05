import Taro from '@tarojs/taro'
import * as endpoints from '../api/endpoints'
import { saveToken, clearToken } from '../api/client'

// 类型导入
import type { WechatLoginRequest, User } from '../api/endpoints'

/**
 * 认证服务
 * 封装用户认证相关的业务逻辑和API调用
 * 
 * 微信登录流程（符合微信官方最新规范）：
 * 1. 调用 wx.login() 获取临时登录凭证 code
 * 2. 将 code 发送到后端
 * 3. 后端调用微信服务器换取 openid 和 session_key
 * 4. 后端返回登录态 token
 * 5. 用户通过头像昵称填写组件主动填写信息（可选）
 */
class AuthService {

  /**
   * 微信登录（符合微信官方最新规范）
   * 
   * 注意：
   * - 2021年后，wx.getUserProfile 已废弃
   * - 现在只需要 code 即可完成登录
   * - 用户昵称和头像通过头像昵称填写组件获取（button open-type="chooseAvatar"）
   * 
   * @param userInfo 可选的用户信息（从头像昵称填写组件获取）
   * @returns 用户信息和token
   */
  async wechatLogin(userInfo?: {
    nickname?: string
    avatar?: string
  }): Promise<{
    token: string
    user: {
      id: string
      nickname: string
      avatar: string
    }
  }> {
    console.log('=== 开始微信登录流程 ===')

    try {
      // 1. 获取微信登录 code
      console.log('步骤1: 调用 wx.login() 获取 code...')
      const loginResult = await Taro.login()
      
      if (!loginResult.code) {
        throw new Error('获取微信登录 code 失败')
      }
      
      console.log('✓ 获取到 code:', loginResult.code)

      // 2. 构建登录请求参数
      const request: WechatLoginRequest = {
        code: loginResult.code,
        app_type: 'diy', // 应用类型固定为 'diy'
      }

      // 如果有用户信息，一并发送
      if (userInfo) {
        console.log('包含用户信息:', userInfo)
        // 注意：后端接口文档中这些字段是可选的
        if (userInfo.nickname) {
          (request as any).nickname = userInfo.nickname
        }
        if (userInfo.avatar) {
          (request as any).avatar = userInfo.avatar
        }
      }

      // 3. 调用后端接口换取 token
      console.log('步骤2: 发送登录请求到后端...')
      console.log('请求参数:', request)
      
      const response = await endpoints.authApi.wechatLogin(request)
      console.log('✓ 后端登录响应:', response)

      // 4. 验证响应数据
      if (!response || !response.login_token) {
        console.error('登录响应异常:', response)
        throw new Error('登录失败：未获取到 token')
      }

      // 5. 保存 login_token 到本地存储
      const token = response.login_token
      saveToken(token)
      console.log('✓ login_token 已保存到本地存储')

      // 6. 保存过期时间
      if (response.expires_at) {
        try {
          Taro.setStorageSync('token_expires_at', response.expires_at)
          console.log('✓ token 过期时间已保存:', response.expires_at)
        } catch (error) {
          console.warn('保存 token 过期时间失败:', error)
        }
      }

      // 7. 构建返回的用户信息
      const user = {
        id: String(response.user.id),
        nickname: response.user.nickname || '微信用户',
        avatar: response.user.avatar || 'https://img.icons8.com/clouds/200/user.png',
      }

      console.log('✓ 登录成功，用户信息:', user)
      console.log('=== 微信登录流程完成 ===')

      return {
        token,
        user,
      }
    } catch (error: any) {
      console.error('=== 微信登录失败 ===')
      console.error('错误详情:', error)
      
      // 处理常见错误
      if (error.message) {
        if (error.message.includes('code无效')) {
          throw new Error('登录凭证已过期，请重试')
        }
        if (error.message.includes('应用类型')) {
          throw new Error('应用配置错误，请联系管理员')
        }
        if (error.message.includes('网络')) {
          throw new Error('网络连接失败，请检查网络后重试')
        }
      }
      
      throw new Error(error.message || '登录失败，请重试')
    }
  }

  /**
   * 获取用户信息
   * @returns 用户详细信息
   */
  async getUserInfo(): Promise<User> {
    return await endpoints.authApi.getUserInfo()
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
   * 检查登录态是否即将过期
   * @returns 是否需要刷新
   */
  shouldRefreshToken(): boolean {
    try {
      const expiresAt = Taro.getStorageSync('token_expires_at')
      if (!expiresAt) {
        return false
      }

      const now = new Date().getTime()
      const expires = new Date(expiresAt).getTime()
      
      // 提前 5 分钟刷新
      return now >= (expires - 5 * 60 * 1000)
    } catch (error) {
      console.error('检查 token 过期时间失败:', error)
      return false
    }
  }

  /**
   * 刷新登录态
   * 延长 token 有效期
   */
  async refreshToken(): Promise<void> {
    try {
      const token = Taro.getStorageSync('auth_token')
      if (!token) {
        throw new Error('未找到登录态')
      }

      // 调用后端刷新接口
      const response = await Taro.request({
        url: 'https://therianclouds.mynatapp.cc/api/auth/auth/refresh/',
        method: 'POST',
        data: {
          login_token: token,
        },
        header: {
          'Content-Type': 'application/json',
        },
      })

      if (response.data && response.data.code === 0) {
        // 更新过期时间
        const newExpiresAt = response.data.data.expires_at
        Taro.setStorageSync('token_expires_at', newExpiresAt)
        console.log('✓ 登录态已刷新，新过期时间:', newExpiresAt)
      } else {
        throw new Error('刷新失败')
      }
    } catch (error) {
      console.error('刷新登录态失败:', error)
      throw error
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
