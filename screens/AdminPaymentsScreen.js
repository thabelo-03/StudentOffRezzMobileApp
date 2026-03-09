import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';

const AdminPaymentsScreen = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      const response = await api.get('/bookings/payments');
      setPayments(response.data);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchPayments(); }, [fetchPayments]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <Icon name="cash-check" size={28} color="#4CAF50" />
        </View>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.amount}>${item.amount}</Text>
            <Text style={styles.date}>{item.paymentDate ? new Date(item.paymentDate).toDateString() : 'N/A'}</Text>
          </View>
          <Text style={styles.house}>{item.houseName || 'Unknown Property'}</Text>
          <Text style={styles.subText}><Text style={{fontWeight:'bold'}}>Trans ID:</Text> {item.transactionId}</Text>
          <Text style={styles.subText}><Text style={{fontWeight:'bold'}}>Payer:</Text> {item.studentEmail}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Payment Transactions</Text>
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#007BFF" style={styles.loader} />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.empty}>No payments recorded yet.</Text>}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  loader: { marginTop: 50 },
  list: { paddingBottom: 20 },
  card: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  content: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  amount: { fontSize: 18, fontWeight: 'bold', color: '#2E7D32' },
  date: { fontSize: 12, color: '#888' },
  house: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 5 },
  subText: { fontSize: 13, color: '#555', marginBottom: 2 },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});

export default AdminPaymentsScreen;