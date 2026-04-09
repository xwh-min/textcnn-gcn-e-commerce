# 企业风险评估系统后端服务

## 项目简�?
基于 GIN 框架（Web 开发）+ GORM 框架（ORM 数据库操作）搭建的企业风险评估系统后端服务，用于提供用户认证、风险预测、查询历史记录等功能�?
## 核心功能

- **用户管理**：注册、登录、JWT 认证
- **风险评估**：基�?ONNX 模型的企业风险预�?- **查询历史**：用户查询记录管理（最近一周记录）
- **跨域支持**：安全的 CORS 中间�?- **日志记录**：基�?Logrus 的详细日�?
## 技术栈

- **核心框架**：GIN v1.11.0、GORM v1.31.1
- **编程语言**：Go 1.25.5
- **数据�?*：PostgreSQL 14+
- **依赖管理**：Go Modules
- **其他依赖**：JWT、Logrus、YAML

## 环境准备

### 基础环境

- 安装 Go 语言环境（版本要求：Go 1.20+�?- 安装 PostgreSQL 数据库（版本要求�?4+�?- 安装代码编辑器（推荐：Goland、VS Code�?
### 依赖安装

克隆项目后，进入项目根目录，执行以下命令安装依赖�?
```bash
# 安装所有依�?go mod tidy
```

## 项目配置

项目配置文件位于 `settings.yaml`，需根据自身环境修改以下核心配置�?
### 数据库配�?
```yaml
db:
  host: localhost
  port: "5432"
  user: postgres
  password: your_password
  dbname: risk_assessment
  sslmode: disable
```

### 服务配置

```yaml
system:
  ip: 0.0.0.0
  port: "8080"
```

### 跨域配置

�?`config/cors.go` 中修改：

```go
var (
    Port           = "8080"
    FrontendDomain = "*" // 上线前改�?"https://你的网站.com"
)
```

## 项目启动

### 数据库初始化

- 手动创建数据库：
  ```sql
  CREATE DATABASE risk_assessment;
  ```

- 服务启动时会自动执行数据库迁移（创建表结构）

### 启动项目

```bash
# 方式1：直接启�?go run main.go

# 方式2：编译后启动（生产环境推荐）
go build -o server.exe
./server.exe
```

启动成功后，访问 `http://localhost:9090`，若出现接口返回正常，说明启动成功�?
## 目录结构

```plain text
./
├── api/                    # API 相关
�?  ├── handler/            # 请求处理�?�?  �?  ├── risk/           # 风险评估相关
�?  �?  └── user/           # 用户相关
�?  ├── middleware/         # 中间�?�?  �?  ├── cors.go         # 跨域中间�?�?  �?  └── jwt.go          # JWT 认证中间�?�?  └── router/             # 路由配置
�?      ├── risk.go         # 风险评估路由
�?      ├── router.go       # 主路�?�?      └── user.go         # 用户路由
├── config/                 # 配置
�?  ├── conf_database.go    # 数据库配�?�?  ├── conf_logrus.go      # 日志配置
�?  ├── conf_system.go      # 系统配置
�?  ├── cors.go             # 跨域配置
�?  └── enter.go            # 配置入口
├── core/                   # 核心初始�?�?  ├── init_config.go      # 配置初始�?�?  └── init_logrus.go      # 日志初始�?├── internal/               # 内部实现
�?  ├── db/                 # 数据库操�?�?  �?  ├── db.go           # 数据库连�?�?  �?  └── migrate.go      # 数据库迁�?�?  ├── model/              # 数据模型
�?  �?  ├── model.go        # 风险预测模型
�?  �?  ├── user_phone.go   # 用户电话模型
�?  �?  ├── user_query.go   # 查询历史模型
�?  �?  └── user_table.go   # 用户模型
�?  └── utils/              # 工具函数
�?      ├── jwt.go          # JWT 工具
�?      └── query_history.go # 查询历史工具
├── models/                 # 模型文件
�?  └── model.onnx          # ONNX 模型文件
├── test/                   # 测试文件
├── main.go                 # 项目入口
├── go.mod                  # Go Modules 配置
├── go.sum                  # 依赖版本锁定
└── settings.yaml           # 配置文件
```

## 接口文档

### 📄 完整 API 文档

详细�?API 文档请查看：[**API_DOCUMENTATION.md**](./API_DOCUMENTATION.md)

### 接口前缀

所有接口统一前缀：`/api`

### 快速参�?
#### 用户认证

| 接口路径 | 请求方式 | 描述 | 认证 |
|---------|---------|------|------|
| `/api/register` | POST | 用户注册 | �?|
| `/api/login` | POST | 用户登录 | �?|
| `/api/user` | GET | 获取用户信息 | �?|
| `/api/query-history` | GET | 获取查询历史 | �?|
| `/api/query-history/:id` | DELETE | 删除查询历史 | �?|

#### 企业管理

| 接口路径 | 请求方式 | 描述 | 认证 |
|---------|---------|------|------|
| `/api/company` | POST | 创建企业 | �?|
| `/api/company` | GET | 获取企业列表 | �?|
| `/api/company/:id` | GET | 获取企业详情 | �?|
| `/api/company/:id` | PUT | 更新企业 | �?|
| `/api/company/:id` | DELETE | 删除企业 | �?|
| `/api/company/:id/mark-high-risk` | POST | 标记高风�?| �?|

#### 风险预测

| 接口路径 | 请求方式 | 描述 | 认证 |
|---------|---------|------|------|
| `/api/risk/predict` | POST | 单次风险预测 | �?|
| `/api/risk/batch-predict` | POST | 批量风险预测 | �?|
| `/api/risk/history` | POST | 获取预测历史 | �?|

#### 更多接口

完整接口列表（物流商、海关、图关系、政策新闻、用户投诉、订单、物流记录、角色、操作日志）请查�?[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### 认证说明

除登录和注册接口外，所有接口都需要在请求头中携带 JWT Token�?
```
Authorization: Bearer <your_token>
```

## 数据库表结构

### `users` �?| 字段�?| 数据类型 | 约束 | 描述 |
|-------|---------|------|------|
| `id` | `SERIAL` | `PRIMARY KEY` | 用户ID |
| `created_at` | `TIMESTAMP` | | 创建时间 |
| `updated_at` | `TIMESTAMP` | | 更新时间 |
| `deleted_at` | `TIMESTAMP` | | 删除时间 |
| `username` | `VARCHAR` | | 用户�?|
| `password` | `VARCHAR` | | 密码（哈希） |
| `email` | `VARCHAR` | | 邮箱 |

### `user_queries` �?| 字段�?| 数据类型 | 约束 | 描述 |
|-------|---------|------|------|
| `id` | `SERIAL` | `PRIMARY KEY` | 查询记录ID |
| `user_id` | `INTEGER` | `NOT NULL, INDEX` | 用户ID |
| `query_type` | `VARCHAR(50)` | `NOT NULL, INDEX` | 查询类型 |
| `query_text` | `VARCHAR(500)` | `NOT NULL` | 查询内容 |
| `query_params` | `VARCHAR(1000)` | | 查询参数（JSON�?|
| `result` | `TEXT` | | 查询结果摘要 |
| `created_at` | `TIMESTAMP` | `NOT NULL, INDEX` | 查询时间 |

## 常见问题

### Q：依赖安装失败？
A：检�?Go 环境配置，确�?GOPROXY 正常（可设置：`go env -w GOPROXY=https://goproxy.cn,direct`），再执�?`go mod tidy`�?
### Q：数据库连接失败�?A：检�?PostgreSQL 服务是否启动、配置文件中连接信息是否正确，确保数据库用户有创建表的权限�?
### Q：项目启动后无法访问�?A：检查启动端口是否被占用、防火墙是否放行该端口，确认启动日志无报错�?
### Q：GORM 迁移失败�?A：检查模型定义是否符�?GORM 规范，确保数据库用户有创建表的权限�?
## 注意事项

- **开发环�?*：使�?debug 模式，生产环境必须切换为 release 模式
- **安全配置**：生产环境中，数据库密码等敏感信息建议通过环境变量配置
- **代码规范**：遵�?Go 代码规范，使�?`go fmt` 格式化代�?- **数据备份**：定期备份数据库，避免数据丢�?- **模型文件**：确�?`models/model.onnx` 文件存在，用于风险预�?
## 维护�?
姓名：毕业设计团�?
## 许可�?
MIT License
