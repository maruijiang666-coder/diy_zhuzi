import { useState } from 'react'
import Taro from '@tarojs/taro'
import { orderService } from '../services/orderService'
import { useOrderStore } from '../stores/useOrderStore'
import { OrderStatus } from '../types/order'
import { logger } from '../utils/logger'

interface PaymentResult {
  success: boolean
  message: string
  cancelled?: boolean
}

/**
 * 微信支付Hook
 * 封装微信支付流程：获取支付参数、发起支付、处理支付结果
 */
export function useWechatPay() {
  const [paying, setPaying] = useState(false)
  const { updateOrderStatus } = useOrderStore()

  /**
   * 发起支付
   * @param orderId 订单ID
   * @returns 支付结果
   */
  const initiatePayment = async (orderId: string): Promise<PaymentResult> => {
    if (!orderId) {
      return {
        success: false,
        message: '订单ID不能为空',
      }
    }

    setPaying(true)

    try {
      // 1. 调用后端接口获取支付参数
      logger.info('获取支付参数', { orderId })
      const paymentParams = await orderService.initiatePayment(orderId)

      // 2. 调用微信支付
      logger.info('发起微信支付', { orderId })
      await Taro.requestPayment({
        timeStamp: paymentParams.timeStamp,
        nonceStr: paymentParams.nonceStr,
        package: paymentParams.package,
        signType: paymentParams.signType as any,
        paySign: paymentParams.paySign,
      })

      // 3. 支付成功
      logger.info('支付成功', { orderId })
      
      // 更新本地订单状态
      updateOrderStatus(orderId, OrderStatus.PAID)

      return {
        success: true,
        message: '支付成功',
      }
    } catch (error: any) {
      logger.error('支付失败', error)

      // 判断是用户取消还是支付失败
      if (error.errMsg && error.errMsg.includes('cancel')) {
        // 用户取消支付
        return {
          success: false,
          message: '支付已取消',
          cancelled: true,
        }
      }

      // 支付失败
      return {
        success: false,
        message: error.message || '支付失败，请重试',
      }
    } finally {
      setPaying(false)
    }
  }

  /**
   * 查询支付状态
   * @param orderId 订单ID
   * @returns 支付状态
   */
  const checkPaymentStatus = async (orderId: string): Promise<{
    status: 'pending' | 'paid' | 'failed'
    paidAt?: number
  }> => {
    try {
      const result = await orderService.checkPaymentStatus(orderId)
      
      // 如果支付成功，更新本地订单状态
      if (result.status === 'paid') {
        updateOrderStatus(orderId, OrderStatus.PAID)
      }
      
      return result
    } catch (error: any) {
      logger.error('查询支付状态失败', error)
      throw error
    }
  }

  return {
    paying,
    initiatePayment,
    checkPaymentStatus,
  }
}
