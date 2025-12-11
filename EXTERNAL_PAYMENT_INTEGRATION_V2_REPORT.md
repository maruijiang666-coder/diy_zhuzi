# 外部支付接口集成 V2 报告

## 需求变更概述
根据用户最新需求，将外部支付接口的数据格式从原来的自定义格式调整为新的接口格式：
- 接口地址：`https://therianclouds.mynatapp.cc/api/payment/create`
- 数据格式：包含 openid、amount、description、orderId 字段
- openid 来源：Taro.getStorageSync('auth_token')
- orderId 生成：使用 NanoID 生成6位唯一值

## 主要修改内容

### 1. 数据类型更新
**文件：** `src/api/endpoints.ts`
- 修改 `ExternalPaymentCreateRequest` 接口：
  - 移除字段：`order_id`, `total_amount`, `user_id`, `return_url`, `notify_url`
  - 新增字段：`openid`, `amount`, `description`, `orderId`
- 修改 `ExternalPaymentCreateResponse` 接口：
  - 简化响应结构，支持 `success`, `message`, `data` 字段

### 2. 订单服务逻辑更新
**文件：** `src/services/orderService.ts`
- 添加 NanoID 依赖用于生成6位唯一订单ID
- 添加 Taro 依赖用于获取用户openid
- 更新外部支付请求逻辑：
  - 从本地存储获取用户openid
  - 使用 NanoID 生成6位唯一订单ID
  - 构建新的请求数据结构
- 更新响应处理逻辑：
  - 使用新的响应结构
  - 更新订单数据存储格式

### 3. 订单类型扩展
**文件：** `src/types/order.ts`
- 新增 `ExternalPaymentInfo` 接口用于存储外部支付信息
- 在 `Order` 接口中添加 `externalPaymentInfo` 可选字段

### 4. 依赖安装
- 安装 `nanoid` 包用于生成唯一ID（后改用原生JavaScript实现）

### 5. ID生成实现
**文件：** `src/services/orderService.ts`
- 由于 NanoID 在小程序环境下有兼容性问题，改用原生 JavaScript 实现：
  - 使用时间戳和随机数生成6位唯一ID
  - 格式：大写字母和数字组合
  - 确保唯一性和随机性

### 6. 控制台输出增强
**文件：** `src/services/orderService.ts`
- 增强请求信息打印：
  - 显示完整请求URL、方法、请求头
  - 详细说明每个请求参数的含义和值
  - 格式化输出请求体数据
- 增强响应信息打印：
  - 显示完整的响应原始数据
  - 分别输出success、message、data字段
  - 格式化JSON输出便于调试
- 增强错误信息打印：
  - 显示错误类型、消息、堆栈
  - 如果有HTTP响应，显示状态码和响应数据

## 核心特性

### 数据完整性
- ✅ 使用 NanoID 生成6位唯一订单ID
- ✅ 从本地存储获取用户openid
- ✅ 正确传递订单总价作为amount
- ✅ 包含商品描述信息

### 错误处理
- ✅ 处理用户未登录情况（无openid）
- ✅ 外部支付失败不影响主订单流程
- ✅ 详细的错误日志记录
- ✅ 降级机制确保主订单正常创建

### 超时控制
- ✅ 保持5秒超时设置避免阻塞主流程
- ✅ 异步处理不影响用户体验

## 使用说明

当用户创建订单时，系统会自动：
1. 创建主订单并保存到 `diy/orders`
2. 获取用户openid（从本地存储）
3. 生成6位唯一外部订单ID
4. 调用外部支付接口 `https://therianclouds.mynatapp.cc/api/payment/create`
5. 将外部支付结果保存到订单数据中

## 注意事项

1. **用户登录状态**：需要确保用户已登录且本地存储中有auth_token
2. **网络超时**：外部支付接口调用设置5秒超时
3. **错误处理**：外部支付失败不会影响主订单创建
4. **数据格式**：严格按照新接口要求的数据格式发送请求

## 测试建议

建议测试以下场景：
1. 用户已登录情况下的完整订单创建流程
2. 用户未登录情况下的降级处理
3. 外部支付接口超时情况下的处理
4. 外部支付接口返回错误情况下的处理

## 编译状态
✅ 微信小程序开发服务器正常运行，代码编译成功

## ⚠️ 重要配置提醒

### 域名白名单配置
由于微信小程序安全策略，使用 `https://therianclouds.mynatapp.cc` 域名需要配置服务器域名白名单：

**开发环境（临时解决方案）**：
- 在微信开发者工具中勾选"不校验合法域名"
- 路径：详情 → 本地设置 → 勾选相关选项

**生产环境（必需配置）**：
- 登录微信公众平台：https://mp.weixin.qq.com/
- 进入：开发 → 开发设置 → 服务器域名
- 添加 `https://therianclouds.mynatapp.cc` 到 request 合法域名

### 常见错误排查
如果遇到 `请求超时，请检查网络连接` 错误，请优先检查域名配置。

## 新增功能
✅ 控制台输出增强：详细打印外部支付接口的请求和响应数据，便于调试和监控