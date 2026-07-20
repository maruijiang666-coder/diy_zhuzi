export type BeadShape = 'circle' | 'square' | 'irregular'

export interface Bead {
  id: string
  originalId?: string // 原始 ID，用于向接口发送数据
  name: string
  category: string
  imageUrl: string
  price: number // 单价（元）
  weight: number // 重量（克）
  diameter: number // 直径（毫米）
  stock: number // 库存数量
  description?: string
  shape?: BeadShape // 形状，默认为 circle
}

export interface PhysicsBead {
  id: string
  name: string
  color: string
  radius: number    // diameter / 2 * BEAD_SCALE (canvas pixels)
  price: number
  image?: string
  category: string
}
