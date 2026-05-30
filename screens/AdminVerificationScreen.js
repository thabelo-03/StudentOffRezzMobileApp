import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Linking, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api, { BASE_URL } from '../services/api';

const resolveDocUrl = (u) => {
  if (!u) return null;
  if (u.startsWith('http') || u.startsWith('data:')) return u;
  return `${BASE_URL}/${String(u).replace(/^\/+/, '').replace(/\\/g, '/')}`;
};

const AdminVerificationScreen = () => {
  const [pendingLandlords, setPendingLandlords] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPending = useCallback(async () => {
    try {
      // Backend returns LandlordProfile docs (isVerified: 'pending_review') with
      // populated userId, nationalIdNumber, and uploaded document URLs.
      const response = await api.get('/admin/verification/pending');
      setPendingLandlords(response.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch pending verifications.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchPending(); }, [fetchPending]));

  const handleVerify = async (profileId, userId, status, email) => {
    try {
      // status: 'approve' | 'reject'
      await api.put(`/admin/verification/${status}/${profileId}`, {});
      // Keep the User.isVerified badge in sync with the profile decision.
      if (userId) {
        try { await api.put(`/admin/users/${userId}`, { isVerified: status === 'approve' }); } catch (_) {}
      }

      if (status === 'approve' && email) {
        Alert.alert(
          'Approved',
          'Landlord approved. Notify them by email?',
          [
            { text: 'Skip', style: 'cancel' },
            { text: 'Email', onPress: () => {
               const subject = "ThabStay Account Approved";
               const body = "Congratulations! Your landlord account has been verified.\n\nRegards,\nThabStay Administrator";
               Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
            }},
          ]
        );
      } else {
        Alert.alert('Done', `Landlord ${status === 'approve' ? 'approved' : 'rejected'}.`);
      }
      fetchPending();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status.');
    }
  };

  const openLink = (url) => {
    const full = resolveDocUrl(url);
    if (full) {
      Linking.openURL(full).catch(() => Alert.alert("Error", "Cannot open document"));
    } else {
      Alert.alert("No Document", "No document was provided.");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.username}>{item.userId?.name || 'Landlord'}</Text>
        <Text style={styles.email}>{item.userId?.email}</Text>
      </View>

      <Text style={styles.sectionLabel}>Submitted Documents:</Text>
      <Text style={{ marginBottom: 8, color: '#333' }}>National ID: {item.nationalIdNumber || 'N/A'}</Text>
      <View style={styles.docContainer}>
        <TouchableOpacity style={styles.docBtn} onPress={() => openLink(item.nationalIdUrl)}>
          <Icon name="card-account-details-outline" size={20} color="#2563eb" />
          <Text style={styles.docText}>ID Document</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.docBtn} onPress={() => openLink(item.proofOfAddressUrl)}>
          <Icon name="file-document-outline" size={20} color="#2563eb" />
          <Text style={styles.docText}>Proof of Address</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={() => handleVerify(item._id, item.userId?._id, 'reject', item.userId?.email)}>
          <Icon name="close" size={18} color="#fff" />
          <Text style={styles.btnText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.approveBtn]} onPress={() => handleVerify(item._id, item.userId?._id, 'approve', item.userId?.email)}>
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
        keyExtractor={item => item._id}
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
  docText: { marginLeft: 5, color: '#2563eb' },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  btn: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 5, alignItems: 'center' },
  rejectBtn: { backgroundColor: '#D32F2F' },
  approveBtn: { backgroundColor: '#388E3C' },
  btnText: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});

export default AdminVerificationScreen;