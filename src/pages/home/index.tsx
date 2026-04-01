import React, { useEffect, useState } from 'react'
import { View, Text, Image, Swiper, SwiperItem } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useDesignStore } from '../../stores/useDesignStore'
import { useDiyStore } from '../../stores/useDiyStore'
import { authService } from '../../services/authService'
import BraceletPreview from '../../components/BraceletPreview'
import type { SavedDesign } from '../../types/design'
import './index.scss'

export default function Home() {
  const { designs, loadDesigns } = useDesignStore()
  const { clearBracelet, addBead, setWristSize } = useDiyStore()
  const [isLoggedIn, setIsLoggedIn] = useState(() => authService.isLoggedIn())

  Taro.useDidShow(() => {
    const loggedIn = authService.isLoggedIn()
    setIsLoggedIn(loggedIn)
    if (loggedIn) {
      loadDesigns()
    }
  })

  const loadDesignAndNavigate = async (design: SavedDesign) => {
    try {
      const currentState = useDiyStore.getState()
      
      if (currentState.wristSize === null) {
        setWristSize(16)
      }
      
      clearBracelet()

      design.bracelet.beads.forEach((bead) => {
        addBead(bead)
      })
      
      Taro.navigateTo({
        url: '/pages/diy/index'
      })
    } catch (error: any) {
      Taro.showToast({
        title: '加载设计失败',
        icon: 'none',
        duration: 2000
      })
    }
  }

  const bannerImages = [
    'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/crystallogo/fahuo.jpg',
    'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/crystallogo/shouweitu.png',
    'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/crystallogo/shouwei.jpg',
    'https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/crystallogo/qianshan.png'
  ]

  const navigateToDiy = () => {
    Taro.navigateTo({
      url: '/pages/diy/index'
    })
  }

  const navigateToDesigns = () => {
    Taro.navigateTo({
      url: '/pages/designs/index'
    })
  }

  return (
    <View className="home-page">
      {/* 顶部轮播图 */}
      <View className="banner-section">
        <Swiper
          className="banner-swiper"
          indicatorColor="#EAEAEA"
          indicatorActiveColor="#333333"
          circular
          indicatorDots
          autoplay
        >
          {bannerImages.map((img, index) => (
            <SwiperItem key={index}>
              <View className="banner-item">
                <Image className="banner-image" src={img} mode="aspectFill" />
              </View>
            </SwiperItem>
          ))}
        </Swiper>
      </View>

      {/* 快捷入口 */}
      <View className="quick-entries">
        <View className="entry-card" onClick={navigateToDiy}>
          <View className="entry-icon icon-design"></View>
          <Text className="entry-title">设计</Text>
          <Text className="entry-desc">定制你的专属手串</Text>
        </View>
        <View className="entry-card" onClick={navigateToDesigns}>
          <View className="entry-icon icon-recommend"></View>
          <Text className="entry-title">推荐</Text>
          <Text className="entry-desc">寻找灵感与精品推荐</Text>
        </View>
      </View>

      {/* 我的作品集 */}
      <View className="portfolio-section">
        <Text className="section-title">我的作品集</Text>
        {isLoggedIn && designs && designs.length > 0 ? (
          <Swiper
            className="portfolio-swiper"
            circular
            previousMargin="40rpx"
            nextMargin="40rpx"
          >
            {designs.map((design) => (
              <SwiperItem key={design.id}>
                <View className="portfolio-item" onClick={() => loadDesignAndNavigate(design)}>
                  <View className="preview-container">
                    <BraceletPreview bracelet={design.bracelet} />
                  </View>
                  <Text className="design-name">{design.name || '未命名设计'}</Text>
                </View>
              </SwiperItem>
            ))}
          </Swiper>
        ) : (
          <View className="empty-portfolio">
            <View className="empty-icon"></View>
            <Text className="empty-text">开始制作您的第一个手串吧</Text>
            <View className="start-btn" onClick={navigateToDiy}>
              立即开始
            </View>
          </View>
        )}
      </View>
    </View>
  )
}
