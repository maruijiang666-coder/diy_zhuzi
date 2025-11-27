export interface ApiResponse<T> {
  code: number // 状态码: 0表示成功
  message: string // 响应消息
  data: T // 响应数据
  timestamp: number // 时间戳
}

export interface ApiError {
  code: number
  message: string
  details?: any
}

export interface WechatPayParams {
  timeStamp: string
  nonceStr: string
  package: string
  signType: string
  paySign: string
}
