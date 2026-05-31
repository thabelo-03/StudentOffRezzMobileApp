import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import api from '../services/api';

const SystemConfigsScreen = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await api.get('/admin/config');
      setConfig({
        ...data,
        monetization: data.monetization || {},
        gateways: data.gateways || {},
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  // nested setter: path like 'monetization.rentalCommission.percent'
  const setPath = (path, val) => setConfig(c => {
    const next = JSON.parse(JSON.stringify(c));
    const keys = path.split('.');
    let o = next;
    for (let i = 0; i < keys.length - 1; i++) { o[keys[i]] = o[keys[i]] || {}; o = o[keys[i]]; }
    o[keys[keys.length - 1]] = val;
    return next;
  });
  const get = (path, dflt) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), config) ?? dflt;

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data } = await api.put('/admin/config', config);
      setConfig({ ...data, monetization: data.monetization || {}, gateways: data.gateways || {} });
      Alert.alert('Success', 'Configuration updated');
    } catch (e) {
      Alert.alert('Error', 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) return <ActivityIndicator size="large" color="#2563eb" style={styles.centered} />;

  const Toggle = ({ label, hint, path }) => (
    <View style={styles.rowWrap}>
      <View style={styles.settingRow}>
        <Text style={styles.label}>{label}</Text>
        <Switch value={!!get(path)} onValueChange={(v) => setPath(path, v)} trackColor={{ true: '#93c5fd' }} thumbColor={get(path) ? '#2563eb' : '#f4f4f5'} />
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
  const Field = ({ label, path, numeric, secret, placeholder }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={String(get(path, '') ?? '')}
        onChangeText={(t) => setPath(path, numeric ? (Number(t) || 0) : t)}
        keyboardType={numeric ? 'numeric' : 'default'}
        placeholder={placeholder}
        autoCapitalize="none"
        secureTextEntry={false}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
      <Text style={styles.title}>System Configuration</Text>

      <Text style={styles.section}>General</Text>
      <View style={styles.card}>
        <Field label="Support Email" path="supportEmail" placeholder="support@thabstay.com" />
      </View>

      <Text style={styles.section}>Platform Switches</Text>
      <View style={styles.card}>
        <Toggle label="Maintenance Mode" hint="Blocks everyone except admins from logging in." path="maintenanceMode" />
        <Toggle label="Allow Registrations" hint="Turn off to stop new sign-ups." path="allowRegistrations" />
        <Toggle label="Require Listing Approval" hint="Hide new listings until an admin approves them." path="requireListingApproval" />
        <Toggle label="Hide Contact Until Booked" hint="Hide landlord phone until a booking exists (reduces leakage)." path="monetization.hideContactUntilBooked" />
      </View>

      <Text style={styles.section}>Monetization</Text>
      <View style={styles.card}>
        <Text style={styles.subhead}>Student Subscription</Text>
        <Toggle label="Enabled" path="monetization.studentSubscription.enabled" />
        <Field label="Monthly Price ($)" path="monetization.studentSubscription.monthlyPrice" numeric />

        <View style={styles.sep} />
        <Text style={styles.subhead}>Rental Commission</Text>
        <Toggle label="Enabled" path="monetization.rentalCommission.enabled" />
        <Field label="Commission (% of payment)" path="monetization.rentalCommission.percent" numeric />

        <View style={styles.sep} />
        <Text style={styles.subhead}>Landlord Premium</Text>
        <Toggle label="Enabled" path="monetization.landlordPremium.enabled" />
        <Field label="Monthly Price ($)" path="monetization.landlordPremium.monthlyPrice" numeric />
        <Field label="Free Listing Limit" path="monetization.landlordPremium.freeListingLimit" numeric />
        <Field label="Premium Listing Limit (0 = unlimited)" path="monetization.landlordPremium.premiumListingLimit" numeric />
      </View>

      <Text style={styles.section}>Payment Gateways</Text>
      {[
        { key: 'paynow', label: 'Paynow', creds: [['integrationId', 'Integration ID'], ['integrationKey', 'Integration Key']] },
        { key: 'ecocash', label: 'EcoCash', creds: [['merchantCode', 'Merchant Code'], ['apiKey', 'API Key'], ['apiSecret', 'API Secret']] },
        { key: 'smilepay', label: 'ZB SmilePay', creds: [['merchantId', 'Merchant ID'], ['apiKey', 'API Key'], ['apiSecret', 'API Secret']] },
      ].map(gw => (
        <View style={styles.card} key={gw.key}>
          <Toggle label={gw.label} path={`gateways.${gw.key}.enabled`} />
          {gw.creds.map(([f, lbl]) => (
            <Field key={f} label={lbl} path={`gateways.${gw.key}.${f}`} placeholder={lbl} />
          ))}
        </View>
      ))}

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
  section: { fontSize: 13, fontWeight: '700', color: '#718096', textTransform: 'uppercase', marginTop: 16, marginBottom: 8 },
  subhead: { fontSize: 14, fontWeight: '700', color: '#2563eb', marginBottom: 4 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 1, marginBottom: 10 },
  rowWrap: { marginBottom: 4 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  label: { fontSize: 15, fontWeight: '600', color: '#2D3748' },
  hint: { fontSize: 12, color: '#94a3b8', marginBottom: 6 },
  inputGroup: { marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, marginTop: 6, fontSize: 15, backgroundColor: '#F8FAFC' },
  sep: { height: 1, backgroundColor: '#EDF2F7', marginVertical: 12 },
  saveBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default SystemConfigsScreen;
