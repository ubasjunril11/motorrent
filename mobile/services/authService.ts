import api, { setAuthToken, clearAuthToken } from './api';
import { User, ApiResponse } from '@/types';

export const authService = {
  register: async (data: { full_name: string; email: string; password: string; phone?: string }) => {
    const res = await api.post<ApiResponse<{ user: User; token: string; role: string }>>('/auth/register', data);
    if (res.data.data?.token) await setAuthToken(res.data.data.token);
    return res.data;
  },

  login: async (email: string, password: string) => {
    const res = await api.post<ApiResponse<{ user: User; token: string; role: string }>>('/auth/login', {
      email,
      password,
    });
    if (res.data.data?.token) await setAuthToken(res.data.data.token);
    return res.data;
  },

  logout: async () => {
    await clearAuthToken();
  },

  getProfile: async () => {
    const res = await api.get<ApiResponse<User>>('/auth/profile');
    return res.data;
  },

  updateProfile: async (data: { full_name?: string; phone?: string; avatar_url?: string }) => {
    const res = await api.put<ApiResponse<User>>('/auth/profile', data);
    return res.data;
  },

  changePassword: async (current_password: string, new_password: string) => {
    const res = await api.put<ApiResponse<null>>('/auth/change-password', { current_password, new_password });
    return res.data;
  },
};
