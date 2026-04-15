import { apiService } from './api';

export interface LoginParams {
  username: string;
  password: string;
}

export const authService = {
  // 登录
  login: (params: LoginParams) => {
    return apiService.login(params.username, params.password);
  },
  // 登出（当前后端无专用接口，前端清理本地态即可）
  logout: async () => {
    return { code: 200, message: 'ok' };
  },
  // 获取用户信息
  getUserInfo: () => {
    return apiService.getCurrentUser();
  },
};
