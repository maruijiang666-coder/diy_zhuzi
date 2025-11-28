import { SavedDesign } from '../types/design'
import { Bracelet } from '../types/bracelet'
import { mockDesignService } from './mockDesignService'

// 是否使用Mock数据
const USE_MOCK = true

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

    // TODO: 实现真实API调用
    throw new Error('API未实现')
  }

  /**
   * 获取所有保存的设计
   */
  async getSavedDesigns(): Promise<SavedDesign[]> {
    if (USE_MOCK) {
      return await mockDesignService.getSavedDesigns()
    }

    // TODO: 实现真实API调用
    throw new Error('API未实现')
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

    // TODO: 实现真实API调用
    throw new Error('API未实现')
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

    // TODO: 实现真实API调用
    throw new Error('API未实现')
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

    // TODO: 实现真实API调用
    throw new Error('API未实现')
  }
}

export const designService = new DesignService()
