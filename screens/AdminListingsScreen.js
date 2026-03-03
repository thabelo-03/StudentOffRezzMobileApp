import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api, { BASE_URL } from '../services/api';

const AdminListingsScreen = () => {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHouses = useCallback(async () => {
    try {
      const response = await api.get('/houses');
      setHouses(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch listings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchHouses(); }, [fetchHouses]));

  const handleDelete = (house) => {
    Alert.alert(
      "Delete Listing",
      `Are you sure you want to delete "${house.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/houses/${house.id}`);
              setHouses(houses.filter(h => h.id !== house.id));
              Alert.alert("Success", "Listing deleted.");
            } catch (error) {
              Alert.alert("Error", "Failed to delete listing.");
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => {
    const images = item.imageUrls || item.images || [];
    const mainImage = images.length > 0 
      ? (images[0].startsWith('http') || images[0].startsWith('data:') ? images[0] : `${BASE_URL}/uploads/${images[0].replace(/\\/g, '/')}`)
      : null;

    return (
      <View style={styles.card}>
        <Image 
          source={mainImage ? { uri: mainImage } : { uri: 'https://via.placeholder.com/150' }} 
          style={styles.image} 
        />
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>{item.title || item.houseName}</Text>
          <Text style={styles.subtitle}>{item.location}</Text>
          <Text style={styles.price}>${item.price}/mo</Text>
          <Text style={styles.landlord}>Landlord: {item.landlordEmail}</Text>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <Icon name="trash-can-outline" size={24} color="#D32F2F" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) return <ActivityIndicator size="large" color="#007BFF" style={styles.centered} />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>All Listings ({houses.length})</Text>
      <FlatList
        data={houses}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No listings found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center' },
  header: { fontSize: 20, fontWeight: 'bold', padding: 20, paddingBottom: 10 },
  list: { padding: 15 },
  card: { 
    flexDirection: 'row', 
    backgroundColor: '#f9f9f9', 
    borderRadius: 10, 
    marginBottom: 15, 
    padding: 10, 
    alignItems: 'center',
    elevation: 2 
  },
  image: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#ddd' },
  content: { flex: 1, marginLeft: 15 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 12, color: '#666' },
  price: { fontSize: 14, color: '#2E7D32', fontWeight: 'bold', marginTop: 2 },
  landlord: { fontSize: 10, color: '#888', marginTop: 2 },
  deleteBtn: { padding: 10 },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});

export default AdminListingsScreen;