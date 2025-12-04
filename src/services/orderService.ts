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
   * @returns 订单ID和订单详情
   */
  async createOrder(
    cartItemIds: string[],
    shippingAddress: Address
  ): Promise<{ orderId: string; order: Order }> {
    // 验证购物车项不为空
    if (!cartItemIds || cartItemIds.length === 0) {
      throw new Error('购物车为空，无法创建订单')
    }

    // 验证收货地址
    this.validateAddress(shippingAddress)

    const request: CreateOrderRequest = {
      user: 'API用户(遣山水晶)', // 使用API用户标识
      cart_item_ids: cartItemIds,
      shipping_address: shippingAddress,
    }

    console.log('=== 创建订单 - 请求数据 ===')
    console.log('请求数据:', JSON.stringify(request, null, 2))

    return await orderApi.createOrder(request)
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
    if (!orderId || !orderId.trim()) {
      throw new Error('订单ID不能为空')
    }

    return await orderApi.getOrderById(orderId)
  }

  /**
   * 发起支付
   * @param orderId 订单ID
   * @returns 微信支付参数
   */
  async initiatePayment(orderId: string): Promise<WechatPayParams> {
    if (!orderId || !orderId.trim()) {
      throw new Error('订单ID不能为空')
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
    if (!orderId || !orderId.trim()) {
      throw new Error('订单ID不能为空')
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
