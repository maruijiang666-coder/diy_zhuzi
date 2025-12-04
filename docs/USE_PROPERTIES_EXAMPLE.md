# 如何在其他页面使用手串属性数据

## 概述

手串的四个计算属性（数量、价格、重量、长度）已经实时保存在 `useDiyStore` 中，任何页面都可以直接使用。

## 保存的数据

```typescript
properties: {
  beadCount: number    // 珠子数量
  totalPrice: number   // 总价格（元）
  totalWeight: number  // 总重量（克）
  totalLength: number  // 总长度（毫米）
}
```

## 自动更新时机

这些数据会在以下操作时自动更新：
- ✅ 添加珠子 (`addBead`)
- ✅ 删除珠子 (`removeBead`)
- ✅ 移动珠子 (`moveBead`)
- ✅ 清空手串 (`clearBracelet`)

## 使用示例

### 示例 1：在任意页面显示手串信息

```typescript
import { useDiyStore } from '../../stores/useDiyStore'

export default function MyPage() {
  // 直接从 store 中获取实时数据
  const { properties } = useDiyStore()
  
  return (
    <View>
      <Text>珠子数量：{properties.beadCount}</Text>
      <Text>总价格：¥{properties.totalPrice.toFixed(2)}</Text>
      <Text>总重量：{properties.totalWeight}g</Text>
      <Text>总长度：{properties.totalLength}mm</Text>
    </View>
  )
}
```

### 示例 2：在购物车页面使用

```typescript
import { useDiyStore } from '../../stores/useDiyStore'
import { formatPrice, formatWeight } from '../../utils/formatter'

export default function CartPage() {
  const { properties, bracelet } = useDiyStore()
  
  return (
    <View className='cart-summary'>
      <Text>当前设计：{properties.beadCount} 颗珠子</Text>
      <Text>预计价格：{formatPrice(properties.totalPrice)}</Text>
      <Text>总重量：{formatWeight(properties.totalWeight)}</Text>
    </View>
  )
}
```

### 示例 3：在订单页面使用

```typescript
import { useDiyStore } from '../../stores/useDiyStore'

export default function OrderPage() {
  const { properties } = useDiyStore()
  
  const handleCreateOrder = () => {
    // 使用实时数据创建订单
    const orderData = {
      beadCount: properties.beadCount,
      totalPrice: properties.totalPrice,
      totalWeight: properties.totalWeight,
      // ...
    }
    
    // 提交订单
    createOrder(orderData)
  }
  
  return (
    <View>
      <Text>订单金额：¥{properties.totalPrice}</Text>
      <Button onClick={handleCreateOrder}>提交订单</Button>
    </View>
  )
}
```

### 示例 4：条件渲染

```typescript
import { useDiyStore } from '../../stores/useDiyStore'

export default function CheckoutPage() {
  const { properties } = useDiyStore()
  
  // 根据属性显示不同内容
  if (properties.beadCount === 0) {
    return <Text>请先添加珠子</Text>
  }
  
  if (properties.totalPrice > 1000) {
    return <Text>享受 VIP 折扣！</Text>
  }
  
  return <Text>正常价格：¥{properties.totalPrice}</Text>
}
```

## 注意事项

1. **实时性**：数据会自动更新，无需手动刷新
2. **全局共享**：所有页面看到的都是同一份数据
3. **性能优化**：只在珠子变化时重新计算，不影响性能
4. **类型安全**：TypeScript 提供完整的类型提示

## 数据流向

```
用户操作（添加/删除珠子）
  ↓
useDiyStore 更新 beads 数组
  ↓
自动调用 calculateProperties(newBeads)
  ↓
更新 properties 状态
  ↓
所有使用 properties 的组件自动重新渲染
```

## 与旧方法的对比

### 旧方法（需要调用函数）
```typescript
const properties = getProperties()  // 每次都要调用
```

### 新方法（直接使用）
```typescript
const { properties } = useDiyStore()  // 直接获取，自动更新
```

新方法更简单、更高效！
