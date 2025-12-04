# 订单接口对接文档

## 接口信息

### 基础信息
- **接口地址**: `http://121.43.104.161:6011/api/diy/orders/`
- **请求方式**: GET
- **认证方式**: API Key
- **必需请求头**:
  - `X-API-Key: 123quant-speed`

## 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认为 1 |
| status | string | 否 | 订单状态筛选 (pending/paid/shipped/completed/cancelled) |

## 响应格式

### 成功响应 (200)

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "user": 2,
      "total_price": "60.00",
      "status": "pending",
      "shipping_address": {
        "title": "云南省昆明市寻甸县客运站"
      },
      "order_items": [
        {
          "id": 1,
          "cart_item": {
            "id": 1,
            "user": 2,
            "bracelet": {
              "id": 3,
              "user": 2,
              "name": "绿水晶串串",
              "bracelet_beads": [
                {
                  "id": 5,
                  "bead": {
                    "id": 2,
                    "name": "黑曜石",
                    "category": "黑曜石",
                    "image_url": "https://example.com/bead2.jpg",
                    "price": "15.00",
                    "weight": "6.00",
                    "diameter": "10.00",
                    "stock": 100,
                    "description": "黑色黑曜石珠"
                  },
                  "position": 5
                }
              ]
            },
            "properties": {
              "id": 1,
              "name": "爱情绝唱",
              "price": "58.00"
            },
            "added_at": "2025-12-03T16:37:43"
          },
          "price": "8966.00"
        }
      ],
      "created_at": "2025-12-03T16:34:25",
      "paid_at": null,
      "shipped_at": null,
      "tracking_number": null
    }
  ]
}
```

## 数据字段说明

### 订单对象 (Order)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 订单 ID |
| user | number | 用户 ID |
| total_price | string | 订单总价 |
| status | string | 订单状态 |
| shipping_address | string/object | 收货地址 |
| order_items | array | 订单项列表 |
| created_at | string | 创建时间 (ISO 8601) |
| paid_at | string/null | 支付时间 |
| shipped_at | string/null | 发货时间 |
| tracking_number | string/null | 物流单号 |

### 订单项对象 (OrderItem)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 订单项 ID |
| cart_item | object | 购物车项信息 |
| price | string | 订单项价格 |

### 订单状态 (Status)

| 状态值 | 说明 |
|--------|------|
| pending | 待支付 |
| paid | 已支付 |
| shipped | 已发货 |
| completed | 已完成 |
| cancelled | 已取消 |

## 前端实现

### 1. API 配置

已在 `src/constants/api.ts` 中配置：

```typescript
ORDERS: '/orders/',
ORDER_DETAIL: (id: string) => `/orders/${id}/`,
```

### 2. 数据转换

在 `src/api/endpoints.ts` 中实现了数据格式转换：

- 将后端的 snake_case 字段转换为前端的 camelCase
- 将字符串类型的价格转换为数字
- 将 ISO 8601 时间字符串转换为时间戳
- 处理收货地址的不同格式（字符串或对象）

### 3. 使用示例

```typescript
import { useOrderStore } from '@/stores/useOrderStore'

function OrderListPage() {
  const { orders, loading, loadOrders } = useOrderStore()
  
  useEffect(() => {
    // 加载所有订单
    loadOrders()
    
    // 或者加载指定状态的订单
    // loadOrders(OrderStatus.PENDING)
  }, [])
  
  return (
    <View>
      {orders.map(order => (
        <View key={order.id}>
          <Text>订单号: {order.id}</Text>
          <Text>总价: {order.totalPrice}</Text>
          <Text>状态: {order.status}</Text>
        </View>
      ))}
    </View>
  )
}
```

## 注意事项

1. **认证方式**: 当前使用 API Key 认证，不需要用户登录
2. **分页**: 后端使用 Django REST framework 的分页格式
3. **地址格式**: `shipping_address` 可能是字符串或对象，需要兼容处理
4. **时间格式**: 后端返回 ISO 8601 格式，前端转换为时间戳
5. **价格格式**: 后端返回字符串，前端转换为数字

## 测试

可以使用以下命令测试接口：

```bash
curl -X 'GET' \
  'http://121.43.104.161:6011/api/diy/orders/?page=1' \
  -H 'accept: application/json' \
  -H 'X-API-Key: 123quant-speed'
```

## 更新日志

- 2025-12-03: 完成订单列表接口对接
  - 接口地址: `http://121.43.104.161:6011/api/diy/orders/`
  - 更新 API 端点配置
  - 实现数据格式转换
  - 适配 Django REST framework 分页格式
  - 处理订单状态映射
  - 支持手串名称字段 (bracelet.name)
  - 兼容不同格式的收货地址
