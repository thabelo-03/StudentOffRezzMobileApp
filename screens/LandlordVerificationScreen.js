import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import api from '../services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const LandlordVerificationScreen = ({ navigation, route }) => {
  // Expecting user details passed from LoginScreen
  const { user } = route.params || {}; 
  
  const [proofOfRes, setProofOfRes] = useState('');
  const [idDocument, setIdDocument] = useState('');
  const [otp, setOtp] = useState('');
  const [contactVerified, setContactVerified] = useState(user?.contactVerified || false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOtp = async () => {
    try {
      const res = await api.post('/auth/send-otp');
      if (res.data.devOtp) {
        Alert.alert("Demo OTP", `Your code is: ${res.data.devOtp}`);
      } else {
        Alert.alert("OTP Sent", "Check your registered contact.");
      }
      setOtpSent(true);
    } catch (error) {
      Alert.alert("Error", "Failed to send OTP");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return Alert.alert("Error", "Enter OTP");
    try {
      await api.post('/auth/verify-otp', { code: otp });
      setContactVerified(true);
      Alert.alert("Success", "Contact Verified");
    } catch (error) {
      Alert.alert("Error", "Invalid OTP");
    }
  };

  const handleSubmit = async () => {
    if (!contactVerified) {
      Alert.alert("Verification Required", "Please verify your contact details first.");
      return;
    }

    if (!proofOfRes || !idDocument) {
      Alert.alert('Missing Documents', 'Please provide links for both documents.');
      return;
    }

    setLoading(true);
    try {
      // Use the centralized API service instead of fetch
      const response = await api.put('/auth/submit-documents', {
          uid: user?.uid,
          documents: {
            proofOfResidence: proofOfRes,
            idDocument: idDocument
          }
      });

      Alert.alert(
        'Submission Successful', 
        'Your documents have been submitted for review. You will be notified once an admin approves your account.',
        [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]
      );
    } catch (error) {
      console.error("Submission Error:", error);
      const message = error.response?.data?.message || 'Network error. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Account Verification</Text>
      <Text style={styles.subtitle}>
        Welcome {user?.username}. To activate your Landlord account, please submit the required documents.
      </Text>

      {/* Contact Verification Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Contact Verification</Text>
        {contactVerified ? (
          <View style={styles.verifiedBadge}>
            <Icon name="check-circle" size={20} color="#4CAF50" />
            <Text style={styles.verifiedText}>Contact Verified</Text>
          </View>
        ) : (
          <View>
            {!otpSent ? (
              <TouchableOpacity style={styles.otpBtn} onPress={handleSendOtp}>
                <Text style={styles.otpBtnText}>Send Verification Code</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.otpRow}>
                <TextInput 
                  style={[styles.input, { flex: 1, marginRight: 10 }]} 
                  placeholder="Enter OTP" 
                  value={otp} 
                  onChangeText={setOtp} 
                  keyboardType="numeric"
                />
                <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyOtp}>
                  <Text style={styles.verifyBtnText}>Verify</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>2. Identity Documents</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Proof of Residence (URL)</Text>
        <TextInput
          style={styles.input}
          placeholder="Paste link to document..."
          value={proofOfRes}
          onChangeText={setProofOfRes}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>ID Document (URL)</Text>
        <TextInput
          style={styles.input}
          placeholder="Paste link to ID..."
          value={idDocument}
          onChangeText={setIdDocument}
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.disabledButton]} 
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit for Review</Text>}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkButton}>
        <Text style={styles.linkText}>Back to Login</Text>
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
  button: { backgroundColor: '#007BFF', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  disabledButton: { backgroundColor: '#a0cfff' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  linkButton: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#007BFF', fontSize: 14 },
  
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