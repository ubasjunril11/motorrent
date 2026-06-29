import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Motorcycle } from '@/types';
import { COLORS, UPLOAD_BASE_URL } from '@/constants/theme';
import Badge from './Badge';

interface MotorcycleCardProps {
  motorcycle: Motorcycle;
  onPress: () => void;
  compact?: boolean;
}

export default function MotorcycleCard({ motorcycle, onPress, compact }: MotorcycleCardProps) {
  const imageUri = motorcycle.image_url
    ? `${UPLOAD_BASE_URL}${motorcycle.image_url}`
    : undefined;

  return (
    <TouchableOpacity style={[styles.card, compact && styles.compact]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="bicycle" size={40} color={COLORS.textLight} />
          </View>
        )}
        <View style={styles.badgeOverlay}>
          <Badge label={motorcycle.status} />
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.brand}>{motorcycle.brand}</Text>
        <Text style={styles.model} numberOfLines={1}>{motorcycle.model}</Text>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{motorcycle.year}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{motorcycle.capacity}</Text>
          </View>
        </View>
        <Text style={styles.price}>₱{Number(motorcycle.daily_rate).toFixed(0)}<Text style={styles.perDay}>/day</Text></Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    flex: 1,
    marginHorizontal: 4,
  },
  compact: { maxWidth: '48%' },
  imageContainer: { height: 140, backgroundColor: COLORS.background },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef0f5' },
  badgeOverlay: { position: 'absolute', top: 8, right: 8 },
  content: { padding: 12 },
  brand: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500', textTransform: 'uppercase' },
  model: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  meta: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: COLORS.textSecondary },
  price: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  perDay: { fontSize: 12, fontWeight: '400', color: COLORS.textSecondary },
});
