// src/components/BeadSelector/index.tsx
import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState, useMemo, useCallback, useEffect } from 'react'
import Taro from '@tarojs/taro'
import type { Bead, PhysicsBead } from '../../types/bead'
import { beadService } from '../../services/beadService'
import { adaptBead } from '../../utils/beadAdapter'
import './index.scss'

interface BeadSelectorProps {
  onBeadTap: (bead: PhysicsBead) => void
}

// 一级分类配置
const CATEGORIES = [
  { id: '单色水晶', name: '珠子' },
  { id: '天然石', name: '天然石' },
  { id: '配饰', name: '配饰' },
  { id: '随型', name: '随型' },
  { id: '文玩', name: '文玩' },
]

export default function BeadSelector({ onBeadTap }: BeadSelectorProps) {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id)
  const [activeSubType, setActiveSubType] = useState('')
  const [allBeads, setAllBeads] = useState<Bead[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const loadBeads = useCallback(async (category: string, pageNum: number = 1, append: boolean = false) => {
    if (loading) return
    setLoading(true)
    try {
      const result = await beadService.getBeads(category, undefined, pageNum, 50)
      if (append) {
        setAllBeads(prev => [...prev, ...result.beads])
      } else {
        setAllBeads(result.beads)
      }
      setHasMore(result.beads.length === 50)
      setPage(pageNum)
    } catch (error) {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [loading])

  const handleCategoryTap = useCallback((categoryId: string) => {
    setActiveCategory(categoryId)
    setActiveSubType('')
    loadBeads(categoryId)
  }, [loadBeads])

  const handleSubTypeTap = useCallback((subType: string) => {
    setActiveSubType(subType)
  }, [])

  const handleBeadCardTap = useCallback((bead: Bead) => {
    const physicsBead = adaptBead(bead)
    onBeadTap(physicsBead)
  }, [onBeadTap])

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadBeads(activeCategory, page + 1, true)
    }
  }, [hasMore, loading, activeCategory, page, loadBeads])

  useEffect(() => {
    loadBeads(activeCategory)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const subTypes = useMemo(() => {
    const categories = new Set(allBeads.map(b => b.category))
    return Array.from(categories).map(c => ({ id: c, name: c }))
  }, [allBeads])

  const displayBeads = useMemo(() => {
    if (!activeSubType) return allBeads
    return allBeads.filter(b => b.category === activeSubType)
  }, [allBeads, activeSubType])

  return (
    <View className="bead-selector">
      {/* 顶部 - 横向一级分类标签 */}
      <ScrollView className="bead-selector__categories" scrollX>
        {CATEGORIES.map(cat => (
          <View
            key={cat.id}
            className={`bead-selector__tab ${activeCategory === cat.id ? 'bead-selector__tab--active' : ''}`}
            onClick={() => handleCategoryTap(cat.id)}
          >
            {cat.name}
          </View>
        ))}
      </ScrollView>

      {/* 下方 - 左二级分类 + 右珠子网格 */}
      <View className="bead-selector__body">
        {/* 左侧二级分类列表 */}
        <ScrollView className="bead-selector__subtypes" scrollY>
          {subTypes.map(sub => (
            <View
              key={sub.id}
              className={`bead-selector__subtype ${activeSubType === sub.id ? 'bead-selector__subtype--active' : ''}`}
              onClick={() => handleSubTypeTap(sub.id)}
            >
              {sub.name}
            </View>
          ))}
        </ScrollView>

        {/* 右侧珠子网格（3列） */}
        <ScrollView className="bead-selector__beads" scrollY onScrollToLower={handleLoadMore}>
          {loading && displayBeads.length === 0 ? (
            <View className="bead-selector__loading">加载中...</View>
          ) : displayBeads.length === 0 ? (
            <View className="bead-selector__empty">暂无珠子</View>
          ) : (
            <View className="bead-selector__grid">
              {displayBeads.map(bead => (
                <View
                  key={bead.id}
                  className="bead-card"
                  onClick={() => handleBeadCardTap(bead)}
                >
                  <View
                    className="bead-card__preview"
                    style={{ backgroundColor: bead.imageUrl ? undefined : '#CCCCCC' }}
                  >
                    {bead.imageUrl ? (
                      <Image className="bead-card__image" src={bead.imageUrl} mode="aspectFill" />
                    ) : null}
                  </View>
                  <Text className="bead-card__name">{bead.name}</Text>
                  <Text className="bead-card__size">{bead.diameter}mm</Text>
                </View>
              ))}
            </View>
          )}
          {loading && displayBeads.length > 0 && (
            <View className="bead-selector__loading-more">加载更多...</View>
          )}
        </ScrollView>
      </View>
    </View>
  )
}
