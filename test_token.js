// Token 存储测试脚本
const Taro = require('@tarojs/taro')

async function testTokenStorage() {
  console.log('=== Token 存储测试开始 ===')
  
  const testToken = 'test_token_1234567890'
  const key = 'auth_token'
  
  try {
    // 测试设置
    console.log('1. 设置Token...')
    await Taro.setStorage({ key, data: testToken })
    console.log('✓ Token设置成功')
    
    // 测试获取
    console.log('2. 获取Token...')
    const result = await Taro.getStorage({ key })
    console.log('✓ Token获取成功:', result.data)
    
    // 验证一致性
    if (result.data === testToken) {
      console.log('✓ Token一致性验证通过')
    } else {
      console.log('✗ Token不一致:', result.data, '!==', testToken)
    }
    
    // 清理测试数据
    console.log('3. 清理测试数据...')
    await Taro.removeStorage({ key })
    console.log('✓ 测试数据清理完成')
    
  } catch (error) {
    console.error('✗ 测试失败:', error)
  }
  
  console.log('=== Token 存储测试结束 ===')
}

// 运行测试
testTokenStorage()