import { View, Text, Button, ScrollView, Image } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { useOrderStore } from '../../../stores/useOrderStore'
import { useDiyStore } from '../../../stores/useDiyStore'
import { useWechatPay } from '../../../hooks/useWechatPay'
import { Loading } from '../../../components/common'
import { formatPrice, formatWeight, formatLength } from '../../../utils/formatter'
import { OrderStatus } from '../../../types/order'
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

export default function OrderDetailPage() {
  const router = useRouter()
  const orderId = router.params.orderId as string

  const { currentOrder, loading, error, loadOrderDetail } = useOrderStore()
  const { clearBracelet, addBead } = useDiyStore()
  const { paying, initiatePayment } = useWechatPay()

  const [isProcessing, setIsProcessing] = useState(false)

  // 页面加载时获取订单详情
  useEffect(() => {
    if (orderId) {
      loadOrderDetail(orderId)
    }
  }, [orderId])

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

  // 处理继续支付
  const handleContinuePayment = async () => {
    if (!currentOrder) return

    try {
      const result = await initiatePayment(currentOrder.id)

      if (result.success) {
        // 支付成功
        Taro.showToast({
          title: '支付成功',
          icon: 'success',
          duration: 2000,
        })

        // 重新加载订单详情
        setTimeout(() => {
          loadOrderDetail(currentOrder.id)
        }, 2000)
      } else if (result.cancelled) {
        // 用户取消支付
        Taro.showToast({
          title: '支付已取消',
          icon: 'none',
          duration: 2000,
        })
      } else {
        // 支付失败
        Taro.showToast({
          title: result.message,
          icon: 'none',
          duration: 2000,
        })
      }
    } catch (err: any) {
      Taro.showToast({
        title: err.message || '支付失败',
        icon: 'none',
        duration: 2000,
      })
    }
  }

  // 处理再次购买
  const handleBuyAgain = async () => {
    if (!currentOrder) return

    setIsProcessing(true)

    try {
      // 清空当前设计
      clearBracelet()

      // 加载订单中的第一个手串设计到DIY页面
      if (currentOrder.items.length > 0) {
        const firstItem = currentOrder.items[0]
        const bracelet = firstItem.bracelet

        // 依次添加珠子
        for (const bead of bracelet.beads) {
          addBead(bead)
        }

        // 跳转到DIY页面
        Taro.showToast({
          title: '设计已加载',
          icon: 'success',
          duration: 2000,
        })

        setTimeout(() => {
          Taro.switchTab({
            url: '/pages/diy/index',
          })
        }, 2000)
      }
    } catch (err: any) {
      Taro.showToast({
        title: '加载设计失败',
        icon: 'none',
        duration: 2000,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // 加载状态
  if (loading || !currentOrder) {
    return <Loading />
  }

  const order = currentOrder

  return (
    <View className='order-detail-page'>
      <ScrollView className='page-content' scrollY>
        {/* 订单状态 */}
        <View className='section status-section'>
          <View
            className='status-badge'
            style={{ backgroundColor: ORDER_STATUS_COLOR[order.status] }}
          >
            <Text className='status-text'>{ORDER_STATUS_TEXT[order.status]}</Text>
          </View>
        </View>

        {/* 订单信息 */}
        <View className='section info-section'>
          <View className='section-title'>
            <Text>订单信息</Text>
          </View>
          <View className='info-row'>
            <Text className='info-label'>订单号</Text>
            <Text className='info-value'>{order.id}</Text>
          </View>
          <View className='info-row'>
            <Text className='info-label'>创建时间</Text>
            <Text className='info-value'>{formatTime(order.createdAt)}</Text>
          </View>
          {order.paidAt && (
            <View className='info-row'>
              <Text className='info-label'>支付时间</Text>
              <Text className='info-value'>{formatTime(order.paidAt)}</Text>
            </View>
          )}
          {order.shippedAt && (
            <View className='info-row'>
              <Text className='info-label'>发货时间</Text>
              <Text className='info-value'>{formatTime(order.shippedAt)}</Text>
            </View>
          )}
        </View>

        {/* 收货地址 */}
        <View className='section address-section'>
          <View className='section-title'>
            <Text>收货地址</Text>
          </View>
          <View className='address-content'>
            <View className='address-row'>
              <Text className='address-name'>{order.shippingAddress.name}</Text>
              <Text className='address-phone'>{order.shippingAddress.phone}</Text>
            </View>
            <Text className='address-detail'>
              {order.shippingAddress.province} {order.shippingAddress.city}{' '}
              {order.shippingAddress.district} {order.shippingAddress.detail}
            </Text>
          </View>
        </View>

        {/* 物流信息 */}
        {order.status === OrderStatus.SHIPPED && order.trackingNumber && (
          <View className='section logistics-section'>
            <View className='section-title'>
              <Text>物流信息</Text>
            </View>
            <View className='info-row'>
              <Text className='info-label'>物流单号</Text>
              <Text className='info-value'>{order.trackingNumber}</Text>
            </View>
          </View>
        )}

        {/* 手串设计 */}
        <View className='section items-section'>
          <View className='section-title'>
            <Text>手串设计</Text>
          </View>
          {order.items.map((item, index) => (
            <View key={`${order.id}-${index}`} className='design-item'>
              <View className='design-header'>
                <Text className='design-title'>设计 {index + 1}</Text>
              </View>
              
              {/* 珠子预览 */}
              <View className='design-beads'>
                {item.bracelet.beads.map((bead, beadIndex) => (
                  <Image
                    key={`${order.id}-${index}-${beadIndex}`}
                    className='bead-image'
                    src={bead.imageUrl}
                    mode='aspectFill'
                  />
                ))}
              </View>

              {/* 设计属性 */}
              <View className='design-properties'>
                <View className='property-row'>
                  <Text className='property-label'>珠子数量</Text>
                  <Text className='property-value'>
                    {item.properties.beadCount}颗
                  </Text>
                </View>
                <View className='property-row'>
                  <Text className='property-label'>价格</Text>
                  <Text className='property-value price'>
                    {formatPrice(item.properties.totalPrice)}
                  </Text>
                </View>
                <View className='property-row'>
                  <Text className='property-label'>重量</Text>
                  <Text className='property-value'>
                    {formatWeight(item.properties.totalWeight)}
                  </Text>
                </View>
                <View className='property-row'>
                  <Text className='property-label'>长度</Text>
                  <Text className='property-value'>
                    {formatLength(item.properties.totalLength)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* 价格汇总 */}
        <View className='section price-section'>
          <View className='price-row total'>
            <Text className='price-label'>订单总价</Text>
            <Text className='price-value'>{formatPrice(order.totalPrice)}</Text>
          </View>
        </View>

        {/* 错误提示 */}
        {error && (
          <View className='error-banner'>
            <Text className='error-text'>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* 底部操作按钮 */}
      <View className='page-footer'>
        {/* 待支付状态显示继续支付按钮 */}
        {order.status === OrderStatus.PENDING && (
          <Button
            className='action-btn primary'
            type='primary'
            onClick={handleContinuePayment}
            loading={paying}
            disabled={paying}
          >
            继续支付
          </Button>
        )}

        {/* 再次购买按钮 */}
        <Button
          className='action-btn'
          onClick={handleBuyAgain}
          loading={isProcessing}
          disabled={isProcessing}
        >
          再次购买
        </Button>
      </View>
    </View>
  )
}
