# 调试指南 - 珠子不显示问题

## 问题描述

在DIY页面的珠子选择器中看不到测试珠子数据。

## 已实施的修复

### 1. 修复了BeadSelector的useEffect依赖问题

**问题**: 原来的代码在useEffect中依赖了`loadBeads`和`loadCategories`函数，导致无限循环。

**修复**: 
- 将数据加载逻辑直接放在useEffect中
- 移除了函数依赖，只依赖实际的状态变量
- 添加了详细的console.log用于调试

### 2. 添加了Mock数据测试工具

创建了 `src/utils/testMockData.ts` 用于验证Mock数据是否正常工作。

### 3. 在DIY页面添加了自动测试

页面加载时会自动运行Mock数据测试，并在控制台输出结果。

## 调试步骤

### 步骤1: 检查控制台输出

1. 启动开发服务器:
```bash
cd crystal-bracelet-diy
npm run dev:weapp
```

2. 在微信开发者工具中打开项目

3. 进入DIY页面

4. 打开控制台（Console），查看输出：

应该看到类似这样的输出：
```
DIY页面已加载，开始测试Mock数据...
=== 开始测试Mock数据 ===
1. 测试获取珠子列表...
珠子列表: {beads: Array(10), total: 10, page: 1, pageSize: 20}
共 10 个珠子
...
✅ 所有测试通过！
```

### 步骤2: 检查BeadSelector的加载状态

在控制台中应该看到：
```
开始加载珠子数据... {currentCategory: undefined, searchKeyword: ""}
珠子数据加载成功: {beads: Array(10), total: 10, page: 1, pageSize: 20}
```

### 步骤3: 检查图片路径

确认 `crystal_test.png` 文件存在：
```bash
ls -la crystal-bracelet-diy/src/assets/crystal_test.png
```

### 步骤4: 手动测试Mock服务

在微信开发者工具的控制台中运行：
```javascript
window.testMockData()
```

## 常见问题排查

### 问题1: 控制台显示"加载失败"

**可能原因**:
- Mock服务抛出了异常
- 图片导入失败

**解决方法**:
1. 检查控制台的详细错误信息
2. 确认 `USE_MOCK` 为 `true`
3. 检查图片文件是否存在

### 问题2: 显示"暂无珠子数据"

**可能原因**:
- Mock服务返回了空数组
- 搜索或筛选条件过于严格

**解决方法**:
1. 点击"全部"分类
2. 清空搜索框
3. 检查控制台的数据加载日志

### 问题3: 一直显示Loading

**可能原因**:
- 异步请求没有正确完成
- loading状态没有正确重置

**解决方法**:
1. 检查控制台是否有错误
2. 刷新页面重试
3. 检查网络请求是否超时

### 问题4: 图片不显示

**可能原因**:
- 图片路径不正确
- 图片文件损坏
- Taro没有正确处理图片导入

**解决方法**:
1. 检查图片文件是否存在
2. 尝试使用绝对路径
3. 检查微信开发者工具的网络面板

## 验证Mock数据配置

### 检查USE_MOCK开关

在 `src/services/beadService.ts` 中：
```typescript
const USE_MOCK = process.env.NODE_ENV === 'development' || true
```

确保这个值为 `true`。

### 检查Mock数据

在 `src/services/mockBeadService.ts` 中：
```typescript
const mockBeads: Bead[] = [
  {
    id: 'bead-001',
    name: '紫水晶',
    category: 'amethyst',
    imageUrl: crystalTestImg,
    price: 15.00,
    weight: 2.5,
    diameter: 8,
    stock: 100,
    description: '天然紫水晶，色泽纯正',
  },
  // ... 更多珠子
]
```

确保数组中有数据。

## 强制刷新

如果修改了代码但没有生效：

1. 停止开发服务器 (Ctrl+C)
2. 清理构建缓存:
```bash
rm -rf crystal-bracelet-diy/dist
```
3. 重新启动:
```bash
npm run dev:weapp
```
4. 在微信开发者工具中点击"清缓存" -> "清除全部缓存"
5. 重新编译

## 查看完整的数据流

### 1. Mock服务层
```
mockBeadService.getBeads() 
  -> 返回10个测试珠子
```

### 2. 业务服务层
```
beadService.getBeads()
  -> 检查USE_MOCK
  -> 调用mockBeadService.getBeads()
  -> 返回数据
```

### 3. 组件层
```
BeadSelector
  -> useEffect触发
  -> 调用beadService.getBeads()
  -> setBeads(result.beads)
  -> 渲染珠子列表
```

### 4. UI层
```
BeadItem
  -> 接收bead数据
  -> 显示图片和信息
```

## 成功标志

当一切正常时，你应该看到：

1. ✅ 控制台显示"Mock数据测试成功"
2. ✅ 控制台显示"珠子数据加载成功"
3. ✅ DIY页面底部显示10个珠子卡片
4. ✅ 每个珠子显示crystal_test.png图片
5. ✅ 每个珠子显示名称、价格、尺寸
6. ✅ 顶部显示分类标签
7. ✅ 搜索框可以正常使用

## 联系支持

如果以上步骤都无法解决问题，请提供：

1. 控制台的完整错误信息
2. 网络面板的请求记录
3. BeadSelector组件的渲染状态
4. Mock数据测试的输出结果

## 相关文档

- [Mock数据使用指南](./docs/MOCK_DATA_GUIDE.md)
- [快速启动指南](./QUICK_START.md)
- [性能优化总结](./docs/PERFORMANCE_OPTIMIZATION.md)
