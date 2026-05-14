import type {
  RiskPredictionRequest,
  RiskPredictionResult,
  BatchRiskPredictionRequest,
  PredictionHistoryRequest,
} from '@/src/types/risk';

const API_BASE_URL = 'http://localhost:9090/api';

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

class ApiService {
  private getToken(): string | null {
    try {
      const stored = localStorage.getItem('auth-storage');
      console.log('auth-storage content:', stored);
      if (!stored) {
        console.log('No auth-storage found');
        return null;
      }
      const parsed = JSON.parse(stored);
      console.log('Parsed auth-storage:', parsed);
      console.log('Token found:', parsed?.state?.token ? 'Yes' : 'No');
      return parsed?.state?.token ?? null;
    } catch (err) {
      console.error('Error parsing auth-storage:', err);
      return null;
    }
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    params?: Record<string, string | number>
  ): Promise<ApiResponse<T>> {
    const url = new URL(`${API_BASE_URL}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const token = this.getToken();
    console.log('Token being used for request:', token ? 'Present (masked)' : 'Null');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('Authorization header added');
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url.toString(), config);
      const contentType = response.headers.get('content-type') || '';
      const result = contentType.includes('application/json')
        ? await response.json()
        : { code: response.status, message: response.statusText };

      if (!response.ok) {
        const message = result?.message || result?.msg || response.statusText;

        if (response.status === 401) {
          localStorage.removeItem('auth-storage');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return { code: 401, message: '未登录或登录已过期' };
        }

        if (response.status === 403) {
          return { code: 403, message: message || '无权限访问' };
        }

        if (response.status === 429) {
          return { code: 429, message: message || '请求过于频繁' };
        }

        if (response.status >= 500) {
          return { code: response.status, message: message || '服务器异常，请稍后重试' };
        }

        return { code: response.status, message: message || '请求失败' };
      }

      return result;
    } catch (error) {
      console.error(`API Error: ${method} ${endpoint}`, error);
      return { code: 500, message: '网络异常，请检查连接后重试' };
    }
  }

  // ============ 认证相关 ============

  async login(username: string, password: string) {
    const url = new URL(`${API_BASE_URL}/login`);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify({ username, password }),
    });

    const contentType = response.headers.get('content-type') || '';
    const result = contentType.includes('application/json')
      ? await response.json()
      : { code: response.status, message: response.statusText };

    return result;
  }

  async register(data: { username: string; password: string; email?: string; phone?: string }) {
    const url = new URL(`${API_BASE_URL}/register`);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    const contentType = response.headers.get('content-type') || '';
    const result = contentType.includes('application/json')
      ? await response.json()
      : { code: response.status, message: response.statusText };

    return result;
  }

  async getCurrentUser() {
    return this.request('GET', '/user');
  }

  async getQueryHistory() {
    return this.request('GET', '/query-history');
  }

  async deleteQueryHistory(id: number) {
    return this.request('DELETE', `/query-history/${id}`);
  }

  // ============ 企业管理 ============

  async createCompany(data: {
    name: string;
    region?: string;
    industry?: string;
    credit_code: string;
    phone?: string;
    email?: string;
    address?: string;
    legal_representative?: string;
  }) {
    return this.request('POST', '/company', {
      company_name: data.name,
      credit_code: data.credit_code,
      registered_address: data.address || '',
      business_scope: data.industry || '',
      legal_representative: data.legal_representative || '',
      contact_phone: data.phone || '',
      contact_email: data.email || '',
    });
  }

  async getCompanies(params?: {
    page?: number;
    page_size?: number;
    name?: string;
    region?: string;
  }) {
    const backendParams = params
      ? {
          page: params.page,
          page_size: params.page_size,
          company_name: params.name,
        }
      : undefined;
    return this.request('GET', '/company', undefined, backendParams);
  }

  async getCompany(id: number) {
    return this.request('GET', `/company/${id}`);
  }

  async updateCompany(id: number, data: any) {
    return this.request('PUT', `/company/${id}`, data);
  }

  async deleteCompany(id: number) {
    return this.request('DELETE', `/company/${id}`);
  }

  async markCompanyHighRisk(id: number) {
    return this.request('POST', `/company/${id}/mark-high-risk`);
  }

  // ============ 物流商管理 ============

  async createLogistics(data: {
    name: string;
    code: string;
    phone?: string;
    email?: string;
    address?: string;
    service_regions?: string[];
  }) {
    return this.request('POST', '/logistics', {
      provider_name: data.name,
      business_license_no: data.code,
      service_type: '综合物流',
      coverage_countries: (data.service_regions || []).join(','),
    });
  }

  async getLogistics(params?: {
    page?: number;
    page_size?: number;
    name?: string;
  }) {
    const backendParams = params
      ? {
          page: params.page,
          page_size: params.page_size,
          provider_name: params.name,
        }
      : undefined;
    return this.request('GET', '/logistics', undefined, backendParams);
  }

  async getLogisticsById(id: number) {
    return this.request('GET', `/logistics/${id}`);
  }

  async updateLogistics(id: number, data: any) {
    return this.request('PUT', `/logistics/${id}`, {
      provider_name: data.name || data.provider_name,
      business_license_no: data.code || data.business_license_no,
      service_type: data.service_type,
      coverage_countries: Array.isArray(data.service_regions)
        ? data.service_regions.join(',')
        : data.coverage_countries,
    });
  }

  async deleteLogistics(id: number) {
    return this.request('DELETE', `/logistics/${id}`);
  }

  async markLogisticsHighRisk(id: number) {
    return this.request('POST', `/logistics/${id}/mark-high-risk`);
  }

  // ============ 海关管理 ============

  async createCustoms(data: {
    name: string;
    code: string;
    region: string;
    phone?: string;
    address?: string;
  }) {
    return this.request('POST', '/customs', {
      customs_name: data.name,
      customs_code: data.code,
      region: data.region,
      supervision_level: 'normal',
    });
  }

  async getCustoms(params?: {
    page?: number;
    page_size?: number;
    region?: string;
  }) {
    return this.request('GET', '/customs', undefined, params);
  }

  async getCustomsById(id: number) {
    return this.request('GET', `/customs/${id}`);
  }

  async updateCustoms(id: number, data: any) {
    return this.request('PUT', `/customs/${id}`, {
      customs_name: data.name || data.customs_name,
      customs_code: data.code || data.customs_code,
      region: data.region,
      supervision_level: data.supervision_level,
    });
  }

  async deleteCustoms(id: number) {
    return this.request('DELETE', `/customs/${id}`);
  }

  // ============ 图关系管理 ============

  async createRelation(data: {
    source_type: string;
    source_id: number;
    target_type: string;
    target_id: number;
    relation_type: string;
    weight: number;
    start_date: string;
    end_date?: string;
    remark?: string;
  }) {
    return this.request('POST', '/relation', data);
  }

  async getRelations(params?: {
    page?: number;
    page_size?: number;
    source_type?: string;
    target_type?: string;
  }) {
    return this.request('GET', '/relation', undefined, params);
  }

  async getRelationById(id: number) {
    return this.request('GET', `/relation/${id}`);
  }

  async updateRelation(id: number, data: any) {
    return this.request('PUT', `/relation/${id}`, data);
  }

  async terminateRelation(id: number) {
    return this.request('POST', `/relation/${id}/terminate`);
  }

  async getCompanyGraph(id: number) {
    return this.request('GET', `/relation/company/${id}`);
  }

  // ============ 政策新闻管理 ============

  async createPolicyNews(data: {
    title: string;
    content: string;
    source: string;
    publish_date: string;
    related_regions?: string[];
    related_companies?: number[];
  }) {
    return this.request('POST', '/policy-news', data);
  }

  async getPolicyNews(params?: {
    page?: number;
    page_size?: number;
    title?: string;
    source?: string;
  }) {
    return this.request('GET', '/policy-news', undefined, params);
  }

  async getPolicyNewsById(id: number) {
    return this.request('GET', `/policy-news/${id}`);
  }

  async updatePolicyNews(id: number, data: any) {
    return this.request('PUT', `/policy-news/${id}`, data);
  }

  async deletePolicyNews(id: number) {
    return this.request('DELETE', `/policy-news/${id}`);
  }

  // ============ 用户投诉管理 ============

  async createComplaint(data: {
    complaint_content: string;
    complaint_type: string;
    target_company_id?: number;
    target_logistics_id?: number;
    complaint_date: string;
  }) {
    return this.request('POST', '/complaint', data);
  }

  async getComplaints(params?: {
    page?: number;
    page_size?: number;
    complaint_type?: string;
    is_processed?: boolean;
  }) {
    return this.request('GET', '/complaint', undefined, params);
  }

  async getComplaintById(id: number) {
    return this.request('GET', `/complaint/${id}`);
  }

  async updateComplaint(id: number, data: any) {
    return this.request('PUT', `/complaint/${id}`, data);
  }

  async deleteComplaint(id: number) {
    return this.request('DELETE', `/complaint/${id}`);
  }

  async markComplaintProcessed(id: number) {
    return this.request('POST', `/complaint/${id}/mark-processed`);
  }

  // ============ 订单管理 ============

  async createOrder(data: {
    order_no: string;
    company_id: number;
    product_name: string;
    quantity: number;
    amount: number;
    order_date: string;
    destination: string;
  }) {
    return this.request('POST', '/order', data);
  }

  async batchImportOrders(orders: any[]) {
    return this.request('POST', '/order/batch-import', { orders });
  }

  async getOrders(params?: {
    page?: number;
    page_size?: number;
    company_id?: number;
    order_no?: string;
  }) {
    return this.request('GET', '/order', undefined, params);
  }

  async getOrderById(id: number) {
    return this.request('GET', `/order/${id}`);
  }

  async updateOrder(id: number, data: any) {
    return this.request('PUT', `/order/${id}`, data);
  }

  async deleteOrder(id: number) {
    return this.request('DELETE', `/order/${id}`);
  }

  // ============ 物流记录管理 ============

  async createLogisticsRecord(data: {
    tracking_no: string;
    order_id: number;
    logistics_id: number;
    current_location: string;
    status: string;
    shipment_date: string;
    estimated_delivery: string;
  }) {
    return this.request('POST', '/logistics-record', data);
  }

  async getLogisticsRecords(params?: {
    page?: number;
    page_size?: number;
    tracking_no?: string;
    status?: string;
  }) {
    return this.request('GET', '/logistics-record', undefined, params);
  }

  async getLogisticsRecordById(id: number) {
    return this.request('GET', `/logistics-record/${id}`);
  }

  async updateLogisticsRecord(id: number, data: any) {
    return this.request('PUT', `/logistics-record/${id}`, data);
  }

  async deleteLogisticsRecord(id: number) {
    return this.request('DELETE', `/logistics-record/${id}`);
  }

  // ============ 风险预测（统一 v1） ============

  async predictRisk(data: RiskPredictionRequest): Promise<ApiResponse<RiskPredictionResult>> {
    return this.request<RiskPredictionResult>('POST', '/v1/risk/predict', data);
  }

  async batchPredictRisk(data: BatchRiskPredictionRequest): Promise<ApiResponse<{ items: RiskPredictionResult[]; count: number }>> {
    return this.request<{ items: RiskPredictionResult[]; count: number }>('POST', '/v1/risk/predict/batch', data);
  }

  async getRiskHistory(params: PredictionHistoryRequest): Promise<ApiResponse<any>> {
    return this.request<any>('GET', '/v1/risk/predictions', undefined, params as any);
  }

  async getRiskPredictorHealth() {
    return this.request('GET', '/v1/risk/health');
  }

  async getRiskReport(params: { prediction_id?: string; company_name?: string }) {
    return this.request('GET', '/v1/risk/report', undefined, params as any);
  }

  // ============ 用户管理 ============

  async getUsers(params?: {
    page?: number;
    page_size?: number;
    username?: string;
    role?: string;
  }) {
    return this.request('GET', '/users', undefined, params);
  }

  async createUser(data: {
    username: string;
    password: string;
    email?: string;
    role?: string;
  }) {
    return this.request('POST', '/user', data);
  }

  async updateUser(id: number, data: any) {
    return this.request('PUT', `/user/${id}`, data);
  }

  async resetUserPassword(id: number, new_password: string) {
    return this.request('POST', `/user/${id}/reset-password`, { new_password });
  }

  async setUserStatus(id: number, enabled: boolean) {
    return this.request('POST', `/user/${id}/status`, { enabled });
  }

  // ============ API 密钥管理 ============

  async getApiKeys(params?: { page?: number; page_size?: number }) {
    return this.request('GET', '/api-key', undefined, params);
  }

  async createApiKey(data: { name: string; app_name?: string; rate_limit?: number }) {
    return this.request('POST', '/api-key', data);
  }

  async updateApiKey(id: number, data: { enabled?: boolean; rate_limit?: number }) {
    return this.request('PUT', `/api-key/${id}`, data);
  }

  async getApiStats(params?: { start_date?: string; end_date?: string; app_name?: string }) {
    return this.request('GET', '/api-key/stats', undefined, params);
  }

  // ============ 角色权限管理 ============

  async createRole(data: {
    name: string;
    code?: string;
    description: string;
    permissions: string[];
  }) {
    return this.request('POST', '/role', {
      role_name: data.name,
      description: data.description,
      permissions: data.permissions,
    });
  }

  async getRoles(params?: {
    page?: number;
    page_size?: number;
    name?: string;
  }) {
    const backendParams = params
      ? {
          page: params.page,
          page_size: params.page_size,
          role_name: params.name,
        }
      : undefined;
    return this.request('GET', '/role', undefined, backendParams);
  }

  async getRoleById(id: number) {
    return this.request('GET', `/role/${id}`);
  }

  async updateRole(id: number, data: any) {
    return this.request('PUT', `/role/${id}`, data);
  }

  async deleteRole(id: number) {
    return this.request('DELETE', `/role/${id}`);
  }

  // ============ 操作日志 ============

  async getOperationLogs(params?: {
    page?: number;
    page_size?: number;
    username?: string;
    action?: string;
    start_date?: string;
    end_date?: string;
  }) {
    return this.request('GET', '/operation-log', undefined, params);
  }

  async getOperationLogById(id: number) {
    return this.request('GET', `/operation-log/${id}`);
  }
}

export const apiService = new ApiService();
