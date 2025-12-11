import { create } from 'zustand'
import { Order, Address, OrderStatus } from '../types/order'
import { orderService } from '../services/orderService'

interface OrderStore {
  // 状态
  orders: Order[]
  currentOrder: Order | null
  loading: boolean
  error: string | null

  // 操作
  createOrder: (cartItemIds: string[], shippingAddress: Address, totalPrice: number) => Promise<string>
  loadOrders: (status?: OrderStatus, page?: number, pageSize?: number) => Promise<void>
  loadOrderDetail: (orderId: string) => Promise<void>
  updateOrderStatus: (orderId: string, status: OrderStatus) => void

  // 辅助方法
  clearError: () => void
  clearCurrentOrder: () => void
}

export const useOrderStore = create<OrderStore>((set) => ({
  // 初始状态
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,

  // 创建订单
  createOrder: async (cartItemIds: string[], shippingAddress: Address, totalPrice: number) => {
    set({ loading: true, error: null })

    try {
      console.log('=== 订单存储 - 开始创建订单 ===')
      console.log('购物车项ID:', cartItemIds)
      console.log('收货地址:', shippingAddress)
      console.log('订单总价:', totalPrice)
      
      const result = await orderService.createOrder(
        cartItemIds,
        shippingAddress,
        totalPrice
      )
      
      console.log('=== 订单存储 - 创建订单结果 ===')
      console.log('orderService返回结果:', JSON.stringify(result, null, 2))
      
      const { orderId, order } = result
      
      console.log('提取的orderId:', orderId)
      console.log('提取的order:', JSON.stringify(order, null, 2))

      set((state) => ({
        orders: [order, ...state.orders],
        currentOrder: order,
        loading: false,
      }))

      return orderId
    } catch (error: any) {
      const errorMessage = error.message || '创建订单失败'
      console.error('=== 订单存储 - 创建订单失败 ===')
      console.error('错误信息:', errorMessage)
      console.error('完整错误:', error)
      set({ loading: false, error: errorMessage })
      throw error
    }
  },

  // 加载订单列表
  loadOrders: async (status?: OrderStatus, page: number = 1, pageSize: number = 20) => {
    set({ loading: true, error: null })

    try {
      console.log(`[useOrderStore] 开始加载订单列表 - 状态: ${status || '全部'}, 页码: ${page}`)
      const { orders } = await orderService.getOrders(status, page, pageSize)
      console.log(`[useOrderStore] 订单列表加载完成 - 获取到 ${orders.length} 条订单`)

      // 添加空值检查，确保 orders 是数组
      const validOrders = Array.isArray(orders) ? orders : []
      
      // 进一步验证每个订单的数据完整性
      const validatedOrders = validOrders.filter(order => {
        if (!order || !order.id) {
          console.warn(`[useOrderStore] 过滤掉无效订单: 缺少基础字段`, order)
          return false
        }
        if (!order.items || !Array.isArray(order.items)) {
          console.warn(`[useOrderStore] 过滤掉无效订单 - ID: ${order.id}, 原因: items字段无效`, order)
          return false
        }
        if (typeof order.totalPrice !== 'number' || order.totalPrice < 0) {
          console.warn(`[useOrderStore] 过滤掉无效订单 - ID: ${order.id}, 原因: totalPrice字段无效`, order)
          return false
        }
        if (typeof order.createdAt !== 'number' || order.createdAt <= 0) {
          console.warn(`[useOrderStore] 过滤掉无效订单 - ID: ${order.id}, 原因: createdAt字段无效`, order)
          return false
        }
        return true
      })
      
      console.log(`[useOrderStore] 数据验证完成 - 有效订单数量: ${validatedOrders.length}`)
      
      // 按创建时间倒序排列（最新的在前）
      const sortedOrders = validatedOrders.sort((a, b) => b.createdAt - a.createdAt)

      set({
        orders: sortedOrders,
        loading: false,
      })
    } catch (error: any) {
      const errorMessage = error.message || '加载订单列表失败'
      console.error(`[useOrderStore] 加载订单列表失败:`, error)
      set({ loading: false, error: errorMessage })
      throw error
    }
  },

  // 加载订单详情
  loadOrderDetail: async (orderId: string) => {
    set({ loading: true, error: null })

    try {
      // 添加orderId空值检查
      if (!orderId || orderId === 'undefined') {
        throw new Error('订单ID无效')
      }

      const order = await orderService.getOrderById(orderId)

      set({
        currentOrder: order,
        loading: false,
      })
    } catch (error: any) {
      const errorMessage = error.message || '加载订单详情失败'
      set({ loading: false, error: errorMessage })
      throw error
    }
  },

  // 更新订单状态（本地更新）
  updateOrderStatus: (orderId: string, status: OrderStatus) => {
    set((state) => {
      // 更新订单列表中的订单状态
      const updatedOrders = state.orders.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )

      // 更新当前订单状态
      const updatedCurrentOrder =
        state.currentOrder && state.currentOrder.id === orderId
          ? { ...state.currentOrder, status }
          : state.currentOrder

      return {
        orders: updatedOrders,
        currentOrder: updatedCurrentOrder,
      }
    })
  },

  // 清除错误信息
  clearError: () => {
    set({ error: null })
  },

  // 清除当前订单
  clearCurrentOrder: () => {
    set({ currentOrder: null })
  },
}))
