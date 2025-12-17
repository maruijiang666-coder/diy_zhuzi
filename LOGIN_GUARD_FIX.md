# 登录守卫修复说明

## 问题原因

之前在 `src/app.ts` 中使用 `useDidShow` 实现全局路由守卫，但这个钩子在 TabBar 页面切换时不会触发，导致未登录用户点击 TabBar 时没有显示登录提示。

## 解决方案

在每个受保护的页面中使用 `Taro.useDidShow()` 钩子，在页面显示时检查登录状态。

## 修改的文件

### 1. src/pages/diy/index.tsx
- 添加 `Taro.useDidShow()` 钩子
- 检查登录状态，未登录时显示对话框

### 2. src/pages/cart/index.tsx
- 添加 `Taro.useDidShow()` 钩子
- 检查登录状态，未登录时显示对话框

### 3. src/pages/designs/index.tsx
- 添加 `Taro.useDidShow()` 钩子
- 检查登录状态，未登录时显示对话框

### 4. src/pages/order/list/index.tsx
- 添加 `Taro.useDidShow()` 钩子
- 检查登录状态，未登录时显示对话框

### 5. src/pages/order/detail/index.tsx
- 添加 `Taro.useDidShow()` 钩子
- 检查登录状态，未登录时显示对话框

### 6. src/pages/order/confirm/index.tsx
- 添加 `Taro.useDidShow()` 钩子
- 检查登录状态，未登录时显示对话框

## 实现逻辑

```typescript
Taro.useDidShow(() => {
  // 检查登录状态
  const { authService } = require('../../services/authService')
  const isLoggedIn = authService.isLoggedIn()
  
  if (!isLoggedIn) {
    console.log('页面需要登录')
    Taro.showModal({
      title: '需要登录',
      content: '访问此页面需要先登录，是否前往登录？',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 用户点击"去登录"
          Taro.switchTab({
            url: '/pages/profile/index'
          })
        } else {
          // 用户点击"取消"
          // TabBar 页面：跳转到个人中心
          // 非 TabBar 页面：返回上一页或跳转到个人中心
          Taro.navigateBack().catch(() => {
            Taro.switchTab({
              url: '/pages/profile/index'
            })
          })
        }
      }
    })
    return
  }
  
  // 已登录，执行正常的页面逻辑
  // ...
})
```

## 用户交互流程

### TabBar 页面（DIY、购物车）
1. 未登录用户点击 TabBar
2. 页面开始加载
3. `useDidShow` 触发，检测到未登录
4. 显示对话框："访问此页面需要先登录，是否前往登录？"
5. 用户选择：
   - **去登录**：跳转到个人中心
   - **取消**：跳转到个人中心（因为 TabBar 页面无法返回）

### 非 TabBar 页面（订单列表、订单详情等）
1. 未登录用户访问页面
2. 页面开始加载
3. `useDidShow` 触发，检测到未登录
4. 显示对话框："访问此页面需要先登录，是否前往登录？"
5. 用户选择：
   - **去登录**：跳转到个人中心
   - **取消**：返回上一页（如果有），否则跳转到个人中心

## 测试步骤

### 测试 1：未登录点击 DIY 设计
```
1. 退出登录
2. 点击底部 TabBar 的"DIY设计"
3. 应该看到对话框提示
4. 点击"去登录"，跳转到个人中心
```

### 测试 2：未登录点击购物车
```
1. 退出登录
2. 点击底部 TabBar 的"购物车"
3. 应该看到对话框提示
4. 点击"取消"，跳转到个人中心
```

### 测试 3：未登录访问订单列表
```
1. 退出登录
2. 通过其他方式访问订单列表页面
3. 应该看到对话框提示
4. 点击"取消"，返回上一页
```

## 技术要点

### 1. 为什么使用 require 而不是 import？
在 `useDidShow` 钩子中使用 `require` 动态导入，避免循环依赖和模块加载问题。

### 2. 为什么每个页面都要添加？
因为 `useDidShow` 在 App 组件中不会在 TabBar 切换时触发，必须在每个页面组件中单独添加。

### 3. 为什么 TabBar 页面取消时也跳转到个人中心？
TabBar 页面无法使用 `navigateBack()`，所以取消时也跳转到个人中心，保证用户不会卡在某个页面。

### 4. 为什么非 TabBar 页面可以返回？
非 TabBar 页面可以使用 `navigateBack()`，给用户更好的体验，让他们可以返回到之前的页面。

## 注意事项

1. **保留 app.ts 中的守卫**：虽然 TabBar 切换时不触发，但在应用启动和其他场景下仍然有用
2. **双重保护**：页面级守卫 + 操作级守卫，确保安全性
3. **用户体验**：给用户选择的权利，不强制跳转
4. **错误处理**：使用 `.catch()` 处理跳转失败的情况

## 后续优化建议

1. 可以将登录检查逻辑提取为一个公共的 Hook
2. 可以添加页面加载动画，避免闪烁
3. 可以记录用户尝试访问的页面，登录后自动跳转回去
