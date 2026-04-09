const API_BASE_URL = 'http://localhost:9090/api';

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  result?: T;
  results?: T[];
  user?: any;
}

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('auth-storage') ? 
      JSON.parse(localStorage.getItem('auth-storage') || '{}').state?.token : null;
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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
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
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`API Error: ${method} ${endpoint}`, error);
      throw error;
    }
  }

  // ============ 认证相关 ============
  
  async login(username: string, password: string) {
    return this.request('POST', '/login', { username, password });
  }

  async register(data: { username: string; password: string; email?: string; phone?: string }) {
    return this.request('POST', '/register', data);
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
    region: string;
    industry: string;
    credit_code: string;
    phone: string;
    email: string;
    address: string;
    risk_level?: string;
  }) {
    return this.request('POST', '/company', data);
  }

  async getCompanies(params?: {
    page?: number;
    page_size?: number;
    name?: string;
    region?: string;
  }) {
    return this.request('GET', '/company', undefined, params);
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
    phone: string;
    email: string;
    address: string;
    service_regions: string[];
  }) {
    return this.request('POST', '/logistics', data);
  }

  async getLogistics(params?: {
    page?: number;
    page_size?: number;
    name?: string;
  }) {
    return this.request('GET', '/logistics', undefined, params);
  }

  async getLogisticsById(id: number) {
    return this.request('GET', `/logistics/${id}`);
  }

  async updateLogistics(id: number, data: any) {
    return this.request('PUT', `/logistics/${id}`, data);
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
    phone: string;
    address: string;
  }) {
    return this.request('POST', '/customs', data);
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
    return this.request('PUT', `/customs/${id}`, data);
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

  // ============ 风险预测 ============
  
  async predictRisk(data: {
    company_name: string;
    recent_data: string;
    policy_news?: string[];
    user_complaints?: string[];
    graph_structure?: any;
  }) {
    return this.request('POST', '/risk/predict', data);
  }

  async batchPredictRisk(company_names: string[]) {
    return this.request('POST', '/risk/batch-predict', { company_names });
  }

  async getRiskHistory(data: {
    company_name?: string;
    limit?: number;
  }) {
    return this.request('POST', '/risk/history', data);
  }

  // ============ 角色权限管理 ============
  
  async createRole(data: {
    name: string;
    code: string;
    description: string;
    permissions: string[];
  }) {
    return this.request('POST', '/role', data);
  }

  async getRoles(params?: {
    page?: number;
    page_size?: number;
    name?: string;
  }) {
    return this.request('GET', '/role', undefined, params);
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
