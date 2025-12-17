import Taro from '@tarojs/taro'
import { authService } from '../services/authService'

/**
 * 检查登录状态并在未登录时显示提示
 * @param action 操作名称，用于提示信息
 * @returns 是否已登录
 */
export async function checkLoginAndPrompt(action: string = '继续操作'): Promise<boolean> {
  const isLoggedIn = authService.isLoggedIn()
  
  if (!isLoggedIn) {
    await showLoginPrompt(action)
    return false
  }
  
  return true
}

/**
 * 显示登录提示对话框
 * @param action 操作名称
 */
async function showLoginPrompt(action: string): Promise<void> {
  return new Promise((resolve) => {
    Taro.showModal({
      title: '需要登录',
      content: `${action}需要先登录，是否前往登录？`,
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          navigateToProfile()
        }
        resolve()
      },
      fail: () => {
        resolve()
      }
    })
  })
}

/**
 * 导航到个人中心页面（登录页）
 */
function navigateToProfile(): void {
  Taro.switchTab({
    url: '/pages/profile/index'
  }).catch((err) => {
    console.error('导航到个人中心失败:', err)
    // 如果 switchTab 失败，尝试使用 reLaunch
    Taro.reLaunch({
      url: '/pages/profile/index'
    })
  })
}

/**
 * 页面级别的登录守卫
 * 在页面 onShow 或 useEffect 中调用
 * @param pageName 页面名称，用于日志
 * @returns 是否已登录
 */
export function checkLoginForPage(pageName: string = '当前页面'): boolean {
  const isLoggedIn = authService.isLoggedIn()
  
  if (!isLoggedIn) {
    console.log(`${pageName} 需要登录，跳转到登录页`)
    Taro.showToast({
      title: '请先登录',
      icon: 'none',
      duration: 2000
    })
    
    // 延迟跳转，让提示显示完整
    setTimeout(() => {
      navigateToProfile()
    }, 500)
    
    return false
  }
  
  return true
}
