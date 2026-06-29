import api from './api';
import { Motorcycle, ApiResponse } from '@/types';

interface ChatResponse {
  reply: string;
  suggested_motorcycles?: { id: number; name: string; daily_rate: number }[];
}

export const aiService = {
  chat: async (message: string, history: { role: string; content: string }[] = []) => {
    const res = await api.post<ApiResponse<ChatResponse>>('/ai/chat', { message, history });
    return res.data;
  },

  getRecommendations: async (params?: { budget?: string; purpose?: string; capacity?: string }) => {
    const res = await api.get<ApiResponse<Motorcycle[]>>('/ai/recommendations', { params });
    return res.data;
  },
};
