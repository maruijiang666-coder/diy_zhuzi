# 微信小程序服务器域名配置指南

## 🚨 重要提示

微信小程序**必须配置服务器域名白名单**，否则无法发起网络请求！

## 📋 当前问题

**错误信息**:
```
网络请求失败，请检查网络连接
```

**原因**:
1. 微信小程序默认只允许访问已配置的服务器域名
2. `https://therianclouds.mynatapp.cc` 未在白名单中
3. 日志显示请求被拦截

## ✅ 解决方案

### 方案 1: 开发环境 - 关闭域名校验（推荐用于开发）

在**微信开发者工具**中：

1. 点击右上角"详情"按钮
2. 找到"本地设置"标签
3. 勾选 ✅ **"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"**
4. 刷新小程序

**优点**:
- ✅ 立即生效
- ✅ 无需配置
- ✅ 适合开发测试

**缺点**:
- ⚠️ 仅在开发工具中有效
- ⚠️ 真机预览时无效

### 方案 2: 配置服务器域名（用于真机测试和生产）

#### 步骤 1: 登录微信公众平台

访问: https://mp.weixin.qq.com/

使用小程序管理员账号登录

#### 步骤 2: 进入开发设置

1. 左侧菜单：开发 → 开发管理
2. 点击"开发设置"
3. 找到"服务器域名"部分

#### 步骤 3: 配置 request 合法域名

点击"修改"按钮，添加以下域名：

**开发/测试环境**:
```
https://therianclouds.mynatapp.cc
```

**生产环境**:
```
https://crystal.quant-speed.com
```

#### 步骤 4: 保存并等待生效

- 点击"保存并提交"
- 等待 5-10 分钟生效
- 重新编译小程序

### 方案 3: 清除编译缓存（如果配置已更新但未生效）

#### 在开发工具中

1. 点击菜单：工具 → 清除缓存
2. 选择"清除所有缓存"
3. 重新编译项目

#### 在命令行中

```bash
# 停止开发服务器（Ctrl+C）

# 删除 dist 目录
rmdir /s /q dist

# 重新启动
npm run dev:weapp
```

## 🔍 验证配置

### 1. 检查微信开发者工具设置

**路径**: 详情 → 本地设置

**确认以下选项已勾选**:
- ✅ 不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书

### 2. 检查控制台日志

**预期看到**:
```
=== API 请求详情 ===
URL: https://therianclouds.mynatapp.cc/api/diy/auth/wx/get_openid/
Method: POST
```

**不应该看到**:
```
URL: https://crystal.quant-speed.com/...  ❌ 错误的域名
```

### 3. 测试网络请求

在控制台执行：

```javascript
wx.request({
  url: 'https://therianclouds.mynatapp.cc/api/diy/beads/',
  success: (res) => console.log('成功:', res),
  fail: (err) => console.log('失败:', err)
})
```

**成功响应**:
```javascript
{
  statusCode: 200,
  data: { ... }
}
```

**失败响应**（域名未配置）:
```javascript
{
  errMsg: "request:fail url not in domain list"
}
```

## 📱 真机调试配置

### 1. 开启调试模式

在微信开发者工具中：
1. 点击"预览"按钮
2. 使用手机微信扫码
3. 在手机上打开小程序
4. 右上角 ··· → 打开调试

### 2. 查看 vConsole

真机上会显示 vConsole 调试面板，可以查看：
- Network 请求
- Console 日志
- 错误信息

## ⚙️ 项目配置检查

### 检查 API 基础地址

**文件**: `src/constants/config.ts`

```typescript
export const API_BASE_URL = {
  development: 'https://therianclouds.mynatapp.cc/api/diy',  // ✅ 正确
  test: 'https://therianclouds.mynatapp.cc/api/diy',         // ✅ 正确
  production: 'https://crystal.quant-speed.com/api/diy',     // ✅ 生产环境
}[process.env.NODE_ENV || 'development']
```

### 检查环境变量

```bash
# 查看当前环境
echo %NODE_ENV%

# 如果为空或 development，则使用开发配置
```

### 强制使用开发环境

如果需要确保使用开发配置，可以临时修改：

```typescript
// src/constants/config.ts
export const API_BASE_URL = 'https://therianclouds.mynatapp.cc/api/diy'
```

## 🐛 常见问题

### Q1: 为什么日志显示 crystal.quant-speed.com？

**可能原因**:
1. 编译缓存未清除
2. 配置文件未保存
3. 开发服务器未重启

**解决方案**:
```bash
# 1. 停止开发服务器
Ctrl+C

# 2. 清除 dist 目录
rmdir /s /q dist

# 3. 重新启动
npm run dev:weapp
```

### Q2: 配置了域名但还是失败？

**检查清单**:
- [ ] 域名是否以 https:// 开头
- [ ] 域名是否包含端口号（不需要）
- [ ] 是否等待 5-10 分钟生效
- [ ] 是否重新编译小程序
- [ ] 是否清除了缓存

### Q3: natapp 域名经常变化怎么办？

**方案 A**: 购买 natapp 固定域名
- 访问: https://natapp.cn/
- 购买 VIP 隧道
- 获得固定域名

**方案 B**: 使用开发工具的"不校验域名"选项
- 仅用于开发测试
- 无需配置域名

**方案 C**: 使用本地开发环境
- 后端运行在本地
- 使用 localhost 或 127.0.0.1
- 需要手机和电脑在同一网络

### Q4: 如何在真机上测试？

**步骤**:
1. 在微信公众平台配置域名
2. 等待生效（5-10分钟）
3. 重新编译小程序
4. 使用"预览"功能扫码
5. 在手机上打开调试模式

## 📊 域名配置对比

| 环境 | 域名 | 配置位置 | 是否需要白名单 |
|------|------|---------|--------------|
| 开发工具 | 任意 | 关闭域名校验 | ❌ 不需要 |
| 真机预览 | 固定 | 微信公众平台 | ✅ 需要 |
| 体验版 | 固定 | 微信公众平台 | ✅ 需要 |
| 正式版 | 固定 | 微信公众平台 | ✅ 需要 |

## 🎯 推荐配置流程

### 开发阶段

1. ✅ 在微信开发者工具中关闭域名校验
2. ✅ 使用 natapp 临时域名
3. ✅ 快速迭代开发

### 测试阶段

1. ✅ 购买 natapp 固定域名或使用正式域名
2. ✅ 在微信公众平台配置域名
3. ✅ 真机测试验证

### 生产阶段

1. ✅ 使用正式域名
2. ✅ 配置 HTTPS 证书
3. ✅ 在微信公众平台配置生产域名

## 📚 相关文档

- [微信小程序 - 服务器域名配置](https://developers.weixin.qq.com/miniprogram/dev/framework/ability/network.html)
- [natapp 官网](https://natapp.cn/)
- [微信公众平台](https://mp.weixin.qq.com/)

---

**最后更新**: 2024-12-04
**当前配置**: `https://therianclouds.mynatapp.cc`
