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
  createOrder: (cartItemIds: string[], shippingAddress: Address) => Promise<string>
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
  createOrder: async (cartItemIds: string[], shippingAddress: Address) => {
    set({ loading: true, error: null })

    try {
      const { orderId, order } = await orderService.createOrder(
        cartItemIds,
        shippingAddress
      )

      set((state) => ({
        orders: [order, ...state.orders],
        currentOrder: order,
        loading: false,
      }))

      return orderId
    } catch (error: any) {
      const errorMessage = error.message || '创建订单失败'
      set({ loading: false, error: errorMessage })
      throw error
    }
  },

  // 加载订单列表
  loadOrders: async (status?: OrderStatus, page: number = 1, pageSize: number = 20) => {
    set({ loading: true, error: null })

    try {
      const { orders } = await orderService.getOrders(status, page, pageSize)

      // 按创建时间倒序排列（最新的在前）
      const sortedOrders = orders.sort((a, b) => b.createdAt - a.createdAt)

      set({
        orders: sortedOrders,
        loading: false,
      })
    } catch (error: any) {
      const errorMessage = error.message || '加载订单列表失败'
      set({ loading: false, error: errorMessage })
      throw error
    }
  },

  // 加载订单详情
  loadOrderDetail: async (orderId: string) => {
    set({ loading: true, error: null })

    try {
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
