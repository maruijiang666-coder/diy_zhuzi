import { orderApi, CreateOrderRequest, GetOrdersParams } from '../api/endpoints'
import { Order, Address, OrderStatus } from '../types/order'
import { WechatPayParams } from '../types/api'

/**
 * 订单服务
 * 封装订单相关的业务逻辑和API调用
 */
class OrderService {
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

    const response = await orderApi.createOrder(request)
    
    console.log('=== 创建订单 - 响应数据 ===')
    console.log('完整响应:', JSON.stringify(response, null, 2))
    
    // 检查响应数据结构 - 处理嵌套的data结构
    if (response && response.data && response.data.orderId) {
      console.log('返回data中的数据:', JSON.stringify(response.data, null, 2))
      return response.data
    }
    
    // 如果直接返回的是data数据（兼容格式）
    if (response && response.orderId) {
      console.log('直接返回orderId数据:', JSON.stringify(response, null, 2))
      return response
    }
    
    throw new Error('创建订单响应数据格式错误：缺少orderId字段')
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

    return await orderApi.getOrders(params)
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
