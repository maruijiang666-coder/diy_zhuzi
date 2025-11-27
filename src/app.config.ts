export default defineAppConfig({
  pages: [
    'pages/diy/index',
    'pages/cart/index',
    'pages/order/list/index',
    'pages/order/detail/index',
    'pages/order/confirm/index',
    'pages/profile/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'DIY水晶手串',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#666',
    selectedColor: '#6366f1',
    backgroundColor: '#fff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/diy/index',
        text: 'DIY设计',
        iconPath: 'assets/icons/diy.png',
        selectedIconPath: 'assets/icons/diy-active.png'
      },
      {
        pagePath: 'pages/cart/index',
        text: '购物车',
        iconPath: 'assets/icons/cart.png',
        selectedIconPath: 'assets/icons/cart-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/icons/profile.png',
        selectedIconPath: 'assets/icons/profile-active.png'
      }
    ]
  }
})
