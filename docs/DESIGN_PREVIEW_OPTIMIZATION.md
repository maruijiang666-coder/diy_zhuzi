# 设计预览优化

## 优化内容

### 1. 命名功能
用户在保存设计时可以自定义设计名称。

#### 实现方式
- 创建自定义命名对话框组件 `NameInputModal`
- 点击"保存设计"按钮时弹出对话框
- 用户可以输入自定义名称（最多20字符）
- 默认名称：`设计 [日期]`

#### 组件特性
- 优雅的紫色渐变主题
- 自动聚焦输入框
- 支持取消和确认操作
- 输入验证和默认值处理

### 2. 圆环预览
设计列表中的预览图显示为圆环效果，而不是网格布局。

#### 显示效果
- 珠子按圆形排列
- 显示圆环线条（棕色半透明）
- 珠子大小统一（28rpx）
- 保持圆形布局的视觉一致性

#### 技术实现
```typescript
// 计算珠子在圆环上的位置
const angle = (index / totalBeads) * 2 * Math.PI - Math.PI / 2
const radius = 60 // 圆环半径
const x = 90 + radius * Math.cos(angle)
const y = 90 + radius * Math.sin(angle)
```

#### 样式特点
- 容器尺寸：180rpx × 180rpx
- 圆环半径：60rpx
- 圆环线条：2rpx，棕色半透明
- 珠子尺寸：28rpx × 28rpx
- 珠子边框：2rpx，紫色半透明

## 文件结构

### 新增组件
```
src/components/NameInputModal/
├── index.tsx       # 命名对话框组件
└── index.scss      # 组件样式
```

### 修改文件
- `src/pages/diy/index.tsx` - 添加命名对话框
- `src/pages/designs/index.tsx` - 圆环预览渲染
- `src/pages/designs/index.scss` - 圆环预览样式

## 用户流程

### 保存设计
1. 用户在DIY页面设计手串
2. 点击"保存设计"按钮
3. 弹出命名对话框
4. 输入设计名称（或使用默认名称）
5. 点击"确定"保存
6. 显示保存成功提示

### 查看设计
1. 进入"我的设计"页面
2. 看到圆环效果的设计预览
3. 显示设计名称、珠子数量、价格
4. 点击设计可加载到DIY页面

## 命名对话框组件

### Props
```typescript
interface NameInputModalProps {
  visible: boolean        // 是否显示
  defaultName?: string    // 默认名称
  onConfirm: (name: string) => void  // 确认回调
  onCancel: () => void    // 取消回调
}
```

### 特性
- 自动聚焦输入框
- 最大长度限制（20字符）
- 空值处理（使用默认名称）
- 点击遮罩层关闭
- 优雅的动画效果

### 样式
- 紫色渐变确认按钮
- 灰色取消按钮
- 圆角输入框
- 阴影和过渡效果

## 圆环预览

### 布局计算
珠子按圆形均匀分布：
- 起始角度：-90°（顶部）
- 角度间隔：360° / 珠子数量
- 使用三角函数计算坐标

### 视觉效果
- 圆环线条作为背景
- 珠子在圆环上排列
- 保持与画布一致的视觉效果
- 缩略图尺寸适配列表显示

### 响应式
- 容器固定尺寸
- 珠子大小统一
- 支持任意数量的珠子
- 自动计算位置

## 未来优化

### Canvas截图
- [ ] 使用Canvas API生成画布截图
- [ ] 保存为base64或上传到服务器
- [ ] 在列表中显示真实的设计截图
- [ ] 支持高清预览

### 命名增强
- [ ] 支持表情符号
- [ ] 名称重复检测
- [ ] 历史名称建议
- [ ] 批量重命名

### 预览优化
- [ ] 支持缩放查看
- [ ] 3D旋转效果
- [ ] 动画展示
- [ ] 多角度预览

## 技术细节

### 圆形布局算法
```typescript
// 珠子总数
const totalBeads = design.bracelet.beads.length

// 每个珠子的角度
const angle = (index / totalBeads) * 2 * Math.PI - Math.PI / 2

// 圆环半径
const radius = 60

// 容器中心点
const centerX = 90
const centerY = 90

// 计算珠子位置
const x = centerX + radius * Math.cos(angle)
const y = centerY + radius * Math.sin(angle)
```

### 样式层级
```
容器 (z-index: 0)
  ├─ 边框装饰 (::before)
  ├─ 圆环线条 (z-index: 0)
  └─ 珠子 (z-index: 1)
```

### 性能优化
- 使用CSS transform定位
- 避免重复计算
- 优化渲染性能
- 减少DOM操作

## 注意事项

1. **命名限制**
   - 最大长度20字符
   - 自动去除首尾空格
   - 空值使用默认名称

2. **预览显示**
   - 珠子数量较多时可能重叠
   - 建议珠子数量在20个以内
   - 超过建议数量时考虑缩小珠子尺寸

3. **兼容性**
   - 支持所有现代浏览器
   - 小程序环境完全兼容
   - 三角函数计算精度足够

4. **用户体验**
   - 命名对话框自动聚焦
   - 支持键盘操作
   - 点击遮罩关闭
   - 清晰的视觉反馈
