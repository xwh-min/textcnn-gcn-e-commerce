# 📚 项目文档索引

欢迎使用跨境电商企业风险预测系统！本文档索引将帮助你快速找到所需信息。

---

## 🚀 快速开始

### 我是前端开发人员，我需要：
- 📖 [**前端调用快速指南**](./FRONTEND_GUIDE.md) - 包含 JavaScript/TypeScript/Vue/React 集成示例
- 📋 [**完整 API 文档**](./API_DOCUMENTATION.md) - 所有接口的详细说明

### 我是后端开发人员，我需要：
- 🏗️ [**架构设计文档**](./ARCHITECTURE.md) - 分层架构、ONNX 推理实现
- 🔧 [**ONNX 集成指南**](./ONNX_INTEGRATION.md) - ONNX 推理配置和部署

### 我是运维人员，我需要：
- 📦 [**README.md**](./README.md) - 项目部署和配置说明

---

## 📋 文档列表

### 核心文档

| 文档 | 描述 | 目标读者 |
|------|------|---------|
| [**README.md**](./README.md) | 项目入门指南，包含环境准备、配置、启动等 | 所有人 |
| [**API_DOCUMENTATION.md**](./API_DOCUMENTATION.md) | 完整的 API 接口文档，包含所有接口说明 | 前端开发 |
| [**FRONTEND_GUIDE.md**](./FRONTEND_GUIDE.md) | 前端集成指南，包含代码示例和最佳实践 | 前端开发 |
| [**ARCHITECTURE.md**](./ARCHITECTURE.md) | 系统架构设计文档，分层架构说明 | 后端开发 |
| [**ONNX_INTEGRATION.md**](./ONNX_INTEGRATION.md) | ONNX 推理集成指南和部署方案 | 后端开发/运维 |

---

## 🎯 按功能查找

### 用户认证
- 📖 [API 文档 - 用户认证](./API_DOCUMENTATION.md#用户认证)
- 💻 [前端指南 - 获取 Token](./FRONTEND_GUIDE.md#2-获取认证-token)

### 企业管理
- 📖 [API 文档 - 企业管理](./API_DOCUMENTATION.md#企业管理)
- 💻 [前端指南 - 企业 CRUD](./FRONTEND_GUIDE.md#1-企业-crud-操作)

### 风险预测
- 📖 [API 文档 - 风险预测](./API_DOCUMENTATION.md#风险预测)
- 💻 [前端指南 - 风险预测](./FRONTEND_GUIDE.md#2-风险预测)
- 🏗️ [架构设计 - ONNX 推理](./ARCHITECTURE.md#onnx-推理)

### 图关系
- 📖 [API 文档 - 图关系管理](./API_DOCUMENTATION.md#图关系管理)
- 💻 [前端指南 - 数据可视化](./FRONTEND_GUIDE.md#-使用-echarts-展示关系图谱)

---

## 🔍 按技术栈查找

### JavaScript / TypeScript
- 💻 [封装请求类](./FRONTEND_GUIDE.md#封装请求类)
- 💻 [错误处理](./FRONTEND_GUIDE.md#错误处理)

### Vue 3
- 💻 [Vue 3 示例](./FRONTEND_GUIDE.md#vue-3-示例)

### React
- 💻 [React 示例](./FRONTEND_GUIDE.md#react-示例)

### ECharts
- 💻 [关系图谱可视化](./FRONTEND_GUIDE.md#使用-echarts-展示关系图谱)

---

## 📊 接口分类

### 公开接口（无需认证）
- ✅ 用户注册
- ✅ 用户登录

### 认证接口（需要 JWT Token）
- 👤 用户管理
- 🏢 企业管理
- 🚚 物流商管理
- 🛃 海关管理
- 🔗 图关系管理
- 📰 政策新闻管理
- 😊 用户投诉管理
- 📦 订单管理
- 📝 物流记录管理
- ⚠️ 风险预测
- 🔐 角色权限管理
- 📜 操作日志

---

## 🛠️ 开发工具

### API 测试
使用以下工具测试 API：
- **Postman**: 导入 API 文档快速测试
- **cURL**: 命令行测试（文档中包含示例）
- **浏览器**: 使用 DevTools 的 Network 面板

### 代码示例
所有代码示例都可以在 [FRONTEND_GUIDE.md](./FRONTEND_GUIDE.md) 中找到。

---

## 📞 获取帮助

### 常见问题
1. **如何获取 Token？**
   - 查看 [前端指南 - 获取认证 Token](./FRONTEND_GUIDE.md#2-获取认证-token)

2. **Token 过期怎么办？**
   - 查看 [前端指南 - 错误处理](./FRONTEND_GUIDE.md#错误处理)

3. **如何调用风险预测接口？**
   - 查看 [API 文档 - 风险预测](./API_DOCUMENTATION.md#101-单次风险预测)

4. **如何部署 ONNX 推理？**
   - 查看 [ONNX 集成指南](./ONNX_INTEGRATION.md)

### 联系支持
- 查看项目 README.md 获取维护者信息
- 提交 Issue 到项目仓库

---

## 📝 文档更新日志

- **2026-04-07**: 创建完整的 API 文档和前端指南
- **2026-04-07**: 创建架构设计文档
- **2026-04-07**: 创建 ONNX 集成指南

---

## 🎓 学习路径

### 前端开发人员
1. 阅读 [README.md](./README.md) 了解项目概况
2. 查看 [FRONTEND_GUIDE.md](./FRONTEND_GUIDE.md) 学习如何集成
3. 参考 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) 调用接口
4. 使用示例代码快速开始开发

### 后端开发人员
1. 阅读 [README.md](./README.md) 了解项目结构
2. 查看 [ARCHITECTURE.md](./ARCHITECTURE.md) 理解架构设计
3. 参考 [ONNX_INTEGRATION.md](./ONNX_INTEGRATION.md) 部署推理服务
4. 根据需要优化和扩展功能

### 运维人员
1. 阅读 [README.md](./README.md) 了解部署步骤
2. 查看 [ONNX_INTEGRATION.md](./ONNX_INTEGRATION.md) 配置 ONNX Runtime
3. 参考配置文件示例进行环境配置

---

**祝你使用愉快！** 🎉

如有任何问题，请随时查阅相关文档或联系开发团队。
