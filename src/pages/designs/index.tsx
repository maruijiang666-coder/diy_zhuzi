import { View, Text, Button } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { useDesignStore } from '../../stores/useDesignStore'
import { useDiyStore } from '../../stores/useDiyStore'
import { Loading, Empty } from '../../components/common'
import BraceletPreview from '../../components/BraceletPreview'
import { formatPrice } from '../../utils/formatter'
import type { SavedDesign } from '../../types/design'
import './index.scss'

export default function DesignsPage() {
  const { designs, loading, loadDesigns, deleteDesign } = useDesignStore()
  const { clearBracelet, addBead } = useDiyStore()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 页面显示时检查登录状态并刷新设计列表
  Taro.useDidShow(() => {
    // 检查登录状态
    const { authService } = require('../../services/authService')
    const isLoggedIn = authService.isLoggedIn()
    
    if (!isLoggedIn) {
      console.log('我的设计页面需要登录')
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
            Taro.switchTab({
              url: '/pages/profile/index'
            })
          }
        }
      })
      return
    }
    
    // 已登录，刷新设计列表
    loadDesigns()
  })

  // 页面加载时获取设计列表
  useEffect(() => {
    loadDesigns()
  }, [loadDesigns])

  // 加载设计到DIY页面
  const handleLoadDesign = async (design: SavedDesign) => {
    try {
      // 清空当前设计
      clearBracelet()

      // 加载设计的珠子
      design.bracelet.beads.forEach((bead) => {
        addBead(bead)
      })

      // 跳转到DIY页面
      await Taro.switchTab({
        url: '/pages/diy/index',
      })
    } catch (error: any) {
      Taro.showToast({
        title: '加载设计失败',
        icon: 'none',
        duration: 2000,
      })
    }
  }

  // 删除设计
  const handleDelete = async (designId: string) => {
    try {
      await Taro.showModal({
        title: '确认删除',
        content: '确定要删除这个设计吗？',
      })

      setDeletingId(designId)
      await deleteDesign(designId)

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
      setDeletingId(null)
    }
  }

  // 渲染设计项
  const renderDesignItem = (design: SavedDesign) => {
    const isDeleting = deletingId === design.id

    return (
      <View key={design.id} className='design-item'>
        <View className='design-item-content' onClick={() => handleLoadDesign(design)}>
          {/* 设计预览 - 使用通用预览组件 */}
          <View className='design-preview'>
            <BraceletPreview bracelet={design.bracelet} size={180} />
          </View>

          {/* 设计信息 */}
          <View className='design-info'>
            <Text className='design-name'>{design.name}</Text>
            <View className='design-details'>
              <Text className='detail-item'>{design.properties.beadCount}颗珠子</Text>
              <Text className='detail-item price'>{formatPrice(design.properties.totalPrice)}</Text>
            </View>
            <Text className='design-time'>
              {new Date(design.updatedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* 操作按钮 */}
        <View className='design-actions'>
          <Button
            className='delete-btn'
            size='mini'
            onClick={() => handleDelete(design.id)}
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
  if (loading && designs.length === 0) {
    return <Loading />
  }

  // 空状态
  if (!loading && designs.length === 0) {
    return (
      <View className='designs-page'>
        <Empty
          description='还没有保存的设计'
          actionText='去设计'
          onAction={() => {
            Taro.switchTab({ url: '/pages/diy/index' })
          }}
        />
      </View>
    )
  }

  // 正常显示设计列表
  return (
    <View className='designs-page'>
      <View className='designs-list'>
        {designs.map((design) => renderDesignItem(design))}
      </View>
    </View>
  )
}
