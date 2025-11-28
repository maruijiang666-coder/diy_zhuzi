/**
 * 测试Mock数据的工具函数
 * 用于在控制台验证Mock数据是否正常工作
 */

import { beadService } from '../services/beadService'

export async function testMockData() {
  console.log('=== 开始测试Mock数据 ===')
  
  try {
    // 测试获取珠子列表
    console.log('1. 测试获取珠子列表...')
    const beadsResult = await beadService.getBeads()
    console.log('珠子列表:', beadsResult)
    console.log(`共 ${beadsResult.total} 个珠子`)
    
    // 测试获取分类
    console.log('\n2. 测试获取分类列表...')
    const categories = await beadService.getCategories()
    console.log('分类列表:', categories)
    console.log(`共 ${categories.length} 个分类`)
    
    // 测试搜索
    console.log('\n3. 测试搜索功能...')
    const searchResult = await beadService.getBeads(undefined, '水晶')
    console.log('搜索"水晶"结果:', searchResult)
    console.log(`找到 ${searchResult.total} 个结果`)
    
    // 测试分类筛选
    console.log('\n4. 测试分类筛选...')
    const categoryResult = await beadService.getBeads('amethyst')
    console.log('紫水晶分类结果:', categoryResult)
    console.log(`找到 ${categoryResult.total} 个结果`)
    
    // 测试获取详情
    console.log('\n5. 测试获取珠子详情...')
    const bead = await beadService.getBeadById('bead-001')
    console.log('珠子详情:', bead)
    
    console.log('\n=== Mock数据测试完成 ===')
    console.log('✅ 所有测试通过！')
    
    return true
  } catch (error) {
    console.error('❌ 测试失败:', error)
    return false
  }
}

// 在浏览器控制台中可以调用: window.testMockData()
if (typeof window !== 'undefined') {
  (window as any).testMockData = testMockData
}
