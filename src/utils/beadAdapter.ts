// src/utils/beadAdapter.ts
import { Bead, PhysicsBead } from '../types/bead'

// BEAD_SCALE: mm → canvas pixels (与参考项目一致)
const BEAD_SCALE = 3

/**
 * 将 API 珠子数据转换为物理引擎格式
 * diameter (mm) → radius (canvas pixels) = diameter / 2 * BEAD_SCALE
 */
export function adaptBead(bead: Bead): PhysicsBead {
  return {
    id: bead.id,
    name: bead.name,
    color: getBeadColor(bead),
    radius: (bead.diameter / 2) * BEAD_SCALE,
    price: bead.price,
    image: bead.imageUrl || undefined,
    category: bead.category,
  }
}

/**
 * 根据珠子信息生成颜色
 * 优先使用 imageUrl，否则用默认颜色映射
 */
function getBeadColor(bead: Bead): string {
  // 如果有图片，渲染器会用图片覆盖颜色
  if (bead.imageUrl) return '#CCCCCC'

  // 按分类给默认颜色
  const colorMap: Record<string, string> = {
    '单色水晶': '#E8E0F0',
    '天然石': '#8B7355',
    '配饰': '#C0C0C0',
    '随型': '#DEB887',
    '文玩': '#8B4513',
  }

  return colorMap[bead.category] || '#CCCCCC'
}

export { BEAD_SCALE }
