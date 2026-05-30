import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import api from '../services/api';

const MODES = [
  { key: 'off', label: 'Off' },
  { key: 'commission', label: 'Commission' },
  { key: 'subscription', label: 'Subscription' },
  { key: 'listing_fee', label: 'Listing Fee' },
];

const SystemConfigsScreen = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await api.get('/admin/config');
      setConfig({ ...data, monetization: data.monetization || {} });
    } catch (error) {
      Alert.alert('Error', 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const set = (key, val) => setConfig(c => ({ ...c, [key]: val }));
  const setMon = (key, val) => setConfig(c => ({ ...c, monetization: { ...c.monetization, [key]: val } }));

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data } = await api.put('/admin/config', config);
      setConfig({ ...data, monetization: data.monetization || {} });
      Alert.alert('Success', 'Configuration updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) return <ActivityIndicator size="large" color="#2563eb" style={styles.centered} />;
  const mon = config.monetization || {};

  const Row = ({ label, hint, value, onValueChange }) => (
    <View style={styles.rowWrap}>
      <View style={styles.settingRow}>
        <Text style={styles.label}>{label}</Text>
        <Switch value={!!value} onValueChange={onValueChange} trackColor={{ true: '#93c5fd' }} thumbColor={value ? '#2563eb' : '#f4f4f5'} />
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );

  const NumField = ({ label, suffix, value, onChangeText }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}{suffix ? ` (${suffix})` : ''}</Text>
      <TextInput style={styles.input} value={String(value ?? '')} onChangeText={onChangeText} keyboardType="numeric" />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <Text style={styles.title}>System Configuration</Text>

      <Text style={styles.section}>General</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Support Email</Text>
        <TextInput style={styles.input} value={config.supportEmail} onChangeText={(t) => set('supportEmail', t)} placeholder="support@thabstay.com" autoCapitalize="none" />
      </View>

      <Text style={styles.section}>Platform Switches</Text>
      <View style={styles.card}>
        <Row label="Maintenance Mode" hint="Blocks everyone except admins from logging in." value={config.maintenanceMode} onValueChange={(v) => set('maintenanceMode', v)} />
        <Row label="Allow Registrations" hint="Turn off to stop new sign-ups." value={config.allowRegistrations} onValueChange={(v) => set('allowRegistrations', v)} />
        <Row label="Require Listing Approval" hint="Hide new listings from students until an admin approves them." value={config.requireListingApproval} onValueChange={(v) => set('requireListingApproval', v)} />
      </View>

      <Text style={styles.section}>Monetization</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Model</Text>
        <View style={styles.modeRow}>
          {MODES.map(m => (
            <TouchableOpacity key={m.key} style={[styles.modeBtn, mon.mode === m.key && styles.modeBtnActive]} onPress={() => setMon('mode', m.key)}>
              <Text style={[styles.modeText, mon.mode === m.key && styles.modeTextActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <NumField label="Commission" suffix="% of deposit" value={mon.commissionPercent} onChangeText={(t) => setMon('commissionPercent', Number(t) || 0)} />
        <NumField label="Deposit" suffix="% of monthly price" value={mon.depositPercent} onChangeText={(t) => setMon('depositPercent', Number(t) || 0)} />
        <NumField label="Free Listing View Limit" suffix="0 = unlimited" value={mon.freeListingViewLimit} onChangeText={(t) => setMon('freeListingViewLimit', Number(t) || 0)} />

        <Row label="Require Deposit to Book" hint="Students must pay a deposit to confirm a booking." value={mon.requireDepositToBook} onValueChange={(v) => setMon('requireDepositToBook', v)} />
        <Row label="Hide Contact Until Booked" hint="Hide landlord phone/chat until a deposit is paid (reduces off-platform leakage)." value={mon.hideContactUntilBooked} onValueChange={(v) => setMon('hideContactUntilBooked', v)} />

        {mon.mode === 'subscription' && (
          <>
            <NumField label="Pro Price Monthly" suffix="$" value={mon.proPriceMonthly} onChangeText={(t) => setMon('proPriceMonthly', Number(t) || 0)} />
            <NumField label="Pro Price One-Time" suffix="$" value={mon.proPriceOneTime} onChangeText={(t) => setMon('proPriceOneTime', Number(t) || 0)} />
          </>
        )}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Configuration</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  centered: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 12, color: '#1a365d' },
  section: { fontSize: 13, fontWeight: '700', color: '#718096', textTransform: 'uppercase', marginTop: 14, marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 1 },
  rowWrap: { marginBottom: 6 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  label: { fontSize: 15, fontWeight: '600', color: '#2D3748' },
  hint: { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
  inputGroup: { marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, marginTop: 6, fontSize: 16, backgroundColor: '#F8FAFC' },
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 4 },
  modeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EDF2F7' },
  modeBtnActive: { backgroundColor: '#2563eb' },
  modeText: { color: '#4A5568', fontWeight: '600' },
  modeTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default SystemConfigsScreen;
