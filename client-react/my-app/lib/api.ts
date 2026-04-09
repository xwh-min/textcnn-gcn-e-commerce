const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9090',
  
  TIMEOUT: 30000,
  
  ENDPOINTS: {
    RISK_PREDICT: '/api/risk/predict',
    ENTERPRISES: '/api/enterprises',
    ENTERPRISE_DETAIL: '/api/enterprises/:id',
    RISKS: '/api/risks',
    RISK_DETAIL: '/api/risks/:id',
    GRAPH: '/api/graph',
    AUTH_LOGIN: '/api/auth/login',
    AUTH_REGISTER: '/api/auth/register',
    USER_PROFILE: '/api/user/profile',
  },
  
  HEADERS: {
    'Content-Type': 'application/json',
  },
} as const;

export const getFullUrl = (endpoint: string, params?: Record<string, string>): string => {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  if (params) {
    Object.keys(params).forEach((key) => {
      url = url.replace(`:${key}`, params[key]);
    });
  }
  
  return url;
};

export const getLocalApiUrl = (endpoint: string): string => {
  return endpoint;
};

export default API_CONFIG;
