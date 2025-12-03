# API 集成说明

## 真实 API 配置

项目已集成真实后端 API，支持 Mock 数据和真实 API 之间的切换。

### API 配置信息

- **Base URL**: `http://121.43.104.161:6011/api/diy`
- **API Key**: `123quant-speed`
- **认证方式**: 请求头 `X-API-Key`

### 切换 Mock/真实 API

在 `src/services/beadService.ts` 中修改：

```typescript
// true = 使用 Mock 数据
// false = 使用真实 API
const USE_MOCK = false
```

### API 端点

#### 获取珠子列表
- **URL**: `GET /beads/`
- **参数**:
  - `page`: 页码（可选，默认 1）
  - `category`: 分类筛选（可选）
  - `search`: 搜索关键词（可选）

- **响应格式**:
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "爱情绝唱",
      "category": "黄水晶",
      "image_url": "https://...",
      "price": "58.00",
      "weight": "12.00",
      "diameter": "8.00",
      "stock": 0,
      "description": "",
      "created_at": "2025-11-28T15:28:34",
      "updated_at": "2025-11-28T15:29:27.580211"
    }
  ]
}
```

### 数据转换

API 返回的数据会自动转换为前端使用的格式：

- `id`: number → string
- `image_url` → `imageUrl`
- `price`: string → number
- `weight`: string → number
- `diameter`: string → number

### 修改的文件

1. **src/constants/config.ts**: 更新 API_BASE_URL 和添加 API_KEY
2. **src/api/client.ts**: 添加 X-API-Key 请求头，优化响应处理
3. **src/api/endpoints.ts**: 适配 Django REST framework 分页格式
4. **src/constants/api.ts**: 添加 URL 尾部斜杠
5. **src/services/beadService.ts**: 保留 Mock 控制开关

### 注意事项

- API 使用 Django REST framework 的标准分页格式
- 所有珠子相关的端点都需要 `X-API-Key` 请求头
- URL 需要尾部斜杠（如 `/beads/` 而不是 `/beads`）

### 微信小程序域名限制

**重要：微信小程序只支持 HTTPS 协议，不支持 HTTP。**

当前 API 地址 `http://121.43.104.161:6011` 无法在小程序中使用，会报错：
```
http://121.43.104.161:6011 不在以下 request 合法域名列表中
```

**解决方案：**

1. **开发阶段**：在微信开发者工具中关闭域名校验
   - 点击右上角"详情"
   - 找到"本地设置"
   - 勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"

2. **生产环境**：配置 HTTPS 域名
   - 为服务器配置 SSL 证书
   - 使用 HTTPS 域名（如 `https://api.yourdomain.com`）
   - 在微信公众平台配置服务器域名白名单

3. **临时方案**：使用 Mock 数据
   - 在 `src/services/beadService.ts` 中设置 `USE_MOCK = true`
