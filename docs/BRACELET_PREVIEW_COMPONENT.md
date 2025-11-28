# 手串预览组件

## 概述

创建了通用的 `BraceletPreview` 组件，完全复制画布的渲染逻辑，确保预览效果与DIY画布完全一致。

## 核心特性

### 1. 完全一致的渲染逻辑
- 复用画布的珠子大小计算算法
- 复用画布的圆形位置计算算法
- 复用画布的缩放系数计算
- 确保预览效果与画布100%一致

### 2. 响应式尺寸
- 支持自定义容器尺寸
- 自动计算圆环半径（容器的1/3）
- 自动计算缩放系数
- 适配不同显示场景

### 3. 精确的珠子排列
- 基于珠子直径计算占据的角度
- 累积角度计算，避免重叠
- 自动缩放以适应圆环
- 保持珠子间距一致

## 组件接口

```typescript
interface BraceletPreviewProps {
  bracelet: Bracelet  // 手串数据
  size?: number       // 容器尺寸（rpx），默认180
}
```

## 使用场景

### 1. 设计列表
```tsx
<BraceletPreview bracelet={design.bracelet} size={180} />
```

### 2. 购物车
```tsx
<BraceletPreview bracelet={item.bracelet} size={180} />
```

### 3. 订单详情
```tsx
<BraceletPreview bracelet={order.bracelet} size={240} />
```

## 渲染算法

### 珠子大小计算
```typescript
const getBeadSize = (bead: Bead): number => {
  const baseSize = 45        // 基准尺寸
  const baseDiameter = 8     // 基准直径
  const beadSize = (bead.diameter / baseDiameter) * baseSize
  return Math.max(40, Math.min(60, beadSize))
}
```

### 缩放系数计算
```typescript
// 计算所有珠子的总周长
const totalBeadCircumference = beadSizes.reduce((sum, s) => sum + s, 0)

// 圆的周长
const circleCircumference = 2 * Math.PI * radius

// 缩放系数：当珠子总周长超过圆周长时才缩放
const scaleFactor = totalBeadCircumference > circleCircumference
  ? (circleCircumference * 0.98) / totalBeadCircumference
  : 1
```

### 位置计算
```typescript
// 累积角度计算
let accumulatedAngle = -Math.PI / 2  // 从顶部开始

for (let i = 0; i < currentIndex; i++) {
  const beadSize = getScaledBeadSize(beads[i])
  const angleForBead = beadSize / radius
  accumulatedAngle += angleForBead
}

// 当前珠子的角度
const currentBeadSize = getScaledBeadSize(beads[currentIndex])
const currentBeadAngle = accumulatedAngle + currentBeadSize / radius / 2

// 计算坐标
const x = centerOffset + radius * Math.cos(currentBeadAngle)
const y = centerOffset + radius * Math.sin(currentBeadAngle)
```

## 样式特点

### 容器
- 渐变背景：`linear-gradient(135deg, #F8F6FF 0%, #FFFFFF 100%)`
- 圆角：`$radius-md`
- 可见溢出：支持珠子边缘显示

### 圆环线条
- 颜色：`rgba(139, 69, 19, 0.4)` - 棕色半透明
- 宽度：`2rpx`
- 位置：居中，使用transform定位

### 珠子
- 圆形：`border-radius: 50%`
- 边框：`2rpx solid rgba(139, 127, 216, 0.2)` - 紫色半透明
- 阴影：`0 2rpx 8rpx rgba(0, 0, 0, 0.1)`
- 旋转：沿圆周方向

## 性能优化

### 1. useMemo缓存
- 缓存尺寸计算结果
- 缓存珠子渲染列表
- 避免不必要的重新计算

### 2. 精确依赖
- 只在bracelet.beads或size变化时重新计算
- 最小化渲染次数

### 3. CSS Transform
- 使用transform定位珠子
- 硬件加速
- 流畅的渲染性能

## 与画布的一致性

### 相同的算法
| 功能 | 画布 | 预览 | 一致性 |
|------|------|------|--------|
| 珠子大小计算 | ✓ | ✓ | 100% |
| 位置计算 | ✓ | ✓ | 100% |
| 缩放系数 | ✓ | ✓ | 100% |
| 圆环半径比例 | ✓ | ✓ | 100% |
| 珠子旋转 | ✓ | ✓ | 100% |

### 视觉效果
- 珠子大小：完全一致
- 珠子间距：完全一致
- 圆环大小：按比例缩放
- 整体布局：完全一致

## 应用页面

### 1. 设计列表 (pages/designs)
- 使用180rpx尺寸
- 显示保存的设计
- 点击可加载到DIY页面

### 2. 购物车 (pages/cart)
- 使用180rpx尺寸
- 显示购物车中的设计
- 点击可编辑设计

### 3. 订单列表 (pages/order/list)
- 可使用更大尺寸
- 显示订单中的设计
- 点击查看订单详情

## 优势

### 1. 代码复用
- 单一渲染逻辑
- 易于维护
- 减少bug

### 2. 视觉一致性
- 预览即所见
- 用户体验好
- 减少困惑

### 3. 灵活性
- 支持任意尺寸
- 适配多种场景
- 易于扩展

## 未来优化

### Canvas截图
- [ ] 使用Canvas API生成真实截图
- [ ] 保存为图片文件
- [ ] 支持分享和下载

### 交互增强
- [ ] 支持缩放查看
- [ ] 支持旋转预览
- [ ] 支持3D效果

### 性能优化
- [ ] 虚拟滚动
- [ ] 懒加载
- [ ] 图片预加载

## 技术细节

### 坐标系统
- 原点：容器左上角
- X轴：向右为正
- Y轴：向下为正
- 角度：从顶部开始，顺时针

### 数学计算
- 使用弧度制
- 三角函数：cos、sin
- 起始角度：-π/2（顶部）

### 边界处理
- 珠子大小限制：40-60rpx
- 缩放系数限制：0-1
- 圆环半径：容器的1/3

## 注意事项

1. **珠子数量**
   - 建议20个以内
   - 过多可能重叠
   - 自动缩放处理

2. **容器尺寸**
   - 最小建议：120rpx
   - 最大建议：400rpx
   - 保持正方形

3. **性能考虑**
   - 大量预览时注意性能
   - 使用虚拟滚动
   - 懒加载图片

4. **兼容性**
   - 支持所有现代浏览器
   - 小程序完全兼容
   - 无需polyfill
