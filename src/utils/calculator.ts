import { Bead } from '../types/bead'
import { BraceletProperties } from '../types/bracelet'

/**
 * 计算手串总价格
 * @param beads 珠子数组
 * @returns 总价格（元）
 */
export function calculateTotalPrice(beads: Bead[]): number {
  return beads.reduce((total, bead) => total + bead.price, 0)
}

/**
 * 计算手串总重量
 * @param beads 珠子数组
 * @returns 总重量（克）
 */
export function calculateTotalWeight(beads: Bead[]): number {
  return beads.reduce((total, bead) => total + bead.weight, 0)
}

/**
 * 计算手串总长度
 * @param beads 珠子数组
 * @returns 总长度（厘米）
 */
export function calculateTotalLength(beads: Bead[]): number {
  // 直径单位是毫米，需要转换为厘米
  const totalMm = beads.reduce((total, bead) => total + bead.diameter, 0)
  return totalMm / 10
}

/**
 * 一次性计算所有手串属性
 * @param beads 珠子数组
 * @returns 手串属性对象
 */
export function calculateProperties(beads: Bead[]): BraceletProperties {
  return {
    totalPrice: calculateTotalPrice(beads),
    totalWeight: calculateTotalWeight(beads),
    totalLength: calculateTotalLength(beads),
    beadCount: beads.length,
  }
}
