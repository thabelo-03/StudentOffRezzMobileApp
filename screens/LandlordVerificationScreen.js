import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const LandlordVerificationScreen = ({ navigation, route }) => {
  const { user } = route.params || {};

  const [nationalIdNumber, setNationalIdNumber] = useState('');
  const [idDoc, setIdDoc] = useState(null);        // { uri, name, type }
  const [proofDoc, setProofDoc] = useState(null);  // { uri, name, type }
  const [loading, setLoading] = useState(false);

  const pickDoc = async (setter, label) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed', 'Please allow photo access.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'Images', quality: 0.6 });
    if (!result.canceled && result.assets?.[0]) {
      const uri = result.assets[0].uri;
      const ext = uri.split('.').pop().split('?')[0] || 'jpg';
      setter({ uri, name: `${label}-${Date.now()}.${ext}`, type: `image/${ext === 'png' ? 'png' : 'jpeg'}` });
    }
  };

  const handleSubmit = async () => {
    if (!nationalIdNumber.trim() || !idDoc || !proofDoc) {
      Alert.alert('Missing Info', 'Please enter your National ID number and upload both documents.');
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append('nationalIdNumber', nationalIdNumber);
      form.append('nationalIdFile', idDoc);
      form.append('proofOfAddressFile', proofDoc);

      await api.put('/profiles/landlord/me', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert(
        'Submission Successful',
        'Your documents have been submitted for review. You will be notified once an admin approves your account.',
        [{ text: 'OK', onPress: () => navigation.navigate('Landlord') }]
      );
    } catch (error) {
      console.error("Submission Error:", error?.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.error || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const DocButton = ({ doc, onPress, label }) => (
    <TouchableOpacity style={[styles.docBtn, doc && styles.docBtnDone]} onPress={onPress}>
      <Icon name={doc ? 'check-circle' : 'upload'} size={20} color={doc ? '#28a745' : '#2563eb'} />
      <Text style={[styles.docBtnText, doc && { color: '#28a745' }]} numberOfLines={1}>
        {doc ? doc.name : label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Account Verification</Text>
      <Text style={styles.subtitle}>
        Welcome {user?.name || ''}. To get your Landlord account verified, submit your National ID
        and proof of address. You can keep using the app while this is reviewed.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>National ID Number</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 12-345678 T 12"
          value={nationalIdNumber}
          onChangeText={setNationalIdNumber}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>National ID (photo)</Text>
        <DocButton doc={idDoc} onPress={() => pickDoc(setIdDoc, 'national-id')} label="Upload ID photo" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Proof of Address (photo)</Text>
        <DocButton doc={proofDoc} onPress={() => pickDoc(setProofDoc, 'proof-of-address')} label="Upload proof of address" />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit for Review</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Landlord')} style={styles.linkButton}>
        <Text style={styles.linkText}>Skip for now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#fff', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#333' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30, textAlign: 'center' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#f9f9f9' },
  docBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#2563eb', borderStyle: 'dashed', borderRadius: 8, padding: 14, backgroundColor: '#f5f9ff' },
  docBtnDone: { borderColor: '#28a745', borderStyle: 'solid', backgroundColor: '#f3fbf5' },
  docBtnText: { color: '#2563eb', fontWeight: '600', flex: 1 },
  button: { backgroundColor: '#2563eb', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  disabledButton: { backgroundColor: '#a0cfff' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  linkButton: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#2563eb', fontSize: 14 },
  
  section: { marginBottom: 15, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#444' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  verifiedText: { color: '#4CAF50', fontWeight: 'bold' },
  otpBtn: { backgroundColor: '#666', padding: 10, borderRadius: 5, alignItems: 'center' },
  otpBtnText: { color: '#fff' },
  otpRow: { flexDirection: 'row', alignItems: 'center' },
  verifyBtn: { backgroundColor: '#28a745', padding: 12, borderRadius: 8 },
  verifyBtnText: { color: '#fff', fontWeight: 'bold' }
});

export default LandlordVerificationScreen;