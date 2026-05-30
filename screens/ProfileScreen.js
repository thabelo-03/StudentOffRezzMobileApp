import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      // User details are stored in AsyncStorage at login (backend JWT auth).
      // TODO (remapping phase): fetch full/fresh profile from GET /api/profiles.
      const stored = await AsyncStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    })();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'user']);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) {
      Alert.alert('Error', 'Failed to log out');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      {user ? (
        <>
          <Text style={styles.header}>Profile</Text>
          <View style={styles.userInfoContainer}>
            <Image
              source={{
                uri:
                  user.profilePicture ||
                  'https://cdn-icons-png.flaticon.com/512/149/149071.png',
              }}
              style={styles.userIcon}
            />
            <View style={styles.nameContainer}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userPhone}>{user.phoneNumber}</Text>
              <Text style={styles.userRole}>{user.role}</Text>
            </View>
            <View style={styles.statusIndicator} />
          </View>

          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('Settings')}>
              <Icon name="settings" size={22} color="#2563eb" />
              <Text style={styles.menuRowText}>Settings</Text>
              <Icon name="chevron-right" size={22} color="#A0AEC0" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('Notifications')}>
              <Icon name="notifications-none" size={22} color="#2563eb" />
              <Text style={styles.menuRowText}>Notifications</Text>
              <Icon name="chevron-right" size={22} color="#A0AEC0" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('Help')}>
              <Icon name="help-outline" size={22} color="#2563eb" />
              <Text style={styles.menuRowText}>Help & Support</Text>
              <Icon name="chevron-right" size={22} color="#A0AEC0" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuRow, { borderBottomWidth: 0 }]} onPress={() => navigation.navigate('TermsAndConditions')}>
              <Icon name="description" size={22} color="#2563eb" />
              <Text style={styles.menuRowText}>Terms & Conditions</Text>
              <Icon name="chevron-right" size={22} color="#A0AEC0" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="logout" size={22} color="#fff" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text>Loading user data...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#f7f7f7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  userIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
  },
  nameContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userUsername: {
    fontSize: 14,
    color: '#2563eb',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#888',
  },
  userPhone: {
    fontSize: 14,
    color: '#888',
  },
  userRole: {
    fontSize: 14,
    color: '#888',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'green',
    position: 'absolute',
    right: 16,
    top: 16,
  },
  menuCard: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  menuRowText: { flex: 1, fontSize: 16, color: '#2D3748' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    backgroundColor: '#ff4d4d',
    paddingVertical: 14,
    borderRadius: 12,
  },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default ProfileScreen;
