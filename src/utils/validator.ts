import { Bracelet } from '../types/bracelet'
import { Address } from '../types/order'
import { MAX_BEADS, MIN_BEADS } from '../constants/limits'

/**
 * 验证结果接口
 */
export interface ValidationResult {
  valid: boolean
  message?: string
}

/**
 * 验证手串是否有效
 * @param bracelet 手串对象
 * @returns 验证结果
 */
export function validateBracelet(bracelet: Bracelet): ValidationResult {
  // 检查手串是否为空
  if (!bracelet || !bracelet.beads) {
    return {
      valid: false,
      message: '手串不能为空',
    }
  }

  // 检查珠子数量是否为0
  if (bracelet.beads.length === 0) {
    return {
      valid: false,
      message: '手串至少需要添加一个珠子',
    }
  }

  // 检查珠子数量是否少于最小限制
  if (bracelet.beads.length < MIN_BEADS) {
    return {
      valid: false,
      message: `手串至少需要${MIN_BEADS}个珠子`,
    }
  }

  // 检查珠子数量是否超过最大限制
  if (bracelet.beads.length > MAX_BEADS) {
    return {
      valid: false,
      message: `手串最多只能添加${MAX_BEADS}个珠子`,
    }
  }

  return {
    valid: true,
  }
}

/**
 * 验证收货地址是否有效
 * @param address 收货地址对象
 * @returns 验证结果
 */
export function validateAddress(address: Address): ValidationResult {
  // 检查地址对象是否存在
  if (!address) {
    return {
      valid: false,
      message: '收货地址不能为空',
    }
  }

  // 验证姓名
  if (!address.name || address.name.trim() === '') {
    return {
      valid: false,
      message: '收货人姓名不能为空',
    }
  }

  // 验证手机号
  if (!address.phone || address.phone.trim() === '') {
    return {
      valid: false,
      message: '手机号不能为空',
    }
  }

  // 简单的手机号格式验证（11位数字）
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(address.phone)) {
    return {
      valid: false,
      message: '手机号格式不正确',
    }
  }

  // 验证省份
  if (!address.province || address.province.trim() === '') {
    return {
      valid: false,
      message: '省份不能为空',
    }
  }

  // 验证城市
  if (!address.city || address.city.trim() === '') {
    return {
      valid: false,
      message: '城市不能为空',
    }
  }

  // 验证区县
  if (!address.district || address.district.trim() === '') {
    return {
      valid: false,
      message: '区县不能为空',
    }
  }

  // 验证详细地址
  if (!address.detail || address.detail.trim() === '') {
    return {
      valid: false,
      message: '详细地址不能为空',
    }
  }

  return {
    valid: true,
  }
}
