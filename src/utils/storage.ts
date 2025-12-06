import Taro from '@tarojs/taro'

/**
 * 存储键名常量
 */
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER_INFO: 'user_info',
  DIY_DRAFT: 'diy_draft',
  CART_CACHE: 'cart_cache',
  OFFLINE_QUEUE: 'offline_queue',
  USER_AVATAR: 'user_avatar',
  USER_NICKNAME: 'user_nickname',
  USER_PHONE: 'user_phone',
}

/**
 * 设置存储数据
 * @param key 存储键名
 * @param data 要存储的数据
 * @returns Promise<void>
 */
export async function setStorage<T>(key: string, data: T): Promise<void> {
  try {
    await Taro.setStorage({
      key,
      data,
    })
  } catch (error) {
    console.error(`[Storage] 设置存储失败: ${key}`, error)
    throw error
  }
}

/**
 * 获取存储数据
 * @param key 存储键名
 * @returns Promise<T | null> 返回存储的数据，如果不存在则返回null
 */
export async function getStorage<T>(key: string): Promise<T | null> {
  try {
    const result = await Taro.getStorage({ key })
    return result.data as T
  } catch (error) {
    // 数据不存在时返回null
    return null
  }
}

/**
 * 删除存储数据
 * @param key 存储键名
 * @returns Promise<void>
 */
export async function removeStorage(key: string): Promise<void> {
  try {
    await Taro.removeStorage({ key })
  } catch (error) {
    console.error(`[Storage] 删除存储失败: ${key}`, error)
    throw error
  }
}

/**
 * 清空所有存储数据
 * @returns Promise<void>
 */
export async function clearStorage(): Promise<void> {
  try {
    await Taro.clearStorage()
  } catch (error) {
    console.error('[Storage] 清空存储失败', error)
    throw error
  }
}

/**
 * 设置Token
 * @param token 认证令牌
 * @returns Promise<void>
 */
export async function setToken(token: string): Promise<void> {
  console.log(`[Storage] 开始设置Token，长度: ${token.length}`)
  try {
    await setStorage(STORAGE_KEYS.TOKEN, token)
    console.log(`[Storage] Token设置成功`)
  } catch (error) {
    console.error(`[Storage] Token设置失败:`, error)
    throw error
  }
}

/**
 * 获取Token
 * @returns Promise<string | null>
 */
export async function getToken(): Promise<string | null> {
  console.log(`[Storage] 开始获取Token`)
  try {
    const token = await getStorage<string>(STORAGE_KEYS.TOKEN)
    console.log(`[Storage] Token获取成功: ${token ? token.substring(0, 10) + '...' : 'null'}`)
    return token
  } catch (error) {
    console.error(`[Storage] Token获取失败:`, error)
    throw error
  }
}

/**
 * 删除Token
 * @returns Promise<void>
 */
export async function removeToken(): Promise<void> {
  return removeStorage(STORAGE_KEYS.TOKEN)
}

/**
 * 缓存离线数据
 * @param key 缓存键名
 * @param data 要缓存的数据
 * @param ttl 过期时间（毫秒），可选
 * @returns Promise<void>
 */
export async function cacheData<T>(
  key: string,
  data: T,
  ttl?: number
): Promise<void> {
  const cacheItem = {
    data,
    timestamp: Date.now(),
    ttl,
  }
  return setStorage(key, cacheItem)
}

/**
 * 获取缓存数据
 * @param key 缓存键名
 * @returns Promise<T | null> 返回缓存的数据，如果过期或不存在则返回null
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  const cacheItem = await getStorage<{
    data: T
    timestamp: number
    ttl?: number
  }>(key)

  if (!cacheItem) {
    return null
  }

  // 检查是否过期
  if (cacheItem.ttl) {
    const now = Date.now()
    const elapsed = now - cacheItem.timestamp
    if (elapsed > cacheItem.ttl) {
      // 数据已过期，删除并返回null
      await removeStorage(key)
      return null
    }
  }

  return cacheItem.data
}

/**
 * 获取存储信息
 * @returns Promise<any>
 */
export async function getStorageInfo(): Promise<any> {
  try {
    return await Taro.getStorageInfo()
  } catch (error) {
    console.error('[Storage] 获取存储信息失败', error)
    throw error
  }
}
