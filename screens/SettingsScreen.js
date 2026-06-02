import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const SettingsScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Prefer fresh data from the backend; fall back to the stored payload.
        let u;
        try { u = (await api.get('/users/me')).data; }
        catch (_) { const s = await AsyncStorage.getItem('user'); u = s ? JSON.parse(s) : null; }
        setUser(u);
        setName(u?.name || '');
        setPhoneNumber(u?.phoneNumber || '');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Required', 'Name cannot be empty.');
    setSaving(true);
    try {
      const { data } = await api.put('/users/me', { name: name.trim(), phoneNumber: phoneNumber.trim() });
      // Keep the locally-stored user in sync (used across the app).
      const stored = await AsyncStorage.getItem('user');
      const merged = { ...(stored ? JSON.parse(stored) : {}), name: data.name, phoneNumber: data.phoneNumber };
      await AsyncStorage.setItem('user', JSON.stringify(merged));
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  if (loading) return <ActivityIndicator size="large" color="#2563eb" style={{ flex: 1 }} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.section}>Account</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" placeholder="e.g. 0771234567" />

        <Text style={styles.label}>Email</Text>
        <Text style={styles.readonly}>{user?.email || '—'}</Text>

        <Text style={styles.label}>Role</Text>
        <Text style={styles.readonly}>{user?.role || '—'}</Text>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Changes</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.section}>More</Text>
      <View style={styles.card}>
        {(user?.role === 'student' || user?.role === 'landlord') && (
          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Billing')}>
            <Icon name={user?.role === 'landlord' ? 'crown-outline' : 'star-outline'} size={22} color="#2563eb" />
            <Text style={styles.linkText}>{user?.role === 'landlord' ? 'Go Premium' : 'Subscription'}</Text>
            <Icon name="chevron-right" size={22} color="#A0AEC0" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('TermsAndConditions')}>
          <Icon name="file-document-outline" size={22} color="#2563eb" />
          <Text style={styles.linkText}>Terms & Conditions</Text>
          <Icon name="chevron-right" size={22} color="#A0AEC0" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Help')}>
          <Icon name="help-circle-outline" size={22} color="#2563eb" />
          <Text style={styles.linkText}>Help & Support</Text>
          <Icon name="chevron-right" size={22} color="#A0AEC0" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signOut} onPress={handleSignOut}>
        <Icon name="logout" size={20} color="#E53E3E" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  title: { fontSize: 26, fontWeight: '800', color: '#1a365d', marginBottom: 16 },
  section: { fontSize: 13, fontWeight: '700', color: '#718096', textTransform: 'uppercase', marginBottom: 8, marginTop: 8 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 20, elevation: 1 },
  label: { fontSize: 13, fontWeight: '600', color: '#4A5568', marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 16, color: '#2D3748' },
  readonly: { fontSize: 16, color: '#718096', paddingVertical: 4 },
  saveBtn: { backgroundColor: '#2563eb', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 18 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
  linkText: { flex: 1, fontSize: 16, color: '#2D3748' },
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#FED7D7', backgroundColor: '#FFF5F5' },
  signOutText: { color: '#E53E3E', fontWeight: '700', fontSize: 16 },
});

export default SettingsScreen;
