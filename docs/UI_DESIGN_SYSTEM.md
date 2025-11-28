# 遣山水晶 - UI设计系统

## 设计理念

**高级极简 · 水晶质感**

以水晶的纯净、优雅、神秘为设计灵感，打造高级感与极简风格并存的用户界面。

## 核心设计元素

### 1. 色彩系统

#### 主色调 - 优雅紫
- 主色：`#8B7FD8` - 水晶般的神秘紫色
- 浅色：`#A89FE8` - 柔和的紫色
- 深色：`#6B5FC8` - 深邃的紫色
- 渐变：`linear-gradient(135deg, #8B7FD8 0%, #B8A9E8 100%)`

#### 辅助色
- 次要色：`#D4C5F9` - 淡紫色
- 强调色：`#C9A0DC` - 玫瑰紫
- 金色：`#D4AF37` - 玫瑰金（高级感）

#### 中性色
- 文字主色：`#2C2C2C`
- 文字次色：`#666666`
- 背景主色：`#FFFFFF`
- 背景次色：`#FAFAFA`

### 2. 视觉效果

#### 玻璃态效果（Glassmorphism）
```scss
background: rgba(255, 255, 255, 0.9);
backdrop-filter: blur(20rpx);
border: 1rpx solid rgba(255, 255, 255, 0.3);
```

#### 渐变背景
- 页面背景：`linear-gradient(180deg, #F8F6FF 0%, #FAFAFA 100%)`
- 按钮渐变：`linear-gradient(135deg, #8B7FD8 0%, #B8A9E8 100%)`

#### 阴影系统
- 小阴影：`0 2rpx 8rpx rgba(139, 127, 216, 0.08)`
- 中阴影：`0 4rpx 16rpx rgba(139, 127, 216, 0.12)`
- 大阴影：`0 8rpx 24rpx rgba(139, 127, 216, 0.16)`

### 3. 圆角规范
- 小：`8rpx` - 标签、徽章
- 中：`16rpx` - 卡片、输入框
- 大：`24rpx` - 大卡片
- 超大：`32rpx` - 特殊容器
- 圆形：`999rpx` - 按钮、头像

### 4. 间距系统
- xs: `8rpx`
- sm: `12rpx`
- md: `16rpx`
- lg: `24rpx`
- xl: `32rpx`
- xxl: `48rpx`

### 5. 字体规范
- 超小：`22rpx` - 辅助文字
- 小：`24rpx` - 次要文字
- 基础：`28rpx` - 正文
- 大：`32rpx` - 小标题
- 超大：`36rpx` - 标题
- 特大：`48rpx` - 主标题

## 页面设计

### 启动页（Splash）
- 渐变背景 + 旋转装饰
- Logo居中悬浮动画
- 品牌名称渐变文字
- 底部加载点动画

### DIY设计页
- 顶部Logo + 品牌名
- 圆角卡片式画布
- 渐变按钮 + 光泽效果
- 极简操作区

### 购物车页
- 渐变背景
- 玻璃态卡片
- 珠子预览圆形展示
- 渐变价格强调

### 个人中心页
- 顶部渐变装饰
- 圆形头像 + 阴影
- 简洁菜单列表
- 柔和退出按钮

## 动画效果

### 1. 悬浮动画（Float）
```scss
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10rpx); }
}
```

### 2. 渐入动画（Fade In）
```scss
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 3. 水晶光泽（Crystal Shine）
- 45度角光泽扫过效果
- 3秒循环动画
- 增强水晶质感

## 组件规范

### 按钮
- 主按钮：渐变背景 + 阴影 + 按压缩放
- 次要按钮：浅色背景 + 无阴影
- 圆角：`999rpx`（完全圆角）
- 高度：`88rpx`

### 卡片
- 白色背景
- 圆角：`16rpx`
- 阴影：`0 2rpx 12rpx rgba(0, 0, 0, 0.04)`
- 按压缩放：`scale(0.99)`

### 输入框
- 浅色背景
- 圆角：`16rpx`
- 边框：`1rpx solid #E8E8E8`
- 聚焦：紫色边框

## Logo使用规范

### Logo地址
```
https://tangledup-ai-staging.oss-cn-shanghai.aliyuncs.com/mini_app/crystal_mini_app/logoqianshan.svg
```

### 使用场景
1. 启动页：280rpx × 280rpx（大尺寸 + 悬浮动画）
2. 页面顶部：80rpx × 80rpx（中尺寸）
3. 导航栏：60rpx × 60rpx（小尺寸）

### 显示效果
- 投影：`drop-shadow(0 8rpx 24rpx rgba(139, 127, 216, 0.3))`
- 动画：悬浮动画（启动页）
- 对齐：居中或左对齐

## 品牌元素

### 品牌名称
**遣山水晶**

### Slogan
**定制你的专属水晶手串**

### 渐变文字效果
```scss
.gradient-text {
  background: linear-gradient(135deg, #8B7FD8 0%, #B8A9E8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

## 实现文件

### 样式系统
- `src/styles/variables.scss` - 设计变量
- `src/styles/mixins.scss` - 样式混合器
- `src/app.css` - 全局样式

### 页面样式
- `src/pages/splash/index.scss` - 启动页
- `src/pages/diy/index.scss` - DIY页
- `src/pages/cart/index.scss` - 购物车
- `src/pages/profile/index.scss` - 个人中心

### 组件样式
- `src/components/common/Empty/index.scss` - 空状态
- `src/components/common/Loading/index.scss` - 加载状态

## 设计原则

1. **极简主义** - 去除不必要的装饰，保持界面简洁
2. **水晶质感** - 使用玻璃态、渐变、光泽效果
3. **优雅动画** - 柔和的过渡和悬浮效果
4. **品牌一致性** - 统一的紫色系和圆角风格
5. **用户友好** - 清晰的视觉层级和操作反馈
