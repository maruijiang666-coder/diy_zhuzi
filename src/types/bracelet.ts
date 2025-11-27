import { Bead } from './bead'

export interface Bracelet {
  id?: string
  beads: Bead[]
  createdAt?: number
  updatedAt?: number
}

export interface BraceletProperties {
  totalPrice: number
  totalWeight: number
  totalLength: number
  beadCount: number
}
