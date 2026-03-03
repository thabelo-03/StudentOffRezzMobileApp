import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';

const AdminReportsScreen = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      const response = await api.get('/reports');
      // Sort by newest first
      const sorted = response.data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setReports(sorted);
    } catch (error) {
      console.error("Fetch Reports Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchReports(); }, [fetchReports]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Reports & Issues</Text>
      <FlatList
        data={reports}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Icon name={item.type === 'Scam' ? 'alert-decagram' : 'alert-circle-outline'} size={24} color={item.type === 'Scam' ? '#D32F2F' : '#007BFF'} />
            </View>
            <View style={styles.content}>
              <Text style={styles.title}>{item.type || 'Issue'} Report</Text>
              <Text style={styles.subTitle}>From: {item.reporterEmail} ({item.reporterRole})</Text>
              <Text style={styles.message}>{item.description}</Text>
              <Text style={styles.date}>{item.timestamp ? new Date(item.timestamp).toDateString() : ''}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No active reports.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  card: { flexDirection: 'row', backgroundColor: '#f8f8f8', padding: 15, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  iconContainer: { marginRight: 15, backgroundColor: '#e3f2fd', padding: 10, borderRadius: 20 },
  content: { flex: 1 },
  title: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  subTitle: { fontSize: 12, color: '#666', marginBottom: 4 },
  message: { color: '#555', marginVertical: 2 },
  date: { color: '#999', fontSize: 12 },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});

export default AdminReportsScreen;