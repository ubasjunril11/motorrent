import api from './api';
import { User, Booking, ApiResponse } from '@/types';

export const adminService = {
  getCustomers: async (params?: Record<string, string>) => {
    const res = await api.get<ApiResponse<User[]>>('/admin/customers', { params });
    return res.data;
  },

  getCustomerById: async (id: number) => {
    const res = await api.get<ApiResponse<User & { bookings: Booking[] }>>(`/admin/customers/${id}`);
    return res.data;
  },

  toggleCustomerStatus: async (id: number) => {
    const res = await api.patch<ApiResponse<{ id: number; is_active: boolean }>>(`/admin/customers/${id}/toggle-status`);
    return res.data;
  },

  deleteCustomer: async (id: number) => {
    const res = await api.delete<ApiResponse<null>>(`/admin/customers/${id}`);
    return res.data;
  },
};
