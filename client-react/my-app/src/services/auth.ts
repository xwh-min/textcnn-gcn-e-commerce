import request from './request';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

export const authService = {
  // 登录
  login: (params: LoginParams) => {
    return request.post<LoginResponse>('/auth/login', params);
  },
  // 登出
  logout: () => {
    return request.post('/auth/logout');
  },
  // 获取用户信息
  getUserInfo: () => {
    return request.get('/auth/user');
  },
};