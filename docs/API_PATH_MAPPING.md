# API 路径映射文档

## 📋 概述

后端 API 分为两个主要模块：
1. **认证模块** (`/api/auth`) - 用户登录、认证相关
2. **DIY业务模块** (`/api/diy`) - 珠子、购物车、订单等业务功能

## 🔧 配置说明

### API 基础地址

**文件**: `src/constants/config.ts`

```typescript
export const API_BASE_URL = 'https://therianclouds.mynatapp.cc/api'
```

**注意**: 
- 基础地址只到 `/api`
- 具体的模块路径（`/auth` 或 `/diy`）在端点中定义

## 📊 API 端点映射表

### 认证相关 API

| 功能 | 前端端点 | 完整 URL | 后端实际路径 | 状态 |
|------|---------|----------|-------------|------|
| 微信登录 | `/auth/wx/get_openid/` | `https://crystal.quant-speed.com/api/auth/wx/get_openid/` | ✅ 匹配 | ✅ |
| 验证登录态 | `/auth/auth/validate/` | `https://therianclouds.mynatapp.cc/api/auth/auth/validate/` | ✅ 匹配 | ✅ |
| 刷新登录态 | `/auth/auth/refresh/` | `https://therianclouds.mynatapp.cc/api/auth/auth/refresh/` | ✅ 匹配 | ✅ |
| 登出 | `/auth/auth/logout/` | `https://therianclouds.mynatapp.cc/api/auth/auth/logout/` | ✅ 匹配 | ✅ |
| 用户信息 | `/auth/users/me/` | `https://therianclouds.mynatapp.cc/api/auth/users/me/` | ✅ 匹配 | ✅ |

### DIY 业务相关 API

| 功能 | 前端端点 | 完整 URL | 后端实际路径 | 状态 |
|------|---------|----------|-------------|------|
| 珠子列表 | `/diy/beads/` | `https://therianclouds.mynatapp.cc/api/diy/beads/` | ✅ 匹配 | ✅ |
| 珠子分类 | `/diy/beads/categories/` | `https://therianclouds.mynatapp.cc/api/diy/beads/categories/` | ✅ 匹配 | ✅ |
| 珠子详情 | `/diy/beads/:id/` | `https://therianclouds.mynatapp.cc/api/diy/beads/1/` | ✅ 匹配 | ✅ |
| 购物车列表 | `/diy/cart/items/` | `https://therianclouds.mynatapp.cc/api/diy/cart/items/` | ✅ 匹配 | ✅ |
| 购物车详情 | `/diy/cart/items/:id/` | `https://therianclouds.mynatapp.cc/api/diy/cart/items/1/` | ✅ 匹配 | ✅ |
| 订单列表 | `/diy/orders/` | `https://therianclouds.mynatapp.cc/api/diy/orders/` | ✅ 匹配 | ✅ |
| 订单详情 | `/diy/orders/:id/` | `https://therianclouds.mynatapp.cc/api/diy/orders/1/` | ✅ 匹配 | ✅ |
| 订单支付 | `/diy/orders/:id/pay/` | `https://therianclouds.mynatapp.cc/api/diy/orders/1/pay/` | ✅ 匹配 | ✅ |
| 手串列表 | `/diy/bracelets/` | `https://therianclouds.mynatapp.cc/api/diy/bracelets/` | ✅ 匹配 | ✅ |
| 手串详情 | `/diy/bracelets/:id/` | `https://therianclouds.mynatapp.cc/api/diy/bracelets/1/` | ✅ 匹配 | ✅ |

## 🔍 URL 构建逻辑

### 示例 1: 微信登录

```typescript
// 配置
API_BASE_URL = 'https://therianclouds.mynatapp.cc/api'
WECHAT_LOGIN = '/auth/wx/get_openid/'

// 构建完整 URL
const fullUrl = API_BASE_URL + WECHAT_LOGIN
// 结果: https://crystal.quant-speed.com/api/auth/wx/get_openid/
```

### 示例 2: 珠子列表

```typescript
// 配置
API_BASE_URL = 'https://therianclouds.mynatapp.cc/api'
BEADS = '/diy/beads/'

// 构建完整 URL
const fullUrl = API_BASE_URL + BEADS
// 结果: https://therianclouds.mynatapp.cc/api/diy/beads/
```

## 📝 修改记录

### 2024-12-04 - 修正 API 路径

**问题**:
- 之前: `API_BASE_URL = '.../api/diy'`
- 登录接口: `/auth/wx/get_openid/`
- 完整URL: `.../api/diy/auth/wx/get_openid/` ❌ 错误

**修正**:
- 现在: `API_BASE_URL = '.../api'`
- 登录接口: `/auth/wx/get_openid/`
- 完整URL: `.../api/auth/wx/get_openid/` ✅ 正确

**影响范围**:
- ✅ 认证相关 API 路径正确
- ✅ DIY 业务 API 路径正确（添加了 `/diy` 前缀）

## 🧪 测试验证

### 1. 测试登录接口

```bash
curl -X POST https://crystal.quant-speed.com/api/auth/wx/get_openid/ \
  -H "Content-Type: application/json" \
  -d '{
    "code": "test_code",
    "app_type": "diy"
  }'
```

**预期响应**:
```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "openid": "...",
    "expires_at": "...",
    "user": {...}
  }
}
```

### 2. 测试珠子列表接口

```bash
curl https://therianclouds.mynatapp.cc/api/diy/beads/
```

**预期响应**:
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [...]
}
```

## 🔧 开发工具验证

### 在微信开发者工具控制台

```javascript
// 测试登录接口
wx.request({
  url: 'https://crystal.quant-speed.com/api/auth/wx/get_openid/',
  method: 'POST',
  data: { code: 'test', app_type: 'diy' },
  success: (res) => console.log('登录接口:', res),
  fail: (err) => console.log('失败:', err)
})

// 测试珠子列表接口
wx.request({
  url: 'https://therianclouds.mynatapp.cc/api/diy/beads/',
  success: (res) => console.log('珠子列表:', res),
  fail: (err) => console.log('失败:', err)
})
```

## 📚 相关文档

- [微信登录接口文档](../微信登录接口文档.md)
- [后端 Swagger 文档](https://therianclouds.mynatapp.cc/docs/swagger/)
- [API 配置文件](../src/constants/config.ts)
- [API 端点文件](../src/constants/api.ts)

## ⚠️ 注意事项

### 1. 域名配置

确保在微信开发者工具中：
- ✅ 勾选"不校验合法域名"（开发环境）
- ✅ 或在微信公众平台配置域名（生产环境）

### 2. 环境变量

当前使用 `development` 环境：
```typescript
process.env.NODE_ENV = 'development'
API_BASE_URL = 'https://therianclouds.mynatapp.cc/api'
```

### 3. 路径规范

- ✅ 所有路径以 `/` 开头
- ✅ 所有路径以 `/` 结尾
- ✅ 使用小写字母和连字符
- ✅ RESTful 风格

---

**最后更新**: 2024-12-04
**当前基础地址**: `https://therianclouds.mynatapp.cc/api`
