# API 403 权限问题报告

## 问题描述

小程序请求后端 API 时返回 403 Forbidden 错误，但使用 curl/PowerShell 测试同样的 API 是成功的。

## 测试结果

### ✅ PowerShell 测试成功

```powershell
Invoke-WebRequest -Uri "http://121.43.104.161:6011/api/diy/beads/?page=1" `
  -Headers @{"accept"="application/json"; "X-API-Key"="123quant-speed"} `
  -Method Get

# 结果：200 OK
# 返回数据：正常的 JSON 数据
```

### ❌ 小程序请求失败

```
GET http://121.43.104.161:6011/api/diy/beads/?page=1
状态码：403 Forbidden

请求头：
- Content-Type: application/json
- accept: application/json
- X-API-Key: 123quant-speed
```

## 可能的原因

1. **CORS 跨域限制**
   - 后端可能没有配置允许小程序域名的 CORS 策略
   - 需要在后端添加 CORS 响应头

2. **Referer 检查**
   - 后端可能检查请求的 Referer 头
   - 小程序的 Referer 可能不在白名单中

3. **User-Agent 检查**
   - 后端可能限制某些 User-Agent
   - 小程序的 User-Agent 可能被拒绝

4. **IP 白名单**
   - 后端可能只允许特定 IP 访问
   - 小程序的请求 IP 可能不在白名单中

## 需要后端配置

### Django REST Framework CORS 配置

安装 django-cors-headers：
```bash
pip install django-cors-headers
```

在 settings.py 中配置：
```python
INSTALLED_APPS = [
    ...
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    ...
]

# 允许所有域名（开发环境）
CORS_ALLOW_ALL_ORIGINS = True

# 或者指定允许的域名（生产环境）
CORS_ALLOWED_ORIGINS = [
    "https://servicewechat.com",  # 微信小程序域名
]

# 允许的请求头
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-api-key',  # 添加自定义 API Key 头
]
```

### 检查 API Key 认证

确认 API Key 认证逻辑是否正确处理小程序的请求：
```python
# 检查是否正确读取 X-API-Key 请求头
api_key = request.META.get('HTTP_X_API_KEY')
```

## 临时解决方案

在开发阶段，前端使用 Mock 数据继续开发，等后端配置完成后再切换到真实 API。

切换方式：在 `src/services/beadService.ts` 中修改：
```typescript
const USE_MOCK = false  // 使用真实 API
```

## 联系信息

- 前端开发：已完成 API 集成代码
- 后端开发：需要配置 CORS 和检查认证逻辑
- API 文档：http://121.43.104.161:6011/api/diy/beads/
