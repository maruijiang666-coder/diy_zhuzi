/**
 * 格式化价格，添加¥符号
 * @param price 价格（元）
 * @param decimals 小数位数，默认2位
 * @returns 格式化后的价格字符串，如 "¥99.00"
 */
export function formatPrice(price: number | string | undefined, decimals: number = 2): string {
  // 兼容字符串数值（后端 properties 返回的是字符串），统一转数字再处理
  const num = price === undefined || price === null ? NaN : Number(price)
  if (isNaN(num)) {
    return '¥0.00'
  }
  return `¥${num.toFixed(decimals)}`
}

/**
 * 格式化重量，添加g单位
 * @param weight 重量（克）
 * @param decimals 小数位数，默认2位
 * @returns 格式化后的重量字符串，如 "50.00g"
 */
export function formatWeight(weight: number | string | undefined, decimals: number = 2): string {
  const num = weight === undefined || weight === null ? NaN : Number(weight)
  if (isNaN(num)) {
    return '0.00g'
  }
  return `${num.toFixed(decimals)}g`
}

/**
 * 格式化长度，添加cm单位
 * @param length 长度（厘米）
 * @param decimals 小数位数，默认2位
 * @returns 格式化后的长度字符串，如 "18.50cm"
 */
export function formatLength(length: number | string | undefined, decimals: number = 2): string {
  const num = length === undefined || length === null ? NaN : Number(length)
  if (isNaN(num)) {
    return '0.00cm'
  }
  return `${num.toFixed(decimals)}cm`
}
