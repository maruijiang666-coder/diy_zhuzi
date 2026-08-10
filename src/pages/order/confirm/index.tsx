import { View, Text, Button, Input, ScrollView, Picker } from '@tarojs/components'
import { useEffect, useState, useMemo } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { useCartStore } from '../../../stores/useCartStore'
import { useOrderStore } from '../../../stores/useOrderStore'
import { Loading } from '../../../components/common'
import { formatPrice, formatWeight, formatLength } from '../../../utils/formatter'
import { Address } from '../../../types/order'
import './index.scss'

export default function OrderConfirmPage() {
  const { items, loadCartItems } = useCartStore()
  const { createOrder, loading, error } = useOrderStore()

  const router = useRouter()

  // 从 URL 读取选中的购物车项 ID（购物车勾选结算时传入；未传则结算全部）
  const selectedIds = useMemo(() => {
    const ids = router.params.ids
    if (!ids) return null
    return new Set(ids.split(',').filter(Boolean))
  }, [router.params.ids])

  // 有效的购物车项（防御：store 可能混入 undefined 残缺数据）
  const validItems = items.filter((item) => item && item.id && item.bracelet && item.properties)
  // 只结算选中的购物车项
  const checkoutItems = selectedIds
    ? validItems.filter((item) => selectedIds.has(item.id))
    : validItems
  const selectedTotal = checkoutItems.reduce((sum, item) => {
    const props = item.properties
    const price = props ? props.totalPrice : 0
    return sum + (parseFloat(String(price)) || 0)
  }, 0)

  const [address, setAddress] = useState<Address>({
    name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
  })

  // 输入框焦点状态管理
  const [focusedFields, setFocusedFields] = useState<Record<string, boolean>>({
    name: false,
    phone: false,
    province: false,
    city: false,
    district: false,
    detail: false,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // 页面显示时检查登录状态
  Taro.useDidShow(() => {
    // 检查登录状态
    const { authService } = require('../../../services/authService')
    const isLoggedIn = authService.isLoggedIn()
    
    if (!isLoggedIn) {
      console.log('订单确认页面需要登录')
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

  const handleFocus = (field: string) => {
    setFocusedFields((prev) => ({ ...prev, [field]: true }))
  }

  const handleBlur = (field: string) => {
    setFocusedFields((prev) => ({ ...prev, [field]: false }))
  }

  // 处理地区选择变化
  const handleRegionChange = (e: any) => {
    const region = e.detail.value
    console.log('地区选择结果:', region)
    
    // region 格式：["北京市", "北京市", "东城区"]
    if (region && region.length >= 3) {
      setAddress((prev) => ({
        ...prev,
        province: region[0] || '',
        city: region[1] || '',
        district: region[2] || '',
      }))
    }
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
    // 验证选中的购物车不为空
    if (checkoutItems.length === 0) {
      Taro.showToast({
        title: '请选择要结算的商品',
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
      // 创建订单（仅结算选中的购物车项）
      const cartItemIds = checkoutItems.map((item) => item.id)
      console.log('=== 订单确认页 - 开始创建订单 ===')
      console.log('购物车项ID:', cartItemIds)

      const totalPrice = selectedTotal
      console.log('订单总价:', totalPrice)
      
      // 检查Token
      const token = Taro.getStorageSync('Import_code')
      console.log('当前Token:', token ? token.substring(0, 10) + '...' : 'null')
      
      const orderId = await createOrder(cartItemIds, address, totalPrice)
      console.log('=== 订单确认页 - 创建订单完成 ===')
      console.log('获取到的orderId:', orderId)
      console.log('orderId类型:', typeof orderId)

      // 验证orderId不为空
      if (!orderId) {
        throw new Error('订单创建失败：未获取到订单ID')
      }
      
      console.log('orderId验证通过，准备跳转')

      // 创建成功，显示提示但不跳转
      Taro.showToast({
        title: '订单创建成功',
        icon: 'success',
        duration: 2000,
      })

      // 注意：跳转逻辑移到了支付成功回调中
      // 这里不再自动跳转，等待支付结果
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
                placeholderClass='input-placeholder'
                placeholder={focusedFields.name ? '' : '请输入收货人姓名'}
                value={address.name}
                onInput={(e) => handleAddressChange('name', e.detail.value)}
                onFocus={() => handleFocus('name')}
                onBlur={() => handleBlur('name')}
              />
            </View>
            <View className='form-item'>
              <Text className='form-label'>联系电话</Text>
              <Input
                className='form-input'
                placeholderClass='input-placeholder'
                type='number'
                placeholder={focusedFields.phone ? '' : '请输入手机号'}
                value={address.phone}
                maxlength={11}
                onInput={(e) => handleAddressChange('phone', e.detail.value)}
                onFocus={() => handleFocus('phone')}
                onBlur={() => handleBlur('phone')}
              />
            </View>
            <View className='form-item'>
              <Text className='form-label'>所在地区</Text>
              <Picker
                mode='region'
                value={[address.province, address.city, address.district]}
                onChange={handleRegionChange}
                className='region-picker'
              >
                <View className='region-picker-view'>
                  {address.province && address.city && address.district ? (
                    <Text className='region-text'>{address.province} {address.city} {address.district}</Text>
                  ) : (
                    <Text className='region-placeholder'>请选择省市区</Text>
                  )}
                </View>
              </Picker>
            </View>
            <View className='form-item'>
              <Text className='form-label'>详细地址</Text>
              <Input
                className='form-input'
                placeholderClass='input-placeholder'
                placeholder={focusedFields.detail ? '' : '请输入详细地址'}
                value={address.detail}
                onInput={(e) => handleAddressChange('detail', e.detail.value)}
                onFocus={() => handleFocus('detail')}
                onBlur={() => handleBlur('detail')}
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
            {checkoutItems.map((item) => (
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
            <Text className='price-value'>{formatPrice(selectedTotal)}</Text>
          </View>
          <View className='price-row total'>
            <Text className='price-label'>应付金额</Text>
            <Text className='price-value total-price'>
              {formatPrice(selectedTotal)}
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
          <Text className='footer-price'>{formatPrice(selectedTotal)}</Text>
        </View>
        <Button
          className='submit-btn'
          type='primary'
          onClick={handleSubmitOrder}
          loading={isSubmitting}
          disabled={isSubmitting || checkoutItems.length === 0}
        >
          提交订单
        </Button>
      </View>
    </View>
  )
}
