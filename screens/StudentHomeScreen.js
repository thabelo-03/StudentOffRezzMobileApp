import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView, TouchableOpacity,
  Linking, Alert, Modal, ActivityIndicator, TextInput, FlatList, Dimensions
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api, { BASE_URL } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Resolve a stored image path (e.g. "uploads/listings/x.jpg") to a full URL.
const resolveImageUrl = (u) => {
  if (!u) return null;
  if (u.startsWith('http') || u.startsWith('data:')) return u;
  return `${BASE_URL}/${String(u).replace(/^\/+/, '').replace(/\\/g, '/')}`;
};

// Map a web-backend Listing (Mongo) into the shape this screen's UI expects.
// The screen was originally written against the Firebase RTDB house shape.
const normalizeListing = (l) => {
  if (!l) return l;
  const landlord = l.landlordId && typeof l.landlordId === 'object' ? l.landlordId : null;
  const images = (l.imageUrls || l.images || []).map(resolveImageUrl).filter(Boolean);
  const location = l.address
    ? [l.address.street, l.address.city].filter(Boolean).join(', ')
    : (l.location || '');
  return {
    ...l,
    id: l._id || l.id,
    location,
    images,
    imageUrls: images,
    createdAt: l.createdAt ? new Date(l.createdAt).getTime() : null,
    // landlordId is populated as an object on the backend; expose the id string
    // (used for booking/chat) plus a display name.
    landlordId: landlord ? landlord._id : l.landlordId,
    landlordName: landlord ? landlord.name : undefined,
    universityName: l.universityId && typeof l.universityId === 'object' ? l.universityId.name : undefined,
  };
};

const StudentHomeScreen = () => {
  const navigation = useNavigation();
  const [houses, setHouses] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedHouses, setLikedHouses] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [userName, setUserName] = useState('Student');
  const [menuVisible, setMenuVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportText, setReportText] = useState('');

  // Filter State
  const [activeFilterModal, setActiveFilterModal] = useState(null); // 'location', 'price', 'gender'
  const [filters, setFilters] = useState({
    location: null,
    price: null,
    gender: null
  });

  // Profile Completion State
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [program, setProgram] = useState('');
  const [level, setLevel] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  
  const [activeHouse, setActiveHouse] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const carouselRef = useRef(null);

  // Refresh data every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchHouses();
      fetchBookings();
    }, [])
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim().toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const getUser = async () => {
      // User details come from the stored login payload (backend JWT auth).
      const stored = await AsyncStorage.getItem('user');
      if (!stored) return;
      const data = JSON.parse(stored);
      if (data.name) setUserName(data.name);

      // NOTE: the old Firebase build stored program/level on the RTDB user object,
      // so this modal auto-popped when they were missing. The web backend keeps that
      // data on the StudentProfile model (PUT /profiles/student/me) — a richer profile
      // requiring university/campus/lifestyle/logistics, which this lightweight modal
      // can't satisfy. Auto-popup is disabled until the full student profile flow is
      // ported. TODO: drive this from GET /api/profiles completeness instead.
      // if (!data.program || !data.level) setProfileModalVisible(true);
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'user']);
      setMenuVisible(false);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) {
      Alert.alert('Error', 'Failed to log out');
    }
  };

  const handleSubmitReport = async () => {
    if (!reportText.trim()) return Alert.alert("Error", "Please describe the issue.");
    try {
      await api.post('/reports', {
        type: 'Scam/Issue',
        description: reportText
      });
      Alert.alert("Success", "Report submitted successfully.");
      setReportText('');
      setReportModalVisible(false);
    } catch (error) {
      console.error("Report Submission Error:", error);
      Alert.alert("Error", "Failed to submit report.");
    }
  };

  const handleSaveProfile = async () => {
    if (!program || !level) {
      Alert.alert("Required", "Please fill in all fields.");
      return;
    }
    
    try {
      setSavingProfile(true);
      // TODO (remapping phase): confirm the exact backend route/shape for
      // updating a student profile (program/level live on StudentProfile).
      await api.put('/profiles', { program, level });

      setProfileModalVisible(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Profile Update Error:", error);
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const fetchHouses = async () => {
    try {
      // Web backend: GET /listings returns { listings, currentPage, totalPages, totalListings }.
      const response = await api.get('/listings', { params: { limit: 50, populate: 'imageUrls' } });
      const raw = response.data?.listings || response.data || [];
      const normalized = raw.map(normalizeListing);
      // Sort by newest first
      const sorted = normalized.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setHouses(sorted);
    } catch (error) {
      console.error('fetchHouses error:', error?.response?.data || error.message);
      Alert.alert('Error', 'Could not load listings.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings/student');
      // Surface payment completion as a 'paid' status for the action-button logic
      // (backend tracks it on the separate paymentStatus field).
      const bookings = (response.data || []).map(b =>
        b.paymentStatus === 'paid' ? { ...b, status: 'paid' } : b
      );
      setMyBookings(bookings);
    } catch (error) {
      console.log('Error fetching bookings:', error);
    }
  };

  const toggleLike = (id) => {
    setLikedHouses(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Get unique locations from houses
  const uniqueLocations = useMemo(() => {
    const locs = houses.map(h => h.location).filter(l => l);
    const predefinedLocations = ['KMP', 'Senka', 'Ardilaide Park', 'CBZ', 'Nehosho', 'Masolar', 'Frontline'];
    return [...new Set([...predefinedLocations, ...locs])].sort();
  }, [houses]);

  const filteredHouses = useMemo(() => {
    return houses.filter(h => {
      // 1. Search Query
      const q = debouncedSearch;
      const title = (h.title || h.houseName || '').toLowerCase();
      const location = (h.location || '').toLowerCase();
      const matchesSearch = title.includes(q) || location.includes(q);

      // 2. Location Filter
      const matchesLocation = filters.location ? h.location === filters.location : true;

      // 3. Gender Filter
      const matchesGender = filters.gender ? h.genderPolicy === filters.gender : true;

      // 4. Price Filter
      let matchesPrice = true;
      const p = Number(h.price);
      if (filters.price === 'low') matchesPrice = p < 50;
      else if (filters.price === 'mid') matchesPrice = p >= 50 && p <= 100;
      else if (filters.price === 'high') matchesPrice = p > 100;

      return matchesSearch && matchesLocation && matchesGender && matchesPrice;
    });
  }, [houses, debouncedSearch, filters]);

  const renderStars = (rating) => {
    const stars = [];
    const houseRating = Number(rating) || 0;
    for (let i = 1; i <= 5; i++) {
      stars.push(<Icon key={i} name={i <= houseRating ? "star" : "star-outline"} size={14} color="#FFD700" />);
    }
    return <View style={styles.starRow}>{stars}</View>;
  };

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return `${weeks}w ago`;
  };

  const renderHouseItem = ({ item }) => {
    const images = item.imageUrls || item.images || [];
    const mainImage = images.length > 0 
      ? (images[0].startsWith('http') || images[0].startsWith('data:') ? images[0] : `${BASE_URL}/uploads/${images[0].replace(/\\/g, '/')}`)
      : null;

    const booking = getBookingStatus(item.id);

    return (
      <TouchableOpacity 
        activeOpacity={0.9} 
        style={styles.card} 
        onPress={() => { setActiveHouse(item); setActiveImageIndex(0); setDetailVisible(true); }}
      >
        <View style={styles.cardImageWrapper}>
          {mainImage ? (
            <Image source={{ uri: mainImage }} style={styles.cardImage} />
          ) : (
            <View style={[styles.cardImage, styles.placeholderBox, { backgroundColor: '#E0E0E0' }]}>
              <Icon name="image-off-outline" size={40} color="#bbb" />
            </View>
          )}
          <TouchableOpacity style={styles.heartBtn} onPress={() => toggleLike(item.id)}>
            <Icon name={likedHouses[item.id] ? "heart" : "heart-outline"} size={22} color={likedHouses[item.id] ? "#FF5252" : "#fff"} />
          </TouchableOpacity>
          <View style={styles.priceBadge}>
            <Text style={[styles.priceText, { color: '#2E7D32' }]}>
              ${item.price} <Text style={{ fontSize: 12, color: '#555', fontWeight: 'normal' }}>/month</Text>
            </Text>
          </View>
          {item.createdAt && (
            <View style={styles.timeBadge}>
              <Text style={styles.timeText}>{getRelativeTime(item.createdAt)}</Text>
            </View>
          )}
          {booking && (
            <View style={[styles.bookingStatusBadge, 
              booking.status === 'accepted' ? { backgroundColor: '#2E7D32' } : 
              booking.status === 'pending' ? { backgroundColor: '#FFC107' } :
              booking.status === 'paid' ? { backgroundColor: '#2563eb' } :
              { backgroundColor: '#D32F2F' }
            ]}>
              <Text style={styles.bookingStatusText}>
                {booking.status === 'accepted' ? 'Pay Now' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.houseName} numberOfLines={1}>{item.title || item.houseName}</Text>
            {item.landlordVerified && (
              <Icon name="check-decagram" size={20} color="#2563eb" style={{ marginLeft: 5, marginRight: 5 }} />
            )}
            <View style={styles.ratingContainer}>
              <Icon name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating || '4.5'}</Text>
            </View>
          </View>
          
          <View style={styles.locationRow}>
            <Icon name="map-marker-outline" size={14} color="#666" />
            <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
          </View>

          <View style={styles.featuresRow}>
             <Text style={styles.featureText}>{item.genderPolicy || 'Mixed'} • {item.availableSpots || 0} spots left</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleOpenChat = async () => {
    if (!activeHouse) return;
    try {
      // A conversation IS a booking. Create-or-get one for this listing, then open it.
      const existing = getBookingStatus(activeHouse.id);
      let conversationId = existing?._id;
      if (!conversationId) {
        const res = await api.post('/chat/conversations', { listingId: activeHouse.id });
        conversationId = res.data?._id;
        await fetchBookings();
      }
      setDetailVisible(false);
      navigation.navigate('ChatDetail', {
        conversationId,
        partnerName: activeHouse.landlordName || 'Landlord',
        houseTitle: activeHouse.title || activeHouse.houseName,
      });
    } catch (err) {
      console.error('Open chat error:', err?.response?.status || err.message);
      Alert.alert('Error', 'Could not open the conversation.');
    }
  };

  const handleRequestBooking = async () => {
    if (!activeHouse) return;
    if (!activeHouse.landlordId) {
      Alert.alert("Error", "This property has no landlord information.");
      return;
    }
    
    try {
      setLoading(true);
      const greeting = `I am interested in ${activeHouse.title || activeHouse.houseName}. Is it available?`;

      // 1. Create Booking Request (backend derives landlord + amount from the listing).
      //    The booking IS the conversation; its _id is the conversationId.
      const bookingRes = await api.post('/bookings', {
        listingId: activeHouse.id,
        message: greeting,
      });
      const conversationId = bookingRes.data?._id;

      // 2. Post the initial chat message into that conversation. Keep it non-fatal so a
      //    chat hiccup can't mask the successful booking above.
      if (conversationId) {
        try {
          await api.post(`/chat/${conversationId}`, { message: greeting });
        } catch (chatErr) {
          console.log('Initial chat message failed:', chatErr?.response?.status || chatErr?.message);
        }
      }

      Alert.alert("Request Sent", "Your booking request has been sent to the landlord. You can continue the conversation in your Inbox.");
      
      // 3. Refresh bookings and close modal
      await fetchBookings();
      setActiveHouse(null);
      setDetailVisible(false);
      navigation.navigate('Inbox');

    } catch (error) {
      console.error("Booking Request Error:", error);
      Alert.alert('Error', 'Failed to send booking request.');
    } finally {
      setLoading(false);
    }
  };

  const getBookingStatus = (houseId) => {
    // Backend booking.listing is populated ({ _id, ... }) or an id string.
    const booking = myBookings.find(b => {
      const listingId = b.listing?._id || b.listing;
      return listingId === houseId;
    });
    return booking ? booking : null;
  };

  // Helper to render the dynamic action button
  const renderActionButton = () => {
    const booking = getBookingStatus(activeHouse?.id);

    if (!booking) {
      return (
        <TouchableOpacity style={[styles.footerMainBtn, { backgroundColor: '#FF385C' }]} onPress={handleRequestBooking}>
          <Text style={styles.footerBtnText}>Reserve</Text>
        </TouchableOpacity>
      );
    }

    if (booking.status === 'pending') {
      return (
        <TouchableOpacity style={[styles.footerMainBtn, { backgroundColor: '#FFC107' }]} onPress={() => { setDetailVisible(false); navigation.navigate('Inbox'); }}>
          <Text style={styles.footerBtnText}>Pending</Text>
        </TouchableOpacity>
      );
    }

    if (booking.status === 'accepted') {
      return (
        <TouchableOpacity style={[styles.footerMainBtn, { backgroundColor: '#2E7D32' }]} onPress={() => { setDetailVisible(false); navigation.navigate('Payments', { house: activeHouse, bookingId: booking._id }); }}>
          <Text style={styles.footerBtnText}>Pay Now</Text>
        </TouchableOpacity>
      );
    }

    if (booking.status === 'paid') {
      return (
        <TouchableOpacity style={[styles.footerMainBtn, { backgroundColor: '#2563eb' }]} disabled>
          <Text style={styles.footerBtnText}>Paid</Text>
        </TouchableOpacity>
      );
    }

    if (booking.status === 'rejected') {
      return (
        <TouchableOpacity style={[styles.footerMainBtn, { backgroundColor: '#D32F2F' }]} onPress={handleRequestBooking}>
          <Text style={styles.footerBtnText}>Retry</Text>
        </TouchableOpacity>
      );
    }

    return null;
  };

  const applyFilter = (type, value) => {
    setFilters(prev => ({ ...prev, [type]: prev[type] === value ? null : value }));
    setActiveFilterModal(null);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.userRow}>
            <Text style={styles.greeting}>Hello, {userName}</Text>
            <View style={styles.onlineDot} />
          </View>
          <Text style={styles.headerTitle}>Find a home</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')}>
            <Icon name="bell-outline" size={24} color="#FFF" />
            <View style={styles.badgeDot} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setMenuVisible(true)}>
            <Icon name="dots-vertical" size={26} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.searchBar}>
        <Icon name="magnify" size={20} color="#999" />
        <TextInput style={styles.searchInput} placeholder="Search location or house name..." value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      {/* Filter Buttons Row */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15, gap: 10 }}>
          
          {/* Location Filter */}
          <TouchableOpacity style={[styles.filterBtn, filters.location && styles.filterBtnActive]} onPress={() => setActiveFilterModal('location')}>
            <Text style={[styles.filterBtnText, filters.location && styles.filterBtnTextActive]}>{filters.location || 'Location'}</Text>
            <Icon name="chevron-down" size={16} color={filters.location ? "#FFF" : "#333"} />
          </TouchableOpacity>

          {/* Price Filter */}
          <TouchableOpacity style={[styles.filterBtn, filters.price && styles.filterBtnActive]} onPress={() => setActiveFilterModal('price')}>
            <Text style={[styles.filterBtnText, filters.price && styles.filterBtnTextActive]}>
              {filters.price === 'low' ? '< $50' : filters.price === 'mid' ? '$50 - $100' : filters.price === 'high' ? '> $100' : 'Price'}
            </Text>
            <Icon name="chevron-down" size={16} color={filters.price ? "#FFF" : "#333"} />
          </TouchableOpacity>

          {/* Gender Filter */}
          <TouchableOpacity style={[styles.filterBtn, filters.gender && styles.filterBtnActive]} onPress={() => setActiveFilterModal('gender')}>
            <Text style={[styles.filterBtnText, filters.gender && styles.filterBtnTextActive]}>{filters.gender || 'Gender'}</Text>
            <Icon name="chevron-down" size={16} color={filters.gender ? "#FFF" : "#333"} />
          </TouchableOpacity>

          {/* Clear Filters */}
          {(filters.location || filters.price || filters.gender) && (
            <TouchableOpacity style={styles.clearFilterBtn} onPress={() => setFilters({ location: null, price: null, gender: null })}>
              <Icon name="close" size={18} color="#FFF" />
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Menu Modal */}
      <Modal transparent={true} visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('Settings'); }}>
              <Icon name="cog-outline" size={20} color="#333" />
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('Help'); }}>
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
            <Text style={styles.modalSub}>Describe the scam or issue you encountered.</Text>
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

      {/* Filter Selection Modal */}
      <Modal visible={!!activeFilterModal} transparent animationType="fade" onRequestClose={() => setActiveFilterModal(null)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setActiveFilterModal(null)}>
          <View style={styles.filterModalContent}>
            <Text style={styles.filterModalTitle}>
              Select {activeFilterModal === 'location' ? 'Location' : activeFilterModal === 'price' ? 'Price Range' : 'Gender Policy'}
            </Text>
            
            <ScrollView style={{ maxHeight: 300 }}>
              {activeFilterModal === 'location' && uniqueLocations.map((loc, index) => (
                <TouchableOpacity key={index} style={styles.filterOption} onPress={() => applyFilter('location', loc)}>
                  <Text style={[styles.filterOptionText, filters.location === loc && styles.filterOptionTextActive]}>{loc}</Text>
                  {filters.location === loc && <Icon name="check" size={20} color="#2563eb" />}
                </TouchableOpacity>
              ))}

              {activeFilterModal === 'price' && (
                <>
                  <TouchableOpacity style={styles.filterOption} onPress={() => applyFilter('price', 'low')}>
                    <Text style={[styles.filterOptionText, filters.price === 'low' && styles.filterOptionTextActive]}>Under $50</Text>
                    {filters.price === 'low' && <Icon name="check" size={20} color="#2563eb" />}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.filterOption} onPress={() => applyFilter('price', 'mid')}>
                    <Text style={[styles.filterOptionText, filters.price === 'mid' && styles.filterOptionTextActive]}>$50 - $100</Text>
                    {filters.price === 'mid' && <Icon name="check" size={20} color="#2563eb" />}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.filterOption} onPress={() => applyFilter('price', 'high')}>
                    <Text style={[styles.filterOptionText, filters.price === 'high' && styles.filterOptionTextActive]}>Over $100</Text>
                    {filters.price === 'high' && <Icon name="check" size={20} color="#2563eb" />}
                  </TouchableOpacity>
                </>
              )}

              {activeFilterModal === 'gender' && ['Male', 'Female', 'Mixed'].map((g) => (
                <TouchableOpacity key={g} style={styles.filterOption} onPress={() => applyFilter('gender', g)}>
                  <Text style={[styles.filterOptionText, filters.gender === g && styles.filterOptionTextActive]}>{g}</Text>
                  {filters.gender === g && <Icon name="check" size={20} color="#2563eb" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity style={styles.closeFilterModalBtn} onPress={() => setActiveFilterModal(null)}>
              <Text style={{ color: '#666' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Profile Completion Modal */}
      <Modal visible={profileModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.profileModalContainer}>
            <Text style={styles.modalTitle}>Complete Your Profile</Text>
            <Text style={styles.modalSub}>Please provide your student details to continue.</Text>
            
            <Text style={styles.label}>Program / Course</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Computer Science" 
              value={program} 
              onChangeText={setProgram} 
            />

            <Text style={styles.label}>Level / Year</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. 4.2" 
              value={level} 
              onChangeText={setLevel} 
            />

            <TouchableOpacity style={styles.saveProfileBtn} onPress={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? <ActivityIndicator color="#fff" /> : <Text style={styles.whiteText}>Save & Continue</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {loading ? <ActivityIndicator size="large" color="#2563eb" style={{marginTop: 50}} /> : (
        <FlatList data={filteredHouses} renderItem={renderHouseItem} keyExtractor={item => item.id} contentContainerStyle={{ paddingBottom: 30 }} />
      )}

      {/* DETAIL MODAL */}
      <Modal visible={detailVisible} animationType="slide" transparent onRequestClose={() => setDetailVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailSheet}>
            
            {/* Header Handle & Close */}
            <View style={styles.sheetHeader}>
               <View style={styles.dragHandle} />
               <TouchableOpacity style={styles.closeBtnAbsolute} onPress={() => setDetailVisible(false)}>
                  <Icon name="close-circle" size={30} color="#fff" style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 15 }} />
               </TouchableOpacity>
            </View>

            {activeHouse && (
              <>
              <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {/* Image Carousel with Arrows */}
                <View style={{ position: 'relative' }}>
                  <ScrollView 
                    ref={carouselRef}
                    horizontal 
                    pagingEnabled 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.carouselContainer}
                    onMomentumScrollEnd={(e) => {
                      const index = Math.round(e.nativeEvent.contentOffset.x / width);
                      setActiveImageIndex(index);
                    }}
                  >
                   {(activeHouse.imageUrls || activeHouse.images || []).map((img, i) => (
                      <Image 
                        key={i}
                        source={{ uri: (img.startsWith('http') || img.startsWith('data:')) ? img : `${BASE_URL}/uploads/${img.replace(/\\/g, '/')}` }} 
                        style={styles.carouselImage} 
                      />
                   ))}
                  </ScrollView>

                  {/* Left Arrow */}
                  {activeImageIndex > 0 && (
                    <TouchableOpacity 
                      style={[styles.carouselArrow, { left: 10 }]} 
                      onPress={() => {
                        const newIndex = activeImageIndex - 1;
                        carouselRef.current?.scrollTo({ x: newIndex * width, animated: true });
                        setActiveImageIndex(newIndex);
                      }}
                    >
                      <Icon name="chevron-left" size={28} color="#fff" />
                    </TouchableOpacity>
                  )}

                  {/* Right Arrow */}
                  {activeImageIndex < (activeHouse.imageUrls || activeHouse.images || []).length - 1 && (
                    <TouchableOpacity 
                      style={[styles.carouselArrow, { right: 10 }]} 
                      onPress={() => {
                        const newIndex = activeImageIndex + 1;
                        carouselRef.current?.scrollTo({ x: newIndex * width, animated: true });
                        setActiveImageIndex(newIndex);
                      }}
                    >
                      <Icon name="chevron-right" size={28} color="#fff" />
                    </TouchableOpacity>
                  )}

                  {/* Dot Indicators */}
                  {(activeHouse.imageUrls || activeHouse.images || []).length > 1 && (
                    <View style={styles.dotRow}>
                      {(activeHouse.imageUrls || activeHouse.images || []).map((_, i) => (
                        <View key={i} style={[styles.dot, activeImageIndex === i && styles.dotActive]} />
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.sheetContent}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.sheetTitle}>{activeHouse.title || activeHouse.houseName}</Text>
                    {activeHouse.landlordVerified && (
                      <Icon name="check-decagram" size={24} color="#2563eb" style={{ marginLeft: 8, marginTop: -5 }} />
                    )}
                  </View>
                  <Text style={styles.sheetLocation}>{activeHouse.location}</Text>

                  <View style={styles.divider} />

                  {/* Host Section */}
                  <View style={styles.hostSection}>
                     <View style={styles.hostAvatar}>
                        <Text style={styles.hostInitials}>H</Text>
                     </View>
                     <View>
                        <Text style={styles.hostName}>Hosted by {activeHouse.landlordEmail ? activeHouse.landlordEmail.split('@')[0] : 'Landlord'}</Text>
                        <Text style={styles.hostSub}>
                          {activeHouse.createdAt 
                            ? `Listed ${new Date(activeHouse.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` 
                            : 'Landlord'}
                        </Text>
                     </View>
                  </View>

                  <View style={styles.divider} />

                  {/* Quick Stats */}
                  <View style={styles.statsRow}>
                     <View style={styles.statItem}>
                        <Icon name="bed-outline" size={24} color="#333" />
                        <Text style={styles.statLabel}>{activeHouse.availableSpots} Rooms</Text>
                     </View>
                     <View style={styles.statItem}>
                        <Icon name="gender-male-female" size={24} color="#333" />
                        <Text style={styles.statLabel}>{activeHouse.genderPolicy}</Text>
                     </View>
                     <View style={styles.statItem}>
                        <Icon name="star-outline" size={24} color="#333" />
                        <Text style={styles.statLabel}>{activeHouse.rating || '4.5'} Rating</Text>
                     </View>
                  </View>

                  <View style={styles.divider} />

                  <Text style={styles.sectionHeader}>About this place</Text>
                  <Text style={styles.descriptionText}>{activeHouse.description}</Text>

                  <View style={styles.divider} />

                  <Text style={styles.sectionHeader}>What this place offers</Text>
                  <View style={styles.amenitiesList}>
                    {(activeHouse.amenities || []).map((a, i) => (
                      <View key={i} style={styles.amenityItem}>
                        <Icon name="check" size={18} color="#333" />
                        <Text style={styles.amenityText}>{a}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>

              {/* Sticky Footer */}
              <View style={styles.stickyFooter}>
                 <View style={styles.priceContainer}>
                    <Text style={styles.footerPrice}>${activeHouse.price}</Text>
                    <Text style={styles.footerPeriod}>/month</Text>
                 </View>
                 
                 <View style={styles.footerBtnRow}>
                    <TouchableOpacity style={styles.iconCircleBtn} onPress={() => Linking.openURL(`tel:${activeHouse.phoneNumber}`)}>
                       <Icon name="phone" size={20} color="#333" />
                    </TouchableOpacity>
                    
                    {getBookingStatus(activeHouse?.id)?.status === 'accepted' && (
                       <TouchableOpacity style={styles.iconCircleBtn} onPress={handleOpenChat}>
                          <Icon name="message-text-outline" size={20} color="#333" />
                       </TouchableOpacity>
                    )}

                    {renderActionButton()}
                 </View>
              </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, paddingTop: 50, backgroundColor: '#1a365d' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#48bb78', marginTop: 2 },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#FFF', marginTop: 3, letterSpacing: -0.5 },
  headerIcons: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 6, position: 'relative', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10 },
  badgeDot: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#fc8181' },
  
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, marginHorizontal: 15, marginTop: 15, marginBottom: 10, height: 50, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14 },
  
  card: { backgroundColor: '#fff', borderRadius: 18, marginBottom: 16, marginHorizontal: 15, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12 },
  cardImageWrapper: { position: 'relative' },
  cardImage: { width: '100%', height: 200, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  placeholderBox: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e2e8f0' },
  heartBtn: { position: 'absolute', top: 15, right: 15, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 22, padding: 8 },
  priceBadge: { position: 'absolute', bottom: 15, left: 15, backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, elevation: 3 },
  priceText: { fontWeight: '800', color: '#1a365d', fontSize: 16 },
  timeBadge: { position: 'absolute', top: 15, left: 15, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  timeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  bookingStatusBadge: { position: 'absolute', bottom: 15, right: 15, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 22, elevation: 3 },
  bookingStatusText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  
  cardContent: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  houseName: { fontSize: 17, fontWeight: '700', color: '#1a365d', flex: 1 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fefcbf', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  ratingText: { fontSize: 12, fontWeight: '700', marginLeft: 4, color: '#744210' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  locationText: { color: '#718096', fontSize: 13, marginLeft: 4 },
  featuresRow: { flexDirection: 'row', alignItems: 'center' },
  featureText: { fontSize: 12, color: '#4a5568', backgroundColor: '#edf2f7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },

  starRow: { flexDirection: 'row' },
  
  // Modal & Menu
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
  menuContainer: { position: 'absolute', top: 70, right: 20, backgroundColor: '#FFF', borderRadius: 12, padding: 5, width: 160, elevation: 5 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  menuText: { fontSize: 15, color: '#333' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 2 },

  // Modal Styles
  detailSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '92%', overflow: 'hidden' },
  sheetHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, alignItems: 'center', paddingTop: 10 },
  dragHandle: { width: 40, height: 5, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 5 },
  closeBtnAbsolute: { position: 'absolute', top: 15, right: 15, zIndex: 20 },
  
  carouselContainer: { height: 250 },
  carouselImage: { width: width, height: 250, resizeMode: 'cover' },
  
  sheetContent: { padding: 20 },
  sheetTitle: { fontSize: 26, fontWeight: 'bold', color: '#222', marginBottom: 5 },
  sheetLocation: { fontSize: 16, color: '#717171', textDecorationLine: 'underline' },
  
  hostSection: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  hostAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  hostInitials: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  hostName: { fontWeight: 'bold', fontSize: 16, color: '#222' },
  hostSub: { color: '#717171', fontSize: 13 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statLabel: { fontSize: 14, color: '#222', fontWeight: '500' },
  
  sectionHeader: { fontSize: 20, fontWeight: '700', color: '#222', marginBottom: 12 },
  descriptionText: { fontSize: 16, lineHeight: 24, color: '#484848' },
  
  amenitiesList: { marginTop: 5 },
  amenityItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  amenityText: { fontSize: 16, color: '#484848' },
  
  // Sticky Footer
  stickyFooter: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#E0E0E0', padding: 16, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 10 },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline' },
  footerPrice: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  footerPeriod: { fontSize: 14, color: '#717171' },
  
  footerBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircleBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  
  footerMainBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, minWidth: 120, alignItems: 'center' },
  footerBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Report Modal
  reportModalContainer: { backgroundColor: '#fff', width: '85%', borderRadius: 15, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  modalSub: { fontSize: 14, color: '#666', marginBottom: 15 },
  reportInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 10, height: 100, textAlignVertical: 'top', marginBottom: 15 },
  submitReportBtn: { backgroundColor: '#D32F2F', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  cancelReportBtn: { padding: 10, alignItems: 'center' },
  whiteText: { color: '#fff', fontWeight: 'bold' },
  cancelText: { color: '#666' },
  
  // Profile Modal
  profileModalContainer: { backgroundColor: '#fff', width: '85%', borderRadius: 15, padding: 20, elevation: 5 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 5, color: '#333', marginTop: 10 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  saveProfileBtn: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 20 },

  divider: { height: 1, backgroundColor: '#EEEEEE', marginVertical: 20 },

  // Filter Styles
  filterRow: { marginBottom: 15, height: 42 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22, borderWidth: 1, borderColor: '#e2e8f0', marginRight: 0, elevation: 1 },
  filterBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  filterBtnText: { marginRight: 5, color: '#4a5568', fontWeight: '600', fontSize: 13 },
  filterBtnTextActive: { color: '#FFF' },
  clearFilterBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e53e3e', justifyContent: 'center', alignItems: 'center' },
  
  filterModalContent: { backgroundColor: '#FFF', width: '80%', borderRadius: 15, padding: 20, elevation: 5, maxHeight: '60%' },
  filterModalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#333' },
  filterOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  filterOptionText: { fontSize: 16, color: '#333' },
  filterOptionTextActive: { color: '#2563eb', fontWeight: 'bold' },
  closeFilterModalBtn: { marginTop: 15, alignItems: 'center', padding: 10 },

  // Carousel Arrows & Dots
  carouselArrow: { position: 'absolute', top: '40%', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  dotRow: { flexDirection: 'row', justifyContent: 'center', position: 'absolute', bottom: 10, width: '100%' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)', marginHorizontal: 4 },
  dotActive: { backgroundColor: '#fff', width: 10, height: 10, borderRadius: 5 },
});

export default StudentHomeScreen;