#!/usr/bin/env node

/**
 * Mock数据导出脚本
 * 用于在Node.js环境中导出Mock数据
 * 
 * 使用方法:
 * node scripts/export-mock-data.js [type] [output]
 * 
 * 参数:
 * type: 导出类型 (all, beads, categories, cart, designs, orders)
 * output: 输出文件路径 (可选)
 * 
 * 示例:
 * node scripts/export-mock-data.js all ./mock-data.json
 * node scripts/export-mock-data.js beads ./beads.json
 */

const fs = require('fs');
const path = require('path');

// 模拟项目中的Mock服务
class MockBeadService {
  constructor() {
    this.mockBeads = [
      {
        id: 1,
        name: '紫水晶珠子',
        category: 'amethyst',
        price: 25,
        size: 8,
        color: '#9966CC',
        image: '/assets/images/amethyst.png',
        description: '高品质紫水晶珠子'
      },
      {
        id: 2,
        name: '粉水晶珠子',
        category: 'rose_quartz',
        price: 20,
        size: 10,
        color: '#FFB6C1',
        image: '/assets/images/rose_quartz.png',
        description: '温柔粉水晶珠子'
      }
    ];
    
    this.mockCategories = [
      { id: 'amethyst', name: '紫水晶', description: '紫水晶系列' },
      { id: 'rose_quartz', name: '粉水晶', description: '粉水晶系列' }
    ];
  }
  
  async getBeads() {
    return { beads: this.mockBeads };
  }
  
  async getCategories() {
    return this.mockCategories;
  }
}

class MockCartService {
  constructor() {
    this.mockCartItems = [
      {
        beadId: 1,
        quantity: 2,
        bead: {
          id: 1,
          name: '紫水晶珠子',
          category: 'amethyst',
          price: 25,
          size: 8,
          color: '#9966CC',
          image: '/assets/images/amethyst.png',
          description: '高品质紫水晶珠子'
        }
      }
    ];
  }
  
  async getCartItems() {
    return this.mockCartItems;
  }
}

class MockDesignService {
  constructor() {
    this.mockDesigns = [
      {
        id: 'design-1',
        name: '测试设计',
        beads: [
          {
            beadId: 1,
            quantity: 2,
            bead: {
              id: 1,
              name: '紫水晶珠子',
              category: 'amethyst',
              price: 25,
              size: 8,
              color: '#9966CC',
              image: '/assets/images/amethyst.png',
              description: '高品质紫水晶珠子'
            }
          }
        ],
        totalPrice: 50,
        totalWeight: 10,
        totalLength: 16
      }
    ];
  }
  
  async getDesigns() {
    return this.mockDesigns;
  }
}

// 创建服务实例
const mockBeadService = new MockBeadService();
const mockCartService = new MockCartService();
const mockDesignService = new MockDesignService();

/**
 * 导出所有Mock数据
 */
async function exportAllMockData() {
  console.log('🚀 开始导出Mock数据...');
  
  try {
    const allData = {
      beads: [],
      categories: [],
      cartItems: [],
      designs: [],
      orders: [],
      exportTime: new Date().toISOString(),
      exportVersion: '1.0.0'
    };

    // 1. 导出珠子数据
    console.log('📿 导出珠子数据...');
    const beadsResult = await mockBeadService.getBeads();
    allData.beads = beadsResult.beads;
    
    // 2. 导出分类数据
    console.log('🏷️ 导出分类数据...');
    allData.categories = await mockBeadService.getCategories();
    
    // 3. 导出购物车数据
    console.log('🛒 导出购物车数据...');
    allData.cartItems = await mockCartService.getCartItems();
    
    // 4. 导出设计数据
    console.log('🎨 导出设计数据...');
    allData.designs = await mockDesignService.getDesigns();
    
    // 5. 导出订单数据
    console.log('📋 导出订单数据...');
    allData.orders = [];

    console.log('✅ Mock数据导出成功！');
    console.log('📊 导出数据统计：');
    console.log(`  - 珠子: ${allData.beads.length} 个`);
    console.log(`  - 分类: ${allData.categories.length} 个`);
    console.log(`  - 购物车项: ${allData.cartItems.length} 个`);
    console.log(`  - 设计: ${allData.designs.length} 个`);
    console.log(`  - 订单: ${allData.orders.length} 个`);
    
    return allData;
  } catch (error) {
    console.error('❌ 导出Mock数据失败:', error);
    throw error;
  }
}

/**
 * 导出指定类型的Mock数据
 */
async function exportMockDataByType(type) {
  console.log(`🎯 导出${type}类型的Mock数据...`);
  
  try {
    let data = null;
    
    switch (type) {
      case 'beads':
        const beadsResult = await mockBeadService.getBeads();
        data = beadsResult.beads;
        break;
        
      case 'categories':
        data = await mockBeadService.getCategories();
        break;
        
      case 'cart':
        data = await mockCartService.getCartItems();
        break;
        
      case 'designs':
        data = await mockDesignService.getDesigns();
        break;
        
      case 'orders':
        data = [];
        break;
        
      default:
        throw new Error(`不支持的数据类型: ${type}`);
    }
    
    console.log(`✅ ${type}数据导出成功！`);
    return data;
  } catch (error) {
    console.error(`❌ 导出${type}数据失败:`, error);
    throw error;
  }
}

/**
 * 获取Mock数据统计信息
 */
async function getMockDataStats() {
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
    ]);
    
    const stats = {
      beads: beadsResult.beads.length,
      categories: categories.length,
      cartItems: cartItems.length,
      designs: designs.length,
      orders: 0,
      total: beadsResult.beads.length + categories.length + cartItems.length + designs.length
    };
    
    console.log('📊 Mock数据统计：');
    console.log(`  - 珠子: ${stats.beads} 个`);
    console.log(`  - 分类: ${stats.categories} 个`);
    console.log(`  - 购物车项: ${stats.cartItems} 个`);
    console.log(`  - 设计: ${stats.designs} 个`);
    console.log(`  - 订单: ${stats.orders} 个`);
    console.log(`  - 总计: ${stats.total} 条数据`);
    
    return stats;
  } catch (error) {
    console.error('❌ 获取统计数据失败:', error);
    throw error;
  }
}

/**
 * 保存数据到文件
 */
function saveToFile(data, filename) {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(filename, jsonString, 'utf8');
    console.log(`💾 数据已保存到: ${filename}`);
    console.log(`📄 文件大小: ${(jsonString.length / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error('❌ 保存文件失败:', error);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const exportType = args[0] || 'all';
  const outputFile = args[1] || null;
  
  console.log('🚀 Mock数据导出工具');
  console.log('='.repeat(50));
  
  try {
    let data;
    let defaultFilename;
    
    switch (exportType) {
      case 'all':
        data = await exportAllMockData();
        defaultFilename = `mock-data-${new Date().toISOString().slice(0, 10)}.json`;
        break;
        
      case 'stats':
        await getMockDataStats();
        return;
        
      case 'beads':
      case 'categories':
      case 'cart':
      case 'designs':
      case 'orders':
        data = await exportMockDataByType(exportType);
        defaultFilename = `mock-${exportType}.json`;
        break;
        
      default:
        console.error(`❌ 不支持的导出类型: ${exportType}`);
        console.log('📋 支持的类型: all, beads, categories, cart, designs, orders, stats');
        process.exit(1);
    }
    
    // 保存到文件
    if (outputFile || exportType !== 'stats') {
      const filename = outputFile || defaultFilename;
      saveToFile(data, filename);
      
      console.log('✅ 导出完成！');
      console.log(`📁 输出文件: ${path.resolve(filename)}`);
    }
    
  } catch (error) {
    console.error('❌ 导出过程失败:', error);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 程序执行失败:', error);
    process.exit(1);
  });
}

// 导出函数供其他模块使用
module.exports = {
  exportAllMockData,
  exportMockDataByType,
  getMockDataStats
};