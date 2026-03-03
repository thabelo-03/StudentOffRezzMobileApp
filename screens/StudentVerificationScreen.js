import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';

const StudentVerificationScreen = ({ navigation, route }) => {
  const { user } = route.params || {};
  
  const [studentId, setStudentId] = useState(user?.studentIdNumber || '');
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(user?.verificationStatus || 'unverified');

  const handleSubmit = async () => {
    if (!studentId.trim()) return Alert.alert("Error", "Please enter your Student ID");
    
    setLoading(true);
    try {
      await api.post('/auth/verify-student-id', { studentId });
      
      Alert.alert(
        "Submission Successful", 
        "Your Student ID has been submitted for review. Please wait for admin approval.",
        [{ text: "OK" }]
      );
      setVerificationStatus('pending');
      
    } catch (error) {
      Alert.alert("Submission Failed", error.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    navigation.navigate('Login');
  };

  if (verificationStatus === 'pending') {
    return (
      <View style={[styles.container, { alignItems: 'center' }]}>
        <View style={styles.content}>
          <Icon name="clock-outline" size={80} color="#FFC107" />
          <Text style={styles.title}>Verification Pending</Text>
          <Text style={styles.subtitle}>
            Your student registration number ({studentId}) is currently under review by an administrator.
          </Text>
          <Text style={styles.infoText}>
            You will be able to access the platform once your account is approved.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleLogout}>
            <Text style={styles.btnText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Icon name="school" size={60} color="#007BFF" />
        <Text style={styles.title}>Student Verification</Text>
        <Text style={styles.subtitle}>
          Please verify your university registration number to access the platform.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Student Registration Number</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. N0123456X"
          value={studentId}
          onChangeText={setStudentId}
          autoCapitalize="characters"
        />
        
        {verificationStatus === 'rejected' && (
           <Text style={styles.errorText}>
             Your previous submission was rejected. Please check your ID and try again.
           </Text>
        )}

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit for Approval</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Back to Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#F4F6F8', justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 30 },
  content: { alignItems: 'center', padding: 20 },
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
  
  logoutBtn: { marginTop: 30, alignItems: 'center' },
  logoutText: { color: '#666' },
  infoText: { textAlign: 'center', color: '#555', marginTop: 20, marginBottom: 30 },
  errorText: { color: 'red', marginBottom: 10, textAlign: 'center' }
});

export default StudentVerificationScreen;