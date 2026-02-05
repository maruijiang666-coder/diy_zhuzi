import { CartItem } from './common'

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Address {
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
}

export interface OrderItem {
  id: string
  bracelet: CartItem['bracelet']
  properties: CartItem['properties']
  price: number // 订单项的价格（可能与购物车时的价格不同）
  addedAt?: number // 可选，订单项不一定有添加时间
  cartItemId?: string // 关联的购物车项ID
}

export interface PaymentInfo {
  paymentId: string
  paymentUrl: string
  status: string
}

export interface ExternalPaymentInfo {
  externalOrderId: string
  status: 'created' | 'failed'
  response?: {
    wechatPayParams?: {
      outTradeNo: string
      nonceStr: string
      package: string
      paySign: string
      timeStamp: string
      signType: string
    }
    originalResponse?: any
  }
  error?: string
}

export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  totalPrice: number
  status: OrderStatus
  shippingAddress: Address
  createdAt: number
  paidAt?: number
  shippedAt?: number
  trackingNumber?: string
  logisticsCompany?: string
  logisticsInfo?: string
  shippingImgs?: Record<string, string> // 物流图片对象，如 {"one": "url1", "two": "url2"}
  paymentInfo?: PaymentInfo
  externalPaymentInfo?: ExternalPaymentInfo
}
