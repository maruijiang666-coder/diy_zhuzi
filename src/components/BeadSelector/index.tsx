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
      { 
        id: "白水晶", 
        name: "白水晶",
        children: [
          { id: "白塔晶", name: "白塔晶" },
          { id: "白水晶B", name: "白水晶B" },
          { id: "白水晶A", name: "白水晶A" }
        ]
      },
      { 
        id: "粉水晶", 
        name: "粉水晶",
        children: [
          { id: "冰橘粉", name: "冰橘粉" },
          { id: "莫粉B", name: "莫粉B" },
          { id: "莫粉A", name: "莫粉A" },
          { id: "马粉A", name: "马粉A" },
          { id: "马粉B", name: "马粉B" },
          { id: "马粉C", name: "马粉C" }
        ]
      },
      { 
        id: "紫水晶", 
        name: "紫水晶",
        children: [
          { id: "乌拉圭紫水B", name: "乌拉圭紫水B" },
          { id: "乌拉圭紫水A", name: "乌拉圭紫水A" },
          { id: "紫阿塞C", name: "紫阿塞C" },
          { id: "紫阿塞B", name: "紫阿塞B" },
          { id: "紫阿塞A", name: "紫阿塞A" },
          { id: "玻利维亚紫水A", name: "玻利维亚紫水A" },
          { id: "玻利维亚紫水B", name: "玻利维亚紫水B" },
          { id: "毕业级紫水", name: "毕业级紫水" }
        ]
      },
      { id: "绿水晶", name: "绿水晶" },
      { 
        id: "蓝水晶", 
        name: "蓝水晶",
        children: [
          { id: "海蓝宝A", name: "海蓝宝A" },
          { id: "海蓝宝B", name: "海蓝宝B" },
          { id: "海蓝宝C", name: "海蓝宝C" },
          { id: "海蓝宝D", name: "海蓝宝D" }
        ]
      },
      { 
        id: "黄水晶", 
        name: "黄水晶",
        children: [
          { id: "黄塔晶A", name: "黄塔晶A" },
          { id: "黄塔晶B", name: "黄塔晶B" },
          { id: "黄塔晶C", name: "黄塔晶C" },
          { id: "黄水晶A", name: "黄水晶A" },
          { id: "黄水晶B", name: "黄水晶B" },
          { id: "黄水晶C", name: "黄水晶C" }
        ]
      },
      { 
        id: "茶晶", 
        name: "茶晶",
        children: [
          { id: "深茶", name: "深茶" },
          { id: "中茶", name: "中茶" },
          { id: "浅茶", name: "浅茶" }
        ]
      }
    ]
  },
  {
    id: "发晶系列",
    name: "发晶系列",
    children: [
      { id: "咖啡发晶", name: "咖啡发晶" },
      { id: "维纳斯发晶", name: "维纳斯发晶" },
      { 
        id: "绿发晶", 
        name: "绿发晶",
        children: [
          { id: "绿发晶A", name: "绿发晶A" },
          { id: "绿发晶B", name: "绿发晶B" }
        ]
      },
      { 
        id: "黑发晶", 
        name: "黑发晶",
        children: [
          { id: "黑发晶A", name: "黑发晶A" },
          { id: "黑发晶B", name: "黑发晶B" },
          { id: "黑发晶C", name: "黑发晶C" },
          { id: "黑发晶D", name: "黑发晶D" },
          { id: "黑发晶E", name: "黑发晶E" }
        ]
      },
      { 
        id: "钛晶", 
        name: "钛晶",
        children: [
          { id: "钛晶A", name: "钛晶A" },
          { id: "钛晶B", name: "钛晶B" },
          { id: "钛晶C", name: "钛晶C" }
        ]
      },
      { 
        id: "兔毛", 
        name: "兔毛",
        children: [
          { id: "绿兔毛", name: "绿兔毛" },
          { id: "灰兔毛", name: "灰兔毛" },
          { id: "红兔毛", name: "红兔毛" },
          { id: "半盆红兔毛", name: "半盆红兔毛" },
          { id: "粉紫兔毛", name: "粉紫兔毛" },
          { id: "蓝兔毛A", name: "蓝兔毛A" },
          { id: "蓝兔毛B", name: "蓝兔毛B" }
        ]
      }
    ]
  },
  {
    id: "幽灵水晶系列",
    name: "幽灵水晶系列",
    children: [
      { id: "幽灵水晶", name: "幽灵水晶" },
      { 
        id: "四季幽灵", 
        name: "四季幽灵",
        children: [
          { id: "四季千层幽灵", name: "四季千层幽灵" },
          { id: "四季幽灵A", name: "四季幽灵A" },
          { id: "四季幽灵B", name: "四季幽灵B" }
        ]
      },
      { 
        id: "绿幽灵", 
        name: "绿幽灵",
        children: [
          { id: "绿幽灵A", name: "绿幽灵A" },
          { id: "绿幽灵B", name: "绿幽灵B" },
          { id: "绿幽灵C", name: "绿幽灵C" }
        ]
      },
      { 
        id: "雪花幽灵", 
        name: "雪花幽灵",
        children: [
          { id: "白雪花", name: "白雪花" },
          { id: "粉雪花", name: "粉雪花" }
        ]
      }
    ]
  },
  {
    id: "胶花系列",
    name: "胶花系列",
    children: [
      { 
        id: "胶花", 
        name: "胶花",
        children: [
          { id: "红胶花A", name: "红胶花A" },
          { id: "红胶花B", name: "红胶花B" },
          { id: "黄胶花A", name: "黄胶花A" },
          { id: "黄胶花B", name: "黄胶花B" }
        ]
      },
      { id: "小树胶花", name: "小树胶花" }
    ]
  },
  {
    id: "特色水晶",
    name: "特色水晶",
    children: [
      { id: "云母", name: "云母" },
      { 
        id: "紫锂辉", 
        name: "紫锂辉",
        children: [
          { id: "紫锂辉A", name: "紫锂辉A" },
          { id: "紫锂辉B", name: "紫锂辉B" }
        ]
      },
      { id: "紫马粉", name: "紫马粉" },
      { id: "金草莓晶", name: "金草莓晶" },
      { 
        id: "金太阳", 
        name: "金太阳",
        children: [
          { id: "金太阳A", name: "金太阳A" },
          { id: "金太阳B", name: "金太阳B" },
          { id: "金太阳C", name: "金太阳C" }
        ]
      },
      { id: "黑爆闪", name: "黑爆闪" },
      { id: "紫随形", name: "紫随形" },
      { id: "紫随行", name: "紫随行" },
      { id: "随形", name: "随形" },
      { id: "随行", name: "随行" }
    ]
  },
  {
    id: "其他宝石",
    name: "其他宝石",
    children: [
      { 
        id: "孔雀石", 
        name: "孔雀石",
        children: [
          { id: "孔雀石A", name: "孔雀石A" },
          { id: "孔雀石B", name: "孔雀石B" }
        ]
      },
      { id: "玛瑙", name: "玛瑙" },
      { 
        id: "石榴石", 
        name: "石榴石",
        children: [
          { id: "石榴石A", name: "石榴石A" },
          { id: "石榴石B", name: "石榴石B" }
        ]
      },
      { 
        id: "虎眼", 
        name: "虎眼",
        children: [
          { id: "黄虎眼", name: "黄虎眼" },
          { id: "红虎眼", name: "红虎眼" }
        ]
      },
      { 
        id: "萤石", 
        name: "萤石",
        children: [
          { id: "黄萤石A", name: "黄萤石A" },
          { id: "黄萤石B", name: "黄萤石B" },
          { id: "绿萤石A", name: "绿萤石A" },
          { id: "绿萤石B", name: "绿萤石B" }
        ]
      }
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

  // 获取当前选中的二级分类对象
  const selectedSubCategory = useMemo(() => {
    if (!selectedMainCategory || !selectedMainCategory.children) return undefined
    return selectedMainCategory.children.find(c => c.id === selectedSubCategoryId)
  }, [selectedMainCategory, selectedSubCategoryId])



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
          finalBeads = finalBeads.filter(bead => 
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
        finalNewBeads = finalNewBeads.filter(bead => 
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
      </View>

      <View className='bead-selector__body'>
        {/* 左侧大类筛选 */}
        <ScrollView className='bead-selector__sidebar' scrollY>
          <View className='bead-selector__sidebar-list'>
            <View
              className={`bead-selector__sidebar-item ${!selectedMainCategoryId ? 'active' : ''}`}
              onClick={() => handleMainCategoryChange(undefined)}
            >
              全部
            </View>
            {processedCategories.map((category) => (
              <View key={category.id}>
                <View
                  className={`bead-selector__sidebar-item ${
                    selectedMainCategoryId === category.id ? 'active' : ''
                  }`}
                  onClick={() => handleMainCategoryChange(category.id)}
                >
                  {category.name}
                </View>
                
                {/* 二级分类 */}
                {selectedMainCategoryId === category.id && isSubMenuVisible && category.children && (
                  <View className='bead-selector__sidebar-sub-list'>
                    {category.children.map((sub) => (
                      <View key={sub.id}>
                        <View
                          className={`bead-selector__sidebar-sub-item ${
                            selectedSubCategoryId === sub.id ? 'active' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSubCategoryChange(sub.id)
                          }}
                        >
                          {sub.name}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* 右侧内容区域 */}
        <View className='bead-selector__main'>
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
                  <ScrollView scrollY style={{ height: '100%' }} onScrollToLower={handleScrollToLower}>
                    <View className='bead-selector__grid'>
                      {virtualListData.map((row, rowIndex) => {
                        return (
                          <View key={`row-${rowIndex}`} className='bead-selector__grid-row'>
                            {row.map((bead) => {
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
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  )
})

export default BeadSelector
