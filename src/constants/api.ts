export const API_ENDPOINTS = {
  // ============ 认证相关 (基础路径: /api/auth) ============
  WECHAT_LOGIN: '/auth/wx/get_openid/', // 获取openId
  WECHAT_VALIDATE: '/auth/wx/validate/', // 验证登录态
  WECHAT_REFRESH: '/auth/wx/refresh/', // 刷新登录态
  WECHAT_LOGOUT: '/auth/wx/logout/', // 登出
  USER_INFO: '/auth/users/me/', // 获取当前用户信息

  // ============ DIY业务相关 (基础路径: /api/diy) ============
  // 珠子相关
  BEADS: '/diy/beads/',
  BEAD_CATEGORIES: '/diy/beads/categories/',
  BEAD_DETAIL: (id: string) => `/diy/beads/${id}/`,

  // 购物车相关
  CART_ITEMS: '/diy/cart/items/',
  CART_ITEM_DETAIL: (id: string) => `/diy/cart/items/${id}/`,

  // 订单相关
  ORDERS: '/diy/orders/',
  ORDER_DETAIL: (id: string) => `/diy/orders/${id}/`,
  ORDER_PAY: (id: string) => `/diy/orders/${id}/pay/`,
  ORDER_PAYMENT_STATUS: (id: string) => `/diy/orders/${id}/payment-status/`,

  // 设计相关（手串）
  BRACELETS: '/diy/bracelets/', // 手串列表
  BRACELET_DETAIL: (id: string) => `/diy/bracelets/${id}/`, // 手串详情
}
