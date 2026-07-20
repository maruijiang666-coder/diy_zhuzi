import { create } from 'zustand'
import { Bead } from '../types/bead'
import { Bracelet, BraceletProperties } from '../types/bracelet'
import { calculateProperties } from '../utils/calculator'

interface DiyStore {
  // 状态
  bracelet: Bracelet
  selectedBeadIndex: number | null
  properties: BraceletProperties // 新增：实时保存的计算属性
  wristSize: number | null
  wearingStyle: 'single' | 'double'

  // 操作
  addBead: (bead: Bead) => void
  removeBead: (index: number) => void
  moveBead: (fromIndex: number, toIndex: number) => void
  clearBracelet: () => void
  selectBead: (index: number | null) => void
  setWristSize: (size: number | null) => void
  setWearingStyle: (style: 'single' | 'double') => void

  // 计算属性
  getProperties: () => BraceletProperties
  canAddBead: (bead?: Bead) => boolean
}

export const useDiyStore = create<DiyStore>((set, get) => ({
  // 初始状态
  bracelet: {
    beads: [],
  },
  selectedBeadIndex: null,
  properties: {
    beadCount: 0,
    totalPrice: 0,
    totalWeight: 0,
    totalLength: 0,
  },
  wristSize: null,
  wearingStyle: 'single',

  // 设置手腕尺寸
  setWristSize: (size: number | null) => set({ wristSize: size }),

  // 设置佩戴方式
  setWearingStyle: (style: 'single' | 'double') => set({ wearingStyle: style }),

  // 添加珠子到手串末尾
  addBead: (bead: Bead) => {
    const currentState = get()
    
    // 检查是否可以继续添加珠子
    if (!currentState.canAddBead(bead)) {
      console.warn(`无法添加珠子：超出最大周长限制`)
      return
    }

    set((state) => {
      // 为新珠子生成唯一 ID，确保 React Key 唯一性
      // 使用时间戳 + 随机数，避免同型号珠子 ID 重复导致渲染闪烁
      // 同时保留原始 ID (originalId) 用于向后端接口发送数据
      const originalId = bead.originalId || bead.id;
      const uniqueBead = {
        ...bead,
        originalId: originalId,
        id: bead.id && !bead.id.startsWith('temp_') 
            ? `${bead.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` 
            : bead.id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      
      const newBeads = [...state.bracelet.beads, uniqueBead]
      return {
        bracelet: {
          ...state.bracelet,
          beads: newBeads,
          updatedAt: Date.now(),
        },
        properties: calculateProperties(newBeads), // 实时更新属性
      }
    })
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
        properties: calculateProperties(newBeads), // 实时更新属性
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
        properties: calculateProperties(newBeads), // 实时更新属性
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
      properties: {
        beadCount: 0,
        totalPrice: 0,
        totalWeight: 0,
        totalLength: 0,
      },
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
  canAddBead: (bead?: Bead) => {
    const state = get()
    
    // 如果没有设置手腕尺寸，暂时允许添加（或者应该禁止？根据需求这里假设已设置）
    // 但如果必须设置，这里可以返回 false。不过为了健壮性，若未设置则不限制（或限制为默认值）
    if (state.wristSize === null) return true 

    const currentSize = state.wristSize
    const increment = 1.6 + (currentSize - 14) * 0.1
    const baseCircumference = currentSize + increment
    const maxCircumference = state.wearingStyle === 'double' ? baseCircumference * 2 : baseCircumference

    // 当前总长度 (cm)
    const currentTotalLength = state.properties.totalLength
    
    // 预估增加的长度 (cm)
    const beadLength = bead ? bead.diameter / 10 : 0
    
    return (currentTotalLength + beadLength) <= maxCircumference
  },
}))
