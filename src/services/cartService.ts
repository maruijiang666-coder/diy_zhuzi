import { cartApi, AddToCartRequest, UpdateCartItemRequest } from '../api/endpoints'
import { CartItem } from '../types/common'
import { Bracelet, BraceletProperties } from '../types/bracelet'
import { mockCartService } from './mockCartService'
import { calculateTotalPrice, calculateTotalWeight, calculateTotalLength } from '../utils/calculator'

// 是否使用Mock数据（开发测试阶段可切换，true=使用Mock数据，false=使用真实API）
// 注意：购物车 API 需要用户登录认证（需要有效的用户 token）
const USE_MOCK = false

/**
 * 购物车服务
 * 封装购物车相关的业务逻辑和API调用
 */
class CartService {
  /**
   * 添加手串设计到购物车
   * @param bracelet 手串设计
   * @param properties 手串属性（包含价格、重量等）
   * @returns 购物车项ID和完整的购物车项
   */
  async addToCart(
    bracelet: Bracelet,
    properties?: BraceletProperties
  ): Promise<{ itemId: string; cartItem: CartItem }> {
    // 验证手串不为空
    if (!bracelet || !bracelet.beads || bracelet.beads.length === 0) {
      throw new Error('手串设计不能为空，请至少添加一个珠子')
    }

    // 使用Mock数据
    if (USE_MOCK) {
      return await mockCartService.addToCart(bracelet)
    }

    // 生成手串名称（如果没有提供）
    const braceletName = bracelet.name || `手串设计 ${Date.now()}`

    // 提取珠子 ID 数组（转换为数字格式）
    const beadsData = bracelet.beads.map((bead) => parseInt(bead.id))

    // 根据接口文档，直接调用 /cart/items/ 接口，包含完整的手串信息
    console.log('=== 添加到购物车 ===')
    
    // 使用提供的属性或创建默认属性，转换为字符串格式
    const finalProperties = properties || {
      totalPrice: calculateTotalPrice(bracelet.beads),
      totalWeight: calculateTotalWeight(bracelet.beads),
      totalLength: calculateTotalLength(bracelet.beads),
      beadCount: bracelet.beads.length,
    }
    
    const cartRequest = {
      bracelet: {
        name: braceletName,
        beads: beadsData, // 珠子 ID 数组（数字格式）
      },
      properties: {
        totalPrice: String(finalProperties.totalPrice),
        totalWeight: String(finalProperties.totalWeight),
        totalLength: String(finalProperties.totalLength),
      },
    }
    console.log('请求数据:', JSON.stringify(cartRequest, null, 2))

    const response = await cartApi.addToCart(cartRequest)
    return response
  }

  /**
   * 获取购物车列表
   * @returns 购物车项数组
   */
  async getCartItems(): Promise<CartItem[]> {
    console.log('=== cartService.getCartItems 开始 ===')
    console.log('USE_MOCK:', USE_MOCK)
    
    if (USE_MOCK) {
      return await mockCartService.getCartItems()
    }
    
    try {
      // 真实数据走线
      console.log('调用真实 API: GET /cart/items/')
      const result = await cartApi.getCartItems()
      console.log('API 返回数据:', result)
      console.log('购物车项数量:', result.length)
      
      // 过滤掉无效的购物车项
      const validItems = result.filter((item, index) => {
        if (!item || !item.id || !item.bracelet || !item.properties) {
          console.warn(`购物车项 ${index} 数据无效:`, item)
          return false
        }
        return true
      })
      
      console.log('有效购物车项数量:', validItems.length)
      return validItems
    } catch (error) {
      console.error('获取购物车列表失败:', error)
      throw error
    }
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

    // 构建珠子数据：需要包含 bead_id 和 position
    const beadsData = bracelet.beads.map((bead, index) => ({
      bead_id: parseInt(bead.id),
      position: index,
    }))

    const request: UpdateCartItemRequest = {
      bracelet: {
        beads: beadsData,
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
      // 防御性编程：检查item和properties是否存在
      if (!item || !item.properties) {
        console.warn('购物车项或properties为空，跳过价格计算:', item)
        return total
      }
      
      const totalPrice = item.properties.totalPrice || 0;
      return total + (typeof totalPrice === 'number' ? totalPrice : parseFloat(String(totalPrice)) || 0);
    }, 0);
  }

  /**
   * 获取购物车项数量
   * @param items 购物车项数组
   * @returns 项数量
   */
  getItemCount(items: CartItem[]): number {
    if (!items || !Array.isArray(items)) {
      console.warn('购物车items参数无效:', items)
      return 0
    }
    return items.length
  }
}

// 导出单例
export const cartService = new CartService()
