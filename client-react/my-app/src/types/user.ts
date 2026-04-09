// 用户类型
export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  role_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// 角色类型
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

// 权限类型
export interface Permission {
  id: string;
  name: string;
  code: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// 登录参数
export interface LoginParams {
  username: string;
  password: string;
}

// 登录响应
export interface LoginResponse {
  token: string;
  user: User;
  permissions: string[];
}

// 用户状态枚举
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
}

// 角色状态枚举
export enum RoleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}