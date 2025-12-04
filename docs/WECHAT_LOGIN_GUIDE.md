# 微信登录功能使用指南

## 📋 概述

本项目已实现符合微信官方最新规范的登录功能（2021年后）。

### 主要变化
- ❌ **废弃**: `wx.getUserProfile()` 已被微信废弃
- ✅ **新方案**: 使用 `wx.login()` + 头像昵称填写组件

## 🔐 登录流程

### 1. 基础登录（仅获取 openid）

```typescript
import { authService } from '@/services/authService'

// 直接登录，不需要用户授权
const result = await authService.wechatLogin()

console.log('登录成功:', result)
// {
//   token: "64位登录态token",
//   user: {
//     id: "1",
//     nickname: "微信用户",
//     avatar: "默认头像"
//   }
// }
```

### 2. 完整登录（包含用户信息）

如果需要获取用户昵称和头像，使用头像昵称填写组件：

```tsx
import { View, Button, Input } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { authService } from '@/services/authService'

function LoginPage() {
  const [nickname, setNickname] = useState('')
  const [avatar, setAvatar] = useState('')

  // 选择头像
  const handleChooseAvatar = (e) => {
    const { avatarUrl } = e.detail
    setAvatar(avatarUrl)
  }

  // 输入昵称
  const handleNicknameInput = (e) => {
    setNickname(e.detail.value)
  }

  // 登录
  const handleLogin = async () => {
    try {
      Taro.showLoading({ title: '登录中...' })

      // 调用登录，传入用户信息
      const result = await authService.wechatLogin({
        nickname,
        avatar,
      })

      Taro.hideLoading()
      Taro.showToast({
        title: '登录成功',
        icon: 'success',
      })

      console.log('登录成功:', result)
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({
        title: error.message || '登录失败',
        icon: 'none',
      })
    }
  }

  return (
    <View className="login-page">
      {/* 头像选择按钮 */}
      <Button 
        openType="chooseAvatar" 
        onChooseAvatar={handleChooseAvatar}
      >
        选择头像
      </Button>

      {/* 昵称输入框 */}
      <Input
        type="nickname"
        placeholder="请输入昵称"
        onInput={handleNicknameInput}
        value={nickname}
      />

      {/* 登录按钮 */}
      <Button onClick={handleLogin}>
        微信登录
      </Button>
    </View>
  )
}
```

## 🔧 API 说明

### authService.wechatLogin()

```typescript
/**
 * 微信登录
 * @param userInfo 可选的用户信息
 * @returns Promise<{ token: string, user: User }>
 */
async wechatLogin(userInfo?: {
  nickname?: string
  avatar?: string
}): Promise<{
  token: string
  user: {
    id: string
    nickname: string
    avatar: string
  }
}>
```

### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| userInfo | object | 否 | 用户信息对象 |
| userInfo.nickname | string | 否 | 用户昵称 |
| userInfo.avatar | string | 否 | 用户头像URL |

### 返回值

```typescript
{
  token: string,        // 登录态 token（64位字符串）
  user: {
    id: string,         // 用户ID
    nickname: string,   // 用户昵称
    avatar: string      // 用户头像URL
  }
}
```

## 📱 完整示例

### 简化版（推荐）

当前项目的 `src/pages/profile/index.tsx` 已实现简化版登录：

```typescript
// 点击登录按钮
const handleWechatLogin = async () => {
  try {
    Taro.showLoading({ title: '登录中...', mask: true })
    
    // 直接调用登录，不需要用户授权
    await login()
    
    Taro.hideLoading()
    Taro.showToast({
      title: '登录成功',
      icon: 'success',
    })
  } catch (error) {
    Taro.hideLoading()
    Taro.showToast({
      title: error.message || '登录失败',
      icon: 'none',
    })
  }
}
```

### 完整版（带用户信息）

如果需要收集用户昵称和头像，可以参考以下实现：

```tsx
import { View, Button, Input, Image } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/stores/useUserStore'

export default function ProfilePage() {
  const { login } = useUserStore()
  const [nickname, setNickname] = useState('')
  const [avatar, setAvatar] = useState('')
  const [showUserInfoForm, setShowUserInfoForm] = useState(false)

  // 第一步：显示用户信息表单
  const handleStartLogin = () => {
    setShowUserInfoForm(true)
  }

  // 第二步：选择头像
  const handleChooseAvatar = (e) => {
    const { avatarUrl } = e.detail
    setAvatar(avatarUrl)
  }

  // 第三步：输入昵称
  const handleNicknameInput = (e) => {
    setNickname(e.detail.value)
  }

  // 第四步：提交登录
  const handleSubmitLogin = async () => {
    if (!nickname) {
      Taro.showToast({
        title: '请输入昵称',
        icon: 'none',
      })
      return
    }

    try {
      Taro.showLoading({ title: '登录中...' })

      // 调用登录，传入用户信息
      await login({ nickname, avatar })

      Taro.hideLoading()
      Taro.showToast({
        title: '登录成功',
        icon: 'success',
      })

      setShowUserInfoForm(false)
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({
        title: error.message || '登录失败',
        icon: 'none',
      })
    }
  }

  if (showUserInfoForm) {
    return (
      <View className="user-info-form">
        <View className="form-title">完善个人信息</View>

        {/* 头像预览 */}
        {avatar && (
          <Image 
            className="avatar-preview" 
            src={avatar} 
            mode="aspectFill" 
          />
        )}

        {/* 选择头像按钮 */}
        <Button 
          className="choose-avatar-btn"
          openType="chooseAvatar" 
          onChooseAvatar={handleChooseAvatar}
        >
          {avatar ? '更换头像' : '选择头像'}
        </Button>

        {/* 昵称输入 */}
        <Input
          className="nickname-input"
          type="nickname"
          placeholder="请输入昵称"
          onInput={handleNicknameInput}
          value={nickname}
        />

        {/* 提交按钮 */}
        <Button 
          className="submit-btn" 
          type="primary"
          onClick={handleSubmitLogin}
        >
          完成
        </Button>

        {/* 跳过按钮 */}
        <Button 
          className="skip-btn"
          onClick={handleSubmitLogin}
        >
          跳过
        </Button>
      </View>
    )
  }

  return (
    <View className="login-page">
      <Button 
        className="login-btn" 
        type="primary"
        onClick={handleStartLogin}
      >
        微信登录
      </Button>
    </View>
  )
}
```

## 🔄 登录态管理

### 自动刷新

```typescript
import { authService } from '@/services/authService'

// 检查是否需要刷新
if (authService.shouldRefreshToken()) {
  await authService.refreshToken()
}
```

### 退出登录

```typescript
import { authService } from '@/services/authService'

authService.logout()
```

## ⚠️ 注意事项

### 1. 头像昵称填写组件的限制

- `button open-type="chooseAvatar"` 只能在用户点击时触发
- 不能在异步操作后调用
- 必须是真实的用户交互

### 2. 登录态有效期

- 默认有效期：2小时
- 建议在即将过期前 5 分钟自动刷新
- 过期后需要重新登录

### 3. 后端接口

- 登录接口：`POST /api/auth/auth/login/`
- 刷新接口：`POST /api/auth/auth/refresh/`
- 用户信息：`GET /api/auth/users/me/`

### 4. 测试环境

- 开发环境：`https://therianclouds.mynatapp.cc`
- AppID：`wxd2242c9f02a34685`

## 📚 相关文档

- [微信官方文档 - wx.login](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/wx.login.html)
- [微信官方文档 - 头像昵称填写](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/userProfile.html)
- [后端接口文档](../微信登录接口文档.md)

## 🐛 常见问题

### Q: 为什么不使用 getUserProfile？

A: 微信在 2021 年后废弃了 `getUserProfile`，现在推荐使用头像昵称填写组件。

### Q: 如何获取用户手机号？

A: 使用 `button open-type="getPhoneNumber"`，需要企业认证的小程序。

### Q: 登录失败怎么办？

A: 检查以下几点：
1. 网络连接是否正常
2. 后端服务是否启动
3. AppID 和 AppSecret 是否正确配置
4. code 是否已过期（5分钟有效期）

### Q: 如何在开发环境测试？

A: 
1. 确保后端服务运行在 `https://therianclouds.mynatapp.cc`
2. 在微信开发者工具中打开项目
3. 点击登录按钮即可测试

---

**最后更新**: 2024-12-04
