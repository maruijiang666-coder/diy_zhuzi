# DIY水晶手串商城

基于Taro框架的微信小程序，允许用户通过可视化界面自定义设计水晶手串。

## 技术栈

- **框架**: Taro 3.x (React语法)
- **语言**: TypeScript (严格模式)
- **状态管理**: Zustand
- **UI组件**: NutUI React Taro
- **样式**: SCSS + CSS Modules
- **构建工具**: Vite

## 项目结构

```
src/
├── pages/                    # 页面
│   ├── diy/                 # DIY设计页面
│   ├── cart/                # 购物车页面
│   ├── order/               # 订单相关页面
│   │   ├── list/           # 订单列表
│   │   ├── detail/         # 订单详情
│   │   └── confirm/        # 订单确认
│   └── profile/             # 个人中心
├── components/              # 通用组件
├── stores/                  # 状态管理 (Zustand)
├── services/                # 业务服务层
├── api/                     # API接口层
├── utils/                   # 工具函数
├── types/                   # TypeScript类型定义
├── constants/               # 常量定义
└── assets/                  # 静态资源
```

## 业务逻辑说明

### 购物车页面订单显示逻辑

为了优化用户体验，已支付的订单项不再显示在购物车页面中。具体实现逻辑如下：

**核心思路**：在加载购物车列表时，同步获取用户的“已支付”订单，提取这些订单关联的购物车项 ID，然后从当前购物车列表中过滤掉这些 ID。

**具体步骤**：
1. **加载购物车数据**：调用 `cartService.getCartItems()` 获取所有购物车项。
2. **获取订单数据**：调用 `orderService.getOrders()` 获取最近的订单列表（包含已支付、发货、完成等状态）。
3. **本地状态检查**：结合 `orderService` 中的本地标记机制（`recentlyPaidOrderIds`），确保即使后端状态更新延迟，刚支付成功的订单也能被识别。
4. **过滤显示**：
   - 遍历获取到的订单，提取状态为 `paid` (已支付)、`shipped` (已发货)、`completed` (已完成) 或本地标记为已支付的订单。
   - 收集这些订单中包含的所有 `cart_item_id`。
   - 在前端渲染购物车列表前，将这些 ID 对应的项从列表中移除。

**相关文件**：
- `src/stores/useCartStore.ts`: 包含主要的过滤逻辑 (`loadCartItems` 方法)。
- `src/services/orderService.ts`: 提供订单获取和本地支付状态标记功能。

## 开发命令

```bash
# 安装依赖
npm install

# 启动微信小程序开发
npm run dev:weapp

# 构建微信小程序
npm run build:weapp

# 代码检查
npm run lint

# 代码格式化
npm run prettier
```

## 开发指南

1. 在微信开发者工具中打开项目根目录
2. 运行 `npm run dev:weapp` 启动开发服务器
3. 在微信开发者工具中预览和调试

## 配置说明

- `app.config.ts`: 应用配置，包含页面路由和tabBar配置
- `tsconfig.json`: TypeScript配置，已启用严格模式
- `.prettierrc`: 代码格式化配置
- `.eslintrc`: 代码检查配置

## 环境变量

- `.env.development`: 开发环境配置
- `.env.test`: 测试环境配置
- `.env.production`: 生产环境配置
