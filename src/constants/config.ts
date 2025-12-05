const ENV = process.env.TARO_ENV || 'weapp'

// API 基础地址配置
// 注意：不同的 API 有不同的基础路径
// - 认证相关: /api/auth
// - DIY业务相关: /api/diy
export const API_BASE_URL = {
  development: 'https://therianclouds.mynatapp.cc/api',
  test: 'https://therianclouds.mynatapp.cc/api',
  production: 'https://crystal.quant-speed.com/api',
}[process.env.NODE_ENV || 'development'] || 'https://therianclouds.mynatapp.cc/api'


// API Key 配置
export const API_KEY = '123quant-speed'

// CDN配置
export const CDN_BASE_URL = {
  development: 'https://dev-cdn.example.com',
  test: 'https://test-cdn.example.com',
  production: 'https://cdn.example.com',
}[process.env.NODE_ENV || 'development'] || 'https://cdn.example.com'

// 图片优化配置
export const IMAGE_CONFIG = {
  // 是否启用WebP格式
  enableWebP: true,
  // 是否启用图片懒加载
  enableLazyLoad: true,
  // 图片质量（1-100）
  quality: 80,
  // 图片预加载最大并发数
  preloadConcurrency: 3,
}

export const APP_CONFIG = {
  env: ENV,
  version: '1.0.0',
}
