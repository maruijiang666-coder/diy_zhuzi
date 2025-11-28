import Taro from '@tarojs/taro'
import { API_BASE_URL } from '../constants/config'
import { ApiResponse, ApiErrorCode } from '../types/api'
import { ErrorType, AppError } from '../types/common'

// Token存储key
const TOKEN_KEY = 'auth_token'

// 请求配置接口
interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  params?: Record<string, any>
  headers?: Record<string, string>
  skipAuth?: boolean // 是否跳过认证
}

// 获取Token
function getToken(): string | null {
  try {
    return Taro.getStorageSync(TOKEN_KEY)
  } catch (error) {
    console.error('Failed to get token:', error)
    return null
  }
}

// 保存Token
export function saveToken(token: string): void {
  try {
    Taro.setStorageSync(TOKEN_KEY, token)
  } catch (error) {
    console.error('Failed to save token:', error)
  }
}

// 清除Token
export function clearToken(): void {
  try {
    Taro.removeStorageSync(TOKEN_KEY)
  } catch (error) {
    console.error('Failed to clear token:', error)
  }
}

// 构建完整URL
function buildUrl(url: string, params?: Record<string, any>): string {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`
  
  if (!params || Object.keys(params).length === 0) {
    return fullUrl
  }

  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')

  return queryString ? `${fullUrl}?${queryString}` : fullUrl
}

// 请求拦截器：添加Token和Content-Type
function requestInterceptor(config: RequestConfig): Taro.request.Option {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.headers,
  }

  // 添加Token（除非明确跳过）
  if (!config.skipAuth) {
    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const url = buildUrl(config.url, config.params)

  return {
    url,
    method: config.method || 'GET',
    data: config.data,
    header: headers,
    timeout: 10000, // 10秒超时
  }
}

// 响应拦截器：统一错误处理、Token过期处理
async function responseInterceptor<T>(response: Taro.request.SuccessCallbackResult): Promise<T> {
  const { statusCode, data } = response

  // HTTP状态码检查
  if (statusCode >= 200 && statusCode < 300) {
    const apiResponse = data as ApiResponse<T>

    // API业务状态码检查
    if (apiResponse.code === ApiErrorCode.SUCCESS) {
      return apiResponse.data
    }

    // Token过期处理
    if (apiResponse.code === ApiErrorCode.UNAUTHORIZED) {
      clearToken()
      // 跳转到登录页面
      Taro.reLaunch({ url: '/pages/profile/index' })
      throw createAppError(ErrorType.NETWORK_ERROR, 'Token已过期，请重新登录', apiResponse.code)
    }

    // 其他业务错误
    throw createAppError(ErrorType.NETWORK_ERROR, apiResponse.message, apiResponse.code)
  }

  // HTTP错误
  throw createAppError(ErrorType.NETWORK_ERROR, `请求失败: ${statusCode}`, statusCode)
}

// 创建应用错误对象
function createAppError(type: ErrorType, message: string, code?: number): AppError {
  return {
    type,
    message,
    code: code?.toString(),
  }
}

// 核心请求函数
async function request<T>(config: RequestConfig): Promise<T> {
  try {
    const requestConfig = requestInterceptor(config)
    const response = await Taro.request(requestConfig)
    return await responseInterceptor<T>(response)
  } catch (error: any) {
    // 如果已经是AppError，直接抛出
    if (error.type) {
      throw error
    }

    // 网络错误处理
    if (error.errMsg) {
      if (error.errMsg.includes('timeout')) {
        throw createAppError(ErrorType.NETWORK_ERROR, '请求超时，请检查网络连接')
      }
      if (error.errMsg.includes('fail')) {
        throw createAppError(ErrorType.NETWORK_ERROR, '网络请求失败，请检查网络连接')
      }
    }

    // 未知错误
    throw createAppError(ErrorType.UNKNOWN_ERROR, '发生未知错误')
  }
}

// 导出HTTP方法
export const httpClient = {
  get: <T>(url: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<T> => {
    return request<T>({ url, method: 'GET', params, headers })
  },

  post: <T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> => {
    return request<T>({ url, method: 'POST', data, headers })
  },

  put: <T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> => {
    return request<T>({ url, method: 'PUT', data, headers })
  },

  delete: <T>(url: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<T> => {
    return request<T>({ url, method: 'DELETE', params, headers })
  },

  // 无需认证的请求
  getWithoutAuth: <T>(url: string, params?: Record<string, any>): Promise<T> => {
    return request<T>({ url, method: 'GET', params, skipAuth: true })
  },

  postWithoutAuth: <T>(url: string, data?: any): Promise<T> => {
    return request<T>({ url, method: 'POST', data, skipAuth: true })
  },
}
