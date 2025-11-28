import { View, Text, Button, Input, ScrollView } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { useCartStore } from '../../../stores/useCartStore'
import { useOrderStore } from '../../../stores/useOrderStore'
import { Loading } from '../../../components/common'
import { formatPrice, formatWeight, formatLength } from '../../../utils/formatter'
import { Address } from '../../../types/order'
import './index.scss'

export default function OrderConfirmPage() {
  const { items, loadCartItems, getTotalPrice } = useCartStore()
  const { createOrder, loading, error } = useOrderStore()

  const [address, setAddress] = useState<Address>({
    name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // 页面加载时获取购物车数据
  useEffect(() => {
    loadCartItems()
  }, [])

  // 处理地址字段变化
  const handleAddressChange = (field: keyof Address, value: string) => {
    setAddress((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // 验证地址是否完整
  const validateAddress = (): boolean => {
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
        return false
      }
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(address.phone)) {
      return false
    }

    return true
  }

  // 处理提交订单
  const handleSubmitOrder = async () => {
    // 验证购物车不为空
    if (items.length === 0) {
      Taro.showToast({
        title: '购物车为空',
        icon: 'none',
        duration: 2000,
      })
      return
    }

    // 验证地址
    if (!validateAddress()) {
      Taro.showToast({
        title: '请填写完整的收货地址',
        icon: 'none',
        duration: 2000,
      })
      return
    }

    setIsSubmitting(true)

    try {
      // 创建订单
      const cartItemIds = items.map((item) => item.id)
      const orderId = await createOrder(cartItemIds, address)

      // 创建成功，跳转到订单详情页面
      Taro.showToast({
        title: '订单创建成功',
        icon: 'success',
        duration: 2000,
      })

      // 跳转到订单详情页面
      setTimeout(() => {
        Taro.redirectTo({
          url: `/pages/order/detail/index?orderId=${orderId}`,
        })
      }, 2000)
    } catch (err: any) {
      Taro.showToast({
        title: err.message || '创建订单失败',
        icon: 'none',
        duration: 2000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 加载状态
  if (loading && items.length === 0) {
    return <Loading />
  }

  return (
    <View className='order-confirm-page'>
      <ScrollView className='page-content' scrollY>
        {/* 收货地址区域 */}
        <View className='section address-section'>
          <View className='section-title'>
            <Text>收货地址</Text>
          </View>
          <View className='address-form'>
            <View className='form-item'>
              <Text className='form-label'>收货人</Text>
              <Input
                className='form-input'
                placeholder='请输入收货人姓名'
                value={address.name}
                onInput={(e) => handleAddressChange('name', e.detail.value)}
              />
            </View>
            <View className='form-item'>
              <Text className='form-label'>联系电话</Text>
              <Input
                className='form-input'
                type='number'
                placeholder='请输入手机号'
                value={address.phone}
                maxlength={11}
                onInput={(e) => handleAddressChange('phone', e.detail.value)}
              />
            </View>
            <View className='form-item'>
              <Text className='form-label'>省份</Text>
              <Input
                className='form-input'
                placeholder='请输入省份'
                value={address.province}
                onInput={(e) => handleAddressChange('province', e.detail.value)}
              />
            </View>
            <View className='form-item'>
              <Text className='form-label'>城市</Text>
              <Input
                className='form-input'
                placeholder='请输入城市'
                value={address.city}
                onInput={(e) => handleAddressChange('city', e.detail.value)}
              />
            </View>
            <View className='form-item'>
              <Text className='form-label'>区县</Text>
              <Input
                className='form-input'
                placeholder='请输入区县'
                value={address.district}
                onInput={(e) => handleAddressChange('district', e.detail.value)}
              />
            </View>
            <View className='form-item'>
              <Text className='form-label'>详细地址</Text>
              <Input
                className='form-input'
                placeholder='请输入详细地址'
                value={address.detail}
                onInput={(e) => handleAddressChange('detail', e.detail.value)}
              />
            </View>
          </View>
        </View>

        {/* 订单详情区域 */}
        <View className='section order-section'>
          <View className='section-title'>
            <Text>订单详情</Text>
          </View>
          <View className='order-items'>
            {items.map((item) => (
              <View key={item.id} className='order-item'>
                <View className='item-info'>
                  <Text className='item-label'>手串设计</Text>
                  <Text className='item-value'>{item.properties.beadCount}颗珠子</Text>
                </View>
                <View className='item-info'>
                  <Text className='item-label'>价格</Text>
                  <Text className='item-value price'>
                    {formatPrice(item.properties.totalPrice)}
                  </Text>
                </View>
                <View className='item-info'>
                  <Text className='item-label'>重量</Text>
                  <Text className='item-value'>
                    {formatWeight(item.properties.totalWeight)}
                  </Text>
                </View>
                <View className='item-info'>
                  <Text className='item-label'>长度</Text>
                  <Text className='item-value'>
                    {formatLength(item.properties.totalLength)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 价格汇总 */}
        <View className='section price-section'>
          <View className='price-row'>
            <Text className='price-label'>商品总价</Text>
            <Text className='price-value'>{formatPrice(getTotalPrice())}</Text>
          </View>
          <View className='price-row total'>
            <Text className='price-label'>应付金额</Text>
            <Text className='price-value total-price'>
              {formatPrice(getTotalPrice())}
            </Text>
          </View>
        </View>

        {/* 错误提示 */}
        {error && (
          <View className='error-banner'>
            <Text className='error-text'>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* 底部提交按钮 */}
      <View className='page-footer'>
        <View className='footer-info'>
          <Text className='footer-label'>合计：</Text>
          <Text className='footer-price'>{formatPrice(getTotalPrice())}</Text>
        </View>
        <Button
          className='submit-btn'
          type='primary'
          onClick={handleSubmitOrder}
          loading={isSubmitting}
          disabled={isSubmitting || items.length === 0}
        >
          提交订单
        </Button>
      </View>
    </View>
  )
}
