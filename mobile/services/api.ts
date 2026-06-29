import axios from 'axios';
import { API_BASE_URL } from '@/constants/theme';
import { getToken, setToken, removeToken } from './tokenStorage';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  try {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Continue without token if storage is unavailable
  }
  return config;
});

export default api;

export const setAuthToken = setToken;
export const clearAuthToken = removeToken;
export const getAuthToken = getToken;
