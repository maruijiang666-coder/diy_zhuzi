import { httpClient } from './client'
import { API_ENDPOINTS } from '../constants/api'
import { Bead } from '../types/bead'
import { Category, CartItem } from '../types/common'
import { Order, Address, OrderStatus } from '../types/order'
import { WechatPayParams } from '../types/api'
import Taro from '@tarojs/taro'

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
    name: string // 手串名称
    beads: number[] // 珠子 ID 数组（数字格式）
  }
  properties: {
    totalPrice: number | string // 总价格（支持字符串格式）
    totalWeight: number | string // 总重量（支持字符串格式）
    totalLength: number | string // 总长度（支持字符串格式）
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
    return httpClient.post<AddToCartResponse>(API_ENDPOINTS.CART_ITEMS, data)
  },

  // 获取购物车列表
  getCartItems: async (page: number = 1): Promise<CartItem[]> => {
    const response = await httpClient.get<DjangoPageResponse<ApiCartItemData>>(
      API_ENDPOINTS.CART_ITEMS,
      { page }
    )

    // 转换数据格式
    const cartItems: CartItem[] = response.results
      .filter((item) => {
        // 过滤掉无效的数据项
        if (!item || !item.id || !item.bracelet || !item.properties) {
          console.warn('过滤掉无效的购物车项:', item)
          return false
        }
        return true
      })
      .map((item) => {
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
      
      // 转换珠子数据 - 添加空值检查
      const braceletBeads = item.bracelet.bracelet_beads || []
      const beads = braceletBeads
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
  total_price: string           // 订单总价（字符串格式）
  cart_item_ids: string[]      // 购物车项ID数组
  status: 'pending'           // 订单状态，默认为pending
  shipping_address: Address    // 收货地址
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

// ============ 外部支付接口 ============

// 外部支付创建请求（新格式）
export interface ExternalPaymentCreateRequest {
  openid: string      // 用户openid
  amount: number      // 订单总价
  description: string // 商品描述
  orderId: string     // 6位唯一订单ID
}

// 🔥 外部支付创建响应（适配实际返回的微信支付参数格式）
export interface ExternalPaymentCreateResponse {
  code: 'SUCCESS' | 'FAIL'
  message: string
  data: {
    outTradeNo: string      // 外部订单号
    nonceStr: string        // 随机字符串
    package: string         // 预支付ID
    paySign: string         // 支付签名
    timeStamp: string       // 时间戳
    signType: string        // 签名类型
  }
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
  // 创建订单（使用真实接口）
  createOrder: (data: CreateOrderRequest): Promise<CreateOrderResponse> => {
    return httpClient.post<CreateOrderResponse>(API_ENDPOINTS.ORDERS, data)
  },

  // 创建外部支付订单（移除认证头）
  createExternalPayment: (data: ExternalPaymentCreateRequest, timeout?: number): Promise<ExternalPaymentCreateResponse> => {
    return httpClient.postWithoutAuth<ExternalPaymentCreateResponse>(API_ENDPOINTS.EXTERNAL_PAYMENT_CREATE, data)
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

    // 添加调试日志，验证Token获取情况
    const token = Taro.getStorageSync('Import_code')
    console.log(`[orderApi] 获取订单列表 - Token前10位: ${token ? token.substring(0, 10) + '...' : '无Token'}`)

    // 使用带认证的GET请求，X-Login-Token从Import_code获取
    const response = await httpClient.get<DjangoPageResponse<ApiOrderData>>(
      API_ENDPOINTS.ORDERS,
      apiParams
    )

    // 转换数据格式
    const orders: Order[] = response.results.map((item) => {
      // 添加基础数据验证
      if (!item || !item.id) {
        console.warn(`[orderApi] 跳过无效订单数据: 缺少基础字段`, item)
        return null
      }

      // 解析收货地址 - 适配真实接口格式
      let shippingAddress: Address
      
      if (item.shipping_address && typeof item.shipping_address === 'object') {
        // 真实接口返回的地址对象包含完整的地址信息
        const addr = item.shipping_address as any
        shippingAddress = {
          name: addr.name || '',
          phone: addr.phone || '',
          province: addr.province || '',
          city: addr.city || '',
          district: addr.district || '',
          detail: addr.detail || '',
        }
      } else if (typeof item.shipping_address === 'string') {
        shippingAddress = {
          name: '',
          phone: '',
          province: '',
          city: '',
          district: '',
          detail: item.shipping_address,
        }
      } else if (item.shipping_name || item.shipping_phone || item.shipping_address_detail) {
        // 检查是否有独立的收货地址字段（备用格式）
        shippingAddress = {
          name: item.shipping_name || '',
          phone: item.shipping_phone || '',
          province: item.shipping_province || '',
          city: item.shipping_city || '',
          district: item.shipping_district || '',
          detail: item.shipping_address_detail || '',
        }
      } else {
        shippingAddress = {
          name: '',
          phone: '',
          province: '',
          city: '',
          district: '',
          detail: '',
        }
      }

      // 转换订单项 - 适配真实接口格式，添加空值检查
      const orderItems = (item.order_items && Array.isArray(item.order_items) ? item.order_items : []).map((orderItem) => {
        // 获取珠子数据 - 适配真实接口的嵌套结构，添加订单项验证
        let braceletBeads: any[] = []
        let properties = {
          beadCount: 0,
          totalPrice: 0,
          totalWeight: 0,
          totalLength: 0,
        }

        if (!orderItem || !orderItem.cart_item) {
          console.warn(`[orderApi] 订单项缺少cart_item数据`, orderItem)
        } else if (orderItem.cart_item && orderItem.cart_item.bracelet) {
          const cartItem = orderItem.cart_item as any
          
          // 获取珠子列表
          if (cartItem.bracelet.bracelet_beads && Array.isArray(cartItem.bracelet.bracelet_beads)) {
            braceletBeads = cartItem.bracelet.bracelet_beads
          } else {
            console.warn(`[orderApi] 缺少珠子数据: bracelet_beads`, cartItem.bracelet)
          }
          
          // 获取属性数据（优先使用properties对象，其次使用bracelet的属性）
          if (cartItem.properties) {
            const props = cartItem.properties as any
            properties = {
              beadCount: parseInt(props.beadCount) || 0,
              totalPrice: parseFloat(props.totalPrice) || 0,
              totalWeight: parseFloat(props.totalWeight) || 0,
              totalLength: parseFloat(props.totalLength) || 0,
            }
          } else {
            console.warn(`[orderApi] 缺少属性数据: properties`, cartItem)
          }
        }

        // 转换珠子数据，添加空值检查
        const beads = braceletBeads
          .filter((beadItem) => beadItem && beadItem.bead)
          .sort((a, b) => (a.position || 0) - (b.position || 0))
          .map((beadItem) => {
            const bead = beadItem.bead || {}
            return {
              id: String(bead.id || ''),
              name: bead.name || '未知珠子',
              category: bead.category || '',
              imageUrl: bead.image_url || '',
              price: parseFloat(bead.price || '0'),
              weight: parseFloat(bead.weight || '0'),
              diameter: parseFloat(bead.diameter || '0'),
              stock: bead.stock || 0,
              description: bead.description || '',
            }
          })

        return {
          id: String(orderItem.id),
          bracelet: { beads },
          properties,
          price: parseFloat(orderItem.price || '0'),
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

    // 过滤掉转换失败的订单
    const validOrders = orders.filter((order) => order !== null)
    
    if (validOrders.length < orders.length) {
      console.warn(`[orderApi] 过滤了 ${orders.length - validOrders.length} 个无效订单`)
    }

    return {
      orders: validOrders,
      total: response.count,
    }
  },

  // 获取订单详情
  getOrderById: async (id: string): Promise<Order> => {
    console.log(`[orderApi] 获取订单详情，订单ID: ${id}`)
    // 使用带认证的GET请求，X-Login-Token从Import_code获取
    const item = await httpClient.get<ApiOrderData>(API_ENDPOINTS.ORDER_DETAIL(id))
    console.log(`[orderApi] 订单详情原始数据:`, JSON.stringify(item, null, 2))
    
    // 添加基础数据验证
    if (!item || !item.id) {
      throw new Error(`[orderApi] 订单详情数据无效: 缺少基础字段`)
    }
    
    // 解析收货地址 - 适配真实接口格式
    let shippingAddress: Address
    
    if (item.shipping_address && typeof item.shipping_address === 'object') {
      // 真实接口返回的地址对象包含完整的地址信息
      const addr = item.shipping_address as any
      shippingAddress = {
        name: addr.name || '',
        phone: addr.phone || '',
        province: addr.province || '',
        city: addr.city || '',
        district: addr.district || '',
        detail: addr.detail || '',
      }
    } else if (typeof item.shipping_address === 'string') {
      shippingAddress = {
        name: '',
        phone: '',
        province: '',
        city: '',
        district: '',
        detail: item.shipping_address,
      }
    } else if (item.shipping_name || item.shipping_phone || item.shipping_address_detail) {
      // 检查是否有独立的收货地址字段（备用格式）
      shippingAddress = {
        name: item.shipping_name || '',
        phone: item.shipping_phone || '',
        province: item.shipping_province || '',
        city: item.shipping_city || '',
        district: item.shipping_district || '',
        detail: item.shipping_address_detail || '',
      }
    } else {
      shippingAddress = {
        name: '',
        phone: '',
        province: '',
        city: '',
        district: '',
        detail: '',
      }
    }

    // 转换订单项 - 适配真实接口格式，添加空值检查
    const orderItems = (item.order_items && Array.isArray(item.order_items) ? item.order_items : []).map((orderItem) => {
      // 获取珠子数据 - 适配真实接口的嵌套结构，添加订单项验证
      let braceletBeads: any[] = []
      let properties = {
        beadCount: 0,
        totalPrice: 0,
        totalWeight: 0,
        totalLength: 0,
      }

      if (!orderItem || !orderItem.cart_item) {
        console.warn(`[orderApi] 订单项缺少cart_item数据`, orderItem)
      } else if (orderItem.cart_item && orderItem.cart_item.bracelet) {
        const cartItem = orderItem.cart_item as any
        
        // 获取珠子列表
        if (cartItem.bracelet.bracelet_beads && Array.isArray(cartItem.bracelet.bracelet_beads)) {
          braceletBeads = cartItem.bracelet.bracelet_beads
        } else {
          console.warn(`[orderApi] 缺少珠子数据: bracelet_beads`, cartItem.bracelet)
        }
        
        // 获取属性数据（优先使用properties对象，其次使用bracelet的属性）
        if (cartItem.properties) {
          const props = cartItem.properties as any
          properties = {
            beadCount: parseInt(props.beadCount) || 0,
            totalPrice: parseFloat(props.totalPrice) || 0,
            totalWeight: parseFloat(props.totalWeight) || 0,
            totalLength: parseFloat(props.totalLength) || 0,
          }
        } else {
          console.warn(`[orderApi] 缺少属性数据: properties`, cartItem)
        }
      }

      // 转换珠子数据，添加空值检查
      const beads = braceletBeads
        .filter((beadItem) => beadItem && beadItem.bead)
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map((beadItem) => {
          const bead = beadItem.bead || {}
          return {
            id: String(bead.id || ''),
            name: bead.name || '未知珠子',
            category: bead.category || '',
            imageUrl: bead.image_url || '',
            price: parseFloat(bead.price || '0'),
            weight: parseFloat(bead.weight || '0'),
            diameter: parseFloat(bead.diameter || '0'),
            stock: bead.stock || 0,
            description: bead.description || '',
          }
        })

      return {
        id: String(orderItem.id),
        bracelet: { beads },
        properties,
        price: parseFloat(orderItem.price || '0'),
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
      logisticsCompany: item.logistics_company || undefined,
      logisticsInfo: item.logistics_info || undefined,
      shippingImgs: item.shipping_imgs || undefined,
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

  // 删除订单
  deleteOrder: (orderId: string): Promise<void> => {
    return httpClient.delete<void>(API_ENDPOINTS.ORDER_DETAIL(orderId))
  },
}

// ============ 用户相关接口 ============

// 微信登录请求（符合后端接口文档）
export interface WechatLoginRequest {
  code: string // 微信登录凭证（必填）
  app_type: string // 应用类型，固定为 'diy'（必填）
  nickname?: string // 用户昵称（可选）
  avatar?: string // 用户头像URL（可选）
  gender?: number // 性别（可选）
  country?: string // 国家（可选）
  province?: string // 省份（可选）
  city?: string // 城市（可选）
  language?: string // 语言（可选）
}

// 微信登录响应（符合后端接口文档）
export interface WechatLoginResponse {
  openid: string // 登录态 token（64位字符串）
  expires_at: string // 过期时间（ISO 8601格式）
  user: {
    id: number
    openid: string
    app: number
    app_name: string
    unionid: string | null
    nickname: string
    avatar: string
    gender: number
    country: string
    province: string
    city: string
    language: string
    created_at: string
    updated_at: string
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
  // 微信登录（符合后端接口文档）
  wechatLogin: async (data: WechatLoginRequest): Promise<WechatLoginResponse> => {
    console.log('调用微信登录 API:', API_ENDPOINTS.WECHAT_LOGIN)
    console.log('请求数据:', data)
    
    // 直接调用后端接口，不需要认证
    const response = await httpClient.postWithoutAuth<any>(API_ENDPOINTS.WECHAT_LOGIN, data)
    
    console.log('登录 API 原始响应:', response)
    
    // 后端返回格式：{ code: 0, message: "登录成功", data: { openid, expires_at, user } }
    if (response && response.code === 0 && response.data) {
      return response.data
    }
    
    // 如果响应格式不符合预期，抛出错误
    const errorMessage = (response && response.message) ? response.message : '登录失败'
    throw new Error(errorMessage)
  },

  // 获取用户信息
  getUserInfo: (): Promise<User> => {
    console.log('调用获取用户信息 API:', API_ENDPOINTS.USER_INFO)
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
    return httpClient.post<SaveDesignResponse>(API_ENDPOINTS.BRACELETS, data)
  },

  // 获取所有设计（手串列表）
  getDesigns: async (page: number = 1): Promise<ApiBraceletData[]> => {
    try {
      const response = await httpClient.get<DjangoPageResponse<ApiBraceletData>>(
        API_ENDPOINTS.BRACELETS,
        { page }
      )
      
      // 添加空值检查，确保 response.results 存在且是数组
      if (!response || !Array.isArray(response.results)) {
        console.warn('API 响应格式不正确，期望包含 results 数组但收到:', response)
        return []
      }
      
      return response.results
    } catch (error) {
      console.error('获取设计列表失败:', error)
      // 返回空数组而不是抛出错误
      return []
    }
  },

  // 获取单个设计（手串详情）
  getDesignById: async (id: string): Promise<ApiBraceletData> => {
    return httpClient.get<ApiBraceletData>(API_ENDPOINTS.BRACELET_DETAIL(id))
  },

  // 更新设计
  updateDesign: async (id: string, data: UpdateDesignRequest): Promise<SaveDesignResponse> => {
    return httpClient.put<SaveDesignResponse>(API_ENDPOINTS.BRACELET_DETAIL(id), data)
  },

  // 删除设计
  deleteDesign: async (id: string): Promise<{ success: boolean }> => {
    return httpClient.delete<{ success: boolean }>(API_ENDPOINTS.BRACELET_DETAIL(id))
  },
}
