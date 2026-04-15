import request from './request';

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

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface Log {
  id: string;
  user_id: string;
  username: string;
  action: string;
  resource: string;
  ip: string;
  created_at: string;
}

export const systemService = {
  // 用户管理
  user: {
    getList: (params?: { page?: number; size?: number; username?: string; status?: string }) => {
      return request.get<{ list: User[]; total: number }>('/system/users', { params });
    },
    getDetail: (id: string) => {
      return request.get<User>(`/system/users/${id}`);
    },
    create: (params: { username: string; password: string; name: string; email: string; phone: string; role_id: string }) => {
      return request.post<User>('/system/users', params);
    },
    update: (id: string, params: { name: string; email: string; phone: string; role_id: string; status: string }) => {
      return request.put<User>(`/system/users/${id}`, params);
    },
    updatePassword: (id: string, password: string) => {
      return request.put(`/system/users/${id}/password`, { password });
    },
    delete: (id: string) => {
      return request.delete(`/system/users/${id}`);
    },
  },
  // 角色管理
  role: {
    getList: (params?: { page?: number; size?: number; name?: string }) => {
      return request.get<{ list: Role[]; total: number }>('/system/roles', { params });
    },
    getDetail: (id: string) => {
      return request.get<Role>(`/system/roles/${id}`);
    },
    create: (params: { name: string; description: string; permissions: string[] }) => {
      return request.post<Role>('/system/roles', params);
    },
    update: (id: string, params: { name: string; description: string; permissions: string[] }) => {
      return request.put<Role>(`/system/roles/${id}`, params);
    },
    delete: (id: string) => {
      return request.delete(`/system/roles/${id}`);
    },
  },
  // 操作日志审计
  log: {
    getList: (params?: { page?: number; size?: number; username?: string; action?: string; start_date?: string; end_date?: string }) => {
      return request.get<{ list: Log[]; total: number }>('/system/logs', { params });
    },
  },
};