import { Bead } from './bead'

export interface Bracelet {
  id?: string
  name?: string
  beads: Bead[]
  createdAt?: number
  updatedAt?: number
}

export interface BraceletProperties {
  totalPrice: number
  totalWeight: number
  totalLength: number
  beadCount: number
  description?: any // 可选的描述信息
}
