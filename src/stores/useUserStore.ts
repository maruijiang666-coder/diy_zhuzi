import { create } from 'zustand'
import { authService } from '../services/authService'

interface User {
  id: string
  nickname: string
  avatar: string
  phone?: string
  createdAt?: number
}

interface UserStore {
  // 状态
  user: User | null
  token: string | null
  isLoggedIn: boolean
  loading: boolean
  error: string | null

  // 操作
  login: (userInfo?: { nickname?: string; avatar?: string }) => Promise<void>
  logout: () => void
  loadUserInfo: () => Promise<void>
  initializeAuth: () => void
  updateUserInfo: (userInfo: { nickname?: string; avatar?: string }) => Promise<void>

  // 辅助方法
  clearError: () => void
}

export const useUserStore = create<UserStore>((set) => ({
  // 初始状态
  user: null,
  token: null,
  isLoggedIn: authService.isLoggedIn(), // 从本地存储初始化登录状态
  loading: false,
  error: null,

  // 微信登录
  login: async (userInfo?: { nickname?: string; avatar?: string }) => {
    set({ loading: true, error: null })

    try {
      const response = await authService.wechatLogin(userInfo)

      set({
        user: response.user,
        token: response.token,
        isLoggedIn: true,
        loading: false,
      })
    } catch (error: any) {
      const errorMessage = error.message || '登录失败'
      set({ loading: false, error: errorMessage })
      throw error
    }
  },

  // 退出登录
  logout: () => {
    authService.logout()

    set({
      user: null,
      token: null,
      isLoggedIn: false,
      error: null,
    })
  },

  // 加载用户信息
  loadUserInfo: async () => {
    set({ loading: true, error: null })

    try {
      const user = await authService.getUserInfo()

      set({
        user,
        isLoggedIn: true,
        loading: false,
      })
    } catch (error: any) {
      const errorMessage = error.message || '获取用户信息失败'
      set({ loading: false, error: errorMessage })
      throw error
    }
  },

  // 初始化认证状态
  initializeAuth: () => {
    const isLoggedIn = authService.isLoggedIn()
    set({ isLoggedIn })
  },

  // 清除错误信息
  clearError: () => {
    set({ error: null })
  },

  // 更新用户信息
  updateUserInfo: async (userInfo: { nickname?: string; avatar?: string }) => {
    set({ loading: true, error: null })

    try {
      // 更新本地用户信息
      const currentUser = useUserStore.getState().user
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          nickname: userInfo.nickname || currentUser.nickname,
          avatar: userInfo.avatar || currentUser.avatar,
        }
        
        set({
          user: updatedUser,
          loading: false,
        })
        
        // 可以在这里调用后端API更新用户信息
        console.log('用户信息已更新:', updatedUser)
      }
    } catch (error: any) {
      const errorMessage = error.message || '更新用户信息失败'
      set({ loading: false, error: errorMessage })
      throw error
    }
  },
}))
