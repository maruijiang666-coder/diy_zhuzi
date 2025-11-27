export interface Bead {
  id: string
  name: string
  category: string
  imageUrl: string
  price: number // 单价（元）
  weight: number // 重量（克）
  diameter: number // 直径（毫米）
  stock: number // 库存数量
  description?: string
}
