import { View, Text, Button, ScrollView } from '@tarojs/components'
import { useEffect, useState, useRef, useMemo } from 'react'
import Taro from '@tarojs/taro'
import { useCartStore } from '../../stores/useCartStore'
import { useDiyStore } from '../../stores/useDiyStore'
import { Loading, Empty, ErrorBoundary } from '../../components/common'
import BraceletPreview from '../../components/BraceletPreview'
import { formatPrice, formatWeight, formatLength } from '../../utils/formatter'
import { authService } from '../../services/authService'
import { CartItem } from '../../types/common'
import './index.scss'

export default function CartPage() {
  const {
    items,
    loading,
    error,
    loadCartItems,
    removeFromCart,
  } = useCartStore()

  const { clearBracelet, addBead } = useDiyStore()
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  // 勾选结算：选中的购物车项 ID 集合
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectionInitRef = useRef(false)

  // 有效的购物车项（防御：addToCart 等历史路径可能混入 undefined/残缺数据，必须先过滤再处理）
  const validItems = useMemo(
    () => items.filter((item) => item && item.id && item.bracelet && item.properties),
    [items]
  )

  // 同步勾选状态：首次加载默认全选；之后只剔除已不存在的项，保留用户手动取消勾选
  useEffect(() => {
    if (validItems.length === 0) return
    if (!selectionInitRef.current) {
      selectionInitRef.current = true
      setSelectedIds(new Set(validItems.map((i) => i.id)))
    } else {
      setSelectedIds((prev) => {
        const valid = new Set(validItems.map((i) => i.id))
        const next = new Set<string>()
        prev.forEach((id) => { if (valid.has(id)) next.add(id) })
        return next
      })
    }
  }, [validItems])

  // 选中的购物车项及合计
  const selectedItems = useMemo(
    () => validItems.filter((item) => selectedIds.has(item.id)),
    [validItems, selectedIds]
  )
  const selectedTotal = selectedItems.reduce((sum, item) => {
    const props = item.properties
    const price = props ? props.totalPrice : 0
    return sum + (parseFloat(String(price)) || 0)
  }, 0)
  const allSelected = validItems.length > 0 && validItems.every((item) => selectedIds.has(item.id))

  // 切换单个勾选
  const toggleSelect = (itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  // 切换全选
  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(validItems.map((i) => i.id)))
  }

  // 页面显示时检查登录状态并刷新购物车数据
  Taro.useDidShow(() => {
    console.log('=== 购物车页面 - useDidShow ===')
    
    const isLoggedIn = authService.isLoggedIn()
    
    if (!isLoggedIn) {
      console.log('用户未登录，购物车为空')
      return
    }
    
    console.log('=== 购物车页面 - 刷新数据 ===')
    loadCartItems()
  })

  // 下拉刷新
  Taro.usePullDownRefresh(async () => {
    console.log('=== 触发下拉刷新 ===')
    try {
      await loadCartItems()
    } finally {
      Taro.stopPullDownRefresh()
    }
  })

  // 页面加载时获取购物车数据，页面初次加载时使用。
  useEffect(() => {
    console.log('=== 购物车页面 - useEffect 加载数据 ===')
    loadCartItems()
  }, [loadCartItems])

  // 监听数据变化
  useEffect(() => {
    console.log('=== 购物车数据更新 ===')
    console.log('items:', items)
    console.log('items长度:', items.length)
    console.log('items类型:', typeof items)
    console.log('loading:', loading)
    console.log('error:', error)
    
    // 检查 items 数组中的每个元素
    if (items && Array.isArray(items)) {
      items.forEach((item, index) => {
        console.log(`购物车项 ${index}:`, item)
        if (!item || !item.id || !item.bracelet || !item.properties) {
          console.warn(`购物车项 ${index} 数据不完整`)
        }
      })
    }
  }, [items, loading, error])

  // 处理删除购物车项
  const handleDelete = async (itemId: string) => {
    try {
      const result = await Taro.showModal({
        title: '确认删除',
        content: '确定要删除这个设计吗？',
      })

      // 检查用户是否点击了取消
      if (!result.confirm) {
        return
      }

      setDeletingItemId(itemId)
      await removeFromCart(itemId)

      // 同步从选中集合中移除
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })

      Taro.showToast({
        title: '删除成功',
        icon: 'success',
        duration: 2000,
      })
    } catch (err: any) {
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
      
      // 加载购物车项的珠子到设计画布
      item.bracelet.beads.forEach((bead) => {
        addBead(bead)
      })
      
      // 跳转到DIY页面（tabBar页面使用switchTab）
      await Taro.switchTab({
        url: '/pages/diy/index',
      })
    } catch (err: any) {
      Taro.showToast({
        title: '加载设计失败',
        icon: 'none',
        duration: 2000,
      })
    }
  }

  // 处理去结算：只结算选中的购物车项，把 ID 通过 URL 传给确认页
  const handleCheckout = async () => {
    const checkoutIds = selectedItems.map((item) => item.id)
    if (checkoutIds.length === 0) {
      Taro.showToast({
        title: '请先选择要结算的商品',
        icon: 'none',
        duration: 2000,
      })
      return
    }

    try {
      await Taro.navigateTo({
        url: `/pages/order/confirm/index?ids=${checkoutIds.join(',')}`,
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
    // 防御性编程：检查 item 是否存在且结构完整
    if (!item || !item.id || !item.bracelet || !item.properties) {
      console.warn('购物车项数据不完整:', item)
      return null
    }

    const { bracelet, properties } = item
    const isDeleting = deletingItemId === item.id
    const isSelected = selectedIds.has(item.id)

    return (
      <View key={item.id} className='cart-item'>
        {/* 勾选结算 */}
        <View className='cart-item-main'>
          <View
            className={`cart-item-check ${isSelected ? 'cart-item-check--active' : ''}`}
            onClick={() => toggleSelect(item.id)}
          >
            {isSelected && <Text className='cart-item-check-mark'>✓</Text>}
          </View>
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
        <Empty description='购物车是空的'>
          <Button
            type='primary'
            size='default'
            onClick={() => {
              Taro.switchTab({ url: '/pages/diy/index' })
            }}
          >
            去设计手串
          </Button>
        </Empty>
      </View>
    )
  }

  // 正常显示购物车列表
  return (
    <ErrorBoundary>
    <View className='cart-page'>
      {/* 错误提示 */}
      {error && (
        <View className='error-banner'>
          <Text className='error-text'>{error}</Text>
        </View>
      )}

      {/* 全选栏 */}
      <View className='cart-select-all'>
        <View
          className={`cart-select-all-check ${allSelected ? 'cart-select-all-check--active' : ''}`}
          onClick={toggleSelectAll}
        >
          {allSelected && <Text className='cart-item-check-mark'>✓</Text>}
        </View>
        <Text className='cart-select-all-text'>全选</Text>
        <Text className='cart-select-all-count'>已选 {selectedItems.length}/{validItems.length} 件</Text>
      </View>

      {/* 购物车列表 */}
      <ScrollView className='cart-list' scrollY>
        {validItems.map((item) => renderCartItem(item))}
      </ScrollView>

      {/* 底部结算栏 */}
      <View className='cart-footer'>
        <View className='footer-info'>
          <View className='total-info'>
            <Text className='total-label'>已选{selectedItems.length}件 共{validItems.length}件</Text>
            <Text className='total-price'>合计：{formatPrice(selectedTotal)}</Text>
          </View>
        </View>
        <Button
          className='checkout-btn'
          type='primary'
          onClick={handleCheckout}
          disabled={selectedItems.length === 0}
        >
          去结算
        </Button>
      </View>
    </View>
    </ErrorBoundary>
  )
}
