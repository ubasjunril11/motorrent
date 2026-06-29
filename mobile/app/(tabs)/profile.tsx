import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import Input from '@/components/Input';
import Button from '@/components/Button';
import AppModal from '@/components/AppModal';
import { COLORS } from '@/constants/theme';

export default function ProfileScreen() {
  const { user, isAuthenticated, logout, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({ visible: false, title: '', message: '', type: 'success' });

  const handleSave = async () => {
    setLoading(true);
    try {
      await authService.updateProfile({ full_name: fullName, phone });
      await refreshProfile();
      setEditing(false);
      setFeedbackModal({
        visible: true,
        title: 'Profile Updated',
        message: 'Your profile has been saved successfully.',
        type: 'success',
      });
    } catch {
      setFeedbackModal({
        visible: true,
        title: 'Update Failed',
        message: 'Could not update your profile. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      await logout();
      router.replace('/(tabs)');
    } catch {
      setFeedbackModal({
        visible: true,
        title: 'Sign Out Failed',
        message: 'Could not sign out. Please try again.',
        type: 'error',
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.guest}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={48} color={COLORS.textLight} />
        </View>
        <Text style={styles.guestTitle}>Guest User</Text>
        <Text style={styles.guestDesc}>Sign in to manage your profile and bookings</Text>
        <Button title="Sign In" onPress={() => router.push('/(auth)/login')} style={styles.btn} />
        <Button title="Create Account" variant="outline" onPress={() => router.push('/(auth)/register')} style={styles.btn} />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.full_name?.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user?.full_name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role}</Text>
          </View>
        </View>

        {editing ? (
          <View style={styles.form}>
            <Input label="Full Name" value={fullName} onChangeText={setFullName} />
            <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Button title="Save Changes" onPress={handleSave} loading={loading} />
            <Button title="Cancel" variant="ghost" onPress={() => setEditing(false)} />
          </View>
        ) : (
          <View style={styles.info}>
            <InfoRow icon="person-outline" label="Full Name" value={user?.full_name || '-'} />
            <InfoRow icon="mail-outline" label="Email" value={user?.email || '-'} />
            <InfoRow icon="call-outline" label="Phone" value={user?.phone || 'Not set'} />
            <Button
              title="Edit Profile"
              variant="outline"
              onPress={() => {
                setFullName(user?.full_name || '');
                setPhone(user?.phone || '');
                setEditing(true);
              }}
              style={styles.btn}
            />
          </View>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={() => setShowLogoutConfirm(true)}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <AppModal
        visible={showLogoutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        type="confirm"
        confirmText="Sign Out"
        cancelText="Cancel"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      <AppModal
        visible={feedbackModal.visible}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
        onConfirm={() => setFeedbackModal((m) => ({ ...m, visible: false }))}
        onCancel={() => setFeedbackModal((m) => ({ ...m, visible: false }))}
      />
    </>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={20} color={COLORS.textSecondary} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 20, padding: 24, marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  email: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  roleBadge: { backgroundColor: COLORS.primary + '15', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  roleText: { fontSize: 12, fontWeight: '700', color: COLORS.primary, textTransform: 'capitalize' },
  form: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 16 },
  info: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: COLORS.textSecondary },
  infoValue: { fontSize: 16, color: COLORS.text, fontWeight: '500', marginTop: 2 },
  btn: { marginTop: 12 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, backgroundColor: COLORS.error + '10', borderRadius: 12 },
  logoutText: { fontSize: 16, fontWeight: '600', color: COLORS.error },
  guest: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: COLORS.background },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  guestTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  guestDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 24 },
});
