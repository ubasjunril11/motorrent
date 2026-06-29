import api from './api';
import { Booking, DashboardStats, ApiResponse } from '@/types';

export const bookingService = {
  create: async (data: { motorcycle_id: number; start_date: string; end_date: string; notes?: string }) => {
    const res = await api.post<ApiResponse<Booking>>('/bookings', data);
    return res.data;
  },

  getMyBookings: async () => {
    const res = await api.get<ApiResponse<Booking[]>>('/bookings/my');
    return res.data;
  },

  getAll: async (status?: string) => {
    const res = await api.get<ApiResponse<Booking[]>>('/bookings', { params: status ? { status } : {} });
    return res.data;
  },

  getById: async (id: number) => {
    const res = await api.get<ApiResponse<Booking>>(`/bookings/${id}`);
    return res.data;
  },

  cancel: async (id: number) => {
    const res = await api.patch<ApiResponse<null>>(`/bookings/${id}/cancel`);
    return res.data;
  },

  updateStatus: async (id: number, status: string, admin_notes?: string) => {
    const res = await api.patch<ApiResponse<Booking>>(`/bookings/${id}/status`, { status, admin_notes });
    return res.data;
  },

  getStats: async () => {
    const res = await api.get<ApiResponse<DashboardStats>>('/bookings/stats');
    return res.data;
  },
};
