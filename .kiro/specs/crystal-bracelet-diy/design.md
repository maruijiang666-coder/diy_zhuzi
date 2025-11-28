# 设计文档

## 概述

DIY水晶手串商城是一个基于Taro 3.x + React + TypeScript的跨平台小程序前端应用。本设计文档专注于前端实现，后端服务通过统一的RESTful API接口规范进行交互。系统采用组件化架构，将DIY设计器、购物车、订单管理等功能模块化。核心设计理念是提供流畅的交互体验和实时反馈，让用户能够直观地设计个性化手串。

前端技术栈：
- **框架**: Taro 3.x (React语法)
- **语言**: TypeScript
- **状态管理**: Zustand (轻量级状态管理)
- **UI组件**: Taro UI / NutUI (适配小程序)
- **样式**: SCSS + CSS Modules
- **本地存储**: Taro Storage API (离线缓存)
- **网络请求**: Taro.request (封装HTTP客户端)

## 架构

### 前端架构

前端采用分层架构设计：

```
┌─────────────────────────────────────────┐
│         展示层 (Presentation)            │
│  Pages + Components + Hooks             │
├─────────────────────────────────────────┤
│         业务逻辑层 (Business Logic)      │
│  Stores (Zustand) + Services            │
├─────────────────────────────────────────┤
│         数据访问层 (Data Access)         │
│  API Client + Storage Manager           │
├─────────────────────────────────────────┤
│         基础设施层 (Infrastructure)      │
│  Utils + Constants + Types              │
└─────────────────────────────────────────┘
                    ↓ HTTP/HTTPS
┌─────────────────────────────────────────┐
│            后端API服务                   │
│         (由后端团队实现)                 │
└─────────────────────────────────────────┘
```

### 前端目录结构

```
src/
├── pages/                    # 页面
│   ├── diy/                 # DIY设计页面
│   │   ├── index.tsx
│   │   ├── index.scss
│   │   └── index.config.ts
│   ├── cart/                # 购物车页面
│   │   ├── index.tsx
│   │   └── index.scss
│   ├── order/               # 订单相关页面
│   │   ├── list/           # 订单列表
│   │   ├── detail/         # 订单详情
│   │   └── confirm/        # 订单确认
│   └── profile/             # 个人中心
│       ├── index.tsx
│       └── index.scss
├── components/              # 通用组件
│   ├── BeadSelector/        # 珠子选择器
│   │   ├── index.tsx
│   │   └── index.scss
│   ├── DesignCanvas/        # 设计画布
│   │   ├── index.tsx
│   │   └── index.scss
│   ├── PropertyPanel/       # 属性面板
│   │   ├── index.tsx
│   │   └── index.scss
│   ├── BeadItem/            # 珠子项组件
│   │   ├── index.tsx
│   │   └── index.scss
│   └── common/              # 通用UI组件
│       ├── Loading/
│       ├── Empty/
│       └── ErrorBoundary/
├── stores/                  # 状态管理 (Zustand)
│   ├── useDiyStore.ts       # DIY设计状态
│   ├── useCartStore.ts      # 购物车状态
│   ├── useOrderStore.ts     # 订单状态
│   └── useUserStore.ts      # 用户状态
├── services/                # 业务服务层（封装API调用）
│   ├── beadService.ts       # 珠子数据服务
│   ├── cartService.ts       # 购物车服务
│   ├── orderService.ts      # 订单服务
│   └── authService.ts       # 认证服务
├── api/                     # API接口层
│   ├── client.ts            # HTTP客户端封装
│   ├── endpoints.ts         # API端点定义
│   └── interceptors.ts      # 请求/响应拦截器
├── hooks/                   # 自定义Hooks
│   ├── useBeads.ts          # 珠子数据Hook
│   ├── useCart.ts           # 购物车Hook
│   └── useWechatPay.ts      # 微信支付Hook
├── utils/                   # 工具函数
│   ├── calculator.ts        # 计算工具（价格、重量、长度）
│   ├── storage.ts           # 本地存储工具
│   ├── validator.ts         # 验证工具
│   ├── formatter.ts         # 格式化工具
│   └── logger.ts            # 日志工具
├── types/                   # TypeScript类型定义
│   ├── bead.ts              # 珠子相关类型
│   ├── bracelet.ts          # 手串相关类型
│   ├── order.ts             # 订单相关类型
│   ├── api.ts               # API相关类型
│   └── common.ts            # 通用类型
├── constants/               # 常量定义
│   ├── config.ts            # 配置常量
│   ├── api.ts               # API常量
│   └── limits.ts            # 限制常量（如最大珠子数）
└── app.config.ts            # Taro应用配置
```

## 组件和接口

### 核心组件

#### 1. DIY设计页面 (DiyPage)

主页面组件，整合珠子选择器、设计画布和属性面板。

```typescript
interface DiyPageProps {}

interface DiyPageState {
  loading: boolean;
  error: string | null;
}
```

#### 2. 珠子选择器 (BeadSelector)

展示可选珠子列表，支持分类筛选和搜索。

```typescript
interface BeadSelectorProps {
  onBeadClick: (bead: Bead) => void;
  selectedCategory?: string;
}

interface BeadSelectorState {
  beads: Bead[];
  categories: Category[];
  searchKeyword: string;
  loading: boolean;
}
```

#### 3. 设计画布 (DesignCanvas)

显示当前手串设计，支持珠子的选中、删除和拖拽排序。

```typescript
interface DesignCanvasProps {
  bracelet: Bracelet;
  onBeadSelect: (index: number) => void;
  onBeadDelete: (index: number) => void;
  onBeadMove: (fromIndex: number, toIndex: number) => void;
}

interface DesignCanvasState {
  selectedBeadIndex: number | null;
  isDragging: boolean;
}
```

#### 4. 属性面板 (PropertyPanel)

实时显示手串的价格、重量、长度等属性。

```typescript
interface PropertyPanelProps {
  bracelet: Bracelet;
  properties: BraceletProperties;
}

interface BraceletProperties {
  totalPrice: number;
  totalWeight: number;
  totalLength: number;
  beadCount: number;
}
```

### 状态管理接口

#### DIY Store

```typescript
interface DiyStore {
  // 状态
  bracelet: Bracelet;
  selectedBeadIndex: number | null;
  
  // 操作
  addBead: (bead: Bead) => void;
  removeBead: (index: number) => void;
  moveBead: (fromIndex: number, toIndex: number) => void;
  clearBracelet: () => void;
  selectBead: (index: number | null) => void;
  
  // 计算属性
  getProperties: () => BraceletProperties;
  canAddBead: () => boolean;
}
```

#### Cart Store

```typescript
interface CartStore {
  // 状态
  items: CartItem[];
  
  // 操作
  addToCart: (bracelet: Bracelet) => Promise<string>;
  removeFromCart: (itemId: string) => void;
  updateCartItem: (itemId: string, bracelet: Bracelet) => void;
  clearCart: () => void;
  
  // 计算属性
  getTotalPrice: () => number;
  getItemCount: () => number;
}
```

## API接口规范

本节定义前端与后端交互的RESTful API接口规范。所有接口使用JSON格式传输数据。

### 基础配置

- **Base URL**: `https://api.example.com/v1`
- **认证方式**: Bearer Token (微信登录后获取)
- **请求头**:
  ```
  Content-Type: application/json
  Authorization: Bearer {token}
  ```

### 通用响应格式

```typescript
interface ApiResponse<T> {
  code: number;        // 状态码: 0表示成功
  message: string;     // 响应消息
  data: T;            // 响应数据
  timestamp: number;   // 时间戳
}

interface ApiError {
  code: number;
  message: string;
  details?: any;
}
```

### 珠子相关接口

#### 1. 获取珠子列表

```
GET /beads
Query Parameters:
  - category?: string     // 分类筛选
  - keyword?: string      // 搜索关键词
  - page?: number        // 页码，默认1
  - pageSize?: number    // 每页数量，默认20

Response: ApiResponse<{
  beads: Bead[];
  total: number;
  page: number;
  pageSize: number;
}>
```

#### 2. 获取珠子分类

```
GET /beads/categories

Response: ApiResponse<Category[]>

interface Category {
  id: string;
  name: string;
  icon?: string;
}
```

#### 3. 获取珠子详情

```
GET /beads/:id

Response: ApiResponse<Bead>
```

### 购物车相关接口

#### 4. 添加到购物车

```
POST /cart/items
Body: {
  bracelet: {
    beads: string[];  // 珠子ID数组
  }
}

Response: ApiResponse<{
  itemId: string;
  cartItem: CartItem;
}>
```

#### 5. 获取购物车列表

```
GET /cart/items

Response: ApiResponse<CartItem[]>
```

#### 6. 更新购物车项

```
PUT /cart/items/:id
Body: {
  bracelet: {
    beads: string[];
  }
}

Response: ApiResponse<CartItem>
```

#### 7. 删除购物车项

```
DELETE /cart/items/:id

Response: ApiResponse<{ success: boolean }>
```

#### 8. 清空购物车

```
DELETE /cart/items

Response: ApiResponse<{ success: boolean }>
```

### 订单相关接口

#### 9. 创建订单

```
POST /orders
Body: {
  cartItemIds: string[];
  shippingAddress: Address;
}

Response: ApiResponse<{
  orderId: string;
  order: Order;
}>
```

#### 10. 获取订单列表

```
GET /orders
Query Parameters:
  - status?: OrderStatus  // 订单状态筛选
  - page?: number
  - pageSize?: number

Response: ApiResponse<{
  orders: Order[];
  total: number;
}>
```

#### 11. 获取订单详情

```
GET /orders/:id

Response: ApiResponse<Order>
```

#### 12. 发起支付

```
POST /orders/:id/pay

Response: ApiResponse<{
  paymentParams: WechatPayParams;  // 微信支付参数
}>

interface WechatPayParams {
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: string;
  paySign: string;
}
```

#### 13. 支付回调（后端处理）

```
POST /orders/:id/payment-callback
// 此接口由微信服务器调用，前端无需关心
```

#### 14. 查询支付状态

```
GET /orders/:id/payment-status

Response: ApiResponse<{
  status: 'pending' | 'paid' | 'failed';
  paidAt?: number;
}>
```

### 用户相关接口

#### 15. 微信登录

```
POST /auth/wechat-login
Body: {
  code: string;  // 微信登录code
}

Response: ApiResponse<{
  token: string;
  user: {
    id: string;
    nickname: string;
    avatar: string;
  }
}>
```

#### 16. 获取用户信息

```
GET /users/me

Response: ApiResponse<User>
```

### 错误码定义

```typescript
enum ApiErrorCode {
  SUCCESS = 0,
  INVALID_PARAMS = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  SERVER_ERROR = 500,
  
  // 业务错误码
  BEAD_OUT_OF_STOCK = 1001,
  CART_ITEM_NOT_FOUND = 1002,
  ORDER_NOT_FOUND = 1003,
  PAYMENT_FAILED = 1004,
  INVALID_BRACELET = 1005,
}
```

## 数据模型

### Bead (珠子)

```typescript
interface Bead {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  price: number;          // 单价（元）
  weight: number;         // 重量（克）
  diameter: number;       // 直径（毫米）
  stock: number;          // 库存数量
  description?: string;
}
```

### Bracelet (手串)

```typescript
interface Bracelet {
  id?: string;
  beads: Bead[];
  createdAt?: number;
  updatedAt?: number;
}
```

### CartItem (购物车项)

```typescript
interface CartItem {
  id: string;
  bracelet: Bracelet;
  properties: BraceletProperties;
  addedAt: number;
}
```

### Order (订单)

```typescript
interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalPrice: number;
  status: OrderStatus;
  shippingAddress: Address;
  createdAt: number;
  paidAt?: number;
  shippedAt?: number;
  trackingNumber?: string;
}

enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}
```

### Address (地址)

```typescript
interface Address {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
}
```

## 正确性属性

*属性是指在系统的所有有效执行中都应该成立的特征或行为——本质上是关于系统应该做什么的形式化陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*


### 属性反思

在编写具体属性之前，我需要识别并消除冗余：

- 属性5.1、5.2、5.3都是关于实时计算的，可以合并为一个综合属性"计算属性正确性"
- 属性2.1和2.2都涉及添加珠子，2.2（画布显示）是2.1（模型更新）的自然结果，可以合并
- 属性4.2（删除珠子）和4.5（重新计算）可以合并，因为删除后重新计算是必然的
- 属性6.1和6.2都是关于保存到购物车，可以合并为一个属性
- 属性7.2和9.4都是关于加载设计的往返属性，可以合并

### 正确性属性

**属性 1: 分类筛选正确性**
*对于任意*珠子数据集和分类，筛选后返回的所有珠子都应该属于该分类
**验证需求: 1.3**

**属性 2: 搜索匹配正确性**
*对于任意*珠子数据集和搜索关键词，搜索结果中的所有珠子名称都应该包含该关键词
**验证需求: 1.4**

**属性 3: 珠子添加顺序保持**
*对于任意*珠子序列，按顺序添加到手串后，手串中的珠子顺序应该与添加顺序一致
**验证需求: 2.3**

**属性 4: 添加失败时状态不变**
*对于任意*手串状态，当添加珠子操作失败时，手串状态应该保持不变
**验证需求: 2.5**

**属性 5: 画布显示完整性**
*对于任意*非空手串，设计画布渲染的珠子数量应该等于手串模型中的珠子数量
**验证需求: 3.1**

**属性 6: 珠子选中状态更新**
*对于任意*手串和有效的珠子索引，选中操作后，系统的选中状态应该指向该索引
**验证需求: 3.3**

**属性 7: 珠子渲染比例正确**
*对于任意*珠子，渲染尺寸应该与珠子的直径属性成正比
**验证需求: 3.4**

**属性 8: 珠子删除正确性**
*对于任意*手串和有效的删除索引，删除后手串长度应该减1，且该索引位置的珠子应该被移除
**验证需求: 4.2, 4.5**

**属性 9: 珠子移动正确性**
*对于任意*手串和有效的移动参数（fromIndex, toIndex），移动后原fromIndex位置的珠子应该出现在toIndex位置
**验证需求: 4.3**

**属性 10: 实时计算正确性**
*对于任意*手串，计算的总价格应该等于所有珠子价格之和，总重量应该等于所有珠子重量之和，总长度应该等于所有珠子直径之和
**验证需求: 5.1, 5.2, 5.3**

**属性 11: 属性格式化正确性**
*对于任意*价格、重量、长度数值，格式化后的字符串应该包含正确的单位符号（¥、g、cm）
**验证需求: 5.4**

**属性 12: 购物车保存唯一性**
*对于任意*手串设计，多次保存到购物车应该生成不同的唯一ID
**验证需求: 6.2**

**属性 13: 保存失败时状态不变**
*对于任意*手串设计，当保存到购物车失败时，当前设计和购物车状态都应该保持不变
**验证需求: 6.5**

**属性 14: 购物车往返一致性**
*对于任意*手串设计，保存到购物车后再加载，应该得到相同的珠子序列和属性
**验证需求: 7.2, 9.4**

**属性 15: 购物车删除正确性**
*对于任意*购物车状态和有效的项目ID，删除后购物车应该不包含该项目，且总价应该相应减少
**验证需求: 7.3**

**属性 16: 支付成功状态转换**
*对于任意*待支付订单，支付成功后订单状态应该变为已支付
**验证需求: 8.3**

**属性 17: 支付失败状态保持**
*对于任意*待支付订单，支付失败后订单状态应该保持为待支付
**验证需求: 8.4**

**属性 18: 订单列表时间排序**
*对于任意*订单列表，显示的订单应该按创建时间倒序排列（最新的在前）
**验证需求: 9.1**

**属性 19: 离线缓存同步一致性**
*对于任意*手串设计，离线时缓存后，网络恢复时同步到服务器，应该保持设计数据一致
**验证需求: 10.4**

## 错误处理

### 错误类型

系统定义以下错误类型：

```typescript
enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',           // 网络错误
  VALIDATION_ERROR = 'VALIDATION_ERROR',     // 验证错误
  STORAGE_ERROR = 'STORAGE_ERROR',           // 存储错误
  PAYMENT_ERROR = 'PAYMENT_ERROR',           // 支付错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'            // 未知错误
}

interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: any;
}
```

### 错误处理策略

1. **网络错误**
   - 显示友好的错误提示
   - 提供重试按钮
   - 自动重试机制（最多3次，指数退避）
   - 离线时缓存操作，网络恢复后同步

2. **验证错误**
   - 在用户输入时实时验证
   - 显示具体的验证错误信息
   - 阻止无效操作的提交

3. **存储错误**
   - 捕获存储异常
   - 提示用户清理存储空间
   - 降级到内存存储

4. **支付错误**
   - 区分用户取消和支付失败
   - 保持订单状态，允许重新支付
   - 记录支付日志用于排查

5. **未知错误**
   - 捕获所有未处理的异常
   - 显示通用错误提示
   - 记录错误日志（不暴露技术细节给用户）
   - 提供反馈入口

### 错误边界

使用React Error Boundary捕获组件树中的错误：

```typescript
class ErrorBoundary extends React.Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误
    logError(error, errorInfo);
    // 显示降级UI
    this.setState({ hasError: true });
  }
}
```

## 测试策略

### 单元测试

使用Jest + React Testing Library进行单元测试：

1. **工具函数测试**
   - 计算器函数（价格、重量、长度计算）
   - 验证器函数（输入验证）
   - 格式化函数（数值格式化）

2. **组件测试**
   - 珠子选择器的筛选和搜索
   - 设计画布的渲染和交互
   - 属性面板的数据显示

3. **Store测试**
   - 状态更新逻辑
   - 计算属性的正确性
   - 异步操作的处理

4. **边缘情况测试**
   - 空状态处理
   - 最大限制处理
   - 错误状态处理

### 属性测试

使用fast-check进行属性测试：

**配置要求**:
- 每个属性测试至少运行100次迭代
- 每个测试必须用注释标注对应的设计文档属性
- 标注格式: `// Feature: crystal-bracelet-diy, Property X: [属性描述]`

**测试覆盖**:

1. **数据不变性属性**
   - 属性3: 珠子添加顺序保持
   - 属性4: 添加失败时状态不变
   - 属性8: 珠子删除正确性
   - 属性9: 珠子移动正确性

2. **计算正确性属性**
   - 属性10: 实时计算正确性
   - 属性11: 属性格式化正确性

3. **往返一致性属性**
   - 属性14: 购物车往返一致性
   - 属性19: 离线缓存同步一致性

4. **筛选和搜索属性**
   - 属性1: 分类筛选正确性
   - 属性2: 搜索匹配正确性

5. **状态转换属性**
   - 属性16: 支付成功状态转换
   - 属性17: 支付失败状态保持

### 集成测试

测试关键用户流程：

1. **完整DIY流程**
   - 浏览珠子 → 添加到手串 → 调整设计 → 加入购物车

2. **购买流程**
   - 查看购物车 → 结算 → 支付 → 查看订单

3. **编辑流程**
   - 从购物车加载设计 → 修改 → 重新保存

### 端到端测试

使用Taro的测试工具进行小程序端到端测试：

1. 页面导航流程
2. 用户交互完整性
3. 数据持久化验证

## 性能优化

### 渲染优化

1. **虚拟列表**
   - 珠子列表使用虚拟滚动，只渲染可见区域
   - 使用Taro的VirtualList组件

2. **图片优化**
   - 使用CDN加速
   - 图片懒加载
   - 使用WebP格式（降级到PNG）
   - 多尺寸图片适配

3. **组件优化**
   - 使用React.memo避免不必要的重渲染
   - 使用useMemo和useCallback缓存计算结果
   - 合理拆分组件，避免大组件

### 状态管理优化

1. **选择性订阅**
   - Zustand支持选择性订阅，只订阅需要的状态切片
   - 避免全局状态更新导致的大范围重渲染

2. **计算缓存**
   - 使用Zustand的计算属性缓存复杂计算结果
   - 只在依赖变化时重新计算

### 网络优化

1. **请求优化**
   - 接口数据缓存（使用SWR策略）
   - 请求去重和合并
   - 分页加载珠子数据

2. **离线支持**
   - 关键数据本地缓存
   - 离线操作队列
   - 网络恢复后自动同步

### 存储优化

1. **数据压缩**
   - 大对象使用LZ压缩存储
   - 定期清理过期缓存

2. **存储限额管理**
   - 监控存储使用量
   - 超限时清理最旧的数据

## 安全考虑

### 前端安全措施

1. **数据验证**
   - 前端验证所有用户输入（防止无效数据提交）
   - 使用TypeScript类型系统增强类型安全
   - 验证API响应数据格式

2. **支付安全**
   - 使用微信官方支付SDK (Taro.requestPayment)
   - 订单金额由后端计算，前端只展示
   - 支付参数由后端生成，前端不可篡改
   - 支付结果通过后端验证，不信任前端回调

3. **Token管理**
   - Token存储在Taro Storage中
   - 请求拦截器自动添加Token
   - Token过期自动跳转登录
   - 退出登录时清除Token

4. **用户隐私**
   - 敏感信息不在前端明文存储
   - 遵守微信小程序隐私规范
   - 用户数据最小化收集
   - 不在日志中记录敏感信息

5. **XSS防护**
   - 使用React的自动转义
   - 避免使用dangerouslySetInnerHTML
   - 用户输入内容进行过滤

### 后端安全要求（接口规范）

后端需要实现以下安全措施：

1. **认证授权**
   - 验证Token有效性
   - 实现用户权限控制

2. **数据验证**
   - 验证所有请求参数
   - 防止SQL注入、XSS等攻击

3. **支付安全**
   - 验证微信支付回调签名
   - 防止订单金额篡改
   - 实现支付幂等性

4. **接口限流**
   - 防止恶意刷接口
   - 实现频率限制

## 可访问性

1. **视觉辅助**
   - 足够的颜色对比度
   - 重要信息不仅依赖颜色传达
   - 支持字体大小调整

2. **交互辅助**
   - 触摸目标至少44x44px
   - 提供清晰的操作反馈
   - 错误提示明确具体

3. **内容辅助**
   - 图片提供alt文本
   - 使用语义化的组件结构

## 前端部署

### 构建和发布流程

1. **本地开发**
   ```bash
   # 安装依赖
   npm install
   
   # 启动开发服务器
   npm run dev:weapp
   
   # 在微信开发者工具中预览
   ```

2. **构建生产版本**
   ```bash
   # 构建微信小程序
   npm run build:weapp
   
   # 构建产物在 dist/ 目录
   ```

3. **上传和发布**
   - 使用微信开发者工具打开dist目录
   - 点击"上传"按钮上传代码
   - 在微信公众平台提交审核
   - 审核通过后发布到生产环境

4. **版本管理**
   - 使用语义化版本号（如1.0.0）
   - 每次发布更新版本号
   - 保留历史版本以便回滚

5. **灰度发布（可选）**
   - 微信小程序支持分阶段发布
   - 先发布给5%用户测试
   - 无问题后逐步扩大到100%

### 环境配置

使用环境变量区分开发、测试、生产环境：

```typescript
// src/constants/config.ts
const ENV = process.env.TARO_ENV;

export const API_BASE_URL = {
  development: 'https://dev-api.example.com/v1',
  test: 'https://test-api.example.com/v1',
  production: 'https://api.example.com/v1',
}[ENV] || 'https://api.example.com/v1';
```

### 前端监控

集成小程序监控SDK（如微信小程序数据助手、第三方监控）：

1. **性能监控**
   - 页面加载时间
   - 接口响应时间
   - 首屏渲染时间
   - 页面切换耗时

2. **错误监控**
   - JS运行时错误
   - API请求错误
   - 资源加载失败
   - 支付失败

3. **用户行为监控**
   - 页面访问路径
   - 按钮点击事件
   - 用户停留时长
   - 功能使用频率

4. **业务指标监控**
   - DAU/MAU
   - 设计完成率
   - 加购转化率
   - 支付转化率
   - 平均客单价

### 日志收集

```typescript
// src/utils/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data);
    // 发送到监控平台
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error);
    // 发送到监控平台
  },
  track: (event: string, properties?: any) => {
    // 埋点上报
  }
};
```

## 技术债务和未来改进

1. **短期改进**
   - 添加更多珠子分类和筛选维度
   - 支持手串模板（预设设计）
   - 添加分享功能

2. **中期改进**
   - 3D渲染手串效果
   - AR试戴功能
   - 社区设计分享

3. **长期改进**
   - AI推荐珠子搭配
   - 个性化定制服务
   - 跨平台支持（H5、App）
