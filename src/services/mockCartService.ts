import Taro from '@tarojs/taro'
import { CartItem } from '../types/common'
import { Bracelet } from '../types/bracelet'

/**
 * Mock购物车服务
 * 用于开发测试，使用本地存储模拟购物车功能
 */
class MockCartService {
  private storageKey = 'mock_cart_items'

  /**
   * 添加到购物车
   */
  async addToCart(bracelet: Bracelet): Promise<{ itemId: string; cartItem: CartItem }> {
    await this.delay(300)

    const items = this.getLocalCartItems()
    const itemId = `cart-${Date.now()}`
    
    const cartItem: CartItem = {
      id: itemId,
      bracelet,
      properties: {
        totalPrice: this.calculateBraceletPrice(bracelet),
        totalWeight: this.calculateBraceletWeight(bracelet),
        totalLength: this.calculateBraceletLength(bracelet),
        beadCount: bracelet.beads.length,
      },
      addedAt: Date.now(),
    }

    items.push(cartItem)
    this.saveLocalCartItems(items)

    return { itemId, cartItem }
  }

  /**
   * 获取购物车列表
   */
  async getCartItems(): Promise<CartItem[]> {
    await this.delay(200)
    return this.getLocalCartItems()
  }

  /**
   * 更新购物车项
   */
  async updateCartItem(itemId: string, bracelet: Bracelet): Promise<CartItem> {
    await this.delay(300)

    const items = this.getLocalCartItems()
    const index = items.findIndex((item) => item.id === itemId)

    if (index === -1) {
      throw new Error('购物车项不存在')
    }

    items[index].bracelet = bracelet
    items[index].properties = {
      totalPrice: this.calculateBraceletPrice(bracelet),
      totalWeight: this.calculateBraceletWeight(bracelet),
      totalLength: this.calculateBraceletLength(bracelet),
      beadCount: bracelet.beads.length,
    }

    this.saveLocalCartItems(items)
    return items[index]
  }

  /**
   * 删除购物车项
   */
  async removeCartItem(itemId: string): Promise<boolean> {
    await this.delay(200)

    const items = this.getLocalCartItems()
    const filteredItems = items.filter((item) => item.id !== itemId)

    if (filteredItems.length === items.length) {
      throw new Error('购物车项不存在')
    }

    this.saveLocalCartItems(filteredItems)
    return true
  }

  /**
   * 清空购物车
   */
  async clearCart(): Promise<boolean> {
    await this.delay(200)
    this.saveLocalCartItems([])
    return true
  }

  /**
   * 从本地存储获取购物车数据
   */
  private getLocalCartItems(): CartItem[] {
    try {
      // 使用 Taro 的同步存储 API（兼容小程序环境）
      const data = Taro.getStorageSync(this.storageKey)
      if (!data) {
        return []
      }
      
      const items: CartItem[] = JSON.parse(data)
      
      // 迁移旧数据：如果购物车项缺少 totalLength，重新计算
      const migratedItems = items.map((item) => {
        if (item.properties.totalLength === undefined) {
          return {
            ...item,
            properties: {
              ...item.properties,
              totalLength: this.calculateBraceletLength(item.bracelet),
            },
          }
        }
        return item
      })
      
      // 如果有数据被迁移，保存回存储
      if (migratedItems.some((item, index) => item !== items[index])) {
        this.saveLocalCartItems(migratedItems)
      }
      
      return migratedItems
    } catch (error) {
      console.error('读取购物车数据失败:', error)
      return []
    }
  }

  /**
   * 保存购物车数据到本地存储
   */
  private saveLocalCartItems(items: CartItem[]): void {
    try {
      // 使用 Taro 的同步存储 API（兼容小程序环境）
      Taro.setStorageSync(this.storageKey, JSON.stringify(items))
    } catch (error) {
      console.error('保存购物车数据失败:', error)
    }
  }

  /**
   * 计算手串价格
   */
  private calculateBraceletPrice(bracelet: Bracelet): number {
    return bracelet.beads.reduce((total, bead) => total + bead.price, 0)
  }

  /**
   * 计算手串重量
   */
  private calculateBraceletWeight(bracelet: Bracelet): number {
    return bracelet.beads.reduce((total, bead) => total + bead.weight, 0)
  }

  /**
   * 计算手串长度
   */
  private calculateBraceletLength(bracelet: Bracelet): number {
    return bracelet.beads.reduce((total, bead) => total + bead.diameter, 0)
  }

  /**
   * 模拟网络延迟
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export const mockCartService = new MockCartService()
