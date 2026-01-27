import { Bracelet, BraceletProperties } from './bracelet'

export interface Category {
  id: string
  name: string
  icon?: string
  children?: Category[]
}

export interface CartItem {
  id: string
  bracelet: Bracelet
  properties: BraceletProperties
  addedAt: number
}

export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppError {
  type: ErrorType
  message: string
  code?: string
  details?: any
}
