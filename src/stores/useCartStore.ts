import { create } from 'zustand'
import { CartItem } from '../types/common'
import { Bracelet, BraceletProperties } from '../types/bracelet'
import { cartService } from '../services/cartService'

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
      const items = await cartService.getCartItems()

      set({
        items,
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
    return cartService.calculateTotalPrice(state.items)
  },

  // 获取购物车项数量
  getItemCount: () => {
    const state = get()
    return cartService.getItemCount(state.items)
  },
}))
