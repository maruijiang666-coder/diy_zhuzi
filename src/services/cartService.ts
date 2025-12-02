import { cartApi, AddToCartRequest, UpdateCartItemRequest } from '../api/endpoints'
import { CartItem } from '../types/common'
import { Bracelet } from '../types/bracelet'
import { mockCartService } from './mockCartService'

// 是否使用Mock数据（开发测试阶段始终使用Mock数据）
const USE_MOCK = true

/**
 * 购物车服务
 * 封装购物车相关的业务逻辑和API调用
 */
class CartService {
  /**
   * 添加手串设计到购物车
   * @param bracelet 手串设计
   * @returns 购物车项ID和完整的购物车项
   */
  async addToCart(bracelet: Bracelet): Promise<{ itemId: string; cartItem: CartItem }> {
    // 验证手串不为空
    if (!bracelet || !bracelet.beads || bracelet.beads.length === 0) {
      throw new Error('手串设计不能为空，请至少添加一个珠子')
    }

    // 使用Mock数据
    if (USE_MOCK) {
      return await mockCartService.addToCart(bracelet)
    }

    // 提取珠子ID数组
    const beadIds = bracelet.beads.map((bead) => bead.id)

    const request: AddToCartRequest = {
      bracelet: {
        beads: beadIds,
      },
    }

    const response = await cartApi.addToCart(request)
    return response
  }

  /**
   * 获取购物车列表
   * @returns 购物车项数组
   */
  async getCartItems(): Promise<CartItem[]> {
    if (USE_MOCK) {
      return await mockCartService.getCartItems()
    }
    return await cartApi.getCartItems()
  }

  /**
   * 更新购物车项
   * @param itemId 购物车项ID
   * @param bracelet 更新后的手串设计
   * @returns 更新后的购物车项
   */
  async updateCartItem(itemId: string, bracelet: Bracelet): Promise<CartItem> {
    if (!itemId || !itemId.trim()) {
      throw new Error('购物车项ID不能为空')
    }

    // 验证手串不为空
    if (!bracelet || !bracelet.beads || bracelet.beads.length === 0) {
      throw new Error('手串设计不能为空，请至少添加一个珠子')
    }

    // 使用Mock数据
    if (USE_MOCK) {
      return await mockCartService.updateCartItem(itemId, bracelet)
    }

    // 提取珠子ID数组
    const beadIds = bracelet.beads.map((bead) => bead.id)

    const request: UpdateCartItemRequest = {
      bracelet: {
        beads: beadIds,
      },
    }

    return await cartApi.updateCartItem(itemId, request)
  }

  /**
   * 删除购物车项
   * @param itemId 购物车项ID
   * @returns 是否删除成功
   */
  async removeCartItem(itemId: string): Promise<boolean> {
    if (!itemId || !itemId.trim()) {
      throw new Error('购物车项ID不能为空')
    }

    if (USE_MOCK) {
      return await mockCartService.removeCartItem(itemId)
    }

    const response = await cartApi.removeCartItem(itemId)
    return response.success
  }

  /**
   * 清空购物车
   * @returns 是否清空成功
   */
  async clearCart(): Promise<boolean> {
    if (USE_MOCK) {
      return await mockCartService.clearCart()
    }
    
    const response = await cartApi.clearCart()
    return response.success
  }

  /**
   * 计算购物车总价
   * @param items 购物车项数组
   * @returns 总价格
   */
  calculateTotalPrice(items: CartItem[]): number {
    if (!items || items.length === 0) {
      return 0
    }

    return items.reduce((total, item) => {
      const totalPrice = item.properties && item.properties.totalPrice ? item.properties.totalPrice : 0;
      return total + totalPrice;
    }, 0);
  }

  /**
   * 获取购物车项数量
   * @param items 购物车项数组
   * @returns 项数量
   */
  getItemCount(items: CartItem[]): number {
    return items ? items.length : 0
  }
}

// 导出单例
export const cartService = new CartService()
