import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert, Image, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../database/firebaseConfig';
import { signOut } from 'firebase/auth';

const StudentInbox = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/chat/student-conversations');
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
      fetchConversations();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      setMenuVisible(false);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) {
      Alert.alert('Error', 'Failed to log out');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }) => {
    const partnerName = item.otherPartyName || 'Landlord';
    const lastMsg = item.lastMessage || '';
    const time = item.updatedAt || item.createdAt || new Date().toISOString();

    return (
      <TouchableOpacity 
        style={styles.chatRow}
        onPress={() => {
          navigation.navigate('ChatDetail', { 
            partnerId: item.otherPartyId, // Pass the otherPartyId (landlord's UID)
            partnerName: item.otherPartyName,
            houseTitle: item.houseTitle,
            houseId: item.houseId
          });
        }}
      >
        {/* Avatar Area */}
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: item.otherPartyAvatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} 
            style={styles.avatar} 
          />
        </View>

        {/* Content Area */}
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.studentName} numberOfLines={1}>{partnerName}</Text>
            <Text style={styles.timeText}>{formatTime(time)}</Text>
          </View>
          <Text style={styles.houseTitle}>{item.houseTitle || "Property Inquiry"}</Text>
          <Text style={styles.lastMsg} numberOfLines={1}>{lastMsg}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) return <ActivityIndicator size="large" color="#007BFF" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenTitle}>My Inbox</Text>
        </View>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Icon name="dots-vertical" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Menu Modal */}
      <Modal transparent={true} visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); Alert.alert("Settings", "Coming Soon"); }}>
              <Icon name="cog-outline" size={20} color="#333" />
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); Alert.alert("Help", "Contact support"); }}>
              <Icon name="help-circle-outline" size={20} color="#333" />
              <Text style={styles.menuText}>Help</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
              <Icon name="logout" size={20} color="#d9534f" />
              <Text style={[styles.menuText, { color: '#d9534f' }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
            <Text style={styles.emptyText}>You have no messages yet.</Text>
          </View>
        }
      />
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
  screenTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  listContent: { padding: 15, paddingBottom: 50 },
  
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
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  studentName: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  timeText: { fontSize: 12, color: '#888' },
  houseTitle: { fontSize: 12, color: '#007BFF', marginBottom: 2, fontWeight: '600' },
  lastMsg: { fontSize: 14, color: '#666' },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { textAlign: 'center', marginTop: 15, color: '#999', fontSize: 16 },

  // Menu Styles
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
  menuContainer: { position: 'absolute', top: 60, right: 20, backgroundColor: '#FFF', borderRadius: 12, padding: 5, width: 160, elevation: 5 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  menuText: { fontSize: 15, color: '#333' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 2 },
});

export default StudentInbox;
