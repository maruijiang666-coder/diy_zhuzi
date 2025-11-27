const ENV = process.env.TARO_ENV || 'weapp'

export const API_BASE_URL = {
  development: 'https://dev-api.example.com/v1',
  test: 'https://test-api.example.com/v1',
  production: 'https://api.example.com/v1',
}[process.env.NODE_ENV || 'development'] || 'https://api.example.com/v1'

export const APP_CONFIG = {
  env: ENV,
  version: '1.0.0',
}
