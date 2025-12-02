/**
 * Mock数据导出工具
 * 用于导出项目中的Mock数据到JSON文件
 */

import { mockBeadService } from '../services/mockBeadService'
import { mockCartService } from '../services/mockCartService'
import { mockDesignService } from '../services/mockDesignService'

/**
 * 导出所有Mock数据
 */
export async function exportAllMockData() {
  console.log('🚀 开始导出Mock数据...')
  
  try {
    const allData = {
      beads: [],
      categories: [],
      cartItems: [],
      designs: [],
      orders: [],
      exportTime: new Date().toISOString(),
      exportVersion: '1.0.0'
    }

    // 1. 导出珠子数据
    console.log('📿 导出珠子数据...')
    const beadsResult = await mockBeadService.getBeads()
    allData.beads = beadsResult.beads
    
    // 2. 导出分类数据
    console.log('🏷️ 导出分类数据...')
    allData.categories = await mockBeadService.getCategories()
    
    // 3. 导出购物车数据
    console.log('🛒 导出购物车数据...')
    allData.cartItems = await mockCartService.getCartItems()
    
    // 4. 导出设计数据
    console.log('🎨 导出设计数据...')
    allData.designs = await mockDesignService.getDesigns()
    
    // 5. 导出订单数据
    console.log('📋 导出订单数据...')
    // 注意：订单服务目前未实现mock模式，导出空数组
    allData.orders = []

    // 转换为JSON字符串
    const jsonString = JSON.stringify(allData, null, 2)
    
    // 创建Blob对象（浏览器环境）
    if (typeof window !== 'undefined') {
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      // 创建下载链接
      const link = document.createElement('a')
      link.href = url
      link.download = `mock-data-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // 释放URL对象
      URL.revokeObjectURL(url)
      
      console.log('✅ Mock数据导出成功！')
      console.log(`📊 导出数据统计：`)
      console.log(`  - 珠子: ${allData.beads.length} 个`)
      console.log(`  - 分类: ${allData.categories.length} 个`)
      console.log(`  - 购物车项: ${allData.cartItems.length} 个`)
      console.log(`  - 设计: ${allData.designs.length} 个`)
      console.log(`  - 订单: ${allData.orders.length} 个`)
    } else {
      // Node.js环境
      console.log('📄 Mock数据（JSON格式）：')
      console.log(jsonString)
    }
    
    return allData
  } catch (error) {
    console.error('❌ 导出Mock数据失败:', error)
    throw error
  }
}

/**
 * 导出指定类型的Mock数据
 */
export async function exportMockDataByType(type: 'beads' | 'categories' | 'cart' | 'designs' | 'orders') {
  console.log(`🎯 导出${type}类型的Mock数据...`)
  
  try {
    let data: any = null
    let filename = ''
    
    switch (type) {
      case 'beads':
        const beadsResult = await mockBeadService.getBeads()
        data = beadsResult.beads
        filename = 'mock-beads.json'
        break
        
      case 'categories':
        data = await mockBeadService.getCategories()
        filename = 'mock-categories.json'
        break
        
      case 'cart':
        data = await mockCartService.getCartItems()
        filename = 'mock-cart.json'
        break
        
      case 'designs':
        data = await mockDesignService.getDesigns()
        filename = 'mock-designs.json'
        break
        
      case 'orders':
        // 注意：订单服务目前未实现mock模式，返回空数组
        data = []
        filename = 'mock-orders.json'
        break
        
      default:
        throw new Error(`不支持的数据类型: ${type}`)
    }
    
    const jsonString = JSON.stringify(data, null, 2)
    
    // 浏览器环境下载
    if (typeof window !== 'undefined') {
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
    }
    
    console.log(`✅ ${type}数据导出成功！`)
    return data
  } catch (error) {
    console.error(`❌ 导出${type}数据失败:`, error)
    throw error
  }
}

/**
 * 获取Mock数据统计信息
 */
export async function getMockDataStats() {
  try {
    const [
      beadsResult,
      categories,
      cartItems,
      designs
    ] = await Promise.all([
      mockBeadService.getBeads(),
      mockBeadService.getCategories(),
      mockCartService.getCartItems(),
      mockDesignService.getDesigns()
    ])
    
    return {
      beads: beadsResult.beads.length,
      categories: categories.length,
      cartItems: cartItems.length,
      designs: designs.length,
      orders: 0, // 订单服务目前未实现mock模式
      total: beadsResult.beads.length + categories.length + cartItems.length + designs.length
    }
  } catch (error) {
    console.error('❌ 获取统计数据失败:', error)
    throw error
  }
}

// 在浏览器控制台中可以调用以下函数：
if (typeof window !== 'undefined') {
  (window as any).exportAllMockData = exportAllMockData
  (window as any).exportMockDataByType = exportMockDataByType
  (window as any).getMockDataStats = getMockDataStats
}