/**
 * 格式化价格，添加¥符号
 * @param price 价格（元）
 * @param decimals 小数位数，默认2位
 * @returns 格式化后的价格字符串，如 "¥99.00"
 */
export function formatPrice(price: number | undefined, decimals: number = 2): string {
  if (price === undefined || price === null || isNaN(price)) {
    return '¥0.00'
  }
  return `¥${price.toFixed(decimals)}`
}

/**
 * 格式化重量，添加g单位
 * @param weight 重量（克）
 * @param decimals 小数位数，默认2位
 * @returns 格式化后的重量字符串，如 "50.00g"
 */
export function formatWeight(weight: number | undefined, decimals: number = 2): string {
  if (weight === undefined || weight === null || isNaN(weight)) {
    return '0.00g'
  }
  return `${weight.toFixed(decimals)}g`
}

/**
 * 格式化长度，添加cm单位
 * @param length 长度（厘米）
 * @param decimals 小数位数，默认2位
 * @returns 格式化后的长度字符串，如 "18.50cm"
 */
export function formatLength(length: number | undefined, decimals: number = 2): string {
  if (length === undefined || length === null || isNaN(length)) {
    return '0.00cm'
  }
  return `${length.toFixed(decimals)}cm`
}
