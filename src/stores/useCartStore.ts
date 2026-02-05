import { create } from 'zustand'
import { CartItem } from '../types/common'
import { Bracelet, BraceletProperties } from '../types/bracelet'
import { cartService } from '../services/cartService'
import { orderService } from '../services/orderService'

interface CartStore {
  // 状态
  items: CartItem[]
  loading: boolean
  error: string | null

  // 操作
  addToCart: (bracelet: Bracelet, properties?: BraceletProperties) => Promise<string>
  removeFromCart: (itemId: string) => Promise<void>
  updateCartItem: (itemId: string, bracelet: Bracelet) => Promise<void>
  clearCart: () => Promise<void>
  loadCartItems: () => Promise<void>

  // 计算属性
  getTotalPrice: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  // 初始状态
  items: [],
  loading: false,
  error: null,

  // 添加到购物车
  addToCart: async (bracelet: Bracelet, properties?: BraceletProperties) => {
    set({ loading: true, error: null })

    try {
      const { itemId, cartItem } = await cartService.addToCart(bracelet, properties)

      set((state) => ({
        items: [...state.items, cartItem],
        loading: false,
      }))

      return itemId
    } catch (error: any) {
      const errorMessage = error.message || '添加到购物车失败'
      set({ loading: false, error: errorMessage })
      throw error
    }
  },

  // 删除购物车项
  removeFromCart: async (itemId: string) => {
    set({ loading: true, error: null })

    try {
      await cartService.removeCartItem(itemId)

      set((state) => ({
        items: state.items.filter((item) => item.id !== itemId),
        loading: false,
      }))
    } catch (error: any) {
      const errorMessage = error.message || '删除购物车项失败'
      set({ loading: false, error: errorMessage })
      throw error
    }
  },

  // 更新购物车项
  updateCartItem: async (itemId: string, bracelet: Bracelet) => {
    set({ loading: true, error: null })

    try {
      const updatedItem = await cartService.updateCartItem(itemId, bracelet)

      set((state) => ({
        items: state.items.map((item) =>
          item.id === itemId ? updatedItem : item
        ),
        loading: false,
      }))
    } catch (error: any) {
      const errorMessage = error.message || '更新购物车项失败'
      set({ loading: false, error: errorMessage })
      throw error
    }
  },

  // 清空购物车
  clearCart: async () => {
    set({ loading: true, error: null })

    try {
      await cartService.clearCart()

      set({
        items: [],
        loading: false,
      })
    } catch (error: any) {
      const errorMessage = error.message || '清空购物车失败'
      set({ loading: false, error: errorMessage })
      throw error
    }
  },

  // 加载购物车列表
  loadCartItems: async () => {
    set({ loading: true, error: null })

    try {
      // 1. 获取购物车列表
      const items = await cartService.getCartItems()

      // 2. 获取订单列表 (获取最近100条，包含所有状态)
      // 通过过滤已支付（或本地标记为已支付）订单关联的购物车项
      const { orders } = await orderService.getOrders(undefined, 1, 100)
      
      // 3. 提取所有已支付订单中的购物车项ID
      const paidCartItemIds = new Set<string>()
      orders.forEach(order => {
        // 检查状态是否为已支付，或者在本地被标记为已支付
        const isPaid = order.status === 'paid' || 
                       order.status === 'shipped' || 
                       order.status === 'completed' ||
                       orderService.isOrderPaidLocal(order.id)
                       
        if (isPaid && order.items) {
          order.items.forEach(orderItem => {
            if (orderItem.cartItemId) {
              paidCartItemIds.add(orderItem.cartItemId)
            }
          })
        }
      })

      console.log('=== 过滤已支付购物车项 ===')
      console.log('原始购物车项数量:', items.length)
      console.log('已支付购物车项ID集合:', Array.from(paidCartItemIds))

      // 4. 过滤掉已支付的购物车项
      const filteredItems = items.filter(item => !paidCartItemIds.has(item.id))
      
      console.log('过滤后购物车项数量:', filteredItems.length)

      set({
        items: filteredItems,
        loading: false,
      })
    } catch (error: any) {
      const errorMessage = error.message || '加载购物车失败'
      set({ loading: false, error: errorMessage })
      throw error
    }
  },

  // 计算购物车总价
  getTotalPrice: () => {
    const state = get()
    // 防御性编程：确保items存在且是数组
    if (!state.items || !Array.isArray(state.items)) {
      console.warn('购物车items数据无效:', state.items)
      return 0
    }
    return cartService.calculateTotalPrice(state.items)
  },

  // 获取购物车项数量
  getItemCount: () => {
    const state = get()
    // 防御性编程：确保items存在且是数组
    if (!state.items || !Array.isArray(state.items)) {
      console.warn('购物车items数据无效:', state.items)
      return 0
    }
    return cartService.getItemCount(state.items)
  },
}))
