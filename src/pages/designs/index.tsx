import { View, Text, Button } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { useDesignStore } from '../../stores/useDesignStore'
import { useDiyStore } from '../../stores/useDiyStore'
import { Loading, Empty } from '../../components/common'
import BraceletPreview from '../../components/BraceletPreview'
import { formatPrice } from '../../utils/formatter'
import { authService } from '../../services/authService'
import type { SavedDesign } from '../../types/design'
import './index.scss'

export default function DesignsPage() {
  const { designs, loading, loadDesigns, deleteDesign } = useDesignStore()
  const { clearBracelet, addBead, setWristSize } = useDiyStore()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 页面显示时检查登录状态并刷新设计列表
  Taro.useDidShow(() => {
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
    
    loadDesigns()
  })

  // 页面加载时获取设计列表
  useEffect(() => {
    loadDesigns()
  }, [loadDesigns])

  // 加载设计到DIY页面
  const handleLoadDesign = async (design: SavedDesign) => {
    try {
      console.log('=== 加载设计 ===')
      console.log('设计珠子数量:', design.bracelet.beads.length)
      
      // 获取当前状态
      const currentState = useDiyStore.getState()
      
      // 确保手腕尺寸已设置，否则设置默认值
      if (currentState.wristSize === null) {
        console.log('未设置手腕尺寸，设置默认值 16cm')
        setWristSize(16)
      }
      
      // 清空当前设计
      clearBracelet()

      // 加载设计的珠子
      let addedCount = 0
      design.bracelet.beads.forEach((bead) => {
        const canAdd = useDiyStore.getState().canAddBead(bead)
        console.log(`添加珠子 ${addedCount + 1}: canAdd=${canAdd}, diameter=${bead.diameter}`)
        addBead(bead)
        addedCount = useDiyStore.getState().bracelet.beads.length
      })
      
      console.log('最终添加的珠子数量:', useDiyStore.getState().bracelet.beads.length)

      // 跳转到DIY页面
      await Taro.navigateTo({
        url: '/pages/diy/index',
      })
    } catch (error: any) {
      console.error('加载设计出错:', error)
      Taro.showToast({
        title: '加载设计失败: ' + (error.message || '未知错误'),
        icon: 'none',
        duration: 2000,
      })
    }
  }

  // 删除设计
  const handleDelete = async (designId: string) => {
    try {
      const result = await Taro.showModal({
        title: '确认删除',
        content: '确定要删除这个设计吗？',
      })

      // 用户点击取消，不执行删除操作
      if (!result.confirm) {
        return
      }

      setDeletingId(designId)
      await deleteDesign(designId)

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
