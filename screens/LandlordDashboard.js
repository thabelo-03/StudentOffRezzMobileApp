import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Alert, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../database/firebaseConfig';
import { signOut } from 'firebase/auth';

const LandlordDashboard = ({ navigation }) => {
  const [stats, setStats] = useState({ pending: 0, active: 0, revenue: 0 });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [userName, setUserName] = useState('Landlord');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportText, setReportText] = useState('');

  const fetchData = async () => {
    try {
      const [listingsRes, bookingsRes] = await Promise.all([
        api.get('/listings/mine'),
        api.get('/bookings/landlord'),
      ]);

      const listings = listingsRes.data || [];
      const bookings = bookingsRes.data || [];

      // Revenue: Sum of prices of all posted houses (Potential Revenue)
      const totalRevenue = listings.reduce((acc, house) => acc + (Number(house.price) || 0), 0);
      const pendingBookings = bookings.filter(b => b.status === 'pending');
      
      setStats({
        pending: pendingBookings.length,
        active: listings.length,
        revenue: totalRevenue
      });

      setRecentRequests(pendingBookings);

    } catch (error) {
      console.error("Dashboard Sync Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
    if (auth.currentUser) {
      const name = auth.currentUser.displayName || auth.currentUser.email?.split('@')[0];
      if (name) setUserName(name);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.multiRemove(['token', 'user']);
      setMenuVisible(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to log out');
    }
  };

  const handleAccept = async (bookingId) => {
    try {
      setLoading(true);
      await api.put(`/bookings/${bookingId}`, { status: 'accepted' });
      Alert.alert("Success", "Booking accepted.");
      onRefresh();
    } catch (error) {
      Alert.alert("Error", "Failed to accept booking.");
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async (bookingId) => {
    try {
      setLoading(true);
      await api.put(`/bookings/${bookingId}`, { status: 'rejected' });
      Alert.alert("Success", "Booking declined.");
      onRefresh();
    } catch (error) {
      Alert.alert("Error", "Failed to decline booking.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportText.trim()) return Alert.alert("Error", "Please describe the issue.");
    try {
      await api.post('/reports', {
        type: 'System/User Issue',
        description: reportText
      });
      Alert.alert("Success", "Report submitted successfully.");
      setReportText('');
      setReportModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Failed to submit report.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.userRow}>
            <Text style={styles.greeting}>Welcome back, {userName}</Text>
            <View style={styles.onlineDot} />
          </View>
          <Text style={styles.headerTitle}>Landlord Hub</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn}>
            <Icon name="bell-outline" size={26} color="#333" />
            <View style={styles.badgeDot} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setMenuVisible(true)}>
            <Icon name="dots-vertical" size={28} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Custom Menu Modal */}
      <Modal
        transparent={true}
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); Alert.alert("Settings", "Coming Soon"); }}>
              <Icon name="cog-outline" size={20} color="#333" />
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); Alert.alert("Help", "Contact support@thabstay.com"); }}>
              <Icon name="help-circle-outline" size={20} color="#333" />
              <Text style={styles.menuText}>Help</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); setReportModalVisible(true); }}>
              <Icon name="alert-circle-outline" size={20} color="#D32F2F" />
              <Text style={styles.menuText}>Report Issue</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
              <Icon name="logout" size={20} color="#d9534f" />
              <Text style={[styles.menuText, { color: '#d9534f' }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Report Modal */}
      <Modal visible={reportModalVisible} transparent animationType="slide" onRequestClose={() => setReportModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.reportModalContainer}>
            <Text style={styles.modalTitle}>Report an Issue</Text>
            <Text style={styles.modalSub}>Describe the issue you encountered.</Text>
            <TextInput 
              style={styles.reportInput} 
              multiline 
              placeholder="Type here..." 
              value={reportText} 
              onChangeText={setReportText} 
            />
            <TouchableOpacity style={styles.submitReportBtn} onPress={handleSubmitReport}><Text style={styles.whiteText}>Submit Report</Text></TouchableOpacity>
            <TouchableOpacity style={styles.cancelReportBtn} onPress={() => setReportModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Search Engine */}
        <View style={styles.searchBar}>
          <Icon name="magnify" size={20} color="#999" />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search requests..." 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
          />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
           <View style={[styles.statBox, {borderBottomColor: '#FF9800'}]}>
              <Text style={styles.statValue}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
           </View>
           <View style={[styles.statBox, {borderBottomColor: '#2196F3'}]}>
              <Text style={styles.statValue}>{stats.active}</Text>
              <Text style={styles.statLabel}>Properties</Text>
           </View>
           <View style={[styles.statBox, {borderBottomColor: '#4CAF50'}]}>
              <Text style={styles.statValue}>${stats.revenue}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
           </View>
        </View>

        {/* Recent Requests Section */}
        <Text style={styles.sectionTitle}>Recent Requests</Text>
        {recentRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="inbox-outline" size={40} color="#ccc" />
            <Text style={styles.emptyText}>No pending requests</Text>
          </View>
        ) : (
          recentRequests.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.requestCard}
              onPress={() => navigation.navigate('Inbox')}
            >
              <View style={styles.reqHeader}>
                <View style={styles.reqInfo}>
                  <Text style={styles.reqName}>{item.studentName || 'Student Request'}</Text>
                  <Text style={styles.reqHouse}>{item.houseTitle || 'Property Inquiry'}</Text>
                </View>
                <View style={styles.reqDateBadge}>
                  <Text style={styles.reqDateText}>Pending</Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, styles.declineBtn]} onPress={() => handleDecline(item.id)}>
                  <Icon name="close" size={16} color="#D32F2F" />
                  <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={() => handleAccept(item.id)}>
                  <Icon name="check" size={16} color="#388E3C" />
                  <Text style={styles.acceptText}>Accept</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
        
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    paddingTop: 50, 
    backgroundColor: '#FFF',
    elevation: 2 
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', marginTop: 2 },
  greeting: { fontSize: 14, color: '#666' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  headerIcons: { flexDirection: 'row', gap: 15 },
  iconBtn: { padding: 5, position: 'relative' },
  badgeDot: { position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderRadius: 4, backgroundColor: 'red' },
  
  scrollContainer: { padding: 15 },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 10, paddingHorizontal: 10, marginBottom: 20, elevation: 2, height: 45 },
  searchInput: { flex: 1, marginLeft: 10, color: '#333' },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statBox: { 
    backgroundColor: '#FFF', padding: 15, borderRadius: 10, width: '31%', 
    alignItems: 'center', elevation: 2, borderBottomWidth: 4 
  },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 10, color: '#888', textTransform: 'uppercase', marginTop: 5 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333', marginLeft: 5 },
  
  requestCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.05
  },
  reqHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  reqName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  reqHouse: { fontSize: 13, color: '#666', marginTop: 2 },
  reqDateBadge: { backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, height: 24 },
  reqDateText: { fontSize: 10, color: '#F57C00', fontWeight: 'bold' },
  
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 5 },
  actionBtn: { 
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', 
    paddingVertical: 10, borderRadius: 8, gap: 5 
  },
  declineBtn: { backgroundColor: '#FFEBEE' },
  declineText: { color: '#D32F2F', fontWeight: '600', fontSize: 13 },
  acceptBtn: { backgroundColor: '#E8F5E9' },
  acceptText: { color: '#388E3C', fontWeight: '600', fontSize: 13 },

  emptyState: { alignItems: 'center', marginTop: 30 },
  emptyText: { color: '#999', marginTop: 10 },

  // Menu Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
  menuContainer: { 
    position: 'absolute', top: 90, right: 20, 
    backgroundColor: '#FFF', borderRadius: 12, padding: 5, 
    width: 180, elevation: 5 
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  menuText: { fontSize: 15, color: '#333' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 2 },

  // Report Modal
  reportModalContainer: { backgroundColor: '#fff', width: '85%', borderRadius: 15, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  modalSub: { fontSize: 14, color: '#666', marginBottom: 15 },
  reportInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 10, height: 100, textAlignVertical: 'top', marginBottom: 15 },
  submitReportBtn: { backgroundColor: '#D32F2F', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  cancelReportBtn: { padding: 10, alignItems: 'center' },
  whiteText: { color: '#fff', fontWeight: 'bold' },
  cancelText: { color: '#666' },
});

export default LandlordDashboard;