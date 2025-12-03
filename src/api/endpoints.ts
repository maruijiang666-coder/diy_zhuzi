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

// Django REST framework 分页响应格式
interface DjangoPageResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// API 返回的珠子数据格式（与后端字段对应）
interface ApiBeadData {
  id: number
  name: string
  category: string
  image_url: string
  price: string
  weight: string
  diameter: string
  stock: number
  description: string
  created_at: string
  updated_at: string
}

export const beadApi = {
  // 获取珠子列表
  getBeads: async (params?: GetBeadsParams): Promise<GetBeadsResponse> => {
    // 转换参数格式以匹配后端 API
    const apiParams: Record<string, any> = {}
    
    if (params && params.page) {
      apiParams.page = params.page
    }
    
    if (params && params.category) {
      apiParams.category = params.category
    }
    
    if (params && params.keyword) {
      apiParams.search = params.keyword // 后端可能使用 search 参数
    }

    // 调用 API（珠子列表不需要认证）
    const response = await httpClient.getWithoutAuth<DjangoPageResponse<ApiBeadData>>(
      API_ENDPOINTS.BEADS,
      apiParams
    )

    // 转换数据格式
    const beads: Bead[] = response.results.map((item) => ({
      id: String(item.id),
      name: item.name,
      category: item.category,
      imageUrl: item.image_url,
      price: parseFloat(item.price),
      weight: parseFloat(item.weight),
      diameter: parseFloat(item.diameter),
      stock: item.stock,
      description: item.description,
    }))

    return {
      beads,
      total: response.count,
      page: (params && params.page) || 1,
      pageSize: (params && params.pageSize) || 20,
    }
  },

  // 获取珠子分类
  getCategories: (): Promise<Category[]> => {
    return httpClient.getWithoutAuth<Category[]>(API_ENDPOINTS.BEAD_CATEGORIES)
  },

  // 获取珠子详情
  getBeadById: async (id: string): Promise<Bead> => {
    const item = await httpClient.getWithoutAuth<ApiBeadData>(API_ENDPOINTS.BEAD_DETAIL(id))
    
    return {
      id: String(item.id),
      name: item.name,
      category: item.category,
      imageUrl: item.image_url,
      price: parseFloat(item.price),
      weight: parseFloat(item.weight),
      diameter: parseFloat(item.diameter),
      stock: item.stock,
      description: item.description,
    }
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

// API 返回的购物车数据格式
interface ApiCartItemData {
  id: number
  user: number
  bracelet: {
    id: number
    user: number
    bracelet_beads: Array<{
      id: number
      bead: ApiBeadData
      position: number
    }>
    created_at: string
    updated_at: string
  }
  properties: {
    id: number
    name: string
    price: string
    stock: number
    weight: string
    category: string
    diameter: string
    image_url: string
    created_at: string
    updated_at: string
    description: string
  }
  added_at: string
}

export const cartApi = {
  // 添加到购物车
  addToCart: (data: AddToCartRequest): Promise<AddToCartResponse> => {
    return httpClient.post<AddToCartResponse>(API_ENDPOINTS.CART_ITEMS, data)
  },

  // 获取购物车列表
  getCartItems: async (page: number = 1): Promise<CartItem[]> => {
    const response = await httpClient.get<DjangoPageResponse<ApiCartItemData>>(
      API_ENDPOINTS.CART_ITEMS,
      { page }
    )

    // 转换数据格式
    const cartItems: CartItem[] = response.results.map((item) => {
      // 转换珠子数据
      const beads = item.bracelet.bracelet_beads
        .sort((a, b) => a.position - b.position)
        .map((beadItem) => ({
          id: String(beadItem.bead.id),
          name: beadItem.bead.name,
          category: beadItem.bead.category,
          imageUrl: beadItem.bead.image_url,
          price: parseFloat(beadItem.bead.price),
          weight: parseFloat(beadItem.bead.weight),
          diameter: parseFloat(beadItem.bead.diameter),
          stock: beadItem.bead.stock,
          description: beadItem.bead.description,
        }))

      // 计算手串属性
      const totalPrice = beads.reduce((sum, bead) => sum + bead.price, 0)
      const totalWeight = beads.reduce((sum, bead) => sum + bead.weight, 0)
      const totalLength = beads.reduce((sum, bead) => sum + bead.diameter, 0)

      return {
        id: String(item.id),
        bracelet: {
          beads,
        },
        properties: {
          totalPrice,
          totalWeight,
          totalLength,
          beadCount: beads.length,
        },
        addedAt: new Date(item.added_at).getTime(),
      }
    })

    return cartItems
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
