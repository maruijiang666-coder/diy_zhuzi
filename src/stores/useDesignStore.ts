import { create } from 'zustand'
import { SavedDesign } from '../types/design'
import { Bracelet } from '../types/bracelet'
import { designService } from '../services/designService'

interface DesignStore {
  // 状态
  designs: SavedDesign[]
  loading: boolean
  error: string | null

  // 操作
  saveDesign: (bracelet: Bracelet, name?: string, thumbnail?: string) => Promise<SavedDesign>
  loadDesigns: () => Promise<void>
  getDesignById: (designId: string) => Promise<SavedDesign | null>
  updateDesign: (
    designId: string,
    bracelet?: Bracelet,
    name?: string,
    thumbnail?: string
  ) => Promise<void>
  deleteDesign: (designId: string) => Promise<void>
  clearError: () => void
}

export const useDesignStore = create<DesignStore>((set, get) => ({
  // 初始状态
  designs: [],
  loading: false,
  error: null,

  // 保存设计
  saveDesign: async (bracelet: Bracelet, name?: string, thumbnail?: string) => {
    set({ loading: true, error: null })

    try {
      const savedDesign = await designService.saveDesign(bracelet, name, thumbnail)

      set((state) => ({
        designs: [savedDesign, ...state.designs],
        loading: false,
      }))

      return savedDesign
    } catch (error: any) {
      const errorMessage = error.message || '保存设计失败'
      set({ loading: false, error: errorMessage })
      throw error
    }
  },

  // 加载所有设计
  loadDesigns: async () => {
    set({ loading: true, error: null })

    try {
      const designs = await designService.getSavedDesigns()
      
      // 添加空值检查，确保 designs 是数组
      const validDesigns = Array.isArray(designs) ? designs : []

      set({
        designs: validDesigns.sort((a, b) => b.updatedAt - a.updatedAt),
        loading: false,
      })
    } catch (error: any) {
      const errorMessage = error.message || '加载设计失败'
      set({ loading: false, error: errorMessage })
      throw error
    }
  },

  // 获取单个设计
  getDesignById: async (designId: string) => {
    set({ loading: true, error: null })

    try {
      const design = await designService.getDesignById(designId)
      set({ loading: false })
      return design
    } catch (error: any) {
      const errorMessage = error.message || '获取设计失败'
      set({ loading: false, error: errorMessage })
      throw error
    }
  },

  // 更新设计
  updateDesign: async (
    designId: string,
    bracelet?: Bracelet,
    name?: string,
    thumbnail?: string
  ) => {
    set({ loading: true, error: null })

    try {
      const updatedDesign = await designService.updateDesign(
        designId,
        bracelet,
        name,
        thumbnail
      )

      set((state) => ({
        designs: state.designs.map((d) => (d.id === designId ? updatedDesign : d)),
        loading: false,
      }))
    } catch (error: any) {
      const errorMessage = error.message || '更新设计失败'
      set({ loading: false, error: errorMessage })
      throw error
    }
  },

  // 删除设计
  deleteDesign: async (designId: string) => {
    set({ loading: true, error: null })

    try {
      await designService.deleteDesign(designId)

      set((state) => ({
        designs: state.designs.filter((d) => d.id !== designId),
        loading: false,
      }))
    } catch (error: any) {
      const errorMessage = error.message || '删除设计失败'
      set({ loading: false, error: errorMessage })
      throw error
    }
  },

  // 清除错误
  clearError: () => {
    set({ error: null })
  },
}))
