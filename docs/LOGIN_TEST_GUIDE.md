# 微信登录功能测试指南

## 🧪 测试准备

### 1. 确认后端服务运行

```bash
# 检查后端服务是否可访问
curl https://therianclouds.mynatapp.cc/api/auth/auth/login/
```

### 2. 确认前端配置

检查 `src/constants/config.ts`：

```typescript
export const API_BASE_URL = 'https://therianclouds.mynatapp.cc/api/diy'
```

检查 `src/constants/api.ts`：

```typescript
WECHAT_LOGIN: '/auth/auth/login/',  // ✅ 正确
USER_INFO: '/auth/users/me/',       // ✅ 正确
```

### 3. 启动开发服务器

```bash
npm run dev:weapp
```

## 📱 测试步骤

### 测试 1: 基础登录流程

1. **打开微信开发者工具**
   - 导入项目：选择 `dist` 目录
   - AppID：`wxd2242c9f02a34685`

2. **进入个人中心页面**
   - 点击底部 TabBar 的"我的"

3. **点击登录按钮**
   - 应该显示"登录中..."加载提示
   - 查看控制台日志

4. **预期结果**
   ```
   === 开始微信登录流程 ===
   步骤1: 调用 wx.login() 获取 code...
   ✓ 获取到 code: 081xxxxx
   步骤2: 发送登录请求到后端...
   请求参数: { code: "081xxxxx", app_type: "diy" }
   ✓ 后端登录响应: { login_token: "...", expires_at: "...", user: {...} }
   ✓ login_token 已保存到本地存储
   ✓ 登录成功，用户信息: { id: "1", nickname: "微信用户", avatar: "..." }
   === 微信登录流程完成 ===
   ```

5. **验证登录状态**
   - 页面应显示用户信息
   - 显示"我的设计"和"我的订单"菜单
   - 显示"退出登录"按钮

### 测试 2: 登录态持久化

1. **关闭小程序**
   - 在微信开发者工具中关闭

2. **重新打开小程序**
   - 再次打开项目

3. **预期结果**
   - 应该自动保持登录状态
   - 无需重新登录

### 测试 3: 退出登录

1. **点击"退出登录"按钮**
   - 确认退出

2. **预期结果**
   - 返回未登录状态
   - 显示登录按钮

### 测试 4: 登录态过期

1. **修改本地存储的过期时间**
   ```javascript
   // 在控制台执行
   wx.setStorageSync('token_expires_at', '2020-01-01T00:00:00')
   ```

2. **刷新页面或重新进入**

3. **预期结果**
   - 应该提示登录态已过期
   - 自动跳转到登录页面

## 🔍 调试技巧

### 1. 查看控制台日志

所有 API 请求都会输出详细日志：

```
=== API 请求详情 ===
URL: https://therianclouds.mynatapp.cc/api/auth/auth/login/
Method: POST
Headers: { ... }
Data: { "code": "081xxxxx", "app_type": "diy" }

=== API 响应详情 ===
Status: 200
Data: { "code": 0, "message": "登录成功", "data": { ... } }
```

### 2. 查看本地存储

```javascript
// 在控制台执行
console.log('Token:', wx.getStorageSync('auth_token'))
console.log('过期时间:', wx.getStorageSync('token_expires_at'))
```

### 3. 手动测试 API

使用 curl 测试后端接口：

```bash
# 获取 code（需要在小程序中获取）
# 在小程序控制台执行：
wx.login({ success: (res) => console.log(res.code) })

# 使用 code 登录
curl -X POST https://therianclouds.mynatapp.cc/api/auth/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "code": "你的code",
    "app_type": "diy"
  }'
```

## ⚠️ 常见问题排查

### 问题 1: 登录失败 - code 无效

**错误信息**: `"code无效（code只能使用一次）"`

**原因**: 
- code 已被使用
- code 已过期（5分钟有效期）

**解决方案**:
1. 确保每次登录都调用 `wx.login()` 获取新 code
2. 不要缓存 code
3. 不要重复使用同一个 code

### 问题 2: 登录失败 - 应用类型不存在

**错误信息**: `"应用类型 diy 不存在或未启用"`

**原因**: 后端数据库中没有 DIY 应用配置

**解决方案**:
```bash
# 在后端项目目录执行
python init_wechat_apps.py
```

### 问题 3: 登录失败 - 网络错误

**错误信息**: `"网络请求失败"`

**原因**:
- 后端服务未启动
- 网络连接问题
- URL 配置错误

**解决方案**:
1. 检查后端服务是否运行
2. 检查 `src/constants/config.ts` 中的 URL
3. 在微信开发者工具中检查网络请求

### 问题 4: 登录成功但没有用户信息

**错误信息**: 无错误，但用户信息为空

**原因**: 后端返回的数据格式不符合预期

**解决方案**:
1. 查看控制台日志中的响应数据
2. 检查 `src/api/endpoints.ts` 中的数据转换逻辑
3. 确认后端返回格式符合接口文档

### 问题 5: AppID 或 AppSecret 错误

**错误信息**: `"AppID无效"` 或 `"AppSecret无效"`

**原因**: 微信小程序配置不正确

**解决方案**:
1. 登录微信公众平台: https://mp.weixin.qq.com/
2. 检查 AppID 和 AppSecret
3. 更新后端 `.env` 文件
4. 重新运行 `python init_wechat_apps.py`

## 📊 测试检查清单

- [ ] 后端服务正常运行
- [ ] 前端 API 地址配置正确
- [ ] 可以成功调用 `wx.login()` 获取 code
- [ ] 可以成功发送登录请求到后端
- [ ] 后端返回正确的登录态 token
- [ ] token 正确保存到本地存储
- [ ] 登录后显示用户信息
- [ ] 关闭重开后保持登录状态
- [ ] 可以正常退出登录
- [ ] 登录态过期后自动跳转登录页

## 🎯 性能测试

### 测试登录速度

```javascript
// 在控制台执行
console.time('登录耗时')
await authService.wechatLogin()
console.timeEnd('登录耗时')
```

**预期结果**: 
- 正常情况：1-3 秒
- 网络较慢：3-5 秒
- 超过 10 秒：需要检查网络或后端性能

## 📝 测试报告模板

```markdown
## 测试报告

**测试时间**: 2024-12-04 20:00:00
**测试环境**: 微信开发者工具
**后端地址**: https://therianclouds.mynatapp.cc

### 测试结果

| 测试项 | 结果 | 备注 |
|--------|------|------|
| 基础登录 | ✅ 通过 | 耗时 2.3s |
| 登录态持久化 | ✅ 通过 | - |
| 退出登录 | ✅ 通过 | - |
| 登录态过期 | ✅ 通过 | 正确跳转 |

### 问题记录

1. 无

### 建议

1. 登录速度正常
2. 功能符合预期
```

---

**最后更新**: 2024-12-04
