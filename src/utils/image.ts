/**
 * 图片资源优化工具
 * 支持CDN加速、多尺寸图片、WebP格式
 */

import Taro from '@tarojs/taro'
import { CDN_BASE_URL, IMAGE_CONFIG } from '../constants/config'

// 图片尺寸枚举
export enum ImageSize {
  THUMBNAIL = 'thumbnail', // 缩略图 100x100
  SMALL = 'small',         // 小图 200x200
  MEDIUM = 'medium',       // 中图 400x400
  LARGE = 'large',         // 大图 800x800
  ORIGINAL = 'original',   // 原图
}

// 图片尺寸映射
const IMAGE_SIZE_MAP: Record<ImageSize, string> = {
  [ImageSize.THUMBNAIL]: '100x100',
  [ImageSize.SMALL]: '200x200',
  [ImageSize.MEDIUM]: '400x400',
  [ImageSize.LARGE]: '800x800',
  [ImageSize.ORIGINAL]: '',
}

// 检测是否支持WebP
let webpSupported: boolean | null = null

/**
 * 检测当前环境是否支持WebP格式
 */
export const checkWebPSupport = async (): Promise<boolean> => {
  // 如果配置中禁用了WebP，直接返回false
  if (!IMAGE_CONFIG.enableWebP) {
    return false
  }

  if (webpSupported !== null) {
    return webpSupported
  }

  try {
    const systemInfo = await Taro.getSystemInfo()
    // 微信小程序基础库 2.9.0 以上支持WebP
    const version = systemInfo.SDKVersion || '0.0.0'
    const [major, minor] = version.split('.').map(Number)
    webpSupported = major > 2 || (major === 2 && minor >= 9)
  } catch (error) {
    console.error('检测WebP支持失败:', error)
    webpSupported = false
  }

  return webpSupported
}

/**
 * 获取优化后的图片URL
 * @param imageUrl 原始图片URL
 * @param size 图片尺寸
 * @param useWebP 是否使用WebP格式（默认自动检测）
 * @returns 优化后的图片URL
 */
export const getOptimizedImageUrl = async (
  imageUrl: string,
  size: ImageSize = ImageSize.MEDIUM,
  useWebP?: boolean
): Promise<string> => {
  if (!imageUrl) {
    return ''
  }

  // 如果已经是完整URL，直接返回
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  // 构建CDN URL
  let url = `${CDN_BASE_URL}/${imageUrl}`

  // 添加尺寸参数
  const sizeParam = IMAGE_SIZE_MAP[size]
  if (sizeParam) {
    url += `?size=${sizeParam}`
  }

  // 添加WebP格式参数
  const shouldUseWebP = useWebP !== undefined ? useWebP : await checkWebPSupport()
  if (shouldUseWebP) {
    url += sizeParam ? '&format=webp' : '?format=webp'
  }

  return url
}

/**
 * 同步获取优化后的图片URL（不检测WebP支持）
 * @param imageUrl 原始图片URL
 * @param size 图片尺寸
 * @param useWebP 是否使用WebP格式
 * @returns 优化后的图片URL
 */
export const getOptimizedImageUrlSync = (
  imageUrl: string,
  size: ImageSize = ImageSize.MEDIUM,
  useWebP: boolean = false
): string => {
  if (!imageUrl) {
    return ''
  }

  // 如果已经是完整URL，直接返回
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  // 构建CDN URL
  let url = `${CDN_BASE_URL}/${imageUrl}`

  // 添加尺寸参数
  const sizeParam = IMAGE_SIZE_MAP[size]
  if (sizeParam) {
    url += `?size=${sizeParam}`
  }

  // 添加WebP格式参数
  if (useWebP && webpSupported) {
    url += sizeParam ? '&format=webp' : '?format=webp'
  }

  return url
}

/**
 * 预加载图片
 * @param imageUrl 图片URL
 */
export const preloadImage = (imageUrl: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    Taro.getImageInfo({
      src: imageUrl,
      success: () => resolve(),
      fail: reject,
    })
  })
}

/**
 * 批量预加载图片
 * @param imageUrls 图片URL数组
 * @param maxConcurrent 最大并发数（默认使用配置值）
 */
export const preloadImages = async (
  imageUrls: string[],
  maxConcurrent: number = IMAGE_CONFIG.preloadConcurrency
): Promise<void> => {
  const chunks: string[][] = []
  for (let i = 0; i < imageUrls.length; i += maxConcurrent) {
    chunks.push(imageUrls.slice(i, i + maxConcurrent))
  }

  for (const chunk of chunks) {
    await Promise.allSettled(chunk.map(preloadImage))
  }
}

/**
 * 获取图片信息
 * @param imageUrl 图片URL
 */
export const getImageInfo = async (imageUrl: string) => {
  try {
    const info = await Taro.getImageInfo({ src: imageUrl })
    return {
      width: info.width,
      height: info.height,
      path: info.path,
      type: info.type,
    }
  } catch (error) {
    console.error('获取图片信息失败:', error)
    return null
  }
}
