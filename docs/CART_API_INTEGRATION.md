# 购物车 API 集成文档

## 概述

本文档说明"加入购物车"功能的完整流程和 API 调用。

## 功能流程

当用户点击"加入购物车"按钮时，系统会执行以下步骤：

### 步骤 1：保存手串到服务器

**接口：** `POST /bracelets/`

**请求示例：**
```http
POST https://crystal.quant-speed.com/api/diy/bracelets/
Content-Type: application/json
accept: application/json
X-API-Key: 123quant-speed
X-CSRFTOKEN: QjAtpufAC7oTUhnKbQaG8GWwvZ91U2xptiRnJk19S6UXeNW1X6wnmAe6RgYJDf1M

{
  "name": "用户202512041530",
  "beads": [
    { "bead_id": 1, "position": 0 },
    { "bead_id": 5, "position": 1 },
    { "bead_id": 3, "position": 2 }
  ]
}
```

**响应示例：**
```json
{
  "id": 123,
  "name": "用户202512041530",
  "user": 1,
  "bracelet_beads": [
    {
      "id": 1,
      "bead": {
        "id": 1,
        "name": "红玛瑙",
        "category": "玛瑙",
        "image_url": "https://...",
        "price": "50.00",
        "weight": "2.50",
        "diameter": "8.00",
        "stock": 100,
        "description": "..."
      },
      "position": 0
    }
  ],
  "created_at": "2025-12-04T15:30:00Z",
  "updated_at": "2025-12-04T15:30:00Z"
}
```

### 步骤 2：将手串添加到购物车

**接口：** `POST /cart/items/`

**请求示例：**
```http
POST https://crystal.quant-speed.com/api/diy/cart/items/
Content-Type: application/json
accept: application/json
X-API-Key: 123quant-speed
X-CSRFTOKEN: QjAtpufAC7oTUhnKbQaG8GWwvZ91U2xptiRnJk19S6UXeNW1X6wnmAe6RgYJDf1M

{
  "bracelet": {
    "name": "用户202512041530",
    "user": "api_key_default_user",
    "b