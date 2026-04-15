// 风险等级映射
export const RISK_LEVELS = {
  LOW: {
    value: 'LOW',
    label: '低风险',
    color: '#52c41a',
  },
  MEDIUM: {
    value: 'MEDIUM',
    label: '中风险',
    color: '#faad14',
  },
  HIGH: {
    value: 'HIGH',
    label: '高风险',
    color: '#f5222d',
  },
};

// 关系类型映射
export const RELATION_TYPES = {
  SUPPLIER: {
    value: 'SUPPLIER',
    label: '供应商',
    color: '#1890ff',
  },
  CUSTOMER: {
    value: 'CUSTOMER',
    label: '客户',
    color: '#52c41a',
  },
  PARTNER: {
    value: 'PARTNER',
    label: '合作伙伴',
    color: '#faad14',
  },
  COMPETITOR: {
    value: 'COMPETITOR',
    label: '竞争对手',
    color: '#f5222d',
  },
};

// 实体类型映射
export const ENTITY_TYPES = {
  COMPANY: {
    value: 'COMPANY',
    label: '企业',
    color: '#1890ff',
  },
  LOGISTICS: {
    value: 'LOGISTICS',
    label: '物流商',
    color: '#52c41a',
  },
  CUSTOMS: {
    value: 'CUSTOMS',
    label: '海关',
    color: '#faad14',
  },
};

// 状态映射
export const STATUS = {
  ACTIVE: {
    value: 'ACTIVE',
    label: '活跃',
    color: '#52c41a',
  },
  INACTIVE: {
    value: 'INACTIVE',
    label: ' inactive',
    color: '#d9d9d9',
  },
  PENDING: {
    value: 'PENDING',
    label: '待处理',
    color: '#faad14',
  },
  FAILED: {
    value: 'FAILED',
    label: '失败',
    color: '#f5222d',
  },
};

// API 路径
export const API_PATHS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  USER_INFO: '/user',
  COMPANY: '/company',
  LOGISTICS: '/logistics',
  CUSTOMS: '/customs',
  GRAPH: '/graph',
  GRAPH_RELATIONS: '/graph/relations',
  POLICY_NEWS: '/data/policy-news',
  USER_COMPLAINTS: '/data/user-complaints',
  ORDERS: '/data/orders',
  RISK_PREDICT: '/v1/risk/predict',
  RISK_PREDICT_BATCH: '/v1/risk/predict/batch',
  RISK_RESULTS: '/v1/risk/predictions',
  RISK_REPORT_EXPORT: '/v1/risk/report',
  APP_KEYS: '/api-key',
  CALL_STATS: '/api-key/stats',
  API_DOC: '/api-key/doc',
  USERS: '/users',
  ROLES: '/role',
  LOGS: '/operation-log',
};