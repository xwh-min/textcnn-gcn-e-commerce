# 前端调用快速指�?
## 🚀 快速开�?
### 1. 启动后端服务

```bash
# 进入项目目录
cd server

# 启动服务
go run ./cmd/api

# 或使用编译后的可执行文件
./server.exe
```

服务启动后，默认访问地址：`http://localhost:9090`

### 2. 获取认证 Token

#### 注册账号

```bash
curl -X POST http://localhost:9090/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "123456"
  }'
```

#### 登录获取 Token

```bash
curl -X POST http://localhost:9090/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "123456"
  }'
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

**保存 Token**，后续所有请求都需要使用�?
---

## 📝 前端集成示例

### JavaScript / TypeScript

#### 封装请求�?
```javascript
class ApiService {
  constructor(baseURL = 'http://localhost:9090/api') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('token');
  }

  // 设置 Token
  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  // 通用请求方法
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // 添加 Token
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (data.code !== 200) {
      throw new Error(data.message || '请求失败');
    }

    return data;
  }

  // GET 请求
  get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  // POST 请求
  post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT 请求
  put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE 请求
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// 使用示例
const api = new ApiService();

// 登录
async function login(username, password) {
  const result = await api.post('/login', { username, password });
  api.setToken(result.data.token);
  return result;
}

// 获取企业列表
async function getCompanies(page = 1, pageSize = 10) {
  return await api.get('/company', { page, page_size: pageSize });
}

// 创建企业
async function createCompany(companyData) {
  return await api.post('/company', companyData);
}

// 风险预测
async function predictRisk(predictionData) {
  return await api.post('/risk/predict', predictionData);
}
```

### Vue 3 示例

```vue
<template>
  <div>
    <h1>企业列表</h1>
    <button @click="loadCompanies">刷新列表</button>
    <ul>
      <li v-for="company in companies" :key="company.id">
        {{ company.name }} - {{ company.region }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

const companies = ref([]);
const api = new ApiService(); // 使用上面封装�?ApiService

// 加载企业列表
const loadCompanies = async () => {
  try {
    const result = await api.get('/company', { page: 1, page_size: 10 });
    companies.value = result.data.companies;
    ElMessage.success('加载成功');
  } catch (error) {
    ElMessage.error(error.message);
  }
};

// 风险预测示例
const predictRisk = async (companyName) => {
  try {
    const result = await api.post('/risk/predict', {
      company_name: companyName,
      recent_data: '�?3 个月业务数据',
      policy_news: ['政策 1', '政策 2'],
      user_complaints: ['投诉 1'],
      graph_structure: {
        '物流�?: ['cooperation'],
        '海关': ['compliance']
      }
    });
    
    console.log('预测结果:', result.result);
    ElMessage.success(`合规风险�?{result.result.compliance_risk}`);
  } catch (error) {
    ElMessage.error(error.message);
  }
};

onMounted(() => {
  loadCompanies();
});
</script>
```

### React 示例

```jsx
import { useState, useEffect } from 'react';
import { message } from 'antd';

const api = new ApiService();

// 企业列表组件
function CompanyList() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);

  // 加载企业列表
  const loadCompanies = async () => {
    setLoading(true);
    try {
      const result = await api.get('/company', { page: 1, page_size: 10 });
      setCompanies(result.data.companies);
      message.success('加载成功');
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  return (
    <div>
      <h1>企业列表</h1>
      <button onClick={loadCompanies} disabled={loading}>
        {loading ? '加载�?..' : '刷新列表'}
      </button>
      <ul>
        {companies.map(company => (
          <li key={company.id}>
            {company.name} - {company.region}
          </li>
        ))}
      </ul>
    </div>
  );
}

// 风险预测组件
function RiskPredict() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handlePredict = async (companyName) => {
    setLoading(true);
    try {
      const result = await api.post('/risk/predict', {
        company_name: companyName,
        recent_data: '�?3 个月业务数据',
        policy_news: ['政策 1'],
        user_complaints: ['投诉 1'],
        graph_structure: {
          '物流�?: ['cooperation'],
          '海关': ['compliance']
        }
      });
      
      setResult(result.result);
      message.success('预测完成');
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>风险预测</h1>
      <button onClick={() => handlePredict('测试企业')} disabled={loading}>
        {loading ? '预测�?..' : '开始预�?}
      </button>
      
      {result && (
        <div>
          <h2>预测结果</h2>
          <p>合规风险：{result.compliance_risk} ({result.compliance_score})</p>
          <p>支付风险：{result.payment_risk} ({result.payment_score})</p>
        </div>
      )}
    </div>
  );
}

export { CompanyList, RiskPredict };
```

---

## 🔧 常用接口调用示例

### 1. 企业 CRUD 操作

```javascript
// 获取企业列表
const companies = await api.get('/company', {
  page: 1,
  page_size: 10,
  name: '测试',  // 可选：按名称搜�?  region: '上海'  // 可选：按地区筛�?});

// 获取企业详情
const company = await api.get('/company/1');

// 创建企业
const newCompany = await api.post('/company', {
  name: '新企�?,
  region: '北京',
  industry: '跨境电商',
  credit_code: '91110000XXXXXXXXXX',
  phone: '010-12345678',
  email: 'contact@example.com',
  address: '北京市朝阳区 XXX �?XXX �?
});

// 更新企业
await api.put('/company/1', {
  name: '更新后的企业名称',
  phone: '010-87654321'
});

// 删除企业
await api.delete('/company/1');

// 标记为高风险
await api.post('/company/1/mark-high-risk');
```

### 2. 风险预测

```javascript
// 单次预测
const prediction = await api.post('/risk/predict', {
  company_name: '测试企业',
  recent_data: '�?3 个月订单 100 笔，物流记录 80 �?,
  policy_news: [
    '海关总署发布新政策：加强跨境电商监管',
    '商务部：支持跨境电商海外仓建�?
  ],
  user_complaints: [
    '物流延误，一周未发货',
    '商品质量有问题，要求退�?
  ],
  graph_structure: {
    '物流�?: ['cooperation', 'cooperation'],
    '海关': ['compliance'],
    '供应�?: ['cooperation']
  }
});

console.log('预测结果:', prediction.result);
// 输出�?// {
//   compliance_risk: 'medium',
//   payment_risk: 'low',
//   compliance_score: 0.65,
//   payment_score: 0.35,
//   prediction_id: 1
// }

// 批量预测
const batchPredictions = await api.post('/risk/batch-predict', {
  company_names: ['企业 A', '企业 B', '企业 C']
});

// 获取预测历史
const history = await api.post('/risk/history', {
  company_name: '测试企业',
  limit: 10
});
```

### 3. 图关系管�?
```javascript
// 创建关系
await api.post('/relation', {
  source_type: 'eco_company',
  source_id: 1,
  target_type: 'logistics_provider',
  target_id: 2,
  relation_type: 'cooperation',
  weight: 3.5,
  start_date: '2026-01-01',
  remark: '长期合作'
});

// 获取企业关系图谱
const graph = await api.get('/relation/company/1');
console.log('关系图谱:', graph.data);
// 输出�?// {
//   company: { id: 1, name: '企业 A' },
//   relations: [
//     {
//       target_type: 'logistics_provider',
//       target_name: '物流�?B',
//       relation_type: 'cooperation',
//       weight: 3.5
//     }
//   ]
// }
```

### 4. 批量导入

```javascript
// 批量导入订单
await api.post('/order/batch-import', {
  orders: [
    {
      order_no: 'ORDER001',
      company_id: 1,
      product_name: '商品 A',
      quantity: 100,
      amount: 10000.00,
      order_date: '2026-04-07',
      destination: '美国'
    },
    {
      order_no: 'ORDER002',
      company_id: 1,
      product_name: '商品 B',
      quantity: 200,
      amount: 20000.00,
      order_date: '2026-04-08',
      destination: '英国'
    }
  ]
});
```

---

## 📊 数据可视化示�?
### 使用 ECharts 展示关系图谱

```javascript
import * as echarts from 'echarts';

// 获取企业关系图谱
async function renderCompanyGraph(companyId) {
  const graph = await api.get(`/relation/company/${companyId}`);
  
  const chart = echarts.init(document.getElementById('graph-chart'));
  
  // 准备数据
  const nodes = [
    {
      name: graph.data.company.name,
      symbolSize: 50,
      category: 0,
      value: '企业'
    }
  ];
  
  const links = [];
  
  graph.data.relations.forEach((relation, index) => {
    // 添加目标节点
    nodes.push({
      name: relation.target_name,
      symbolSize: 30,
      category: index + 1,
      value: relation.target_type
    });
    
    // 添加关系�?    links.push({
      source: graph.data.company.name,
      target: relation.target_name,
      value: relation.relation_type,
      label: {
        show: true,
        formatter: relation.relation_type
      }
    });
  });
  
  // 配置图表
  const option = {
    title: { text: '企业关系图谱' },
    tooltip: {},
    series: [{
      type: 'graph',
      layout: 'force',
      data: nodes,
      links: links,
      roam: true,
      label: {
        show: true,
        position: 'right'
      },
      force: {
        repulsion: 300,
        edgeLength: 100
      }
    }]
  };
  
  chart.setOption(option);
}

// 使用
renderCompanyGraph(1);
```

---

## 🐛 错误处理

```javascript
class ApiService {
  // ... 前面的代�?...

  async request(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      // 处理不同状态码
      if (response.status === 401) {
        // Token 过期，跳转登�?        this.clearToken();
        window.location.href = '/login';
        throw new Error('登录已过期，请重新登�?);
      }

      if (response.status === 403) {
        throw new Error('权限不足');
      }

      if (response.status === 404) {
        throw new Error('资源不存�?);
      }

      if (data.code !== 200) {
        throw new Error(data.message || '请求失败');
      }

      return data;
    } catch (error) {
      console.error('API 请求错误:', error);
      throw error;
    }
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }
}
```

---

## 📋 完整接口列表

详细接口文档请查看：[**API_DOCUMENTATION.md**](./API_DOCUMENTATION.md)

---

## 💡 开发建�?
1. **Token 管理**: �?Token 存储�?localStorage �?Vuex/Redux �?2. **请求拦截**: 统一处理 401�?03 等错�?3. **加载状�?*: 使用 loading 状态提升用户体�?4. **错误提示**: 使用 Message/Notification 组件展示错误信息
5. **请求缓存**: 对不常变的数据进行缓�?6. **分页处理**: 列表接口统一使用分页

---

## 🔗 相关资源

- [完整 API 文档](./API_DOCUMENTATION.md)
- [架构设计文档](./ARCHITECTURE.md)
- [ONNX 集成指南](./ONNX_INTEGRATION.md)

---

## 📞 技术支�?
如有问题，请联系开发团队或查看项目文档�?