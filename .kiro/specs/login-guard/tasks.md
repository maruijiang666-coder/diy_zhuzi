# Implementation Plan - Login Guard

- [ ] 1. 创建认证守卫工具函数




  - 创建 `src/utils/authGuard.ts` 文件
  - 实现 `checkLoginAndPrompt` 函数，检查登录状态并显示提示
  - 实现 `showLoginPrompt` 函数，显示登录提示对话框
  - 实现 `navigateToProfile` 函数，导航到个人中心页面
  - _Requirements: 5.1, 5.2, 5.3, 7.1, 7.2, 7.3_
-

- [ ] 1.1 编写认证守卫工具的单元测试



  - 测试 `checkLoginAndPrompt` 在已登录状态返回 true
  - 测试 `checkLoginAndPrompt` 在未登录状态显示提示并返回 false
  - 测试 `showLoginPrompt` 正确显示对话框内容
  - 测试 `navigateToProfile` 正确导航
  - _Requirements: 5.1, 5.2, 5.3_
-

- [-] 2. 在DIY页面添加登录保护


  - 在 `handleAddToCart` 函数开始处调用 `checkLoginAndPrompt('加入购物车')`
  - 如果返回 false，提前返回，不执行后续操作
  - 在 `handleSaveDesign` 函数开始处调用 `checkLoginAndPrompt('保存设计')`
  - 如果返回 false，提前返回，不执行后续操作
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_

- [-] 2.1 编写属性测试：Auth guard checks all protected actions



  - **Property 1: Auth guard checks all protected actions**
  - **Validates: Requirements 5.1**
  - 生成随机的受保护操作列表
  - 验证每个操作都触发认证检查

- [ ] 2.2 编写属性测试：Unauthenticated users cannot execute protected actions


  - **Property 2: Unauthenticated users cannot execute protected actions**
  - **Validates: Requirements 5.2**
  - 生成随机的受保护操作
  - 设置未认证状态
  - 验证操作被阻止

- [ ] 3. 在购物车页面添加登录保护

  - 在 `handleCheckout` 函数开始处调用 `checkLoginAndPrompt('结算')`
  - 如果返回 false，提前返回，不执行后续操作
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 3.1 编写属性测试：Login prompt displayed for prevented actions


  - **Property 3: Login prompt displayed for prevented actions**
  - **Validates: Requirements 5.3**
  - 生成随机的受保护操作
  - 设置未认证状态
  - 验证显示登录提示

- [ ] 4. 在订单确认页面添加登录保护

  - 在 `handleSubmitOrder` 函数开始处调用 `checkLoginAndPrompt('创建订单')`
  - 如果返回 false，提前返回，不执行后续操作
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 4.1 编写属性测试：Authenticated users can execute protected actions


  - **Property 4: Authenticated users can execute protected actions**
  - **Validates: Requirements 5.4**
  - 生成随机的受保护操作
  - 设置已认证状态
  - 验证所有操作成功执行

- [ ] 5. 在个人中心页面添加登录保护

  - 在 `handleGoToOrders` 函数开始处调用 `checkLoginAndPrompt('查看订单')`
  - 如果返回 false，提前返回，不执行后续操作
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 5.1 编写属性测试：Login prompt contains required UI elements


  - **Property 5: Login prompt contains required UI elements**
  - **Validates: Requirements 1.2, 7.1, 7.2, 7.3**
  - 生成随机的操作名称
  - 显示登录提示
  - 验证包含所有必需UI元素

- [ ] 6. Checkpoint - 确保所有测试通过

  - 确保所有测试通过，如有问题请询问用户

- [ ] 7. 编写集成测试


  - 测试未登录用户在DIY页面点击"加入购物车"显示登录提示
  - 测试未登录用户在DIY页面点击"保存设计"显示登录提示
  - 测试未登录用户在购物车页面点击"去结算"显示登录提示
  - 测试未登录用户在订单确认页面点击"提交订单"显示登录提示
  - 测试未登录用户在个人中心页面点击"我的订单"显示登录提示
  - 测试已登录用户可以正常执行所有操作
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 6.1, 6.2, 6.3, 6.4_
