import { View, Text, Button, ScrollView, Image } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { useOrderStore } from '../../../stores/useOrderStore'
import { useDiyStore } from '../../../stores/useDiyStore'
import { Loading } from '../../../components/common'
import { formatPrice, formatWeight, formatLength } from '../../../utils/formatter'
import { OrderStatus } from '../../../types/order'
import { orderApi, authApi } from '../../../api/endpoints'
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

  // 页面显示时检查登录状态
  Taro.useDidShow(() => {
    // 检查登录状态
    const { authService } = require('../../../services/authService')
    const isLoggedIn = authService.isLoggedIn()
    
    if (!isLoggedIn) {
      console.log('订单详情页面需要登录')
      Taro.showModal({
        title: '需要登录',
        content: '访问此页面需要先登录，是否前往登录？',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            Taro.switchTab({
              url: '/pages/profile/index'
            })
          } else {
            Taro.navigateBack().catch(() => {
              Taro.switchTab({
                url: '/pages/profile/index'
              })
            })
          }
        }
      })
    }
  })

  // 添加orderId空值检查
  if (!orderId || orderId === 'undefined') {
    Taro.showToast({
      title: '订单ID无效',
      icon: 'error',
      duration: 2000,
    })
    setTimeout(() => {
      Taro.navigateBack()
    }, 2000)
    return null
  }

  const { currentOrder, loading, error, loadOrderDetail } = useOrderStore()
  const { clearBracelet, addBead } = useDiyStore()

  const [isProcessing, setIsProcessing] = useState(false)

  // 页面加载时获取订单详情
  useEffect(() => {
    if (orderId) {
      console.log(`[OrderDetail] 开始加载订单详情，订单ID: ${orderId}`)
      // 检查Token
      const token = Taro.getStorageSync('Import_code')
      console.log(`[OrderDetail] 当前Token: ${token ? token.substring(0, 10) + '...' : 'null'}`)
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

    setIsProcessing(true)

    try {
      // 获取用户真实微信 openid（登录时从 user.openid 保存到 user_openid，不能把 login_token 当 openid 传）
      let openid = Taro.getStorageSync('user_openid')
      if (!openid) {
        // 兜底：旧会话未存 openid 时，从 /auth/users/me/ 拉取并缓存
        try {
          const me = await authApi.getUserInfo()
          openid = me && (me as any).openid
          if (openid) Taro.setStorageSync('user_openid', openid)
        } catch (e) {
          console.warn('获取用户信息失败，无法取得 openid:', e)
        }
      }
      if (!openid) {
        Taro.showToast({
          title: '用户未登录',
          icon: 'none',
          duration: 2000,
        })
        return
      }

      // 生成6位唯一订单ID
      const generateOrderId = () => {
        const timestamp = Date.now().toString(36).slice(-4)
        const random = Math.random().toString(36).slice(-2)
        return (timestamp + random).toUpperCase().slice(0, 6)
      }
      const externalOrderId = generateOrderId()

      // 创建外部支付订单
      const externalPaymentRequest = {
        openid: openid,
        amount: currentOrder.totalPrice,
        description: `水晶手串订单 - ${currentOrder.id}`,
        orderId: externalOrderId
      }

      console.log('🌐 === 继续支付 - 外部支付请求 ===')
      console.log('📦 请求体:', JSON.stringify(externalPaymentRequest, null, 2))

      // 调用外部支付接口创建支付订单
      const externalPaymentResponse = await orderApi.createExternalPayment(externalPaymentRequest, 10000)

      console.log('✅ 外部支付订单创建成功！')
      console.log('📋 外部订单ID:', externalOrderId)
      console.log('📊 支付响应:', JSON.stringify(externalPaymentResponse, null, 2))

      // 检查支付响应
      if (externalPaymentResponse.code === 'SUCCESS' && externalPaymentResponse.data) {
        console.log('🎯 微信支付参数获取成功！')
        
        // 调起微信支付
        wx.requestPayment({
          timeStamp: externalPaymentResponse.data.timeStamp,
          nonceStr: externalPaymentResponse.data.nonceStr,
          package: externalPaymentResponse.data.package,
          signType: 'RSA',
          paySign: externalPaymentResponse.data.paySign,
          success: function (_res: any) {
            console.log('🎉 支付成功:', _res)
            
            // 支付成功后查询外部支付接口状态
            wx.request({
              url: `https://crystalpay.quant-speed.com/api/payment/query/${externalOrderId}`,
              method: 'GET',
              success: function(queryRes: any) {
                console.log('📋 支付查询结果:', queryRes.data)
                
                if (queryRes.data && queryRes.data.code === 'SUCCESS' && 
                    queryRes.data.data && queryRes.data.data.trade_state === 'SUCCESS') {         
                  // 更新订单状态
                  updateOrderStatusAfterPayment(currentOrder.id)
                } else {
                  Taro.showToast({
                    title: '支付处理中，请稍后查看订单状态',
                    icon: 'none',
                    duration: 2000,
                  })
                  // 即使查询失败也尝试更新订单状态
                  updateOrderStatusAfterPayment(currentOrder.id)
                }
              },
              fail: function(_queryErr: any) {
                console.error('查询支付状态失败:', _queryErr)
                // 查询失败但支付成功，也更新订单状态
                updateOrderStatusAfterPayment(currentOrder.id)
              }
            })
          },
          fail: function (_res: any) {
            console.error('💸 支付失败:', _res)
            Taro.showToast({
              title: '支付失败',
              icon: 'none',
              duration: 2000,
            })
          }
        })
      } else {
        console.error('⚠️ 外部支付接口返回非成功状态:', externalPaymentResponse.code)
        Taro.showToast({
          title: externalPaymentResponse.message || '支付创建失败',
          icon: 'none',
          duration: 2000,
        })
      }
    } catch (err: any) {
      console.error('❌ 继续支付失败:', err)
      Taro.showToast({
        title: err.message || '支付失败',
        icon: 'none',
        duration: 2000,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // 支付成功后更新订单状态
  const updateOrderStatusAfterPayment = (orderId: string) => {
    console.log('🔄 正在更新订单状态...')
    

    // 更新数据库订单状态
    wx.request({
      url: `http://localhost:8011/api/diy/orders/${orderId}/`,
      method: 'PATCH',
      header: {
        'accept': 'application/json',
        'X-Login-Token': Taro.getStorageSync('Import_code'),
        'Content-Type': 'application/json',
        'X-CSRFTOKEN': 'WyAhBHRewvQOg4IYB4AosFpNEpfUYmtPLDJHpFbaQWTWh8Skt562hm8MNJ5h701y'
      },
      data: {
        status: 'paid'
      },
      success: function(updateRes: any) {
        console.log('✅ 订单状态更新成功:', updateRes.data)
        
        Taro.showToast({
          title: '支付成功',
          icon: 'success',
          duration: 2000,
        })
        // 重新加载订单详情
        setTimeout(() => {
          loadOrderDetail(orderId)
        }, 2000)
      },
      fail: function(updateErr: any) {
        console.error('❌ 订单状态更新失败:', updateErr)
        // 即使更新失败也显示支付成功
        Taro.showToast({
          title: '支付成功',
          icon: 'success',
          duration: 2000,
        })
        setTimeout(() => {
          loadOrderDetail(orderId)
        }, 2000)
      }
    })
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
          {order.status === OrderStatus.PAID && (
            <View className='info-row'>
              <Text className='info-label'>物流状态</Text>
              <Text className='info-value'>商家备货中...</Text>
            </View>
          )}
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
              <Text className='address-name'>{order.shippingAddress && order.shippingAddress.name ? order.shippingAddress.name : '未知'}</Text>
              <Text className='address-phone'>{order.shippingAddress && order.shippingAddress.phone ? order.shippingAddress.phone : ''}</Text>
            </View>
            <Text className='address-detail'>
              {order.shippingAddress && order.shippingAddress.province ? order.shippingAddress.province : ''} {order.shippingAddress && order.shippingAddress.city ? order.shippingAddress.city : ''}{' '}
              {order.shippingAddress && order.shippingAddress.district ? order.shippingAddress.district : ''} {order.shippingAddress && order.shippingAddress.detail ? order.shippingAddress.detail : ''}
            </Text>
          </View>
        </View>

        {/* 物流信息 */}
        {(order.status === OrderStatus.SHIPPED || order.status === OrderStatus.COMPLETED) && order.trackingNumber && (
          <View className='section logistics-section'>
            <View className='section-title'>
              <Text>物流信息</Text>
            </View>
            <View className='info-row'>
              <Text className='info-label'>物流单号</Text>
              <Text className='info-value'>{order.trackingNumber}</Text>
            </View>

            <View className='info-row'>
              <Text className='info-label'>物流公司</Text>
              <Text className='info-value'>{order.logisticsCompany}</Text>
            </View>

            <View className='info-row'>
              <Text className='info-label'>物流详细</Text>
              <Text className='info-value'>{order.logisticsInfo}</Text>
            </View>

            {order.shippingImgs && Object.keys(order.shippingImgs).length > 0 && (
              <View className='info-row shipping-imgs-row'>
                <Text className='info-label'>物流图片</Text>
                <View className='shipping-imgs'>
                  {Object.values(order.shippingImgs).map((imgUrl, idx) => (
                    <Image
                      key={idx}
                      className='shipping-img'
                      src={imgUrl as string}
                      mode='aspectFill'
                      onClick={() => {
                        Taro.previewImage({
                          urls: Object.values(order.shippingImgs) as string[],
                          current: imgUrl as string,
                        })
                      }}
                    />
                  ))}
                </View>
              </View>
            )}

          </View>
        )}

        {/* 手串设计 */}
        <View className='section items-section'>
          <View className='section-title'>
            <Text>手串设计</Text>
          </View>
          {order.items && order.items.map((item, index) => (
            <View key={`${order.id}-${index}`} className='design-item'>
              <View className='design-header'>
                <Text className='design-title'>设计 {index + 1}</Text>
              </View>
              
              {/* 珠子预览 */}
              <View className='design-beads'>
                {item.bracelet && item.bracelet.beads && item.bracelet.beads.map((bead, beadIndex) => (
                  <Image
                    key={`${order.id}-${index}-${beadIndex}`}
                    className='bead-image'
                    src={bead.imageUrl || ''}
                    mode='aspectFill'
                  />
                ))}
              </View>

              {/* 设计属性 */}
              <View className='design-properties'>
                <View className='property-row'>
                  <Text className='property-label'>珠子数量</Text>
                  <Text className='property-value'>
                    {item.properties && item.properties.beadCount ? item.properties.beadCount : 0}颗
                  </Text>
                </View>
                <View className='property-row'>
                  <Text className='property-label'>价格</Text>
                  <Text className='property-value price'>
                    {formatPrice(item.properties && item.properties.totalPrice ? item.properties.totalPrice : 0)}
                  </Text>
                </View>
                <View className='property-row'>
                  <Text className='property-label'>重量</Text>
                  <Text className='property-value'>
                    {formatWeight(item.properties && item.properties.totalWeight ? item.properties.totalWeight : 0)}
                  </Text>
                </View>
                <View className='property-row'>
                  <Text className='property-label'>长度</Text>
                  <Text className='property-value'>
                    {formatLength(item.properties && item.properties.totalLength ? item.properties.totalLength : 0)}
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
            loading={isProcessing}
            disabled={isProcessing}
          >
            继续支付
          </Button>
        )}

        {/* 再次购买按钮 */}
        {/* <Button
          className='action-btn'
          onClick={handleBuyAgain}
          loading={isProcessing}
          disabled={isProcessing}
        >
          再次购买
        </Button> */}
      </View>
    </View>
  )
}
