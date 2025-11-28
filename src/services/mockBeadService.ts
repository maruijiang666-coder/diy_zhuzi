import { Bead } from '../types/bead'
import { Category } from '../types/common'

/**
 * Mock珠子数据服务
 * 用于开发测试，提供模拟数据
 */

// 测试图片路径
// 注意：在 Taro 中，图片路径应该使用字符串形式，编译时会自动处理
// 如果使用本地图片，路径格式为：/assets/xxx.png
// 如果使用远程图片，直接使用完整的 https:// URL
const crystalTestImg = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/SJSY/crystal_test.png'

// 测试珠子数据
const mockBeads: Bead[] = [
  {
    id: 'bead-001',
    name: '紫水晶',
    category: 'amethyst',
    imageUrl: crystalTestImg,
    price: 15.00,
    weight: 2.5,
    diameter: 8,
    stock: 100,
    description: '天然紫水晶，色泽纯正',
  },
  {
    id: 'bead-002',
    name: '粉晶',
    category: 'rose-quartz',
    imageUrl: crystalTestImg,
    price: 12.00,
    weight: 2.3,
    diameter: 8,
    stock: 150,
    description: '粉色水晶，象征爱情',
  },
  {
    id: 'bead-003',
    name: '黑曜石',
    category: 'obsidian',
    imageUrl: crystalTestImg,
    price: 10.00,
    weight: 3.0,
    diameter: 10,
    stock: 200,
    description: '天然黑曜石，辟邪护身',
  },
  {
    id: 'bead-004',
    name: '白水晶',
    category: 'clear-quartz',
    imageUrl: crystalTestImg,
    price: 8.00,
    weight: 2.0,
    diameter: 6,
    stock: 180,
    description: '透明水晶，纯净无瑕',
  },
  {
    id: 'bead-005',
    name: '黄水晶',
    category: 'citrine',
    imageUrl: crystalTestImg,
    price: 18.00,
    weight: 2.8,
    diameter: 8,
    stock: 120,
    description: '黄色水晶，招财进宝',
  },
  {
    id: 'bead-006',
    name: '绿幽灵',
    category: 'green-phantom',
    imageUrl: crystalTestImg,
    price: 25.00,
    weight: 3.2,
    diameter: 10,
    stock: 80,
    description: '绿幽灵水晶，事业运',
  },
  {
    id: 'bead-007',
    name: '红玛瑙',
    category: 'red-agate',
    imageUrl: crystalTestImg,
    price: 14.00,
    weight: 2.6,
    diameter: 8,
    stock: 160,
    description: '红色玛瑙，增强活力',
  },
  {
    id: 'bead-008',
    name: '虎眼石',
    category: 'tiger-eye',
    imageUrl: crystalTestImg,
    price: 16.00,
    weight: 3.5,
    diameter: 10,
    stock: 140,
    description: '虎眼石，增强自信',
  },
  {
    id: 'bead-009',
    name: '月光石',
    category: 'moonstone',
    imageUrl: crystalTestImg,
    price: 20.00,
    weight: 2.4,
    diameter: 8,
    stock: 90,
    description: '月光石，柔和光泽',
  },
  {
    id: 'bead-010',
    name: '青金石',
    category: 'lapis-lazuli',
    imageUrl: crystalTestImg,
    price: 22.00,
    weight: 3.0,
    diameter: 10,
    stock: 100,
    description: '深蓝色青金石，智慧之石',
  },
]

// 测试分类数据
const mockCategories: Category[] = [
  { id: 'amethyst', name: '紫水晶' },
  { id: 'rose-quartz', name: '粉晶' },
  { id: 'obsidian', name: '黑曜石' },
  { id: 'clear-quartz', name: '白水晶' },
  { id: 'citrine', name: '黄水晶' },
  { id: 'green-phantom', name: '绿幽灵' },
  { id: 'red-agate', name: '红玛瑙' },
  { id: 'tiger-eye', name: '虎眼石' },
  { id: 'moonstone', name: '月光石' },
  { id: 'lapis-lazuli', name: '青金石' },
]

/**
 * Mock珠子服务类
 */
class MockBeadService {
  /**
   * 获取珠子列表
   */
  async getBeads(
    category?: string,
    keyword?: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ beads: Bead[]; total: number; page: number; pageSize: number }> {
    // 模拟网络延迟
    await this.delay(300)

    let filteredBeads = [...mockBeads]

    // 分类筛选
    if (category) {
      filteredBeads = filteredBeads.filter((bead) => bead.category === category)
    }

    // 关键词搜索
    if (keyword && keyword.trim()) {
      const lowerKeyword = keyword.toLowerCase().trim()
      filteredBeads = filteredBeads.filter((bead) =>
        bead.name.toLowerCase().includes(lowerKeyword) ||
        bead.description?.toLowerCase().includes(lowerKeyword)
      )
    }

    // 分页
    const total = filteredBeads.length
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const pagedBeads = filteredBeads.slice(start, end)

    return {
      beads: pagedBeads,
      total,
      page,
      pageSize,
    }
  }

  /**
   * 获取珠子分类列表
   */
  async getCategories(): Promise<Category[]> {
    await this.delay(200)
    return [...mockCategories]
  }

  /**
   * 获取珠子详情
   */
  async getBeadById(id: string): Promise<Bead> {
    await this.delay(200)
    
    const bead = mockBeads.find((b) => b.id === id)
    if (!bead) {
      throw new Error('珠子不存在')
    }
    
    return { ...bead }
  }

  /**
   * 模拟网络延迟
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// 导出单例
export const mockBeadService = new MockBeadService()
