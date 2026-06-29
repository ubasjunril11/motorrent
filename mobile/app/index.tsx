import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';

export default function Index() {
  const { isLoading, isAuthenticated, isAdmin } = useAuth();

  if (isLoading) return <LoadingScreen message="Starting MotorRent..." />;

  if (isAuthenticated && isAdmin) return <Redirect href="/(admin)" />;
  if (isAuthenticated) return <Redirect href="/(tabs)" />;

  return <Redirect href="/(tabs)" />;
}
