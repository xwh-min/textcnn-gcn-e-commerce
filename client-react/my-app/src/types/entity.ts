// 企业类型
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

// 物流商类型
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

// 海关类型
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

// 实体类型枚举
export enum EntityType {
  COMPANY = 'COMPANY',
  LOGISTICS = 'LOGISTICS',
  CUSTOMS = 'CUSTOMS',
}

// 通用实体接口
export interface Entity {
  id: string;
  name: string;
  code: string;
  type: EntityType;
  status: string;
  created_at: string;
  updated_at: string;
}