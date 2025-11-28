# Mock 模式使用指南

## 概述

为了方便开发测试，项目已配置为使用 Mock 数据模式，所有 API 调用都会使用本地模拟数据，不会访问真实后端服务。

## 已启用 Mock 的服务

### 1. 珠子服务 (beadService)
- **文件**: `src/services/beadService.ts`
- **Mock 实现**: `src/services/mockBeadService.ts`
- **功能**:
  - 获取珠子列表（10个测试珠子）
  - 获取珠子分类（10个分类）
  - 获取珠子详情
  - 支持分类筛选和关键词搜索

### 2. 购物车服务 (cartService)
- **文件**: `src/services/cartService.ts`
- **Mock 实现**: `src/services/mockCartService.ts`
- **功能**:
  - 添加手串到购物车
  - 获取购物车列表
  - 更新购物车项
  - 删除购物车项
  - 清空购物车
- **存储**: 使用 localStorage 本地存储

## 圆形画布布局

### 修改内容
- **文件**: `src/components/DesignCanvas/index.tsx`
- **改进**: 珠子现在以圆形排列，而不是线性排列
- **特性**:
  - 珠子沿圆形轨迹均匀分布
  - 圆形半径根据珠子数量动态调整
  - 从顶部开始顺时针排列
  - 保留了选中、拖拽等交互功能

### 样式更新
- **文件**: `src/components/DesignCanvas/index.scss`
- **新增**: `.design-canvas__beads--circle` 样式
- **效果**: 渐变背景、圆形边框、内圈装饰

## 如何切换到真实 API

当后端服务准备好后，可以通过以下步骤切换到真实 API：

### 1. 珠子服务
编辑 `src/services/beadService.ts`:
```typescript
// 将 USE_MOCK 改为 false
const USE_MOCK = false
```

### 2. 购物车服务
编辑 `src/services/cartService.ts`:
```typescript
// 将 USE_MOCK 改为 false
const USE_MOCK = false
```

## 测试数据说明

### 珠子数据
- 共 10 个测试珠子
- 包含：紫水晶、粉晶、黑曜石、白水晶、黄水晶、绿幽灵、红玛瑙、虎眼石、月光石、青金石
- 所有珠子使用同一张测试图片：`/assets/crystal_test.png`
- 价格范围：¥8.00 - ¥25.00
- 直径范围：6mm - 10mm

### 购物车数据
- 存储在浏览器 localStorage
- 键名：`mock_cart_items`
- 自动计算手串总价、总重量、珠子数量

## 注意事项

1. **图片路径**: 确保 `src/assets/crystal_test.png` 文件存在
2. **本地存储**: Mock 购物车数据存储在 localStorage，清除浏览器数据会丢失
3. **网络延迟**: Mock 服务模拟了 200-300ms 的网络延迟，使体验更真实
4. **错误处理**: Mock 服务包含基本的错误处理和验证逻辑

## 开发建议

1. 在 Mock 模式下完成 UI 和交互开发
2. 确保所有功能在 Mock 模式下正常工作
3. 后端 API 准备好后，逐个服务切换到真实 API
4. 保留 Mock 服务代码，方便后续测试和演示
