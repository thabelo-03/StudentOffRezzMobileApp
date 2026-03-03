import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const StudentVerificationScreen = ({ navigation, route }) => {
  const { user } = route.params || {};
  
  const [step, setStep] = useState(1); // 1: Reg Number, 2: OTP
  const [studentId, setStudentId] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyId = async () => {
    if (!studentId.trim()) return Alert.alert("Error", "Please enter your Student ID");
    
    setLoading(true);
    try {
      await api.post('/auth/verify-student-id', { studentId });
      Alert.alert("Success", "Student ID Verified. Proceeding to Contact Verification.");
      setStep(2);
      sendOtp();
    } catch (error) {
      Alert.alert("Verification Failed", error.response?.data?.message || "Invalid ID");
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    try {
      const res = await api.post('/auth/send-otp');
      // For demo purposes, we show the OTP in alert if returned by backend
      if (res.data.devOtp) {
        Alert.alert("Demo OTP", `Your code is: ${res.data.devOtp}`);
      } else {
        Alert.alert("OTP Sent", "Check your registered contact method.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to send OTP");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) return Alert.alert("Error", "Please enter the code");

    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { code: otp });
      
      // Update local storage user object to reflect verification
      const currentUser = await AsyncStorage.getItem('user');
      if (currentUser) {
        const parsed = JSON.parse(currentUser);
        parsed.studentVerified = true;
        parsed.contactVerified = true;
        await AsyncStorage.setItem('user', JSON.stringify(parsed));
      }

      Alert.alert("Success", "Verification Complete!", [
        { text: "Go to Home", onPress: () => navigation.replace('Student') }
      ]);
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Invalid Code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Icon name="shield-check" size={60} color="#007BFF" />
        <Text style={styles.title}>Student Verification</Text>
        <Text style={styles.subtitle}>
          {step === 1 
            ? "Please verify your university registration number to access the platform." 
            : "We've sent a verification code to your contact details."}
        </Text>
      </View>

      <View style={styles.card}>
        {step === 1 ? (
          <>
            <Text style={styles.label}>Student Registration Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. N0123456X"
              value={studentId}
              onChangeText={setStudentId}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.button} onPress={handleVerifyId} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify ID</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>Enter OTP Code</Text>
            <TextInput
              style={styles.input}
              placeholder="6-digit code"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              maxLength={6}
            />
            <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify Code</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.resendBtn} onPress={sendOtp}>
              <Text style={styles.resendText}>Resend Code</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.logoutText}>Back to Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#F4F6F8', justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 10 },
  subtitle: { textAlign: 'center', color: '#666', marginTop: 5, paddingHorizontal: 20 },
  
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, elevation: 3 },
  label: { fontWeight: '600', marginBottom: 8, color: '#333' },
  input: { 
    backgroundColor: '#F9F9F9', 
    borderWidth: 1, 
    borderColor: '#DDD', 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 16, 
    marginBottom: 20 
  },
  
  button: { backgroundColor: '#007BFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  resendBtn: { marginTop: 15, alignItems: 'center' },
  resendText: { color: '#007BFF' },

  logoutBtn: { marginTop: 30, alignItems: 'center' },
  logoutText: { color: '#666' }
});

export default StudentVerificationScreen;