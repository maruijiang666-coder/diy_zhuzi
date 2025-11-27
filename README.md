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
