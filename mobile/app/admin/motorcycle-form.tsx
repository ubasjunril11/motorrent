import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { motorcycleService } from '@/services/motorcycleService';
import Input from '@/components/Input';
import Button from '@/components/Button';
import AppModal from '@/components/AppModal';
import LoadingScreen from '@/components/LoadingScreen';
import { COLORS, UPLOAD_BASE_URL } from '@/constants/theme';
import { appendImageToFormData, isRemoteImageUri } from '@/utils/formData';

export default function MotorcycleFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [description, setDescription] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [capacity, setCapacity] = useState('2');
  const [engineCc, setEngineCc] = useState('');
  const [fuelType, setFuelType] = useState('petrol');
  const [status, setStatus] = useState('available');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [newImagePicked, setNewImagePicked] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
    goBack: boolean;
  }>({ visible: false, title: '', message: '', type: 'success', goBack: false });

  useEffect(() => {
    if (isEdit) {
      motorcycleService.getById(Number(id)).then((res) => {
        if (res.success && res.data) {
          const m = res.data;
          setBrand(m.brand);
          setModel(m.model);
          setYear(String(m.year));
          setDescription(m.description || '');
          setDailyRate(String(m.daily_rate));
          setCapacity(String(m.capacity));
          setEngineCc(m.engine_cc ? String(m.engine_cc) : '');
          setFuelType(m.fuel_type);
          setStatus(m.status);
          if (m.image_url) setImageUri(`${UPLOAD_BASE_URL}${m.image_url}`);
        }
      }).finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setNewImagePicked(true);
    }
  };

  const handleSubmit = async () => {
    if (!brand || !model || !dailyRate) {
      setModal({
        visible: true,
        title: 'Missing Information',
        message: 'Brand, model, and daily rate are required.',
        type: 'error',
        goBack: false,
      });
      return;
    }

    const formData = new FormData();
    formData.append('brand', brand);
    formData.append('model', model);
    formData.append('year', year);
    formData.append('description', description);
    formData.append('daily_rate', dailyRate);
    formData.append('capacity', capacity);
    formData.append('engine_cc', engineCc);
    formData.append('fuel_type', fuelType);
    formData.append('status', status);

    if (imageUri && (!isEdit || newImagePicked) && !isRemoteImageUri(imageUri)) {
      await appendImageToFormData(formData, imageUri);
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await motorcycleService.update(Number(id), formData);
        setModal({
          visible: true,
          title: 'Motorcycle Updated!',
          message: `${brand} ${model} has been updated successfully.${newImagePicked ? ' New photo saved.' : ''}`,
          type: 'success',
          goBack: true,
        });
      } else {
        await motorcycleService.create(formData);
        setModal({
          visible: true,
          title: 'Motorcycle Added!',
          message: `${brand} ${model} has been added to the fleet successfully.`,
          type: 'success',
          goBack: true,
        });
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setModal({
        visible: true,
        title: 'Save Failed',
        message: msg || 'Failed to save motorcycle. Please try again.',
        type: 'error',
        goBack: false,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.preview} />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="camera" size={40} color={COLORS.textLight} />
              <Text style={styles.placeholderText}>Tap to add photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <Input label="Brand" value={brand} onChangeText={setBrand} placeholder="Honda" />
        <Input label="Model" value={model} onChangeText={setModel} placeholder="PCX 160" />
        <Input label="Year" value={year} onChangeText={setYear} keyboardType="numeric" />
        <Input label="Daily Rate (₱)" value={dailyRate} onChangeText={setDailyRate} keyboardType="numeric" />
        <Input label="Passenger Capacity" value={capacity} onChangeText={setCapacity} keyboardType="numeric" />
        <Input label="Engine CC" value={engineCc} onChangeText={setEngineCc} keyboardType="numeric" />
        <Input label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={3} style={{ height: 80, textAlignVertical: 'top' }} />

        <Text style={styles.label}>Fuel Type</Text>
        <View style={styles.chipRow}>
          {['petrol', 'electric', 'hybrid'].map((f) => (
            <TouchableOpacity key={f} style={[styles.chip, fuelType === f && styles.chipActive]} onPress={() => setFuelType(f)}>
              <Text style={[styles.chipText, fuelType === f && styles.chipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Status</Text>
        <View style={styles.chipRow}>
          {['available', 'rented', 'maintenance'].map((s) => (
            <TouchableOpacity key={s} style={[styles.chip, status === s && styles.chipActive]} onPress={() => setStatus(s)}>
              <Text style={[styles.chipText, status === s && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button title={isEdit ? 'Update Motorcycle' : 'Add Motorcycle'} onPress={handleSubmit} loading={submitting} style={styles.submit} />
      </ScrollView>

      <AppModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        confirmText="OK"
        onConfirm={() => {
          setModal((m) => ({ ...m, visible: false }));
          if (modal.goBack) router.replace('/(admin)/motorcycles');
        }}
        onCancel={() => setModal((m) => ({ ...m, visible: false }))}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  imagePicker: { height: 180, borderRadius: 16, overflow: 'hidden', marginBottom: 20, backgroundColor: '#eef0f5' },
  preview: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: COLORS.textLight, marginTop: 8 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.admin, borderColor: COLORS.admin },
  chipText: { fontSize: 13, color: COLORS.textSecondary, textTransform: 'capitalize' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  submit: { marginTop: 8 },
});
