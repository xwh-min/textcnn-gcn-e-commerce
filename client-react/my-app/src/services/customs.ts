import { apiService } from './api';

export interface Customs {
  id: string;
  customs_name: string;
  customs_code: string;
  region?: string;
  supervision_level?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CustomsParams {
  name: string;
  code: string;
  region?: string;
  supervision_level?: string;
}

export const customsService = {
  // 获取海关列表
  getList: (params?: { page?: number; page_size?: number; region?: string }) => {
    return apiService.getCustoms(params);
  },
  // 获取海关详情
  getDetail: (id: string) => {
    return apiService.getCustomsById(Number(id));
  },
  // 新增海关
  create: (params: CustomsParams) => {
    return apiService.createCustoms({
      name: params.name,
      code: params.code,
      region: params.region || '',
      phone: '',
      address: '',
    });
  },
  // 更新海关
  update: (id: string, params: CustomsParams) => {
    return apiService.updateCustoms(Number(id), {
      customs_name: params.name,
      customs_code: params.code,
      region: params.region,
      supervision_level: params.supervision_level,
    });
  },
  // 删除海关
  delete: (id: string) => {
    return apiService.deleteCustoms(Number(id));
  },
};
