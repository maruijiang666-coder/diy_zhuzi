# 退出登录后无法拦截的 Bug 修复

## 问题描述

用户登录后，点击退出登录，然后再进入 DIY 页面或购物车界面时不会弹窗提示。

## 问题原因

1. **异步 vs 同步问题**：`authService.isLoggedIn()` 使用了异步的 `getToken()` 函数，但在同步上下文中调用
2. **Token 清除不完整**：退出登录时只清除了 `auth_token`，但没有清除 `Import_code`
3. **状态检查不准确**：只检查了一个 token 存储位置，实际上有多个位置

## 修复方案

### 1. 修改 `authService.isLoggedIn()` 使用同步方式

**修改前：**
```typescript
isLoggedIn(): boolean {
  try {
    const token = getToken() // 异步函数
    return !!token
  } catch (error) {
    console.error('检查登录状态失败:', error)
    return false
  }
}
```

**修改后：**
```typescript
isLoggedIn(): boolean {
  try {
    // 使用同步方式获取 token
    const token = Taro.getStorageSync('auth_token')
    const importCode = Taro.getStorageSync('Import_code')
    const hasToken = !!(token || importCode)
    console.log('[AuthService] 检查登录状态:', hasToken)
    return hasToken
  } catch (error) {
    console.error('检查登录状态失败:', error)
    return false
  }
}
```

### 2. 修改 `authService.logout()` 清除所有 token

**修改前：**
```typescript
async logout(): Promise<void> {
  await removeToken()
}
```

**修改后：**
```typescript
async logout(): Promise<void> {
  console.log('[AuthService] 开始退出登录，清除所有 token')
  try {
    // 清除所有可能的 token 存储
    await removeToken()
    Taro.removeStorageSync('Import_code')
    Taro.removeStorageSync('token_expires_at')
    console.log('[AuthService] 退出登录成功，所有 token 已清除')
  } catch (error) {
    console.error('[AuthService] 退出登录失败:', error)
    // 即使出错也尝试清除
    try {
      Taro.removeStorageSync('auth_token')
      Taro.removeStorageSync('Import_code')
      Taro.removeStorageSync('token_expires_at')
    } catch (e) {
      console.error('[AuthService] 强制清除 token 失败:', e)
    }
  }
}
```

## 测试步骤

### 测试 1：退出登录后访问 DIY 页面
```
1. 登录账号
2. 点击"退出登录"
3. 确认退出
4. 点击底部 TabBar 的"DIY设计"
5. 预期：显示对话框"访问此页面需要先登录，是否前往登录？"
```

### 测试 2：退出登录后访问购物车
```
1. 登录账号
2. 点击"退出登录"
3. 确认退出
4. 点击底部 TabBar 的"购物车"
5. 预期：显示对话框"访问此页面需要先登录，是否前往登录？"
```

### 测试 3：验证 token 已清除
```
1. 登录账号
2. 在控制台输入：
   console.log('auth_token:', Taro.getStorageSync('auth_token'))
   console.log('Import_code:', Taro.getStorageSync('Import_code'))
3. 点击"退出登录"
4. 再次在控制台输入上述命令
5. 预期：两个 token 都应该为空
```

### 测试 4：多次登录退出
```
1. 登录账号
2. 退出登录
3. 再次登录
4. 再次退出登录
5. 点击"DIY设计"
6. 预期：每次退出后都能正确拦截
```

## 技术细节

### Token 存储位置

项目中使用了两个地方存储 token：
1. `auth_token`：标准的 token 存储位置
2. `Import_code`：用于 API 调用的 token（实际上是 login_token）

### 为什么要检查两个位置？

因为代码中有些地方使用 `auth_token`，有些地方使用 `Import_code`，为了确保登录状态检查的准确性，需要检查两个位置。

### 为什么使用同步方式？

1. `isLoggedIn()` 是一个同步方法，返回 boolean
2. 在 `useDidShow` 等钩子中需要立即获取登录状态
3. 同步方式更简单，避免异步问题

### 为什么要清除多个 token？

1. 确保完全退出登录
2. 避免残留的 token 导致状态不一致
3. 清除过期时间等相关数据

## 调试技巧

### 查看当前登录状态
```javascript
const { authService } = require('./services/authService')
console.log('是否已登录:', authService.isLoggedIn())
```

### 查看所有 token
```javascript
console.log('auth_token:', Taro.getStorageSync('auth_token'))
console.log('Import_code:', Taro.getStorageSync('Import_code'))
console.log('token_expires_at:', Taro.getStorageSync('token_expires_at'))
```

### 手动清除所有 token
```javascript
Taro.removeStorageSync('auth_token')
Taro.removeStorageSync('Import_code')
Taro.removeStorageSync('token_expires_at')
console.log('所有 token 已清除')
```

## 注意事项

1. **退出登录后立即检查**：修改后，退出登录会立即清除所有 token，下次访问受保护页面时会立即拦截
2. **日志输出**：添加了详细的日志输出，方便调试
3. **错误处理**：即使清除 token 失败，也会尝试强制清除
4. **兼容性**：同时检查两个 token 位置，确保兼容性

## 后续优化建议

1. **统一 token 存储**：建议只使用一个位置存储 token，避免混乱
2. **状态同步**：考虑使用事件机制，在退出登录时通知所有页面更新状态
3. **自动刷新**：退出登录后自动刷新当前页面，确保状态更新
