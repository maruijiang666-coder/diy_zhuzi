import { Bracelet, BraceletProperties } from './bracelet'

/**
 * 保存的设计
 */
export interface SavedDesign {
  id: string
  name: string
  bracelet: Bracelet
  properties: BraceletProperties
  thumbnail: string // 设计的缩略图（画布截图）
  createdAt: number
  updatedAt: number
}

/**
 * 保存设计请求
 */
export interface SaveDesignRequest {
  name?: string
  bracelet: Bracelet
  thumbnail?: string
}

/**
 * 更新设计请求
 */
export interface UpdateDesignRequest {
  name?: string
  bracelet?: Bracelet
  thumbnail?: string
}
