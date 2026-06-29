import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TextInput, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { motorcycleService } from '@/services/motorcycleService';
import { Motorcycle } from '@/types';
import MotorcycleCard from '@/components/MotorcycleCard';
import EmptyState from '@/components/EmptyState';
import { COLORS } from '@/constants/theme';

export default function MotorcyclesScreen() {
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (query?: string) => {
    try {
      const params: Record<string, string> = {};
      if (query) params.search = query;
      const res = await motorcycleService.getAll(params);
      if (res.success && res.data) setMotorcycles(res.data);
    } catch {
      setMotorcycles([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = (text: string) => {
    setSearch(text);
    loadData(text);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={COLORS.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search brand, model..."
          placeholderTextColor={COLORS.textLight}
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <EmptyState title="Loading motorcycles..." loading />
      ) : (
        <FlatList
          data={motorcycles}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <MotorcycleCard
              motorcycle={item}
              compact
              onPress={() => router.push(`/motorcycle/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(search); }} colors={[COLORS.primary]} />}
          ListEmptyComponent={<EmptyState icon="bicycle-outline" title="No motorcycles found" message="Try adjusting your search." />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: COLORS.text },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  row: { justifyContent: 'space-between' },
});
