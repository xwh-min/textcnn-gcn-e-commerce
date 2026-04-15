import request from './request';

export interface Logistics {
  id: string;
  name: string;
  code: string;
  address: string;
  contact: string;
  phone: string;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LogisticsParams {
  name: string;
  code: string;
  address: string;
  contact: string;
  phone: string;
  email: string;
}

export const logisticsService = {
  // 获取物流商列表
  getList: (params?: { page?: number; size?: number; keyword?: string }) => {
    return request.get<{ list: Logistics[]; total: number }>('/logistics', { params });
  },
  // 获取物流商详情
  getDetail: (id: string) => {
    return request.get<Logistics>(`/logistics/${id}`);
  },
  // 新增物流商
  create: (params: LogisticsParams) => {
    return request.post<Logistics>('/logistics', params);
  },
  // 更新物流商
  update: (id: string, params: LogisticsParams) => {
    return request.put<Logistics>(`/logistics/${id}`, params);
  },
  // 删除物流商
  delete: (id: string) => {
    return request.delete(`/logistics/${id}`);
  },
};