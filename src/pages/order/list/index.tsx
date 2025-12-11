import { View, Text, ScrollView } from '@tarojs/components'
import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import { useOrderStore } from '../../../stores/useOrderStore'
import { Loading, Empty } from '../../../components/common'
import { formatPrice } from '../../../utils/formatter'
import { Order, OrderStatus } from '../../../types/order'
import './index.scss'

// 订单状态显示文本
const ORDER_STATUS_TEXT: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: '待支付',
  [OrderStatus.PAID]: '已支付',
  [OrderStatus.SHIPPED]: '已发货',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.CANCELLED]: '已取消',
}

// 订单状态颜色
const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: '#ff9800',
  [OrderStatus.PAID]: '#4caf50',
  [OrderStatus.SHIPPED]: '#2196f3',
  [OrderStatus.COMPLETED]: '#9e9e9e',
  [OrderStatus.CANCELLED]: '#f44336',
}

export default function OrderListPage() {
  const { orders, loading, error, loadOrders } = useOrderStore()
  // 页面加载时获取订单列表
  useEffect(() => {
    // 添加调试日志，验证Token和加载状态
    const token = Taro.getStorageSync('Import_code')
    console.log(`[OrderListPage] 加载订单列表 - Token前10位: ${token ? token.substring(0, 10) + '...' : '无Token'}`)
    console.log(`[OrderListPage] 当前订单数量: ${orders.length}`)
    
    loadOrders()
  }, [])

  // 处理点击订单，跳转到订单详情
  const handleOrderClick = (order: Order) => {
    Taro.navigateTo({
      url: `/pages/order/detail/index?orderId=${order.id}`,
    })
  }

  // 格式化时间
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  // 渲染订单项
  const renderOrderItem = (order: Order) => {
    // 添加空值检查，确保订单数据完整
    if (!order || !order.items || !Array.isArray(order.items)) {
      console.warn('[OrderListPage] 订单数据不完整:', order)
      return null
    }

    return (
      <View
        key={order.id}
        className='order-item'
        onClick={() => handleOrderClick(order)}
      >
        {/* 订单头部 */}
        <View className='order-header'>
          <View className='order-info'>
            <Text className='order-id'>订单号：{order.id}</Text>
            <Text
              className='order-status'
              style={{ color: ORDER_STATUS_COLOR[order.status] }}
            >
              {ORDER_STATUS_TEXT[order.status]}
            </Text>
          </View>
          <Text className='order-time'>{formatTime(order.createdAt)}</Text>
        </View>

        {/* 订单内容 */}
        <View className='order-content'>
          <View className='order-items'>
            {order.items.map((item, index) => {
              // 添加订单项空值检查
              if (!item || !item.properties) {
                console.warn(`[OrderListPage] 订单项数据不完整 - 订单ID: ${order.id}, 项索引: ${index}`)
                return null
              }
              
              return (
                <View key={`${order.id}-${index}`} className='item-row'>
                  <Text className='item-label'>手串设计 {index + 1}</Text>
                  <Text className='item-value'>
                    {item.properties.beadCount || 0}颗珠子
                  </Text>
                </View>
              )
            }).filter(Boolean)}
          </View>
        </View>

        {/* 订单底部 */}
        <View className='order-footer'>
          <Text className='total-label'>合计：</Text>
          <Text className='total-price'>{formatPrice(order.totalPrice || 0)}</Text>
        </View>
      </View>
    )
  }

  // 加载状态
  if (loading && orders.length === 0) {
    return <Loading />
  }

  // 空状态
  if (!loading && orders.length === 0) {
    return (
      <View className='order-list-page'>
        <Empty text='暂无订单' description='快去设计你的专属手串吧' />
      </View>
    )
  }

  return (
    <View className='order-list-page'>
      {/* 错误提示 */}
      {error && (
        <View className='error-banner'>
          <Text className='error-text'>{error}</Text>
        </View>
      )}

      {/* 订单列表 */}
      <ScrollView className='order-list' scrollY>
        {orders && Array.isArray(orders) ? orders.map((order) => renderOrderItem(order)).filter(Boolean) : []}
      </ScrollView>
    </View>
  )
}
