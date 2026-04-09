import request from './request';

export interface Company {
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

export interface CompanyParams {
  name: string;
  code: string;
  address: string;
  contact: string;
  phone: string;
  email: string;
}

export const companyService = {
  // 获取企业列表
  getList: (params?: { page?: number; size?: number; keyword?: string }) => {
    return request.get<{ list: Company[]; total: number }>('/company', { params });
  },
  // 获取企业详情
  getDetail: (id: string) => {
    return request.get<Company>(`/company/${id}`);
  },
  // 新增企业
  create: (params: CompanyParams) => {
    return request.post<Company>('/company', params);
  },
  // 更新企业
  update: (id: string, params: CompanyParams) => {
    return request.put<Company>(`/company/${id}`, params);
  },
  // 删除企业
  delete: (id: string) => {
    return request.delete(`/company/${id}`);
  },
};