# TextCNN-GCN 电商风控系统（前后端 + AI 一体化）

这是一个三端整合项目：

- 前端：`client-react/my-app`（Next.js）
- 后端：`server`（Go + Gin + GORM）
- AI 端：`text-cnn~gcn`（Flask + PyTorch）

当前调用链路为：

**前端 -> 后端 API -> AI 推理服务（按需调用）**

并且已完成统一 API 改造（v1）。

***

## 1. 目录结构

```text
textcnn-gcn-e-commerce-main/
├─ client-react/
│  └─ my-app/                # 前端（Next.js）
├─ server/                   # 后端（Go）
│  ├─ cmd/api/main.go
│  ├─ internal/api/
│  ├─ service/
│  ├─ inference/
│  └─ settings.yaml
├─ text-cnn~gcn/             # AI 服务（Flask）
│  └─ src/api/app.py
└─ README.md
```

***

## 2. 统一 API 约定（核心）

### 2.1 前端 -> 后端（统一 v1）

风险预测相关接口：

- `POST /api/v1/risk/predict`：单次预测
- `POST /api/v1/risk/predict/batch`：批量预测
- `GET /api/v1/risk/predictions`：预测历史（query: `company_name`, `limit`）
- `GET /api/v1/risk/health`：后端推理健康状态

统一响应外层：

```json
{
  "code": 200,
  "message": "ok",
  "data": {}
}
```

### 2.2 后端 -> AI 端（统一 v1）

- `POST /api/v1/inference/risk:predict`
- `GET /api/v1/health`

统一响应外层同上。

***

## 3. 快速启动（开发环境）

## 3.1 启动 AI 服务（text-cnn\~gcn）

进入 `text-cnn~gcn`，安装依赖后启动 Flask。

示例（按你本地 Python 环境调整）：

```bash
cd text-cnn~gcn
python -m pip install -r requirements.txt
python -m src.api.app
```

默认应监听 `http://127.0.0.1:5000`（以 `config/config.py` 为准）。

## 3.2 启动后端服务（server）

```bash
cd server
go mod tidy
go run ./cmd/api
```

默认监听端口请看 `server/settings.yaml`（当前前端默认请求 `http://localhost:9090/api`）。

## 3.3 启动前端（client-react/my-app）

```bash
cd client-react/my-app
npm install
npm run dev
```

浏览器访问：`http://localhost:3000`

***

## 4. 配置说明

## 4.1 后端配置（`server/settings.yaml`）

重点关注：

- 服务地址与端口
- 数据库连接
- inference 配置（remote/onnx/mock/auto）
- remote AI URL 与超时

若走远程 AI，请确保 URL 指向 AI 端，例如：

```yaml
inference:
  backend: remote
  remote:
    url: http://127.0.0.1:5000
    timeout_ms: 3000
```

## 4.2 前端 API 基地址

文件：`client-react/my-app/src/services/api.ts`

当前默认：

```ts
const API_BASE_URL = 'http://localhost:9090/api';
```

***

## 5. 关键字段约定（风险预测）

预测结果主要字段：

- `compliance_risk`: `low | medium | high`
- `payment_risk`: `low | medium | high`
- `scores.compliance_score`: `0~1`
- `scores.payment_score`: `0~1`
- `prediction_id`: 历史记录 ID（可选）

***

## 6. 常见问题

1. 前端报 401：
   - 先登录，确认本地 token 存在
   - 检查后端 JWT 配置
2. 后端调用 AI 失败：
   - 先访问 `GET /api/v1/health`（AI）
   - 再访问 `GET /api/v1/risk/health`（后端）
   - 检查 `settings.yaml` 的 remote URL
3. 分数字段不一致：
   - 统一使用 `data.scores.compliance_score / payment_score`

***

## 7. 建议

- 新增接口优先遵循 v1 风格与统一响应包络。
- 不再新增旧版 `/api/risk/*` 路径。
- 若后续升级，建议采用 `/api/v2/...` 平滑演进。

***

## 8. 一页式精简部署手册（生产可用）

### 8.1 部署前准备

- 服务器安装：Go（与项目兼容版本）、Python 3.10+、Node.js 18+
- 准备 PostgreSQL，并创建业务数据库
- 开放端口（示例）：
  - 前端：`3000`（如走 Node 运行）
  - 后端：`9090`
  - AI 服务：`5000`（仅内网访问更安全）

### 8.2 最小配置

1. 后端 `server/settings.yaml`：

- 配置数据库连接
- 配置推理后端走 remote
- 配置 AI 地址

示例：

```yaml
system:
  ip: 0.0.0.0
  port: "9090"

inference:
  backend: remote
  strict: false
  remote:
    url: http://127.0.0.1:5000
    timeout_ms: 3000
```

1. 前端 `client-react/my-app/src/services/api.ts`：

- 确认后端地址

```ts
const API_BASE_URL = 'http://<后端IP>:9090/api';
```

### 8.3 启动顺序（必须按顺序）

1. 启动 AI 服务
2. 启动后端服务
3. 启动前端服务

推荐命令（示例）：

```bash
# 1) AI
cd text-cnn~gcn
python -m pip install -r requirements.txt
python -m src.api.app

# 2) Backend
cd ../server
go mod tidy
go run ./cmd/api

# 3) Frontend
cd ../client-react/my-app
npm install
npm run build
npm run start
```

### 8.4 上线后自检（3步）

1. AI 健康检查：

- `GET http://<ai-host>:5000/api/v1/health`

1. 后端健康检查：

- `GET http://<backend-host>:9090/api/v1/risk/health`

1. 业务冒烟：

- 登录前端
- 在“单次风险预测”页面发起一次预测
- 返回中应有：`data.scores.compliance_score` 与 `data.scores.payment_score`

### 8.5 回滚策略（建议）

- 保留上一版后端与前端构建产物
- 若新版本异常：
  1. 先回滚前端到上一版
  2. 再回滚后端到上一版
  3. AI 服务保持不变（接口已统一）

### 8.6 安全与运维最小建议

- AI 服务建议仅内网开放，不直接暴露公网
- JWT 密钥、数据库密码使用环境变量或密钥系统管理
- 至少接入：后端错误日志、接口耗时、预测失败率
- 生产环境建议在 Nginx/网关层加超时与限流

