import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import api from '../services/api';

const SystemConfigsScreen = () => {
  const [config, setConfig] = useState({ maintenanceMode: false, supportEmail: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await api.get('/admin/config');
      setConfig(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/admin/config', config);
      Alert.alert('Success', 'Configuration updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to save configurations');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#007BFF" style={styles.centered} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>System Configurations</Text>
      
      <View style={styles.settingRow}>
        <Text style={styles.label}>Maintenance Mode</Text>
        <Switch 
          value={config.maintenanceMode} 
          onValueChange={(val) => setConfig({ ...config, maintenanceMode: val })} 
        />
      </View>
      <Text style={styles.hint}>Enable to prevent users from logging in during updates.</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Support Email</Text>
        <TextInput 
          style={styles.input} 
          value={config.supportEmail} 
          onChangeText={(text) => setConfig({ ...config, supportEmail: text })}
          placeholder="support@example.com"
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Changes</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  centered: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, color: '#333' },
  
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  label: { fontSize: 16, fontWeight: '600', color: '#333' },
  hint: { fontSize: 12, color: '#888', marginBottom: 25 },
  
  inputGroup: { marginBottom: 30 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginTop: 10, fontSize: 16 },
  
  saveBtn: { backgroundColor: '#007BFF', padding: 15, borderRadius: 10, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default SystemConfigsScreen;
