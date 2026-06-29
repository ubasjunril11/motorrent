import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@/types';
import { authService } from '@/services/authService';
import { getAuthToken } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ role: string }>;
  register: (data: { full_name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        setUser(null);
        return;
      }
      const res = await authService.getProfile();
      if (res.success && res.data) setUser(res.data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshProfile().finally(() => setIsLoading(false));
  }, [refreshProfile]);

  const getErrorMessage = (err: unknown, fallback: string) => {
    const axiosErr = err as {
      response?: { data?: { message?: string } };
      code?: string;
      message?: string;
    };

    if (axiosErr.response?.data?.message) {
      return axiosErr.response.data.message;
    }

    if (!axiosErr.response) {
      return 'Cannot reach the backend server. Make sure "npm start" is running in the backend folder and restart Expo with cache cleared (npx expo start --clear).';
    }

    return axiosErr.message || fallback;
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await authService.login(email, password);
      if (res.success && res.data) {
        setUser(res.data.user);
        return { role: res.data.role };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      throw new Error(getErrorMessage(err, 'Login failed'));
    }
  };

  const register = async (data: { full_name: string; email: string; password: string; phone?: string }) => {
    try {
      const res = await authService.register(data);
      if (res.success && res.data) setUser(res.data.user);
      else throw new Error(res.message || 'Registration failed');
    } catch (err) {
      throw new Error(getErrorMessage(err, 'Registration failed'));
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
