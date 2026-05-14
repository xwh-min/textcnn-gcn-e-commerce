import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiService } from '../services/api';

interface User {
  id: string | number;
  username: string;
  email?: string;
  phone?: string;
  role?: string;
  permissions?: string[];
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, email?: string, phone?: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,

      login: async (username: string, password: string) => {
        try {
          const response = await apiService.login(username, password);
          
          if (response.code === 200 && response.token) {
            const token = response.token;
            const fallbackUser: User = {
              id: response.user?.id ?? 0,
              username: response.user?.username ?? username,
              email: response.user?.email,
              phone: response.user?.phone,
              role: response.user?.role,
              permissions: response.user?.permissions ?? [],
            };

            // 先写入 token，确保后续 getCurrentUser 能携带鉴权头
            set({
              isAuthenticated: true,
              user: fallbackUser,
              token,
            });

            // 再尝试拉取最新用户信息（失败时保留登录返回的用户信息）
            try {
              const currentUserResp = await apiService.getCurrentUser();
              if (currentUserResp.code === 200) {
                const remoteUser = (currentUserResp.data ?? response.user) as Partial<User> | undefined;
                set((state) => ({
                  ...state,
                  user: {
                    id: remoteUser?.id ?? fallbackUser.id,
                    username: remoteUser?.username ?? fallbackUser.username,
                    email: remoteUser?.email ?? fallbackUser.email,
                    phone: remoteUser?.phone ?? fallbackUser.phone,
                    role: remoteUser?.role ?? fallbackUser.role,
                    permissions: remoteUser?.permissions ?? fallbackUser.permissions ?? [],
                  },
                }));
              }
            } catch (err) {
              console.warn('获取当前用户信息失败，使用登录返回信息兜底:', err);
            }

            return true;
          } else {
            console.error('登录失败:', response.message);
            return false;
          }
        } catch (error) {
          console.error('登录API调用失败:', error);
          return false;
        }
      },

      register: async (username: string, password: string, email?: string, phone?: string) => {
        try {
          const response = await apiService.register({ username, password, email, phone });
          
          if (response.code === 200) {
            return true;
          } else {
            console.error('注册失败:', response.message);
            return false;
          }
        } catch (error) {
          console.error('注册API调用失败:', error);
          return false;
        }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
