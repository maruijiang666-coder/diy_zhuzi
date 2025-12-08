// 测试订单详情API
const { orderApi } = require('./src/api/endpoints.ts')

async function testOrderDetail() {
  try {
    console.log('开始测试订单详情API...')
    
    // 测试获取订单ID为5的详情
    const orderId = '5'
    console.log(`正在获取订单 ${orderId} 的详情...`)
    
    const orderDetail = await orderApi.getOrderById(orderId)
    
    console.log('订单详情获取成功:')
    console.log('订单ID:', orderDetail.id)
    console.log('用户ID:', orderDetail.userId)
    console.log('订单状态:', orderDetail.status)
    console.log('总价:', orderDetail.totalPrice)
    console.log('商品数量:', orderDetail.items.length)
    console.log('收货地址:', orderDetail.shippingAddress)
    console.log('创建时间:', new Date(orderDetail.createdAt))
    
    if (orderDetail.items.length > 0) {
      const firstItem = orderDetail.items[0]
      console.log('第一个商品:')
      console.log('  商品ID:', firstItem.id)
      console.log('  价格:', firstItem.price)
      console.log('  珠子数量:', firstItem.bracelet.beads.length)
      console.log('  总价:', firstItem.properties.totalPrice)
      console.log('  总重量:', firstItem.properties.totalWeight)
      console.log('  总长度:', firstItem.properties.totalLength)
    }
    
    console.log('测试完成！')
    
  } catch (error) {
    console.error('测试失败:', error)
  }
}

// 运行测试
testOrderDetail()