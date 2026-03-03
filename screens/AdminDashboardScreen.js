import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';

const { width } = Dimensions.get('window');

const AdminDashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    students: 0,
    landlords: 0,
    totalListings: 0,
    admins: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const [usersRes, housesRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/houses')
      ]);

      const users = usersRes.data || [];
      const houses = housesRes.data || [];

      const students = users.filter(u => u.role === 'student').length;
      const landlords = users.filter(u => u.role === 'landlord').length;
      const admins = users.filter(u => u.role === 'admin').length;

      setStats({
        totalUsers: users.length,
        students,
        landlords,
        admins,
        totalListings: houses.length
      });
    } catch (error) {
      console.error("Stats Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchStats(); }, [fetchStats]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  // Simple Bar Chart Component
  const BarChart = () => {
    const maxVal = Math.max(stats.students, stats.landlords, stats.totalListings, 1);
    const getWidth = (val) => `${(val / maxVal) * 100}%`;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Platform Analytics</Text>
        
        <View style={styles.barRow}>
          <Text style={styles.barLabel}>Students</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: getWidth(stats.students), backgroundColor: '#4CAF50' }]} />
          </View>
          <Text style={styles.barValue}>{stats.students}</Text>
        </View>

        <View style={styles.barRow}>
          <Text style={styles.barLabel}>Landlords</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: getWidth(stats.landlords), backgroundColor: '#2196F3' }]} />
          </View>
          <Text style={styles.barValue}>{stats.landlords}</Text>
        </View>

        <View style={styles.barRow}>
          <Text style={styles.barLabel}>Listings</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: getWidth(stats.totalListings), backgroundColor: '#FF9800' }]} />
          </View>
          <Text style={styles.barValue}>{stats.totalListings}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Admin Dashboard</Text>
      
      {/* Analytics Section */}
      <BarChart />

      {/* Menu Grid */}
      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('ManageUsers')}
        >
          <Icon name="account-group" size={40} color="#333" />
          <Text style={styles.cardText}>Manage Users</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('AdminVerification')}
        >
          <Icon name="shield-check" size={40} color="#333" />
          <Text style={styles.cardText}>Verifications</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('AdminListings')}
        >
          <Icon name="home-city" size={40} color="#333" />
          <Text style={styles.cardText}>All Listings</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card}
          onPress={() => navigation.navigate('AdminReports')}
        >
          <Icon name="file-chart" size={40} color="#333" />
          <Text style={styles.cardText}>Reports & Issues</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card}
          onPress={() => navigation.navigate('SystemConfigs')}
        >
          <Icon name="cogs" size={40} color="#333" />
          <Text style={styles.cardText}>System Configs</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    width: '48%', // Ensures 2 per row with space-between
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Chart Styles
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 10,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5
  },
  chartTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#555' },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  barLabel: { width: 70, fontSize: 14, color: '#666', fontWeight: '600' },
  barTrack: { flex: 1, height: 12, backgroundColor: '#f0f0f0', borderRadius: 6, marginHorizontal: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 6 },
  barValue: { width: 30, fontSize: 14, fontWeight: 'bold', color: '#333', textAlign: 'right' },
});

export default AdminDashboardScreen;
