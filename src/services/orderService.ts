import {
  orderApi,
  authApi,
  CreateOrderRequest,
  GetOrdersParams,
  ExternalPaymentCreateRequest,
  ExternalPaymentCreateResponse
} from '../api/endpoints'
import { Order, Address, OrderStatus } from '../types/order'
import { WechatPayParams } from '../types/api'
import Taro from '@tarojs/taro'

/**
 * 订单服务
 * 封装订单相关的业务逻辑和API调用
 */
class OrderService {
  private recentlyPaidOrderIds = new Set<string>()

  /**
   * 标记订单为本地已支付
   * 用于解决支付成功后后端状态更新延迟的问题
   */
  markOrderAsPaidLocal(orderId: string) {
    this.recentlyPaidOrderIds.add(orderId)
  }

  /**
   * 检查订单是否在本地标记为已支付
   */
  isOrderPaidLocal(orderId: string) {
    return this.recentlyPaidOrderIds.has(orderId)
  }

  /**
   * 创建订单
   * @param cartItemIds 购物车项ID数组
   * @param shippingAddress 收货地址
   * @param totalPrice 订单总价
   * @returns 订单ID和订单详情
   */
  async createOrder(
    cartItemIds: string[],
    shippingAddress: Address,
    totalPrice: number
  ): Promise<{ orderId: string; order: Order }> {
    // 验证购物车项不为空
    if (!cartItemIds || cartItemIds.length === 0) {
      throw new Error('购物车为空，无法创建订单')
    }

    // 验证收货地址
    this.validateAddress(shippingAddress)

    // 构建请求数据，按照后端接口要求
    const request: CreateOrderRequest = {
      total_price: totalPrice.toString(), // 转换为字符串格式
      cart_item_ids: cartItemIds,
      status: 'pending', // 固定为pending状态
      shipping_address: shippingAddress,
    }

    console.log('=== 创建订单 - 请求数据 ===')
    console.log('请求数据:', JSON.stringify(request, null, 2))

    // 1. 首先创建订单到主系统
    const response = await orderApi.createOrder(request)

    console.log('=== 创建订单 - 响应数据 ===')
    console.log('完整响应:', JSON.stringify(response, null, 2))

    // 检查响应数据结构 - 处理嵌套的data结构
    let orderResult: { orderId: string; order: Order }

    if (response && response.data && response.data.orderId) {
      console.log('返回data中的数据:', JSON.stringify(response.data, null, 2))
      orderResult = response.data
    } else if (response && response.orderId) {
      console.log('直接返回orderId数据:', JSON.stringify(response, null, 2))
      orderResult = response
    } else {
      throw new Error('创建订单响应数据格式错误：缺少orderId字段')
    }

    // 2. 同时创建外部支付订单（可选，失败不影响主订单）
    try {
      console.log('=== 创建外部支付订单 ===')
      console.log('订单ID:', orderResult.orderId)
      console.log('订单总价:', totalPrice)

      // 获取用户真实微信 openid（外部支付需要，登录时已从 user.openid 保存到 user_openid；
      // 不能把 login_token(auth_token/Import_code) 当 openid 传给支付服务，会被判"无效的openid"）
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
        console.warn('未找到用户openid，跳过外部支付订单创建')
        throw new Error('用户未登录')
      }

      // 生成6位唯一订单ID（使用时间戳+随机数）
      const generateOrderId = () => {
        const timestamp = Date.now().toString(36).slice(-4)
        const random = Math.random().toString(36).slice(-2)
        return (timestamp + random).toUpperCase().slice(0, 6)
      }
      const externalOrderId = generateOrderId()

      const externalPaymentRequest: ExternalPaymentCreateRequest = {
        openid: openid,
        amount: totalPrice,
        description: `水晶手串订单 - ${orderResult.orderId}`,
        orderId: externalOrderId
      }

      console.log('🌐 === 外部支付请求详情 ===')
      console.log('📡 请求URL:', 'https://therianclouds.mynatapp.cc/api/payment/create')
      console.log('🔧 请求方法:', 'POST')
      console.log('📋 请求头:', JSON.stringify({
        'Content-Type': 'application/json',
        'X-CSRFTOKEN': '***',
        'X-Login-Token': '***'
      }, null, 2))
      console.log('📦 请求体:', JSON.stringify(externalPaymentRequest, null, 2))
      console.log('🔍 请求参数说明:')
      console.log('  ├─ openid: 用户真实微信openid，长度:', externalPaymentRequest.openid.length)
      console.log('  ├─ amount: 订单总价，值为:', externalPaymentRequest.amount)
      console.log('  ├─ description: 商品描述，值为:', externalPaymentRequest.description)
      console.log('  └─ orderId: 6位唯一订单ID，值为:', externalPaymentRequest.orderId)
      console.log('⏱️  超时设置: 10000ms (10秒)')

      // 调用外部支付接口，设置10秒超时避免阻塞主流程（从5秒增加到10秒）
      console.log('🚀 正在调用外部支付接口...')
      console.log('⏰ 注意：超时时间已调整为10000ms (10秒)，如需调整请修改orderService.ts')
      const externalPaymentResponse = await orderApi.createExternalPayment(externalPaymentRequest, 10000)

      console.log('✅ 外部支付订单创建成功！')
      console.log('📋 外部订单ID:', externalOrderId)
      console.log('📊 支付响应原始数据:', JSON.stringify(externalPaymentResponse, null, 2))

      // 🔥 适配实际返回的微信支付参数格式
      if (externalPaymentResponse.code === 'SUCCESS') {
        console.log('🎯 微信支付参数获取成功！')
        console.log('� 支付响应详细信息:')
        console.log('  ├─ code:', externalPaymentResponse.code)
        console.log('  ├─ message:', externalPaymentResponse.message)
        console.log('  └─ data:', JSON.stringify(externalPaymentResponse.data, null, 2))

        if (externalPaymentResponse.data) {
          console.log('💰 微信支付参数详情:')
          console.log('  ├─ 外部订单号:', externalPaymentResponse.data.outTradeNo || '无')
          console.log('  ├─ 预支付ID:', externalPaymentResponse.data.package || '无')
          console.log('  ├─ 随机字符串:', externalPaymentResponse.data.nonceStr || '无')
          console.log('  ├─ 时间戳:', externalPaymentResponse.data.timeStamp || '无')
          console.log('  ├─ 签名类型:', externalPaymentResponse.data.signType || '无')
          console.log('  └─ 支付签名:', externalPaymentResponse.data.paySign ? '已生成' : '无')

          // 🚀 保存微信支付参数，用于后续调起支付
          const wechatPayParams = {
            outTradeNo: externalPaymentResponse.data.outTradeNo,
            nonceStr: externalPaymentResponse.data.nonceStr,
            package: externalPaymentResponse.data.package,
            paySign: externalPaymentResponse.data.paySign,
            timeStamp: externalPaymentResponse.data.timeStamp,
            signType: externalPaymentResponse.data.signType
          }

          console.log('📱 微信支付参数已保存，可直接调起微信支付！-*-*-**--*-*-')
          console.log('🔧 支付参数:', JSON.stringify(wechatPayParams, null, 2))

          // 保存 this 引用
          const self = this

          // 使用微信原生写法调起微信支付
          wx.requestPayment({
            timeStamp: wechatPayParams.timeStamp,
            nonceStr: wechatPayParams.nonceStr,
            package: wechatPayParams.package,
            signType: 'RSA',
            paySign: wechatPayParams.paySign,
            // 原本的
            //   success: function (res) {
            //   console.log('🎉 支付成功:', res)
            //   // 支付成功，跳转到订单详情页
            //   Taro.showToast({
            //     title: '支付成功',
            //     icon: 'success',
            //     duration: 2000,
            //   })
            //   setTimeout(() => {
            //     Taro.redirectTo({
            //       url: `/pages/order/detail/index?orderId=${orderId}`,
            //     })
            //   }, 2000)
            // },
            success: function (res) {
              console.log('🎉 支付成功:', res)
              
              // 立即标记本地状态为已支付
              self.markOrderAsPaidLocal(orderResult.orderId)
              
              // 支付成功后查询外部支付接口状态
              wx.request({
                url: `https://crystalpay.quant-speed.com/api/payment/query/${externalOrderId}`,
                method: 'GET',
                success: function(queryRes) {
                  console.log('📋 支付查询结果:', queryRes.data)
                  
                  if (queryRes.data && queryRes.data.code === 'SUCCESS' && 
                      queryRes.data.data && queryRes.data.data.trade_state === 'SUCCESS') {         
                    Taro.showToast({
                      title: '支付成功',
                      icon: 'success',
                      duration: 2000,
                    })    
                  } else {
                    Taro.showToast({
                      title: '支付处理中，请稍后查看订单状态',
                      icon: 'none',
                      duration: 2000,
                    })
                  }
                  
                  // 支付成功后先更新数据库订单状态
                  console.log('🔄 正在更新订单状态...')
                  wx.request({
                    url: `http://localhost:8011/api/diy/orders/${orderResult.orderId}/`,
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
                    success: function(updateRes) {
                      console.log('✅ 订单状态更新成功:', updateRes.data)
                      
                      Taro.showToast({
                        title: '支付成功',
                        icon: 'success',
                        duration: 2000,
                      })
                      
                      // 跳转到订单详情页
                      setTimeout(() => {
                        Taro.redirectTo({
                          url: `/pages/order/detail/index?orderId=${orderResult.orderId}`,
                        })
                      }, 2000)
                    },
                    fail: function(updateErr) {
                      console.error('❌ 订单状态更新失败:', updateErr)
                      // 即使更新失败也跳转到订单详情页（支付已成功，但状态更新失败）
                      setTimeout(() => {
                        Taro.redirectTo({
                          url: `/pages/order/detail/index?orderId=${orderResult.orderId}`,
                        })
                      }, 2000)
                    }
                  })
                },
                fail: function(queryErr) {
                  console.error('查询支付状态失败:', queryErr)
                  // 查询失败也显示支付成功并跳转
                  Taro.showToast({
                    title: '支付成功',
                    icon: 'success',
                    duration: 2000,
                  })
                  // 查询失败时也更新订单状态
                  console.log('🔄 正在更新订单状态...')
                  wx.request({
                    url: `http://localhost:8011/api/diy/orders/${orderResult.orderId}/`,
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
                    success: function(updateRes) {
                      console.log('✅ 订单状态更新成功:', updateRes.data)
                      
                      Taro.showToast({
                        title: '支付成功',
                        icon: 'success',
                        duration: 2000,
                      })
                      
                      // 跳转到订单详情页
                      setTimeout(() => {
                        Taro.redirectTo({
                          url: `/pages/order/detail/index?orderId=${orderResult.orderId}`,
                        })
                      }, 2000)
                    },
                    fail: function(updateErr) {
                      console.error('❌ 订单状态更新失败:', updateErr)
                      // 查询失败但支付成功，跳转到订单详情页
                      setTimeout(() => {
                        Taro.redirectTo({
                          url: `/pages/order/detail/index?orderId=${orderResult.orderId}`,
                        })
                      }, 2000)
                    }
                  })
                }
              })
            },



            fail: function (res) {
              console.error('💸 支付失败:', res)
              Taro.showToast({
                title: '支付失败',
                icon: 'none',
                duration: 2000,
              })
              // 支付失败，不跳转，用户可以继续支付或返回
              console.log('支付失败，用户可以继续支付或返回订单列表')
            }
          })




        }
      } else {
        console.warn('⚠️ 外部支付接口返回非成功状态:', externalPaymentResponse.code)
      }

      // 🎯 保存微信支付参数到订单数据中，用于后续支付流程
      if (orderResult.order && externalPaymentResponse.code === 'SUCCESS' && externalPaymentResponse.data) {
        orderResult.order.externalPaymentInfo = {
          externalOrderId: externalPaymentResponse.data.outTradeNo || externalOrderId,
          status: 'created',
          response: {
            wechatPayParams: {
              outTradeNo: externalPaymentResponse.data.outTradeNo,
              nonceStr: externalPaymentResponse.data.nonceStr,
              package: externalPaymentResponse.data.package,
              paySign: externalPaymentResponse.data.paySign,
              timeStamp: externalPaymentResponse.data.timeStamp,
              signType: externalPaymentResponse.data.signType
            },
            originalResponse: externalPaymentResponse
          }
        }
        console.log('💾 微信支付参数已保存到订单数据中！')
      }

    } catch (externalError) {
      console.error('❌ === 创建外部支付订单失败 ===')
      console.error('📛 错误信息:', externalError)
      console.error('🔍 错误详情:')
      console.error('  ├─ 错误类型:', externalError.constructor.name)
      console.error('  ├─ 错误消息:', externalError.message)
      console.error('  ├─ 错误堆栈:', externalError.stack)

      // 如果是网络错误，提供更多信息
      if (externalError.message && externalError.message.includes('超时')) {
        console.error('⏰ 超时错误分析:')
        console.error('  ├─ 请求URL: https://therianclouds.mynatapp.cc/api/payment/create')
        console.error('  ├─ 超时时间: 10000ms (10秒)')
        console.error('  ├─ 建议: 检查网络连接或增加超时时间')
        console.error('  ├─ 域名配置: 确保已配置request合法域名')
        console.error('  └─ 微信小程序: 在开发者工具中勾选"不校验合法域名"')
      }

      if (externalError.response) {
        console.error('📡 响应信息:')
        console.error('  ├─ 响应状态:', externalError.response.status)
        console.error('  ├─ 响应数据:', JSON.stringify(externalError.response.data, null, 2))
        console.error('  └─ 响应头:', externalError.response.headers)
      }

      // 检查是否有更详细的错误信息
      if (externalError.code) {
        console.error('🔢 错误代码:', externalError.code)
      }
      if (externalError.errMsg) {
        console.error('📢 错误消息详情:', externalError.errMsg)
      }

      console.log('⚠️ === 主订单创建仍然成功，继续流程 ===')

      // 记录失败信息但不影响主流程
      if (orderResult.order) {
        orderResult.order.externalPaymentInfo = {
          externalOrderId: 'failed',
          status: 'failed',
          error: externalError.message || '外部支付订单创建失败'
        }
      }
    }

    return orderResult
  }

  /**
   * 取消订单
   * @param order 订单对象
   */
  async cancelOrder(order: Order): Promise<void> {
    if (!order || !order.id) {
      throw new Error('订单无效')
    }

    console.log(`=== 取消订单 - 订单ID: ${order.id} ===`)
    
    // 构建请求数据
    // 必须包含 total_price, status, shipping_address
    const requestData = {
      total_price: order.totalPrice.toString(),
      status: 'cancelled',
      shipping_address: order.shippingAddress
    }
    
    console.log('取消订单请求数据:', JSON.stringify(requestData, null, 2))
    
    await orderApi.updateOrder(order.id, requestData)
    console.log(`=== 取消订单成功 ===`)
  }

  /**
   * 获取订单列表
   * @param status 订单状态筛选（可选）
   * @param page 页码，默认1
   * @param pageSize 每页数量，默认20
   * @returns 订单列表和总数
   */
  async getOrders(
    status?: OrderStatus,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ orders: Order[]; total: number }> {
    const params: GetOrdersParams = {
      page,
      pageSize,
    }

    if (status) {
      params.status = status
    }

    console.log(`[orderService] 获取订单列表 - 参数:`, JSON.stringify(params, null, 2))
    const result = await orderApi.getOrders(params)
    console.log(`[orderService] 获取订单列表完成 - 订单数量: ${result.orders.length}, 总数: ${result.total}`)
    return result
  }

  /**
   * 获取订单详情
   * @param orderId 订单ID
   * @returns 订单详情
   */
  async getOrderById(orderId: string): Promise<Order> {
    if (!orderId || !orderId.trim() || orderId === 'undefined') {
      throw new Error('订单ID无效')
    }

    console.log(`=== 获取订单详情 - 订单ID: ${orderId} ===`)
    const order = await orderApi.getOrderById(orderId)
    console.log(`=== 获取订单详情完成 - 订单数据:`, JSON.stringify(order, null, 2))
    return order
  }

  /**
   * 发起支付
   * @param orderId 订单ID
   * @returns 微信支付参数
   */
  async initiatePayment(orderId: string): Promise<WechatPayParams> {
    if (!orderId || !orderId.trim() || orderId === 'undefined') {
      throw new Error('订单ID无效')
    }

    const response = await orderApi.initiatePayment(orderId)
    return response.paymentParams
  }

  /**
   * 查询支付状态
   * @param orderId 订单ID
   * @returns 支付状态信息
   */
  async checkPaymentStatus(orderId: string): Promise<{
    status: 'pending' | 'paid' | 'failed'
    paidAt?: number
  }> {
    if (!orderId || !orderId.trim() || orderId === 'undefined') {
      throw new Error('订单ID无效')
    }

    return await orderApi.checkPaymentStatus(orderId)
  }

  /**
   * 验证收货地址
   * @param address 收货地址
   */
  private validateAddress(address: Address): void {
    if (!address) {
      throw new Error('收货地址不能为空')
    }

    const requiredFields: Array<keyof Address> = [
      'name',
      'phone',
      'province',
      'city',
      'district',
      'detail',
    ]

    for (const field of requiredFields) {
      if (!address[field] || !address[field].trim()) {
        const fieldNames: Record<keyof Address, string> = {
          name: '收货人姓名',
          phone: '联系电话',
          province: '省份',
          city: '城市',
          district: '区县',
          detail: '详细地址',
        }
        throw new Error(`${fieldNames[field]}不能为空`)
      }
    }

    // 验证手机号格式（简单验证）
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(address.phone)) {
      throw new Error('手机号格式不正确')
    }
  }

  /**
   * 按状态筛选订单
   * 便捷方法
   * @param status 订单状态
   * @param page 页码
   * @param pageSize 每页数量
   */
  async getOrdersByStatus(
    status: OrderStatus,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ orders: Order[]; total: number }> {
    return await this.getOrders(status, page, pageSize)
  }

  /**
   * 获取待支付订单
   * @param page 页码
   * @param pageSize 每页数量
   */
  async getPendingOrders(
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ orders: Order[]; total: number }> {
    return await this.getOrdersByStatus(OrderStatus.PENDING, page, pageSize)
  }

  /**
   * 获取已支付订单
   * @param page 页码
   * @param pageSize 每页数量
   */
  async getPaidOrders(
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ orders: Order[]; total: number }> {
    return await this.getOrdersByStatus(OrderStatus.PAID, page, pageSize)
  }
}

// 导出单例
export const orderService = new OrderService()
