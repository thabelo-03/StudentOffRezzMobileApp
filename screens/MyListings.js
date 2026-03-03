import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, Alert, Modal, TextInput, Button, ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { BASE_URL } from '../services/api';

const AMENITY_OPTIONS = [
  'Borehole', 'Wi-Fi', 'Solar', 'ZESA', 
  'Play Grounds', 'Swimming', 'Gas Stoves', 'Geyser'
];

const MyListings = () => {
  const [houses, setHouses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Updated State to match Student-side Schema
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [availableSpots, setAvailableSpots] = useState('');
  const [genderPolicy, setGenderPolicy] = useState('Mixed');
  const [amenities, setAmenities] = useState([]);
  const [showAmenitiesDropdown, setShowAmenitiesDropdown] = useState(false);
  const [imageUrls, setImageUrls] = useState([]); // Matches backend key
  
  const [editingHouseId, setEditingHouseId] = useState(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();

  const removeHouse = async (houseId) => {
    Alert.alert(
      "Delete Property",
      "Are you sure you want to delete this property?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              setLoading(true);
              await api.delete(`/houses/${houseId}`);
              Alert.alert('Success', 'Property deleted successfully.');
              fetchHouses(); // Refresh the list
            } catch (error) {
              console.error('Error deleting house:', error);
              Alert.alert('Error', 'Failed to delete property.');
            } finally {
              setLoading(false);
            }
          },
          style: "destructive"
        }
      ],
      { cancelable: true }
    );
  };

  const fetchHouses = useCallback(async () => {
    try {
      setLoading(true);
      const userJson = await AsyncStorage.getItem('user');
      if (!userJson) {
        navigation.navigate('Login');
        return;
      }
      const user = JSON.parse(userJson);
      setCurrentUser(user);

      const response = await api.get('/listings/mine');
      setHouses(response.data);
    } catch (error) {
      console.error('Error fetching houses:', error);
      Alert.alert('Error', 'Failed to fetch houses.');
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      fetchHouses();
    }, [fetchHouses])
  );

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Permission needed', 'Please allow access to your photos.');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images',
        quality: 0.2, // Increased slightly for better quality
        allowsMultipleSelection: true,
      });

      if (!result.canceled) {
        const selected = result.assets.map(asset => asset.uri);
        if (imageUrls.length + selected.length > 3) {
          Alert.alert('Limit reached', 'Max 3 images allowed');
          return;
        }
        console.log(`User picked ${selected.length} images.`);
        setImageUrls(prev => [...prev, ...selected]);
      }
    } catch (error) {
      console.error("Image Picker Error:", error);
      Alert.alert('Error', 'An error occurred while picking images.');
    }
  };

  const convertImagesToBase64 = async () => {
    const processedUrls = [];
    for (const uri of imageUrls) {
      if (uri.startsWith('http') || uri.startsWith('data:')) {
        processedUrls.push(uri);
        continue;
      }
      
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        console.log(`Processing image: ${uri} (Size: ${fileInfo.size} bytes)`);
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        processedUrls.push(`data:image/jpeg;base64,${base64}`);
        console.log(`Converted to Base64. Length: ${base64.length}`);
      } catch (error) {
        console.log("Error converting image:", error);
      }
    }
    return processedUrls;
  };

  const handleSubmit = async () => {
    if (!title || !price || imageUrls.length === 0) {
      Alert.alert('Error', 'Title, Price, and at least one Image are required.');
      return;
    }

    try {
      setLoading(true);
      console.log("Starting submission...");
      const finalImageUrls = await convertImagesToBase64();

      const houseData = {
        title,
        description,
        location,
        price: Number(price) || 0,
        availableSpots: Number(availableSpots) || 0,
        genderPolicy,
        amenities: amenities,
        imageUrls: finalImageUrls, // Key matches student-side
        createdAt: Date.now(), // Add timestamp for "Posted x mins ago"
      };

      const payloadSize = JSON.stringify(houseData).length;
      console.log(`Total Payload Size: ${(payloadSize / 1024).toFixed(2)} KB`);

      if (editingHouseId) {
        await api.put(`/houses/${editingHouseId}`, houseData);
        Alert.alert('Success', 'Property updated');
      } else {
        await api.post('/houses', houseData);
        Alert.alert('Success', 'Property posted');
      }
      resetForm();
      fetchHouses();
    } catch (error) {
      console.error("Submit Error:", error);
      if (error.response) console.log("Server Error Details:", error.response.data);
      
      if (error.response && error.response.status === 413) {
        Alert.alert('Upload Failed', 'Images are too large. Please try fewer images.');
      } else {
        Alert.alert('Error', error.response?.data?.error || 'Failed to save property');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setPrice('');
    setAvailableSpots('');
    setGenderPolicy('Mixed');
    setAmenities([]);
    setShowAmenitiesDropdown(false);
    setImageUrls([]);
    setEditingHouseId(null);
    setModalVisible(false);
  };

  const handleEdit = (house) => {
    setTitle(house.title);
    setDescription(house.description);
    setLocation(house.location);
    setPrice(house.price.toString());
    setAvailableSpots(house.availableSpots?.toString() || '');
    setGenderPolicy(house.genderPolicy || 'Mixed');
    setAmenities(house.amenities || []);
    
    const images = house.imageUrls || house.images || [];
    const processedImages = images.map(img => 
      (img.startsWith('http') || img.startsWith('data:')) ? img : `${BASE_URL}/uploads/${img.replace(/\\/g, '/')}`
    );
    setImageUrls(processedImages);

    setEditingHouseId(house.id); // Use house.id
    setModalVisible(true);
  };

  const renderHouseItem = (house) => {
    const allImages = house.imageUrls || house.images || [];
    const images = allImages.slice(0, 3);
    return (
      <View key={house.id} style={styles.card}>
        <ScrollView horizontal pagingEnabled>
          {images.length > 0 ? (
            images.map((img, index) => {
              const fullUri = (img.startsWith('http') || img.startsWith('data:')) ? img : `${BASE_URL}/uploads/${img.replace(/\\/g, '/')}`;
              return (
                <TouchableOpacity key={index} onPress={() => { setSelectedImage(fullUri); setImageModalVisible(true); }}>
                  <Image source={{ uri: fullUri }} style={[styles.houseImage, { backgroundColor: '#cccccc' }]} />
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={[styles.houseImage, styles.placeholderContainer]}>
              <Icon name="image" size={50} color="#888" />
              <Text style={styles.placeholderText}>No Images</Text>
            </View>
          )}
        </ScrollView>
        
        <View style={styles.infoContainer}>
          <Text style={styles.houseName}>{house.title}</Text>
          <Text style={styles.price}>${house.price} / month</Text>
          
          <View style={styles.tagRow}>
            <View style={styles.tag}><Text style={styles.tagText}>{house.genderPolicy}</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>{house.availableSpots} spots left</Text></View>
          </View>

          <Text style={styles.detail} numberOfLines={2}>{house.description}</Text>
          <Text style={styles.location}><Icon name="map-marker" /> {house.location}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(house)}>
              <Icon name="edit" color="#007BFF" /> <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => removeHouse(house.id)}>
              <Icon name="trash" color="red" /> <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>My Listings</Text>
        <TouchableOpacity onPress={() => setSettingsVisible(true)}>
          <Icon name="user-circle" size={30} color="#007BFF" />
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color="#007BFF" />}

      <ScrollView showsVerticalScrollIndicator={false}>
        {houses.map(renderHouseItem)}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Icon name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalTitle}>{editingHouseId ? 'Update Listing' : 'New Listing'}</Text>
          
          <Text style={styles.label}>House Title</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. PerkHouse" />
          
          <Text style={styles.label}>Price ($)</Text>
          <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" />
          
          <Text style={styles.label}>Available Spots</Text>
          <TextInput style={styles.input} value={availableSpots} onChangeText={setAvailableSpots} keyboardType="numeric" />

          <Text style={styles.label}>Gender Policy</Text>
          <View style={styles.policyRow}>
            {['Male', 'Female', 'Mixed'].map(p => (
              <TouchableOpacity key={p} style={[styles.policyBtn, genderPolicy === p && styles.policyBtnActive]} onPress={() => setGenderPolicy(p)}>
                <Text style={genderPolicy === p ? styles.whiteText : styles.blackText}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Amenities</Text>
          <TouchableOpacity 
            style={styles.dropdownBtn} 
            onPress={() => setShowAmenitiesDropdown(!showAmenitiesDropdown)}
          >
            <Text style={styles.dropdownBtnText}>
              {amenities.length > 0 ? `${amenities.length} Selected` : 'Select Amenities'}
            </Text>
            <Icon name={showAmenitiesDropdown ? "chevron-up" : "chevron-down"} size={16} color="#555" />
          </TouchableOpacity>
          
          {showAmenitiesDropdown && (
            <View style={styles.amenitiesContainer}>
              {AMENITY_OPTIONS.map(option => (
                <TouchableOpacity 
                  key={option} 
                  style={[styles.amenityChip, amenities.includes(option) && styles.amenityChipSelected]}
                  onPress={() => {
                    if (amenities.includes(option)) {
                      setAmenities(amenities.filter(a => a !== option));
                    } else {
                      setAmenities([...amenities, option]);
                    }
                  }}
                >
                  <Text style={[styles.amenityText, amenities.includes(option) && styles.amenityTextSelected]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, {height: 80}]} value={description} onChangeText={setDescription} multiline />

          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
            <Icon name="camera" color="#fff" /> <Text style={styles.whiteText}>Add Photos (Max 3)</Text>
          </TouchableOpacity>

          <ScrollView horizontal style={styles.previewContainer} showsHorizontalScrollIndicator={false}>
            {imageUrls.map((uri, index) => (
              <View key={index} style={styles.previewWrapper}>
                <Image source={{ uri }} style={styles.previewImage} />
                <TouchableOpacity 
                  style={styles.removeImageBtn} 
                  onPress={() => setImageUrls(imageUrls.filter((_, i) => i !== index))}
                >
                  <Icon name="times" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
              <Text style={styles.whiteText}>Save Listing</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
              <Text style={styles.whiteText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>

      {/* Full Image Viewer */}
      <Modal visible={imageModalVisible} transparent>
        <TouchableOpacity style={styles.fullImageOverlay} onPress={() => setImageModalVisible(false)}>
          <Image source={{ uri: selectedImage }} style={styles.fullImage} />
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 15 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, marginTop: 10 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  card: { backgroundColor: '#fff', borderRadius: 15, marginBottom: 20, overflow: 'hidden', elevation: 3 },
  houseImage: { width: 350, height: 200 },
  placeholderContainer: { backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#666', marginTop: 10, fontWeight: '600' },
  infoContainer: { padding: 15 },
  houseName: { fontSize: 20, fontWeight: 'bold' },
  price: { fontSize: 18, color: '#28a745', fontWeight: 'bold', marginVertical: 5 },
  tagRow: { flexDirection: 'row', gap: 10, marginVertical: 5 },
  tag: { backgroundColor: '#e9ecef', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tagText: { fontSize: 12, color: '#666' },
  location: { color: '#666', marginTop: 5 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, marginTop: 10 },
  editBtn: { flexDirection: 'row', alignItems: 'center' },
  editBtnText: { color: '#007BFF', marginLeft: 5, fontWeight: 'bold' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center' },
  deleteBtnText: { color: 'red', marginLeft: 5, fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: '#007BFF', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  modalContent: { padding: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, color: '#444' },
  input: { backgroundColor: '#f1f1f1', borderRadius: 10, padding: 12, marginBottom: 15 },
  policyRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  policyBtn: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#eee', alignItems: 'center' },
  policyBtnActive: { backgroundColor: '#007BFF' },
  
  dropdownBtn: { backgroundColor: '#f1f1f1', padding: 12, borderRadius: 10, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownBtnText: { color: '#333', fontSize: 16 },
  amenitiesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
  amenityChip: { backgroundColor: '#e9ecef', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  amenityChipSelected: { backgroundColor: '#007BFF' },
  amenityText: { color: '#333', fontSize: 14 },
  amenityTextSelected: { color: '#fff', fontWeight: 'bold' },

  uploadBtn: { backgroundColor: '#6c757d', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 10 },
  previewContainer: { flexDirection: 'row', marginBottom: 20 },
  previewWrapper: { marginRight: 10, position: 'relative' },
  previewImage: { width: 80, height: 80, borderRadius: 10 },
  removeImageBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: 'red', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 40 },
  saveBtn: { flex: 2, backgroundColor: '#28a745', padding: 15, borderRadius: 10, alignItems: 'center' },
  cancelBtn: { flex: 1, backgroundColor: '#dc3545', padding: 15, borderRadius: 10, alignItems: 'center' },
  whiteText: { color: '#fff', fontWeight: 'bold' },
  blackText: { color: '#000' },
  fullImageOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: '100%', height: '80%', resizeMode: 'contain' }
});

export default MyListings;