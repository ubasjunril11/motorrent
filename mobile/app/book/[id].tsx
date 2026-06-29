import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { motorcycleService } from '@/services/motorcycleService';
import { bookingService } from '@/services/bookingService';
import { Motorcycle } from '@/types';
import Input from '@/components/Input';
import Button from '@/components/Button';
import AppModal from '@/components/AppModal';
import LoadingScreen from '@/components/LoadingScreen';
import { COLORS } from '@/constants/theme';

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [motorcycle, setMotorcycle] = useState<Motorcycle | null>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [modal, setModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
    goToBookings: boolean;
  }>({ visible: false, title: '', message: '', type: 'success', goToBookings: false });

  useEffect(() => {
    motorcycleService
      .getById(Number(id))
      .then((res) => {
        if (res.success && res.data) setMotorcycle(res.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000));
  const total = motorcycle ? days * Number(motorcycle.daily_rate) : 0;

  const handleSubmit = async () => {
    if (endDate <= startDate) {
      setModal({
        visible: true,
        title: 'Invalid Dates',
        message: 'End date must be after start date.',
        type: 'error',
        goToBookings: false,
      });
      return;
    }

    setSubmitting(true);
    try {
      await bookingService.create({
        motorcycle_id: Number(id),
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
        notes: notes.trim() || undefined,
      });
      setModal({
        visible: true,
        title: 'Booking Submitted!',
        message: `Your rental request for ${motorcycle?.brand} ${motorcycle?.model} has been submitted and is pending admin approval.`,
        type: 'success',
        goToBookings: true,
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Booking failed. Please try again.';
      setModal({
        visible: true,
        title: 'Booking Failed',
        message: msg,
        type: 'error',
        goToBookings: false,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!motorcycle)
    return (
      <View style={styles.error}>
        <Text>Not found</Text>
      </View>
    );

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.summary}>
          <Text style={styles.bikeName}>
            {motorcycle.brand} {motorcycle.model}
          </Text>
          <Text style={styles.rate}>₱{Number(motorcycle.daily_rate).toFixed(0)}/day</Text>
        </View>

        <Text style={styles.label}>Start Date</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartPicker(true)}>
          <Text style={styles.dateText}>{startDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            minimumDate={new Date()}
            onChange={(_e, date) => {
              setShowStartPicker(Platform.OS === 'ios');
              if (date) setStartDate(date);
            }}
          />
        )}

        <Text style={styles.label}>End Date</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEndPicker(true)}>
          <Text style={styles.dateText}>{endDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            minimumDate={startDate}
            onChange={(_e, date) => {
              setShowEndPicker(Platform.OS === 'ios');
              if (date) setEndDate(date);
            }}
          />
        )}

        <Input
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Special requests..."
          multiline
          numberOfLines={3}
          style={{ height: 80, textAlignVertical: 'top' }}
        />

        <View style={styles.totalBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Duration</Text>
            <Text style={styles.totalValue}>
              {days} day{days > 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Daily Rate</Text>
            <Text style={styles.totalValue}>₱{Number(motorcycle.daily_rate).toFixed(0)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={styles.grandValue}>₱{total.toFixed(2)}</Text>
          </View>
        </View>

        <Button title="Submit Booking Request" onPress={handleSubmit} loading={submitting} />
      </ScrollView>

      <AppModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        confirmText={modal.goToBookings ? 'View Bookings' : 'OK'}
        onConfirm={() => {
          setModal((m) => ({ ...m, visible: false }));
          if (modal.goToBookings) router.replace('/(tabs)/bookings');
        }}
        onCancel={() => setModal((m) => ({ ...m, visible: false }))}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  error: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summary: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bikeName: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  rate: { fontSize: 16, color: COLORS.primary, fontWeight: '700', marginTop: 4 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  dateBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  dateText: { fontSize: 16, color: COLORS.text },
  totalBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  totalLabel: { fontSize: 14, color: COLORS.textSecondary },
  totalValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  grandTotal: { borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 8, paddingTop: 12 },
  grandLabel: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  grandValue: { fontSize: 22, fontWeight: '900', color: COLORS.primary },
});
