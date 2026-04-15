import { apiService } from './api';

export interface Company {
  id: string;
  company_name: string;
  credit_code: string;
  registered_address?: string;
  business_scope?: string;
  legal_representative?: string;
  contact_phone?: string;
  contact_email?: string;
  is_high_risk?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyParams {
  name: string;
  credit_code: string;
  address?: string;
  industry?: string;
  legal_representative?: string;
  phone?: string;
  email?: string;
}

export const companyService = {
  // 获取企业列表
  getList: (params?: { page?: number; page_size?: number; name?: string }) => {
    return apiService.getCompanies(params);
  },
  // 获取企业详情
  getDetail: (id: string) => {
    return apiService.getCompany(Number(id));
  },
  // 新增企业
  create: (params: CompanyParams) => {
    return apiService.createCompany(params);
  },
  // 更新企业
  update: (id: string, params: CompanyParams) => {
    return apiService.updateCompany(Number(id), {
      company_name: params.name,
      credit_code: params.credit_code,
      registered_address: params.address,
      business_scope: params.industry,
      legal_representative: params.legal_representative,
      contact_phone: params.phone,
      contact_email: params.email,
    });
  },
  // 删除企业
  delete: (id: string) => {
    return apiService.deleteCompany(Number(id));
  },
};
