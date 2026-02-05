import { BeadShape } from '../types/bead'

/**
 * 异形珠子关键词列表
 * 包含这些关键词的珠子将被识别为异形 (irregular)
 */
export const IRREGULAR_KEYWORDS = [
  '随形', '随行', '随性', '异形', 
  '爱心', '心形', 
  '月牙', '月亮', 
  '水滴', '吊坠', 
  '貔貅', '狐狸', '醒狮', '神兽',
  '花', '玫瑰', '莲花',
  '猫爪', '熊爪',
  '方', '方糖', '魔方',
  '蝴蝶', '蝴蝶结',
  '星星', '五角星',
  '钱袋', '福袋',
  '算盘'
]

/**
 * 根据珠子名称自动检测形状
 * @param name 珠子名称
 * @param category 珠子分类（可选）
 * @returns 珠子形状 (circle | irregular)
 */
export const getBeadShape = (name: string, category?: string): BeadShape => {
  if (!name) return 'circle'
  
  const lowerName = name.toLowerCase()
  let isIrregular = IRREGULAR_KEYWORDS.some(keyword => lowerName.includes(keyword))
  
  // 如果名称没匹配到，尝试匹配分类
  if (!isIrregular && category) {
    const lowerCategory = category.toLowerCase()
    isIrregular = IRREGULAR_KEYWORDS.some(keyword => lowerCategory.includes(keyword))
  }
  
  return isIrregular ? 'irregular' : 'circle'
}
