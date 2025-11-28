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

export interface Order {
  id: string
  userId: string
  items: CartItem[]
  totalPrice: number
  status: OrderStatus
  shippingAddress: Address
  createdAt: number
  paidAt?: number
  shippedAt?: number
  trackingNumber?: string
}
