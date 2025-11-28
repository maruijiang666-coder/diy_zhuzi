const ENV = process.env.TARO_ENV || 'weapp'

export const API_BASE_URL = {
  development: 'https://dev-api.example.com/v1',
  test: 'https://test-api.example.com/v1',
  production: 'https://api.example.com/v1',
}[process.env.NODE_ENV || 'development'] || 'https://api.example.com/v1'

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
