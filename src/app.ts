import { PropsWithChildren } from 'react'
import Taro, { useLaunch, useDidShow } from '@tarojs/taro'
import { authService } from './services/authService'

import './app.css'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('App launched.')
    
    // 应用启动时检查登录状态并跳转到合适的页面
    const isLoggedIn = authService.isLoggedIn()
    console.log('应用启动，登录状态:', isLoggedIn)
    
    // 获取当前页面栈
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const currentRoute = currentPage && currentPage.route ? currentPage.route : ''
    
    console.log('当前页面路由:', currentRoute)
    
    // 如果已登录且当前在 profile 页面，跳转到 diy 页面
    if (isLoggedIn && currentRoute === 'pages/profile/index') {
      console.log('用户已登录，跳转到 DIY 页面')
      setTimeout(() => {
        Taro.switchTab({
          url: '/pages/diy/index'
        }).catch(function(err) {
          console.error('跳转到 DIY 页面失败:', err)
        })
      }, 100)
    }
    // 如果未登录且当前不在 profile 页面且不在 diy 页面，跳转到 profile 页面
    else if (!isLoggedIn && currentRoute !== 'pages/profile/index' && currentRoute !== 'pages/diy/index') {
      console.log('用户未登录，跳转到个人中心页面')
      setTimeout(() => {
        Taro.switchTab({
          url: '/pages/profile/index'
        }).catch(function(err) {
          console.error('跳转到个人中心页面失败:', err)
        })
      }, 100)
    }
  })

  // 监听页面显示，实现全局路由守卫
  useDidShow(() => {
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const currentRoute = currentPage && currentPage.route ? currentPage.route : ''
    
    console.log('页面显示，当前路由:', currentRoute)
    
    // 需要登录才能访问的页面列表
    const protectedPages = [
      'pages/cart/index',
      'pages/designs/index',
      'pages/order/list/index',
      'pages/order/detail/index',
      'pages/order/confirm/index'
    ]
    
    // 检查当前页面是否需要登录
    const needsLogin = protectedPages.includes(currentRoute)
    
    if (needsLogin) {
      const isLoggedIn = authService.isLoggedIn()
      
      if (!isLoggedIn) {
        console.log('页面 ' + currentRoute + ' 需要登录，显示登录提示')
        
        // 显示对话框提示用户去登录
        Taro.showModal({
          title: '需要登录',
          content: '访问此页面需要先登录，是否前往登录？',
          confirmText: '去登录',
          cancelText: '取消',
          success: function(res) {
            if (res.confirm) {
              // 用户点击"去登录"
              Taro.switchTab({
                url: '/pages/profile/index'
              }).catch(function(err) {
                console.error('跳转到登录页失败:', err)
                // 如果 switchTab 失败，尝试使用 reLaunch
                Taro.reLaunch({
                  url: '/pages/profile/index'
                })
              })
            } else {
              // 用户点击"取消"，返回上一页或跳转到个人中心
              const pageStack = Taro.getCurrentPages()
              if (pageStack.length > 1) {
                // 有上一页，返回上一页
                Taro.navigateBack()
              } else {
                // 没有上一页，跳转到个人中心
                Taro.switchTab({
                  url: '/pages/profile/index'
                })
              }
            }
          }
        })
      }
    }
  })

  // children 是将要会渲染的页面
  return children
}
  


export default App
