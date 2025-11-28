# 测试用户模式

## 功能说明

当用户点击"微信登录"时，如果遇到网络错误或API错误，系统会自动切换到测试用户模式，使用本地数据进行开发和测试。

## 触发条件

测试用户模式会在以下情况下自动启用：

1. **网络错误**
   - 网络连接失败
   - 请求超时
   - DNS解析失败

2. **API错误**
   - 后端服务不可用
   - 接口返回错误
   - 微信登录失败

3. **开发环境**
   - 任何登录失败都会fallback到测试用户

## 测试用户信息

```typescript
{
  id: 'test_user_001',
  nickname: '测试用户',
  avatar: 'https://img.icons8.com/clouds/200/user.png',
  token: 'test_token_[timestamp]'
}
```

## 功能特性

### 1. 自动切换
- 登录失败时自动使用测试用户
- 无需手动配置
- 对用户透明

### 2. 本地数据
- 所有数据保存在本地存储
- 设计、购物车、订单都使用本地数据
- 不依赖后端服务

### 3. 视觉提示
- 顶部显示"🧪 测试模式（本地数据）"横幅
- 黄色背景，清晰标识
- 登录成功提示"已使用测试账号登录"

### 4. 数据持久化
- 测试用户数据保存在localStorage
- 刷新页面不会丢失
- 退出登录会清除测试用户数据

## 技术实现

### 存储Key
- `test_user_mode`: 标记是否为测试模式（'true'/'false'）
- `test_user_data`: 测试用户的完整数据（JSON）
- `auth_token`: 测试用户的token

### 核心方法

#### authService.isTestUserMode()
检查当前是否为测试用户模式

```typescript
isTestUserMode(): boolean {
  const isTestMode = Taro.getStorageSync('test_user_mode')
  return isTestMode === 'true'
}
```

#### authService.createTestUser()
创建测试用户并保存到本地

```typescript
private createTestUser() {
  const testUser = {
    token: 'test_token_' + Date.now(),
    user: {
      id: 'test_user_001',
      nickname: '测试用户',
      avatar: 'https://img.icons8.com/clouds/200/user.png',
    },
  }
  
  Taro.setStorageSync('test_user_mode', 'true')
  Taro.setStorageSync('test_user_data', JSON.stringify(testUser))
  saveToken(testUser.token)
  
  return testUser
}
```

#### authService.getTestUser()
获取保存的测试用户数据

```typescript
private getTestUser() {
  const isTestMode = Taro.getStorageSync('test_user_mode')
  if (isTestMode === 'true') {
    const userData = Taro.getStorageSync('test_user_data')
    return userData ? JSON.parse(userData) : null
  }
  return null
}
```

### 登录流程

```
用户点击登录
    ↓
调用微信登录API
    ↓
    ├─ 成功 → 保存真实用户数据
    │         清除测试用户标记
    │
    └─ 失败 → 检测错误类型
              ↓
              创建测试用户
              保存到本地
              显示测试模式提示
```

### 获取用户信息流程

```
调用getUserInfo()
    ↓
检查是否为测试模式
    ↓
    ├─ 是 → 返回本地测试用户数据
    │
    └─ 否 → 调用API获取真实用户数据
              ↓
              ├─ 成功 → 返回用户数据
              │
              └─ 失败 → 创建测试用户
                        返回测试用户数据
```

## 使用场景

### 1. 开发阶段
- 后端服务未就绪
- 本地开发测试
- 快速原型验证

### 2. 网络不稳定
- 用户网络较差
- 服务器维护
- API暂时不可用

### 3. 演示展示
- 无需真实账号
- 快速展示功能
- 离线演示

## 退出测试模式

### 方法1：退出登录
点击"退出登录"按钮，会清除所有测试用户数据

### 方法2：重新登录
如果网络恢复，重新登录会使用真实账号，自动清除测试模式

### 方法3：清除缓存
清除小程序缓存会删除所有本地数据

## 注意事项

1. **数据隔离**
   - 测试用户数据仅保存在本地
   - 不会同步到服务器
   - 清除缓存会丢失数据

2. **功能限制**
   - 无法使用需要服务器的功能（如支付）
   - 订单数据仅为模拟数据
   - 无法跨设备同步

3. **安全性**
   - 测试token仅用于本地验证
   - 不包含真实用户信息
   - 不会泄露隐私数据

4. **开发建议**
   - 生产环境应禁用自动fallback
   - 添加环境变量控制
   - 记录测试模式使用情况

## 未来优化

- [ ] 添加环境变量控制是否启用测试模式
- [ ] 支持多个测试用户切换
- [ ] 测试数据预设模板
- [ ] 测试模式使用统计
- [ ] 一键清除测试数据
