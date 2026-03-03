import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, FlatList, TouchableOpacity, 
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';


const ChatDetail = ({ route, navigation }) => {
    const params = route.params || {};
    // partnerId represents the person we are chatting with (Landlord or Student)
    const { partnerId, partnerName, houseTitle, houseId } = params;
  
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);
    const flatListRef = useRef();
  
    useEffect(() => {
      const fetchUser = async () => {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          setCurrentUserId(user.uid);
        }
      };
  
      fetchUser();
  
      const fetchMessages = async () => {
        try {
          const response = await api.get(`/chat/messages/${partnerId}?houseId=${houseId}`);
          setMessages(response.data);
        } catch (err) {
          console.error("Fetch Error:", err);
        } finally {
          setLoading(false);
        }
      };
  
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }, [partnerId, houseId]);
  
    const sendMessage = async () => {
      if (!newMessage.trim()) return;
      try {
        const response = await api.post('/chat/send', {
          receiverId: partnerId,
          text: newMessage,
          houseTitle: houseTitle,
          houseId: houseId
        });
        setMessages(prev => [...prev, response.data]);
        setNewMessage('');
      } catch (err) {
        console.error("Send Error:", err);
      }
    };
  
    const renderItem = ({ item }) => {
        const isMyMessage = item.senderId === currentUserId;
    
        return (
          <View style={[
            styles.bubble, 
            isMyMessage ? styles.landlordBubble : styles.studentBubble
          ]}>
            <Text style={[styles.messageText, isMyMessage ? { color: '#FFF' } : { color: '#333' }]}>
              {item.text}
            </Text>
            <Text style={[styles.time, isMyMessage ? { color: '#E0E0E0' } : { color: '#666' }]}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        );
      };

    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={26} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{partnerName || 'Chat'}</Text>
            <Text style={styles.headerSub}>{houseTitle}</Text>
          </View>
        </View>
  
        {loading || !currentUserId ? (
          <ActivityIndicator size="large" color="#007BFF" style={styles.centered} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}
  
        <View style={styles.inputArea}>
          <TextInput 
            style={styles.input} 
            placeholder="Type your reply..." 
            value={newMessage}
            onChangeText={setNewMessage}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Icon name="send" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };
  
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#E5DDD5' }, // WhatsApp-like background color
    header: { flexDirection: 'row', alignItems: 'center', padding: 15, paddingTop: 50, backgroundColor: '#FFF', elevation: 4 },
    headerInfo: { marginLeft: 15 },
    headerName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    headerSub: { fontSize: 12, color: '#007BFF', fontWeight: '600' },
    list: { padding: 15 },
    bubble: { padding: 12, borderRadius: 12, marginBottom: 10, maxWidth: '75%', elevation: 1, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 1, shadowOffset: { width: 0, height: 1 } },
    studentBubble: { backgroundColor: '#FFF', alignSelf: 'flex-start', borderTopLeftRadius: 0, borderWidth: 0.5, borderColor: '#E0E0E0' },
    landlordBubble: { backgroundColor: '#007BFF', alignSelf: 'flex-end', borderTopRightRadius: 0 },
    messageText: { fontSize: 16 },
    time: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
    inputArea: { flexDirection: 'row', padding: 10, backgroundColor: '#FFF', alignItems: 'center', elevation: 5 },
    input: { flex: 1, backgroundColor: '#F0F0F0', borderRadius: 25, paddingHorizontal: 20, height: 45, fontSize: 16 },
    sendBtn: { backgroundColor: '#007BFF', width: 45, height: 45, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginLeft: 10, elevation: 2 },
    centered: { flex: 1, justifyContent: 'center' }
  });
  
  export default ChatDetail;
  