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
  signType: 'MD5' | 'HMAC-SHA256' | 'RSA'
  paySign: string
}

// 🔥 外部支付接口返回的微信支付参数格式
export interface ExternalPaymentResponse {
  code: 'SUCCESS' | 'FAIL'
  message: string
  data: {
    outTradeNo: string      // 外部订单号
    nonceStr: string        // 随机字符串
    package: string         // 预支付ID
    paySign: string         // 支付签名
    timeStamp: string       // 时间戳
    signType: 'MD5' | 'HMAC-SHA256' | 'RSA'  // 签名类型
  }
}

export enum ApiErrorCode {
  SUCCESS = 0,
  INVALID_PARAMS = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  SERVER_ERROR = 500,

  // 业务错误码
  BEAD_OUT_OF_STOCK = 1001,
  CART_ITEM_NOT_FOUND = 1002,
  ORDER_NOT_FOUND = 1003,
  PAYMENT_FAILED = 1004,
  INVALID_BRACELET = 1005,
}
