import request from './request';

export interface PolicyNews {
  id: string;
  title: string;
  content: string;
  publish_date: string;
  source: string;
  created_at: string;
}

export interface UserComplaint {
  id: string;
  user_id: string;
  company_id: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface OrderData {
  id: string;
  order_id: string;
  company_id: string;
  logistics_id: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export const dataService = {
  // 政策新闻管理
  policyNews: {
    getList: (params?: { page?: number; size?: number; keyword?: string }) => {
      return request.get<{ list: PolicyNews[]; total: number }>('/data/policy-news', { params });
    },
    getDetail: (id: string) => {
      return request.get<PolicyNews>(`/data/policy-news/${id}`);
    },
    create: (params: { title: string; content: string; publish_date: string; source: string }) => {
      return request.post<PolicyNews>('/data/policy-news', params);
    },
    update: (id: string, params: { title: string; content: string; publish_date: string; source: string }) => {
      return request.put<PolicyNews>(`/data/policy-news/${id}`, params);
    },
    delete: (id: string) => {
      return request.delete(`/data/policy-news/${id}`);
    },
  },
  // 用户投诉管理
  userComplaint: {
    getList: (params?: { page?: number; size?: number; company_id?: string; status?: string }) => {
      return request.get<{ list: UserComplaint[]; total: number }>('/data/user-complaints', { params });
    },
    getDetail: (id: string) => {
      return request.get<UserComplaint>(`/data/user-complaints/${id}`);
    },
    updateStatus: (id: string, status: string) => {
      return request.put<UserComplaint>(`/data/user-complaints/${id}/status`, { status });
    },
  },
  // 订单数据管理
  orderData: {
    getList: (params?: { page?: number; size?: number; company_id?: string; logistics_id?: string; status?: string }) => {
      return request.get<{ list: OrderData[]; total: number }>('/data/orders', { params });
    },
    getDetail: (id: string) => {
      return request.get<OrderData>(`/data/orders/${id}`);
    },
  },
};