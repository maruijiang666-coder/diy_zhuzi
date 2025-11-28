import Taro from '@tarojs/taro'
import { SavedDesign } from '../types/design'
import { Bracelet } from '../types/bracelet'

/**
 * Mock设计保存服务
 * 用于开发测试，使用本地存储模拟设计保存功能
 */
class MockDesignService {
  private storageKey = 'mock_saved_designs'

  /**
   * 保存设计
   */
  async saveDesign(
    bracelet: Bracelet,
    name?: string,
    thumbnail?: string
  ): Promise<SavedDesign> {
    await this.delay(300)

    const designs = this.getLocalDesigns()
    const designId = `design-${Date.now()}`
    const now = Date.now()

    const savedDesign: SavedDesign = {
      id: designId,
      name: name || `设计 ${designs.length + 1}`,
      bracelet,
      properties: {
        totalPrice: this.calculateBraceletPrice(bracelet),
        totalWeight: this.calculateBraceletWeight(bracelet),
        totalLength: this.calculateBraceletLength(bracelet),
        beadCount: bracelet.beads.length,
      },
      thumbnail: thumbnail || '', // 画布截图
      createdAt: now,
      updatedAt: now,
    }

    designs.push(savedDesign)
    this.saveLocalDesigns(designs)

    return savedDesign
  }

  /**
   * 获取所有保存的设计
   */
  async getSavedDesigns(): Promise<SavedDesign[]> {
    await this.delay(200)
    return this.getLocalDesigns()
  }

  /**
   * 获取单个设计
   */
  async getDesignById(designId: string): Promise<SavedDesign | null> {
    await this.delay(200)
    const designs = this.getLocalDesigns()
    return designs.find((d) => d.id === designId) || null
  }

  /**
   * 更新设计
   */
  async updateDesign(
    designId: string,
    bracelet?: Bracelet,
    name?: string,
    thumbnail?: string
  ): Promise<SavedDesign> {
    await this.delay(300)

    const designs = this.getLocalDesigns()
    const index = designs.findIndex((d) => d.id === designId)

    if (index === -1) {
      throw new Error('设计不存在')
    }

    if (bracelet) {
      designs[index].bracelet = bracelet
      designs[index].properties = {
        totalPrice: this.calculateBraceletPrice(bracelet),
        totalWeight: this.calculateBraceletWeight(bracelet),
        totalLength: this.calculateBraceletLength(bracelet),
        beadCount: bracelet.beads.length,
      }
    }

    if (name) {
      designs[index].name = name
    }

    if (thumbnail) {
      designs[index].thumbnail = thumbnail
    }

    designs[index].updatedAt = Date.now()

    this.saveLocalDesigns(designs)
    return designs[index]
  }

  /**
   * 删除设计
   */
  async deleteDesign(designId: string): Promise<boolean> {
    await this.delay(200)

    const designs = this.getLocalDesigns()
    const filteredDesigns = designs.filter((d) => d.id !== designId)

    if (filteredDesigns.length === designs.length) {
      throw new Error('设计不存在')
    }

    this.saveLocalDesigns(filteredDesigns)
    return true
  }

  /**
   * 从本地存储获取设计数据
   */
  private getLocalDesigns(): SavedDesign[] {
    try {
      const data = Taro.getStorageSync(this.storageKey)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('读取设计数据失败:', error)
      return []
    }
  }

  /**
   * 保存设计数据到本地存储
   */
  private saveLocalDesigns(designs: SavedDesign[]): void {
    try {
      Taro.setStorageSync(this.storageKey, JSON.stringify(designs))
    } catch (error) {
      console.error('保存设计数据失败:', error)
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

export const mockDesignService = new MockDesignService()
