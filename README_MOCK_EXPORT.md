# 🚀 Mock数据导出功能

## 📋 快速开始

### 1. 命令行导出（推荐）
```bash
# 查看数据统计
npm run mock:export:stats

# 导出所有数据
npm run mock:export:all

# 导出特定类型数据
npm run mock:export:beads        # 珠子数据
npm run mock:export:categories   # 分类数据
npm run mock:export:cart         # 购物车数据
npm run mock:export:designs      # 设计数据

# 自定义输出文件
npm run mock:export -- all ./my-data.json
npm run mock:export -- beads ./beads-only.json
```

### 2. 浏览器导出
打开以下HTML文件，使用可视化界面导出：
- `mock-data-export.html` - 主导出界面
- `test-export.html` - 测试验证页面

在浏览器控制台执行：
```javascript
// 导出所有数据
window.exportAllMockData()

// 导出特定类型
window.exportMockDataByType('beads')

// 获取统计信息
window.getMockDataStats()
```

## 📊 数据概览

| 数据类型 | 数量 | 状态 |
|---------|------|------|
| 珠子 | 10个 | ✅ 可用 |
| 分类 | 10个 | ✅ 可用 |
| 购物车 | 动态 | ✅ 可用 |
| 设计 | 动态 | ✅ 可用 |
| 订单 | 0个 | ⚠️ 未实现 |

## 📁 导出文件

### 生成的文件
- `mock-data-YYYY-MM-DD.json` - 所有数据
- `mock-beads.json` - 珠子数据
- `mock-categories.json` - 分类数据
- `mock-cart.json` - 购物车数据
- `mock-designs.json` - 设计数据
- `mock-orders.json` - 订单数据（空）

### 文件格式
所有导出的数据都是标准JSON格式，包含：
- 完整的数据结构
- 时间戳和版本信息
- 便于后续处理和分析

## 🔧 技术实现

### 核心文件
- `src/utils/exportMockData.ts` - 主要导出逻辑
- `scripts/export-mock-data.js` - Node.js脚本
- `mock-data-export.html` - Web界面
- `test-export.html` - 测试页面

### 依赖服务
- `mockBeadService` - 珠子数据服务
- `mockCartService` - 购物车服务
- `mockDesignService` - 设计服务

## 💡 使用场景

### 开发阶段
- 📊 数据分析和调试
- 🧪 单元测试数据准备
- 📋 功能演示和验证
- 💾 数据备份和迁移

### 测试阶段
- ✅ 接口测试数据
- 📈 性能测试数据
- 🔄 回归测试验证
- 📚 文档示例数据

### 生产准备
- 📖 产品演示数据
- 🎯 用户培训材料
- 📊 数据分析样本
- 💼 商务展示数据

## ⚠️ 注意事项

1. **订单数据**：目前订单服务未实现mock模式，导出为空数组
2. **购物车数据**：基于本地存储，数据可能因用户操作而变化
3. **设计数据**：用户创建的设计，数量会动态变化
4. **文件下载**：需要浏览器支持Blob API

## 🚀 高级用法

### 自定义导出
修改 `src/utils/exportMockData.ts`：
```typescript
// 添加数据过滤
const filteredBeads = allData.beads.filter(bead => bead.price > 20);

// 添加计算字段
allData.summary = {
  totalValue: allData.beads.reduce((sum, bead) => sum + bead.price, 0),
  avgPrice: allData.beads.reduce((sum, bead) => sum + bead.price, 0) / allData.beads.length
};
```

### 批量处理
使用脚本进行批量导出：
```bash
# 批量导出所有类型
for type in beads categories cart designs; do
  npm run mock:export -- $type "./exports/mock-${type}.json"
done
```

### 数据验证
在导出后验证数据完整性：
```bash
# 验证JSON格式
node -e "console.log(JSON.parse(require('fs').readFileSync('mock-data.json', 'utf8')).beads.length)"

# 统计数据分析
npm run mock:export:stats
```

## 📞 支持

如遇到问题，请检查：
1. ✅ 项目依赖是否安装：`npm install`
2. ✅ 构建是否成功：`npm run build:weapp`
3. ✅ 文件路径是否正确
4. ✅ 浏览器控制台错误信息

详细文档请参考：`MOCK_DATA_EXPORT_GUIDE.md`