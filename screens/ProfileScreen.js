import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { getDatabase, ref, onValue } from 'firebase/database';
import { auth } from '../database/firebaseConfig';
import { signOut } from 'firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const db = getDatabase();
    const userRef = ref(db, `users/${userId}`);

    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUser(data);
      }
    });
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.navigate('Login');
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
                  user.photoURL ||
                  'https://cdn-icons-png.flaticon.com/512/149/149071.png',
              }}
              style={styles.userIcon}
            />
            <View style={styles.nameContainer}>
              <Text style={styles.userName}>{user.username}</Text>
              <Text style={styles.userUsername}>@{user.username}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.userPhone}>{user.phone}</Text>
              <Text style={styles.userRole}>{user.role}</Text>
            </View>
            <View style={styles.statusIndicator} />
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="logout" size={24} color="#fff" />
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
    color: '#007BFF',
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
  logoutButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ff4d4d',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProfileScreen;
