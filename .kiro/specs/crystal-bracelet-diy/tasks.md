# 实施计划

- [x] 1. 初始化项目和基础配置
  - 使用Taro CLI创建项目：`taro init crystal-bracelet-diy`
  - 选择React + TypeScript模板
  - 配置Taro项目（app.config.ts）：设置页面路由、窗口样式、tabBar
  - 安装依赖：zustand（状态管理）、taro-ui或nutui（UI组件库）
  - 配置TypeScript（tsconfig.json）：启用严格模式
  - 配置SCSS和CSS Modules
  - 设置ESLint和Prettier代码规范
  - 创建目录结构（pages、components、stores、services、api、utils、types、constants）
  - _需求: 所有需求的基础_

- [x] 2. 定义TypeScript类型和常量
  - 创建types/bead.ts：定义Bead接口
  - 创建types/bracelet.ts：定义Bracelet、BraceletProperties接口
  - 创建types/order.ts：定义Order、OrderStatus、Address接口
  - 创建types/api.ts：定义ApiResponse、ApiError、WechatPayParams接口
  - 创建types/common.ts：定义通用类型（Category、CartItem等）
  - 创建constants/config.ts：定义API_BASE_URL、环境配置
  - 创建constants/api.ts：定义API端点常量
  - 创建constants/limits.ts：定义业务限制常量（MAX_BEADS = 30等）
  - _需求: 所有需求的基础_

- [x] 3. 实现API客户端和服务层
  - [x] 3.1 创建HTTP客户端封装
    - 实现api/client.ts：封装Taro.request
    - 实现请求拦截器：自动添加Token、设置Content-Type
    - 实现响应拦截器：统一错误处理、Token过期处理
    - 实现api/endpoints.ts：定义所有API端点函数
    - _需求: 10.1_

  - [x] 3.2 实现珠子数据服务
    - 实现services/beadService.ts
    - 实现getBeads()：获取珠子列表，支持分类筛选和搜索
    - 实现getCategories()：获取珠子分类
    - 实现getBeadById()：获取珠子详情
    - _需求: 1.1, 1.3, 1.4_

  - [x] 3.3 实现购物车服务
    - 实现services/cartService.ts
    - 实现addToCart()：添加手串设计到购物车
    - 实现getCartItems()：获取购物车列表
    - 实现updateCartItem()：更新购物车项
    - 实现removeCartItem()：删除购物车项
    - 实现clearCart()：清空购物车
    - _需求: 6.1, 7.1, 7.2, 7.3_

  - [x] 3.4 实现订单服务
    - 实现services/orderService.ts
    - 实现createOrder()：创建订单
    - 实现getOrders()：获取订单列表
    - 实现getOrderById()：获取订单详情
    - 实现initiatePayment()：发起支付
    - 实现checkPaymentStatus()：查询支付状态
    - _需求: 8.1, 8.2, 9.1, 9.2_

  - [x] 3.5 实现认证服务
    - 实现services/authService.ts
    - 实现wechatLogin()：微信登录
    - 实现getUserInfo()：获取用户信息
    - _需求: 所有需求的基础_

- [x] 4. 实现工具函数
  - [x] 4.1 实现计算工具
    - 实现utils/calculator.ts
    - 实现calculateTotalPrice()：计算手串总价格
    - 实现calculateTotalWeight()：计算手串总重量
    - 实现calculateTotalLength()：计算手串总长度
    - 实现calculateProperties()：一次性计算所有属性
    - _需求: 5.1, 5.2, 5.3_

  - [ ]* 4.2 编写计算工具的属性测试
    - **属性 10: 实时计算正确性**
    - **验证需求: 5.1, 5.2, 5.3**

  - [x] 4.3 实现格式化工具
    - 实现utils/formatter.ts
    - 实现formatPrice()：格式化价格（添加¥符号）
    - 实现formatWeight()：格式化重量（添加g单位）
    - 实现formatLength()：格式化长度（添加cm单位）
    - _需求: 5.4_

  - [ ]* 4.4 编写格式化工具的属性测试
    - **属性 11: 属性格式化正确性**
    - **验证需求: 5.4**

  - [x] 4.5 实现验证工具
    - 实现utils/validator.ts
    - 实现validateBracelet()：验证手串是否有效（非空、不超过最大数量）
    - 实现validateAddress()：验证收货地址
    - _需求: 2.4, 6.3_

  - [x] 4.6 实现存储工具
    - 实现utils/storage.ts
    - 封装Taro.setStorage和Taro.getStorage
    - 实现Token存储和读取
    - 实现离线数据缓存
    - _需求: 10.4_

  - [x] 4.7 实现日志工具
    - 实现utils/logger.ts
    - 实现info()、error()、track()方法
    - 集成错误监控（可选）
    - _需求: 10.5_

- [-] 5. 实现状态管理Store
  - [x] 5.1 实现DIY设计Store
    - 实现stores/useDiyStore.ts（使用Zustand）
    - 状态：bracelet（当前手串）、selectedBeadIndex（选中的珠子索引）
    - 实现addBead()：添加珠子到手串末尾
    - 实现removeBead()：删除指定索引的珠子
    - 实现moveBead()：移动珠子位置
    - 实现clearBracelet()：清空手串
    - 实现selectBead()：选中/取消选中珠子
    - 实现getProperties()：计算手串属性（调用calculator）
    - 实现canAddBead()：检查是否可以继续添加珠子
    - _需求: 2.1, 2.3, 2.4, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3_

  - [ ]* 5.2 编写DIY Store的属性测试
    - **属性 3: 珠子添加顺序保持**
    - **验证需求: 2.3**

  - [ ]* 5.3 编写DIY Store的属性测试
    - **属性 4: 添加失败时状态不变**
    - **验证需求: 2.5**

  - [ ]* 5.4 编写DIY Store的属性测试
    - **属性 8: 珠子删除正确性**
    - **验证需求: 4.2, 4.5**

  - [ ]* 5.5 编写DIY Store的属性测试
    - **属性 9: 珠子移动正确性**
    - **验证需求: 4.3**

  - [x] 5.6 实现购物车Store
    - 实现stores/useCartStore.ts
    - 状态：items（购物车项列表）
    - 实现addToCart()：调用cartService添加到购物车
    - 实现removeFromCart()：删除购物车项
    - 实现updateCartItem()：更新购物车项
    - 实现clearCart()：清空购物车
    - 实现getTotalPrice()：计算购物车总价
    - 实现getItemCount()：获取购物车项数量
    - _需求: 6.1, 6.2, 7.3_

  - [ ]* 5.7 编写购物车Store的属性测试
    - **属性 12: 购物车保存唯一性**
    - **验证需求: 6.2**

  - [ ]* 5.8 编写购物车Store的属性测试
    - **属性 15: 购物车删除正确性**
    - **验证需求: 7.3**

  - [x] 5.9 实现订单Store
    - 实现stores/useOrderStore.ts
    - 状态：orders（订单列表）、currentOrder（当前订单）
    - 实现createOrder()：创建订单
    - 实现loadOrders()：加载订单列表
    - 实现loadOrderDetail()：加载订单详情
    - 实现updateOrderStatus()：更新订单状态
    - _需求: 8.1, 9.1, 9.2_

  - [ ]* 5.10 编写订单Store的属性测试
    - **属性 16: 支付成功状态转换**
    - **验证需求: 8.3**

  - [ ]* 5.11 编写订单Store的属性测试
    - **属性 17: 支付失败状态保持**
    - **验证需求: 8.4**

  - [ ]* 5.12 编写订单Store的属性测试
    - **属性 18: 订单列表时间排序**
    - **验证需求: 9.1**

  - [x] 5.13 实现用户Store
    - 实现stores/useUserStore.ts
    - 状态：user（用户信息）、token（认证令牌）、isLoggedIn（登录状态）
    - 实现login()：微信登录
    - 实现logout()：退出登录
    - 实现loadUserInfo()：加载用户信息
    - _需求: 所有需求的基础_

- [x] 6. 实现通用UI组件
  - [x] 6.1 实现Loading组件
    - 创建components/common/Loading/index.tsx
    - 显示加载动画
    - 支持全屏和局部加载
    - _需求: 10.2_

  - [x] 6.2 实现Empty组件
    - 创建components/common/Empty/index.tsx
    - 显示空状态提示
    - 支持自定义图标和文案
    - _需求: 1.5, 3.5, 7.5, 9.5_

  - [x] 6.3 实现ErrorBoundary组件
    - 创建components/common/ErrorBoundary/index.tsx
    - 捕获组件错误
    - 显示降级UI
    - 记录错误日志
    - _需求: 10.5_

- [x] 7. 实现珠子相关组件
  - [x] 7.1 实现BeadItem组件
    - 创建components/BeadItem/index.tsx
    - 显示珠子图片、名称、价格、尺寸
    - 支持点击事件
    - 支持加载失败时显示占位图
    - _需求: 1.1, 10.3_

  - [x] 7.2 实现BeadSelector组件
    - 创建components/BeadSelector/index.tsx
    - 显示珠子列表（使用虚拟列表优化）
    - 实现分类筛选功能
    - 实现搜索功能
    - 处理加载状态和空状态
    - 处理错误状态
    - _需求: 1.1, 1.3, 1.4, 1.5_

  - [ ]* 7.3 编写BeadSelector的属性测试
    - **属性 1: 分类筛选正确性**
    - **验证需求: 1.3**

  - [ ]* 7.4 编写BeadSelector的属性测试
    - **属性 2: 搜索匹配正确性**
    - **验证需求: 1.4**

- [x] 8. 实现设计画布组件
  - [x] 8.1 实现DesignCanvas组件
    - 创建components/DesignCanvas/index.tsx
    - 以环形或线性布局显示手串中的珠子
    - 实现珠子点击选中功能（高亮显示）
    - 实现珠子长按显示操作菜单（删除、移动）
    - 实现珠子拖拽排序功能
    - 按珠子直径比例渲染珠子大小
    - 处理空状态（显示引导提示）
    - _需求: 2.2, 3.1, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3_

  - [ ]* 8.2 编写DesignCanvas的属性测试
    - **属性 5: 画布显示完整性**
    - **验证需求: 3.1**

  - [ ]* 8.3 编写DesignCanvas的属性测试
    - **属性 6: 珠子选中状态更新**
    - **验证需求: 3.3**

  - [ ]* 8.4 编写DesignCanvas的属性测试
    - **属性 7: 珠子渲染比例正确**
    - **验证需求: 3.4**

- [x] 9. 实现属性面板组件
  - [x] 9.1 实现PropertyPanel组件
    - 创建components/PropertyPanel/index.tsx
    - 实时显示手串的珠子数量
    - 实时显示总价格（格式化为¥XX.XX）
    - 实时显示总重量（格式化为XXg）
    - 实时显示总长度（格式化为XXcm）
    - 处理空手串状态（显示全部为0）
    - _需求: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 10. 实现DIY设计页面
  - [x] 10.1 实现DIY页面布局
    - 创建pages/diy/index.tsx
    - 集成BeadSelector、DesignCanvas、PropertyPanel组件
    - 实现页面布局：上方设计画布、中间属性面板、下方珠子选择器
    - 实现"加入购物车"按钮
    - 实现"清空设计"按钮
    - _需求: 1.1, 2.1, 3.1, 5.1_

  - [x] 10.2 实现DIY页面交互逻辑
    - 连接useDiyStore
    - 实现珠子点击添加逻辑
    - 实现加入购物车逻辑（验证非空、调用cartService）
    - 实现清空设计逻辑（弹出确认对话框）
    - 处理加入购物车成功/失败反馈
    - 处理网络错误和重试
    - _需求: 2.1, 2.4, 4.4, 6.1, 6.3, 6.4, 6.5, 10.1_

  - [ ]* 10.3 编写DIY页面的属性测试
    - **属性 13: 保存失败时状态不变**
    - **验证需求: 6.5**

- [x] 11. 检查点 - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户

- [x] 12. 实现购物车页面
  - [x] 12.1 实现购物车列表
    - 创建pages/cart/index.tsx
    - 显示购物车中的所有手串设计
    - 每个项显示：预览图、珠子数量、价格、重量、长度
    - 实现删除购物车项功能（滑动删除或点击删除按钮）
    - 实现点击项加载到DIY页面编辑
    - 显示购物车总价
    - 处理空购物车状态
    - _需求: 7.1, 7.2, 7.3, 7.5_

  - [x] 12.2 实现购物车结算功能
    - 实现"去结算"按钮
    - 验证购物车非空
    - 跳转到订单确认页面
    - _需求: 7.4_

  - [ ]* 12.3 编写购物车的属性测试
    - **属性 14: 购物车往返一致性**
    - **验证需求: 7.2, 9.4**

- [x] 13. 实现订单相关页面
  - [x] 13.1 实现订单确认页面
    - 创建pages/order/confirm/index.tsx
    - 显示订单详情：所有手串设计、总价
    - 实现收货地址选择/编辑
    - 实现"提交订单"按钮
    - 调用orderService.createOrder()
    - 处理创建订单成功/失败
    - _需求: 8.1_

  - [x] 13.2 实现支付功能
    - 创建hooks/useWechatPay.ts
    - 调用orderService.initiatePayment()获取支付参数
    - 调用Taro.requestPayment()发起微信支付
    - 处理支付成功：更新订单状态、跳转成功页面
    - 处理支付失败：显示错误提示、允许重试
    - 处理用户取消：返回订单详情页
    - _需求: 8.2, 8.3, 8.4, 8.5_

  - [x] 13.3 实现订单列表页面
    - 创建pages/order/list/index.tsx
    - 显示用户的所有历史订单
    - 按创建时间倒序排列
    - 每个订单显示：订单号、状态、总价、创建时间
    - 实现订单状态筛选（可选）
    - 处理空订单列表状态
    - _需求: 9.1, 9.5_

  - [x] 13.4 实现订单详情页面
    - 创建pages/order/detail/index.tsx
    - 显示订单完整信息：手串设计、价格、状态、收货地址
    - 显示物流信息（如果已发货）
    - 实现"再次购买"按钮：加载设计到DIY页面
    - 实现"继续支付"按钮（如果未支付）
    - _需求: 9.2, 9.3, 9.4_

- [x] 14. 实现用户认证和个人中心
  - [x] 14.1 实现登录功能
    - 实现微信登录流程
    - 调用Taro.login()获取code
    - 调用authService.wechatLogin()换取token
    - 存储token到本地
    - 处理登录失败
    - _需求: 所有需求的基础_

  - [x] 14.2 实现个人中心页面
    - 创建pages/profile/index.tsx
    - 显示用户信息（头像、昵称）
    - 显示"我的订单"入口
    - 显示"退出登录"按钮
    - 实现退出登录逻辑
    - _需求: 所有需求的基础_

- [ ] 15. 实现离线缓存和同步
  - [ ] 15.1 实现离线缓存
    - 在useDiyStore中实现自动保存到本地存储
    - 页面加载时从本地存储恢复设计
    - _需求: 10.4_

  - [ ] 15.2 实现网络恢复同步
    - 监听网络状态变化
    - 网络恢复时同步离线操作
    - _需求: 10.4_

  - [ ]* 15.3 编写离线缓存的属性测试
    - **属性 19: 离线缓存同步一致性**
    - **验证需求: 10.4**

- [ ] 16. 实现错误处理和用户反馈
  - [ ] 16.1 完善错误处理
    - 在API客户端中统一处理网络错误
    - 显示友好的错误提示
    - 提供重试按钮
    - _需求: 10.1_

  - [ ] 16.2 实现图片加载失败处理
    - 在BeadItem和DesignCanvas中处理图片加载失败
    - 显示占位图
    - 提供重新加载选项
    - _需求: 10.3_

  - [ ] 16.3 实现全局错误捕获
    - 使用ErrorBoundary包裹应用
    - 记录错误日志
    - 显示通用错误提示（不暴露技术细节）
    - _需求: 10.5_

- [x] 17. 性能优化
  - [x] 17.1 优化珠子列表渲染
    - 使用Taro的VirtualList实现虚拟滚动
    - 实现图片懒加载
    - _需求: 1.2_

  - [x] 17.2 优化组件渲染
    - 使用React.memo优化BeadItem、PropertyPanel等组件
    - 使用useMemo缓存计算结果
    - 使用useCallback缓存回调函数
    - _需求: 3.2_

  - [x] 17.3 优化图片资源
    - 配置CDN加速
    - 使用多尺寸图片
    - 支持WebP格式（降级到PNG）
    - _需求: 所有需求_

- [ ] 18. 样式和UI优化
  - [ ] 18.1 实现响应式布局
    - 适配不同屏幕尺寸
    - 使用rpx单位
    - _需求: 所有需求_

  - [ ] 18.2 实现主题样式
    - 定义颜色变量
    - 统一字体大小和间距
    - 实现按钮、输入框等通用样式
    - _需求: 所有需求_

  - [ ] 18.3 优化交互体验
    - 添加加载动画
    - 添加操作反馈（toast、modal）
    - 优化触摸目标大小（至少44x44px）
    - _需求: 所有需求_

- [ ] 19. 最终检查点 - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户

- [ ] 20. 集成测试和端到端测试
  - [ ]* 20.1 编写完整DIY流程的集成测试
    - 测试：浏览珠子 → 添加到手串 → 调整设计 → 加入购物车
    - _需求: 1.1, 2.1, 4.2, 6.1_

  - [ ]* 20.2 编写购买流程的集成测试
    - 测试：查看购物车 → 结算 → 创建订单 → 支付
    - _需求: 7.1, 7.4, 8.1, 8.2_

  - [ ]* 20.3 编写编辑流程的集成测试
    - 测试：从购物车加载设计 → 修改 → 重新保存
    - _需求: 7.2, 2.1, 6.1_
