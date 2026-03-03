import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Linking, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';

const AdminVerificationScreen = () => {
  const [pendingLandlords, setPendingLandlords] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPending = useCallback(async () => {
    try {
      const response = await api.get('/admin/users');
      const allUsers = response.data;
      // Filter for landlords and students with pending status
      const pending = allUsers.filter(u => (u.role === 'landlord' || u.role === 'student') && u.verificationStatus === 'pending');
      setPendingLandlords(pending); 
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch pending verifications.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchPending(); }, [fetchPending]));

  const handleVerify = async (uid, status, email) => {
    try {
      await api.put(`/admin/users/${uid}/verification`, { status });
      
      if (status === 'verified' && email) {
        Alert.alert(
          'Success', 
          'User approved. Opening email client to notify user.',
          [{ text: 'OK', onPress: () => {
             const subject = "ThabStay Account Approved";
             const body = "Congratulations! Your account has been verified.\n\nRegards,\nThabstay Administrator";
             Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
          }}]
        );
      } else {
        Alert.alert('Success', `User ${status === 'verified' ? 'approved' : 'rejected'}.`);
      }
      fetchPending();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status.');
    }
  };

  const openLink = (url) => {
    if (url) {
      Linking.openURL(url).catch(err => Alert.alert("Error", "Cannot open link"));
    } else {
      Alert.alert("No Link", "No document link provided.");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>

      <Text style={styles.sectionLabel}>{item.role === 'student' ? 'Student Details:' : 'Submitted Documents:'}</Text>
      
      {item.role === 'student' ? (
        <View style={styles.docContainer}>
          <Text style={{fontSize: 16, fontWeight: 'bold', color: '#333'}}>Student ID: {item.studentIdNumber}</Text>
        </View>
      ) : (
        <View style={styles.docContainer}>
          <TouchableOpacity style={styles.docBtn} onPress={() => openLink(item.documents?.proofOfResidence)}>
            <Icon name="file-document-outline" size={20} color="#007BFF" />
            <Text style={styles.docText}>Proof of Res</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.docBtn} onPress={() => openLink(item.documents?.idDocument)}>
            <Icon name="card-account-details-outline" size={20} color="#007BFF" />
            <Text style={styles.docText}>ID Document</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={() => handleVerify(item.id, 'rejected', item.email)}>
          <Icon name="close" size={18} color="#fff" />
          <Text style={styles.btnText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.approveBtn]} onPress={() => handleVerify(item.id, 'verified', item.email)}>
          <Icon name="check" size={18} color="#fff" />
          <Text style={styles.btnText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pending Verifications</Text>
      <FlatList
        data={pendingLandlords}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPending(); }} />}
        ListEmptyComponent={<Text style={styles.empty}>No pending verifications.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
  header: { marginBottom: 10 },
  username: { fontSize: 18, fontWeight: 'bold' },
  email: { color: '#666' },
  sectionLabel: { fontWeight: '600', marginTop: 5, marginBottom: 5 },
  docContainer: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  docBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e3f2fd', padding: 8, borderRadius: 5 },
  docText: { marginLeft: 5, color: '#007BFF' },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  btn: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 5, alignItems: 'center' },
  rejectBtn: { backgroundColor: '#D32F2F' },
  approveBtn: { backgroundColor: '#388E3C' },
  btnText: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});

export default AdminVerificationScreen;