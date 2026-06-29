import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { bookingService } from '@/services/bookingService';
import { Booking } from '@/types';
import BookingCard from '@/components/BookingCard';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/Button';
import { COLORS } from '@/constants/theme';

export default function BookingsScreen() {
  const { isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBookings = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const res = await bookingService.getMyBookings();
      if (res.success && res.data) setBookings(res.data);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(useCallback(() => { loadBookings(); }, [loadBookings]));

  const handleCancel = (booking: Booking) => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await bookingService.cancel(booking.id);
            loadBookings();
          } catch {
            Alert.alert('Error', 'Failed to cancel booking.');
          }
        },
      },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.guest}>
        <EmptyState
          icon="lock-closed-outline"
          title="Sign in required"
          message="Please sign in or register to view and manage your bookings."
        />
        <Button title="Sign In" onPress={() => router.push('/(auth)/login')} style={styles.guestBtn} />
        <Button title="Create Account" variant="outline" onPress={() => router.push('/(auth)/register')} style={styles.guestBtn} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <EmptyState title="Loading bookings..." loading />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onPress={() => {
                if (['pending', 'approved'].includes(item.status)) handleCancel(item);
              }}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadBookings(); }} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="No bookings yet"
              message="Browse motorcycles and make your first rental booking!"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16, flexGrow: 1 },
  guest: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', padding: 24 },
  guestBtn: { marginTop: 12 },
});
