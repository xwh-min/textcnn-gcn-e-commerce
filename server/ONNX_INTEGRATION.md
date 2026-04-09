# ONNX 推理集成指南

## 📌 当前状态

✅ **架构已完整** - inference、repository、service 三个包的分层架构已实现  
✅ **编译通过** - 项目可以正常编译运行  
✅ **双版本保留** - 同时包含模拟实现和真实 ONNX 推理代码

---

## 🎯 两个版本说明

### 🟢 版本 1: 模拟实现（默认，推荐用于毕业设计）

**位置**: `inference/onnx.go`  
**当前默认**: ✅ 已启用  

**优势**:
- 零依赖，纯 Go 实现
- 无需安装任何额外组件
- 跨平台兼容性好
- 可以直接编译运行
- 适合演示和测试

**特性**:
- 基于输入特征模拟推理结果
- 自动降级到模拟实现

---

### 🔵 版本 2: 真实 ONNX 推理（可选，推荐用于生产环境）

**位置**: `inference/onnx_real.go.disabled`  
**当前状态**: 📁 代码已保留，但默认禁用

**优势**:
- 使用真实的 ONNX Runtime
- 调用真实的 `.onnx` 模型
- 适合生产环境使用

**要求**:
- 需要 CGO 支持
- 需要 GCC 编译器
- 需要 ONNX Runtime 原生库

---

## 🔄 如何切换版本

### 从模拟 → 真实 ONNX 推理

#### 方法 1: 文件重命名（推荐）

```bash
# 1. 备份当前模拟实现
cd server
copy inference\onnx.go inference\onnx_mock.go

# 2. 将真实实现重命名为 onnx.go
copy inference\onnx_real.go.disabled inference\onnx.go

# 3. 重新编译
go build ./cmd/api
```

#### 方法 2: 手动替换

```bash
# Windows PowerShell
cd server

# 备份和替换
Move-Item -Path inference\onnx.go -Destination inference\onnx_mock.go
Move-Item -Path inference\onnx_real.go.disabled -Destination inference\onnx.go

# 重新编译
go build ./cmd/api
```

---

### 从真实 → 模拟 ONNX 推理

```bash
# 1. 恢复模拟实现
cd server
copy inference\onnx_mock.go inference\onnx.go

# 2. 重新编译
go build ./cmd/api
```

---

## 📦 真实 ONNX 推理的完整配置

如果你想使用真实的 ONNX 推理，请按以下步骤配置：

### 步骤 1: 安装 MinGW（Windows）

1. 下载安装 MSYS2  
   https://www.msys2.org/

2. 打开 MSYS2 MinGW 64-bit 终端，运行：

```bash
pacman -S mingw-w64-x86_64-gcc
```

3. 将 MinGW 的 bin 目录添加到系统 PATH：
   ```
   C:\msys64\mingw64\bin
   ```

---

### 步骤 2: 下载 ONNX Runtime

```bash
# 下载 Windows 版本
https://github.com/microsoft/onnxruntime/releases

# 选择最新版本，例如：
# onnxruntime-win-x64-1.16.3.zip

# 解压到指定目录，例如：
# C:\onnxruntime
```

---

### 步骤 3: 设置环境变量

在 PowerShell 中运行：

```powershell
# 设置 CGO 环境变量
$env:CGO_ENABLED="1"
$env:C_INCLUDE_PATH="C:\onnxruntime\include"
$env:LIBRARY_PATH="C:\onnxruntime\lib"
$env:PATH="$env:PATH;C:\onnxruntime\lib"
```

或者在系统环境变量中永久设置。

---

### 步骤 4: 添加依赖

```bash
cd server
go get github.com/yalue/onnxruntime_go
```

---

### 步骤 5: 切换到真实实现

```bash
cd server
copy inference\onnx_real.go.disabled inference\onnx.go
go build ./cmd/api
```

---

## 🎨 架构设计

### 分层架构

```
┌─────────────────────────────────────────┐
│        Handler (API Layer)              │
│ - HTTP 请求处理                          │
│ - 参数验证                              │
│ - 响应格式化                            │
└───────────────────┬─────────────────────┘
                    │
                    │
┌─────────────────────────────────────────┐
│        Service (Business Layer)         │
│ - 业务逻辑编排                          │
│ - 数据聚合                              │
│ - 特征工程协调                          │
└───────────────────┬─────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                   │
┌─────────────────┐  ┌─────────────────┐
│  Inference      │  │  Repository     │
│  - ONNX 推理     │  │  - 数据访问      │
│  - 特征提取      │  │  - 数据库操作     │
└─────────────────┘  └─────────────────┘
```

### 关键文件

```
server/
├── inference/
│   ├── onnx.go              # ONNX 推理引擎（当前：模拟实现）
│   ├── onnx_real.go.disabled # ONNX 推理引擎（真实 ONNX 实现）
│   ├── onnx_mock.go        # 备份的模拟实现（可选）
│   ├── feature_extractor.go # 特征提取器
│   └── errors.go            # 错误定义
├── repository/
│   └── risk_repository.go   # 数据访问层
├── service/
│   └── risk_service.go      # 业务逻辑层
└── internal/api/handlers/
    └── risk.go              # API Handler
```

---

## 📊 特征工程

### TextCNN 特征（模拟）

```go
textFeatures := fe.ExtractTextFeatures(
    policyNews,     // 政策新闻
    userComplaints, // 用户投诉
    recentData,   // 近期数据
)
```

### GCN 图特征（模拟）

```go
graphFeatures := fe.ExtractGraphFeatures(graphStructure)
```

### 特征融合

```go
combined := fe.CombineFeatures(textFeatures, graphFeatures)
```

---

## 📝 使用示例

### 测试当前实现（模拟）

```bash
cd server
go run test/test_architecture.go
```

### 切换到真实 ONNX 推理后

```bash
# 1. 切换文件
copy inference\onnx_real.go.disabled inference\onnx.go

# 2. 设置环境变量（一次性）
$env:CGO_ENABLED="1"

# 3. 运行
go run test/test_architecture.go
```

---

## ⚠️ 注意事项

1. **毕业设计推荐使用模拟实现：
   - 简单易用
   - 无需配置
   - 跨平台
   - 可以正常演示

2. **真实 ONNX 推理仅用于：
   - 生产环境
   - 需要真实模型推理
   - 有足够的技术配置

3. **自动降级：
   - 真实实现失败时会自动降级到模拟实现

---

## 🎓 推荐方案

| 场景 | 推荐实现 |
|------|---------|
| 毕业设计演示 | ✅ 模拟实现 |
| 开发测试 | ✅ 模拟实现 |
| 生产环境部署 | ⚠️ 真实实现（需要配置） |

---

## 🔗 相关资源

- [完整 API 文档](./API_DOCUMENTATION.md)
- [架构设计文档](./ARCHITECTURE.md)
- [前端调用指南](./FRONTEND_GUIDE.md)
