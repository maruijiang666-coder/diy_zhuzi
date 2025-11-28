import { httpClient } from './client'
import { API_ENDPOINTS } from '../constants/api'
import { Bead } from '../types/bead'
import { Category, CartItem } from '../types/common'
import { Order, Address, OrderStatus } from '../types/order'
import { WechatPayParams } from '../types/api'

// ============ 珠子相关接口 ============

export interface GetBeadsParams {
  category?: string
  keyword?: string
  page?: number
  pageSize?: number
}

export interface GetBeadsResponse {
  beads: Bead[]
  total: number
  page: number
  pageSize: number
}

export const beadApi = {
  // 获取珠子列表
  getBeads: (params?: GetBeadsParams): Promise<GetBeadsResponse> => {
    return httpClient.get<GetBeadsResponse>(API_ENDPOINTS.BEADS, params)
  },

  // 获取珠子分类
  getCategories: (): Promise<Category[]> => {
    return httpClient.get<Category[]>(API_ENDPOINTS.BEAD_CATEGORIES)
  },

  // 获取珠子详情
  getBeadById: (id: string): Promise<Bead> => {
    return httpClient.get<Bead>(API_ENDPOINTS.BEAD_DETAIL(id))
  },
}

// ============ 购物车相关接口 ============

export interface AddToCartRequest {
  bracelet: {
    beads: string[] // 珠子ID数组
  }
}

export interface AddToCartResponse {
  itemId: string
  cartItem: CartItem
}

export interface UpdateCartItemRequest {
  bracelet: {
    beads: string[]
  }
}

export const cartApi = {
  // 添加到购物车
  addToCart: (data: AddToCartRequest): Promise<AddToCartResponse> => {
    return httpClient.post<AddToCartResponse>(API_ENDPOINTS.CART_ITEMS, data)
  },

  // 获取购物车列表
  getCartItems: (): Promise<CartItem[]> => {
    return httpClient.get<CartItem[]>(API_ENDPOINTS.CART_ITEMS)
  },

  // 更新购物车项
  updateCartItem: (id: string, data: UpdateCartItemRequest): Promise<CartItem> => {
    return httpClient.put<CartItem>(API_ENDPOINTS.CART_ITEM_DETAIL(id), data)
  },

  // 删除购物车项
  removeCartItem: (id: string): Promise<{ success: boolean }> => {
    return httpClient.delete<{ success: boolean }>(API_ENDPOINTS.CART_ITEM_DETAIL(id))
  },

  // 清空购物车
  clearCart: (): Promise<{ success: boolean }> => {
    return httpClient.delete<{ success: boolean }>(API_ENDPOINTS.CART_ITEMS)
  },
}

// ============ 订单相关接口 ============

export interface CreateOrderRequest {
  cartItemIds: string[]
  shippingAddress: Address
}

export interface CreateOrderResponse {
  orderId: string
  order: Order
}

export interface GetOrdersParams {
  status?: OrderStatus
  page?: number
  pageSize?: number
}

export interface GetOrdersResponse {
  orders: Order[]
  total: number
}

export interface PaymentStatusResponse {
  status: 'pending' | 'paid' | 'failed'
  paidAt?: number
}

export const orderApi = {
  // 创建订单
  createOrder: (data: CreateOrderRequest): Promise<CreateOrderResponse> => {
    return httpClient.post<CreateOrderResponse>(API_ENDPOINTS.ORDERS, data)
  },

  // 获取订单列表
  getOrders: (params?: GetOrdersParams): Promise<GetOrdersResponse> => {
    return httpClient.get<GetOrdersResponse>(API_ENDPOINTS.ORDERS, params)
  },

  // 获取订单详情
  getOrderById: (id: string): Promise<Order> => {
    return httpClient.get<Order>(API_ENDPOINTS.ORDER_DETAIL(id))
  },

  // 发起支付
  initiatePayment: (orderId: string): Promise<{ paymentParams: WechatPayParams }> => {
    return httpClient.post<{ paymentParams: WechatPayParams }>(API_ENDPOINTS.ORDER_PAY(orderId))
  },

  // 查询支付状态
  checkPaymentStatus: (orderId: string): Promise<PaymentStatusResponse> => {
    return httpClient.get<PaymentStatusResponse>(API_ENDPOINTS.ORDER_PAYMENT_STATUS(orderId))
  },
}

// ============ 用户相关接口 ============

export interface WechatLoginRequest {
  code: string
}

export interface WechatLoginResponse {
  token: string
  user: {
    id: string
    nickname: string
    avatar: string
  }
}

export interface User {
  id: string
  nickname: string
  avatar: string
  phone?: string
  createdAt: number
}

export const authApi = {
  // 微信登录
  wechatLogin: (data: WechatLoginRequest): Promise<WechatLoginResponse> => {
    return httpClient.postWithoutAuth<WechatLoginResponse>(API_ENDPOINTS.WECHAT_LOGIN, data)
  },

  // 获取用户信息
  getUserInfo: (): Promise<User> => {
    return httpClient.get<User>(API_ENDPOINTS.USER_INFO)
  },
}
