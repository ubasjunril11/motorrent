import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Resolves the backend host automatically in development.
 * - Web: localhost (same PC as backend)
 * - Expo Go on phone: same IP as Metro bundler (from QR code URL)
 * - Android emulator fallback: 10.0.2.2
 */
function getDevHost(): string {
  if (Platform.OS === 'web') {
    return 'localhost';
  }

  const metroHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (metroHost && metroHost !== 'localhost') {
    return metroHost;
  }

  // Android emulator maps host machine to 10.0.2.2
  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  return 'localhost';
}

const DEV_HOST = getDevHost();
const DEV_PORT = 5000;

export const API_BASE_URL = __DEV__
  ? `http://${DEV_HOST}:${DEV_PORT}/api`
  : 'https://your-production-api.com/api';

export const UPLOAD_BASE_URL = __DEV__
  ? `http://${DEV_HOST}:${DEV_PORT}`
  : 'https://your-production-api.com';

export const COLORS = {
  primary: '#e94560',
  primaryDark: '#c73e54',
  secondary: '#0f3460',
  background: '#f8f9fc',
  surface: '#ffffff',
  text: '#1a1a2e',
  textSecondary: '#6b7280',
  textLight: '#9ca3af',
  border: '#e5e7eb',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  admin: '#6366f1',
  gradientStart: '#1a1a2e',
  gradientEnd: '#16213e',
};

export const STATUS_COLORS: Record<string, string> = {
  available: COLORS.success,
  rented: COLORS.warning,
  maintenance: COLORS.error,
  pending: COLORS.warning,
  approved: COLORS.success,
  rejected: COLORS.error,
  completed: COLORS.info,
  cancelled: COLORS.textLight,
};
