import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '@/services/adminService';
import { User } from '@/types';
import EmptyState from '@/components/EmptyState';
import { COLORS } from '@/constants/theme';

export default function AdminCustomersScreen() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await adminService.getCustomers();
      if (res.success && res.data) setCustomers(res.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const toggleStatus = (customer: User) => {
    const action = customer.is_active ? 'deactivate' : 'activate';
    Alert.alert(`${action.charAt(0).toUpperCase() + action.slice(1)} Account`, `${action.charAt(0).toUpperCase() + action.slice(1)} ${customer.full_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await adminService.toggleCustomerStatus(customer.id);
            loadData();
          } catch {
            Alert.alert('Error', 'Failed to update customer status.');
          }
        },
      },
    ]);
  };

  const deleteCustomer = (customer: User) => {
    Alert.alert('Delete Customer', `Permanently delete ${customer.full_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminService.deleteCustomer(customer.id);
            loadData();
          } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Delete failed';
            Alert.alert('Error', msg);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <EmptyState title="Loading..." loading />
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.full_name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.full_name}</Text>
                <Text style={styles.email}>{item.email}</Text>
                {item.phone && <Text style={styles.phone}>{item.phone}</Text>}
                <View style={[styles.statusBadge, { backgroundColor: item.is_active ? COLORS.success + '20' : COLORS.error + '20' }]}>
                  <Text style={{ color: item.is_active ? COLORS.success : COLORS.error, fontSize: 11, fontWeight: '600' }}>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => toggleStatus(item)} style={styles.actionBtn}>
                  <Ionicons name={item.is_active ? 'ban' : 'checkmark-circle'} size={22} color={item.is_active ? COLORS.warning : COLORS.success} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteCustomer(item)} style={styles.actionBtn}>
                  <Ionicons name="trash-outline" size={22} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
          ListEmptyComponent={<EmptyState icon="people-outline" title="No customers" message="Customer accounts will appear here." />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16, flexGrow: 1 },
  card: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.admin, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  email: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  phone: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 6 },
  actions: { gap: 8 },
  actionBtn: { padding: 6 },
});
