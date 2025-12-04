import Taro from '@tarojs/taro'
import { Order, OrderStatus } from '../types/order'

/**
 * Mock订单服务
 * 用于开发测试，提供模拟订单数据
 */
class MockOrderService {
  private storageKey = 'mock_orders'

  // 模拟订单数据
  private mockOrders: Order[] = [
    {
      id: 'order-001',
      orderNumber: 'CD20241201001',
      status: OrderStatus.PENDING,
      totalAmount: 158.00,
      items: [
        {
          id: 'item-001',
          bracelet: {
            id: 'bracelet-001',
            name: '紫水晶手串',
            beads: [
              {
                id: 'bead-001',
                name: '紫水晶',
                category: 'amethyst',
                imageUrl: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/SJSY/crystal_test.png',
                price: 15.00,
                weight: 2.5,
                diameter: 8,
                stock: 100,
                description: '天然紫水晶，色泽纯正'
              }
            ],
            totalPrice: 150.00,
            totalWeight: 25.0,
            totalLength: 80,
            beadCount: 10
          },
          quantity: 1,
          unitPrice: 150.00,
          subtotal: 150.00
        }
      ],
      shippingAddress: {
        name: '张三',
        phone: '13800138000',
        province: '广东省',
        city: '深圳市',
        district: '南山区',
        detail: '科技园南区001号'
      },
      createdAt: Date.now() - 24 * 60 * 60 * 1000, // 1天前
      updatedAt: Date.now() - 24 * 60 * 60 * 1000
    },
    {
      id: 'order-002',
      orderNumber: 'CD20241201002',
      status: OrderStatus.PAID,
      totalAmount: 286.00,
      items: [
        {
          id: 'item-002',
          bracelet: {
            id: 'bracelet-002',
            name: '粉晶手串',
            beads: [
              {
                id: 'bead-002',
                name: '粉晶',
                category: 'rose-quartz',
                imageUrl: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/SJSY/crystal_test.png',
                price: 12.00,
                weight: 2.3,
                diameter: 8,
                stock: 150,
                description: '粉色水晶，象征爱情'
              }
            ],
            totalPrice: 120.00,
            totalWeight: 23.0,
            totalLength: 80,
            beadCount: 10
          },
          quantity: 2,
          unitPrice: 120.00,
          subtotal: 240.00
        },
        {
          id: 'item-003',
          bracelet: {
            id: 'bracelet-003',
            name: '黑曜石手串',
            beads: [
              {
                id: 'bead-003',
                name: '黑曜石',
                category: 'obsidian',
                imageUrl: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/SJSY/crystal_test.png',
                price: 10.00,
                weight: 3.0,
                diameter: 10,
                stock: 200,
                description: '天然黑曜石，辟邪护身'
              }
            ],
            totalPrice: 46.00,
            totalWeight: 12.0,
            totalLength: 40,
            beadCount: 4
          },
          quantity: 1,
          unitPrice: 46.00,
          subtotal: 46.00
        }
      ],
      shippingAddress: {
        name: '李四',
        phone: '13900139000',
        province: '北京市',
        city: '朝阳区',
        district: '三里屯街道',
        detail: '三里屯路19号'
      },
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2天前
      updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1天前更新
      paidAt: Date.now() - 1 * 24 * 60 * 60 * 1000 // 1天前支付
    },
    {
      id: 'order-003',
      orderNumber: 'CD20241201003',
      status: OrderStatus.SHIPPED,
      totalAmount: 98.00,
      items: [
        {
          id: 'item-004',
          bracelet: {
            id: 'bracelet-004',
            name: '白水晶手串',
            beads: [
              {
                id: 'bead-004',
                name: '白水晶',
                category: 'clear-quartz',
                imageUrl: 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/assets/SJSY/crystal_test.png',
                price: 8.00,
                weight: 2.0,
                diameter: 6,
                stock: 180,
                description: '透明水晶，纯净无瑕'
              }
            ],
            totalPrice: 64.00,
            totalWeight: 16.0,
            totalLength: 60,
            beadCount: 8
          },
          quantity: 1,
          unitPrice: 64.00,
          subtotal: 64.00
        }
      ],
      shippingAddress: {
        name: '王五',
        phone: '13700137000',
        province: '上海市',
        city: '浦东新区',
        district: '陆家嘴街道',
        detail: '世纪大道1号'
      },
      createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3天前
      updatedAt: Date.now() - 12 * 60 * 60 * 1000, // 12小时前更新
      paidAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2天前支付
      shippedAt: Date.now() - 12 * 60 * 60 * 1000 // 12小时前发货
    }
  ]

  /**
   * 获取订单列表
   */
  async getOrders(
    status?: OrderStatus,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ orders: Order[]; total: number }> {
    await this.delay(300)

    let filteredOrders = [...this.mockOrders]

    // 状态筛选
    if (status) {
      filteredOrders = filteredOrders.filter((order) => order.status === status)
    }

    // 分页
    const total = filteredOrders.length
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const pagedOrders = filteredOrders.slice(start, end)

    return {
      orders: pagedOrders,
      total,
    }
  }

  /**
   * 获取订单详情
   */
  async getOrderById(orderId: string): Promise<Order> {
    await this.delay(200)

    const order = this.mockOrders.find((o) => o.id === orderId)
    if (!order) {
      throw new Error('订单不存在')
    }

    return { ...order }
  }

  /**
   * 创建订单
   */
  async createOrder(cartItemIds: string[], shippingAddress: any): Promise<{ orderId: string; order: Order }> {
    await this.delay(500)

    // 模拟创建订单
    const orderId = `order-${Date.now()}`
    const orderNumber = `CD${Date.now().toString().slice(-8)}`
    
    const newOrder: Order = {
      id: orderId,
      orderNumber,
      status: OrderStatus.PENDING,
      totalAmount: Math.random() * 200 + 50, // 随机价格 50-250
      items: [], // 简化处理
      shippingAddress,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.mockOrders.unshift(newOrder)
    this.saveLocalOrders()

    return { orderId, order: newOrder }
  }

  /**
   * 从本地存储获取订单数据
   */
  private getLocalOrders(): Order[] {
    try {
      const data = Taro.getStorageSync(this.storageKey)
      return data ? JSON.parse(data) : [...this.mockOrders]
    } catch (error) {
      console.error('读取订单数据失败:', error)
      return [...this.mockOrders]
    }
  }

  /**
   * 保存订单数据到本地存储
   */
  private saveLocalOrders(): void {
    try {
      Taro.setStorageSync(this.storageKey, JSON.stringify(this.mockOrders))
    } catch (error) {
      console.error('保存订单数据失败:', error)
    }
  }

  /**
   * 模拟网络延迟
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export const mockOrderService = new MockOrderService()