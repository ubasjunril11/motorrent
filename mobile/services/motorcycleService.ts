import api from './api';
import { Motorcycle, ApiResponse } from '@/types';

export const motorcycleService = {
  getAll: async (params?: Record<string, string>) => {
    const res = await api.get<ApiResponse<Motorcycle[]>>('/motorcycles', { params });
    return res.data;
  },

  getFeatured: async () => {
    const res = await api.get<ApiResponse<Motorcycle[]>>('/motorcycles/featured');
    return res.data;
  },

  getById: async (id: number) => {
    const res = await api.get<ApiResponse<Motorcycle>>(`/motorcycles/${id}`);
    return res.data;
  },

  create: async (formData: FormData) => {
    const res = await api.post<ApiResponse<Motorcycle>>('/motorcycles', formData);
    return res.data;
  },

  update: async (id: number, formData: FormData) => {
    const res = await api.put<ApiResponse<Motorcycle>>(`/motorcycles/${id}`, formData);
    return res.data;
  },

  delete: async (id: number) => {
    const res = await api.delete<ApiResponse<null>>(`/motorcycles/${id}`);
    return res.data;
  },
};
