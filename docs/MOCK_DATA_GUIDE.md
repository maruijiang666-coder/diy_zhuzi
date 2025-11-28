# Mock数据使用指南

## 概述

为了方便开发和测试，项目中集成了Mock数据服务，可以在没有后端API的情况下进行前端开发。

## 配置

### 启用/禁用Mock数据

在 `src/services/beadService.ts` 中修改 `USE_MOCK` 常量：

```typescript
// 是否使用Mock数据（开发环境下使用）
const USE_MOCK = process.env.NODE_ENV === 'development' || true
```

- `true`: 使用Mock数据
- `false`: 使用真实API

## Mock数据内容

### 珠子数据

Mock服务提供了10个测试珠子，包括：

1. **紫水晶** - ¥15.00, 8mm
2. **粉晶** - ¥12.00, 8mm
3. **黑曜石** - ¥10.00, 10mm
4. **白水晶** - ¥8.00, 6mm
5. **黄水晶** - ¥18.00, 8mm
6. **绿幽灵** - ¥25.00, 10mm
7. **红玛瑙** - ¥14.00, 8mm
8. **虎眼石** - ¥16.00, 10mm
9. **月光石** - ¥20.00, 8mm
10. **青金石** - ¥22.00, 10mm

所有珠子都使用同一张测试图片：`src/assets/crystal_test.png`

### 分类数据

Mock服务提供了10个珠子分类，对应上述珠子类型。

## 功能支持

Mock服务支持以下功能：

### 1. 分页加载

```typescript
const result = await beadService.getBeads(undefined, undefined, 1, 20)
// 返回第1页，每页20条数据
```

### 2. 分类筛选

```typescript
const result = await beadService.getBeads('amethyst', undefined, 1, 20)
// 只返回紫水晶分类的珠子
```

### 3. 关键词搜索

```typescript
const result = await beadService.getBeads(undefined, '水晶', 1, 20)
// 返回名称或描述中包含"水晶"的珠子
```

### 4. 组合查询

```typescript
const result = await beadService.getBeads('amethyst', '紫', 1, 20)
// 同时应用分类筛选和关键词搜索
```

### 5. 获取分类列表

```typescript
const categories = await beadService.getCategories()
// 返回所有分类
```

### 6. 获取珠子详情

```typescript
const bead = await beadService.getBeadById('bead-001')
// 返回指定ID的珠子详情
```

## 网络延迟模拟

Mock服务会模拟真实的网络延迟：

- 获取珠子列表：300ms
- 获取分类列表：200ms
- 获取珠子详情：200ms

这样可以更真实地测试加载状态和用户体验。

## 在DIY页面中使用

DIY页面会自动使用Mock数据，无需额外配置。启动开发服务器后：

```bash
npm run dev:weapp
```

在微信开发者工具中打开项目，进入DIY页面，你就能看到测试珠子数据了。

## 添加更多测试数据

如果需要添加更多测试珠子，编辑 `src/services/mockBeadService.ts`：

```typescript
const mockBeads: Bead[] = [
  // 现有数据...
  {
    id: 'bead-011',
    name: '新珠子',
    category: 'new-category',
    imageUrl: crystalTestImg, // 或使用其他图片
    price: 30.00,
    weight: 3.5,
    diameter: 12,
    stock: 50,
    description: '新珠子描述',
  },
]
```

## 切换到真实API

当后端API准备好后，只需要：

1. 修改 `src/services/beadService.ts` 中的 `USE_MOCK` 为 `false`
2. 确保 `src/constants/config.ts` 中的 `API_BASE_URL` 配置正确
3. 重新启动开发服务器

## 注意事项

1. **图片路径**: Mock数据中的图片使用 `import` 导入，确保图片文件存在于 `src/assets/` 目录
2. **数据一致性**: Mock数据的结构必须与真实API返回的数据结构一致
3. **错误处理**: Mock服务也会抛出错误（如珠子不存在），用于测试错误处理逻辑
4. **性能测试**: Mock数据量较小，不适合进行大数据量的性能测试

## 故障排查

### 珠子列表为空

检查：
1. `USE_MOCK` 是否为 `true`
2. `mockBeads` 数组是否有数据
3. 分类筛选或搜索条件是否过于严格

### 图片不显示

检查：
1. `crystal_test.png` 是否存在于 `src/assets/` 目录
2. 图片导入路径是否正确
3. 微信开发者工具是否正确加载了静态资源

### 网络请求错误

如果看到网络请求错误，说明 `USE_MOCK` 可能为 `false`，系统尝试调用真实API。将其改为 `true` 即可。

## 示例代码

### 在组件中使用

```typescript
import { beadService } from '@/services/beadService'

// 在组件中
const loadBeads = async () => {
  try {
    const result = await beadService.getBeads()
    console.log('珠子列表:', result.beads)
  } catch (error) {
    console.error('加载失败:', error)
  }
}
```

### 测试不同场景

```typescript
// 测试分页
const page1 = await beadService.getBeads(undefined, undefined, 1, 5)
const page2 = await beadService.getBeads(undefined, undefined, 2, 5)

// 测试搜索
const searchResult = await beadService.getBeads(undefined, '水晶')

// 测试分类
const amethystBeads = await beadService.getBeads('amethyst')

// 测试详情
const bead = await beadService.getBeadById('bead-001')
```

## 总结

Mock数据服务让你可以：
- ✅ 在没有后端的情况下开发前端功能
- ✅ 快速测试各种场景和边界情况
- ✅ 模拟真实的网络延迟和加载状态
- ✅ 轻松切换到真实API

现在你可以开始在DIY页面中测试珠子显示功能了！
