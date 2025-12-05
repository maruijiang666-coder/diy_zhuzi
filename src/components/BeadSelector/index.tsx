import { View, Input, ScrollView } from '@tarojs/components'
import { useState, useEffect, useCallback, useMemo } from 'react'
import Taro from '@tarojs/taro'
import type { Bead } from '../../types/bead'
import type { Category } from '../../types/common'
import { beadService } from '../../services/beadService'
import BeadItem from '../BeadItem'
import { Loading, Empty } from '../common'
import './index.scss'

interface BeadSelectorProps {
  onBeadClick: (bead: Bead) => void
  selectedCategory?: string
}

const BeadSelector: React.FC<BeadSelectorProps> = ({ onBeadClick, selectedCategory }) => {
  const [beads, setBeads] = useState<Bead[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [currentCategory, setCurrentCategory] = useState<string | undefined>(selectedCategory)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // 加载分类列表
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoryList = await beadService.getCategories()
        console.log('分类数据:', categoryList)
        // 确保返回的是数组
        if (Array.isArray(categoryList)) {
          setCategories(categoryList)
        } else {
          console.warn('分类数据不是数组:', categoryList)
          setCategories([])
        }
      } catch (err) {
        console.error('加载分类失败:', err)
        setCategories([])
      }
    }
    loadCategories()
  }, [])

  // 加载珠子列表
  useEffect(() => {
    let isMounted = true
    
    const loadBeads = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log('BeadSelector: 开始加载珠子数据...', { currentCategory, searchKeyword })
        
        const result = await beadService.getBeads(
          currentCategory,   // 分类筛选参数
          searchKeyword,     // 搜索关键词
          1,   //第一页
          20   //每页20个
        )

        console.log('BeadSelector: 珠子数据加载成功:', result)
        console.log('BeadSelector: beads数组长度:', result.beads.length)
        console.log('BeadSelector: 第一个珠子:', result.beads[0])
        
        if (isMounted) {
          // 存储珠子的信息
          setBeads(result.beads)
          setHasMore(result.beads.length === result.pageSize)
          setPage(1)
          console.log('BeadSelector: 状态已更新，beads.length =', result.beads.length)
        }
      } catch (err: any) {
        console.error('BeadSelector: 加载珠子失败:', err)
        if (isMounted) {
          setError(err.message || '加载失败，请重试')
          Taro.showToast({
            title: '加载失败',
            icon: 'none',
          })
        }
      } finally {
        if (isMounted) {
          setLoading(false)
          console.log('BeadSelector: loading状态已设置为false')
        }
      }
    }

    loadBeads()
    
    return () => {
      isMounted = false
    }
  }, [currentCategory, searchKeyword])

  // 加载更多珠子
  const loadMoreBeads = useCallback(async () => {
    if (loading || !hasMore) return

    try {
      setLoading(true)

      const result = await beadService.getBeads(
        currentCategory,
        searchKeyword,
        page + 1,    // 页码递增
        20  
      )

      setBeads((prev) => [...prev, ...result.beads])
      setHasMore(result.beads.length === result.pageSize)
      setPage((prev) => prev + 1)
    } catch (err: any) {
      console.error('加载更多珠子失败:', err)
      Taro.showToast({
        title: '加载失败',
        icon: 'none',
      })
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, currentCategory, searchKeyword, page])

  // 处理分类切换
  const handleCategoryChange = (categoryId: string | undefined) => {
    setCurrentCategory(categoryId)
    setSearchKeyword('')
  }

  // 处理搜索输入
  const handleSearchInput = (e: any) => {
    setSearchKeyword(e.detail.value)
  }

  // 处理珠子点击 - 使用useCallback缓存
  const handleBeadClick = useCallback((bead: Bead) => {
    onBeadClick(bead)
  }, [onBeadClick])

  // 处理滚动到底部
  const handleScrollToLower = useCallback(() => {
    loadMoreBeads()
  }, [loadMoreBeads])

  // 处理重试
  const handleRetry = useCallback(() => {
    setCurrentCategory(undefined)
    setSearchKeyword('')
    setError(null)
  }, [])

  // 计算三列布局的行数据 - 使用useMemo缓存
  const virtualListData = useMemo(() => {
    // 将beads数组转换为三列布局所需的行数据
    const rows: Bead[][] = []
    for (let i = 0; i < beads.length; i += 3) {
      rows.push([beads[i], beads[i + 1], beads[i + 2]].filter(Boolean))
    }
    console.log('BeadSelector: virtualListData计算完成，行数:', rows.length)
    return rows
  }, [beads])

  // 调试：输出当前状态
  console.log('BeadSelector 渲染:', {
    loading,
    error,
    beadsLength: beads.length,
    virtualListDataLength: virtualListData.length,
    categoriesLength: categories.length,
  })

  return (
    <View className='bead-selector'>
      {/* 搜索栏 */}
      <View className='bead-selector__search'>
        <Input
          className='bead-selector__search-input'
          type='text'
          placeholder='搜索珠子名称'
          value={searchKeyword}
          onInput={handleSearchInput}
        />
      </View>

      {/* 分类筛选 */}
      <ScrollView className='bead-selector__categories' scrollX>
        <View className='bead-selector__category-list'>
          <View
            className={`bead-selector__category ${!currentCategory ? 'active' : ''}`}
            onClick={() => handleCategoryChange(undefined)}
          >
            全部
          </View>
          {categories.map((category) => (
            <View
              key={category.id}
              className={`bead-selector__category ${
                currentCategory === category.id ? 'active' : ''
              }`}
              onClick={() => handleCategoryChange(category.id)}
            >
              {category.name}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 珠子列表 */}
      <View className='bead-selector__content'>
        {loading && beads.length === 0 ? (
          <>
            {console.log('BeadSelector: 显示Loading组件')}
            <Loading />
          </>
        ) : error ? (
          <>
            {console.log('BeadSelector: 显示错误信息')}
            <View className='bead-selector__error'>
              <View className='bead-selector__error-text'>{error}</View>
              <View className='bead-selector__retry-btn' onClick={handleRetry}>
                重试
              </View>
            </View>
          </>
        ) : beads.length === 0 ? (
          <>
            {console.log('BeadSelector: 显示Empty组件')}
            <Empty text='暂无珠子数据' />
          </>
        ) : (
          <>
            {console.log('BeadSelector: 显示珠子列表，数量:', beads.length)}
            {/*滚动shitu */}
            <ScrollView
              className='bead-selector__list'
              scrollY
              onScrollToLower={handleScrollToLower}
              lowerThreshold={100}
            >
              {/* 使用虚拟列表优化渲染性能 */}
              <View className='bead-selector__grid'>
                {virtualListData.map((row, rowIndex) => {
                  console.log(`BeadSelector: 渲染第${rowIndex}行，珠子数:`, row.length)
                  return (
                    <View key={`row-${rowIndex}`} className='bead-selector__grid-row'>
                      {row.map((bead) => {
                        console.log(`BeadSelector: 渲染珠子 ${bead.id} - ${bead.name}`)
                        return (
                          <View key={bead.id} className='bead-selector__grid-item'>
                            <BeadItem bead={bead} onClick={handleBeadClick} lazyLoad />
                          </View>
                        )
                      })}
                    </View>
                  )
                })}
              </View>
              {loading && beads.length > 0 && (
                <View className='bead-selector__loading-more'>加载中...</View>
              )}
              {!hasMore && beads.length > 0 && (
                <View className='bead-selector__no-more'>没有更多了</View>
              )}
            </ScrollView>
          </>
        )}
      </View>
    </View>
  )
}

export default BeadSelector
