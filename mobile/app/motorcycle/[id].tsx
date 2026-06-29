import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { motorcycleService } from '@/services/motorcycleService';
import { Motorcycle } from '@/types';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import LoadingScreen from '@/components/LoadingScreen';
import { useAuth } from '@/context/AuthContext';
import { COLORS, UPLOAD_BASE_URL } from '@/constants/theme';

export default function MotorcycleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [motorcycle, setMotorcycle] = useState<Motorcycle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    motorcycleService.getById(Number(id)).then((res) => {
      if (res.success && res.data) setMotorcycle(res.data);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleBook = () => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in or register to book this motorcycle.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    router.push(`/book/${id}`);
  };

  if (loading) return <LoadingScreen />;
  if (!motorcycle) return <View style={styles.error}><Text>Motorcycle not found</Text></View>;

  const imageUri = motorcycle.image_url ? `${UPLOAD_BASE_URL}${motorcycle.image_url}` : null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="bicycle" size={80} color={COLORS.textLight} />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>{motorcycle.brand}</Text>
            <Text style={styles.model}>{motorcycle.model}</Text>
          </View>
          <Badge label={motorcycle.status} />
        </View>

        <Text style={styles.price}>₱{Number(motorcycle.daily_rate).toFixed(0)}<Text style={styles.perDay}>/day</Text></Text>

        <View style={styles.specs}>
          {[
            { icon: 'calendar-outline' as const, label: 'Year', value: motorcycle.year },
            { icon: 'people-outline' as const, label: 'Capacity', value: `${motorcycle.capacity} pax` },
            { icon: 'speedometer-outline' as const, label: 'Engine', value: motorcycle.engine_cc ? `${motorcycle.engine_cc}cc` : 'N/A' },
            { icon: 'water-outline' as const, label: 'Fuel', value: motorcycle.fuel_type },
          ].map((spec) => (
            <View key={spec.label} style={styles.specItem}>
              <Ionicons name={spec.icon} size={22} color={COLORS.primary} />
              <Text style={styles.specLabel}>{spec.label}</Text>
              <Text style={styles.specValue}>{spec.value}</Text>
            </View>
          ))}
        </View>

        {motorcycle.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{motorcycle.description}</Text>
          </View>
        )}

        <Button
          title={motorcycle.status === 'available' ? 'Book Now' : 'Not Available'}
          onPress={handleBook}
          disabled={motorcycle.status !== 'available'}
          style={styles.bookBtn}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  error: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imageContainer: { height: 260, backgroundColor: '#eef0f5' },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, marginTop: -20, backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brand: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'uppercase' },
  model: { fontSize: 26, fontWeight: '900', color: COLORS.text },
  price: { fontSize: 28, fontWeight: '900', color: COLORS.primary, marginTop: 12 },
  perDay: { fontSize: 14, fontWeight: '400', color: COLORS.textSecondary },
  specs: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 20, gap: 8 },
  specItem: { width: '48%', backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  specLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 6 },
  specValue: { fontSize: 15, fontWeight: '700', color: COLORS.text, textTransform: 'capitalize' },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  description: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 24 },
  bookBtn: { marginTop: 32, marginBottom: 40 },
});
