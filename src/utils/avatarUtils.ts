
/**
 * 清理和验证头像URL
 * @param avatarUrl 原始头像URL
 * @returns 清理后的头像URL
 */
export const cleanAndValidateAvatarUrl = (avatarUrl: string): string => {
  if (!avatarUrl) return 'https://img.icons8.com/clouds/200/user.png'
  
  console.log('原始头像URL:', avatarUrl)
  
  // 微信临时文件路径检查 - 不过度清理，保持原始路径
  if (avatarUrl.includes('tmp') || avatarUrl.includes('http://tmp') || avatarUrl.includes('wxfile://tmp')) {
    console.log('检测到微信临时文件路径，直接使用:', avatarUrl)
    return avatarUrl
  }
  
  // 清理URL中的特殊字符（如反引号、空格等）
  let cleanedUrl = avatarUrl.replace(/^`|`$/g, '').trim()
  cleanedUrl = cleanedUrl.replace(/\s+/g, '') // 移除所有空格
  
  // 检查是否包含反引号或其他非法字符
  if (avatarUrl.includes('`') || avatarUrl.includes('\n') || avatarUrl.includes('\r')) {
    console.log('检测到非法字符，使用默认头像')
    return 'https://img.icons8.com/clouds/200/user.png'
  }
  
  // 验证URL格式
  if (!cleanedUrl.startsWith('http')) {
    console.log('URL格式不合法，使用默认头像')
    return 'https://img.icons8.com/clouds/200/user.png'
  }
  
  // 检查URL长度（防止过长的URL）
  if (cleanedUrl.length > 500) {
    console.log('URL过长，使用默认头像')
    return 'https://img.icons8.com/clouds/200/user.png'
  }
  
  console.log('头像URL验证通过:', cleanedUrl)
  return cleanedUrl
}
