export const API_ENDPOINTS = {
  // 珠子相关
  BEADS: '/beads/',
  BEAD_CATEGORIES: '/beads/categories/',
  BEAD_DETAIL: (id: string) => `/beads/${id}/`,

  // 购物车相关
  CART_ITEMS: '/cart/items/',
  CART_ITEM_DETAIL: (id: string) => `/cart/items/${id}/`,

  // 订单相关
  ORDERS: '/orders/',
  ORDER_DETAIL: (id: string) => `/orders/${id}/`,
  ORDER_PAY: (id: string) => `/orders/${id}/pay/`,
  ORDER_PAYMENT_STATUS: (id: string) => `/orders/${id}/payment-status/`,

  // 用户相关
  WECHAT_LOGIN: '/auth/login/', // 微信登录接口
  USER_INFO: '/users/me/',

  // 设计相关
  BRACELETS: '/bracelets/', // 手串列表
  BRACELET_DETAIL: (id: string) => `/bracelets/${id}/`, // 手串详情
}
