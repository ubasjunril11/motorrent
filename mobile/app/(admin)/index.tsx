import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { bookingService } from '@/services/bookingService';
import { DashboardStats } from '@/types';
import StatCard from '@/components/StatCard';
import { COLORS } from '@/constants/theme';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const res = await bookingService.getStats();
      if (res.success && res.data) setStats(res.data);
    } catch {
      // handle silently
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(); }} colors={[COLORS.admin]} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Admin Dashboard</Text>
          <Text style={styles.name}>{user?.full_name}</Text>
        </View>
        <TouchableOpacity onPress={async () => { await logout(); router.replace('/(auth)/login'); }}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <StatCard title="Total Motors" value={stats?.motorcycles?.total ?? '-'} icon="bicycle" color={COLORS.admin} />
        <StatCard title="Available" value={stats?.motorcycles?.available ?? '-'} icon="checkmark-circle" color={COLORS.success} />
        <StatCard title="Pending Bookings" value={stats?.bookings?.pending ?? '-'} icon="time" color={COLORS.warning} />
        <StatCard title="Customers" value={stats?.customers?.total ?? '-'} icon="people" color={COLORS.info} />
      </View>

      <View style={styles.revenueCard}>
        <Ionicons name="cash" size={32} color={COLORS.success} />
        <View>
          <Text style={styles.revenueLabel}>Total Revenue</Text>
          <Text style={styles.revenueValue}>₱{Number(stats?.revenue ?? 0).toLocaleString()}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actions}>
        {[
          { label: 'Add Motorcycle', icon: 'add-circle' as const, route: '/admin/motorcycle-form' },
          { label: 'View Bookings', icon: 'calendar' as const, route: '/(admin)/bookings' },
          { label: 'Manage Customers', icon: 'people' as const, route: '/(admin)/customers' },
        ].map((action) => (
          <TouchableOpacity key={action.label} style={styles.actionItem} onPress={() => router.push(action.route as never)}>
            <Ionicons name={action.icon} size={28} color={COLORS.admin} />
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  greeting: { fontSize: 14, color: COLORS.textSecondary },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  revenueCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: COLORS.surface, margin: 16, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  revenueLabel: { fontSize: 14, color: COLORS.textSecondary },
  revenueValue: { fontSize: 28, fontWeight: '900', color: COLORS.success },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, paddingHorizontal: 20, marginTop: 8 },
  actions: { flexDirection: 'row', padding: 16, gap: 12 },
  actionItem: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  actionLabel: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginTop: 8, textAlign: 'center' },
});
