import { beadApi, GetBeadsParams } from '../api/endpoints'
import { Bead } from '../types/bead'
import { Category } from '../types/common'
import { mockBeadService } from './mockBeadService'

// 是否使用Mock数据（开发测试阶段始终使用Mock数据，避免真实API调用）
const USE_MOCK = true

/**
 * 珠子数据服务
 * 封装珠子相关的业务逻辑和API调用
 */
class BeadService {
  /**
   * 获取珠子列表
   * 支持分类筛选和搜索
   * @param category 分类ID（可选）
   * @param keyword 搜索关键词（可选）
   * @param page 页码，默认1
   * @param pageSize 每页数量，默认20
   */
  async getBeads(
    category?: string,
    keyword?: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ beads: Bead[]; total: number; page: number; pageSize: number }> {
    // 使用Mock数据
    if (USE_MOCK) {
      return await mockBeadService.getBeads(category, keyword, page, pageSize)
    }

    // 使用真实API
    const params: GetBeadsParams = {
      page,
      pageSize,
    }

    if (category) {
      params.category = category
    }

    if (keyword && keyword.trim()) {
      params.keyword = keyword.trim()
    }

    return await beadApi.getBeads(params)
  }

  /**
   * 获取珠子分类列表
   */
  async getCategories(): Promise<Category[]> {
    // 使用Mock数据
    if (USE_MOCK) {
      return await mockBeadService.getCategories()
    }

    return await beadApi.getCategories()
  }

  /**
   * 获取珠子详情
   * @param id 珠子ID
   */
  async getBeadById(id: string): Promise<Bead> {
    if (!id || !id.trim()) {
      throw new Error('珠子ID不能为空')
    }

    // 使用Mock数据
    if (USE_MOCK) {
      return await mockBeadService.getBeadById(id)
    }

    return await beadApi.getBeadById(id)
  }

  /**
   * 搜索珠子
   * 便捷方法，专门用于搜索
   * @param keyword 搜索关键词
   * @param page 页码
   * @param pageSize 每页数量
   */
  async searchBeads(
    keyword: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ beads: Bead[]; total: number }> {
    const result = await this.getBeads(undefined, keyword, page, pageSize)
    return {
      beads: result.beads,
      total: result.total,
    }
  }

  /**
   * 按分类获取珠子
   * 便捷方法，专门用于分类筛选
   * @param category 分类ID
   * @param page 页码
   * @param pageSize 每页数量
   */
  async getBeadsByCategory(
    category: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ beads: Bead[]; total: number }> {
    const result = await this.getBeads(category, undefined, page, pageSize)
    return {
      beads: result.beads,
      total: result.total,
    }
  }
}

// 导出单例
export const beadService = new BeadService()
