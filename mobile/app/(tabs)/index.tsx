import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { motorcycleService } from '@/services/motorcycleService';
import { Motorcycle } from '@/types';
import MotorcycleCard from '@/components/MotorcycleCard';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import { COLORS } from '@/constants/theme';

export default function HomeScreen() {
  const { isAuthenticated, user } = useAuth();
  const [featured, setFeatured] = useState<Motorcycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await motorcycleService.getFeatured();
      if (res.success && res.data) setFeatured(res.data);
    } catch {
      // silently fail for guest browsing
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[COLORS.primary]} />}
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Ride Your{'\n'}Adventure</Text>
        <Text style={styles.heroSubtitle}>
          Premium motorcycle rentals at affordable daily rates
        </Text>
        {!isAuthenticated ? (
          <View style={styles.heroActions}>
            <Button title="Sign In" onPress={() => router.push('/(auth)/login')} style={styles.heroBtn} />
            <Button title="Register" variant="outline" onPress={() => router.push('/(auth)/register')} style={styles.heroBtnOutline} textStyle={{ color: '#fff' }} />
          </View>
        ) : (
          <Text style={styles.welcome}>Hello, {user?.full_name?.split(' ')[0]}! 👋</Text>
        )}
      </View>

      <View style={styles.quickActions}>
        {[
          { icon: 'bicycle' as const, label: 'Browse', route: '/(tabs)/motorcycles' },
          { icon: 'chatbubbles' as const, label: 'AI Help', route: '/(tabs)/assistant' },
          { icon: 'calendar' as const, label: 'Bookings', route: '/(tabs)/bookings' },
        ].map((item) => (
          <TouchableOpacity key={item.label} style={styles.quickItem} onPress={() => router.push(item.route as never)}>
            <View style={styles.quickIcon}>
              <Ionicons name={item.icon} size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.quickLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Motorcycles</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/motorcycles')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <EmptyState title="Loading..." loading />
        ) : featured.length === 0 ? (
          <EmptyState icon="bicycle-outline" title="No motorcycles available" message="Check back soon for new listings." />
        ) : (
          <FlatList
            data={featured}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <MotorcycleCard
                  motorcycle={item}
                  onPress={() => router.push(`/motorcycle/${item.id}`)}
                />
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      <View style={styles.promo}>
        <Ionicons name="sparkles" size={28} color={COLORS.primary} />
        <View style={styles.promoText}>
          <Text style={styles.promoTitle}>Need help choosing?</Text>
          <Text style={styles.promoDesc}>Ask our AI assistant for personalized recommendations</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/assistant')}>
          <Ionicons name="arrow-forward-circle" size={32} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hero: {
    backgroundColor: COLORS.gradientStart,
    padding: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTitle: { fontSize: 32, fontWeight: '900', color: '#fff', lineHeight: 38 },
  heroSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.75)', marginTop: 8, lineHeight: 22 },
  heroActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  heroBtn: { flex: 1 },
  heroBtnOutline: { flex: 1, borderColor: '#fff' },
  welcome: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 16, fontWeight: '600' },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', padding: 20, marginTop: -20 },
  quickItem: { alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, width: '30%', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  quickIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary + '12', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickLabel: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  section: { padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  seeAll: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  cardWrapper: { width: 220, marginRight: 12 },
  listContent: { paddingRight: 16 },
  promo: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, margin: 16, padding: 16, borderRadius: 16, gap: 12, borderWidth: 1, borderColor: COLORS.border },
  promoText: { flex: 1 },
  promoTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  promoDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
