import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, StyleSheet, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';

const ManageUsersScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All'); // 'All', 'Landlord', 'Student'

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Fetch error:', error.response?.data || error.message);
      Alert.alert('Error', 'Could not fetch users. Please ensure you are logged in as an Admin.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload users every time the screen comes into focus
  useFocusEffect(useCallback(() => { fetchUsers(); }, [fetchUsers]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleBlock = async (user) => {
    const newStatus = !user.disabled;
    const action = newStatus ? 'Block' : 'Unblock';
    
    Alert.alert(
      `${action} User`,
      `Are you sure you want to ${action.toLowerCase()} ${user.username}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes", 
          onPress: async () => {
            try {
              await api.put(`/admin/users/${user.id}/status`, { disabled: newStatus });
              setUsers(users.map(u => u.id === user.id ? { ...u, disabled: newStatus } : u));
              Alert.alert("Success", `User ${action.toLowerCase()}ed successfully.`);
            } catch (error) {
              Alert.alert("Error", "Failed to update user status.");
            }
          }
        }
      ]
    );
  };

  const handleDelete = (user) => {
    Alert.alert(
      "Delete User",
      `Are you sure you want to permanently delete ${user.username}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/admin/users/${user.id}`);
              setUsers(users.filter(u => u.id !== user.id));
              Alert.alert("Success", "User deleted successfully.");
            } catch (error) {
              Alert.alert("Error", "Failed to delete user.");
            }
          }
        }
      ]
    );
  };

  const handleResetPassword = async (user) => {
    try {
      await api.post('/admin/users/reset-password', { email: user.email });
      Alert.alert("Success", "Password reset link generated on server.");
    } catch (error) {
      Alert.alert("Error", "Failed to generate reset link.");
    }
  };

  const getFilteredUsers = () => {
    return users.filter(user => {
      const matchesSearch = 
        (user.username || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = filterRole === 'All' || 
        (user.role && user.role.toLowerCase() === filterRole.toLowerCase());

      return matchesSearch && matchesFilter;
    });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={24} color="#666" />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search by name or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        {['All', 'Landlord', 'Student'].map(role => (
          <TouchableOpacity 
            key={role} 
            style={[styles.filterChip, filterRole === role && styles.activeChip]}
            onPress={() => setFilterRole(role)}
          >
            <Text style={[styles.chipText, filterRole === role && styles.activeChipText]}>{role}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={getFilteredUsers()}
        keyExtractor={(item) => item.id || item.uid}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.username}>{item.username || 'N/A'}</Text>
                <Text style={styles.email}>{item.email}</Text>
              </View>
              <View style={[styles.roleBadge, item.role === 'admin' ? styles.adminBadge : styles.userBadge]}>
                <Text style={styles.roleText}>{item.role}</Text>
              </View>
            </View>
            
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleBlock(item)}>
                <Icon name={item.disabled ? "account-check" : "account-off"} size={22} color={item.disabled ? "#4CAF50" : "#FF9800"} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleResetPassword(item)}>
                <Icon name="lock-reset" size={22} color="#2196F3" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
                <Icon name="trash-can-outline" size={22} color="#F44336" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No users found.</Text>}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007BFF']} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 10, marginBottom: 15, height: 45 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },

  filterContainer: { flexDirection: 'row', marginBottom: 20, gap: 10 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  activeChip: { backgroundColor: '#007BFF' },
  chipText: { color: '#666', fontWeight: '600' },
  activeChipText: { color: '#fff' },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  userCard: { 
    padding: 15, 
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  username: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  email: { fontSize: 14, color: '#666', marginBottom: 5 },
  
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  adminBadge: { backgroundColor: '#ff4d4d' },
  userBadge: { backgroundColor: '#007BFF' },
  roleText: { color: '#fff', fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' },
  
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  actionBtn: { padding: 5 },
  
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' }
});

export default ManageUsersScreen;