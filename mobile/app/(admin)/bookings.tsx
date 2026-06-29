import { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { bookingService } from '@/services/bookingService';
import { Booking } from '@/types';
import BookingCard from '@/components/BookingCard';
import EmptyState from '@/components/EmptyState';
import AppModal from '@/components/AppModal';
import { COLORS } from '@/constants/theme';

const FILTERS: { label: string; value: string | undefined }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Completed', value: 'completed' },
  { label: 'All', value: undefined },
];

export default function AdminBookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string | undefined>('pending');

  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    booking: Booking | null;
    status: string;
  }>({ visible: false, booking: null, status: '' });

  const [feedbackModal, setFeedbackModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({ visible: false, title: '', message: '', type: 'success' });

  const loadData = useCallback(async () => {
    try {
      const res = await bookingService.getAll(filter);
      if (res.success && res.data) setBookings(res.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAction = (booking: Booking, status: string) => {
    setConfirmModal({ visible: true, booking, status });
  };

  const confirmAction = async () => {
    const { booking, status } = confirmModal;
    setConfirmModal({ visible: false, booking: null, status: '' });

    if (!booking) return;

    try {
      await bookingService.updateStatus(booking.id, status);
      await loadData();
      setFeedbackModal({
        visible: true,
        title: status === 'approved' ? 'Booking Approved!' : 'Booking Rejected',
        message:
          status === 'approved'
            ? `${booking.customer_name}'s booking for ${booking.brand} ${booking.model} has been approved.`
            : `${booking.customer_name}'s booking for ${booking.brand} ${booking.model} has been rejected.`,
        type: 'success',
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update booking status.';
      setFeedbackModal({
        visible: true,
        title: 'Action Failed',
        message: msg,
        type: 'error',
      });
    }
  };

  const actionLabel = confirmModal.status === 'approved' ? 'Approve' : 'Reject';

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.label}
            style={[styles.filterChip, filter === f.value && styles.filterActive]}
            onPress={() => {
              setLoading(true);
              setFilter(f.value);
            }}
          >
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <EmptyState title="Loading..." loading />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <BookingCard booking={item} showCustomer onAction={(status) => handleAction(item, status)} />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadData();
              }}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="No bookings"
              message={filter ? `No ${filter} bookings.` : 'No bookings found.'}
            />
          }
        />
      )}

      <AppModal
        visible={confirmModal.visible}
        title={`${actionLabel} Booking?`}
        message={
          confirmModal.booking
            ? `Are you sure you want to ${actionLabel.toLowerCase()} ${confirmModal.booking.customer_name}'s booking for ${confirmModal.booking.brand} ${confirmModal.booking.model}?`
            : ''
        }
        type="confirm"
        confirmText={actionLabel}
        cancelText="Cancel"
        onConfirm={confirmAction}
        onCancel={() => setConfirmModal({ visible: false, booking: null, status: '' })}
      />

      <AppModal
        visible={feedbackModal.visible}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
        onConfirm={() => setFeedbackModal((m) => ({ ...m, visible: false }))}
        onCancel={() => setFeedbackModal((m) => ({ ...m, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filterRow: { flexDirection: 'row', padding: 12, gap: 8, flexWrap: 'wrap' },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterActive: { backgroundColor: COLORS.admin, borderColor: COLORS.admin },
  filterText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  filterTextActive: { color: '#fff' },
  list: { padding: 16, flexGrow: 1 },
});
