import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';

const ICONS = {
  booking_request: 'home-plus-outline',
  booking_accepted: 'check-circle-outline',
  booking_declined: 'close-circle-outline',
  message: 'message-text-outline',
  match: 'star-outline',
  system: 'bell-outline',
};

const timeAgo = (ts) => {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
};

const NotificationsScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/users/notifications');
      setItems(res.data || []);
    } catch (e) {
      console.log('Notifications error:', e?.response?.status || e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchNotifications(); }, [fetchNotifications]));

  const handlePress = async (item) => {
    if (!item.isRead) {
      try {
        await api.put(`/users/notifications/${item._id}/read`);
        setItems(prev => prev.map(n => n._id === item._id ? { ...n, isRead: true } : n));
      } catch (_) {}
    }
    // Navigate based on type
    if (item.type === 'message') navigation.navigate('Inbox');
  };

  if (loading && !refreshing) return <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <FlatList
        data={items}
        keyExtractor={(i) => i._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.row, !item.isRead && styles.unread]} onPress={() => handlePress(item)}>
            <View style={styles.iconWrap}>
              <Icon name={ICONS[item.type] || 'bell-outline'} size={22} color="#2563eb" />
            </View>
            <View style={styles.content}>
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
            </View>
            {!item.isRead && <View style={styles.dot} />}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="bell-sleep-outline" size={56} color="#CBD5E0" />
            <Text style={styles.emptyText}>You're all caught up.</Text>
          </View>
        }
        contentContainerStyle={items.length === 0 && { flex: 1 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  loader: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a365d', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
  unread: { backgroundColor: '#F7FAFF' },
  iconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EBF4FF', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  content: { flex: 1 },
  message: { fontSize: 15, color: '#2D3748', lineHeight: 20 },
  time: { fontSize: 12, color: '#A0AEC0', marginTop: 3 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#2563eb', marginLeft: 8 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#A0AEC0', fontSize: 16, marginTop: 12 },
});

export default NotificationsScreen;
