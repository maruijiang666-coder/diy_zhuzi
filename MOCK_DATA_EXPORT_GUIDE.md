# Mock数据导出指南

## 概述
本项目提供了完整的Mock数据导出功能，支持将开发环境中的模拟数据导出为JSON文件，便于数据分析、测试和备份。

## 可用功能

### 1. 数据导出工具 (`src/utils/exportMockData.ts`)
提供了以下导出函数：

- `exportAllMockData()` - 导出所有Mock数据
- `exportMockDataByType(type)` - 按类型导出指定数据
- `getMockDataStats()` - 获取数据统计信息

支持的数据类型：
- `beads` - 珠子数据
- `categories` - 分类数据  
- `cart` - 购物车数据
- `designs` - 设计数据
- `orders` - 订单数据（目前为空）

### 2. 可视化导出界面 (`mock-data-export.html`)
提供了用户友好的Web界面，包含：
- 📊 数据统计面板
- 📤 批量导出功能
- 🎯 分类导出选项
- 🛠️ 开发者工具

### 3. 测试页面 (`test-export.html`)
用于验证导出功能的测试页面，包含：
- 🧪 功能测试
- 👁️ 数据预览
- 📋 测试日志

## 使用方法

### 浏览器控制台使用
在浏览器开发者工具的控制台中执行：

```javascript
// 导出所有数据
window.exportAllMockData()

// 导出特定类型数据
window.exportMockDataByType('beads')
window.exportMockDataByType('categories')
window.exportMockDataByType('cart')
window.exportMockDataByType('designs')

// 获取数据统计
window.getMockDataStats()
```

### Web界面使用
1. 在浏览器中打开 `mock-data-export.html`
2. 查看数据统计信息
3. 点击相应的导出按钮
4. 数据将自动下载为JSON文件

### 测试验证
1. 打开 `test-export.html`
2. 点击测试按钮验证功能
3. 查看测试结果和数据预览

## 数据结构

### 珠子数据 (Beads)
```json
{
  "id": 1,
  "name": "紫水晶珠子",
  "category": "amethyst",
  "price": 25,
  "size": 8,
  "color": "#9966CC",
  "image": "/assets/images/amethyst.png",
  "description": "高品质紫水晶珠子"
}
```

### 分类数据 (Categories)
```json
{
  "id": "amethyst",
  "name": "紫水晶",
  "description": "紫水晶系列"
}
```

### 购物车数据 (Cart)
```json
{
  "beadId": 1,
  "quantity": 2,
  "bead": { /* 珠子对象 */ }
}
```

### 设计数据 (Designs)
```json
{
  "id": "design-1",
  "name": "测试设计",
  "beads": [/* 购物车项数组 */],
  "totalPrice": 50,
  "totalWeight": 10,
  "totalLength": 16
}
```

## 注意事项

1. **订单数据**：目前订单服务未实现mock模式，导出为空数组
2. **文件下载**：导出功能需要浏览器支持Blob和下载功能
3. **数据格式**：所有数据以JSON格式导出，便于后续处理
4. **浏览器兼容性**：建议使用现代浏览器（Chrome、Firefox、Safari等）

## 扩展开发

### 添加新的导出类型
1. 在 `exportMockDataByType` 函数中添加新的case
2. 实现对应的数据获取逻辑
3. 更新HTML界面中的导出选项

### 自定义数据格式
可以修改导出函数中的数据处理逻辑，例如：
- 添加数据过滤条件
- 修改字段名称或格式
- 增加计算字段

### 集成到现有系统
可以将导出功能集成到现有的管理后台：
```javascript
import { exportAllMockData } from './src/utils/exportMockData'

// 在管理后台调用
await exportAllMockData()
```

## 故障排除

### 常见问题

1. **导出无反应**
   - 检查浏览器控制台是否有错误信息
   - 确保浏览器允许文件下载
   - 验证数据服务是否正常工作

2. **数据为空**
   - 确认mock服务已启用
   - 检查数据是否正确初始化
   - 验证服务方法是否返回预期数据

3. **文件下载失败**
   - 检查浏览器下载设置
   - 确保有足够的磁盘空间
   - 尝试使用不同的浏览器

### 调试方法

1. **控制台调试**
   ```javascript
   // 检查数据
   console.log(await mockBeadService.getBeads())
   console.log(await mockCartService.getCartItems())
   ```

2. **网络监控**
   - 打开浏览器开发者工具
   - 切换到Network标签
   - 查看是否有失败的请求

3. **日志查看**
   - 查看浏览器控制台日志
   - 检查导出过程中的详细输出

## 更新日志

### v1.0.0 (当前版本)
- ✅ 基础数据导出功能
- ✅ Web可视化界面
- ✅ 浏览器控制台支持
- ✅ 测试验证页面
- ✅ 数据统计功能

### 计划功能
- 🔄 订单服务Mock数据支持
- 🔄 数据筛选和搜索功能
- 🔄 批量数据操作
- 🔄 数据导入功能
- 🔄 Excel格式导出支持