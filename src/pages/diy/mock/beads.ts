/**
 * 珠子 Mock 数据
 * 从参考项目 diy_shouchuang/utils/beads.js 移植
 */

export interface BeadData {
  id: string
  name: string
  color: string
  image?: string  // 珠子图片URL
  sizes: number[]
  prices: number[]
  sizeIndex?: number
  radius?: number
  category?: string
  subType?: string
}

export interface SubType {
  id: string
  name: string
  beads: BeadData[]
}

export interface Category {
  id: string
  name: string
  subTypes: SubType[]
}

// 珠子数据：分类 → 子类 → 珠子（含尺寸选项）
const beadData: Record<string, SubType[]> = {
  bead: [
    {
      id: 'crystal',
      name: '水晶',
      beads: [
        { id: 'b_crystal_1', name: '白水晶', color: '#F0F8FF', sizes: [6, 8, 10, 12, 14], prices: [3, 4, 5, 7, 10] },
        { id: 'b_crystal_2', name: '粉晶', color: '#FFB6C1', sizes: [6, 8, 10, 12, 14], prices: [3, 4, 5, 7, 10] },
        { id: 'b_crystal_3', name: '紫水晶', color: '#9370DB', sizes: [6, 8, 10, 12, 14], prices: [4, 5, 6, 8, 12] },
        { id: 'b_crystal_4', name: '黄水晶', color: '#FFD700', sizes: [6, 8, 10, 12, 14], prices: [4, 5, 6, 8, 12] },
        { id: 'b_crystal_5', name: '茶水晶', color: '#8B6914', sizes: [8, 10, 12], prices: [4, 5, 7] },
        { id: 'b_crystal_6', name: '绿幽灵', color: '#2E8B57', sizes: [8, 10, 12], prices: [5, 7, 10] }
      ]
    },
    {
      id: 'agate',
      name: '玛瑙',
      beads: [
        { id: 'b_agate_1', name: '红玛瑙', color: '#DC143C', sizes: [6, 8, 10, 12, 14], prices: [3, 4, 5, 6, 8] },
        { id: 'b_agate_2', name: '蓝玛瑙', color: '#4169E1', sizes: [6, 8, 10, 12, 14], prices: [3, 4, 5, 6, 8] },
        { id: 'b_agate_3', name: '绿玛瑙', color: '#3CB371', sizes: [6, 8, 10, 12, 14], prices: [3, 4, 5, 6, 8] },
        { id: 'b_agate_4', name: '黑玛瑙', color: '#1C1C1C', sizes: [6, 8, 10, 12, 14], prices: [3, 4, 5, 6, 8] }
      ]
    },
    {
      id: 'glass',
      name: '琉璃',
      beads: [
        { id: 'b_glass_1', name: '透明琉璃', color: '#87CEEB', sizes: [8, 10, 12, 14], prices: [3, 4, 5, 6] },
        { id: 'b_glass_2', name: '蓝色琉璃', color: '#4682B4', sizes: [8, 10, 12, 14], prices: [3, 4, 5, 6] },
        { id: 'b_glass_3', name: '绿色琉璃', color: '#32CD32', sizes: [8, 10, 12, 14], prices: [3, 4, 5, 6] },
        { id: 'b_glass_4', name: '紫色琉璃', color: '#BA55D3', sizes: [8, 10, 12, 14], prices: [3, 4, 5, 6] }
      ]
    }
  ],
  stone: [
    {
      id: 'natural_stone',
      name: '天然石',
      beads: [
        { id: 's_stone_1', name: '黑曜石', color: '#2F4F4F', sizes: [8, 10, 12, 14, 16], prices: [3, 4, 5, 6, 8] },
        { id: 's_stone_2', name: '虎眼石', color: '#B8860B', sizes: [8, 10, 12, 14, 16], prices: [4, 5, 6, 8, 10] },
        { id: 's_stone_3', name: '青金石', color: '#000080', sizes: [8, 10, 12, 14], prices: [5, 7, 10, 15] },
        { id: 's_stone_4', name: '孔雀石', color: '#2E8B57', sizes: [8, 10, 12, 14], prices: [5, 7, 10, 15] },
        { id: 's_stone_5', name: '南红', color: '#C41E3A', sizes: [8, 10, 12, 14, 16], prices: [6, 8, 12, 18, 25] },
        { id: 's_stone_6', name: '绿松石', color: '#40E0D0', sizes: [8, 10, 12, 14], prices: [6, 8, 12, 18] }
      ]
    }
  ],
  accessory: [
    {
      id: 'metal',
      name: '金属',
      beads: [
        { id: 'a_metal_1', name: '铜珠', color: '#B87333', sizes: [6, 8, 10], prices: [2, 3, 4] },
        { id: 'a_metal_2', name: '银珠', color: '#C0C0C0', sizes: [6, 8, 10], prices: [5, 8, 12] }
      ]
    },
    {
      id: 'spacer',
      name: '隔片',
      beads: [
        { id: 'a_spacer_1', name: '椰壳隔片', color: '#3E2723', sizes: [6, 8, 10], prices: [1, 2, 3] },
        { id: 'a_spacer_2', name: '蜜蜡隔片', color: '#FFD54F', sizes: [6, 8, 10], prices: [3, 4, 5] }
      ]
    }
  ],
  freeform: [
    {
      id: 'freeform_stone',
      name: '随型石',
      beads: [
        { id: 'f_stone_1', name: '随型蜜蜡', color: '#FFD54F', sizes: [10, 12, 14, 16], prices: [8, 12, 18, 25] },
        { id: 'f_stone_2', name: '随型南红', color: '#C41E3A', sizes: [10, 12, 14, 16], prices: [10, 15, 20, 30] }
      ]
    }
  ],
  wenwan: [
    {
      id: 'wood',
      name: '木质',
      beads: [
        { id: 'w_wood_1', name: '檀木', color: '#8B4513', sizes: [10, 12, 14, 16, 18], prices: [3, 4, 5, 7, 10] },
        { id: 'w_wood_2', name: '黄花梨', color: '#D2691E', sizes: [10, 12, 14, 16, 18], prices: [5, 7, 10, 15, 20] },
        { id: 'w_wood_3', name: '沉香', color: '#A0522D', sizes: [10, 12, 14, 16], prices: [8, 12, 18, 25] },
        { id: 'w_wood_4', name: '绿檀', color: '#556B2F', sizes: [10, 12, 14, 16, 18], prices: [3, 4, 5, 7, 10] }
      ]
    },
    {
      id: 'seed',
      name: '菩提',
      beads: [
        { id: 'w_seed_1', name: '星月菩提', color: '#F5F5DC', sizes: [8, 10, 12, 14], prices: [5, 7, 10, 15] },
        { id: 'w_seed_2', name: '金刚菩提', color: '#8B6914', sizes: [10, 12, 14, 16], prices: [5, 8, 12, 18] }
      ]
    }
  ]
}

// 主分类列表
export const categories: Category[] = [
  { id: 'bead', name: '珠子', subTypes: beadData.bead },
  { id: 'stone', name: '天然石', subTypes: beadData.stone },
  { id: 'accessory', name: '配饰', subTypes: beadData.accessory },
  { id: 'freeform', name: '随型', subTypes: beadData.freeform },
  { id: 'wenwan', name: '文玩', subTypes: beadData.wenwan }
]

/**
 * 获取所有主分类
 */
export function getCategories(): Category[] {
  return categories
}

/**
 * 获取指定分类的子类列表
 */
export function getSubTypes(categoryId: string): SubType[] {
  const cat = categories.find(c => c.id === categoryId)
  return cat ? cat.subTypes : []
}

/**
 * 获取指定子类的珠子列表（每个珠子附带当前选中尺寸）
 */
export function getBeadsBySubType(categoryId: string, subTypeId: string): BeadData[] {
  const subTypes = getSubTypes(categoryId)
  const subType = subTypes.find(s => s.id === subTypeId)
  if (!subType) return []
  return subType.beads.map(b => ({
    ...b,
    sizeIndex: Math.floor(b.sizes.length / 2),
    radius: b.sizes[Math.floor(b.sizes.length / 2)] / 2,
    category: categoryId,
    subType: subTypeId
  }))
}

/**
 * 根据 ID 获取珠子（搜索所有分类）
 */
export function getBeadById(id: string): BeadData | null {
  for (const cat of categories) {
    for (const subType of cat.subTypes) {
      const bead = subType.beads.find(b => b.id === id)
      if (bead) {
        return {
          ...bead,
          sizeIndex: Math.floor(bead.sizes.length / 2),
          radius: bead.sizes[Math.floor(bead.sizes.length / 2)] / 2,
          category: cat.id,
          subType: subType.id
        }
      }
    }
  }
  return null
}

/**
 * 获取所有珠子
 */
export function getAllBeads(): BeadData[] {
  const all: BeadData[] = []
  for (const cat of categories) {
    for (const subType of cat.subTypes) {
      for (const bead of subType.beads) {
        all.push({
          ...bead,
          sizeIndex: Math.floor(bead.sizes.length / 2),
          radius: bead.sizes[Math.floor(bead.sizes.length / 2)] / 2,
          category: cat.id,
          subType: subType.id
        })
      }
    }
  }
  return all
}
