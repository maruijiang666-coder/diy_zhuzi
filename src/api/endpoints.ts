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

// 保存手串请求（POST /bracelets/）
export interface SaveBraceletRequest {
  name: string // 手串名称
  beads: string[] // 珠子 ID 字符串数组
}

// 添加到购物车请求（POST /cart/items/）
export interface AddToCartRequest {
  bracelet: {
    id: number // 手串ID
    beads: string[] // 珠子 ID 数组
  }
  properties: {
    beadCount: number
    totalPrice: number
    totalWeight: number
    totalLength: number
  }
}

export interface AddToCartResponse {
  itemId: string
  cartItem: CartItem
}

export interface UpdateCartItemRequest {
  bracelet: {
    beads: Array<{
      bead_id: number
      position: number
    }>
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
  // 保存手串到服务器（POST /bracelets/）
  saveBracelet: (data: SaveBraceletRequest): Promise<SaveDesignResponse> => {
    return httpClient.postWithoutAuth<SaveDesignResponse>(API_ENDPOINTS.BRACELETS, data)
  },

  // 添加到购物车（POST /cart/items/）
  addToCart: (data: AddToCartRequest): Promise<AddToCartResponse> => {
    return httpClient.postWithoutAuth<AddToCartResponse>(API_ENDPOINTS.CART_ITEMS, data)
  },

  // 获取购物车列表
  getCartItems: async (page: number = 1): Promise<CartItem[]> => {
    const response = await httpClient.getWithoutAuth<DjangoPageResponse<ApiCartItemData>>(
      API_ENDPOINTS.CART_ITEMS,
      { page }
    )

    // 转换数据格式
    const cartItems: CartItem[] = response.results.map((item) => {
      console.log('=== 转换购物车项 ===')
      console.log('原始数据:', JSON.stringify(item, null, 2))
      
      // 安全检查：确保 bracelet_beads 存在
      if (!item.bracelet || !item.bracelet.bracelet_beads) {
        console.warn('购物车项缺少 bracelet_beads 数据:', item)
        return {
          id: String(item.id),
          bracelet: {
            beads: [],
          },
          properties: {
            totalPrice: 0,
            totalWeight: 0,
            totalLength: 0,
            beadCount: 0,
          },
          addedAt: new Date(item.added_at).getTime(),
        }
      }
      
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
    return httpClient.deleteWithoutAuth<{ success: boolean }>(API_ENDPOINTS.CART_ITEM_DETAIL(id))
  },

  // 清空购物车
  clearCart: (): Promise<{ success: boolean }> => {
    return httpClient.deleteWithoutAuth<{ success: boolean }>(API_ENDPOINTS.CART_ITEMS)
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

// API 返回的订单数据格式
interface ApiOrderData {
  id: number
  user: number
  total_price: string
  status: string
  shipping_address: string | { title: string }
  order_items: Array<{
    id: number
    cart_item: {
      id: number
      user: number
      bracelet: {
        id: number
        user: number
        name: string // 手串名称
        bracelet_beads: Array<{
          id: number
          bead: ApiBeadData
          position: number
        }>
        created_at: string
        updated_at: string
      }
      properties: ApiBeadData
      added_at: string
    }
    price: string
  }>
  created_at: string
  paid_at: string | null
  shipped_at: string | null
  tracking_number: string | null
}

// 状态映射
const statusMap: Record<string, OrderStatus> = {
  'pending': OrderStatus.PENDING,
  'paid': OrderStatus.PAID,
  'shipped': OrderStatus.SHIPPED,
  'completed': OrderStatus.COMPLETED,
  'cancelled': OrderStatus.CANCELLED,
}

export const orderApi = {
  // 创建订单
  createOrder: (data: CreateOrderRequest): Promise<CreateOrderResponse> => {
    return httpClient.post<CreateOrderResponse>(API_ENDPOINTS.ORDERS, data)
  },

  // 获取订单列表
  getOrders: async (params?: GetOrdersParams): Promise<GetOrdersResponse> => {
    const apiParams: Record<string, any> = {}
    
    if (params && params.page) {
      apiParams.page = params.page
    }
    
    if (params && params.status) {
      apiParams.status = params.status
    }

    const response = await httpClient.getWithoutAuth<DjangoPageResponse<ApiOrderData>>(
      API_ENDPOINTS.ORDERS,
      apiParams
    )

    // 转换数据格式
    const orders: Order[] = response.results.map((item) => {
      // 解析收货地址
      let shippingAddress: Address
      if (typeof item.shipping_address === 'string') {
        shippingAddress = {
          name: '',
          phone: '',
          province: '',
          city: '',
          district: '',
          detail: item.shipping_address,
        }
      } else {
        shippingAddress = {
          name: '',
          phone: '',
          province: '',
          city: '',
          district: '',
          detail: item.shipping_address.title || '',
        }
      }

      // 转换订单项
      const orderItems = item.order_items.map((orderItem) => {
        const beads = orderItem.cart_item.bracelet.bracelet_beads
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

        const totalPrice = beads.reduce((sum, bead) => sum + bead.price, 0)
        const totalWeight = beads.reduce((sum, bead) => sum + bead.weight, 0)
        const totalLength = beads.reduce((sum, bead) => sum + bead.diameter, 0)

        return {
          id: String(orderItem.id),
          bracelet: { beads },
          properties: {
            totalPrice,
            totalWeight,
            totalLength,
            beadCount: beads.length,
          },
          price: parseFloat(orderItem.price),
        }
      })

      return {
        id: String(item.id),
        userId: String(item.user),
        items: orderItems,
        totalPrice: parseFloat(item.total_price),
        status: statusMap[item.status] || OrderStatus.PENDING,
        shippingAddress,
        createdAt: new Date(item.created_at).getTime(),
        paidAt: item.paid_at ? new Date(item.paid_at).getTime() : undefined,
        shippedAt: item.shipped_at ? new Date(item.shipped_at).getTime() : undefined,
        trackingNumber: item.tracking_number || undefined,
      }
    })

    return {
      orders,
      total: response.count,
    }
  },

  // 获取订单详情
  getOrderById: async (id: string): Promise<Order> => {
    const item = await httpClient.getWithoutAuth<ApiOrderData>(API_ENDPOINTS.ORDER_DETAIL(id))
    
    // 解析收货地址
    let shippingAddress: Address
    if (typeof item.shipping_address === 'string') {
      shippingAddress = {
        name: '',
        phone: '',
        province: '',
        city: '',
        district: '',
        detail: item.shipping_address,
      }
    } else {
      shippingAddress = {
        name: '',
        phone: '',
        province: '',
        city: '',
        district: '',
        detail: item.shipping_address.title || '',
      }
    }

    // 转换订单项
    const orderItems = item.order_items.map((orderItem) => {
      const beads = orderItem.cart_item.bracelet.bracelet_beads
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

      const totalPrice = beads.reduce((sum, bead) => sum + bead.price, 0)
      const totalWeight = beads.reduce((sum, bead) => sum + bead.weight, 0)
      const totalLength = beads.reduce((sum, bead) => sum + bead.diameter, 0)

      return {
        id: String(orderItem.id),
        bracelet: { beads },
        properties: {
          totalPrice,
          totalWeight,
          totalLength,
          beadCount: beads.length,
        },
        price: parseFloat(orderItem.price),
      }
    })

    return {
      id: String(item.id),
      userId: String(item.user),
      items: orderItems,
      totalPrice: parseFloat(item.total_price),
      status: statusMap[item.status] || OrderStatus.PENDING,
      shippingAddress,
      createdAt: new Date(item.created_at).getTime(),
      paidAt: item.paid_at ? new Date(item.paid_at).getTime() : undefined,
      shippedAt: item.shipped_at ? new Date(item.shipped_at).getTime() : undefined,
      trackingNumber: item.tracking_number || undefined,
    }
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
  app_type: string // 应用类型，固定为 'diy'
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
    // 使用 API_BASE_URL + /auth/login
    return httpClient.postWithoutAuth<WechatLoginResponse>(API_ENDPOINTS.WECHAT_LOGIN, data)
  },

  // 获取用户信息
  getUserInfo: (): Promise<User> => {
    return httpClient.get<User>(API_ENDPOINTS.USER_INFO)
  },
}

// ============ 设计相关接口 ============

// API 返回的手串数据格式
interface ApiBraceletData {
  id: number
  user: number
  name: string
  bracelet_beads: Array<{
    id: number
    bead: ApiBeadData
    position: number
  }>
  created_at: string
  updated_at: string
}

// 创建设计请求（POST /bracelets/）
export interface SaveDesignRequest {
  name: string // 必填
  beads: string[] // 珠子 ID 字符串数组
}

// 更新设计请求（PUT /bracelets/:id/）
export interface UpdateDesignRequest {
  name?: string
  beads?: string[] // 珠子 ID 字符串数组
}

export interface SaveDesignResponse {
  id: number
  name: string
  user: number
  bracelet_beads: Array<{
    id: number
    bead: ApiBeadData
    position: number
  }>
  created_at: string
  updated_at: string
}

export const designApi = {
  // 保存设计（创建手串）
  saveDesign: async (data: SaveDesignRequest): Promise<SaveDesignResponse> => {
    return httpClient.postWithoutAuth<SaveDesignResponse>(API_ENDPOINTS.BRACELETS, data)
  },

  // 获取所有设计（手串列表）
  getDesigns: async (page: number = 1): Promise<ApiBraceletData[]> => {
    const response = await httpClient.getWithoutAuth<DjangoPageResponse<ApiBraceletData>>(
      API_ENDPOINTS.BRACELETS,
      { page }
    )
    return response.results
  },

  // 获取单个设计（手串详情）
  getDesignById: async (id: string): Promise<ApiBraceletData> => {
    return httpClient.getWithoutAuth<ApiBraceletData>(API_ENDPOINTS.BRACELET_DETAIL(id))
  },

  // 更新设计
  updateDesign: async (id: string, data: UpdateDesignRequest): Promise<SaveDesignResponse> => {
    return httpClient.put<SaveDesignResponse>(API_ENDPOINTS.BRACELET_DETAIL(id), data)
  },

  // 删除设计
  deleteDesign: async (id: string): Promise<{ success: boolean }> => {
    return httpClient.deleteWithoutAuth<{ success: boolean }>(API_ENDPOINTS.BRACELET_DETAIL(id))
  },
}
