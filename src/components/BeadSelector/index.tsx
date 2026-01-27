import { View, Input, ScrollView, Icon } from '@tarojs/components'
import { useState, useEffect, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react'
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

export interface BeadSelectorRef {
  loadMore: () => void
}

// 定义分类结构常量
const CATEGORY_CONFIG: Category[] = [
  {
    id: "单色水晶",
    name: "单色水晶",
    children: [
      { id: "白水晶", name: "白水晶" },
      { id: "粉水晶", name: "粉水晶" },
      { id: "紫水晶", name: "紫水晶" },
      { id: "绿水晶", name: "绿水晶" },
      { id: "蓝水晶", name: "蓝水晶" },
      { id: "黄水晶", name: "黄水晶" },
      { id: "茶晶", name: "茶晶" }
    ]
  },
  {
    id: "发晶系列",
    name: "发晶系列",
    children: [
      { id: "咖啡发晶", name: "咖啡发晶" },
      { id: "维纳斯发晶", name: "维纳斯发晶" },
      { id: "绿发晶", name: "绿发晶" },
      { id: "黑发晶", name: "黑发晶" },
      { id: "钛晶", name: "钛晶" },
      { id: "兔毛", name: "兔毛" }
    ]
  },
  {
    id: "幽灵水晶系列",
    name: "幽灵水晶系列",
    children: [
      { id: "幽灵水晶", name: "幽灵水晶" },
      { id: "四季幽灵", name: "四季幽灵" },
      { id: "绿幽灵", name: "绿幽灵" },
      { id: "雪花幽灵", name: "雪花幽灵" }
    ]
  },
  {
    id: "胶花系列",
    name: "胶花系列",
    children: [
      { id: "胶花", name: "胶花" },
      { id: "小树胶花", name: "小树胶花" }
    ]
  },
  {
    id: "特色水晶",
    name: "特色水晶",
    children: [
      { id: "云母", name: "云母" },
      { id: "紫锂辉", name: "紫锂辉" },
      { id: "紫马粉", name: "紫马粉" },
      { id: "金草莓晶", name: "金草莓晶" },
      { id: "金太阳", name: "金太阳" },
      { id: "黑爆闪", name: "黑爆闪" }
    ]
  },
  {
    id: "其他宝石",
    name: "其他宝石",
    children: [
      { id: "孔雀石", name: "孔雀石" },
      { id: "玛瑙", name: "玛瑙" },
      { id: "石榴石", name: "石榴石" },
      { id: "虎眼", name: "虎眼" },
      { id: "萤石", name: "萤石" }
    ]
  }
]

const BeadSelector = forwardRef<BeadSelectorRef, BeadSelectorProps>(({ onBeadClick, selectedCategory }, ref) => {
  const [beads, setBeads] = useState<Bead[]>([])

  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<string | undefined>(undefined)
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | undefined>(undefined)
  const [isSubMenuVisible, setIsSubMenuVisible] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const searchTimeoutRef = useRef<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // 处理分类数据的逻辑，确保支持大类-小类结构
  const processedCategories = useMemo(() => {
    return CATEGORY_CONFIG
  }, [])

  // 获取当前选中的大类对象
  const selectedMainCategory = useMemo(() => {
    return processedCategories.find(c => c.id === selectedMainCategoryId)
  }, [processedCategories, selectedMainCategoryId])



  // 加载珠子列表
  useEffect(() => {
    let isMounted = true
    
    const loadBeads = async () => {
      try {
        setLoading(true)
        setError(null)

        const filterCategoryId = selectedSubCategoryId || selectedMainCategoryId
        console.log('BeadSelector: 开始加载珠子数据...', { filterCategoryId, searchKeyword: debouncedKeyword })
        
        const result = await beadService.getBeads(
          filterCategoryId,
          debouncedKeyword,
          1,
          20
        )

        let finalBeads = result.beads
        if (debouncedKeyword && debouncedKeyword.trim()) {
          const lowerKeyword = debouncedKeyword.trim().toLowerCase()
          finalBeads = result.beads.filter(bead => 
            bead.name.toLowerCase().includes(lowerKeyword) || 
            (bead.category && bead.category.toLowerCase().includes(lowerKeyword))
          )
        }

        if (isMounted) {
          setBeads(finalBeads)
          setHasMore(result.beads.length === result.pageSize)
          setPage(1)
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
        }
      }
    }

    loadBeads()
    
    return () => {
      isMounted = false
    }
  }, [selectedMainCategoryId, selectedSubCategoryId, debouncedKeyword])

  // 加载更多珠子
  const loadMoreBeads = useCallback(async () => {
    if (loading || !hasMore) return

    try {
      setLoading(true)

      const filterCategoryId = selectedSubCategoryId || selectedMainCategoryId
      const result = await beadService.getBeads(
        filterCategoryId,
        debouncedKeyword,
        page + 1,
        20  
      )

      let finalNewBeads = result.beads
      if (debouncedKeyword && debouncedKeyword.trim()) {
        const lowerKeyword = debouncedKeyword.trim().toLowerCase()
        finalNewBeads = result.beads.filter(bead => 
          bead.name.toLowerCase().includes(lowerKeyword) || 
          (bead.category && bead.category.toLowerCase().includes(lowerKeyword))
        )
      }

      setBeads((prev) => [...prev, ...finalNewBeads])
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
  }, [loading, hasMore, selectedMainCategoryId, selectedSubCategoryId, debouncedKeyword, page])

  // 暴露给外部的方法
  useImperativeHandle(ref, () => ({
    loadMore: () => {
      loadMoreBeads()
    }
  }))

  // 处理大类切换
  const handleMainCategoryChange = (categoryId: string | undefined) => {
    if (categoryId === selectedMainCategoryId && categoryId !== undefined) {
      // 如果点击已选中的大类，则切换二级菜单的显示/隐藏
      setIsSubMenuVisible(!isSubMenuVisible)
      return
    }

    setSelectedMainCategoryId(categoryId)
    
    // 默认进入二级菜单中的第一个类
    let firstSubCategoryId: string | undefined = undefined
    if (categoryId) {
      const mainCat = CATEGORY_CONFIG.find(c => c.id === categoryId)
      if (mainCat && mainCat.children && mainCat.children.length > 0) {
        firstSubCategoryId = mainCat.children[0].id
      }
    }
    
    setSelectedSubCategoryId(firstSubCategoryId)
    setIsSubMenuVisible(!!categoryId) // 选中大类时显示二级菜单，选中"全部"时隐藏
    setSearchKeyword('')
    setDebouncedKeyword('')
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
  }

  // 处理小类切换
  const handleSubCategoryChange = (subCategoryId: string | undefined) => {
    setSelectedSubCategoryId(subCategoryId)
    setIsSubMenuVisible(false) // 选中二级分类后收起菜单
    setSearchKeyword('')
    setDebouncedKeyword('')
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
  }

  // 处理搜索输入
  const handleSearchInput = (e: any) => {
    const value = e.detail.value
    setSearchKeyword(value)
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedKeyword(value)
    }, 500)
  }

  // 处理搜索确认
  const handleSearchConfirm = (e: any) => {
    const value = e.detail.value
    setSearchKeyword(value)
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    setDebouncedKeyword(value)
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
    setSelectedMainCategoryId(undefined)
    setSelectedSubCategoryId(undefined)
    setSearchKeyword('')
    setDebouncedKeyword('')
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    setError(null)
  }, [])

  // 计算三列布局的行数据 - 使用useMemo缓存
  const virtualListData = useMemo(() => {
    // 将beads数组转换为三列布局所需的行数据
    const rows: Bead[][] = []
    for (let i = 0; i < beads.length; i += 3) {
      rows.push([beads[i], beads[i + 1], beads[i + 2]].filter(Boolean))
    }
    return rows
  }, [beads])

  return (
    <View className='bead-selector'>
      <View className='bead-selector__header'>
        {/* 搜索栏 */}
        <View className='bead-selector__search'>
          <View className='bead-selector__search-container'>
            <Icon size='16' type='search' color='#999' className='bead-selector__search-icon' />
            <Input
              className='bead-selector__search-input'
              type='text'
              placeholder='搜索珠子名称'
              value={searchKeyword}
              onInput={handleSearchInput}
              onConfirm={handleSearchConfirm}
              confirmType='search'
            />
            {searchKeyword && (
              <Icon 
                size='16' 
                type='clear' 
                color='#ccc' 
                className='bead-selector__search-clear' 
                onClick={() => {
                  setSearchKeyword('')
                  setDebouncedKeyword('')
                }}
              />
            )}
          </View>
        </View>

        {/* 大类筛选 */}
        <ScrollView className='bead-selector__categories' scrollX>
          <View className='bead-selector__category-list'>
            <View
              className={`bead-selector__category ${!selectedMainCategoryId ? 'active' : ''}`}
              onClick={() => handleMainCategoryChange(undefined)}
            >
              全部
            </View>
            {processedCategories.map((category) => (
              <View
                key={category.id}
                className={`bead-selector__category ${
                  selectedMainCategoryId === category.id ? 'active' : ''
                }`}
                onClick={() => handleMainCategoryChange(category.id)}
              >
                {category.name}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* 小类筛选 */}
        {isSubMenuVisible && selectedMainCategory && selectedMainCategory.children && selectedMainCategory.children.length > 0 && (
          <ScrollView className='bead-selector__sub-categories' scrollX>
            <View className='bead-selector__sub-category-list'>
              {selectedMainCategory.children.map((sub) => (
                <View
                  key={sub.id}
                  className={`bead-selector__sub-category ${
                    selectedSubCategoryId === sub.id ? 'active' : ''
                  }`}
                  onClick={() => handleSubCategoryChange(sub.id)}
                >
                  {sub.name}
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

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
            <View className='bead-selector__list'>
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
            </View>
          </>
        )}
      </View>
    </View>
  )
})

export default BeadSelector
