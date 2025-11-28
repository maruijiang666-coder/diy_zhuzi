import { create } from 'zustand'
import { Bead } from '../types/bead'
import { Bracelet, BraceletProperties } from '../types/bracelet'
import { calculateProperties } from '../utils/calculator'
import { MAX_BEADS } from '../constants/limits'

interface DiyStore {
  // 状态
  bracelet: Bracelet
  selectedBeadIndex: number | null

  // 操作
  addBead: (bead: Bead) => void
  removeBead: (index: number) => void
  moveBead: (fromIndex: number, toIndex: number) => void
  clearBracelet: () => void
  selectBead: (index: number | null) => void

  // 计算属性
  getProperties: () => BraceletProperties
  canAddBead: () => boolean
}

export const useDiyStore = create<DiyStore>((set, get) => ({
  // 初始状态
  bracelet: {
    beads: [],
  },
  selectedBeadIndex: null,

  // 添加珠子到手串末尾
  addBead: (bead: Bead) => {
    const currentState = get()
    
    // 检查是否可以继续添加珠子
    if (!currentState.canAddBead()) {
      console.warn(`已达到最大珠子数量限制: ${MAX_BEADS}`)
      return
    }

    set((state) => ({
      bracelet: {
        ...state.bracelet,
        beads: [...state.bracelet.beads, bead],
        updatedAt: Date.now(),
      },
    }))
  },

  // 删除指定索引的珠子
  removeBead: (index: number) => {
    set((state) => {
      const beads = state.bracelet.beads

      // 验证索引有效性
      if (index < 0 || index >= beads.length) {
        console.warn(`无效的珠子索引: ${index}`)
        return state
      }

      // 创建新的珠子数组，移除指定索引的珠子
      const newBeads = [...beads.slice(0, index), ...beads.slice(index + 1)]

      // 如果删除的是当前选中的珠子，清除选中状态
      let newSelectedIndex = state.selectedBeadIndex
      if (state.selectedBeadIndex === index) {
        newSelectedIndex = null
      } else if (state.selectedBeadIndex !== null && state.selectedBeadIndex > index) {
        // 如果选中的珠子在删除珠子之后，索引需要减1
        newSelectedIndex = state.selectedBeadIndex - 1
      }

      return {
        bracelet: {
          ...state.bracelet,
          beads: newBeads,
          updatedAt: Date.now(),
        },
        selectedBeadIndex: newSelectedIndex,
      }
    })
  },

  // 移动珠子位置
  moveBead: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const beads = state.bracelet.beads

      // 验证索引有效性
      if (
        fromIndex < 0 ||
        fromIndex >= beads.length ||
        toIndex < 0 ||
        toIndex >= beads.length
      ) {
        console.warn(`无效的移动索引: from ${fromIndex} to ${toIndex}`)
        return state
      }

      // 如果索引相同，不需要移动
      if (fromIndex === toIndex) {
        return state
      }

      // 创建新的珠子数组
      const newBeads = [...beads]
      const [movedBead] = newBeads.splice(fromIndex, 1)
      newBeads.splice(toIndex, 0, movedBead)

      // 更新选中索引
      let newSelectedIndex = state.selectedBeadIndex
      if (state.selectedBeadIndex === fromIndex) {
        newSelectedIndex = toIndex
      } else if (state.selectedBeadIndex !== null) {
        // 处理其他珠子的索引变化
        if (fromIndex < toIndex) {
          // 向后移动
          if (
            state.selectedBeadIndex > fromIndex &&
            state.selectedBeadIndex <= toIndex
          ) {
            newSelectedIndex = state.selectedBeadIndex - 1
          }
        } else {
          // 向前移动
          if (
            state.selectedBeadIndex >= toIndex &&
            state.selectedBeadIndex < fromIndex
          ) {
            newSelectedIndex = state.selectedBeadIndex + 1
          }
        }
      }

      return {
        bracelet: {
          ...state.bracelet,
          beads: newBeads,
          updatedAt: Date.now(),
        },
        selectedBeadIndex: newSelectedIndex,
      }
    })
  },

  // 清空手串
  clearBracelet: () => {
    set({
      bracelet: {
        beads: [],
        updatedAt: Date.now(),
      },
      selectedBeadIndex: null,
    })
  },

  // 选中/取消选中珠子
  selectBead: (index: number | null) => {
    set((state) => {
      // 如果传入null，取消选中
      if (index === null) {
        return { selectedBeadIndex: null }
      }

      // 验证索引有效性
      if (index < 0 || index >= state.bracelet.beads.length) {
        console.warn(`无效的珠子索引: ${index}`)
        return state
      }

      // 如果点击的是当前选中的珠子，取消选中
      if (state.selectedBeadIndex === index) {
        return { selectedBeadIndex: null }
      }

      return { selectedBeadIndex: index }
    })
  },

  // 计算手串属性
  getProperties: () => {
    const state = get()
    return calculateProperties(state.bracelet.beads)
  },

  // 检查是否可以继续添加珠子
  canAddBead: () => {
    const state = get()
    return state.bracelet.beads.length < MAX_BEADS
  },
}))
