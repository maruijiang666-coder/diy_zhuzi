export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/profile/index', // 未登录时的默认首页
    'pages/login/index',
    'pages/diy/index',
    'pages/cart/index',
    'pages/designs/index',
    'pages/order/list/index',
    'pages/order/detail/index',
    'pages/order/confirm/index',
    'pages/support/index',
    'pages/splash/index',
    'pages/agreement/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTitleText: '遣山水晶',
    navigationBarTextStyle: 'black',
    backgroundColor: '#FAFAFA'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#8B7FD8',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: 'assets/icons/home.png',
        selectedIconPath: 'assets/icons/home-active.png'
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
