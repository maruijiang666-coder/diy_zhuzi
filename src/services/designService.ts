import { SavedDesign } from '../types/design'
import { Bracelet } from '../types/bracelet'
import { mockDesignService } from './mockDesignService'
import { designApi, SaveDesignRequest } from '../api/endpoints'
import { Bead } from '../types/bead'

// 是否使用Mock数据
const USE_MOCK = false

/**
 * 设计保存服务
 * 封装设计保存相关的业务逻辑和API调用
 */
class DesignService {
  /**
   * 保存设计
   */
  async saveDesign(
    bracelet: Bracelet,
    name?: string,
    thumbnail?: string
  ): Promise<SavedDesign> {
    if (!bracelet || !bracelet.beads || bracelet.beads.length === 0) {
      throw new Error('设计不能为空，请至少添加一个珠子')
    }

    if (USE_MOCK) {
      return await mockDesignService.saveDesign(bracelet, name, thumbnail)
    }

    // 真实API调用
    const requestData: SaveDesignRequest = {
      name: name || `设计 ${new Date().toLocaleDateString()}`,
      beads: bracelet.beads.map((bead, index) => ({
        bead_id: parseInt(bead.id),
        position: index,
      })),
    }

    const response = await designApi.saveDesign(requestData)

    // 转换为 SavedDesign 格式
    return this.convertApiDataToSavedDesign(response)
  }

  /**
   * 获取所有保存的设计
   */
  async getSavedDesigns(): Promise<SavedDesign[]> {
    if (USE_MOCK) {
      return await mockDesignService.getSavedDesigns()
    }

    // 真实API调用
    const designs = await designApi.getDesigns()
    return designs.map((design) => this.convertApiDataToSavedDesign(design))
  }

  /**
   * 获取单个设计
   */
  async getDesignById(designId: string): Promise<SavedDesign | null> {
    if (!designId || !designId.trim()) {
      throw new Error('设计ID不能为空')
    }

    if (USE_MOCK) {
      return await mockDesignService.getDesignById(designId)
    }

    // 真实API调用
    try {
      const design = await designApi.getDesignById(designId)
      return this.convertApiDataToSavedDesign(design)
    } catch (error) {
      return null
    }
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
    if (!designId || !designId.trim()) {
      throw new Error('设计ID不能为空')
    }

    if (USE_MOCK) {
      return await mockDesignService.updateDesign(designId, bracelet, name, thumbnail)
    }

    // 真实API调用
    const requestData: SaveDesignRequest = {}

    if (name) {
      requestData.name = name
    }

    if (bracelet) {
      requestData.beads = bracelet.beads.map((bead, index) => ({
        bead_id: parseInt(bead.id),
        position: index,
      }))
    }

    const response = await designApi.updateDesign(designId, requestData)
    return this.convertApiDataToSavedDesign(response)
  }

  /**
   * 删除设计
   */
  async deleteDesign(designId: string): Promise<boolean> {
    if (!designId || !designId.trim()) {
      throw new Error('设计ID不能为空')
    }

    if (USE_MOCK) {
      return await mockDesignService.deleteDesign(designId)
    }

    // 真实API调用
    const response = await designApi.deleteDesign(designId)
    return response.success
  }

  /**
   * 转换 API 数据为 SavedDesign 格式
   */
  private convertApiDataToSavedDesign(apiData: any): SavedDesign {
    // 转换珠子数据
    const beads: Bead[] = apiData.bracelet_beads
      .sort((a: any, b: any) => a.position - b.position)
      .map((beadItem: any) => ({
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
      id: String(apiData.id),
      name: apiData.name,
      bracelet: { beads },
      properties: {
        totalPrice,
        totalWeight,
        totalLength,
        beadCount: beads.length,
      },
      thumbnail: '', // API 暂不支持缩略图
      createdAt: new Date(apiData.created_at).getTime(),
      updatedAt: new Date(apiData.updated_at).getTime(),
    }
  }
}

export const designService = new DesignService()
