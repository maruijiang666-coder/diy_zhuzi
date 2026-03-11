import { View, Button } from '@tarojs/components'
import { useState, useEffect, useRef } from 'react'
import Taro, { useRouter, useShareAppMessage, useShareTimeline, useReachBottom } from '@tarojs/taro'
import { useDiyStore } from '../../stores/useDiyStore'
import { useCartStore } from '../../stores/useCartStore'
import { useDesignStore } from '../../stores/useDesignStore'
import BeadSelector, { BeadSelectorRef } from '../../components/BeadSelector'
import DesignCanvas from '../../components/DesignCanvas'
import PropertyPanel from '../../components/PropertyPanel'
import NameInputModal from '../../components/NameInputModal'
import WristSizeModal from '../../components/WristSizeModal'
import { validateBracelet } from '../../utils/validator'
import { MAX_BEADS } from '../../constants/limits'
import type { Bead } from '../../types/bead'
import { testMockData } from '../../utils/testMockData'
import { checkLoginAndPrompt } from '../../utils/authGuard'
import './index.scss'

export default function DiyPage() {
  const router = useRouter()
  const beadSelectorRef = useRef<BeadSelectorRef>(null)
  const shareImageUrl = 'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/crystallogo/%E9%81%A3%E5%B1%B1%E6%B0%B4%E6%99%B6logo.png'
  
  const {
    bracelet,
    selectedBeadIndex,
    addBead,
    selectBead,
    removeBead,
    moveBead,
    clearBracelet,
    properties,
    canAddBead,
    wristSize,
    wearingStyle,
    setWristSize,
    setWearingStyle,
  } = useDiyStore()

  const { addToCart, items } = useCartStore()
  const { saveDesign } = useDesignStore()

  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isSavingDesign, setIsSavingDesign] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [showWristModal, setShowWristModal] = useState(false)
  const [previousBeadCount, setPreviousBeadCount] = useState(0)

  // 页面触底加载更多
  useReachBottom(() => {
    if (beadSelectorRef.current) {
      beadSelectorRef.current.loadMore()
    }
  })

  // 页面显示时
  Taro.useDidShow(() => {
    // 检查手腕尺寸是否设置
    if (wristSize === null) {
      setShowWristModal(true)
    }
  })

  // 页面加载时检查是否需要加载购物车项
  useEffect(() => {
    const { cartItemId } = router.params
    
    if (cartItemId) {
      loadCartItemToDesign(cartItemId)
    }
    
    // 启用分享功能
    Taro.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    
    // 测试Mock数据（已禁用，使用真实API）
    // console.log('DIY页面已加载，开始测试Mock数据...')
    // testMockData().then((success) => {
    //   if (success) {
    //     console.log('Mock数据测试成功！')
    //   } else {
    //     console.error('Mock数据测试失败！')
    //   }
    // })
  }, [router.params.cartItemId])

  // 页面显示时检测是否有新加载的设计
  Taro.useDidShow(() => {
    // 如果珠子数量增加了，说明从其他页面加载了设计
    if (bracelet.beads.length > 0 && bracelet.beads.length !== previousBeadCount) {
      Taro.showToast({
        title: '设计已加载',
        icon: 'success',
        duration: 2000,
      })
    }
    // 更新珠子数量记录
    setPreviousBeadCount(bracelet.beads.length)
  })

  // 从购物车加载设计到DIY页面
  const loadCartItemToDesign = async (cartItemId: string) => {
    try {
      // 显示加载提示
      Taro.showLoading({
        title: '加载设计中...',
        mask: true,
      })
      // 查找购物车项
      const cartItem = items.find((item) => item.id === cartItemId)
      
      if (!cartItem) {
        Taro.showToast({
          title: '未找到该设计',
          icon: 'none',
          duration: 2000,
        })
        return
      }

      // 清空当前设计
      clearBracelet()

      // 加载购物车项的珠子到设计画布
      cartItem.bracelet.beads.forEach((bead) => {
        addBead(bead)
      })

      // 隐藏加载提示
      Taro.hideLoading()

      Taro.showToast({
        title: '设计已加载',
        icon: 'success',
        duration: 2000,
      })
    } catch (error: any) {
      // 隐藏加载提示
      Taro.hideLoading()
      
      Taro.showToast({
        title: error.message || '加载设计失败',
        icon: 'none',
        duration: 2000,
      })
    }
  }

  // 手串属性已经实时保存在 store 中，直接使用
  // const properties = getProperties() // 不再需要调用函数

  // 处理珠子选中
  const handleBeadSelect = (index: number) => {
    selectBead(index)
  }

  // 处理珠子删除
  const handleBeadDelete = (index: number) => {
    removeBead(index)
  }

  // 处理珠子移动
  const handleBeadMove = (fromIndex: number, toIndex: number) => {
    moveBead(fromIndex, toIndex)
  }

  // 处理珠子点击添加
  const handleBeadClick = (bead: Bead) => {
    // 检查是否可以继续添加珠子
    if (!canAddBead(bead)) {
      Taro.showToast({
        title: '超出最大周长限制，无法继续添加',
        icon: 'none',
        duration: 2000,
      })
      return
    }

    // 添加珠子到手串
    addBead(bead)

    // 显示添加成功提示
    Taro.showToast({
      title: '添加成功',
      icon: 'success',
      duration: 1000,
    })
  }

  // 处理加入购物车
  const handleAddToCart = async () => {
    // 检查登录状态
    const isLoggedIn = await checkLoginAndPrompt('加入购物车')
    if (!isLoggedIn) {
      return // 用户未登录或取消登录，不执行后续操作
    }

    // 验证手串是否有效
    const validation = validateBracelet(bracelet)
    if (!validation.valid) {
      Taro.showToast({
        title: validation.message || '请至少添加一个珠子',
        icon: 'none',
        duration: 2000,
      })
      return
    }

    // 防止重复提交
    if (isAddingToCart) {
      return
    }

    setIsAddingToCart(true)

    try {
      // 显示加载提示
      Taro.showLoading({
        title: '加入购物车中...',
        mask: true,
      })

      // 生成手串名称：用户名 + 当前时间（格式：202512031914）
      const now = new Date()
      const timeStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
      const braceletName = `用户${timeStr}` // 例如：用户202512031914
      
      // 准备手串数据（添加名称）
      const braceletWithName = {
        ...bracelet,
        name: braceletName,
      }
      
      // 准备属性数据
      const propertiesData = {
        beadCount: properties.beadCount,
        totalPrice: properties.totalPrice,
        totalWeight: properties.totalWeight,
        totalLength: properties.totalLength
      }
      
      console.log("添加到购物车 - 手串名称:", braceletName)
      console.log("添加到购物车 - 属性数据:", JSON.stringify(propertiesData))
      
      // 调用购物车服务添加到购物车（传递手串和属性）
      await addToCart(braceletWithName, propertiesData)

      // 隐藏加载提示
      Taro.hideLoading()

      // 显示成功提示
      Taro.showToast({
        title: '加入购物车成功',
        icon: 'success',
        duration: 1500,
      })

      // 延迟跳转到购物车页面
      setTimeout(() => {
        Taro.switchTab({
          url: '/pages/cart/index',
        })
      }, 1500)
    } catch (error: any) {
      // 隐藏加载提示
      Taro.hideLoading()

      // 显示错误提示
      const errorMessage = error.message || '加入购物车失败，请重试'
      // 0.0.3改动
      // const errorMessage =  '未登录，请跳转登录'
      Taro.showModal({
        title: '加入购物车失败',
        content: errorMessage,
        showCancel: true,
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 用户选择重试
            handleAddToCart()
            // 0.0.3改动，跳转去登录页面
            // Taro.navigateTo({
            //   url: '/pages/login/index',
            // })                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
          }
        },
      })
    } finally {
      setIsAddingToCart(false)
    }
  }

  // 处理保存设计
  const handleSaveDesign = async () => {
    // 检查登录状态
    const isLoggedIn = await checkLoginAndPrompt('保存设计')
    if (!isLoggedIn) {
      return // 用户未登录或取消登录，不执行后续操作
    }

    // 验证手串是否有效
    const validation = validateBracelet(bracelet)
    
    if (!validation.valid) {
      Taro.showToast({
        title: validation.message || '请至少添加一个珠子',
        icon: 'none',
        duration: 2000,
      })
      return
    }

    // 防止重复提交
    if (isSavingDesign) {
      return
    }

    // 显示命名对话框
    setShowNameModal(true)
  }

  // 确认保存设计
  // 子组件传递来的水晶设计的名称
  const handleConfirmSave = async (designName: string) => {
    setShowNameModal(false)
    setIsSavingDesign(true)

    try {
      // 显示加载提示
      Taro.showLoading({
        title: '保存中...',
        mask: true,
      })

      // 生成画布截图（暂时使用空字符串，后续实现Canvas截图）
      const thumbnail = '' // TODO: 实现Canvas截图

      // 保存设计
      const savedDesign = await saveDesign(bracelet, designName, thumbnail)

      // 隐藏加载提示
      Taro.hideLoading()

      // 显示成功提示
      Taro.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 2000,
      })

      console.log('设计已保存:', savedDesign)
    } catch (error: any) {
      // 隐藏加载提示
      Taro.hideLoading()

      // 显示错误提示
      Taro.showToast({
        title: error.message || '保存失败',
        icon: 'none',
        duration: 2000,
      })
    } finally {
      setIsSavingDesign(false)
    }
  }

  // 取消保存
  const handleCancelSave = () => {
    setShowNameModal(false)
  }

  // 处理清空设计
  const handleClearDesign = () => {
    // 如果手串为空，不需要清空
    if (bracelet.beads.length === 0) {
      Taro.showToast({
        title: '当前设计已为空',
        icon: 'none',
        duration: 2000,
      })
      return
    }

    // 弹出确认对话框
    Taro.showModal({
      title: '确认清空',
      content: '确定要清空当前设计吗？此操作不可恢复。',
      confirmText: '确定',
      cancelText: '取消',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          // 用户确认清空
          clearBracelet()
          Taro.showToast({
            title: '已清空设计',
            icon: 'success',
            duration: 1500,
          })
        }
      },
    })
  }
  
  // 处理手腕尺寸确认
  const handleWristSizeConfirm = (size: number, style: 'single' | 'double') => {
    setWristSize(size)
    setWearingStyle(style)
    setShowWristModal(false)
    
    Taro.showToast({
      title: '设置成功',
      icon: 'success',
      duration: 1500
    })
  }

  // 分享给好友
  useShareAppMessage(() => {
    const beadCount = bracelet.beads.length
    const totalPrice = properties.totalPrice
    
    return {
      title: beadCount > 0 
        ? `我设计了一个${beadCount}颗珠子的水晶手串，总价¥${totalPrice}！`
        : 'DIY水晶手串设计 - 定制你的专属饰品',
      path: '/pages/diy/index',
      imageUrl: shareImageUrl,
      success: () => {
        Taro.showToast({
          title: '分享成功',
          icon: 'success',
          duration: 2000,
        })
      },
      fail: (error) => {
        console.error('分享失败:', error)
        Taro.showToast({
          title: '分享失败',
          icon: 'none',
          duration: 2000,
        })
      }
    }
  })

  // 分享到朋友圈
  useShareTimeline(() => {
    const beadCount = bracelet.beads.length
    const totalPrice = properties.totalPrice
    
    return {
      title: beadCount > 0 
        ? `我设计了一个${beadCount}颗珠子的水晶手串，总价¥${totalPrice}！`
        : 'DIY水晶手串设计 - 定制你的专属饰品',
      query: '',
      imageUrl: shareImageUrl,
      success: () => {
        Taro.showToast({
          title: '分享成功',
          icon: 'success',
          duration: 2000,
        })
      },
      fail: (error) => {
        console.error('分享朋友圈失败:', error)
        Taro.showToast({
          title: '分享失败',
          icon: 'none',
          duration: 2000,
        })
      }
    }
  })

  return (
    <View className='diy-page'>
      {/* 设计画布 - 上方 */}
      <View className='diy-page__canvas'>
        <DesignCanvas
          bracelet={bracelet}
          selectedBeadIndex={selectedBeadIndex}
          onBeadSelect={handleBeadSelect}
          onBeadDelete={handleBeadDelete}
          onBeadMove={handleBeadMove}
          onSettingClick={() => setShowWristModal(true)}
          onClear={handleClearDesign}
          onSave={handleSaveDesign}
          onAddToCart={handleAddToCart}
          isSaving={isSavingDesign}
          isAddingToCart={isAddingToCart}
          disabled={bracelet.beads.length === 0}
          backgroundImageUrl='https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/crystallogo/%E9%81%A3%E5%B1%B1%E6%B0%B4%E6%99%B6logo.png'
        />
      </View>

      {/* 属性面板 - 中间 */}
      <View className='diy-page__properties'>
        <PropertyPanel properties={properties} />
      </View>

      {/* 操作按钮 */}
      {/* <View className='diy-page__actions'>
        <Button
          className='diy-page__action-btn diy-page__action-btn--clear'
          onClick={handleClearDesign}
          disabled={bracelet.beads.length === 0}
        >
          清空设计
        </Button>
        <Button
          className='diy-page__action-btn diy-page__action-btn--save'
          onClick={handleSaveDesign}
          disabled={bracelet.beads.length === 0 || isSavingDesign}
          loading={isSavingDesign}
        >
          保存设计
        </Button>
        <Button
          className='diy-page__action-btn diy-page__action-btn--share'
          openType='share'
          disabled={bracelet.beads.length === 0}
        >
          分享设计
        </Button>
        <Button
          className='diy-page__action-btn diy-page__action-btn--cart'
          type='primary'
          onClick={handleAddToCart}
          disabled={bracelet.beads.length === 0 || isAddingToCart}
          loading={isAddingToCart}
        >
          加入购物车
        </Button>
      </View> */}

      {/* 珠子选择器 - 下方 */}
      <View className='diy-page__selector'>
        <BeadSelector ref={beadSelectorRef} onBeadClick={handleBeadClick} />
      </View>

      {/* 命名对话框 */}
      <NameInputModal
        visible={showNameModal}
        defaultName={`手串设计${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`}
        onConfirm={handleConfirmSave}
        onCancel={handleCancelSave}
      />
      
      {/* 手腕尺寸设置对话框 */}
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
