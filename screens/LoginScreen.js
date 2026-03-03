import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useAssets } from 'expo-asset';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { auth } from '../database/firebaseConfig'; // Import Firebase auth client SDK
import { signInWithEmailAndPassword } from 'firebase/auth'; // Import Firebase login function

export default function LoginScreen() {
  const navigation = useNavigation();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [assets, error] = useAssets([require('../assets/logo.png')]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (error) {
    console.error('Error loading assets:', error);
    return null;
  }

  if (!assets || !assets[0]) return null;

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // 1. Basic Input Validations
    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert('Error', 'Email and Password cannot be empty.');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      // 2. Authenticate with Firebase client-side
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      const firebaseUser = userCredential.user;

      // 3. Make API call to our backend to get custom token and user details (with role)
      //    We use the relative path so it uses the baseURL from api.js (which includes /api)
      const response = await api.post('/auth/login', {
        email: trimmedEmail,
        password: trimmedPassword,
      });

      const { token, user } = response.data; // This token is the custom token from our backend

      // 4. Store the custom token and user data for session management
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      setLoading(false);

      // 5. Role-Based Navigation Logic
      if (user.role === 'admin') {
        navigation.navigate('AdminDashboard');
      } else if (user.role === 'landlord') {
        // Check verification status before allowing access to dashboard
        if (user.verificationStatus !== 'verified' || !user.contactVerified) {
          navigation.navigate('LandlordVerification', { user });
        } else {
          navigation.navigate('Landlord'); 
        }
      } else if (user.role === 'student') {
        if (!user.studentVerified) {
          navigation.navigate('StudentVerification', { user });
        } else {
          navigation.navigate('Student');
        }
      } else {
        Alert.alert('Error', 'User role is undefined.');
      }

    } catch (error) {
      setLoading(false);
      console.error('Login Error:', error);
      
      let message = 'Login failed. Please try again.';
      if (error.code && error.code.startsWith('auth/')) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential': // Fallback for general incorrect credentials
          case 'auth/invalid-email':
            message = 'Invalid email or password.';
            break;
          default:
            message = 'Authentication failed. Please check your credentials.';
        }
      } else if (error.response) {
        message = error.response.data.message || message;
      } else if (error.request) {
        message = 'No response from server. Check your network or IP address.';
      } else {
        message = error.message;
      }

      Alert.alert('Login Failed', message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image source={assets[0]} style={styles.logo} />
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <View style={styles.inputContainer}>
          <Icon name="envelope" size={20} color="#007BFF" style={styles.iconmail} />
          <TextInput
            placeholder="Email"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.passwordContainer}>
          <Icon name="lock" size={20} color="#007BFF" style={styles.iconpass} />
          <TextInput
            placeholder="Password"
            secureTextEntry={!passwordVisible}
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} style={styles.eyeIconContainer}>
            <Icon name={passwordVisible ? 'eye' : 'eye-slash'} size={20} color="#007BFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleLogin} style={styles.button} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.signUpLink}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F6F8' },
  card: { backgroundColor: '#ffffff', borderRadius: 20, padding: 30, width: '90%', elevation: 5, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  logo: { width: 100, height: 100, borderRadius: 50, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 5, textAlign: 'center', color: '#333' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderColor: '#ccc', borderWidth: 1, borderRadius: 15, marginBottom: 10, width: '100%', paddingHorizontal: 10 },
  input: { flex: 1, height: 50, paddingLeft: 10 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderColor: '#ccc', borderWidth: 1, borderRadius: 15, width: '100%', marginBottom: 15, paddingHorizontal: 10 },
  passwordInput: { flex: 1, height: 50, paddingLeft: 10 },
  eyeIconContainer: { padding: 5 },
  iconmail: { marginRight: 5 },
  iconpass: { marginRight: 5 },
  button: { backgroundColor: '#007BFF', borderRadius: 25, height: 50, justifyContent: 'center', alignItems: 'center', width: '60%' },
  buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 18 },
  signUpLink: { marginTop: 15, color: '#007BFF', textAlign: 'center' },
});
