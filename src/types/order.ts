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
}
