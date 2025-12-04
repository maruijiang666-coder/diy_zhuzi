import { View, Text, Button, ScrollView } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { useCartStore } from '../../stores/useCartStore'
import { useDiyStore } from '../../stores/useDiyStore'
import { Loading, Empty } from '../../components/common'
import BraceletPreview from '../../components/BraceletPreview'
import { formatPrice, formatWeight, formatLength } from '../../utils/formatter'
import { CartItem } from '../../types/common'
import './index.scss'

export default function CartPage() {
  const {
    items,
    loading,
    error,
    loadCartItems,
    removeFromCart,
    getTotalPrice,
    getItemCount,
  } = useCartStore()

  const { clearBracelet } = useDiyStore()
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)

  // 页面加载时获取购物车数据，页面初次加载时使用。
  useEffect(() => {
    console.log('=== 购物车页面 - useEffect 加载数据 ===')
    loadCartItems()
  }, [loadCartItems])

  // 页面显示时刷新购物车数据，从其他页面返回时刷新。
  Taro.useDidShow(() => {
    console.log('=== 购物车页面 - useDidShow 刷新数据 ===')
    loadCartItems()
  })

  // 监听数据变化
  useEffect(() => {
    console.log('=== 购物车数据更新 ===')
    console.log('items:', items)
    console.log('loading:', loading)
    console.log('error:', error)
  }, [items, loading, error])

  // 处理删除购物车项
  const handleDelete = async (itemId: string) => {
    try {
      await Taro.showModal({
        title: '确认删除',
        content: '确定要删除这个设计吗？',
      })

      setDeletingItemId(itemId)
      await removeFromCart(itemId)
      
      Taro.showToast({
        title: '删除成功',
        icon: 'success',
        duration: 2000,
      })
    } catch (err: any) {
      // 用户取消删除
      if (err.errMsg && err.errMsg.includes('cancel')) {
        return
      }
      
      Taro.showToast({
        title: err.message || '删除失败',
        icon: 'none',
        duration: 2000,
      })
    } finally {
      setDeletingItemId(null)
    }
  }

  // 处理点击购物车项，加载到DIY页面编辑
  const handleEditItem = async (item: CartItem) => {
    try {
      // 清空当前设计
      clearBracelet()
      
      // 跳转到DIY页面，携带购物车项ID
      await Taro.navigateTo({
        url: `/pages/diy/index?cartItemId=${item.id}`,
      })
    } catch (err: any) {
      Taro.showToast({
        title: '加载设计失败',
        icon: 'none',
        duration: 2000,
      })
    }
  }

  // 处理去结算
  const handleCheckout = async () => {
    if (items.length === 0) {
      Taro.showToast({
        title: '购物车为空',
        icon: 'none',
        duration: 2000,
      })
      return
    }

    try {
      await Taro.navigateTo({
        url: '/pages/order/confirm/index',
      })
    } catch (err: any) {
      Taro.showToast({
        title: '跳转失败',
        icon: 'none',
        duration: 2000,
      })
    }
  }

  // 渲染购物车项
  const renderCartItem = (item: CartItem) => {
    const { bracelet, properties } = item
    const isDeleting = deletingItemId === item.id

    return (
      <View key={item.id} className='cart-item'>
        <View className='cart-item-content' onClick={() => handleEditItem(item)}>
          {/* 预览图 - 使用通用预览组件 */}
          <View className='cart-item-preview'>
            <BraceletPreview bracelet={bracelet} size={180} />
          </View>

          {/* 信息区域 */}
          <View className='cart-item-info'>
            <View className='info-row'>
              <Text className='info-label'>珠子数量：</Text>
              <Text className='info-value'>{properties.beadCount}颗</Text>
            </View>
            <View className='info-row'>
              <Text className='info-label'>价格：</Text>
              <Text className='info-value price'>{formatPrice(properties.totalPrice)}</Text>
            </View>
            <View className='info-row'>
              <Text className='info-label'>重量：</Text>
              <Text className='info-value'>{formatWeight(properties.totalWeight)}</Text>
            </View>
            <View className='info-row'>
              <Text className='info-label'>长度：</Text>
              <Text className='info-value'>{formatLength(properties.totalLength)}</Text>
            </View>
          </View>
        </View>

        {/* 删除按钮 */}
        <View className='cart-item-actions'>
          <Button
            className='delete-btn'
            size='mini'
            type='warn'
            onClick={() => handleDelete(item.id)}
            loading={isDeleting}
            disabled={isDeleting}
          >
            删除
          </Button>
        </View>
      </View>
    )
  }

  // 加载状态
  if (loading && items.length === 0) {
    return <Loading />
  }

  // 空状态
  if (!loading && items.length === 0) {
    return (
      <View className='cart-page'>
        <Empty
          description='购物车是空的'
          actionText='去设计手串'
          onAction={() => {
            Taro.switchTab({ url: '/pages/diy/index' })
          }}
        />
      </View>
    )
  }

  // 正常显示购物车列表
  return (
    <View className='cart-page'>
      {/* 错误提示 */}
      {error && (
        <View className='error-banner'>
          <Text className='error-text'>{error}</Text>
        </View>
      )}

      {/* 购物车列表 */}
      <ScrollView className='cart-list' scrollY>
        {items.map((item) => renderCartItem(item))}
      </ScrollView>

      {/* 底部结算栏 */}
      <View className='cart-footer'>
        <View className='footer-info'>
          <View className='total-info'>
            <Text className='total-label'>共{getItemCount()}件</Text>
            <Text className='total-price'>合计：{formatPrice(getTotalPrice())}</Text>
          </View>
        </View>
        <Button
          className='checkout-btn'
          type='primary'
          onClick={handleCheckout}
          disabled={items.length === 0}
        >
          去结算
        </Button>
      </View>
    </View>
  )
}
