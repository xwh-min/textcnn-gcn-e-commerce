import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiService } from '../services/api';

interface User {
  id: string | number;
  username: string;
  email?: string;
  phone?: string;
  role?: string;
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
          
          if (response.code === 200 && response.data?.token) {
            set({
              isAuthenticated: true,
              user: response.data.user || { id: 0, username },
              token: response.data.token,
            });
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
