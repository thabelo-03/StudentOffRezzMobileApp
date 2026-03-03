import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert, Image, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

const LandlordInbox = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const fetchInquiries = async () => {
    try {
      // Pointing to your conversations endpoint
      const response = await api.get('/chat/landlord-conversations');
      setConversations(response.data);
    } catch (error) {
      console.error("Inbox Load Error:", error);
      if (!refreshing) {
        Alert.alert("Connection Error", "Could not load messages.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchInquiries();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchInquiries();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }) => {
    // Map based on Firebase-compatible data keys
    const studentName = item.studentName || 'Student User';
    const lastMsg = item.lastMessage || '';
    const studentId = item.studentId;
    // Mock unread count if not provided by backend yet, or use item.unreadCount
    const unreadCount = item.unreadCount || 0; 
    const time = item.updatedAt || item.createdAt || new Date().toISOString();

    return (
      <TouchableOpacity 
        style={styles.chatRow}
        onPress={() => {
          setSidebarVisible(false); // Close sidebar if open
          if (!studentId) {
            Alert.alert("Error", "Missing Student ID context.");
            return;
          }
          navigation.navigate('ChatDetail', { 
            partnerId: studentId,
            partnerName: studentName,
            houseTitle: item.houseTitle,
            houseId: item.houseId // FIX: Pass houseId so ChatDetail can fetch messages
          });
        }}
      >
        {/* Avatar Area */}
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: item.studentAvatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} 
            style={styles.avatar} 
          />
        </View>

        {/* Content Area */}
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.studentName} numberOfLines={1}>{studentName}</Text>
            <Text style={styles.timeText}>{formatTime(time)}</Text>
          </View>
          
          <View style={styles.chatFooter}>
            <Text style={styles.lastMsg} numberOfLines={1}>
              {lastMsg.includes('Rejected') ? '❌ Booking Rejected' : lastMsg}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) return <ActivityIndicator size="large" color="#007BFF" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setSidebarVisible(true)}>
          <Icon name="menu" size={30} color="#333" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Inbox</Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007BFF']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="email-outline" size={60} color="#CCC" />
            <Text style={styles.emptyText}>No inquiries from students yet.</Text>
          </View>
        }
      />

      {/* Sidebar Modal for Chat List */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={sidebarVisible}
        onRequestClose={() => setSidebarVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setSidebarVisible(false)} activeOpacity={1}>
          <View style={styles.sidebarContainer}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Student Chats</Text>
              <TouchableOpacity onPress={() => setSidebarVisible(false)} style={styles.closeBtn}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={conversations}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.sidebarList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  topBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    paddingTop: 50, 
    backgroundColor: '#FFF',
    elevation: 3,
  },
  screenTitle: { fontSize: 24, fontWeight: 'bold', marginLeft: 20, color: '#333' },
  listContent: { paddingBottom: 50 },
  
  // WhatsApp Style Row
  chatRow: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatarContainer: { marginRight: 15 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0E0E0' },
  chatContent: { flex: 1, justifyContent: 'center' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  studentName: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  timeText: { fontSize: 12, color: '#888' },
  chatFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMsg: { fontSize: 14, color: '#666', flex: 1, marginRight: 10 },
  unreadBadge: { 
    backgroundColor: '#25D366', // WhatsApp Green
    borderRadius: 12, 
    minWidth: 24, 
    height: 24, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 6 
  },
  unreadText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { textAlign: 'center', marginTop: 15, color: '#999', fontSize: 16 },

  // Sidebar Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row' },
  sidebarContainer: { width: '75%', backgroundColor: '#FFF', height: '100%', paddingTop: 50, elevation: 5 },
  sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 15 },
  sidebarTitle: { fontSize: 22, fontWeight: 'bold', color: '#007BFF' },
  sidebarList: { paddingBottom: 20 },
  closeBtn: { padding: 5 },
});

export default LandlordInbox;