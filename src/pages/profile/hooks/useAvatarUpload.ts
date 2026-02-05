import Taro from '@tarojs/taro'
import { useState } from 'react'
import { cleanAndValidateAvatarUrl } from '../../../utils/avatarUtils'
import { setStorage, STORAGE_KEYS } from '../../../utils/storage'

export const useAvatarUpload = () => {
  const [uploading, setUploading] = useState(false)

  const uploadAvatar = async (avatarUrl: string): Promise<string | null> => {
    console.log('获取头像成功，原始URL:', avatarUrl)
    
    // 使用验证函数清理和验证头像URL
    const cleanedAvatarUrl = cleanAndValidateAvatarUrl(avatarUrl)
    console.log('验证后的头像URL:', cleanedAvatarUrl)
    
    // 检查文件是否存在（针对临时文件）
    if (cleanedAvatarUrl.includes('tmp') || cleanedAvatarUrl.includes('http://tmp') || cleanedAvatarUrl.includes('wxfile://tmp')) {
      try {
        // 尝试获取文件信息以验证文件是否存在
        const fileInfo = await Taro.getFileInfo({
          filePath: cleanedAvatarUrl
        })
        console.log('文件存在验证通过:', fileInfo)
      } catch (fileError) {
        console.error('文件不存在或无法访问:', fileError)
        Taro.showToast({
          title: '头像文件已过期，请重新选择',
          icon: 'none',
          duration: 2000
        })
        return null
      }
    }
    
    // 显示上传中提示
    setUploading(true)
    Taro.showLoading({
      title: '上传头像中...',
      mask: true
    })
    
    try {
      // 使用 wx.uploadFile 上传头像到服务器
      const uploadResult = await new Promise<any>((resolve, reject) => {
        Taro.uploadFile({
          url: 'https://data.tangledup-ai.com/upload?folder=diyminiuser',
          filePath: cleanedAvatarUrl,
          name: 'file',
          header: {
            'accept': 'application/json',
            'Content-Type': 'multipart/form-data'
          },
          formData: {
            // 可以添加额外的表单数据
          },
          success: (res) => {
            console.log('头像上传成功:', res)
            resolve(res)
          },
          fail: (err) => {
            console.error('头像上传失败:', err)
            reject(err)
          }
        })
      })
      
      Taro.hideLoading()
      setUploading(false)
      
      // 解析上传结果
      if (uploadResult.statusCode === 200) {
        const responseData = JSON.parse(uploadResult.data)
        console.log('头像上传返回数据:', responseData)
        
        if (responseData.file_url) {
          // 使用服务器返回的图片URL
          const serverAvatarUrl = responseData.file_url
          console.log('服务器头像URL:', serverAvatarUrl)
          
          // 保存头像URL到缓存
          try {
            // 头像缓存键名
            await setStorage(STORAGE_KEYS.USER_AVATAR, serverAvatarUrl)
            console.log('头像URL已保存到缓存')
          } catch (error) {
            console.error('保存头像URL到缓存失败:', error)
          }
          
          Taro.showToast({
            title: '头像上传成功',
            icon: 'success',
            duration: 2000
          })
          
          return serverAvatarUrl
        } else {
          console.error('上传成功但未返回图片URL:', responseData)
          Taro.showToast({
            title: '头像上传失败',
            icon: 'none',
            duration: 2000
          })
          return null
        }
      } else {
        console.error('头像上传失败，状态码:', uploadResult.statusCode)
        Taro.showToast({
          title: '头像上传失败',
          icon: 'none',
          duration: 2000
        })
        return null
      }
      
    } catch (error: any) {
      Taro.hideLoading()
      setUploading(false)
      console.error('头像上传过程出错:', error)
      
      // 更详细的错误处理
      let errorMessage = '头像上传失败'
      if (error.errMsg) {
        if (error.errMsg.includes('file doesn\'t exist')) {
          errorMessage = '头像文件已过期，请重新选择'
        } else if (error.errMsg.includes('uploadFile:fail')) {
          errorMessage = '上传失败，请检查网络连接'
        } else {
          errorMessage = error.errMsg
        }
      }
      
      Taro.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 2000
      })
      return null
    }
  }

  return { uploadAvatar, uploading }
}
