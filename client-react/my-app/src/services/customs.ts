import request from './request';

export interface Customs {
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

export interface CustomsParams {
  name: string;
  code: string;
  address: string;
  contact: string;
  phone: string;
  email: string;
}

export const customsService = {
  // 获取海关列表
  getList: (params?: { page?: number; size?: number; keyword?: string }) => {
    return request.get<{ list: Customs[]; total: number }>('/customs', { params });
  },
  // 获取海关详情
  getDetail: (id: string) => {
    return request.get<Customs>(`/customs/${id}`);
  },
  // 新增海关
  create: (params: CustomsParams) => {
    return request.post<Customs>('/customs', params);
  },
  // 更新海关
  update: (id: string, params: CustomsParams) => {
    return request.put<Customs>(`/customs/${id}`, params);
  },
  // 删除海关
  delete: (id: string) => {
    return request.delete(`/customs/${id}`);
  },
};