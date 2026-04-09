# ONNX 推理架构说明

## 概述

本项目实现了基于 ONNX 的风险预测系统，采用分层架构设计，包括三个核心包：

- **inference** - ONNX 模型推理层
- **repository** - 数据访问层
- **service** - 业务逻辑层

## 架构设计

```
┌─────────────────────────────────────────────────┐
│              Handler Layer (API)                │
│         internal/api/handlers/risk.go           │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│              Service Layer                      │
│         service/risk_service.go                 │
│  - 业务逻辑处理                                  │
│  - 数据聚合                                      │
│  - 特征工程协调                                  │
└───────────────────┬─────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌─────────────────┐   ┌─────────────────┐
│  Inference      │   │   Repository    │
│  Layer          │   │   Layer         │
│  - ONNX 推理     │   │  - 数据访问      │
│  - 特征提取      │   │  - 数据库操作    │
└─────────────────┘   └─────────────────┘
```

## 包说明

### 1. inference 包

**位置**: `inference/`

**职责**: 
- ONNX 模型加载和管理
- 模型推理执行
- 特征提取（TextCNN 模拟、GCN 模拟）

**核心文件**:
- `onnx.go` - ONNX 推理引擎
- `feature_extractor.go` - 特征提取器
- `errors.go` - 错误定义

**使用示例**:
```go
// 创建 ONNX 推理实例
onnxInf, err := inference.NewONNXInference(inference.Config{
    ModelPath: "models/model.onnx",
    InputSize: 128,
})

// 创建特征提取器
fe := inference.NewFeatureExtractor(128, 64)

// 提取特征
textFeatures := fe.ExtractTextFeatures(policyNews, complaints, recentData)
graphFeatures := fe.ExtractGraphFeatures(graphStructure)
combinedFeatures := fe.CombineFeatures(textFeatures, graphFeatures)

// 执行推理
output, err := onnxInf.Predict(combinedFeatures)
```

### 2. repository 包

**位置**: `repository/`

**职责**:
- 数据库访问抽象层
- 数据持久化操作
- 查询逻辑封装

**核心文件**:
- `risk_repository.go` - 风险预测相关的数据访问

**Repository 接口**:
- `RiskPredictionRepository` - 风险预测记录管理
- `CompanyRepository` - 企业管理
- `PolicyNewsRepository` - 政策新闻管理
- `UserComplaintRepository` - 用户投诉管理
- `OrderRepository` - 订单管理
- `LogisticsRecordRepository` - 物流记录管理
- `RelationRepository` - 图关系管理

**使用示例**:
```go
// 创建 repository
riskRepo := repository.NewRiskPredictionRepository(db)

// 保存预测记录
prediction := &repository.RiskPrediction{
    CompanyName:     "测试企业",
    ComplianceRisk:  "medium",
    PaymentRisk:     "low",
    ComplianceScore: 0.65,
    PaymentScore:    0.35,
}
err := riskRepo.SavePrediction(ctx, prediction)
```

### 3. service 包

**位置**: `service/`

**职责**:
- 业务逻辑编排
- 多源数据聚合
- 调用 inference 和 repository

**核心文件**:
- `risk_service.go` - 风险预测业务服务

**Service 方法**:
- `Predict()` - 单次风险预测
- `BatchPredict()` - 批量风险预测
- `GetPredictionHistory()` - 获取预测历史
- `GetLatestPrediction()` - 获取最新预测

**使用示例**:
```go
// 创建服务
riskService := service.NewRiskPredictionService(
    onnxInf,
    featureExtractor,
    riskRepo,
    companyRepo,
    policyNewsRepo,
    complaintRepo,
    orderRepo,
    logisticsRepo,
    relationRepo,
)

// 执行预测
result, err := riskService.Predict(ctx, &service.RiskPredictionRequest{
    CompanyName:    "测试企业",
    PolicyNews:     []string{"政策 1"},
    UserComplaints: []string{"投诉 1"},
    GraphStructure: map[string][]string{"企业": {"关联"}},
})
```

## API 路由

新增三个风险预测相关的路由：

```
POST /api/risk/predict          # 单次风险预测
POST /api/risk/batch-predict    # 批量风险预测
POST /api/risk/history          # 获取预测历史
```

## 当前实现状态

### ✅ 已完成
- 完整的分层架构设计
- inference 包（ONNX 推理层）
- repository 包（数据访问层）
- service 包（业务逻辑层）
- Handler 层集成
- 特征提取功能（TextCNN 模拟、GCN 模拟）
- 预测结果持久化

### ⚠️ 模拟实现
- ONNX 模型推理（当前使用模拟实现）
- 特征提取（简化的特征计算）

### 📝 后续工作
如需接入真实的 ONNX 模型，需要：
1. 确保 `models/model.onnx` 文件存在
2. 在 `inference/onnx.go` 中实现真实的 ONNX 加载逻辑
3. 根据实际模型输入输出调整特征提取和结果处理

## 编译和运行

```bash
# 编译
go build -o server.exe ./cmd/api

# 运行
./server.exe
```

## 测试

```bash
# 运行架构测试
go run ./test/test_architecture.go
```

## 注意事项

1. **模型路径**: 配置文件 `settings.yaml` 中指定模型路径
   ```yaml
   onnx:
     model_path: models/model.onnx
     input_size: 128
   ```

2. **数据库依赖**: Service 层需要数据库连接来访问 repository

3. **错误处理**: 所有错误都通过日志记录并返回给调用方

4. **并发安全**: 当前实现支持并发调用
