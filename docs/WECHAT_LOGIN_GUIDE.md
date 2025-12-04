# 微信登录实现指南

## 概述

本项目使用微信官方提供的登录 API 实现用户认证，完全遵循微信小程序官方文档的标准流程。

## 登录流程

### 1. 用户触发登录

用户在个人中心页面点击"微信登录"按钮。

### 2. 获取用户信息（必须先调用）

调用 `wx.getUserProfile()` 获取用户信息：

```typescript
const profileResult = await Taro.getUserProfile({
  desc: '用于完善用户资料',
})
const userInfo = profileResult.userInfo
```

**特点**：
- 需要用户主动授权
- 会弹出授权弹窗
- 获取用户头像、昵称等信息
- **必须在用户点击事件中直接调用**，不能在异步操作之后调用

**重要**：必须先调用 `getUserProfile`，再调用 `login`，否则会报错：
```
getUserProfile:fail can only be invoked by user TAP gesture.
```

### 3. 获取登录凭证

调用 `wx.login()` 获取临时登录凭证 code：

```typescript
const loginResult = await Taro.login()
const code = loginResult.code
```

**特点**：
- 静默执行，无需用户授权
- 不会弹出授权弹窗
- code 有效期 5 分钟
- 用于后端换取 openid 和 session_key

### 4. 发送到后端

将 code 发送到后端服务器：

```typescript
const response = await authApi.wechatLogin({
  code: loginResult.code,
  app_type: 'diy',
})
```

### 5. 后端处理

后端使用 code 调用微信接口：

```
GET https://api.weixin.qq.com/sns/jscode2session
参数：
  - appid: 小程序 appid
  - secret: 小程序 secret
  - js_code: 前端传来的 code
  - grant_type: authorization_code
```

后端获取到：
- openid: 用户唯一标识
- session_key: 会话密钥
- unionid: 用户在开放平台的唯一标识（可选）

### 6. 返回 token

后端生成 token 并返回给前端：

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "nickname": "微信用户",
    "avatar": "https://..."
  }
}
```

### 7. 保存 token

前端保存 token 到本地存储：

```typescript
Taro.setStorageSync('auth_token', token)
```

## 代码实现

### authService.ts

```typescript
class AuthService {
  async wechatLogin(): Promise<{
    token: string
    user: {
      id: string
      nickname: string
      avatar: string
    }
  }> {
    // 1. 先获取用户信息（必须在用户点击事件中直接调用）
    const profileResult = await Taro.getUserProfile({
      desc: '用于完善用户资料',
    })
    
    // 2. 再获取 code
    const loginResult = await Taro.login()
    
    // 3. 发送到后端
    const response = await authApi.wechatLogin({
      code: loginResult.code,
      app_type: 'diy',
    })
    
    // 4. 保存 token
    saveToken(response.token)
    
    return response
  }
}
```

### profile/index.tsx

```typescript
const handleWechatLogin = async () => {
  try {
    Taro.showLoading({ title: '登录中...', mask: true })
    
    await login() // 调用 authService.wechatLogin()
    
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

## 错误处理

### 用户拒绝授权

```typescript
if (error.errMsg && error.errMsg.includes('getUserProfile:fail auth deny')) {
  throw new Error('您拒绝了授权，无法登录')
}
```

### 网络错误

```typescript
catch (error) {
  console.error('登录失败:', error)
  throw error
}
```

## 注意事项

### 1. getUserProfile 必须由用户点击直接触发

`wx.getUserProfile()` 必须在用户点击事件中**直接调用**，不能在异步操作之后调用。

**正确**：
```typescript
// ✅ 在点击事件中直接调用
const handleLogin = async () => {
  // 先调用 getUserProfile
  const profile = await Taro.getUserProfile({ desc: '...' })
  // 再调用其他异步操作
  const login = await Taro.login()
}

<Button onClick={handleLogin}>微信登录</Button>
```

**错误**：
```typescript
// ❌ 在异步操作之后调用
const handleLogin = async () => {
  const login = await Taro.login() // 异步操作
  const profile = await Taro.getUserProfile({ desc: '...' }) // 错误！
}

// ❌ 在 useEffect 中自动调用
useEffect(() => {
  Taro.getUserProfile({ desc: '...' })
}, [])
```

### 2. 域名配置

开发阶段：
- 在微信开发者工具中关闭域名校验
- 详情 → 本地设置 → 不校验合法域名

生产环境：
- 必须配置 HTTPS 域名
- 在微信公众平台配置 request 合法域名

### 3. code 有效期

- code 有效期只有 5 分钟
- 每次登录都需要重新获取
- code 只能使用一次

### 4. session_key 管理

- session_key 由后端管理
- 前端不需要处理 session_key
- 用于解密用户敏感数据

## 测试

### 开发者工具测试

1. 关闭域名校验
2. 点击登录按钮
3. 查看控制台日志
4. 确认 token 保存成功

### 真机测试

1. 使用真机预览
2. 点击登录按钮
3. 授权后查看用户信息
4. 确认登录状态

## 参考文档

- [wx.login](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/wx.login.html)
- [wx.getUserProfile](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/user-info/wx.getUserProfile.html)
- [小程序登录](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html)
- [code2Session](https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/code2Session.html)

## 常见问题

### Q: 为什么要先调用 getUserProfile 再调用 login？

A: 因为 `getUserProfile` 必须在用户点击事件中直接调用，不能在异步操作之后调用。如果先调用 `login`（异步操作），再调用 `getUserProfile`，会失去用户点击的上下文，导致报错：
```
getUserProfile:fail can only be invoked by user TAP gesture.
```

### Q: code 会过期吗？

A: 会的，code 有效期只有 5 分钟，且只能使用一次。但这不影响我们的流程，因为我们在获取 code 后立即发送到后端。

### Q: 用户拒绝授权怎么办？

A: 如果用户拒绝授权，会抛出错误，前端会显示"您拒绝了授权，无法登录"的提示。用户需要重新点击登录按钮并同意授权。

## 更新日志

- 2025-12-03: 修复 getUserProfile 调用顺序问题
  - 调整为先调用 getUserProfile，再调用 login
  - 避免 "can only be invoked by user TAP gesture" 错误
  - 更新文档说明调用顺序的重要性

- 2025-12-03: 移除测试用户逻辑，使用真实微信登录
  - 移除 createTestUser、getTestUser、isTestUserMode 方法
  - 简化登录流程，直接使用微信 API
  - 移除测试模式相关的 UI 提示
  - 所有错误直接抛出，由调用方处理
