# 图片优化文档

本文档说明了项目中实现的图片优化策略。

## 优化特性

### 1. CDN加速

所有图片资源通过CDN分发，提高加载速度和可用性。

**配置位置**: `src/constants/config.ts`

```typescript
export const CDN_BASE_URL = {
  development: 'https://dev-cdn.example.com',
  test: 'https://test-cdn.example.com',
  production: 'https://cdn.example.com',
}[process.env.NODE_ENV || 'development']
```

### 2. 多尺寸图片

根据使用场景自动选择合适的图片尺寸，减少带宽消耗。

**可用尺寸**:
- `THUMBNAIL`: 100x100 - 用于设计画布中的珠子预览
- `SMALL`: 200x200 - 用于珠子列表项
- `MEDIUM`: 400x400 - 用于详情页
- `LARGE`: 800x800 - 用于大图预览
- `ORIGINAL`: 原图 - 用于特殊场景

**使用示例**:
```typescript
import { getOptimizedImageUrlSync, ImageSize } from '@/utils/image'

// 获取小尺寸图片
const smallImageUrl = getOptimizedImageUrlSync(
  bead.imageUrl, 
  ImageSize.SMALL
)
```

### 3. WebP格式支持

自动检测设备是否支持WebP格式，支持时优先使用WebP以减少图片大小（通常可减少30-50%）。

**自动降级**: 不支持WebP的设备会自动使用PNG/JPG格式。

**检测逻辑**:
- 微信小程序基础库 2.9.0+ 支持WebP
- 可通过配置禁用WebP: `IMAGE_CONFIG.enableWebP = false`

### 4. 图片懒加载

列表中的图片使用懒加载，只在进入可视区域时才加载，提升首屏加载速度。

**使用示例**:
```tsx
<Image
  src={imageUrl}
  lazyLoad={true}
  mode='aspectFill'
/>
```

## 配置选项

在 `src/constants/config.ts` 中可以配置图片优化参数：

```typescript
export const IMAGE_CONFIG = {
  // 是否启用WebP格式
  enableWebP: true,
  // 是否启用图片懒加载
  enableLazyLoad: true,
  // 图片质量（1-100）
  quality: 80,
  // 图片预加载最大并发数
  preloadConcurrency: 3,
}
```

## API参考

### getOptimizedImageUrl

异步获取优化后的图片URL（会检测WebP支持）。

```typescript
const imageUrl = await getOptimizedImageUrl(
  originalUrl,
  ImageSize.MEDIUM,
  useWebP // 可选，默认自动检测
)
```

### getOptimizedImageUrlSync

同步获取优化后的图片URL（不检测WebP支持，需手动传入）。

```typescript
const imageUrl = getOptimizedImageUrlSync(
  originalUrl,
  ImageSize.SMALL,
  webpSupported
)
```

### checkWebPSupport

检测当前环境是否支持WebP格式。

```typescript
const supported = await checkWebPSupport()
```

### preloadImage

预加载单张图片。

```typescript
await preloadImage(imageUrl)
```

### preloadImages

批量预加载图片（带并发控制）。

```typescript
await preloadImages(imageUrls, maxConcurrent)
```

## 性能优化建议

1. **列表场景**: 使用 `SMALL` 或 `THUMBNAIL` 尺寸 + 懒加载
2. **详情场景**: 使用 `MEDIUM` 或 `LARGE` 尺寸
3. **预览场景**: 使用 `THUMBNAIL` 尺寸
4. **关键图片**: 使用 `preloadImage` 提前加载
5. **长列表**: 启用虚拟滚动 + 懒加载

## 后端要求

后端CDN服务需要支持以下URL参数：

- `size`: 图片尺寸，如 `200x200`
- `format`: 图片格式，如 `webp`
- `quality`: 图片质量，如 `80`

**示例URL**:
```
https://cdn.example.com/images/bead-001.jpg?size=200x200&format=webp&quality=80
```

## 监控指标

建议监控以下指标以评估优化效果：

- 图片加载时间
- 图片加载失败率
- WebP使用率
- 带宽消耗
- 首屏加载时间

## 故障排查

### 图片加载失败

1. 检查CDN配置是否正确
2. 检查图片URL格式
3. 查看网络请求日志
4. 确认CDN服务可用性

### WebP不生效

1. 检查 `IMAGE_CONFIG.enableWebP` 是否为 `true`
2. 确认设备支持WebP（基础库 2.9.0+）
3. 检查CDN是否支持WebP转换

### 懒加载不工作

1. 确认使用了 `lazyLoad={true}` 属性
2. 检查是否在ScrollView中使用
3. 确认Taro版本支持懒加载
