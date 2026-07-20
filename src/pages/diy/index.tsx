// src/pages/diy/index.tsx
import { View } from '@tarojs/components'
import { useState, useCallback } from 'react'
import Taro, { useRouter, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { useDiyStore } from '../../stores/useDiyStore'
import { useCartStore } from '../../stores/useCartStore'
import { useDesignStore } from '../../stores/useDesignStore'
import { usePlatePhysics } from '../../hooks/usePlatePhysics'
import PlateCanvas from '../../components/PlateCanvas'
import BeadSelector from '../../components/BeadSelector'
import NameInputModal from '../../components/NameInputModal'
import WristSizeModal from '../../components/WristSizeModal'
import { checkLoginAndPrompt } from '../../utils/authGuard'
import type { PhysicsBead } from '../../types/bead'
import './index.scss'

export default function DiyPage() {
  const router = useRouter()
  const shareImageUrl = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/crystallogo/%E9%81%A3%E5%B1%B1%E6%B0%B4%E6%99%B6logo.png'

  const {
    properties,
    wristSize,
    wearingStyle,
    setWristSize,
    setWearingStyle,
  } = useDiyStore()

  const { addToCart } = useCartStore()
  const { saveDesign } = useDesignStore()

  const {
    state,
    beadCount,
    canString,
    canvasRef,
    addBead,
    stringBracelet,
    disbandBracelet,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    getGameState,
  } = usePlatePhysics()

  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isSavingDesign, setIsSavingDesign] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [showWristModal, setShowWristModal] = useState(false)

  // 页面显示时检查手围
  Taro.useDidShow(() => {
    if (wristSize === null) {
      setShowWristModal(true)
    }
  })

  // 启用分享
  Taro.useDidShow(() => {
    Taro.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  })

  // 珠子点击
  const handleBeadTap = useCallback((bead: PhysicsBead) => {
    addBead(bead)
  }, [addBead])

  // 手围设置确认
  const handleWristSizeConfirm = useCallback((size: number, style: 'single' | 'double') => {
    setWristSize(size)
    setWearingStyle(style)
    setShowWristModal(false)
    Taro.showToast({ title: '设置成功', icon: 'success', duration: 1500 })
  }, [setWristSize, setWearingStyle])

  // 保存设计
  const handleSaveDesign = useCallback(async () => {
    const isLoggedIn = await checkLoginAndPrompt('保存设计')
    if (!isLoggedIn) return

    const gs = getGameState()
    const beads = gs.getState() === 'bracelet' ? gs.getBraceletBeads() : gs.plateBeads
    if (beads.length === 0) {
      Taro.showToast({ title: '请至少添加一个珠子', icon: 'none' })
      return
    }

    if (isSavingDesign) return
    setShowNameModal(true)
  }, [getGameState, isSavingDesign])

  const handleConfirmSave = useCallback(async (designName: string) => {
    setShowNameModal(false)
    setIsSavingDesign(true)

    try {
      Taro.showLoading({ title: '保存中...', mask: true })

      const gs = getGameState()
      const beads = gs.getState() === 'bracelet' ? gs.getBraceletBeads() : gs.plateBeads

      const braceletData = {
        beads: beads.map(b => ({
          id: b.id,
          name: b.name,
          category: b.category || '',
          imageUrl: b.image || '',
          price: b.price,
          weight: 0,
          diameter: b.radius * 2 / 3,
          stock: 999,
        })),
        name: designName,
        updatedAt: Date.now(),
      }

      await saveDesign(braceletData as any, designName, '')
      Taro.hideLoading()
      Taro.showToast({ title: '保存成功', icon: 'success' })
    } catch (error: any) {
      Taro.hideLoading()
      Taro.showToast({ title: error.message || '保存失败', icon: 'none' })
    } finally {
      setIsSavingDesign(false)
    }
  }, [getGameState, saveDesign])

  // 加入购物车
  const handleAddToCart = useCallback(async () => {
    const isLoggedIn = await checkLoginAndPrompt('加入购物车')
    if (!isLoggedIn) return

    const gs = getGameState()
    const beads = gs.getState() === 'bracelet' ? gs.getBraceletBeads() : gs.plateBeads
    if (beads.length === 0) {
      Taro.showToast({ title: '请至少添加一个珠子', icon: 'none' })
      return
    }

    if (isAddingToCart) return
    setIsAddingToCart(true)

    try {
      Taro.showLoading({ title: '加入购物车中...', mask: true })

      const now = new Date()
      const timeStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
      const braceletName = `用户${timeStr}`

      const braceletData = {
        beads: beads.map(b => ({
          id: b.id,
          name: b.name,
          category: b.category || '',
          imageUrl: b.image || '',
          price: b.price,
          weight: 0,
          diameter: b.radius * 2 / 3,
          stock: 999,
        })),
        name: braceletName,
        updatedAt: Date.now(),
      }

      const propertiesData = {
        beadCount: beads.length,
        totalPrice: beads.reduce((sum, b) => sum + b.price, 0),
        totalWeight: 0,
        totalLength: 0,
      }

      await addToCart(braceletData as any, propertiesData)
      Taro.hideLoading()
      Taro.showToast({ title: '加入购物车成功', icon: 'success' })

      setTimeout(() => {
        Taro.switchTab({ url: '/pages/cart/index' })
      }, 1500)
    } catch (error: any) {
      Taro.hideLoading()
      Taro.showModal({
        title: '加入购物车失败',
        content: error.message || '加入购物车失败，请重试',
        showCancel: true,
        confirmText: '去登录',
        cancelText: '取消',
      })
    } finally {
      setIsAddingToCart(false)
    }
  }, [getGameState, addToCart, isAddingToCart])

  // 分享
  useShareAppMessage(() => ({
    title: beadCount > 0
      ? `我设计了一个${beadCount}颗珠子的水晶手串！`
      : 'DIY水晶手串设计 - 定制你的专属饰品',
    path: '/pages/diy/index',
    imageUrl: shareImageUrl,
  }))

  useShareTimeline(() => ({
    title: beadCount > 0
      ? `我设计了一个${beadCount}颗珠子的水晶手串！`
      : 'DIY水晶手串设计 - 定制你的专属饰品',
    query: '',
    imageUrl: shareImageUrl,
  }))

  return (
    <View className="diy-page">
      {/* 盘子画布区域 - 上方 60% */}
      <View className="diy-page__canvas">
        <PlateCanvas
          canvasRef={canvasRef}
          state={state}
          canString={canString}
          onWristSizeClick={() => setShowWristModal(true)}
          onToolboxClick={() => {}}
          onSave={handleSaveDesign}
          onPurchase={handleAddToCart}
          onStringBracelet={stringBracelet}
          onDisband={disbandBracelet}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          disabled={beadCount === 0}
        />
      </View>

      {/* 珠子选择器 - 下方 40% */}
      <View className="diy-page__selector">
        <BeadSelector onBeadTap={handleBeadTap} />
      </View>

      {/* 命名对话框 */}
      <NameInputModal
        visible={showNameModal}
        defaultName={`手串设计${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`}
        onConfirm={handleConfirmSave}
        onCancel={() => setShowNameModal(false)}
      />

      {/* 手围设置弹窗 */}
      <WristSizeModal
        visible={showWristModal}
        initialSize={wristSize}
        initialStyle={wearingStyle}
        onConfirm={handleWristSizeConfirm}
        onClose={() => wristSize !== null && setShowWristModal(false)}
      />
    </View>
  )
}
