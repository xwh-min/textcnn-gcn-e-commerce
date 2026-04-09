# 跨境电商企业风险预测系统 - API 接口文档

## 基本信息

- **基础 URL**: `http://localhost:9090/api`
- **认证方式**: JWT Token
- **数据格式**: JSON
- **CORS**: 已启用（支持跨域请求)
## 认证说明

### 获取 Token

除登录和注册接口外，所有接口都需要在请求头中携带 JWT Token
```
Authorization: Bearer <your_token>
```

### 错误响应格式

所有接口错误统一返回格式
```json
{
  "code": 400,
  "message": "错误描述信息"
}
```

### 成功响应格式

```json
{
  "code": 200,
  "message": "成功信息",
  "data": { ... }
}
```

---

## 目录

1. [用户认证](#用户认证)
2. [企业管理](#企业管理)
3. [物流商管理](#物流商管)
4. [海关管理](#海关管理)
5. [图关系管理](#图关系管)
6. [政策新闻管理](#政策新闻管理)
7. [用户投诉管理](#用户投诉管理)
8. [订单管理](#订单管理)
9. [物流记录管理](#物流记录管理)
10. [风险预测](#风险预测)
11. [角色权限管理](#角色权限管理)
12. [操作日志](#操作日志)

---

## 接口详情

### 用户认证

#### 1.1 用户注册

**接口**: `POST /api/register`

**权限**: 公开

**请求参数**:
```json
{
  "username": "用户",
  "password": "密码",
  "email": "邮箱（可选）",
  "phone": "手机号（可选）"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "注册成功"
}
```

#### 1.2 用户登录

**接口**: `POST /api/login`

**权限**: 公开

**请求参数**:
```json
{
  "username": "用户",
  "password": "密码"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin"
    }
  }
}
```

#### 1.3 获取当前用户信息

**接口**: `GET /api/user`

**权限**: 已登录用
**响应示例**:
```json
{
  "code": 200,
  "message": "获取用户信息成功",
  "user": {
    "id": 1,
    "username": "admin"
  }
}
```

#### 1.4 获取查询历史

**接口**: `GET /api/query-history`

**权限**: 已登录用
**响应示例**:
```json
{
  "code": 200,
  "message": "查询历史获取成功",
  "data": [
    {
      "id": 1,
      "query": "查询内容",
      "created_at": "2026-04-07T10:00:00Z"
    }
  ]
}
```

#### 1.5 删除查询历史

**接口**: `DELETE /api/query-history/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 历史记录 ID

**响应示例**:
```json
{
  "code": 200,
  "message": "删除成功"
}
```

---

### 企业管理

#### 2.1 创建企业

**接口**: `POST /api/company`

**权限**: 已登录用�?
**请求参数**:
```json
{
  "name": "企业名称",
  "region": "所在地�?,
  "industry": "所属行�?,
  "credit_code": "统一社会信用代码",
  "phone": "联系电话",
  "email": "邮箱",
  "address": "地址",
  "risk_level": "风险等级（可选）"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "企业创建成功",
  "data": {
    "id": 1,
    "name": "测试企业"
  }
}
```

#### 2.2 获取企业列表

**接口**: `GET /api/company`

**权限**: 已登录用�?
**查询参数**:
- `page` - 页码（默�?1�?- `page_size` - 每页数量（默�?10�?- `name` - 企业名称（模糊搜索，可选）
- `region` - 地区（可选）

**响应示例**:
```json
{
  "code": 200,
  "message": "获取企业列表成功",
  "data": {
    "total": 100,
    "companies": [
      {
        "id": 1,
        "name": "企业 A",
        "region": "上海",
        "risk_level": "low"
      }
    ]
  }
}
```

#### 2.3 获取企业详情

**接口**: `GET /api/company/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 企业 ID

**响应示例**:
```json
{
  "code": 200,
  "message": "获取企业详情成功",
  "data": {
    "id": 1,
    "name": "企业 A",
    "region": "上海",
    "industry": "跨境电商",
    "credit_code": "91310000XXXXXXXXXX",
    "phone": "021-12345678",
    "email": "contact@company.com",
    "address": "上海市浦东新�?XXX �?XXX �?,
    "risk_level": "low",
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

#### 2.4 更新企业

**接口**: `PUT /api/company/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 企业 ID

**请求参数**: 同创建企业（所有字段可选）

**响应示例**:
```json
{
  "code": 200,
  "message": "企业更新成功",
  "data": {
    "id": 1,
    "name": "更新后的企业名称"
  }
}
```

#### 2.5 删除企业

**接口**: `DELETE /api/company/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 企业 ID

**响应示例**:
```json
{
  "code": 200,
  "message": "企业删除成功"
}
```

#### 2.6 标记为高风险

**接口**: `POST /api/company/:id/mark-high-risk`

**权限**: 已登录用�?
**路径参数**:
- `id` - 企业 ID

**响应示例**:
```json
{
  "code": 200,
  "message": "企业已标记为高风�?
}
```

---

### 物流商管�?
#### 3.1 创建物流�?
**接口**: `POST /api/logistics`

**权限**: 已登录用�?
**请求参数**:
```json
{
  "name": "物流商名�?,
  "code": "物流商编�?,
  "phone": "联系电话",
  "email": "邮箱",
  "address": "地址",
  "service_regions": ["服务地区 1", "服务地区 2"]
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "物流商创建成�?,
  "data": {
    "id": 1,
    "name": "顺丰速运"
  }
}
```

#### 3.2 获取物流商列�?
**接口**: `GET /api/logistics`

**权限**: 已登录用�?
**查询参数**:
- `page` - 页码
- `page_size` - 每页数量
- `name` - 物流商名称（可选）

**响应示例**:
```json
{
  "code": 200,
  "message": "获取物流商列表成�?,
  "data": {
    "total": 50,
    "logistics": [
      {
        "id": 1,
        "name": "顺丰速运",
        "code": "SF"
      }
    ]
  }
}
```

#### 3.3 获取物流商详�?
**接口**: `GET /api/logistics/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 物流�?ID

**响应示例**:
```json
{
  "code": 200,
  "message": "获取物流商详情成�?,
  "data": {
    "id": 1,
    "name": "顺丰速运",
    "code": "SF",
    "phone": "95338",
    "email": "service@sf-express.com",
    "service_regions": ["全国"]
  }
}
```

#### 3.4 更新物流�?
**接口**: `PUT /api/logistics/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 物流�?ID

**请求参数**: 同创建物流商（所有字段可选）

**响应示例**:
```json
{
  "code": 200,
  "message": "物流商更新成�?
}
```

#### 3.5 删除物流�?
**接口**: `DELETE /api/logistics/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 物流�?ID

**响应示例**:
```json
{
  "code": 200,
  "message": "物流商删除成�?
}
```

#### 3.6 标记为高风险

**接口**: `POST /api/logistics/:id/mark-high-risk`

**权限**: 已登录用�?
**路径参数**:
- `id` - 物流�?ID

**响应示例**:
```json
{
  "code": 200,
  "message": "物流商已标记为高风险"
}
```

---

### 海关管理

#### 4.1 创建海关

**接口**: `POST /api/customs`

**权限**: 已登录用�?
**请求参数**:
```json
{
  "name": "海关名称",
  "code": "海关编码",
  "region": "所在地�?,
  "phone": "联系电话",
  "address": "地址"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "海关创建成功",
  "data": {
    "id": 1,
    "name": "上海海关"
  }
}
```

#### 4.2 获取海关列表

**接口**: `GET /api/customs`

**权限**: 已登录用�?
**查询参数**:
- `page` - 页码
- `page_size` - 每页数量
- `region` - 地区（可选）

**响应示例**:
```json
{
  "code": 200,
  "message": "获取海关列表成功",
  "data": {
    "total": 20,
    "customs": [
      {
        "id": 1,
        "name": "上海海关",
        "region": "上海"
      }
    ]
  }
}
```

#### 4.3 获取海关详情

**接口**: `GET /api/customs/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 海关 ID

**响应示例**:
```json
{
  "code": 200,
  "message": "获取海关详情成功",
  "data": {
    "id": 1,
    "name": "上海海关",
    "code": "SH",
    "region": "上海",
    "phone": "021-12360"
  }
}
```

#### 4.4 更新海关

**接口**: `PUT /api/customs/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 海关 ID

**请求参数**: 同创建海关（所有字段可选）

**响应示例**:
```json
{
  "code": 200,
  "message": "海关更新成功"
}
```

#### 4.5 删除海关

**接口**: `DELETE /api/customs/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 海关 ID

**响应示例**:
```json
{
  "code": 200,
  "message": "海关删除成功"
}
```

---

### 图关系管�?
#### 5.1 创建关系

**接口**: `POST /api/relation`

**权限**: 已登录用�?
**请求参数**:
```json
{
  "source_type": "eco_company",
  "source_id": 1,
  "target_type": "logistics_provider",
  "target_id": 2,
  "relation_type": "cooperation",
  "weight": 3.5,
  "start_date": "2026-01-01",
  "end_date": "2026-12-31",
  "remark": "合作关系说明"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "关系创建成功",
  "data": {
    "id": 1
  }
}
```

#### 5.2 获取关系列表

**接口**: `GET /api/relation`

**权限**: 已登录用�?
**查询参数**:
- `page` - 页码
- `page_size` - 每页数量
- `source_type` - 源节点类型（可选）
- `target_type` - 目标节点类型（可选）

**响应示例**:
```json
{
  "code": 200,
  "message": "获取关系列表成功",
  "data": {
    "total": 100,
    "relations": [
      {
        "id": 1,
        "source_type": "eco_company",
        "target_type": "logistics_provider",
        "relation_type": "cooperation",
        "weight": 3.5
      }
    ]
  }
}
```

#### 5.3 获取关系详情

**接口**: `GET /api/relation/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 关系 ID

**响应示例**:
```json
{
  "code": 200,
  "message": "获取关系详情成功",
  "data": {
    "id": 1,
    "source_type": "eco_company",
    "source_id": 1,
    "target_type": "logistics_provider",
    "target_id": 2,
    "relation_type": "cooperation",
    "weight": 3.5,
    "start_date": "2026-01-01",
    "end_date": null,
    "remark": "长期合作"
  }
}
```

#### 5.4 更新关系

**接口**: `PUT /api/relation/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 关系 ID

**请求参数**: 同创建关系（所有字段可选）

**响应示例**:
```json
{
  "code": 200,
  "message": "关系更新成功"
}
```

#### 5.5 终止关系

**接口**: `POST /api/relation/:id/terminate`

**权限**: 已登录用�?
**路径参数**:
- `id` - 关系 ID

**响应示例**:
```json
{
  "code": 200,
  "message": "关系已终�?
}
```

#### 5.6 获取企业关系图谱

**接口**: `GET /api/relation/company/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 企业 ID

**响应示例**:
```json
{
  "code": 200,
  "message": "获取企业关系图谱成功",
  "data": {
    "company": {
      "id": 1,
      "name": "企业 A"
    },
    "relations": [
      {
        "target_type": "logistics_provider",
        "target_name": "物流�?B",
        "relation_type": "cooperation",
        "weight": 3.5
      },
      {
        "target_type": "customs",
        "target_name": "海关 C",
        "relation_type": "compliance",
        "weight": 4.0
      }
    ]
  }
}
```

---

### 政策新闻管理

#### 6.1 创建政策新闻

**接口**: `POST /api/policy-news`

**权限**: 已登录用�?
**请求参数**:
```json
{
  "title": "政策标题",
  "content": "政策正文",
  "source": "来源机构",
  "publish_date": "2026-04-07",
  "related_regions": ["地区 1", "地区 2"],
  "related_companies": [1, 2, 3]
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "政策新闻创建成功",
  "data": {
    "id": 1
  }
}
```

#### 6.2 获取政策新闻列表

**接口**: `GET /api/policy-news`

**权限**: 已登录用�?
**查询参数**:
- `page` - 页码
- `page_size` - 每页数量
- `title` - 标题（可选）
- `source` - 来源（可选）

**响应示例**:
```json
{
  "code": 200,
  "message": "获取政策新闻列表成功",
  "data": {
    "total": 50,
    "news": [
      {
        "id": 1,
        "title": "新政策发�?,
        "source": "海关总署",
        "publish_date": "2026-04-07"
      }
    ]
  }
}
```

#### 6.3 获取政策新闻详情

**接口**: `GET /api/policy-news/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 新闻 ID

**响应示例**:
```json
{
  "code": 200,
  "message": "获取政策新闻详情成功",
  "data": {
    "id": 1,
    "title": "新政策发�?,
    "content": "政策详细内容...",
    "source": "海关总署",
    "publish_date": "2026-04-07",
    "related_regions": ["上海", "北京"],
    "related_companies": [1, 2]
  }
}
```

#### 6.4 更新政策新闻

**接口**: `PUT /api/policy-news/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 新闻 ID

**请求参数**: 同创建政策新闻（所有字段可选）

**响应示例**:
```json
{
  "code": 200,
  "message": "政策新闻更新成功"
}
```

#### 6.5 删除政策新闻

**接口**: `DELETE /api/policy-news/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 新闻 ID

**响应示例**:
```json
{
  "code": 200,
  "message": "政策新闻删除成功"
}
```

---

### 用户投诉管理

#### 7.1 创建用户投诉

**接口**: `POST /api/complaint`

**权限**: 已登录用�?
**请求参数**:
```json
{
  "complaint_content": "投诉内容",
  "complaint_type": "物流延误",
  "target_company_id": 1,
  "target_logistics_id": 2,
  "complaint_date": "2026-04-07"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "用户投诉创建成功",
  "data": {
    "id": 1
  }
}
```

#### 7.2 获取用户投诉列表

**接口**: `GET /api/complaint`

**权限**: 已登录用�?
**查询参数**:
- `page` - 页码
- `page_size` - 每页数量
- `complaint_type` - 投诉类型（可选）
- `is_processed` - 是否已处理（可选）

**响应示例**:
```json
{
  "code": 200,
  "message": "获取用户投诉列表成功",
  "data": {
    "total": 30,
    "complaints": [
      {
        "id": 1,
        "complaint_type": "物流延误",
        "complaint_date": "2026-04-07",
        "is_processed": false
      }
    ]
  }
}
```

#### 7.3 获取用户投诉详情

**接口**: `GET /api/complaint/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 投诉 ID

**响应示例**:
```json
{
  "code": 200,
  "message": "获取用户投诉详情成功",
  "data": {
    "id": 1,
    "complaint_content": "投诉详细内容...",
    "complaint_type": "物流延误",
    "target_company_id": 1,
    "target_logistics_id": 2,
    "complaint_date": "2026-04-07",
    "is_processed": false
  }
}
```

#### 7.4 更新用户投诉

**接口**: `PUT /api/complaint/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 投诉 ID

**请求参数**: 同创建用户投诉（所有字段可选）

**响应示例**:
```json
{
  "code": 200,
  "message": "用户投诉更新成功"
}
```

#### 7.5 删除用户投诉

**接口**: `DELETE /api/complaint/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 投诉 ID

**响应示例**:
```json
{
  "code": 200,
  "message": "用户投诉删除成功"
}
```

#### 7.6 标记为已处理

**接口**: `POST /api/complaint/:id/mark-processed`

**权限**: 已登录用�?
**路径参数**:
- `id` - 投诉 ID

**响应示例**:
```json
{
  "code": 200,
  "message": "投诉已标记为已处�?
}
```

---

### 订单管理

#### 8.1 创建订单

**接口**: `POST /api/order`

**权限**: 已登录用�?
**请求参数**:
```json
{
  "order_no": "订单编号",
  "company_id": 1,
  "product_name": "商品名称",
  "quantity": 100,
  "amount": 10000.00,
  "order_date": "2026-04-07",
  "destination": "目的�?
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "订单创建成功",
  "data": {
    "id": 1
  }
}
```

#### 8.2 批量导入订单

**接口**: `POST /api/order/batch-import`

**权限**: 已登录用�?
**请求参数**:
```json
{
  "orders": [
    {
      "order_no": "ORDER001",
      "company_id": 1,
      "product_name": "商品 A",
      "quantity": 100,
      "amount": 10000.00,
      "order_date": "2026-04-07",
      "destination": "美国"
    },
    {
      "order_no": "ORDER002",
      "company_id": 1,
      "product_name": "商品 B",
      "quantity": 200,
      "amount": 20000.00,
      "order_date": "2026-04-08",
      "destination": "英国"
    }
  ]
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "批量导入成功，成�?2 条，失败 0 �?
}
```

#### 8.3 获取订单列表

**接口**: `GET /api/order`

**权限**: 已登录用�?
**查询参数**:
- `page` - 页码
- `page_size` - 每页数量
- `company_id` - 企业 ID（可选）
- `order_no` - 订单编号（可选）

**响应示例**:
```json
{
  "code": 200,
  "message": "获取订单列表成功",
  "data": {
    "total": 200,
    "orders": [
      {
        "id": 1,
        "order_no": "ORDER001",
        "company_id": 1,
        "amount": 10000.00,
        "order_date": "2026-04-07"
      }
    ]
  }
}
```

#### 8.4 获取订单详情

**接口**: `GET /api/order/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 订单 ID

**响应示例**:
```json
{
  "code": 200,
  "message": "获取订单详情成功",
  "data": {
    "id": 1,
    "order_no": "ORDER001",
    "company_id": 1,
    "product_name": "商品 A",
    "quantity": 100,
    "amount": 10000.00,
    "order_date": "2026-04-07",
    "destination": "美国"
  }
}
```

#### 8.5 更新订单

**接口**: `PUT /api/order/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 订单 ID

**请求参数**: 同创建订单（所有字段可选）

**响应示例**:
```json
{
  "code": 200,
  "message": "订单更新成功"
}
```

#### 8.6 删除订单

**接口**: `DELETE /api/order/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 订单 ID

**响应示例**:
```json
{
  "code": 200,
  "message": "订单删除成功"
}
```

---

### 物流记录管理

#### 9.1 创建物流记录

**接口**: `POST /api/logistics-record`

**权限**: 已登录用�?
**请求参数**:
```json
{
  "tracking_no": "物流单号",
  "order_id": 1,
  "logistics_id": 1,
  "current_location": "当前位置",
  "status": "运输�?,
  "shipment_date": "2026-04-07",
  "estimated_delivery": "2026-04-15"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "物流记录创建成功",
  "data": {
    "id": 1
  }
}
```

#### 9.2 获取物流记录列表

**接口**: `GET /api/logistics-record`

**权限**: 已登录用�?
**查询参数**:
- `page` - 页码
- `page_size` - 每页数量
- `tracking_no` - 物流单号（可选）
- `status` - 状态（可选）

**响应示例**:
```json
{
  "code": 200,
  "message": "获取物流记录列表成功",
  "data": {
    "total": 150,
    "records": [
      {
        "id": 1,
        "tracking_no": "SF1234567890",
        "status": "运输�?,
        "current_location": "上海转运中心"
      }
    ]
  }
}
```

#### 9.3 获取物流记录详情

**接口**: `GET /api/logistics-record/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 记录 ID

**响应示例**:
```json
{
  "code": 200,
  "message": "获取物流记录详情成功",
  "data": {
    "id": 1,
    "tracking_no": "SF1234567890",
    "order_id": 1,
    "logistics_id": 1,
    "current_location": "上海转运中心",
    "status": "运输�?,
    "shipment_date": "2026-04-07",
    "estimated_delivery": "2026-04-15"
  }
}
```

#### 9.4 更新物流记录

**接口**: `PUT /api/logistics-record/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 记录 ID

**请求参数**: 同创建物流记录（所有字段可选）

**响应示例**:
```json
{
  "code": 200,
  "message": "物流记录更新成功"
}
```

#### 9.5 删除物流记录

**接口**: `DELETE /api/logistics-record/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 记录 ID

**响应示例**:
```json
{
  "code": 200,
  "message": "物流记录删除成功"
}
```

---

### 风险预测

#### 10.1 单次风险预测

**接口**: `POST /api/risk/predict`

**权限**: 已登录用�?
**请求参数**:
```json
{
  "company_name": "企业名称",
  "recent_data": "�?3 个月业务数据描述",
  "policy_news": ["政策新闻 1", "政策新闻 2"],
  "user_complaints": ["用户投诉 1", "用户投诉 2"],
  "graph_structure": {
    "物流�?: ["cooperation", "cooperation"],
    "海关": ["compliance"]
  }
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "预测完成",
  "result": {
    "compliance_risk": "medium",
    "payment_risk": "low",
    "compliance_score": 0.65,
    "payment_score": 0.35,
    "prediction_id": 1
  }
}
```

**字段说明**:
- `compliance_risk`: 合规风险等级 (low/medium/high)
- `payment_risk`: 支付风险等级 (low/medium/high)
- `compliance_score`: 合规风险分数 (0-1)
- `payment_score`: 支付风险分数 (0-1)
- `prediction_id`: 预测记录 ID

#### 10.2 批量风险预测

**接口**: `POST /api/risk/batch-predict`

**权限**: 已登录用�?
**请求参数**:
```json
{
  "company_names": ["企业 A", "企业 B", "企业 C"]
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "批量预测完成",
  "results": [
    {
      "company_name": "企业 A",
      "compliance_risk": "medium",
      "payment_risk": "low",
      "compliance_score": 0.65,
      "payment_score": 0.35,
      "prediction_id": 1
    },
    {
      "company_name": "企业 B",
      "compliance_risk": "high",
      "payment_risk": "medium",
      "compliance_score": 0.85,
      "payment_score": 0.55,
      "prediction_id": 2
    }
  ]
}
```

#### 10.3 获取预测历史

**接口**: `POST /api/risk/history`

**权限**: 已登录用�?
**请求参数**:
```json
{
  "company_name": "企业名称",
  "limit": 10
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "获取预测历史成功",
  "results": [
    {
      "id": 1,
      "company_name": "企业 A",
      "compliance_risk": "medium",
      "payment_risk": "low",
      "compliance_score": 0.65,
      "payment_score": 0.35,
      "created_at": "2026-04-07T10:00:00Z"
    },
    {
      "id": 2,
      "company_name": "企业 A",
      "compliance_risk": "low",
      "payment_risk": "low",
      "compliance_score": 0.25,
      "payment_score": 0.30,
      "created_at": "2026-04-01T10:00:00Z"
    }
  ]
}
```

---

### 角色权限管理

#### 11.1 创建角色

**接口**: `POST /api/role`

**权限**: 已登录用�?
**请求参数**:
```json
{
  "name": "角色名称",
  "code": "角色编码",
  "description": "角色描述",
  "permissions": ["company:create", "company:read"]
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "角色创建成功",
  "data": {
    "id": 1
  }
}
```

#### 11.2 获取角色列表

**接口**: `GET /api/role`

**权限**: 已登录用�?
**查询参数**:
- `page` - 页码
- `page_size` - 每页数量
- `name` - 角色名称（可选）

**响应示例**:
```json
{
  "code": 200,
  "message": "获取角色列表成功",
  "data": {
    "total": 10,
    "roles": [
      {
        "id": 1,
        "name": "管理�?,
        "code": "admin"
      }
    ]
  }
}
```

#### 11.3 获取角色详情

**接口**: `GET /api/role/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 角色 ID

**响应示例**:
```json
{
  "code": 200,
  "message": "获取角色详情成功",
  "data": {
    "id": 1,
    "name": "管理�?,
    "code": "admin",
    "description": "系统管理�?,
    "permissions": ["*"]
  }
}
```

#### 11.4 更新角色

**接口**: `PUT /api/role/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 角色 ID

**请求参数**: 同创建角色（所有字段可选）

**响应示例**:
```json
{
  "code": 200,
  "message": "角色更新成功"
}
```

#### 11.5 删除角色

**接口**: `DELETE /api/role/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 角色 ID

**响应示例**:
```json
{
  "code": 200,
  "message": "角色删除成功"
}
```

---

### 操作日志

#### 12.1 获取操作日志列表

**接口**: `GET /api/operation-log`

**权限**: 已登录用�?
**查询参数**:
- `page` - 页码
- `page_size` - 每页数量
- `username` - 操作用户（可选）
- `action` - 操作类型（可选）
- `start_date` - 开始日期（可选）
- `end_date` - 结束日期（可选）

**响应示例**:
```json
{
  "code": 200,
  "message": "获取操作日志列表成功",
  "data": {
    "total": 500,
    "logs": [
      {
        "id": 1,
        "username": "admin",
        "action": "创建企业",
        "method": "POST",
        "path": "/api/company",
        "status": 200,
        "created_at": "2026-04-07T10:00:00Z"
      }
    ]
  }
}
```

#### 12.2 获取操作日志详情

**接口**: `GET /api/operation-log/:id`

**权限**: 已登录用�?
**路径参数**:
- `id` - 日志 ID

**响应示例**:
```json
{
  "code": 200,
  "message": "获取操作日志详情成功",
  "data": {
    "id": 1,
    "username": "admin",
    "action": "创建企业",
    "method": "POST",
    "path": "/api/company",
    "request_body": "{\"name\":\"测试企业\"}",
    "response_body": "{\"code\":200,\"data\":{\"id\":1}}",
    "status": 200,
    "ip": "127.0.0.1",
    "user_agent": "Mozilla/5.0...",
    "created_at": "2026-04-07T10:00:00Z"
  }
}
```

---

## 快速开�?
### 1. 注册账号

```bash
curl -X POST http://localhost:9090/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "123456"
  }'
```

### 2. 登录获取 Token

```bash
curl -X POST http://localhost:9090/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "123456"
  }'
```

### 3. 使用 Token 调用接口

```bash
curl -X GET http://localhost:9090/api/company \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. 创建企业

```bash
curl -X POST http://localhost:9090/api/company \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试企业",
    "region": "上海",
    "industry": "跨境电商"
  }'
```

### 5. 风险预测

```bash
curl -X POST http://localhost:9090/api/risk/predict \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "测试企业",
    "recent_data": "�?3 个月订单 100 �?,
    "policy_news": ["新政策发�?],
    "user_complaints": ["物流延误投诉"],
    "graph_structure": {
      "物流�?: ["cooperation"],
      "海关": ["compliance"]
    }
  }'
```

---

## 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（Token 无效或过期） |
| 403 | 禁止访问（权限不足） |
| 404 | 资源不存�?|
| 500 | 服务器内部错�?|

---

## 注意事项

1. **Token 有效�?*: JWT Token 默认有效期为 24 小时
2. **分页**: 所有列表接口都支持分页，默认每�?10 �?3. **日期格式**: 所有日期字段使�?`YYYY-MM-DD` 格式
4. **逻辑删除**: 删除操作默认为逻辑删除，数据仍保留在数据库�?5. **自动记录**: 所有操作会自动记录到操作日志表

---

## 技术支�?
如有问题，请联系开发团队或查看项目文档�?
